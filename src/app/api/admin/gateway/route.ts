// ============================================
// PrimeBet - API de Configuração do Gateway
// CRUD para configuração do gateway de pagamentos
// ============================================

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import * as podpayService from "@/services/podpay.service";

interface GatewayCredentials {
  publicKey: string;
  secretKey: string;
  withdrawKey: string;
  [key: string]: string; // Index signature para compatibilidade com Prisma JsonValue
}

interface SaveGatewayBody {
  publicKey: string;
  secretKey: string;
  withdrawKey: string;
  adminPassword: string;
}

// GET - Buscar configuração atual do gateway
export async function GET() {
  try {
    const session = await auth();

    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const gateway = await prisma.gateway.findFirst({
      where: {
        // Usar string literal enquanto aguarda db:push
        type: "PODPAY" as never,
      },
    });

    if (!gateway) {
      return NextResponse.json({
        configured: false,
        gateway: null,
      });
    }

    // Mascarar as credenciais (não retornar valores completos)
    const credentials = gateway.credentials as unknown as GatewayCredentials;

    return NextResponse.json({
      configured: true,
      gateway: {
        id: gateway.id,
        name: gateway.name,
        type: gateway.type,
        active: gateway.active,
        // Retornar apenas indicação de que está configurado
        hasPublicKey: !!credentials?.publicKey,
        hasSecretKey: !!credentials?.secretKey,
        hasWithdrawKey: !!credentials?.withdrawKey,
        // Para edição, retornar os últimos 4 caracteres
        publicKeyPreview: credentials?.publicKey 
          ? `${"*".repeat(Math.max(0, credentials.publicKey.length - 4))}${credentials.publicKey.slice(-4)}`
          : null,
        minDeposit: gateway.minDeposit,
        maxDeposit: gateway.maxDeposit,
        minWithdraw: gateway.minWithdraw,
        maxWithdraw: gateway.maxWithdraw,
        createdAt: gateway.createdAt,
        updatedAt: gateway.updatedAt,
      },
    });
  } catch (error) {
    console.error("[API Gateway] Erro ao buscar:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

// POST - Salvar/Atualizar configuração do gateway
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = (await request.json()) as SaveGatewayBody;

    // Validar campos obrigatórios
    if (!body.publicKey || !body.secretKey || !body.withdrawKey) {
      return NextResponse.json(
        { error: "Todas as chaves são obrigatórias" },
        { status: 400 }
      );
    }

    if (!body.adminPassword) {
      return NextResponse.json(
        { error: "Senha do administrador é obrigatória" },
        { status: 400 }
      );
    }

    // Verificar senha do admin
    const admin = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!admin || !admin.passwordHash) {
      return NextResponse.json(
        { error: "Erro ao verificar credenciais" },
        { status: 400 }
      );
    }

    const passwordValid = await bcrypt.compare(body.adminPassword, admin.passwordHash);

    if (!passwordValid) {
      return NextResponse.json(
        { error: "Senha incorreta" },
        { status: 401 }
      );
    }

    // Preparar credenciais
    const credentials: GatewayCredentials = {
      publicKey: body.publicKey.trim(),
      secretKey: body.secretKey.trim(),
      withdrawKey: body.withdrawKey.trim(),
    };

    // Verificar se já existe um gateway PodPay
    const existingGateway = await prisma.gateway.findFirst({
      where: { type: "PODPAY" as never },
    });

    let gateway;

    if (existingGateway) {
      // Atualizar existente
      gateway = await prisma.gateway.update({
        where: { id: existingGateway.id },
        data: {
          credentials: credentials as unknown as Prisma.InputJsonValue,
          active: true,
          primary: true,
        },
      });
    } else {
      // Criar novo
      gateway = await prisma.gateway.create({
        data: {
          name: "PodPay",
          type: "PODPAY" as never,
          apiUrl: "https://api.podpay.co/v1",
          credentials: credentials as unknown as Prisma.InputJsonValue,
          active: true,
          primary: true,
        },
      });
    }

    // Testar conexão com o gateway
    const testResult = await podpayService.testConnection();

    return NextResponse.json({
      success: true,
      gatewayId: gateway.id,
      connectionTest: testResult,
    });
  } catch (error) {
    console.error("[API Gateway] Erro ao salvar:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

// DELETE - Desativar gateway
export async function DELETE() {
  try {
    const session = await auth();

    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const gateway = await prisma.gateway.findFirst({
      where: { type: "PODPAY" as never },
    });

    if (!gateway) {
      return NextResponse.json({ error: "Gateway não encontrado" }, { status: 404 });
    }

    await prisma.gateway.update({
      where: { id: gateway.id },
      data: { active: false },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API Gateway] Erro ao desativar:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
