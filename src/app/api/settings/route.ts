import { NextRequest, NextResponse } from "next/server";
import { readFile, writeFile } from "fs/promises";
import path from "path";
import { defaultExperience, defaultSettings } from "@/lib/settings/defaults";

// Arquivo de configurações (em produção seria no banco de dados)
const SETTINGS_FILE = path.join(process.cwd(), "settings.json");

const withExperienceDefaults = (settings: Record<string, unknown>) => {
  if (settings.experience) {
    return settings;
  }

  return {
    ...settings,
    experience: defaultExperience,
  };
};

const mergeSettings = <T extends Record<string, unknown>>(defaults: T, overrides?: Record<string, unknown>): T => {
  if (!overrides) {
    return defaults;
  }

  const result: Record<string, unknown> = { ...defaults };

  Object.entries(overrides).forEach(([key, value]) => {
    const defaultValue = result[key];

    if (Array.isArray(defaultValue) || Array.isArray(value)) {
      result[key] = value ?? defaultValue;
      return;
    }

    if (
      typeof defaultValue === "object" &&
      defaultValue !== null &&
      typeof value === "object" &&
      value !== null
    ) {
      result[key] = mergeSettings(defaultValue as Record<string, unknown>, value as Record<string, unknown>);
      return;
    }

    if (value !== undefined) {
      result[key] = value;
    }
  });

  return result as T;
};

// GET - Buscar configurações
export async function GET() {
  try {
    const data = await readFile(SETTINGS_FILE, "utf-8");
    const parsed = withExperienceDefaults(JSON.parse(data));
    const settings = mergeSettings(defaultSettings, parsed);
    settings.experience = mergeSettings(defaultExperience, parsed.experience as Record<string, unknown>);
    return NextResponse.json(settings);
  } catch {
    // Se o arquivo não existe, retorna configurações padrão
    return NextResponse.json({
      ...defaultSettings,
      experience: defaultExperience,
    });
  }
}

// POST - Salvar configurações
export async function POST(request: NextRequest) {
  try {
    const settings = await request.json();
    
    const payload = mergeSettings(defaultSettings, withExperienceDefaults(settings));
    payload.experience = mergeSettings(
      defaultExperience,
      (settings as Record<string, unknown>).experience as Record<string, unknown>
    );

    await writeFile(SETTINGS_FILE, JSON.stringify(payload, null, 2));
    
    return NextResponse.json({ 
      success: true, 
      message: "Configurações salvas com sucesso" 
    });
  } catch (error) {
    console.error("Erro ao salvar configurações:", error);
    return NextResponse.json(
      { success: false, error: "Erro ao salvar configurações" },
      { status: 500 }
    );
  }
}
