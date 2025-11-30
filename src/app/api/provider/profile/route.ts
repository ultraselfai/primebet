import { NextResponse } from 'next/server';
import { getAgentProfile } from '@/lib/services/game-provider';

// GET /api/provider/profile - Perfil do agente no provider
export async function GET() {
  try {
    const profile = await getAgentProfile();
    return NextResponse.json({ success: true, data: profile });
  } catch (error) {
    console.error('[API] Erro ao obter perfil:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Erro interno' },
      { status: 500 }
    );
  }
}
