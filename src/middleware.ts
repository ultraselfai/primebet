import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // Ignorar arquivos estáticos e API routes do NextAuth
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Permitir preview do editor (iframe interno do admin)
  const isPreviewMode = searchParams.get("preview") === "true";
  if (isPreviewMode) {
    // Verificar se quem está acessando é um admin (pelo referer ou cookie)
    const token = await getToken({ 
      req: request,
      secret: process.env.NEXTAUTH_SECRET 
    });
    
    // Se é admin, permite o preview sem bloqueio
    if (token && (token.role === "ADMIN" || token.role === "SUPER_ADMIN")) {
      return NextResponse.next();
    }
  }

  // Obter token JWT (funciona no Edge)
  const token = await getToken({ 
    req: request,
    secret: process.env.NEXTAUTH_SECRET 
  });

  // Permitir acesso à página de login do admin
  if (pathname === "/admin/login") {
    // Se já está logado como admin, redireciona pro dashboard
    if (token && (token.role === "ADMIN" || token.role === "SUPER_ADMIN")) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }

  // Verificar rotas do admin/dashboard
  const adminRoutes = [
    "/dashboard",
    "/users",
    "/settings",
    "/financeiro",
    "/jogos",
    "/integracoes",
    "/banking",
    "/editor",
    "/calendar",
    "/chat",
    "/mail",
    "/tasks",
    "/pricing",
    "/faqs"
  ];
  
  const isAdminRoute = adminRoutes.some(route => pathname.startsWith(route)) ||
                       (pathname.startsWith("/admin") && pathname !== "/admin/login");

  if (isAdminRoute) {
    if (!token) {
      return NextResponse.redirect(new URL("/admin/login?callbackUrl=" + pathname, request.url));
    }

    // Verificar se é admin
    if (token.role !== "ADMIN" && token.role !== "SUPER_ADMIN") {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  // Rotas protegidas do usuário (carteira, perfil, depositar, sacar, etc)
  const userProtectedRoutes = ["/carteira", "/perfil", "/depositar", "/sacar", "/transferir"];
  if (userProtectedRoutes.some((route) => pathname.startsWith(route))) {
    if (!token) {
      return NextResponse.redirect(new URL(`/login?callbackUrl=${pathname}`, request.url));
    }
  }

  // Se logado como ADMIN e tentando acessar login público, redirecionar para dashboard
  if (token && (pathname === "/sign-in")) {
    if (token.role === "ADMIN" || token.role === "SUPER_ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    // Usuário normal logado, redireciona pra home
    return NextResponse.redirect(new URL("/", request.url));
  }

  // /login e /cadastro são páginas que redirecionam para /?auth=xxx
  // Deixar passar normalmente
  if (pathname === "/login" || pathname === "/cadastro") {
    if (token) {
      // Se já está logado, redireciona direto para home
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public|api/auth).*)"],
};
