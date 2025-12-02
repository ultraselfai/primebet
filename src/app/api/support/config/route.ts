import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Buscar configuração de suporte (ou criar padrão)
    let config = await prisma.supportConfig.findFirst();

    if (!config) {
      config = await prisma.supportConfig.create({
        data: {
          whatsappNumber: null,
          whatsappEnabled: false,
          telegramUser: null,
          telegramEnabled: false,
        },
      });
    }

    return NextResponse.json({
      success: true,
      config: {
        whatsappNumber: config.whatsappNumber,
        whatsappEnabled: config.whatsappEnabled,
        telegramUser: config.telegramUser,
        telegramEnabled: config.telegramEnabled,
      },
    });
  } catch (error) {
    console.error("Erro ao buscar configuração de suporte:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
