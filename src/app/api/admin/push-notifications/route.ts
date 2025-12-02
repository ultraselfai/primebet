import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import webpush from "web-push";

// Configurar VAPID keys (em produção, use variáveis de ambiente)
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    "mailto:admin@primebet.com",
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

// GET - Listar notificações enviadas
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
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");

    const [notifications, total] = await Promise.all([
      prisma.pushNotification.findMany({
        take: limit,
        skip: offset,
        orderBy: { createdAt: "desc" },
      }),
      prisma.pushNotification.count(),
    ]);

    // Contar subscrições ativas
    const activeSubscriptions = await prisma.userPushSubscription.count({
      where: { enabled: true },
    });

    return NextResponse.json({
      success: true,
      notifications,
      total,
      activeSubscriptions,
    });
  } catch (error) {
    console.error("Erro ao listar notificações:", error);
    return NextResponse.json(
      { success: false, error: "Erro ao listar notificações" },
      { status: 500 }
    );
  }
}

// POST - Criar e enviar notificação
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Não autorizado" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { title, body: notificationBody, bannerUrl, linkUrl, targetType, targetUsers } = body;

    if (!title || !notificationBody) {
      return NextResponse.json(
        { success: false, error: "Título e mensagem são obrigatórios" },
        { status: 400 }
      );
    }

    // Criar notificação no banco
    const notification = await prisma.pushNotification.create({
      data: {
        title,
        body: notificationBody,
        bannerUrl,
        linkUrl,
        targetType: targetType || "ALL",
        targetUsers: targetUsers || [],
        sentBy: session.user.id,
        sentAt: new Date(),
      },
    });

    // Buscar subscrições para enviar
    let subscriptions;
    
    if (targetType === "SPECIFIC" && targetUsers?.length > 0) {
      subscriptions = await prisma.userPushSubscription.findMany({
        where: {
          enabled: true,
          userId: { in: targetUsers },
        },
      });
    } else {
      subscriptions = await prisma.userPushSubscription.findMany({
        where: { enabled: true },
      });
    }

    // Enviar notificações
    const payload = JSON.stringify({
      title,
      body: notificationBody,
      icon: "/favicon/android-chrome-192x192.png",
      badge: "/favicon/android-chrome-96x96.png",
      image: bannerUrl || undefined,
      data: {
        url: linkUrl || "/",
        notificationId: notification.id,
      },
    });

    let sentCount = 0;
    let failedCount = 0;

    for (const sub of subscriptions) {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
          },
          payload
        );
        sentCount++;
      } catch (error: unknown) {
        const pushError = error as { statusCode?: number };
        failedCount++;
        
        // Se o endpoint não é mais válido, desativar
        if (pushError.statusCode === 410 || pushError.statusCode === 404) {
          await prisma.userPushSubscription.update({
            where: { id: sub.id },
            data: { enabled: false },
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      notification,
      stats: {
        sent: sentCount,
        failed: failedCount,
        total: subscriptions.length,
      },
    });
  } catch (error) {
    console.error("Erro ao enviar notificação:", error);
    return NextResponse.json(
      { success: false, error: "Erro ao enviar notificação" },
      { status: 500 }
    );
  }
}

// DELETE - Excluir notificação
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Não autorizado" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const notificationId = searchParams.get("id");

    if (!notificationId) {
      return NextResponse.json(
        { success: false, error: "ID da notificação é obrigatório" },
        { status: 400 }
      );
    }

    await prisma.pushNotification.delete({
      where: { id: notificationId },
    });

    return NextResponse.json({
      success: true,
      message: "Notificação excluída",
    });
  } catch (error) {
    console.error("Erro ao excluir notificação:", error);
    return NextResponse.json(
      { success: false, error: "Erro ao excluir notificação" },
      { status: 500 }
    );
  }
}
