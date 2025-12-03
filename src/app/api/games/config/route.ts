import { NextRequest, NextResponse } from "next/server";
import { readFile, writeFile } from "fs/promises";
import path from "path";
import { auth } from "@/lib/auth";

// Arquivo de configurações de jogos (em produção seria no banco)
const GAMES_CONFIG_FILE = path.join(process.cwd(), "games-config.json");

export interface GameConfig {
  gameCode: string;
  customName?: string;
  customThumbnail?: string;
  category: string;
  tags: string[];
  enabled: boolean;
  isHot: boolean;
}

// GET - Buscar configurações de jogos
export async function GET() {
  try {
    const data = await readFile(GAMES_CONFIG_FILE, "utf-8");
    const config: Record<string, GameConfig> = JSON.parse(data);
    return NextResponse.json({ success: true, data: config });
  } catch {
    // Se o arquivo não existe, retorna objeto vazio
    return NextResponse.json({ success: true, data: {} });
  }
}

// POST - Salvar configuração de um jogo
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação - apenas admins podem configurar jogos
    const session = await auth();
    if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
      return NextResponse.json(
        { success: false, error: "Não autorizado" },
        { status: 401 }
      );
    }

    const gameConfig: GameConfig = await request.json();
    
    // Ler configurações existentes
    let existingConfig: Record<string, GameConfig> = {};
    try {
      const data = await readFile(GAMES_CONFIG_FILE, "utf-8");
      existingConfig = JSON.parse(data);
    } catch {
      // Arquivo não existe ainda
    }
    
    // Atualizar configuração do jogo específico
    existingConfig[gameConfig.gameCode] = gameConfig;
    
    // Salvar
    await writeFile(GAMES_CONFIG_FILE, JSON.stringify(existingConfig, null, 2));
    
    return NextResponse.json({ 
      success: true, 
      message: "Configuração salva com sucesso" 
    });
  } catch (error) {
    console.error("Erro ao salvar configuração de jogo:", error);
    return NextResponse.json(
      { success: false, error: "Erro ao salvar configuração" },
      { status: 500 }
    );
  }
}

// PUT - Salvar todas as configurações de jogos (bulk)
export async function PUT(request: NextRequest) {
  try {
    // Verificar autenticação - apenas admins podem configurar jogos
    const session = await auth();
    if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
      return NextResponse.json(
        { success: false, error: "Não autorizado" },
        { status: 401 }
      );
    }

    const allConfigs: Record<string, GameConfig> = await request.json();
    
    await writeFile(GAMES_CONFIG_FILE, JSON.stringify(allConfigs, null, 2));
    
    return NextResponse.json({ 
      success: true, 
      message: "Todas as configurações salvas" 
    });
  } catch (error) {
    console.error("Erro ao salvar configurações:", error);
    return NextResponse.json(
      { success: false, error: "Erro ao salvar configurações" },
      { status: 500 }
    );
  }
}
