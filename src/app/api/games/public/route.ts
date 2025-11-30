import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { getGames, GameProviderGame } from "@/lib/services/game-provider";

// Arquivo de configurações de jogos
const GAMES_CONFIG_FILE = path.join(process.cwd(), "games-config.json");

interface GameConfig {
  gameCode: string;
  customName?: string;
  customThumbnail?: string;
  displayProvider?: string;
  category: string;
  tags: string[];
  enabled: boolean;
  isHot: boolean;
}

interface PublicGame {
  id: string;
  name: string;
  thumbnail: string;
  provider: string;
  category: string;
  isHot: boolean;
  isNew?: boolean;
  tags: string[];
}

// GET - Buscar jogos HABILITADOS para exibir na bet (público)
export async function GET() {
  try {
    // 1. Buscar jogos do provider
    let providerGames: GameProviderGame[] = [];
    try {
      providerGames = await getGames();
    } catch (error) {
      console.error("[API] Erro ao buscar jogos do provider:", error);
      return NextResponse.json({ 
        success: false, 
        error: "Erro ao conectar com o provider" 
      }, { status: 500 });
    }

    // 2. Buscar configurações locais
    let gamesConfig: Record<string, GameConfig> = {};
    try {
      const data = await readFile(GAMES_CONFIG_FILE, "utf-8");
      gamesConfig = JSON.parse(data);
    } catch {
      // Arquivo não existe - nenhum jogo configurado ainda
    }

    // 3. Mesclar e filtrar apenas jogos HABILITADOS
    const enabledGames: PublicGame[] = providerGames
      .filter((game) => {
        const config = gamesConfig[game.gameCode];
        // Só retorna jogos que foram explicitamente habilitados
        return config?.enabled === true;
      })
      .map((game) => {
        const config = gamesConfig[game.gameCode];
        // Nome: usa customName se tiver conteúdo, senão usa nome do provider, senão usa o código
        const gameName = (config?.customName && config.customName.trim()) 
          ? config.customName 
          : (game.name || game.gameCode || "Jogo sem nome");
        
        return {
          id: game.gameCode,
          name: gameName,
          thumbnail: config?.customThumbnail || game.thumbnail || "/placeholder-game.png",
          provider: config?.displayProvider || "", // Vazio se não configurado (não mostrar nada)
          category: config?.category || "Slots",
          isHot: config?.isHot || false,
          tags: config?.tags || [],
        };
      });

    return NextResponse.json({ 
      success: true, 
      games: enabledGames,
      total: enabledGames.length,
    });

  } catch (error) {
    console.error("[API] Erro geral:", error);
    return NextResponse.json(
      { success: false, error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
