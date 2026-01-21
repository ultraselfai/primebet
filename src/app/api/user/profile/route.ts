import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Buscar perfil do usuário
export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        cpf: true,
        playerId: true,
        kycStatus: true,
        role: true,
        createdAt: true,
        avatar: {
          select: { imageUrl: true }
        }
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      user: {
        ...user,
        avatarUrl: user.avatar?.imageUrl,
      },
    });
  } catch (error) {
    console.error("Erro ao buscar perfil:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

// PUT - Atualizar perfil do usuário
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { name, phone } = body;

    // Validar telefone se fornecido
    if (phone) {
      const phoneClean = phone.replace(/\D/g, "");
      if (phoneClean.length < 10 || phoneClean.length > 11) {
        return NextResponse.json(
          { error: "Telefone inválido" },
          { status: 400 }
        );
      }

      // Verificar se telefone já está em uso por outro usuário
      const existingPhone = await prisma.user.findFirst({
        where: {
          phone: phoneClean,
          NOT: { id: session.user.id },
        },
      });

      if (existingPhone) {
        return NextResponse.json(
          { error: "Este telefone já está em uso" },
          { status: 400 }
        );
      }
    }

    // Atualizar usuário
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        ...(name && { name }),
        ...(phone && { phone: phone.replace(/\D/g, "") }),
      },
      select: {
        id: true,
        name: true,
        phone: true,
      },
    });

    return NextResponse.json({
      success: true,
      user: updatedUser,
    });
  } catch (error) {
    console.error("Erro ao atualizar perfil:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
