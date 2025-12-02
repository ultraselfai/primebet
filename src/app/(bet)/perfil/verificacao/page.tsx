"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, Upload, Camera, FileCheck, AlertCircle, 
  Loader2, Check, Clock, X 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import { useBetAuth } from "@/contexts/bet-auth-context";

type KycStatus = "PENDING" | "SUBMITTED" | "VERIFIED" | "REJECTED";
type DocumentType = "RG" | "CPF" | "CNH";

export default function VerificacaoPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading, showToast } = useBetAuth();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [kycStatus, setKycStatus] = useState<KycStatus>("PENDING");
  const [selectedDocument, setSelectedDocument] = useState<DocumentType>("RG");
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [existingDoc, setExistingDoc] = useState<{
    documentType: DocumentType;
    selfieUrl: string;
    status: string;
    rejectReason?: string;
  } | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/");
      return;
    }
    loadKycStatus();
  }, [authLoading, isAuthenticated, router]);

  const loadKycStatus = async () => {
    try {
      const res = await fetch("/api/user/kyc");
      const data = await res.json();
      
      if (data.success) {
        setKycStatus(data.kycStatus);
        if (data.document) {
          setExistingDoc(data.document);
          setSelectedDocument(data.document.documentType);
        }
      }
    } catch (error) {
      console.error("Erro ao carregar KYC:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showToast("Arquivo muito grande. Máximo 5MB", "error");
        return;
      }
      
      setSelfieFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelfiePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    if (!selfieFile) {
      showToast("Selecione uma foto", "error");
      return;
    }

    setIsUploading(true);

    try {
      // 1. Upload da imagem para o R2 usando a API de upload
      const uploadFormData = new FormData();
      uploadFormData.append("file", selfieFile);
      uploadFormData.append("folder", "kyc");

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: uploadFormData,
      });

      const uploadData = await uploadRes.json();

      if (!uploadData.success || !uploadData.url) {
        showToast("Erro ao fazer upload da imagem", "error");
        return;
      }

      // 2. Criar registro do KYC com a URL da imagem
      const res = await fetch("/api/user/kyc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          selfieUrl: uploadData.url,
          documentType: selectedDocument,
        }),
      });

      const data = await res.json();

      if (data.success) {
        showToast("Documento enviado para análise!", "success");
        setKycStatus("SUBMITTED");
        loadKycStatus();
      } else {
        showToast(data.error || "Erro ao enviar documento", "error");
      }
    } catch (error) {
      showToast("Erro ao enviar documento", "error");
    } finally {
      setIsUploading(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-[#0a1628] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#00faff]" />
      </div>
    );
  }

  // Status já verificado
  if (kycStatus === "VERIFIED") {
    return (
      <div className="min-h-screen bg-[#0a1628] pb-24">
        <header className="flex items-center gap-4 p-4 border-b border-white/10">
          <Link href="/perfil" className="text-white/70 hover:text-white transition">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-lg font-semibold text-white">Verificação de Conta</h1>
        </header>
        
        <div className="p-4 flex flex-col items-center justify-center min-h-[60vh]">
          <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mb-4">
            <FileCheck className="w-10 h-10 text-green-500" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Conta Verificada!</h2>
          <p className="text-white/60 text-center">
            Sua conta foi verificada com sucesso. Você tem acesso a todas as funcionalidades.
          </p>
        </div>
      </div>
    );
  }

  // Status pendente de análise
  if (kycStatus === "SUBMITTED") {
    return (
      <div className="min-h-screen bg-[#0a1628] pb-24">
        <header className="flex items-center gap-4 p-4 border-b border-white/10">
          <Link href="/perfil" className="text-white/70 hover:text-white transition">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-lg font-semibold text-white">Verificação de Conta</h1>
        </header>
        
        <div className="p-4 flex flex-col items-center justify-center min-h-[60vh]">
          <div className="w-20 h-20 rounded-full bg-yellow-500/20 flex items-center justify-center mb-4">
            <Clock className="w-10 h-10 text-yellow-500" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Em Análise</h2>
          <p className="text-white/60 text-center mb-4">
            Seu documento foi enviado e está sendo analisado pela nossa equipe.
            Isso pode levar até 24 horas.
          </p>
          {existingDoc && (
            <div className="w-full max-w-sm bg-white/5 rounded-xl p-4 border border-white/10">
              <p className="text-white/60 text-sm mb-2">Documento enviado:</p>
              <p className="text-white font-medium">{existingDoc.documentType}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Status rejeitado
  if (kycStatus === "REJECTED") {
    return (
      <div className="min-h-screen bg-[#0a1628] pb-24">
        <header className="flex items-center gap-4 p-4 border-b border-white/10">
          <Link href="/perfil" className="text-white/70 hover:text-white transition">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-lg font-semibold text-white">Verificação de Conta</h1>
        </header>
        
        <div className="p-4">
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <X className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-red-400 font-medium mb-1">Verificação Rejeitada</h3>
                <p className="text-red-400/70 text-sm">
                  {existingDoc?.rejectReason || "Seu documento foi rejeitado. Por favor, envie novamente."}
                </p>
              </div>
            </div>
          </div>
          
          {/* Formulário para reenvio */}
          <KycForm
            selectedDocument={selectedDocument}
            setSelectedDocument={setSelectedDocument}
            selfiePreview={selfiePreview}
            triggerFileInput={triggerFileInput}
            handleSubmit={handleSubmit}
            isUploading={isUploading}
          />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="user"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      </div>
    );
  }

  // Status pendente - formulário
  return (
    <div className="min-h-screen bg-[#0a1628] pb-24">
      <header className="flex items-center gap-4 p-4 border-b border-white/10">
        <Link href="/perfil" className="text-white/70 hover:text-white transition">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <h1 className="text-lg font-semibold text-white">Verificação de Conta</h1>
      </header>
      
      <div className="p-4">
        {/* Instruções */}
        <div className="bg-[#00faff]/10 border border-[#00faff]/30 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-[#00faff] flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-[#00faff] font-medium mb-1">Verificação de Identidade</h3>
              <p className="text-white/60 text-sm">
                Tire uma selfie segurando seu documento (RG, CPF ou CNH) ao lado do rosto. 
                O documento deve estar legível.
              </p>
            </div>
          </div>
        </div>
        
        <KycForm
          selectedDocument={selectedDocument}
          setSelectedDocument={setSelectedDocument}
          selfiePreview={selfiePreview}
          triggerFileInput={triggerFileInput}
          handleSubmit={handleSubmit}
          isUploading={isUploading}
        />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="user"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
    </div>
  );
}

// Componente do formulário
function KycForm({
  selectedDocument,
  setSelectedDocument,
  selfiePreview,
  triggerFileInput,
  handleSubmit,
  isUploading,
}: {
  selectedDocument: DocumentType;
  setSelectedDocument: (doc: DocumentType) => void;
  selfiePreview: string | null;
  triggerFileInput: () => void;
  handleSubmit: () => void;
  isUploading: boolean;
}) {
  return (
    <>
      {/* Tipo de documento */}
      <div className="mb-6">
        <Label className="text-white/80 mb-3 block">Tipo de documento</Label>
        <RadioGroup
          value={selectedDocument}
          onValueChange={(value) => setSelectedDocument(value as DocumentType)}
          className="grid grid-cols-3 gap-3"
        >
          {(["RG", "CPF", "CNH"] as const).map((doc) => (
            <div key={doc}>
              <RadioGroupItem
                value={doc}
                id={doc}
                className="peer sr-only"
              />
              <Label
                htmlFor={doc}
                className={cn(
                  "flex flex-col items-center justify-center p-4 rounded-xl border-2 cursor-pointer transition-all",
                  selectedDocument === doc
                    ? "border-[#00faff] bg-[#00faff]/10 text-white"
                    : "border-white/10 bg-white/5 text-white/60 hover:bg-white/10"
                )}
              >
                <span className="font-medium">{doc}</span>
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>

      {/* Upload de foto */}
      <div className="mb-6">
        <Label className="text-white/80 mb-3 block">Selfie com documento</Label>
        
        {selfiePreview ? (
          <div className="relative">
            <Image
              src={selfiePreview}
              alt="Preview"
              width={400}
              height={300}
              className="w-full h-64 object-cover rounded-xl border border-white/10"
            />
            <button
              onClick={triggerFileInput}
              className="absolute bottom-3 right-3 px-4 py-2 bg-black/50 backdrop-blur-sm rounded-lg text-white text-sm flex items-center gap-2"
            >
              <Camera className="w-4 h-4" />
              Trocar foto
            </button>
          </div>
        ) : (
          <button
            onClick={triggerFileInput}
            className="w-full h-64 border-2 border-dashed border-white/20 rounded-xl flex flex-col items-center justify-center gap-3 hover:border-[#00faff]/50 hover:bg-[#00faff]/5 transition-all"
          >
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
              <Upload className="w-8 h-8 text-white/40" />
            </div>
            <span className="text-white/60">Clique para tirar uma foto ou fazer upload</span>
            <span className="text-white/40 text-sm">JPG, PNG até 5MB</span>
          </button>
        )}
      </div>

      {/* Botão Enviar */}
      <Button
        onClick={handleSubmit}
        disabled={isUploading || !selfiePreview}
        className={cn(
          "w-full h-12",
          "bg-gradient-to-r from-[#00faff] to-[#00a8ff]",
          "hover:from-[#00faff]/90 hover:to-[#00a8ff]/90",
          "text-[#0a1628] font-semibold",
          "disabled:opacity-50 disabled:cursor-not-allowed"
        )}
      >
        {isUploading ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Enviando...
          </>
        ) : (
          <>
            <Check className="w-5 h-5 mr-2" />
            Enviar para Verificação
          </>
        )}
      </Button>
    </>
  );
}
