import { NextResponse } from "next/server";
import { loadPublicSettings } from "@/lib/settings/load-public-settings";

// GET - Buscar configurações públicas (para a home da bet)
export async function GET() {
  const publicSettings = await loadPublicSettings();
  return NextResponse.json(publicSettings);
}
