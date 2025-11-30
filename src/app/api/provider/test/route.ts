import { NextResponse } from 'next/server';
import { testConnection } from '@/lib/services/game-provider';

// GET /api/provider/test - Testa conexão com o provider
export async function GET() {
  try {
    const result = await testConnection();
    return NextResponse.json(result);
  } catch (error) {
    console.error('[API] Erro ao testar conexão:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno' },
      { status: 500 }
    );
  }
}
