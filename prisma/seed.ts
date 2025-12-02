import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Iniciando seed do banco de dados...\n");

  // Criar usuário admin padrão
  const adminEmail = "admin@primebet.com";
  const adminPassword = "Admin@123";

  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (existingAdmin) {
    console.log("✅ Admin já existe:", adminEmail);
  } else {
    const hashedPassword = await bcrypt.hash(adminPassword, 12);

    const admin = await prisma.user.create({
      data: {
        email: adminEmail,
        name: "Administrador",
        passwordHash: hashedPassword,
        role: "ADMIN",
        status: "ACTIVE",
        emailVerified: new Date(),
        walletGame: {
          create: {
            balance: 0,
          },
        },
        walletInvest: {
          create: {
            principal: 0,
            yields: 0,
          },
        },
      },
    });

    console.log("✅ Admin criado com sucesso!");
    console.log("   📧 Email:", adminEmail);
    console.log("   🔑 Senha:", adminPassword);
    console.log("   👤 ID:", admin.id);
  }

  // Criar alguns usuários de teste
  const testUsers = [
    {
      email: "jogador@teste.com",
      name: "Jogador Teste",
      password: "Teste@123",
      role: "PLAYER" as const,
      balance: 100,
      invested: 0,
    },
    {
      email: "vip@teste.com",
      name: "Jogador VIP",
      password: "Teste@123",
      role: "PLAYER" as const,
      balance: 5000,
      invested: 10000,
    },
  ];

  console.log("\n🎮 Criando usuários de teste...\n");

  for (const userData of testUsers) {
    const existing = await prisma.user.findUnique({
      where: { email: userData.email },
    });

    if (existing) {
      console.log(`⏭️  Usuário já existe: ${userData.email}`);
    } else {
      const hashedPassword = await bcrypt.hash(userData.password, 12);

      const user = await prisma.user.create({
        data: {
          email: userData.email,
          name: userData.name,
          passwordHash: hashedPassword,
          role: userData.role,
          status: "ACTIVE",
          emailVerified: new Date(),
          walletGame: {
            create: {
              balance: userData.balance,
            },
          },
          walletInvest: {
            create: {
              principal: userData.invested,
              yields: 0,
            },
          },
        },
      });

      console.log(`✅ Usuário criado: ${userData.email} (${userData.name})`);
    }
  }

  console.log("\n🎉 Seed concluído com sucesso!\n");
}

main()
  .catch((e) => {
    console.error("❌ Erro no seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
