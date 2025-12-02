import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Listar documentos KYC
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Não autorizado" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get("status") || "PENDING";

    // Construir filtro
    const where = statusFilter !== "ALL" 
      ? { status: statusFilter as "PENDING" | "APPROVED" | "REJECTED" }
      : {};

    // Buscar documentos
    const documents = await prisma.kycDocument.findMany({
      where,
      include: {
        user: {
          select: {
            name: true,
            email: true,
            cpf: true,
            phone: true,
            playerId: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Buscar estatísticas
    const [pending, approved, rejected] = await Promise.all([
      prisma.kycDocument.count({ where: { status: "PENDING" } }),
      prisma.kycDocument.count({ where: { status: "APPROVED" } }),
      prisma.kycDocument.count({ where: { status: "REJECTED" } }),
    ]);

    return NextResponse.json({
      success: true,
      documents,
      stats: { pending, approved, rejected },
    });
  } catch (error) {
    console.error("Erro ao listar KYC:", error);
    return NextResponse.json(
      { success: false, error: "Erro ao listar documentos KYC" },
      { status: 500 }
    );
  }
}

// PUT - Aprovar ou Rejeitar documento
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Não autorizado" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { documentId, action, reason } = body;

    if (!documentId || !action) {
      return NextResponse.json(
        { success: false, error: "Dados inválidos" },
        { status: 400 }
      );
    }

    if (action === "reject" && !reason) {
      return NextResponse.json(
        { success: false, error: "Motivo da rejeição é obrigatório" },
        { status: 400 }
      );
    }

    // Verificar se documento existe
    const document = await prisma.kycDocument.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      return NextResponse.json(
        { success: false, error: "Documento não encontrado" },
        { status: 404 }
      );
    }

    if (document.status !== "PENDING") {
      return NextResponse.json(
        { success: false, error: "Documento já foi processado" },
        { status: 400 }
      );
    }

    // Atualizar documento
    const updatedDocument = await prisma.kycDocument.update({
      where: { id: documentId },
      data: {
        status: action === "approve" ? "APPROVED" : "REJECTED",
        rejectReason: action === "reject" ? reason : null,
        reviewedAt: new Date(),
        reviewedBy: session.user.id,
      },
    });

    // Se aprovado, atualizar status de verificação do usuário
    if (action === "approve") {
      await prisma.user.update({
        where: { id: document.userId },
        data: { 
          kycStatus: "VERIFIED",
          kycVerifiedAt: new Date(),
        },
      });
    }

    return NextResponse.json({
      success: true,
      document: updatedDocument,
    });
  } catch (error) {
    console.error("Erro ao processar KYC:", error);
    return NextResponse.json(
      { success: false, error: "Erro ao processar documento KYC" },
      { status: 500 }
    );
  }
}
