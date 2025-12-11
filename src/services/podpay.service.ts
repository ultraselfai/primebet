// ============================================
// PrimeBet - PodPay Gateway Service
// Integração com API do PodPay para PIX
// ============================================

import prisma from "@/lib/prisma";

// ============================================
// TIPOS
// ============================================

interface PodPayCredentials {
  publicKey: string;
  secretKey: string;
  withdrawKey: string;
}

interface PodPayCustomer {
  name: string;
  email: string;
  phone?: string;
  document?: {
    type: "cpf" | "cnpj";
    number: string;
  };
}

interface CreateTransactionParams {
  amount: number; // Em centavos
  customer: PodPayCustomer;
  postbackUrl?: string;
  externalRef?: string;
  metadata?: string;
  // Se true, cobra taxa do usuário. Se false (padrão), plataforma absorve a taxa
  netPayout?: boolean;
}

interface CreateTransferParams {
  amount: number; // Em centavos
  pixKey: string;
  pixKeyType: "cpf" | "cnpj" | "email" | "phone" | "evp" | "copypaste";
  postbackUrl?: string;
  externalRef?: string;
  description?: string;
}

interface PodPayTransaction {
  id: number;
  tenantId: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  status: string;
  paidAt: string | null;
  paidAmount: number;
  secureId: string;
  secureUrl: string;
  pix?: {
    qrcode: string;
    expirationDate: string;
    end2EndId?: string;
  };
  customer: {
    id: number;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface PodPayTransfer {
  id: number;
  tenantId: string;
  amount: number;
  netAmount: number;
  fee: number;
  currency: string;
  status: string;
  pixKey: string;
  pixKeyType: string;
  pixEnd2EndId?: string;
  description?: string;
  transferredAt?: string;
  processedAt?: string;
  canceledAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface PodPayBalance {
  amount: number;         // Saldo disponível em centavos (amount na API, não available)
  available?: number;     // Alias para compatibilidade
  waitingFunds: number;   // Valor em saldo a liberar
  pending?: number;       // Alias para waitingFunds
  maxAntecipable: number; // Valor máximo para antecipação
  reserve: number;        // Saldo em reserva
  recipientId: number;    // ID do recebedor
  currency?: string;
}

interface PodPayError {
  error: string;
  message: string;
  statusCode: number;
}

// ============================================
// SERVIÇO
// ============================================

const PODPAY_API_URL = "https://api.podpay.co/v1";

/**
 * Busca as credenciais do gateway PodPay no banco
 */
async function getCredentials(): Promise<PodPayCredentials | null> {
  const gateway = await prisma.gateway.findFirst({
    where: {
      // Usar string literal enquanto aguarda db:push
      type: "PODPAY" as never,
      active: true,
    },
  });

  if (!gateway) {
    console.error("[PodPay] Gateway não encontrado ou inativo");
    return null;
  }

  const credentials = gateway.credentials as unknown as PodPayCredentials;
  
  if (!credentials.publicKey || !credentials.secretKey) {
    console.error("[PodPay] Credenciais incompletas");
    return null;
  }

  return credentials;
}

/**
 * Gera o header de autenticação Basic Auth
 */
function getAuthHeader(credentials: PodPayCredentials): string {
  const auth = Buffer.from(`${credentials.publicKey}:${credentials.secretKey}`).toString("base64");
  return `Basic ${auth}`;
}

/**
 * Faz uma requisição para a API do PodPay
 */
async function podpayRequest<T>(
  endpoint: string,
  options: {
    method?: "GET" | "POST" | "PUT" | "DELETE";
    body?: Record<string, unknown>;
    useWithdrawKey?: boolean;
  } = {}
): Promise<{ success: true; data: T } | { success: false; error: string }> {
  const credentials = await getCredentials();
  
  if (!credentials) {
    return { success: false, error: "Gateway PodPay não configurado" };
  }

  const { method = "GET", body, useWithdrawKey = false } = options;

  const headers: Record<string, string> = {
    Authorization: getAuthHeader(credentials),
    "Content-Type": "application/json",
  };

  // Para saques, precisa do header x-withdraw-key
  if (useWithdrawKey) {
    if (!credentials.withdrawKey) {
      return { success: false, error: "Chave de saque não configurada" };
    }
    headers["x-withdraw-key"] = credentials.withdrawKey;
  }

  const url = `${PODPAY_API_URL}${endpoint}`;
  console.log(`[PodPay] ${method} ${url}`);

  try {
    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await response.json();

    if (!response.ok) {
      const error = data as PodPayError;
      console.error("[PodPay] Erro na requisição:", JSON.stringify(data, null, 2));
      console.error("[PodPay] Status HTTP:", response.status);
      return { success: false, error: error.message || "Erro na API do PodPay" };
    }

    console.log("[PodPay] Resposta OK:", response.status);
    return { success: true, data: data as T };
  } catch (error) {
    console.error("[PodPay] Erro de conexão:", error);
    return { success: false, error: "Erro de conexão com PodPay" };
  }
}

// ============================================
// MÉTODOS PÚBLICOS
// ============================================

/**
 * Cria uma transação PIX para depósito
 * Seguindo documentação: https://linear.app/decodeink/project/documentacao-api-podpay
 */
export async function createPixDeposit(params: CreateTransactionParams): Promise<
  { success: true; transaction: PodPayTransaction } | { success: false; error: string }
> {
  // Gerar CPF fictício se não fornecido (11 dígitos)
  const cpfNumber = params.customer.document?.number || "00011122233";
  
  // Gerar telefone fictício se não fornecido
  const phoneNumber = params.customer.phone || "11999999999";

  // Montar payload seguindo EXATAMENTE o exemplo da documentação
  const payload = {
    amount: params.amount,
    paymentMethod: "pix",
    postbackUrl: params.postbackUrl || undefined,
    externalRef: params.externalRef || undefined,
    metadata: params.metadata || undefined,
    items: [
      {
        title: "Depósito via PIX",
        quantity: 1,
        tangible: true,
        unitPrice: params.amount,
        externalRef: params.externalRef || "deposit-001",
      },
    ],
    customer: {
      name: params.customer.name,
      email: params.customer.email,
      phone: phoneNumber,
      birthdate: "1990-01-01",
      externalRef: params.externalRef || null,
      document: {
        type: "cpf",
        number: cpfNumber,
      },
      address: {
        street: "Rua Exemplo",
        streetNumber: "100",
        complement: "",
        zipCode: "01310100",
        neighborhood: "Centro",
        city: "São Paulo",
        state: "SP",
        country: "BR",
      },
    },
  };

  console.log("[PodPay] Criando transação PIX com payload:", JSON.stringify(payload, null, 2));

  const result = await podpayRequest<PodPayTransaction>("/transactions", {
    method: "POST",
    body: payload,
  });

  if (!result.success) {
    return result;
  }

  console.log("[PodPay] Transação criada com sucesso:", result.data.id);
  return { success: true, transaction: result.data };
}

/**
 * Busca uma transação pelo ID
 */
export async function getTransaction(transactionId: number): Promise<
  { success: true; transaction: PodPayTransaction } | { success: false; error: string }
> {
  const result = await podpayRequest<PodPayTransaction>(`/transactions/${transactionId}`);

  if (!result.success) {
    return result;
  }

  return { success: true, transaction: result.data };
}

/**
 * Cria uma transferência (saque) via PIX
 */
export async function createWithdraw(params: CreateTransferParams): Promise<
  { success: true; transfer: PodPayTransfer } | { success: false; error: string }
> {
  const result = await podpayRequest<PodPayTransfer>("/transfers", {
    method: "POST",
    useWithdrawKey: true,
    body: {
      method: "fiat",
      amount: params.amount,
      netPayout: false,
      pixKey: params.pixKey,
      pixKeyType: params.pixKeyType,
      postbackUrl: params.postbackUrl,
      externalRef: params.externalRef,
      description: params.description,
    },
  });

  if (!result.success) {
    return result;
  }

  return { success: true, transfer: result.data };
}

/**
 * Busca uma transferência pelo ID
 */
export async function getTransfer(transferId: number): Promise<
  { success: true; transfer: PodPayTransfer } | { success: false; error: string }
> {
  const result = await podpayRequest<PodPayTransfer>(`/transfers/${transferId}`, {
    useWithdrawKey: true,
  });

  if (!result.success) {
    return result;
  }

  return { success: true, transfer: result.data };
}

/**
 * Cancela uma transferência
 */
export async function cancelTransfer(transferId: number): Promise<
  { success: true } | { success: false; error: string }
> {
  const result = await podpayRequest<{ success: boolean }>(`/transfers/${transferId}/cancel`, {
    method: "POST",
    useWithdrawKey: true,
  });

  if (!result.success) {
    return result;
  }

  return { success: true };
}

/**
 * Consulta o saldo disponível
 */
export async function getBalance(): Promise<
  { success: true; balance: PodPayBalance } | { success: false; error: string }
> {
  const result = await podpayRequest<PodPayBalance>("/balance/available");

  if (!result.success) {
    return result;
  }

  return { success: true, balance: result.data };
}

/**
 * Testa a conexão com o gateway
 */
export async function testConnection(): Promise<{ success: boolean; message: string }> {
  const result = await getBalance();

  if (!result.success) {
    return { success: false, message: result.error };
  }

  return { 
    success: true, 
    message: `Conexão OK. Saldo disponível: R$ ${((result.balance.amount || result.balance.available || 0) / 100).toFixed(2)}` 
  };
}

// Exportar tipos para uso em outros módulos
export type { 
  PodPayCredentials, 
  PodPayTransaction, 
  PodPayTransfer, 
  PodPayBalance,
  CreateTransactionParams,
  CreateTransferParams,
};
