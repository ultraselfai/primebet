import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const config = await prisma.supportConfig.findFirst();

    return NextResponse.json({
      success: true,
      content: config?.privacyContent || null,
    });
  } catch (error) {
    console.error("Erro ao buscar política de privacidade:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
