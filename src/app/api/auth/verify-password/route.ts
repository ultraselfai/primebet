import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// POST - Verificar senha do usuário logado
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Não autenticado" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { password } = body;

    if (!password) {
      return NextResponse.json(
        { success: false, error: "Senha é obrigatória" },
        { status: 400 }
      );
    }

    // Buscar usuário com hash da senha
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { passwordHash: true },
    });

    if (!user?.passwordHash) {
      return NextResponse.json(
        { success: false, error: "Usuário não encontrado ou sem senha definida" },
        { status: 404 }
      );
    }

    // Verificar senha
    const isValid = await bcrypt.compare(password, user.passwordHash);

    if (!isValid) {
      return NextResponse.json(
        { success: false, error: "Senha incorreta" },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Senha verificada com sucesso",
    });
  } catch (error) {
    console.error("Erro ao verificar senha:", error);
    return NextResponse.json(
      { success: false, error: "Erro ao verificar senha" },
      { status: 500 }
    );
  }
}
