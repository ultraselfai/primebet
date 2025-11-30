import { NextRequest, NextResponse } from 'next/server';
import { createGameSession } from '@/lib/services/game-provider';

interface RouteParams {
  params: Promise<{ gameId: string }>;
}

// POST /api/provider/games/[gameId]/launch - Abre um jogo
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    // Parsear body e params em paralelo
    const [{ gameId }, body] = await Promise.all([
      params,
      request.json().catch(() => ({}))
    ]);
    
    const { userId, playerBalance, mode, returnUrl } = body;

    // Validar campos obrigatórios
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId é obrigatório' },
        { status: 400 }
      );
    }

    // Criar sessão no provider
    const session = await createGameSession({
      userId,
      gameId,
      playerBalance: playerBalance || 1000,
      mode: mode || 'DEMO',
      returnUrl: returnUrl || process.env.NEXT_PUBLIC_APP_URL,
    });

    return NextResponse.json({
      success: true,
      data: {
        gameUrl: session.gameUrl,
        sessionToken: session.sessionToken,
        expiresAt: session.expiresAt,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Erro ao abrir jogo' },
      { status: 500 }
    );
  }
}
