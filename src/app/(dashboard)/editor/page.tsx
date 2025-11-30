"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Eye,
  Image as ImageIcon,
  Loader2,
  Monitor,
  MoveDown,
  MoveUp,
  Palette,
  Plus,
  RefreshCw,
  Save,
  Settings2,
  Smartphone,
  Trash2,
  Type,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { usePublicSettings } from "@/contexts/public-settings-context";
import { defaultExperience, defaultSettings } from "@/lib/settings/defaults";
import { cn } from "@/lib/utils";
import type { BannerItem, ExperienceSettings } from "@/types/settings";

const COLOR_PRESETS = [
  { id: "cyan", label: "Neon Cyan", primaryColor: "#00faff", secondaryColor: "#050f1f", accentColor: "#42e8ff" },
  { id: "purple", label: "Galaxy Roxo", primaryColor: "#b968ff", secondaryColor: "#160326", accentColor: "#f2c0ff" },
  { id: "emerald", label: "Invest Emerald", primaryColor: "#21f1a5", secondaryColor: "#041b17", accentColor: "#5dfcc4" },
  { id: "sunset", label: "Sunset Gold", primaryColor: "#ffb347", secondaryColor: "#261102", accentColor: "#ffd28f" },
  { id: "crimson", label: "Crimson Rush", primaryColor: "#ff4d6d", secondaryColor: "#20020f", accentColor: "#ff94a8" },
];

const CATEGORY_PREVIEW = [
  { id: "all", label: "Todos" },
  { id: "hot", label: "Em Alta" },
  { id: "slots", label: "Slots" },
  { id: "crash", label: "Crash" },
];

const PREVIEW_GAMES = [
  { id: "g1", name: "Rocket Crash", tag: "Crash" },
  { id: "g2", name: "Lucky Wheel", tag: "Slots" },
  { id: "g3", name: "Plinko X", tag: "Arcade" },
  { id: "g4", name: "Tower Rush", tag: "Arcade" },
  { id: "g5", name: "Fruit Bomb", tag: "Slots" },
  { id: "g6", name: "High Roller", tag: "Hot" },
];

const PREVIEW_SCREENS: Array<{ id: PreviewScreen; label: string }> = [
  { id: "home", label: "Home" },
  { id: "wallet", label: "Carteira" },
  { id: "profile", label: "Perfil" },
];

type SettingsState = {
  general: typeof defaultSettings.general;
  branding: typeof defaultSettings.branding;
  experience: ExperienceSettings;
} & Record<string, unknown>;

const generateId = () =>
  (typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `banner-${Date.now()}`);

const ensureExperience = (incoming?: Partial<ExperienceSettings>): ExperienceSettings => ({
  identity: {
    ...defaultExperience.identity,
    ...incoming?.identity,
    socialLinks: {
      ...defaultExperience.identity.socialLinks,
      ...(incoming?.identity?.socialLinks ?? {}),
    },
  },
  seo: {
    ...defaultExperience.seo,
    ...incoming?.seo,
  },
  theme: {
    ...defaultExperience.theme,
    ...incoming?.theme,
  },
  media: {
    logo: {
      ...defaultExperience.media.logo,
      ...(incoming?.media?.logo ?? {}),
    },
    favicon: {
      ...defaultExperience.media.favicon,
      ...(incoming?.media?.favicon ?? {}),
    },
    banners:
      incoming?.media?.banners?.length
        ? incoming.media.banners.map((banner, index) => ({
            ...banner,
            id: banner.id || `banner-${index}-${Math.random().toString(36).slice(2, 7)}`,
            active: banner.active !== false,
          }))
        : defaultExperience.media.banners,
  },
  features: {
    ...defaultExperience.features,
    ...incoming?.features,
  },
});

async function uploadAsset(file: File, folder: string) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("folder", folder);

  const response = await fetch("/api/upload", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error("Falha no upload");
  }

  const data = await response.json();
  if (!data.success || !data.url) {
    throw new Error(data.error || "Upload inválido");
  }

  return data.url as string;
}

type PreviewScreen = "home" | "wallet" | "profile";

interface DevicePreviewProps {
  experience: ExperienceSettings;
  columns: number;
  mode: "mobile" | "desktop";
  screen: PreviewScreen;
}

function DevicePreview({ experience, columns, mode, screen }: DevicePreviewProps) {
  const [activeCategory, setActiveCategory] = useState(CATEGORY_PREVIEW[0].id);
  const [bannerIndex, setBannerIndex] = useState(0);

  const banners = useMemo(
    () => experience.media.banners.filter((banner) => banner.active && banner.imageUrl),
    [experience.media.banners],
  );

  useEffect(() => {
    if (!banners.length) {
      setBannerIndex(0);
      return;
    }
    if (bannerIndex >= banners.length) {
      setBannerIndex(0);
    }
  }, [banners, bannerIndex]);

  useEffect(() => {
    if (banners.length <= 1) return;
    const id = window.setInterval(() => {
      setBannerIndex((prev) => (prev + 1) % banners.length);
    }, 4500);
    return () => window.clearInterval(id);
  }, [banners.length]);

  const gridColumns = Math.max(1, Math.min(4, columns));
  const currentBanner = banners[bannerIndex];
  const headerBg = experience.theme.secondaryColor || "#050f1f";
  const primary = experience.theme.primaryColor || "#00faff";
  const accent = experience.theme.accentColor || primary;

  const depositStyles = useMemo(
    () => ({
      backgroundImage: `linear-gradient(135deg, ${accent}, ${primary})`,
      color: "#041225",
      boxShadow: `0 12px 35px ${primary}35`,
    }),
    [accent, primary],
  );

  const renderHome = () => (
    <>
      {experience.features.showPromoBar && (
        <div
          className="rounded-full px-4 py-1 text-xs font-semibold uppercase tracking-wide"
          style={{ backgroundColor: `${primary}20`, color: primary }}
        >
          {experience.identity.tagline || "Promoção ativa"}
        </div>
      )}

      <div className="relative overflow-hidden rounded-[28px] border" style={{ borderColor: `${primary}22` }}>
        {currentBanner ? (
          <div className="relative aspect-[320/140]">
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${currentBanner.imageUrl})` }}
            />
            <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1">
              {banners.map((banner) => (
                <span
                  key={banner.id}
                  className={cn(
                    "h-1.5 w-6 rounded-full",
                    banner.id === currentBanner.id ? "bg-white" : "bg-white/30",
                  )}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="flex aspect-[320/140] items-center justify-center px-5 text-center text-xs text-white/70">
            Suba pelo menos um banner ativo para visualizar o carrossel mobile.
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {CATEGORY_PREVIEW.map((category) => (
          <button
            key={category.id}
            type="button"
            onClick={() => setActiveCategory(category.id)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-semibold",
              activeCategory === category.id ? "border-transparent" : "border-white/10 bg-transparent text-white/70",
            )}
            style={activeCategory === category.id ? { backgroundColor: primary, color: "#051225" } : undefined}
          >
            {category.label}
          </button>
        ))}
      </div>

      <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${gridColumns}, minmax(0, 1fr))` }}>
        {PREVIEW_GAMES.map((game) => (
          <div key={game.id} className="rounded-2xl border bg-white/5 p-2 text-left" style={{ borderColor: `${primary}15` }}>
            <div className="aspect-square rounded-xl bg-gradient-to-br from-white/10 to-white/5" />
            <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-white">{game.tag}</p>
            <p className="text-sm text-white/90">{game.name}</p>
          </div>
        ))}
      </div>
    </>
  );

  const renderWallet = () => (
    <div className="space-y-4">
      <div
        className="rounded-3xl p-5 text-white"
        style={{
          backgroundImage: `linear-gradient(120deg, ${primary}, ${accent})`,
          boxShadow: `0 12px 35px ${primary}35`,
        }}
      >
        <p className="text-xs uppercase tracking-wide text-white/80">Saldo total</p>
        <p className="text-3xl font-bold">R$ 12.450,00</p>
        <div className="mt-3 flex gap-2 text-xs text-white/80">
          <span>Invest: R$ 7.800</span>
          <span>|</span>
          <span>Games: R$ 4.650</span>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {["Games", "Invest"].map((wallet) => (
          <div key={wallet} className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-wide text-white/70">Carteira {wallet}</p>
            <p className="text-lg font-semibold text-white">R$ {wallet === "Games" ? "4.650" : "7.800"},00</p>
            <p className="text-[11px] text-white/60">Atualizado há 2 min</p>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" className="flex-1 rounded-2xl px-4 py-3 text-sm font-semibold" style={depositStyles}>
          Depositar
        </button>
        <button
          type="button"
          className="flex-1 rounded-2xl border border-white/15 px-4 py-3 text-sm font-semibold text-white"
        >
          Sacar
        </button>
      </div>
    </div>
  );

  const renderProfile = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-3 rounded-3xl border border-white/10 bg-white/5 p-4">
        <div className="h-12 w-12 rounded-full bg-white/20" />
        <div>
          <p className="text-sm font-semibold text-white">PlayInvest Player</p>
          <p className="text-xs text-white/60">{experience.identity.supportEmail}</p>
        </div>
      </div>
      <div className="space-y-3 rounded-3xl border border-white/10 bg-[#050c18] p-4">
        {["Dados pessoais", "Segurança", "Suporte", "Notificações"].map((item) => (
          <div key={item} className="flex items-center justify-between text-sm text-white/80">
            <span>{item}</span>
            <span className="text-xs text-white/40">›</span>
          </div>
        ))}
      </div>
      {experience.features.showSupport && (
        <div className="rounded-3xl border border-white/15 bg-white/5 p-4 text-center text-xs text-white/80">
          Suporte 24/7 disponível via WhatsApp {experience.identity.whatsapp}
        </div>
      )}
    </div>
  );

  const content = (() => {
    if (screen === "wallet") return renderWallet();
    if (screen === "profile") return renderProfile();
    return renderHome();
  })();

  const bottomTabs: Array<{ id: PreviewScreen; label: string }> = [
    { id: "home", label: "Home" },
    { id: "wallet", label: "Carteira" },
    { id: "profile", label: "Perfil" },
  ];

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[34px] border bg-[#060a16] text-white shadow-2xl",
        mode === "mobile" ? "mx-auto w-[360px]" : "w-full max-w-4xl",
      )}
      style={{ borderColor: `${primary}22` }}
    >
      {experience.features.maintenanceMode && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/75 text-center text-white">
          <span className="text-sm font-semibold uppercase tracking-wide">Manutenção</span>
          <p className="text-xs text-white/80">A experiência ficará indisponível enquanto essa flag estiver ativa.</p>
        </div>
      )}

      <header
        className="flex items-center justify-between rounded-b-3xl px-5 py-4"
        style={{ backgroundColor: headerBg, borderBottom: `1px solid ${primary}22` }}
      >
        <div className="flex items-center gap-3">
          <div className="h-10 w-28 overflow-hidden rounded-xl bg-white/5">
            <div
              className="h-full w-full bg-contain bg-center bg-no-repeat"
              style={{ backgroundImage: `url(${experience.media.logo.url || "/logo-horizontal.png"})` }}
            >
              <span className="sr-only">Logo</span>
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold">{experience.identity.siteName}</p>
            <p className="text-[11px] text-white/60">{experience.identity.supportEmail}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {experience.features.enableInvestments && (
            <span
              className="rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-wide"
              style={{ backgroundColor: `${accent}20`, color: accent }}
            >
              Invest
            </span>
          )}
          <div className="rounded-full px-5 py-2 text-[11px] font-semibold uppercase tracking-wide" style={depositStyles}>
            Depositar
          </div>
        </div>
      </header>

      <div className="space-y-4 p-4 pb-8">{content}</div>

      <div className="border-t border-white/5 bg-[#040812]/80 px-6 py-4">
        <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wide">
          {bottomTabs.map((tab) => (
            <div
              key={tab.id}
              className={cn(
                "flex-1 text-center",
                tab.id === screen ? "text-white" : "text-white/30",
              )}
            >
              <span
                className={cn(
                  "inline-flex h-8 w-full items-center justify-center rounded-full",
                  tab.id === screen ? "bg-white/10" : "bg-transparent",
                )}
              >
                {tab.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {experience.features.showChat && (
        <div
          className="pointer-events-none absolute bottom-5 right-4 flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold"
          style={depositStyles}
        >
          Chat ao vivo
        </div>
      )}
      {experience.features.showSupport && screen === "home" && (
        <div className="pointer-events-none absolute bottom-5 left-4 rounded-full border border-white/20 px-4 py-2 text-xs text-white/80">
          Suporte 24/7
        </div>
      )}
    </div>
  );
}

export default function EditorPage() {
  const [settings, setSettings] = useState<SettingsState | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [previewMode, setPreviewMode] = useState<"mobile" | "desktop">("mobile");
  const [previewScreen, setPreviewScreen] = useState<PreviewScreen>("home");
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingFavicon, setUploadingFavicon] = useState(false);
  const [uploadingBannerId, setUploadingBannerId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const previewRef = useRef<HTMLDivElement | null>(null);
  const { refresh: refreshPublicSettings, updateCache } = usePublicSettings();

  const experience = settings?.experience ?? ensureExperience(defaultExperience);

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      const response = await fetch("/api/settings", { cache: "no-store" });
      if (!response.ok) {
        throw new Error("Não foi possível carregar as configurações");
      }
      const data = await response.json();
      setSettings({
        ...data,
        general: {
          ...defaultSettings.general,
          ...(data.general ?? {}),
        },
        branding: {
          ...defaultSettings.branding,
          ...(data.branding ?? {}),
        },
        experience: ensureExperience(data.experience),
      });
      setHasChanges(false);
    } catch (error) {
      console.error("Erro ao carregar configurações", error);
      setErrorMessage(error instanceof Error ? error.message : "Erro desconhecido");
      toast.error("Erro ao carregar configurações");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const updateExperience = useCallback(
    (updater: (prev: ExperienceSettings) => ExperienceSettings) => {
      setSettings((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          experience: updater(prev.experience),
        };
      });
      setHasChanges(true);
    },
    [],
  );

  const handleIdentityChange = <K extends keyof ExperienceSettings["identity"]>(
    key: K,
    value: ExperienceSettings["identity"][K],
  ) => {
    updateExperience((prev) => ({
      ...prev,
      identity: {
        ...prev.identity,
        [key]: value,
      },
    }));

    if (key === "siteName") {
      setSettings((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          general: {
            ...prev.general,
            siteName: value as string,
          },
        };
      });
    }
  };

  const handleSocialLinkChange = (
    key: keyof ExperienceSettings["identity"]["socialLinks"],
    value: string,
  ) => {
    updateExperience((prev) => ({
      ...prev,
      identity: {
        ...prev.identity,
        socialLinks: {
          ...prev.identity.socialLinks,
          [key]: value,
        },
      },
    }));
  };

  const handleSeoChange = <K extends keyof ExperienceSettings["seo"]>(
    key: K,
    value: ExperienceSettings["seo"][K],
  ) => {
    updateExperience((prev) => ({
      ...prev,
      seo: {
        ...prev.seo,
        [key]: value,
      },
    }));
  };

  const handleThemeChange = <K extends keyof ExperienceSettings["theme"]>(
    key: K,
    value: ExperienceSettings["theme"][K],
  ) => {
    updateExperience((prev) => ({
      ...prev,
      theme: {
        ...prev.theme,
        [key]: value,
      },
    }));
  };

  const handleFeatureToggle = (key: keyof ExperienceSettings["features"], value: boolean) => {
    updateExperience((prev) => ({
      ...prev,
      features: {
        ...prev.features,
        [key]: value,
      },
    }));
  };

  const handleGameColumnsChange = (value: string) => {
    const parsed = Number(value) as 1 | 2 | 3 | 4;
    setSettings((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        general: {
          ...prev.general,
          gameColumns: Math.min(4, Math.max(1, parsed || 3)) as 1 | 2 | 3 | 4,
        },
      };
    });
    setHasChanges(true);
  };

  const updateBanner = (bannerId: string, changes: Partial<BannerItem>) => {
    updateExperience((prev) => ({
      ...prev,
      media: {
        ...prev.media,
        banners: prev.media.banners.map((banner) =>
          banner.id === bannerId ? { ...banner, ...changes } : banner,
        ),
      },
    }));
  };

  const addBanner = () => {
    const newBanner: BannerItem = {
      id: generateId(),
      title: "Novo banner",
      subtitle: "Atualize título, CTA e imagem",
      ctaLabel: "Depositar",
      ctaLink: "/depositar",
      imageUrl: "/banners/banner-default.jpg",
      active: true,
    };
    updateExperience((prev) => ({
      ...prev,
      media: {
        ...prev.media,
        banners: [...prev.media.banners, newBanner],
      },
    }));
  };

  const removeBanner = (bannerId: string) => {
    updateExperience((prev) => ({
      ...prev,
      media: {
        ...prev.media,
        banners: prev.media.banners.filter((banner) => banner.id !== bannerId),
      },
    }));
  };

  const reorderBanner = (bannerId: string, direction: "up" | "down") => {
    updateExperience((prev) => {
      const index = prev.media.banners.findIndex((banner) => banner.id === bannerId);
      if (index === -1) return prev;
      const nextIndex = direction === "up" ? index - 1 : index + 1;
      if (nextIndex < 0 || nextIndex >= prev.media.banners.length) return prev;
      const newBanners = [...prev.media.banners];
      const temp = newBanners[index];
      newBanners[index] = newBanners[nextIndex];
      newBanners[nextIndex] = temp;
      return {
        ...prev,
        media: {
          ...prev.media,
          banners: newBanners,
        },
      };
    });
  };

  const handleLogoUpload = async (file: File | null) => {
    if (!file) return;
    try {
      setUploadingLogo(true);
      const url = await uploadAsset(file, "branding/logo");
      updateExperience((prev) => ({
        ...prev,
        media: {
          ...prev.media,
          logo: {
            ...prev.media.logo,
            url,
          },
        },
      }));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro no upload");
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleFaviconUpload = async (file: File | null) => {
    if (!file) return;
    try {
      setUploadingFavicon(true);
      const url = await uploadAsset(file, "branding/favicon");
      updateExperience((prev) => ({
        ...prev,
        media: {
          ...prev.media,
          favicon: {
            url,
          },
        },
      }));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro no upload");
    } finally {
      setUploadingFavicon(false);
    }
  };

  const handleBannerUpload = async (bannerId: string, file: File | null) => {
    if (!file) return;
    try {
      setUploadingBannerId(bannerId);
      const url = await uploadAsset(file, "branding/banners");
      updateBanner(bannerId, { imageUrl: url });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro no upload do banner");
    } finally {
      setUploadingBannerId(null);
    }
  };

  const applyColorPreset = (presetId: string) => {
    const preset = COLOR_PRESETS.find((item) => item.id === presetId);
    if (!preset) return;
    updateExperience((prev) => ({
      ...prev,
      theme: {
        ...prev.theme,
        primaryColor: preset.primaryColor,
        secondaryColor: preset.secondaryColor,
        accentColor: preset.accentColor,
        preset: preset.id,
      },
    }));
  };

  const handleSave = async () => {
    if (!settings) return;
    try {
      setSaving(true);
      const payload = {
        ...settings,
        branding: {
          ...settings.branding,
          logoUrl: settings.experience.media.logo.url,
          mobileBannerUrl:
            settings.experience.media.banners.find((banner) => banner.active)?.imageUrl ||
            settings.branding.mobileBannerUrl,
        },
        experience: settings.experience,
      };

      const response = await fetch("/api/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Erro ao salvar");
      }

      setHasChanges(false);
      toast.success("Editor visual atualizado");
      updateCache({ experience: payload.experience, branding: payload.branding });
      refreshPublicSettings();
    } catch (error) {
      console.error("Erro ao salvar editor visual", error);
      toast.error(error instanceof Error ? error.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  const scrollToPreview = () => {
    if (previewRef.current) {
      previewRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  const primaryColor = experience.theme.primaryColor;
  const secondaryColor = experience.theme.secondaryColor;
  const isLoadingState = loading || !settings;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-muted-foreground">PlayInvest</p>
          <h1 className="text-2xl font-semibold tracking-tight">Editor visual</h1>
          <p className="text-sm text-muted-foreground">
            Ajuste identidade, carrossel e veja o preview em tempo real.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="ghost" size="sm" onClick={scrollToPreview}>
            <Eye className="mr-2 h-4 w-4" />
            Ver preview
          </Button>
          <Button variant="outline" size="sm" onClick={fetchSettings} disabled={loading}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Recarregar
          </Button>
          <Button size="sm" onClick={handleSave} disabled={!hasChanges || saving || !settings}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Salvar alterações
          </Button>
        </div>
      </div>

      {errorMessage && (
        <div className="rounded-2xl border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
          {errorMessage}
        </div>
      )}

      {isLoadingState ? (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
          <Skeleton className="h-[720px] rounded-3xl" />
          <Skeleton className="h-[520px] rounded-3xl" />
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
          <div>
            <Tabs defaultValue="identity" className="space-y-4">
              <TabsList className="grid gap-2 rounded-2xl bg-muted/40 p-1 sm:grid-cols-4">
                {[
                  { value: "identity", label: "Identidade", icon: Type },
                  { value: "colors", label: "Cores", icon: Palette },
                  { value: "media", label: "Mídia", icon: ImageIcon },
                  { value: "features", label: "Features", icon: Settings2 },
                ].map((tab) => (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className="flex items-center gap-2 rounded-2xl px-3 py-2 text-sm font-medium"
                  >
                    <tab.icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{tab.label}</span>
                    <span className="sm:hidden">{tab.label.slice(0, 3)}</span>
                  </TabsTrigger>
                ))}
              </TabsList>

              <TabsContent value="identity" className="mt-4 space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Informações básicas</CardTitle>
                    <CardDescription>Nome, slogan e rodapé exibidos no app</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Nome do site</Label>
                      <Input value={experience.identity.siteName} onChange={(event) => handleIdentityChange("siteName", event.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Slogan</Label>
                      <Input value={experience.identity.tagline} onChange={(event) => handleIdentityChange("tagline", event.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Texto do rodapé</Label>
                      <Input value={experience.identity.footerText} onChange={(event) => handleIdentityChange("footerText", event.target.value)} />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Contato & Suporte</CardTitle>
                    <CardDescription>Informações exibidas em Perfil e Ajuda</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Email de suporte</Label>
                      <Input type="email" value={experience.identity.supportEmail} onChange={(event) => handleIdentityChange("supportEmail", event.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>WhatsApp oficial</Label>
                      <Input value={experience.identity.whatsapp} onChange={(event) => handleIdentityChange("whatsapp", event.target.value)} placeholder="5521999999999" />
                    </div>
                    <Separator />
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Instagram</Label>
                        <Input value={experience.identity.socialLinks.instagram || ""} onChange={(event) => handleSocialLinkChange("instagram", event.target.value)} placeholder="https://instagram.com" />
                      </div>
                      <div className="space-y-2">
                        <Label>Telegram</Label>
                        <Input value={experience.identity.socialLinks.telegram || ""} onChange={(event) => handleSocialLinkChange("telegram", event.target.value)} placeholder="https://t.me" />
                      </div>
                      <div className="space-y-2">
                        <Label>YouTube</Label>
                        <Input value={experience.identity.socialLinks.youtube || ""} onChange={(event) => handleSocialLinkChange("youtube", event.target.value)} placeholder="https://youtube.com" />
                      </div>
                      <div className="space-y-2">
                        <Label>Twitter/X</Label>
                        <Input value={experience.identity.socialLinks.twitter || ""} onChange={(event) => handleSocialLinkChange("twitter", event.target.value)} placeholder="https://x.com" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">SEO</CardTitle>
                    <CardDescription>Metadados exibidos para Google e compartilhamento</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Título</Label>
                      <Input value={experience.seo.title} onChange={(event) => handleSeoChange("title", event.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Descrição</Label>
                      <Textarea rows={3} value={experience.seo.description} onChange={(event) => handleSeoChange("description", event.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Palavras-chave</Label>
                      <Input value={experience.seo.keywords} onChange={(event) => handleSeoChange("keywords", event.target.value)} />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Grid de jogos</CardTitle>
                    <CardDescription>Número de colunas exibidas na home mobile</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Select value={String(settings?.general.gameColumns ?? 3)} onValueChange={handleGameColumnsChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2">2 colunas</SelectItem>
                        <SelectItem value="3">3 colunas (padrão)</SelectItem>
                        <SelectItem value="4">4 colunas</SelectItem>
                      </SelectContent>
                    </Select>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="colors" className="mt-4 space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Paleta ativa</CardTitle>
                    <CardDescription>Edite as cores principais do lobby mobile</CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-6 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label>Primária</Label>
                      <Input type="color" value={primaryColor} onChange={(event) => handleThemeChange("primaryColor", event.target.value)} className="h-12 cursor-pointer rounded-xl" />
                    </div>
                    <div className="space-y-2">
                      <Label>Secundária</Label>
                      <Input type="color" value={secondaryColor} onChange={(event) => handleThemeChange("secondaryColor", event.target.value)} className="h-12 cursor-pointer rounded-xl" />
                    </div>
                    <div className="space-y-2">
                      <Label>Acento</Label>
                      <Input type="color" value={experience.theme.accentColor} onChange={(event) => handleThemeChange("accentColor", event.target.value)} className="h-12 cursor-pointer rounded-xl" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Presets inteligentes</CardTitle>
                    <CardDescription>Comece com paletas prontas e ajuste detalhes</CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-3 sm:grid-cols-2">
                    {COLOR_PRESETS.map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => applyColorPreset(preset.id)}
                        className={cn(
                          "flex items-center justify-between rounded-2xl border px-4 py-3 text-left transition hover:border-foreground/30",
                          experience.theme.preset === preset.id ? "border-foreground" : "border-border",
                        )}
                      >
                        <div>
                          <p className="text-sm font-semibold">{preset.label}</p>
                          <p className="text-xs text-muted-foreground">{preset.primaryColor}</p>
                        </div>
                        <div className="flex gap-1">
                          {[preset.primaryColor, preset.secondaryColor, preset.accentColor].map((color) => (
                            <span key={color} className="h-6 w-6 rounded-full border" style={{ backgroundColor: color }} />
                          ))}
                        </div>
                      </button>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="media" className="mt-4 space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Logo</CardTitle>
                    <CardDescription>Imagem exibida no topo do lobby</CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-4 md:flex-row md:items-center">
                    <div className="flex h-24 w-48 items-center justify-center rounded-2xl border">
                      <div
                        className="h-16 w-40 bg-contain bg-center bg-no-repeat"
                        style={{ backgroundImage: `url(${experience.media.logo.url || "/logo-horizontal.png"})` }}
                      />
                    </div>
                    <div className="flex-1 space-y-3">
                      <div className="space-y-1">
                        <Label>Texto alternativo</Label>
                        <Input
                          value={experience.media.logo.alt || ""}
                          onChange={(event) =>
                            updateExperience((prev) => ({
                              ...prev,
                              media: {
                                ...prev.media,
                                logo: { ...prev.media.logo, alt: event.target.value },
                              },
                            }))
                          }
                        />
                      </div>
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(event) => handleLogoUpload(event.target.files?.[0] ?? null)}
                        disabled={uploadingLogo}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Favicon</CardTitle>
                    <CardDescription>Usado no dashboard e abas do navegador</CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-4 md:flex-row md:items-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl border">
                      <div
                        className="h-12 w-12 rounded-xl bg-contain bg-center bg-no-repeat"
                        style={{ backgroundImage: `url(${experience.media.favicon.url || "/favicon.ico"})` }}
                      />
                    </div>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(event) => handleFaviconUpload(event.target.files?.[0] ?? null)}
                      disabled={uploadingFavicon}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                      <CardTitle className="text-base">Carrossel mobile</CardTitle>
                      <CardDescription>Banners sem texto sobreposto; apenas imagens de alta fidelidade</CardDescription>
                    </div>
                    <Button variant="outline" size="sm" onClick={addBanner}>
                      <Plus className="mr-2 h-4 w-4" />
                      Adicionar banner
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {experience.media.banners.length === 0 && (
                      <div className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                        Nenhum banner cadastrado. Clique em "Adicionar" para começar.
                      </div>
                    )}
                    {experience.media.banners.map((banner, index) => (
                      <div key={banner.id} className="rounded-2xl border p-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <p className="text-sm font-semibold">Banner #{index + 1}</p>
                            <p className="text-xs text-muted-foreground">Somente imagem em alta resolução</p>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => reorderBanner(banner.id, "up")} disabled={index === 0}>
                              <MoveUp className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => reorderBanner(banner.id, "down")} disabled={index === experience.media.banners.length - 1}>
                              <MoveDown className="h-4 w-4" />
                            </Button>
                            <Switch checked={banner.active} onCheckedChange={(checked) => updateBanner(banner.id, { active: checked })} />
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeBanner(banner.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="mt-4 grid gap-4 md:grid-cols-[2fr_1fr]">
                          <div className="rounded-3xl border border-white/10 bg-white/5 p-3">
                            <div className="relative aspect-[320/140] overflow-hidden rounded-2xl bg-black/10">
                              {banner.imageUrl ? (
                                <div className="h-full w-full bg-cover bg-center" style={{ backgroundImage: `url(${banner.imageUrl})` }} />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                                  Envie uma imagem para este slot.
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="space-y-3">
                            <div className="space-y-2">
                              <Label>Upload de imagem</Label>
                              <Input
                                type="file"
                                accept="image/*"
                                onChange={(event) => handleBannerUpload(banner.id, event.target.files?.[0] ?? null)}
                                disabled={uploadingBannerId === banner.id}
                              />
                              <p className="text-xs text-muted-foreground">Recomendado 960x400px · PNG/JPG</p>
                            </div>
                            {uploadingBannerId === banner.id && (
                              <p className="text-xs text-muted-foreground">Enviando imagem...</p>
                            )}
                            <div className="space-y-2">
                              <Label>URL da imagem</Label>
                              <Input value={banner.imageUrl} onChange={(event) => updateBanner(banner.id, { imageUrl: event.target.value })} placeholder="https://" />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="features" className="mt-4 space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Toggles rápidos</CardTitle>
                    <CardDescription>Ative ou desative camadas do lobby</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {[
                      { key: "showPromoBar", label: "Barra promocional", description: "Exibe tagline no topo da home." },
                      { key: "showChat", label: "Botão de chat", description: "Mostra o atalho de chat flutuante." },
                      { key: "showSupport", label: "Etiqueta Suporte", description: "Badge lateral com status do suporte." },
                      { key: "enableInvestments", label: "Tag Investimento", description: "Evidencia que o split Invest está disponível." },
                      { key: "maintenanceMode", label: "Modo manutenção", description: "Bloqueia o lobby com overlay informativo." },
                    ].map((feature) => (
                      <div key={feature.key} className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-sm font-semibold">{feature.label}</p>
                          <p className="text-xs text-muted-foreground">{feature.description}</p>
                        </div>
                        <Switch
                          checked={experience.features[feature.key as keyof ExperienceSettings["features"]]}
                          onCheckedChange={(checked) =>
                            handleFeatureToggle(feature.key as keyof ExperienceSettings["features"], checked)
                          }
                        />
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          <div className="space-y-4" ref={previewRef}>
            <Card className="sticky top-6">
              <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <CardTitle className="text-base">Preview de alta fidelidade</CardTitle>
                  <CardDescription>Simula home, carteira e perfil exatamente como no lobby mobile.</CardDescription>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-2 rounded-xl bg-muted/40 p-1">
                    <Button variant={previewMode === "mobile" ? "default" : "ghost"} size="sm" onClick={() => setPreviewMode("mobile")}>
                      <Smartphone className="mr-2 h-4 w-4" />
                      Mobile
                    </Button>
                    <Button variant={previewMode === "desktop" ? "default" : "ghost"} size="sm" onClick={() => setPreviewMode("desktop")}>
                      <Monitor className="mr-2 h-4 w-4" />
                      Desktop
                    </Button>
                  </div>
                  <div className="flex items-center gap-1">
                    {PREVIEW_SCREENS.map((screenOption) => (
                      <Button
                        key={screenOption.id}
                        variant={previewScreen === screenOption.id ? "secondary" : "ghost"}
                        size="sm"
                        onClick={() => setPreviewScreen(screenOption.id)}
                      >
                        {screenOption.label}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <DevicePreview
                  experience={experience}
                  columns={settings?.general.gameColumns ?? 3}
                  mode={previewMode}
                  screen={previewScreen}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
