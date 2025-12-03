import { NextRequest, NextResponse } from "next/server";
import { uploadToR2, isValidImageType, isValidFileSize } from "@/lib/services/r2-storage";
import { auth } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação - apenas admins podem fazer upload
    const session = await auth();
    if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
      return NextResponse.json(
        { success: false, error: "Não autorizado" },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const folder = (formData.get("folder") as string) || "games";

    if (!file) {
      return NextResponse.json(
        { success: false, error: "Nenhum arquivo enviado" },
        { status: 400 }
      );
    }

    // Validar tipo
    if (!isValidImageType(file.type)) {
      return NextResponse.json(
        { success: false, error: "Tipo de arquivo inválido. Use: JPG, PNG, GIF, WebP ou SVG" },
        { status: 400 }
      );
    }

    // Validar tamanho (5MB)
    if (!isValidFileSize(file.size)) {
      return NextResponse.json(
        { success: false, error: "Arquivo muito grande. Máximo: 5MB" },
        { status: 400 }
      );
    }

    // Converter para Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload para R2
    const result = await uploadToR2(buffer, file.name, file.type, folder);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      url: result.url,
      key: result.key,
    });
  } catch (error) {
    console.error("[Upload API] Error:", error);
    return NextResponse.json(
      { success: false, error: "Erro interno no upload" },
      { status: 500 }
    );
  }
}
