/**
 * Script para popular avatares iniciais a partir de public/avatars
 * Rode: npx tsx scripts/seed-avatars.ts
 */

import { prisma } from "../src/lib/prisma";
import * as fs from "fs";
import * as path from "path";

async function main() {
  console.log("🎭 Populando Avatares...\n");

  const avatarsDir = path.join(process.cwd(), "public", "avatars");
  
  // Verificar se o diretório existe
  if (!fs.existsSync(avatarsDir)) {
    console.log("❌ Diretório public/avatars não encontrado");
    return;
  }

  // Listar arquivos de imagem
  const files = fs.readdirSync(avatarsDir).filter((file) => 
    /\.(png|jpg|jpeg|gif|webp)$/i.test(file)
  );

  console.log(`Encontrados ${files.length} arquivos de imagem\n`);

  let created = 0;
  let skipped = 0;

  for (const file of files) {
    const imageUrl = `/avatars/${file}`;
    
    // Verificar se já existe
    const existing = await prisma.avatar.findFirst({
      where: { imageUrl },
    });

    if (existing) {
      console.log(`⏭️  Já existe: ${file}`);
      skipped++;
      continue;
    }

    await prisma.avatar.create({
      data: {
        imageUrl,
        name: file.replace(/\.[^/.]+$/, ""), // Nome sem extensão
        isActive: true,
      },
    });

    console.log(`✅ Criado: ${file}`);
    created++;
  }

  console.log(`\n🎉 Concluído! ${created} avatares criados, ${skipped} já existiam.`);
}

main()
  .catch((e) => {
    console.error("Erro:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
