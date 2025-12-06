import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { defaultExperience, defaultSettings } from "@/lib/settings/defaults";
import { auth } from "@/lib/auth";

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

// GET - Buscar configurações do banco de dados
export async function GET() {
  try {
    const record = await prisma.siteSettings.findUnique({
      where: { id: "default" },
    });

    if (!record) {
      // Se não existe no banco, retorna configurações padrão
      return NextResponse.json({
        ...defaultSettings,
        experience: defaultExperience,
      });
    }

    const parsed = withExperienceDefaults(record.data as Record<string, unknown>);
    const settings = mergeSettings(defaultSettings, parsed);
    settings.experience = mergeSettings(defaultExperience, parsed.experience as Record<string, unknown>);
    
    return NextResponse.json(settings);
  } catch (error) {
    console.error("[Settings API] Erro ao buscar:", error);
    // Em caso de erro, retorna configurações padrão
    return NextResponse.json({
      ...defaultSettings,
      experience: defaultExperience,
    });
  }
}

// POST - Salvar configurações no banco de dados
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação - apenas admins podem salvar
    const session = await auth();
    if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
      return NextResponse.json(
        { success: false, error: "Não autorizado" },
        { status: 401 }
      );
    }

    const settings = await request.json();
    
    const payload = mergeSettings(defaultSettings, withExperienceDefaults(settings));
    payload.experience = mergeSettings(
      defaultExperience,
      (settings as Record<string, unknown>).experience as Record<string, unknown>
    );

    // Upsert - cria se não existe, atualiza se existe
    await prisma.siteSettings.upsert({
      where: { id: "default" },
      update: { data: payload },
      create: { id: "default", data: payload },
    });
    
    return NextResponse.json({ 
      success: true, 
      message: "Configurações salvas com sucesso" 
    });
  } catch (error) {
    console.error("[Settings API] Erro ao salvar:", error);
    return NextResponse.json(
      { success: false, error: "Erro ao salvar configurações" },
      { status: 500 }
    );
  }
}
