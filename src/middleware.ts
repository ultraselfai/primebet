import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// Domínios configurados
const CONSOLE_DOMAIN = "console.primebet.space";
const PUBLIC_DOMAIN = "primebet.space";

export async function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  const hostname = request.headers.get("host") || "";
  const isConsoleDomain = hostname.includes("console.");
  const isPublicDomain = hostname.includes(PUBLIC_DOMAIN) && !isConsoleDomain;
  const secureCookie = request.nextUrl.protocol === "https:";

  // Ignorar arquivos estáticos
  if (
    pathname.startsWith("/_next") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Permitir API routes
  if (pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  // Obter token JWT
  const token = await getToken({ 
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
    secureCookie,
  });

  // ========== ROTEAMENTO POR DOMÍNIO ==========
  
  // Se está no domínio CONSOLE (admin)
  if (isConsoleDomain) {
    // Rota raiz do console redireciona para dashboard ou login
    if (pathname === "/") {
      if (token && (token.role === "ADMIN" || token.role === "SUPER_ADMIN")) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }

    // Bloquear rotas da bet no console (exceto login admin)
    const betRoutes = ["/cassino", "/crash", "/slots", "/ao-vivo", "/carteira", "/depositar", "/sacar", "/perfil", "/login", "/cadastro"];
    if (betRoutes.some(route => pathname.startsWith(route)) || pathname.startsWith("/games/") || pathname.startsWith("/provedor/")) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    // Página de login do admin
    if (pathname === "/admin/login") {
      if (token && (token.role === "ADMIN" || token.role === "SUPER_ADMIN")) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
      return NextResponse.next();
    }

    // Proteger rotas admin no console
    const adminRoutes = ["/dashboard", "/usuarios", "/configuracoes", "/financeiro", "/jogos", "/integracoes", "/aprovacoes", "/relatorios", "/gerenciar-promocoes", "/associados", "/editor"];
    if (adminRoutes.some(route => pathname.startsWith(route))) {
      if (!token) {
        return NextResponse.redirect(new URL("/admin/login", request.url));
      }
      if (token.role !== "ADMIN" && token.role !== "SUPER_ADMIN") {
        return NextResponse.redirect(new URL("/admin/login", request.url));
      }
    }

    return NextResponse.next();
  }
  
  // Se está no domínio PÚBLICO (bet)
  if (isPublicDomain) {
    // Bloquear acesso a rotas admin no domínio público
    const adminRoutes = ["/dashboard", "/admin", "/usuarios", "/configuracoes", "/financeiro", "/jogos", "/integracoes", "/aprovacoes", "/relatorios", "/gerenciar-promocoes", "/associados", "/editor"];
    
    if (adminRoutes.some(route => pathname.startsWith(route))) {
      // Redireciona para o console correto
      return NextResponse.redirect(new URL(pathname, `https://${CONSOLE_DOMAIN}`));
    }

    // Rotas protegidas do usuário (carteira, perfil, depositar, sacar, etc)
    const userProtectedRoutes = ["/carteira", "/perfil", "/depositar", "/sacar", "/transferir"];
    if (userProtectedRoutes.some(route => pathname.startsWith(route))) {
      if (!token) {
        return NextResponse.redirect(new URL(`/?auth=login`, request.url));
      }
    }

    // /login e /cadastro redirecionam para home com modal
    if (pathname === "/login") {
      if (token) return NextResponse.redirect(new URL("/", request.url));
      return NextResponse.redirect(new URL("/?auth=login", request.url));
    }
    if (pathname === "/cadastro") {
      if (token) return NextResponse.redirect(new URL("/", request.url));
      return NextResponse.redirect(new URL("/?auth=register", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public).*)"],
};
