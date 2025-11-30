import { NextResponse } from 'next/server';
import { getGames } from '@/lib/services/game-provider';

// GET /api/provider/games - Lista jogos do provider real
export async function GET() {
  try {
    const games = await getGames();
    return NextResponse.json({ success: true, data: games });
  } catch (error) {
    console.error('[API] Erro ao listar jogos:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Erro interno' },
      { status: 500 }
    );
  }
}
