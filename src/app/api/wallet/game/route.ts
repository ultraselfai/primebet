import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { getBalanceFromCache, setBalanceInCache, CACHE_TTL } from "@/lib/balance-cache";

// Função OTIMIZADA para obter o ID do usuário
async function getCurrentUserId(): Promise<string | null> {
  // Verificar impersonação primeiro (mais rápido que auth())
  const cookieStore = await cookies();
  const impersonationToken = cookieStore.get("impersonation_token");
  
  if (impersonationToken?.value) {
    try {
      // Decodificar JWT manualmente (mais rápido que jwtVerify para validação simples)
      const parts = impersonationToken.value.split(".");
      if (parts.length === 3) {
        const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString());
        if (payload.userId && typeof payload.userId === "string") {
          return payload.userId;
        }
      }
    } catch {
      // Token inválido, continuar para auth normal
    }
  }
  
  // Sessão normal (NextAuth v5)
  const session = await auth();
  return session?.user?.id || null;
}

// GET /api/wallet/game - Retorna saldo da carteira de jogos do usuário
export async function GET() {
  try {
    const userId = await getCurrentUserId();
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Não autorizado" },
        { status: 401 }
      );
    }

    // Verificar cache primeiro
    const cached = getBalanceFromCache(userId);
    const now = Date.now();
    
    if (cached && (now - cached.timestamp) < CACHE_TTL) {
      return NextResponse.json({
        success: true,
        data: { balance: cached.balance },
      }, {
        headers: {
          "Cache-Control": "private, max-age=5",
        },
      });
    }

    // Query otimizada - só busca o saldo
    const wallet = await prisma.walletGame.findUnique({
      where: { userId },
      select: { balance: true },
    });

    const balance = wallet ? Number(wallet.balance) : 0;
    
    // Se não existe wallet, criar em background (não bloqueia resposta)
    if (!wallet) {
      // Fire-and-forget - não esperamos a criação
      prisma.walletGame.create({
        data: { userId, balance: 0 },
      }).catch(() => {}); // Ignora erro se já existir
    }
    
    // Atualizar cache
    setBalanceInCache(userId, balance);

    return NextResponse.json({
      success: true,
      data: { balance },
    }, {
      headers: {
        "Cache-Control": "private, max-age=5",
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Erro interno" },
      { status: 500 }
    );
  }
}
