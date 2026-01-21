import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { getRandomAvatarId } from "@/lib/utils/avatar";
import { isValidReferralCode } from "@/lib/utils/generate-referral-code";

// Gerar Player ID único de 8 dígitos
async function generateUniquePlayerId(): Promise<string> {
  let playerId: string;
  let exists = true;
  
  while (exists) {
    // Gera número entre 10000000 e 99999999
    playerId = String(Math.floor(10000000 + Math.random() * 90000000));
    const existing = await prisma.user.findUnique({
      where: { playerId },
    });
    exists = !!existing;
  }
  
  return playerId!;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone, cpf, password, referralCode } = body;

    // Validações básicas
    if (!name || !email || !phone || !cpf || !password) {
      return NextResponse.json(
        { error: "Todos os campos são obrigatórios" },
        { status: 400 }
      );
    }

    // Validar CPF (apenas números, 11 dígitos)
    const cpfClean = cpf.replace(/\D/g, "");
    if (cpfClean.length !== 11) {
      return NextResponse.json(
        { error: "CPF inválido" },
        { status: 400 }
      );
    }

    // Validar telefone (apenas números, 10-11 dígitos)
    const phoneClean = phone.replace(/\D/g, "");
    if (phoneClean.length < 10 || phoneClean.length > 11) {
      return NextResponse.json(
        { error: "Telefone inválido" },
        { status: 400 }
      );
    }

    // Verificar se email já existe
    const existingEmail = await prisma.user.findUnique({
      where: { email },
    });

    if (existingEmail) {
      return NextResponse.json(
        { error: "Este e-mail já está cadastrado" },
        { status: 400 }
      );
    }

    // Verificar se CPF já existe
    const existingCpf = await prisma.user.findUnique({
      where: { cpf: cpfClean },
    });

    if (existingCpf) {
      return NextResponse.json(
        { error: "Este CPF já está cadastrado" },
        { status: 400 }
      );
    }

    // Verificar se telefone já existe
    const existingPhone = await prisma.user.findUnique({
      where: { phone: phoneClean },
    });

    if (existingPhone) {
      return NextResponse.json(
        { error: "Este telefone já está cadastrado" },
        { status: 400 }
      );
    }

    // Hash da senha
    const passwordHash = await bcrypt.hash(password, 12);

    // Gerar Player ID único
    const playerId = await generateUniquePlayerId();

    // Buscar avatar aleatório
    const avatarId = await getRandomAvatarId();

    // Verificar código de indicação (se fornecido)
    let referredById: string | null = null;
    if (referralCode) {
      console.log(`[REGISTER] Código de indicação recebido: "${referralCode}"`)
      
      if (isValidReferralCode(referralCode)) {
        const codeUpperCase = referralCode.toUpperCase();
        console.log(`[REGISTER] Buscando influencer com código: "${codeUpperCase}"`)
        
        const influencer = await prisma.user.findUnique({
          where: { referralCode: codeUpperCase },
          select: { id: true, role: true, name: true, referralCode: true },
        });
        
        console.log(`[REGISTER] Influencer encontrado:`, influencer)
        
        // Só vincula se o usuário existe e é INFLUENCER
        if (influencer && influencer.role === 'INFLUENCER') {
          referredById = influencer.id;
          console.log(`[REGISTER] Vinculando novo usuário ao influencer: ${influencer.name} (${influencer.id})`)
        } else if (influencer) {
          console.log(`[REGISTER] Usuário encontrado mas não é INFLUENCER: role=${influencer.role}`)
        }
      } else {
        console.log(`[REGISTER] Código de indicação inválido: "${referralCode}"`)
      }
    }

    // Criar usuário com carteiras
    const user = await prisma.user.create({
      data: {
        name,
        email,
        phone: phoneClean,
        cpf: cpfClean,
        passwordHash,
        playerId,
        avatarId,
        role: "PLAYER",
        status: "ACTIVE",
        referredById,
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
      select: {
        id: true,
        name: true,
        email: true,
        referredById: true,
      },
    });

    console.log(`[REGISTER] Usuário criado: ${user.id}, nome: ${user.name}, referredById: ${user.referredById}`)

    return NextResponse.json({
      success: true,
      message: "Conta criada com sucesso!",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Erro ao criar usuário:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
