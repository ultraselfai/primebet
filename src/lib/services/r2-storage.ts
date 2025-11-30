/**
 * Cloudflare R2 Storage Service
 * 
 * Serviço para upload de imagens no Cloudflare R2
 * Usado para capas de jogos, avatares, etc.
 */

import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const ACCESS_KEY_ID = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
const SECRET_ACCESS_KEY = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
const BUCKET_NAME = process.env.CLOUDFLARE_R2_BUCKET_NAME;
const PUBLIC_URL = process.env.CLOUDFLARE_R2_PUBLIC_URL;

// Cliente S3 configurado para R2
const r2Client = new S3Client({
  region: "auto",
  endpoint: `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: ACCESS_KEY_ID || "",
    secretAccessKey: SECRET_ACCESS_KEY || "",
  },
});

export interface UploadResult {
  success: boolean;
  url?: string;
  key?: string;
  error?: string;
}

/**
 * Upload de arquivo para o R2
 */
export async function uploadToR2(
  file: Buffer,
  fileName: string,
  contentType: string,
  folder: string = "games"
): Promise<UploadResult> {
  if (!ACCOUNT_ID || !ACCESS_KEY_ID || !SECRET_ACCESS_KEY || !BUCKET_NAME) {
    return {
      success: false,
      error: "Credenciais do R2 não configuradas",
    };
  }

  try {
    // Gera nome único para o arquivo
    const timestamp = Date.now();
    const cleanFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
    const key = `${folder}/${timestamp}-${cleanFileName}`;

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: file,
      ContentType: contentType,
    });

    await r2Client.send(command);

    // URL pública do arquivo
    const url = `${PUBLIC_URL}/${key}`;

    console.log(`[R2] Upload successful: ${url}`);

    return {
      success: true,
      url,
      key,
    };
  } catch (error) {
    console.error("[R2] Upload error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido no upload",
    };
  }
}

/**
 * Deletar arquivo do R2
 */
export async function deleteFromR2(key: string): Promise<boolean> {
  if (!BUCKET_NAME) {
    return false;
  }

  try {
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    await r2Client.send(command);
    console.log(`[R2] Delete successful: ${key}`);
    return true;
  } catch (error) {
    console.error("[R2] Delete error:", error);
    return false;
  }
}

/**
 * Validar tipo de arquivo de imagem
 */
export function isValidImageType(contentType: string): boolean {
  const validTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/svg+xml",
  ];
  return validTypes.includes(contentType);
}

/**
 * Validar tamanho do arquivo (máximo 5MB)
 */
export function isValidFileSize(size: number, maxMB: number = 5): boolean {
  const maxBytes = maxMB * 1024 * 1024;
  return size <= maxBytes;
}
