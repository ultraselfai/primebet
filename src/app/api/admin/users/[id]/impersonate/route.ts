import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'
import { SignJWT } from 'jose'

interface RouteParams {
  params: Promise<{ id: string }>
}

// POST - Gerar token para impersonar usuário
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params

    // Buscar usuário
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        walletGame: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    // Gerar token de impersonação usando jose
    const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || 'primebet-secret-key')
    
    const impersonationToken = await new SignJWT({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      isImpersonation: true,
      impersonatedBy: 'admin', // TODO: pegar ID do admin logado
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('4h')
      .sign(secret)

    // Setar cookie de impersonação
    const cookieStore = await cookies()
    cookieStore.set('impersonation_token', impersonationToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 4, // 4 horas
      path: '/',
    })

    // Também setar um cookie visível para o frontend saber que está impersonando
    cookieStore.set('impersonating_user', JSON.stringify({
      id: user.id,
      name: user.name,
      email: user.email,
    }), {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 4,
      path: '/',
    })

    return NextResponse.json({
      success: true,
      data: {
        userId: user.id,
        name: user.name,
        email: user.email,
        redirectUrl: '/', // Redirecionar para a home da bet
      },
      message: `Você está agora logado como ${user.name}`,
    })
  } catch (error) {
    console.error('Erro ao impersonar usuário:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao impersonar usuário' },
      { status: 500 }
    )
  }
}

// DELETE - Encerrar impersonação
export async function DELETE() {
  try {
    const cookieStore = await cookies()
    
    cookieStore.delete('impersonation_token')
    cookieStore.delete('impersonating_user')

    return NextResponse.json({
      success: true,
      message: 'Impersonação encerrada',
      redirectUrl: '/users',
    })
  } catch (error) {
    console.error('Erro ao encerrar impersonação:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao encerrar impersonação' },
      { status: 500 }
    )
  }
}
