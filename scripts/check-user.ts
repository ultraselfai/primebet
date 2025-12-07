import { prisma } from "../src/lib/prisma";

async function checkUser() {
  const email = process.argv[2] || "vinnimedeiros.mkt@gmail.com";
  
  console.log(`\n🔍 Buscando usuário: ${email}\n`);
  
  const user = await prisma.user.findFirst({
    where: { email },
    include: { 
      walletGame: true, 
      walletInvest: true 
    }
  });

  if (!user) {
    console.log("❌ Usuário NÃO encontrado!");
    return;
  }

  console.log("✅ Usuário encontrado:");
  console.log(`   ID: ${user.id}`);
  console.log(`   Nome: ${user.name}`);
  console.log(`   Email: ${user.email}`);
  console.log(`   Role: ${user.role}`);
  console.log(`   Player ID: ${user.playerId || "NÃO DEFINIDO"}`);
  console.log("");
  
  if (user.walletGame) {
    console.log(`💰 WalletGame:`);
    console.log(`   ID: ${user.walletGame.id}`);
    console.log(`   User ID (FK): ${user.walletGame.userId}`);
    console.log(`   Saldo: R$ ${Number(user.walletGame.balance).toFixed(2)}`);
  } else {
    console.log("❌ WalletGame NÃO encontrada!");
  }
  
  console.log("");
  
  if (user.walletInvest) {
    console.log(`📈 WalletInvest:`);
    console.log(`   ID: ${user.walletInvest.id}`);
    console.log(`   Saldo: R$ ${Number(user.walletInvest.balance).toFixed(2)}`);
  } else {
    console.log("❌ WalletInvest NÃO encontrada!");
  }
}

checkUser()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
