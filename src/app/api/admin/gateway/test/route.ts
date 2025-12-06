// ============================================
// PrimeBet - Test PodPay Gateway API
// Testa conexão e credenciais do gateway
// ============================================

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getBalance } from "@/services/podpay.service";

export async function GET() {
  try {
    const session = await auth();

    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Testar conexão buscando o saldo
    const result = await getBalance();

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.error,
        message: "Falha ao conectar com PodPay. Verifique as credenciais.",
      });
    }

    return NextResponse.json({
      success: true,
      message: "Conexão com PodPay estabelecida com sucesso!",
      balance: result.balance,
    });
  } catch (error) {
    console.error("[Gateway Test] Erro:", error);
    return NextResponse.json(
      { success: false, error: "Erro ao testar gateway" },
      { status: 500 }
    );
  }
}
