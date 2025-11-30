import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";

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

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: gameId } = await params;
    console.log("[API /api/games/[id]] Buscando jogo:", gameId);

    let gamesConfig: Record<string, GameConfig> = {};
    try {
      const data = await readFile(GAMES_CONFIG_FILE, "utf-8");
      gamesConfig = JSON.parse(data);
    } catch (err) {
      console.log("[API] Config nao existe");
    }

    const config = gamesConfig[gameId];
    
    const game = {
      id: gameId,
      name: config?.customName || gameId,
      thumbnail: config?.customThumbnail || "/placeholder-game.png",
      provider: config?.displayProvider || "PGSoft",
      category: config?.category || "Slots",
      rtp: 96.5,
      volatility: "medium",
      minBet: 0.2,
      maxBet: 500,
      isHot: config?.isHot || false,
      enabled: config?.enabled ?? true,
    };

    return NextResponse.json({ success: true, game });
  } catch (error) {
    console.error("[API] Erro:", error);
    return NextResponse.json({ success: false, error: "Erro interno" }, { status: 500 });
  }
}