import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST - Criar/atualizar subscrição push
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Não autenticado" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { subscription } = body;

    if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
      return NextResponse.json(
        { success: false, error: "Dados de subscrição inválidos" },
        { status: 400 }
      );
    }

    // Upsert da subscrição
    await prisma.userPushSubscription.upsert({
      where: {
        userId_endpoint: {
          userId: session.user.id,
          endpoint: subscription.endpoint,
        },
      },
      update: {
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        enabled: true,
      },
      create: {
        userId: session.user.id,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        enabled: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Notificações push ativadas",
    });
  } catch (error) {
    console.error("Erro ao salvar subscrição push:", error);
    return NextResponse.json(
      { success: false, error: "Erro ao salvar subscrição" },
      { status: 500 }
    );
  }
}

// DELETE - Remover subscrição push
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Não autenticado" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { endpoint } = body;

    if (!endpoint) {
      return NextResponse.json(
        { success: false, error: "Endpoint é obrigatório" },
        { status: 400 }
      );
    }

    // Deletar subscrição
    await prisma.userPushSubscription.delete({
      where: {
        userId_endpoint: {
          userId: session.user.id,
          endpoint: endpoint,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Notificações push desativadas",
    });
  } catch (error) {
    console.error("Erro ao remover subscrição push:", error);
    return NextResponse.json(
      { success: false, error: "Erro ao remover subscrição" },
      { status: 500 }
    );
  }
}

// GET - Verificar se usuário tem subscrição ativa
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Não autenticado" },
        { status: 401 }
      );
    }

    const subscription = await prisma.userPushSubscription.findFirst({
      where: {
        userId: session.user.id,
        enabled: true,
      },
    });

    return NextResponse.json({
      success: true,
      enabled: !!subscription,
    });
  } catch (error) {
    console.error("Erro ao verificar subscrição push:", error);
    return NextResponse.json(
      { success: false, error: "Erro ao verificar subscrição" },
      { status: 500 }
    );
  }
}
