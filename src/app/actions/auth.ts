"use server";

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signIn } from "@/lib/auth";
import { z } from "zod";
import { redirect } from "next/navigation";
import { generateUniquePlayerId } from "@/lib/utils/generate-player-id";
import { getRandomAvatarId } from "@/lib/utils/avatar";

// ============================================
// SCHEMAS DE VALIDAÇÃO
// ============================================

const registerSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  phone: z.string().min(10, "Telefone inválido").optional(),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Senhas não conferem",
  path: ["confirmPassword"],
});

const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "Senha é obrigatória"),
});

// ============================================
// TIPOS DE RETORNO
// ============================================

type ActionResult = {
  success: boolean;
  message?: string;
  errors?: Record<string, string[]>;
};

// ============================================
// ACTIONS
// ============================================

export async function registerUser(
  prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const rawData = {
    name: formData.get("name") as string,
    email: formData.get("email") as string,
    phone: formData.get("phone") as string | undefined,
    password: formData.get("password") as string,
    confirmPassword: formData.get("confirmPassword") as string,
  };

  const validationResult = registerSchema.safeParse(rawData);

  if (!validationResult.success) {
    return {
      success: false,
      errors: validationResult.error.flatten().fieldErrors,
    };
  }

  const { name, email, phone, password } = validationResult.data;

  try {
    // Verificar se email já existe
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return {
        success: false,
        message: "Este email já está cadastrado",
      };
    }

    // Verificar se telefone já existe (se fornecido)
    if (phone) {
      const existingPhone = await prisma.user.findUnique({
        where: { phone },
      });

      if (existingPhone) {
        return {
          success: false,
          message: "Este telefone já está cadastrado",
        };
      }
    }

    // Hash da senha
    const passwordHash = await bcrypt.hash(password, 12);

    // Gerar Player ID único
    const playerId = await generateUniquePlayerId();

    // Buscar avatar aleatório
    const avatarId = await getRandomAvatarId();

    // Criar usuário
    const user = await prisma.user.create({
      data: {
        playerId,
        name,
        email,
        phone: phone || null,
        passwordHash,
        role: "PLAYER",
        avatarId,
      },
    });

    // Criar carteiras
    await prisma.$transaction([
      prisma.walletGame.create({
        data: { userId: user.id },
      }),
      prisma.walletInvest.create({
        data: { userId: user.id },
      }),
    ]);

    return {
      success: true,
      message: "Conta criada com sucesso! Faça login para continuar.",
    };
  } catch (error) {
    console.error("Erro ao registrar usuário:", error);
    return {
      success: false,
      message: "Erro ao criar conta. Tente novamente.",
    };
  }
}

export async function loginUser(
  prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const rawData = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  const validationResult = loginSchema.safeParse(rawData);

  if (!validationResult.success) {
    return {
      success: false,
      errors: validationResult.error.flatten().fieldErrors,
    };
  }

  try {
    await signIn("credentials", {
      email: rawData.email,
      password: rawData.password,
      redirect: false,
    });

    return { success: true };
  } catch (error: unknown) {
    console.error("Erro ao fazer login:", error);
    
    // Tratar erro de credenciais
    if (error instanceof Error && error.message.includes("CredentialsSignin")) {
      return {
        success: false,
        message: "Email ou senha incorretos",
      };
    }

    return {
      success: false,
      message: "Erro ao fazer login. Tente novamente.",
    };
  }
}

export async function logoutUser() {
  redirect("/");
}
