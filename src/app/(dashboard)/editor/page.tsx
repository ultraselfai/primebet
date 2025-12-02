"use client";

import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  Eye,
  ExternalLink,
  Image as ImageIcon,
  Loader2,
  MoveDown,
  MoveUp,
  Palette,
  Plus,
  RefreshCw,
  Save,
  Settings2,
  Trash2,
  Type,
  Wallet,
  Home,
  User,
  CreditCard,
  Users,
  Sparkles,
  Gift,
  Coins,
  Ticket,
  LayoutGrid,
  Gamepad2,
  Wallet2,
  UserRound,
  Send,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  horizontalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { usePublicSettings } from "@/contexts/public-settings-context";
import { defaultExperience, defaultSettings } from "@/lib/settings/defaults";
import { cn } from "@/lib/utils";
import type { BannerItem, ExperienceSettings, BottomNavItem } from "@/types/settings";

type ColorPreset = {
  id: string;
  label: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  highlightIconColor?: string;
  favoriteIconColor?: string;
  loaderBackgroundColor?: string;
  loaderSpinnerColor?: string;
};

const COLOR_PRESETS: ColorPreset[] = [
  {
    id: "cyan",
    label: "Neon Cyan",
    primaryColor: "#00faff",
    secondaryColor: "#050f1f",
    accentColor: "#42e8ff",
    highlightIconColor: "#29d7ff",
    favoriteIconColor: "#b3f4ff",
    loaderBackgroundColor: "#030915",
    loaderSpinnerColor: "#42e8ff",
  },
  {
    id: "purple",
    label: "Galaxy Roxo",
    primaryColor: "#b968ff",
    secondaryColor: "#160326",
    accentColor: "#f2c0ff",
    highlightIconColor: "#fba9ff",
    favoriteIconColor: "#fff1ff",
    loaderBackgroundColor: "#0b0213",
    loaderSpinnerColor: "#d787ff",
  },
  {
    id: "emerald",
    label: "Invest Emerald",
    primaryColor: "#21f1a5",
    secondaryColor: "#041b17",
    accentColor: "#5dfcc4",
    highlightIconColor: "#2ce69f",
    favoriteIconColor: "#f3fff4",
    loaderBackgroundColor: "#02100c",
    loaderSpinnerColor: "#48f1b7",
  },
  {
    id: "sunset",
    label: "Sunset Gold",
    primaryColor: "#ffb347",
    secondaryColor: "#261102",
    accentColor: "#ffd28f",
    highlightIconColor: "#ff9547",
    favoriteIconColor: "#ffe7c4",
    loaderBackgroundColor: "#140700",
    loaderSpinnerColor: "#ffcc80",
  },
  {
    id: "crimson",
    label: "Crimson Rush",
    primaryColor: "#ff4d6d",
    secondaryColor: "#20020f",
    accentColor: "#ff94a8",
    highlightIconColor: "#ff6b6b",
    favoriteIconColor: "#ffd5dd",
    loaderBackgroundColor: "#120009",
    loaderSpinnerColor: "#ff8397",
  },
  {
    id: "royal",
    label: "Royal Night",
    primaryColor: "#4c6fff",
    secondaryColor: "#030a2b",
    accentColor: "#8ea5ff",
    highlightIconColor: "#879bff",
    favoriteIconColor: "#e6ecff",
    loaderBackgroundColor: "#010417",
    loaderSpinnerColor: "#6f8dff",
  },
  {
    id: "aurora",
    label: "Aurora Lime",
    primaryColor: "#d7ff3c",
    secondaryColor: "#111c05",
    accentColor: "#f0ff9f",
    highlightIconColor: "#c7ff57",
    favoriteIconColor: "#fffed1",
    loaderBackgroundColor: "#0b1202",
    loaderSpinnerColor: "#d5ff56",
  },
  {
    id: "ocean",
    label: "Deep Ocean",
    primaryColor: "#00b7ff",
    secondaryColor: "#00121f",
    accentColor: "#3ed0ff",
    highlightIconColor: "#47e0ff",
    favoriteIconColor: "#ccf5ff",
    loaderBackgroundColor: "#000912",
    loaderSpinnerColor: "#27c1ff",
  },
];

type NavIconOption = {
  value: string;
  label: string;
  icon: LucideIcon;
};

const NAV_ICON_OPTIONS: NavIconOption[] = [
  { value: "gamepad", label: "Games", icon: Gamepad2 },
  { value: "wallet", label: "Carteira", icon: Wallet2 },
  { value: "user", label: "Perfil", icon: UserRound },
  { value: "users", label: "Associado", icon: Users },
  { value: "sparkles", label: "Promoções", icon: Sparkles },
  { value: "gift", label: "Brindes", icon: Gift },
  { value: "coins", label: "Carteiras", icon: Coins },
  { value: "ticket", label: "Tickets", icon: Ticket },
  { value: "send", label: "Contato", icon: Send },
];

const NAV_ICON_MAP = Object.fromEntries(NAV_ICON_OPTIONS.map((option) => [option.value, option.icon]));

const getNavIconComponent = (icon: string): LucideIcon => {
  return (NAV_ICON_MAP[icon] as LucideIcon) ?? Gamepad2;
};

type PreviewScreen = "home" | "carteira" | "depositar" | "perfil";

const PREVIEW_SCREENS: Array<{ id: PreviewScreen; label: string; icon: React.ReactNode }> = [
  { id: "home", label: "Home", icon: <Home className="h-4 w-4" /> },
  { id: "carteira", label: "Carteira", icon: <Wallet className="h-4 w-4" /> },
  { id: "depositar", label: "Depósito", icon: <CreditCard className="h-4 w-4" /> },
  { id: "perfil", label: "Perfil", icon: <User className="h-4 w-4" /> },
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
    loaderGifUrl: incoming?.media?.loaderGifUrl ?? defaultExperience.media.loaderGifUrl,
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
  navigation: {
    bottomNav: ensureBottomNav(incoming?.navigation?.bottomNav),
  },
});

const ensureBottomNav = (incoming?: BottomNavItem[]): BottomNavItem[] => {
  const defaults = defaultExperience.navigation.bottomNav;
  const defaultMap = new Map(defaults.map((item) => [item.id, item]));
  const source = incoming && incoming.length ? incoming : defaults;
  const normalized: BottomNavItem[] = [];
  const seen = new Set<string>();

  source.forEach((item) => {
    const fallback = defaultMap.get(item.id);
    const next: BottomNavItem = {
      ...(fallback ?? item),
      ...item,
      isMandatory: fallback?.isMandatory ?? item.isMandatory ?? false,
      enabled: (fallback?.isMandatory ?? item.isMandatory ?? false) ? true : item.enabled ?? fallback?.enabled ?? true,
    };
    normalized.push(next);
    seen.add(next.id);
  });

  defaults.forEach((item) => {
    if (!seen.has(item.id)) {
      normalized.push(item);
    }
  });

  return normalized;
};

type BottomNavSortableItemProps = {
  item: BottomNavItem;
  isActive: boolean;
  onSelect: (id: string) => void;
};

function BottomNavSortableItem({ item, isActive, onSelect }: BottomNavSortableItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  const Icon = getNavIconComponent(item.icon);
  return (
    <button
      type="button"
      ref={setNodeRef}
      style={style}
      onClick={() => onSelect(item.id)}
      className={cn(
        "flex min-w-[150px] flex-1 items-center justify-between rounded-2xl border px-3 py-2 text-left text-sm",
        "bg-background/40",
        isActive ? "border-primary text-primary" : "border-border",
        item.enabled ? "opacity-100" : "opacity-60",
        "cursor-grab active:cursor-grabbing",
        isDragging && "ring-2 ring-primary/40",
      )}
      {...attributes}
      {...listeners}
    >
      <div className="flex items-center gap-2">
        <span className="rounded-full bg-black/10 p-1">
          <Icon className="h-4 w-4" />
        </span>
        <div className="flex flex-col">
          <span className="font-medium leading-none">{item.label}</span>
          <span className="text-[11px] text-muted-foreground">{item.isMandatory ? "Obrigatório" : "Opcional"}</span>
        </div>
      </div>
      {!item.isMandatory && (
        <span className={cn("text-[11px] font-medium", item.enabled ? "text-emerald-400" : "text-muted-foreground")}> 
          {item.enabled ? "Ativo" : "Inativo"}
        </span>
      )}
    </button>
  );
}

type BottomNavPreviewProps = {
  items: BottomNavItem[];
  themeSecondary: string;
};

function BottomNavPreview({ items, themeSecondary }: BottomNavPreviewProps) {
  const visibleItems = getVisibleNavItems(items);
  if (!visibleItems.length) return null;
  const centerIndex = Math.floor(visibleItems.length / 2);
  const centerItem = visibleItems[centerIndex];
  const leftItems = visibleItems.slice(0, centerIndex);
  const rightItems = visibleItems.slice(centerIndex + 1);

  return (
    <div className="relative mx-auto w-full max-w-[375px] pt-8 pb-2">
      {/* SVG Background */}
      <div className="absolute inset-x-0 bottom-0 top-0 z-0 drop-shadow-lg">
        <svg
          viewBox="0 0 375 85"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="h-full w-full"
          preserveAspectRatio="none"
        >
          <path
            d="M0 20C0 20 0 20 0 20V85H375V20C375 20 375 20 375 20H228.5C223.5 20 219.5 16.5 217.5 12C213.5 3.5 205.5 -1.5 196.5 0.5C191.5 1.5 187.5 4.5 187.5 4.5C187.5 4.5 183.5 1.5 178.5 0.5C169.5 -1.5 161.5 3.5 157.5 12C155.5 16.5 151.5 20 146.5 20H0Z"
            fill={themeSecondary || "#050f1f"}
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="1"
          />
        </svg>
      </div>

      <div className="relative z-10 flex h-[65px] items-end justify-between px-2 pb-2">
        <div className="flex flex-1 justify-around text-xs">
          {leftItems.map((item) => (
            <PreviewNavButton key={item.id} item={item} />
          ))}
        </div>
        <div className="w-20 shrink-0" />
        <div className="flex flex-1 justify-around text-xs">
          {rightItems.map((item) => (
            <PreviewNavButton key={item.id} item={item} />
          ))}
        </div>
      </div>

      {centerItem && (
        <div className="absolute left-1/2 top-[-8px] z-20 flex h-14 w-14 -translate-x-1/2 items-center justify-center rounded-full border border-white/10 bg-[#0b1624] text-white shadow-lg">
          {React.createElement(getNavIconComponent(centerItem.icon), { className: "h-6 w-6" })}
        </div>
      )}
    </div>
  );
}

function PreviewNavButton({ item }: { item: BottomNavItem }) {
  const Icon = getNavIconComponent(item.icon);
  return (
    <div className="flex flex-col items-center gap-1 text-white/70">
      <Icon className="h-4 w-4" />
      <span className="text-[11px] font-medium">{item.label}</span>
    </div>
  );
}

function getVisibleNavItems(items: BottomNavItem[]) {
  return items.filter((item) => item.isMandatory || item.enabled);
}

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

// Componente de Preview com iframe de alta fidelidade
function LivePreview({ 
  screen, 
  previewMode,
  previewKey,
}: { 
  screen: PreviewScreen; 
  previewMode: "mobile" | "desktop";
  previewKey: number;
}) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Mapear tela para URL real (relativa)
  const screenUrls: Record<PreviewScreen, string> = {
    home: "/",
    carteira: "/carteira",
    depositar: "/depositar",
    perfil: "/perfil",
  };

  // Usar URL relativa com timestamp para cache bust
  const iframeUrl = `${screenUrls[screen]}?preview=true&t=${previewKey}`;

  const handleLoad = () => {
    setLoading(false);
    setError(false);
  };

  const handleError = () => {
    setLoading(false);
    setError(true);
  };

  return (
    <div className={cn(
      "relative overflow-hidden rounded-3xl border-4 border-zinc-800 bg-zinc-900 shadow-2xl",
      previewMode === "mobile" ? "mx-auto w-[375px]" : "w-full"
    )}>
      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-zinc-900">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="text-sm text-muted-foreground">Carregando preview...</span>
          </div>
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-zinc-900">
          <div className="flex flex-col items-center gap-3 text-center px-4">
            <div className="h-12 w-12 rounded-full bg-destructive/20 flex items-center justify-center">
              <ExternalLink className="h-6 w-6 text-destructive" />
            </div>
            <span className="text-sm text-muted-foreground">Não foi possível carregar o preview</span>
            <Button variant="outline" size="sm" onClick={() => {
              setLoading(true);
              setError(false);
              if (iframeRef.current) {
                iframeRef.current.src = iframeUrl;
              }
            }}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Tentar novamente
            </Button>
          </div>
        </div>
      )}

      {/* iframe com a bet real */}
      <iframe
        ref={iframeRef}
        src={iframeUrl}
        className={cn(
          "w-full border-0 bg-zinc-900",
          previewMode === "mobile" ? "h-[667px]" : "h-[500px]"
        )}
        onLoad={handleLoad}
        onError={handleError}
        title="Preview da Bet"
        sandbox="allow-same-origin allow-scripts allow-forms"
      />
    </div>
  );
}

export default function EditorPage() {
  const [settings, setSettings] = useState<SettingsState | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [previewScreen, setPreviewScreen] = useState<PreviewScreen>("home");
  const [previewKey, setPreviewKey] = useState(0);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingFavicon, setUploadingFavicon] = useState(false);
  const [uploadingLoaderGif, setUploadingLoaderGif] = useState(false);
  const [uploadingTelegramButton, setUploadingTelegramButton] = useState(false);
  const [uploadingBannerId, setUploadingBannerId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const previewRef = useRef<HTMLDivElement | null>(null);
  const { refresh: refreshPublicSettings, updateCache } = usePublicSettings();

  const experience = settings?.experience ?? ensureExperience(defaultExperience);
  const bottomNavItems = experience.navigation.bottomNav;
  const [activeBottomNavId, setActiveBottomNavId] = useState<string>(bottomNavItems[0]?.id ?? "");
  useEffect(() => {
    if (!bottomNavItems.some((item) => item.id === activeBottomNavId)) {
      setActiveBottomNavId(bottomNavItems[0]?.id ?? "");
    }
  }, [bottomNavItems, activeBottomNavId]);
  const activeBottomNavItem = bottomNavItems.find((item) => item.id === activeBottomNavId) ?? bottomNavItems[0] ?? null;
  const navSensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
  );

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

  const handleBottomNavItemChange = (itemId: string, changes: Partial<BottomNavItem>) => {
    updateExperience((prev) => ({
      ...prev,
      navigation: {
        ...prev.navigation,
        bottomNav: prev.navigation.bottomNav.map((item) =>
          item.id === itemId ? { ...item, ...changes } : item,
        ),
      },
    }));
  };

  const handleBottomNavToggle = (itemId: string, enabled: boolean) => {
    updateExperience((prev) => ({
      ...prev,
      navigation: {
        ...prev.navigation,
        bottomNav: prev.navigation.bottomNav.map((item) => {
          if (item.id !== itemId) return item;
          if (item.isMandatory) {
            return { ...item, enabled: true };
          }
          return { ...item, enabled };
        }),
      },
    }));
  };

  const handleBottomNavDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    updateExperience((prev) => {
      const items = prev.navigation.bottomNav;
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return prev;
      return {
        ...prev,
        navigation: {
          ...prev.navigation,
          bottomNav: arrayMove(items, oldIndex, newIndex),
        },
      };
    });
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
      title: "",
      imageUrl: "",
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

  const updateLoaderGifUrl = (url: string) => {
    updateExperience((prev) => ({
      ...prev,
      media: {
        ...prev.media,
        loaderGifUrl: url,
      },
    }));
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
      toast.success("Logo enviado com sucesso");
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
      toast.success("Favicon enviado com sucesso");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro no upload");
    } finally {
      setUploadingFavicon(false);
    }
  };

  const handleLoaderGifUpload = async (file: File | null) => {
    if (!file) return;
    try {
      setUploadingLoaderGif(true);
      const url = await uploadAsset(file, "branding/loader");
      updateLoaderGifUrl(url);
      toast.success("GIF do loader enviado com sucesso");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro no upload do loader");
    } finally {
      setUploadingLoaderGif(false);
    }
  };

  const handleTelegramButtonUpload = async (file: File | null) => {
    if (!file) return;
    try {
      setUploadingTelegramButton(true);
      const url = await uploadAsset(file, "branding/telegram-button");
      updateExperience((prev) => ({
        ...prev,
        media: {
          ...prev.media,
          telegramButtonImageUrl: url,
        },
      }));
      toast.success("Botão do Telegram atualizado");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro no upload do botão");
    } finally {
      setUploadingTelegramButton(false);
    }
  };

  const handleBannerUpload = async (bannerId: string, file: File | null) => {
    if (!file) return;
    try {
      setUploadingBannerId(bannerId);
      const url = await uploadAsset(file, "branding/banners");
      updateBanner(bannerId, { imageUrl: url });
      toast.success("Banner enviado com sucesso");
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
        highlightIconColor: preset.highlightIconColor ?? prev.theme.highlightIconColor,
        favoriteIconColor: preset.favoriteIconColor ?? prev.theme.favoriteIconColor,
        loaderBackgroundColor: preset.loaderBackgroundColor ?? prev.theme.loaderBackgroundColor,
        loaderSpinnerColor: preset.loaderSpinnerColor ?? prev.theme.loaderSpinnerColor,
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
      toast.success("Alterações salvas! Atualizando preview...");
      updateCache({ experience: payload.experience, branding: payload.branding });
      refreshPublicSettings();
      
      // Atualizar preview após salvar
      setTimeout(() => {
        setPreviewKey((k) => k + 1);
      }, 500);
    } catch (error) {
      console.error("Erro ao salvar editor visual", error);
      toast.error(error instanceof Error ? error.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  const refreshPreview = () => {
    setPreviewKey((k) => k + 1);
  };

  const scrollToPreview = () => {
    if (previewRef.current) {
      previewRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  const openInNewTab = () => {
    const screenUrls: Record<PreviewScreen, string> = {
      home: "/",
      carteira: "/carteira",
      depositar: "/depositar",
      perfil: "/perfil",
    };
    window.open(screenUrls[previewScreen], "_blank");
  };

  const primaryColor = experience.theme.primaryColor;
  const secondaryColor = experience.theme.secondaryColor;
  const hasLoaderGif = Boolean(experience.media.loaderGifUrl);
  const isLoadingState = loading || !settings;

  return (
    <div className="space-y-6 px-4 lg:px-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold tracking-tight">Editor Visual</h1>
          <p className="text-muted-foreground">
            Personalize cores, banners e veja o resultado em tempo real na bet.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchSettings} disabled={loading}>
            <RefreshCw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} />
            Recarregar
          </Button>
          <Button size="sm" onClick={handleSave} disabled={!hasChanges || saving || !settings}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Salvar alterações
          </Button>
        </div>
      </div>

      {/* Aviso de mudanças não salvas */}
      {hasChanges && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          <strong>⚠️ Você tem alterações não salvas.</strong> O preview mostra a versão atual publicada. Salve para ver suas mudanças.
        </div>
      )}

      {errorMessage && (
        <div className="rounded-2xl border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
          {errorMessage}
        </div>
      )}

      {isLoadingState ? (
        <div className="grid gap-6 xl:grid-cols-[1fr_400px]">
          <Skeleton className="h-[720px] rounded-xl" />
          <Skeleton className="h-[720px] rounded-xl" />
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[1fr_400px]">
          {/* Painel de Edição */}
          <div>
            <Tabs defaultValue="colors" className="space-y-4">
              <TabsList>
                <TabsTrigger value="colors" className="gap-2">
                  <Palette className="h-4 w-4" />
                  Cores
                </TabsTrigger>
                <TabsTrigger value="media" className="gap-2">
                  <ImageIcon className="h-4 w-4" />
                  Mídia
                </TabsTrigger>
                <TabsTrigger value="identity" className="gap-2">
                  <Type className="h-4 w-4" />
                  Informações
                </TabsTrigger>
                <TabsTrigger value="navigation" className="gap-2">
                  <LayoutGrid className="h-4 w-4" />
                  Menu inferior
                </TabsTrigger>
                <TabsTrigger value="features" className="gap-2">
                  <Settings2 className="h-4 w-4" />
                  Features
                </TabsTrigger>
              </TabsList>

              {/* Tab: Cores */}
              <TabsContent value="colors" className="mt-4 space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Paleta de cores</CardTitle>
                    <CardDescription>Defina as cores principais da sua bet. Após salvar, o preview atualizará automaticamente.</CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-6 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label>Cor Primária</Label>
                      <div className="flex items-center gap-2">
                        <Input 
                          type="color" 
                          value={primaryColor} 
                          onChange={(event) => handleThemeChange("primaryColor", event.target.value)} 
                          className="h-12 w-16 cursor-pointer rounded-xl p-1" 
                        />
                        <Input 
                          type="text"
                          value={primaryColor}
                          onChange={(event) => handleThemeChange("primaryColor", event.target.value)}
                          className="flex-1 font-mono text-sm"
                          placeholder="#00faff"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">Botões, destaques, ícones</p>
                    </div>
                    <div className="space-y-2">
                      <Label>Cor de Fundo</Label>
                      <div className="flex items-center gap-2">
                        <Input 
                          type="color" 
                          value={secondaryColor} 
                          onChange={(event) => handleThemeChange("secondaryColor", event.target.value)} 
                          className="h-12 w-16 cursor-pointer rounded-xl p-1" 
                        />
                        <Input 
                          type="text"
                          value={secondaryColor}
                          onChange={(event) => handleThemeChange("secondaryColor", event.target.value)}
                          className="flex-1 font-mono text-sm"
                          placeholder="#050f1f"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">Background geral</p>
                    </div>
                    <div className="space-y-2">
                      <Label>Cor de Acento</Label>
                      <div className="flex items-center gap-2">
                        <Input 
                          type="color" 
                          value={experience.theme.accentColor} 
                          onChange={(event) => handleThemeChange("accentColor", event.target.value)} 
                          className="h-12 w-16 cursor-pointer rounded-xl p-1" 
                        />
                        <Input 
                          type="text"
                          value={experience.theme.accentColor}
                          onChange={(event) => handleThemeChange("accentColor", event.target.value)}
                          className="flex-1 font-mono text-sm"
                          placeholder="#42e8ff"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">Gradientes, hover</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Card de Cores dos Ícones */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Cores dos Ícones</CardTitle>
                    <CardDescription>Personalize as cores dos ícones de destaque e favoritos nos cards de jogos</CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Ícone de Destaque (🔥)</Label>
                      <div className="flex items-center gap-2">
                        <Input 
                          type="color" 
                          value={experience.theme.highlightIconColor || "#f97316"} 
                          onChange={(event) => handleThemeChange("highlightIconColor", event.target.value)} 
                          className="h-12 w-16 cursor-pointer rounded-xl p-1" 
                        />
                        <Input 
                          type="text"
                          value={experience.theme.highlightIconColor || "#f97316"}
                          onChange={(event) => handleThemeChange("highlightIconColor", event.target.value)}
                          className="flex-1 font-mono text-sm"
                          placeholder="#f97316"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">Cor do foguinho nos jogos em destaque</p>
                    </div>
                    <div className="space-y-2">
                      <Label>Ícone de Favoritos (⭐)</Label>
                      <div className="flex items-center gap-2">
                        <Input 
                          type="color" 
                          value={experience.theme.favoriteIconColor || "#facc15"} 
                          onChange={(event) => handleThemeChange("favoriteIconColor", event.target.value)} 
                          className="h-12 w-16 cursor-pointer rounded-xl p-1" 
                        />
                        <Input 
                          type="text"
                          value={experience.theme.favoriteIconColor || "#facc15"}
                          onChange={(event) => handleThemeChange("favoriteIconColor", event.target.value)}
                          className="flex-1 font-mono text-sm"
                          placeholder="#facc15"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">Cor da estrela nos jogos favoritos</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Loader do lobby</CardTitle>
                    <CardDescription>Defina as cores de fundo e do spinner exibidos durante o carregamento da bet</CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Cor de fundo</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="color"
                          value={experience.theme.loaderBackgroundColor || "#050f1f"}
                          onChange={(event) => handleThemeChange("loaderBackgroundColor", event.target.value)}
                          className="h-12 w-16 cursor-pointer rounded-xl p-1"
                        />
                        <Input
                          type="text"
                          value={experience.theme.loaderBackgroundColor || "#050f1f"}
                          onChange={(event) => handleThemeChange("loaderBackgroundColor", event.target.value)}
                          className="flex-1 font-mono text-sm"
                          placeholder="#050f1f"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">Plano de fundo exibido durante o carregamento</p>
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        Cor do spinner
                        {hasLoaderGif && (
                          <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-white/70">
                            GIF ativo
                          </span>
                        )}
                      </Label>
                      {hasLoaderGif ? (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex items-center gap-2 cursor-not-allowed opacity-60">
                                <Input
                                  type="color"
                                  value={experience.theme.loaderSpinnerColor || "#00faff"}
                                  disabled
                                  className="h-12 w-16 cursor-not-allowed rounded-xl p-1"
                                />
                                <Input
                                  type="text"
                                  value={experience.theme.loaderSpinnerColor || "#00faff"}
                                  disabled
                                  className="flex-1 cursor-not-allowed font-mono text-sm"
                                />
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="top" align="start" className="max-w-[240px] text-xs">
                              <div className="flex items-center gap-2">
                                <Loader2 className="h-3 w-3 animate-spin text-primary" />
                                <span>Remova o GIF personalizado para editar a cor do spinner padrão.</span>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Input
                            type="color"
                            value={experience.theme.loaderSpinnerColor || "#00faff"}
                            onChange={(event) => handleThemeChange("loaderSpinnerColor", event.target.value)}
                            className="h-12 w-16 cursor-pointer rounded-xl p-1"
                          />
                          <Input
                            type="text"
                            value={experience.theme.loaderSpinnerColor || "#00faff"}
                            onChange={(event) => handleThemeChange("loaderSpinnerColor", event.target.value)}
                            className="flex-1 font-mono text-sm"
                            placeholder="#00faff"
                          />
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground">Cor da animação circular do loader</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Paletas prontas</CardTitle>
                    <CardDescription>Comece com uma paleta profissional e ajuste conforme sua marca</CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {COLOR_PRESETS.map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => applyColorPreset(preset.id)}
                        className={cn(
                          "flex items-center justify-between rounded-2xl border px-4 py-3 text-left transition hover:border-foreground/30",
                          experience.theme.preset === preset.id ? "border-foreground ring-2 ring-foreground/20" : "border-border",
                        )}
                      >
                        <div>
                          <p className="text-sm font-semibold">{preset.label}</p>
                          <p className="text-xs text-muted-foreground font-mono">{preset.primaryColor}</p>
                        </div>
                        <div className="flex gap-1">
                          {[preset.primaryColor, preset.secondaryColor, preset.accentColor].map((color, i) => (
                            <span key={i} className="h-6 w-6 rounded-full border border-white/20" style={{ backgroundColor: color }} />
                          ))}
                        </div>
                      </button>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Tab: Mídia */}
              <TabsContent value="media" className="mt-4 space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Logo</CardTitle>
                    <CardDescription>Imagem exibida no topo do cassino (recomendado: PNG transparente)</CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-4 md:flex-row md:items-center">
                    <div className="flex h-20 w-44 items-center justify-center rounded-2xl border bg-zinc-900">
                      <div
                        className="h-12 w-36 bg-contain bg-center bg-no-repeat"
                        style={{ backgroundImage: `url(${experience.media.logo.url || "/logo-horizontal.png"})` }}
                      />
                    </div>
                    <div className="flex-1 space-y-3">
                      <div className="space-y-1">
                        <Label>Texto alternativo (acessibilidade)</Label>
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
                          placeholder="PrimeBet"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={(event) => handleLogoUpload(event.target.files?.[0] ?? null)}
                          disabled={uploadingLogo}
                          className="flex-1"
                        />
                        {uploadingLogo && <Loader2 className="h-4 w-4 animate-spin" />}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Favicon</CardTitle>
                    <CardDescription>Ícone exibido na aba do navegador</CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-4 md:flex-row md:items-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl border bg-zinc-900">
                      <div
                        className="h-10 w-10 rounded-lg bg-contain bg-center bg-no-repeat"
                        style={{ backgroundImage: `url(${experience.media.favicon.url || "/favicon.ico"})` }}
                      />
                    </div>
                    <div className="flex items-center gap-2 flex-1">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(event) => handleFaviconUpload(event.target.files?.[0] ?? null)}
                        disabled={uploadingFavicon}
                        className="flex-1"
                      />
                      {uploadingFavicon && <Loader2 className="h-4 w-4 animate-spin" />}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Loader do lobby</CardTitle>
                    <CardDescription>Envie um GIF para personalizar o carregamento do player mobile. O painel admin continua com o loader padrão.</CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-4 md:flex-row md:items-center">
                    <div className="flex h-32 w-full max-w-[160px] items-center justify-center rounded-2xl border bg-zinc-900 p-2">
                      {experience.media.loaderGifUrl ? (
                        <img
                          src={experience.media.loaderGifUrl}
                          alt="Prévia do loader"
                          className="max-h-full max-w-full object-contain"
                        />
                      ) : (
                        <div className="text-center text-xs text-muted-foreground">
                          Nenhum GIF enviado ainda
                        </div>
                      )}
                    </div>
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-2">
                        <Input
                          type="file"
                          accept="image/gif,image/webp,image/apng"
                          onChange={(event) => handleLoaderGifUpload(event.target.files?.[0] ?? null)}
                          disabled={uploadingLoaderGif}
                          className="flex-1"
                        />
                        {uploadingLoaderGif && <Loader2 className="h-4 w-4 animate-spin" />}
                      </div>
                      <div className="space-y-1">
                        <Label>Ou cole a URL</Label>
                        <Input
                          value={experience.media.loaderGifUrl || ""}
                          onChange={(event) => updateLoaderGifUrl(event.target.value)}
                          placeholder="https://cdn.sua-bet.com/loader.gif"
                        />
                      </div>
                      {experience.media.loaderGifUrl && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => updateLoaderGifUrl("")}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Remover GIF
                        </Button>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Recomendamos GIFs com fundo transparente e até 1MB para garantir carregamento rápido.
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                      <CardTitle className="text-base">Banners do Carrossel</CardTitle>
                      <CardDescription>
                        Imagens que aparecem no topo da home. Use imagens de <strong>960×400px</strong> para melhor qualidade.
                      </CardDescription>
                    </div>
                    <Button variant="outline" size="sm" onClick={addBanner}>
                      <Plus className="mr-2 h-4 w-4" />
                      Adicionar banner
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {experience.media.banners.length === 0 && (
                      <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                        <ImageIcon className="mx-auto mb-3 h-10 w-10 opacity-50" />
                        <p>Nenhum banner cadastrado.</p>
                        <p className="text-xs mt-1">Clique em &quot;Adicionar&quot; para começar.</p>
                      </div>
                    )}
                    {experience.media.banners.map((banner, index) => (
                      <div key={banner.id} className="rounded-2xl border p-4">
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                          <div>
                            <p className="text-sm font-semibold">Banner #{index + 1}</p>
                            <p className="text-xs text-muted-foreground">Apenas imagem, sem texto sobreposto</p>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => reorderBanner(banner.id, "up")} disabled={index === 0}>
                              <MoveUp className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => reorderBanner(banner.id, "down")} disabled={index === experience.media.banners.length - 1}>
                              <MoveDown className="h-4 w-4" />
                            </Button>
                            <div className="flex items-center gap-2 px-2">
                              <span className="text-xs text-muted-foreground">Ativo</span>
                              <Switch checked={banner.active} onCheckedChange={(checked) => updateBanner(banner.id, { active: checked })} />
                            </div>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => removeBanner(banner.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="grid gap-4 md:grid-cols-[2fr_1fr]">
                          <div className="rounded-2xl border border-white/10 bg-zinc-900 p-2">
                            <div className="relative aspect-[320/140] overflow-hidden rounded-xl bg-black/20">
                              {banner.imageUrl ? (
                                <div className="h-full w-full bg-cover bg-center" style={{ backgroundImage: `url(${banner.imageUrl})` }} />
                              ) : (
                                <div className="flex h-full w-full flex-col items-center justify-center text-xs text-muted-foreground">
                                  <ImageIcon className="h-8 w-8 mb-2 opacity-40" />
                                  <span>Envie uma imagem</span>
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
                              <p className="text-xs text-muted-foreground">Recomendado: 960×400px · PNG/JPG</p>
                            </div>
                            {uploadingBannerId === banner.id && (
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Loader2 className="h-3 w-3 animate-spin" />
                                <span>Enviando...</span>
                              </div>
                            )}
                            <div className="space-y-2">
                              <Label>Ou cole a URL</Label>
                              <Input 
                                value={banner.imageUrl} 
                                onChange={(event) => updateBanner(banner.id, { imageUrl: event.target.value })} 
                                placeholder="https://..." 
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Tab: Informações */}
              <TabsContent value="identity" className="mt-4 space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Informações básicas</CardTitle>
                    <CardDescription>Nome e textos exibidos no app</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Nome do site</Label>
                      <Input value={experience.identity.siteName} onChange={(event) => handleIdentityChange("siteName", event.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Slogan</Label>
                      <Input value={experience.identity.tagline} onChange={(event) => handleIdentityChange("tagline", event.target.value)} placeholder="Sua frase de impacto" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Rodapé</CardTitle>
                    <CardDescription>Textos exibidos no rodapé do site</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Copyright</Label>
                      <Input value={experience.identity.footerText} onChange={(event) => handleIdentityChange("footerText", event.target.value)} placeholder="© 2024 PrimeBet..." />
                    </div>
                    <div className="space-y-2">
                      <Label>Descrição do rodapé (legislação)</Label>
                      <Textarea 
                        rows={4} 
                        value={experience.identity.footerDescription || ""} 
                        onChange={(event) => handleIdentityChange("footerDescription", event.target.value)} 
                        placeholder="O grupo PRIMEBET é uma das mais renomadas empresas..." 
                      />
                      <p className="text-xs text-muted-foreground">Texto sobre a empresa, licença e regulamentação</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Contato & Suporte</CardTitle>
                    <CardDescription>Informações exibidas para o jogador</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Email de suporte</Label>
                        <Input type="email" value={experience.identity.supportEmail} onChange={(event) => handleIdentityChange("supportEmail", event.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>WhatsApp</Label>
                        <Input value={experience.identity.whatsapp} onChange={(event) => handleIdentityChange("whatsapp", event.target.value)} placeholder="5521999999999" />
                      </div>
                        {experience.features.showTelegramButton && (
                          <div className="space-y-2 md:col-span-2">
                            <Label>Link do botão flutuante (Telegram)</Label>
                            <Input
                              value={experience.identity.telegramButtonLink || ""}
                              onChange={(event) => handleIdentityChange("telegramButtonLink", event.target.value)}
                              placeholder="https://t.me/seu-suporte"
                            />
                            <p className="text-xs text-muted-foreground">Informe a URL que abrirá ao clicar no botão flutuante</p>
                          </div>
                        )}
                    </div>
                    <Separator />
                    <p className="text-sm font-medium">Redes sociais</p>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Instagram</Label>
                        <Input value={experience.identity.socialLinks.instagram || ""} onChange={(event) => handleSocialLinkChange("instagram", event.target.value)} placeholder="https://instagram.com/..." />
                      </div>
                      <div className="space-y-2">
                        <Label>Telegram</Label>
                        <Input value={experience.identity.socialLinks.telegram || ""} onChange={(event) => handleSocialLinkChange("telegram", event.target.value)} placeholder="https://t.me/..." />
                      </div>
                      <div className="space-y-2">
                        <Label>YouTube</Label>
                        <Input value={experience.identity.socialLinks.youtube || ""} onChange={(event) => handleSocialLinkChange("youtube", event.target.value)} placeholder="https://youtube.com/..." />
                      </div>
                      <div className="space-y-2">
                        <Label>Twitter/X</Label>
                        <Input value={experience.identity.socialLinks.twitter || ""} onChange={(event) => handleSocialLinkChange("twitter", event.target.value)} placeholder="https://x.com/..." />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">SEO</CardTitle>
                    <CardDescription>Metadados para Google e compartilhamento</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Título da página</Label>
                      <Input value={experience.seo.title} onChange={(event) => handleSeoChange("title", event.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Descrição</Label>
                      <Textarea rows={3} value={experience.seo.description} onChange={(event) => handleSeoChange("description", event.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Palavras-chave</Label>
                      <Input value={experience.seo.keywords} onChange={(event) => handleSeoChange("keywords", event.target.value)} placeholder="cassino, slots, crash, investimento" />
                    </div>
                  </CardContent>
                </Card>

                <Card>

                {experience.features.showTelegramButton && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Botão flutuante do Telegram</CardTitle>
                      <CardDescription>Envie a arte que ficará fixa na home direcionando para o atendimento.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-4 md:flex-row md:items-center">
                      <div className="flex h-24 w-24 items-center justify-center rounded-2xl border bg-zinc-900 p-2">
                        {experience.media.telegramButtonImageUrl ? (
                          <img
                            src={experience.media.telegramButtonImageUrl}
                            alt="Botão do Telegram"
                            className="max-h-full max-w-full object-contain"
                          />
                        ) : (
                          <div className="text-center text-xs text-muted-foreground">
                            Nenhuma imagem enviada
                          </div>
                        )}
                      </div>
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-2">
                          <Input
                            type="file"
                            accept="image/png,image/svg+xml,image/webp,image/jpeg"
                            onChange={(event) => handleTelegramButtonUpload(event.target.files?.[0] ?? null)}
                            disabled={uploadingTelegramButton}
                            className="flex-1"
                          />
                          {uploadingTelegramButton && <Loader2 className="h-4 w-4 animate-spin" />}
                        </div>
                        <div className="space-y-1">
                          <Label>Ou cole a URL</Label>
                          <Input
                            value={experience.media.telegramButtonImageUrl || ""}
                            onChange={(event) =>
                              updateExperience((prev) => ({
                                ...prev,
                                media: { ...prev.media, telegramButtonImageUrl: event.target.value },
                              }))
                            }
                            placeholder="https://cdn.sua-bet.com/telegram-button.png"
                          />
                        </div>
                        {experience.media.telegramButtonImageUrl && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() =>
                              updateExperience((prev) => ({
                                ...prev,
                                media: { ...prev.media, telegramButtonImageUrl: "" },
                              }))
                            }
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Remover imagem
                          </Button>
                        )}
                        <p className="text-xs text-muted-foreground">Recomendado PNG/SVG com fundo transparente (até 200×200px).</p>
                      </div>
                    </CardContent>
                  </Card>
                )}
                  <CardHeader>
                    <CardTitle className="text-base">Grid de jogos</CardTitle>
                    <CardDescription>Quantas colunas mostrar na home mobile</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Select value={String(settings?.general.gameColumns ?? 3)} onValueChange={handleGameColumnsChange}>
                      <SelectTrigger className="w-48">
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

              <TabsContent value="navigation" className="mt-4 space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Menu inferior</CardTitle>
                    <CardDescription>Arraste para reordenar e selecione um item para editar.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <DndContext sensors={navSensors} onDragEnd={handleBottomNavDragEnd}>
                      <SortableContext
                        items={bottomNavItems.map((item) => item.id)}
                        strategy={horizontalListSortingStrategy}
                      >
                        <div className="flex flex-wrap gap-3">
                          {bottomNavItems.map((item) => (
                            <BottomNavSortableItem
                              key={item.id}
                              item={item}
                              isActive={item.id === activeBottomNavId}
                              onSelect={setActiveBottomNavId}
                            />
                          ))}
                        </div>
                      </SortableContext>
                    </DndContext>
                    <p className="mt-4 text-xs text-muted-foreground">
                      Arraste horizontalmente para definir a ordem exata que aparecerá no app.
                    </p>
                  </CardContent>
                </Card>

                {activeBottomNavItem && (
                  <Card>
                    <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div>
                        <CardTitle className="text-base">Configurações de "{activeBottomNavItem.label}"</CardTitle>
                        <CardDescription>Ajuste texto, link e ícone exibidos na navegação.</CardDescription>
                      </div>
                      {!activeBottomNavItem.isMandatory && (
                        <div className="flex items-center gap-2 text-sm">
                          <span>Exibir no app</span>
                          <Switch
                            checked={activeBottomNavItem.enabled}
                            onCheckedChange={(checked) => handleBottomNavToggle(activeBottomNavItem.id, checked)}
                          />
                        </div>
                      )}
                    </CardHeader>
                    <CardContent className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Título exibido</Label>
                        <Input
                          value={activeBottomNavItem.label}
                          onChange={(event) =>
                            handleBottomNavItemChange(activeBottomNavItem.id, { label: event.target.value })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Link (rota interna)</Label>
                        <Input
                          value={activeBottomNavItem.href}
                          onChange={(event) =>
                            handleBottomNavItemChange(activeBottomNavItem.id, { href: event.target.value })
                          }
                          placeholder="/perfil"
                        />
                        <p className="text-xs text-muted-foreground">Use caminhos relativos existentes na bet.</p>
                      </div>
                      <div className="space-y-2">
                        <Label>Ícone</Label>
                        <Select
                          value={activeBottomNavItem.icon}
                          onValueChange={(value) => handleBottomNavItemChange(activeBottomNavItem.id, { icon: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o ícone" />
                          </SelectTrigger>
                          <SelectContent>
                            {NAV_ICON_OPTIONS.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                <div className="flex items-center gap-2">
                                  <option.icon className="h-4 w-4" />
                                  <span>{option.label}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      {activeBottomNavItem.isMandatory && (
                        <div className="rounded-xl border border-border/40 bg-muted/30 p-3 text-xs text-muted-foreground">
                          Este botão é obrigatório. Você pode mudar título, link e ícone, mas não é possível desativá-lo.
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Preview rápido</CardTitle>
                    <CardDescription>Veja como o layout curvado ficará com a ordem atual.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <BottomNavPreview items={bottomNavItems} themeSecondary={experience.theme.secondaryColor} />
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Tab: Features */}
              <TabsContent value="features" className="mt-4 space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Funcionalidades</CardTitle>
                    <CardDescription>Ative ou desative recursos do cassino</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {[
                      { key: "showPromoBar", label: "Barra promocional", description: "Exibe o slogan no topo da home." },
                      { key: "showTelegramButton", label: "Botão flutuante Telegram", description: "Exibe um botão fixo levando para o seu atendimento." },
                      { key: "showSupport", label: "Badge de suporte", description: "Etiqueta lateral com status do suporte." },
                      { key: "enableInvestments", label: "Módulo Invest", description: "Habilita a carteira de investimento com rendimentos." },
                      { key: "maintenanceMode", label: "Modo manutenção", description: "Bloqueia o acesso ao cassino com aviso." },
                    ].map((feature) => (
                      <div key={feature.key} className="flex items-start justify-between gap-4 py-2">
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

          {/* Painel de Preview */}
          <div className="space-y-4" ref={previewRef}>
            <Card className="sticky top-6">
              <CardHeader className="pb-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Eye className="h-4 w-4" />
                      Preview em Tempo Real
                    </CardTitle>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={refreshPreview} title="Atualizar preview">
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={openInNewTab} title="Abrir em nova aba">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Seletor de tela - todos na mesma linha */}
                <div className="flex items-center gap-1 mt-4">
                  {PREVIEW_SCREENS.map((screenOption) => (
                    <Button
                      key={screenOption.id}
                      variant={previewScreen === screenOption.id ? "secondary" : "ghost"}
                      size="sm"
                      onClick={() => setPreviewScreen(screenOption.id)}
                      className="h-7 px-2 text-xs"
                    >
                      {screenOption.icon}
                      <span className="ml-1">{screenOption.label}</span>
                    </Button>
                  ))}
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <LivePreview 
                  screen={previewScreen} 
                  previewMode="mobile"
                  previewKey={previewKey}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
