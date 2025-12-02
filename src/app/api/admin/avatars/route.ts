import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Listar todos os avatares
export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const avatars = await prisma.avatar.findMany({
      orderBy: { createdAt: "asc" },
      include: {
        _count: {
          select: { users: true }
        }
      }
    });

    return NextResponse.json({ avatars });
  } catch (error) {
    console.error("Erro ao buscar avatares:", error);
    return NextResponse.json({ error: "Erro ao buscar avatares" }, { status: 500 });
  }
}

// POST - Criar novo avatar
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { imageUrl, name } = await request.json();

    if (!imageUrl) {
      return NextResponse.json({ error: "URL da imagem é obrigatória" }, { status: 400 });
    }

    const avatar = await prisma.avatar.create({
      data: {
        imageUrl,
        name: name || null,
        isActive: true,
      },
    });

    return NextResponse.json({ avatar });
  } catch (error) {
    console.error("Erro ao criar avatar:", error);
    return NextResponse.json({ error: "Erro ao criar avatar" }, { status: 500 });
  }
}

// DELETE - Deletar avatar
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID do avatar é obrigatório" }, { status: 400 });
    }

    // Verificar se há usuários usando este avatar
    const usersWithAvatar = await prisma.user.count({
      where: { avatarId: id }
    });

    if (usersWithAvatar > 0) {
      // Apenas desativar ao invés de deletar
      await prisma.avatar.update({
        where: { id },
        data: { isActive: false }
      });
      return NextResponse.json({ message: "Avatar desativado (em uso por usuários)" });
    }

    await prisma.avatar.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Avatar deletado com sucesso" });
  } catch (error) {
    console.error("Erro ao deletar avatar:", error);
    return NextResponse.json({ error: "Erro ao deletar avatar" }, { status: 500 });
  }
}
