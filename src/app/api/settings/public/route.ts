import { NextResponse } from "next/server";
import { loadPublicSettings } from "@/lib/settings/load-public-settings";

// Força rota dinâmica - sem cache
export const dynamic = "force-dynamic";
export const revalidate = 0;

// GET - Buscar configurações públicas (para a home da bet)
export async function GET() {
  const publicSettings = await loadPublicSettings();
  
  // Headers para prevenir cache
  return NextResponse.json(publicSettings, {
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      "Pragma": "no-cache",
      "Expires": "0",
    },
  });
}
