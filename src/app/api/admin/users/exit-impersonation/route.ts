import { NextResponse } from "next/server";
import { cookies } from "next/headers";

// GET /api/admin/users/exit-impersonation - Sair da impersonação
export async function GET() {
  try {
    const cookieStore = await cookies();
    
    // Remover cookies de impersonação
    cookieStore.delete("impersonation_token");
    cookieStore.delete("impersonating_user");
    
    // Redirecionar para o admin de usuários
    return NextResponse.redirect(new URL("/users", process.env.NEXTAUTH_URL || "http://localhost:3000"));
  } catch (error) {
    console.error("[API] Erro ao sair da impersonação:", error);
    return NextResponse.json(
      { success: false, error: "Erro ao sair da impersonação" },
      { status: 500 }
    );
  }
}
