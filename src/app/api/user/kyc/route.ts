import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Buscar status KYC do usuário
export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { kycStatus: true },
    });

    // Buscar último documento enviado
    const document = await prisma.kycDocument.findFirst({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        documentType: true,
        selfieUrl: true,
        status: true,
        rejectReason: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      kycStatus: user?.kycStatus || "PENDING",
      document,
    });
  } catch (error) {
    console.error("Erro ao buscar KYC:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

// POST - Enviar documento para verificação
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { selfieUrl, documentType } = body;

    if (!selfieUrl) {
      return NextResponse.json(
        { error: "URL da imagem é obrigatória" },
        { status: 400 }
      );
    }

    if (!["RG", "CPF", "CNH"].includes(documentType)) {
      return NextResponse.json(
        { error: "Tipo de documento inválido" },
        { status: 400 }
      );
    }

    // Criar registro do documento
    const document = await prisma.kycDocument.create({
      data: {
        userId: session.user.id,
        documentType: documentType as "RG" | "CPF" | "CNH",
        selfieUrl,
        status: "PENDING",
      },
    });

    // Atualizar status KYC do usuário
    await prisma.user.update({
      where: { id: session.user.id },
      data: { kycStatus: "SUBMITTED" },
    });

    return NextResponse.json({
      success: true,
      document,
    });
  } catch (error) {
    console.error("Erro ao enviar documento KYC:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
