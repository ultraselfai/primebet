"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import {
  Search,
  RefreshCw,
  MoreHorizontal,
  Play,
  Eye,
  Pencil,
  Flame,
  Dices,
  Gamepad2,
  X,
  Plus,
  Save,
  Loader2,
  CheckCircle2,
  XCircle,
  ToggleLeft,
  ToggleRight,
  ImageIcon,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";

// Tipos
interface ProviderGame {
  gameCode: string;
  name: string;
  thumbnail: string;
  rtp: number;
  volatility: string;
  minBet: number;
  maxBet: number;
  isActive: boolean;
}

interface LocalGame extends ProviderGame {
  // Campos editáveis localmente
  customName?: string;
  customThumbnail?: string;
  displayProvider?: string; // Nome do provider que aparece para o usuário (ex: PGSoft)
  category: string;
  tags: string[];
  enabled: boolean; // habilitado na bet
  isHot: boolean;
}

// Categorias padrão
const DEFAULT_CATEGORIES = [
  "Slots",
  "Crash",
  "Ao Vivo",
  "Mesa",
  "Outros",
];

export default function JogosPage() {
  // Estados principais
  const [games, setGames] = useState<LocalGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [providerConnected, setProviderConnected] = useState(false);

  // Filtros
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Modal de edição
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingGame, setEditingGame] = useState<LocalGame | null>(null);
  const [editForm, setEditForm] = useState({
    customName: "",
    customThumbnail: "",
    displayProvider: "",
    category: "",
    tags: [] as string[],
    enabled: false,
    isHot: false,
  });
  const [newTag, setNewTag] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Categorias disponíveis (pode ser expandida pelo admin)
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES);
  const [newCategory, setNewCategory] = useState("");
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);

  // Carregar jogos do provider
  useEffect(() => {
    fetchGames();
  }, []);

  const fetchGames = async () => {
    setLoading(true);
    setError(null);

    try {
      // Primeiro verifica se o provider está conectado
      const testRes = await fetch("/api/provider/test");
      const testData = await testRes.json();

      if (!testData.success) {
        setProviderConnected(false);
        setError("Game Provider não está conectado. Configure em Integrações.");
        setLoading(false);
        return;
      }

      setProviderConnected(true);

      // Busca jogos do provider
      const gamesRes = await fetch("/api/provider/games");
      const gamesData = await gamesRes.json();

      if (gamesData.success && gamesData.data) {
        // Carrega configurações do servidor
        const configRes = await fetch("/api/games/config");
        const configData = await configRes.json();
        const savedConfig: Record<string, Partial<LocalGame>> = configData.success ? configData.data : {};

        // Mescla dados do provider com configurações salvas
        const mergedGames: LocalGame[] = gamesData.data.map((game: ProviderGame) => {
          const saved = savedConfig[game.gameCode] || {};
          return {
            ...game,
            customName: saved.customName || "",
            customThumbnail: saved.customThumbnail || "",
            displayProvider: saved.displayProvider || "",
            category: saved.category || "Slots",
            tags: saved.tags || [],
            enabled: saved.enabled ?? false, // Por padrão vem DESABILITADO
            isHot: saved.isHot ?? false,
          };
        });

        setGames(mergedGames);
      } else {
        setError(gamesData.error || "Erro ao carregar jogos");
      }
    } catch (err) {
      setError("Erro ao conectar com o servidor");
    } finally {
      setLoading(false);
    }
  };

  const syncGames = async () => {
    setSyncing(true);
    await fetchGames();
    setSyncing(false);
  };

  // Salvar configurações no servidor
  const saveGameConfig = async (updatedGames: LocalGame[]) => {
    const config: Record<string, Partial<LocalGame>> = {};
    updatedGames.forEach((game) => {
      config[game.gameCode] = {
        gameCode: game.gameCode,
        customName: game.customName,
        customThumbnail: game.customThumbnail,
        displayProvider: game.displayProvider,
        category: game.category,
        tags: game.tags,
        enabled: game.enabled,
        isHot: game.isHot,
      };
    });
    
    // Salvar no servidor via API
    try {
      await fetch("/api/games/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
    } catch (error) {
      console.error("Erro ao salvar configurações:", error);
    }
  };

  // Toggle habilitado
  const toggleGameEnabled = (gameCode: string) => {
    const updatedGames = games.map((g) =>
      g.gameCode === gameCode ? { ...g, enabled: !g.enabled } : g
    );
    setGames(updatedGames);
    saveGameConfig(updatedGames);
  };

  // Habilitar/Desabilitar todos
  const toggleAllGames = (enabled: boolean) => {
    const updatedGames = games.map((g) => ({ ...g, enabled }));
    setGames(updatedGames);
    saveGameConfig(updatedGames);
  };

  // Abrir modal de edição
  const openEditModal = (game: LocalGame) => {
    setEditingGame(game);
    setEditForm({
      customName: game.customName || "",
      customThumbnail: game.customThumbnail || "",
      displayProvider: game.displayProvider || "",
      category: game.category,
      tags: [...game.tags],
      enabled: game.enabled,
      isHot: game.isHot,
    });
    setEditModalOpen(true);
  };

  // Salvar edição
  const saveEdit = async () => {
    if (!editingGame) return;

    setSavingEdit(true);

    // Simula delay de salvamento
    await new Promise((resolve) => setTimeout(resolve, 500));

    const updatedGames = games.map((g) =>
      g.gameCode === editingGame.gameCode
        ? {
            ...g,
            customName: editForm.customName,
            customThumbnail: editForm.customThumbnail,
            displayProvider: editForm.displayProvider,
            category: editForm.category,
            tags: editForm.tags,
            enabled: editForm.enabled,
            isHot: editForm.isHot,
          }
        : g
    );

    setGames(updatedGames);
    saveGameConfig(updatedGames);
    setSavingEdit(false);
    setEditModalOpen(false);
  };

  // Adicionar tag
  const addTag = () => {
    if (newTag.trim() && !editForm.tags.includes(newTag.trim())) {
      setEditForm((prev) => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()],
      }));
      setNewTag("");
    }
  };

  // Remover tag
  const removeTag = (tag: string) => {
    setEditForm((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t !== tag),
    }));
  };

  // Adicionar nova categoria
  const addCategory = () => {
    if (newCategory.trim() && !categories.includes(newCategory.trim())) {
      setCategories((prev) => [...prev, newCategory.trim()]);
      setEditForm((prev) => ({ ...prev, category: newCategory.trim() }));
      setNewCategory("");
      setShowNewCategoryInput(false);
    }
  };

  // Upload de imagem para R2
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "games");

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setEditForm((prev) => ({ ...prev, customThumbnail: data.url }));
      } else {
        alert(data.error || "Erro ao fazer upload");
      }
    } catch (error) {
      alert("Erro ao fazer upload da imagem");
    } finally {
      setUploadingImage(false);
    }
  };

  // Filtros
  const filteredGames = games.filter((g) => {
    const displayName = g.customName || g.name || "";
    const matchesSearch = displayName.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === "all" || g.category === categoryFilter;
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "enabled" && g.enabled) ||
      (statusFilter === "disabled" && !g.enabled);
    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Stats
  const enabledCount = games.filter((g) => g.enabled).length;
  const usedCategories = [...new Set(games.map((g) => g.category))];

  // Loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Carregando jogos do provider...</p>
      </div>
    );
  }

  // Error state
  if (error && !providerConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <XCircle className="w-12 h-12 text-destructive" />
        <p className="text-lg font-medium">Erro ao carregar jogos</p>
        <p className="text-muted-foreground text-center max-w-md">{error}</p>
        <Button onClick={() => window.location.href = "/integracoes"}>
          Ir para Integrações
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-4 lg:px-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold tracking-tight">Gerenciar Jogos</h1>
          <p className="text-muted-foreground">
            Jogos disponíveis do Game Provider - Habilite para exibir na Bet
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={syncGames} disabled={syncing}>
            <RefreshCw className={`w-4 h-4 mr-2 ${syncing ? "animate-spin" : ""}`} />
            {syncing ? "Sincronizando..." : "Sincronizar"}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Jogos Habilitados</CardDescription>
            <CardTitle className="text-2xl flex items-center gap-2">
              {enabledCount} / {games.length}
              {enabledCount > 0 && <CheckCircle2 className="w-5 h-5 text-green-500" />}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {Math.round((enabledCount / games.length) * 100) || 0}% ativos na Bet
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total do Provider</CardDescription>
            <CardTitle className="text-2xl">{games.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Jogos disponíveis
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Categorias</CardDescription>
            <CardTitle className="text-2xl">{usedCategories.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Em uso
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Provider</CardDescription>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Gamepad2 className="w-5 h-5" />
              Ultraself
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant="default" className="bg-green-500">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Conectado
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar jogo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-[150px]">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="enabled">Habilitados</SelectItem>
              <SelectItem value="disabled">Desabilitados</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Bulk actions */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => toggleAllGames(true)}
            className="text-green-600 hover:text-green-700"
          >
            <ToggleRight className="w-4 h-4 mr-2" />
            Habilitar Todos
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => toggleAllGames(false)}
            className="text-red-600 hover:text-red-700"
          >
            <ToggleLeft className="w-4 h-4 mr-2" />
            Desabilitar Todos
          </Button>
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Jogo</TableHead>
                <TableHead>Código</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Tags</TableHead>
                <TableHead>RTP</TableHead>
                <TableHead>Habilitado</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredGames.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Nenhum jogo encontrado
                  </TableCell>
                </TableRow>
              ) : (
                filteredGames.map((game) => (
                  <TableRow key={game.gameCode} className={!game.enabled ? "opacity-60" : ""}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-muted overflow-hidden flex items-center justify-center">
                          {game.customThumbnail || game.thumbnail ? (
                            <Image
                              src={game.customThumbnail || game.thumbnail}
                              alt={game.customName || game.name || game.gameCode || "Jogo"}
                              width={48}
                              height={48}
                              className="object-cover w-full h-full"
                            />
                          ) : (
                            <Dices className="w-6 h-6 text-muted-foreground" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{game.customName || game.name || game.gameCode}</p>
                            {game.isHot && (
                              <Flame className="w-4 h-4 text-orange-500" />
                            )}
                          </div>
                          {game.customName && game.customName !== game.name && (
                            <p className="text-xs text-muted-foreground">
                              Original: {game.name}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-2 py-1 rounded">
                        {game.gameCode}
                      </code>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {game.category}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1 max-w-[150px]">
                        {game.tags.slice(0, 2).map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {game.tags.length > 2 && (
                          <Badge variant="secondary" className="text-xs">
                            +{game.tags.length - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{game.rtp}%</TableCell>
                    <TableCell>
                      <Switch
                        checked={game.enabled}
                        onCheckedChange={() => toggleGameEnabled(game.gameCode)}
                      />
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Ações</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => openEditModal(game)}>
                            <Pencil className="w-4 h-4 mr-2" />
                            Editar jogo
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Play className="w-4 h-4 mr-2" />
                            Testar jogo
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Eye className="w-4 h-4 mr-2" />
                            Ver detalhes
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => {
                              const updatedGames = games.map((g) =>
                                g.gameCode === game.gameCode ? { ...g, isHot: !g.isHot } : g
                              );
                              setGames(updatedGames);
                              saveGameConfig(updatedGames);
                            }}
                          >
                            <Flame className="w-4 h-4 mr-2" />
                            {game.isHot ? "Remover destaque" : "Marcar como Hot"}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="w-5 h-5" />
              Editar Jogo
            </DialogTitle>
            <DialogDescription>
              Personalize como o jogo aparece na sua Bet
            </DialogDescription>
          </DialogHeader>

          {editingGame && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
              {/* Coluna Esquerda */}
              <div className="space-y-4">
                {/* Preview */}
                <div className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
                  <div className="w-16 h-16 rounded-lg bg-muted overflow-hidden flex items-center justify-center">
                    {editForm.customThumbnail || editingGame.thumbnail ? (
                      <Image
                        src={editForm.customThumbnail || editingGame.thumbnail}
                        alt={editForm.customName || editingGame.name || editingGame.gameCode || "Jogo"}
                        width={64}
                        height={64}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <ImageIcon className="w-8 h-8 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">
                      {editForm.customName || editingGame.name || editingGame.gameCode}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {editingGame.gameCode} • RTP: {editingGame.rtp}%
                    </p>
                  </div>
                </div>

                {/* Nome customizado */}
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Nome do Jogo</Label>
                  <Input
                    id="edit-name"
                    value={editForm.customName}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, customName: e.target.value }))}
                    placeholder={editingGame.name}
                  />
                  <p className="text-xs text-muted-foreground">
                    Deixe em branco para usar o nome original
                  </p>
                </div>

                {/* Nome do Provider exibido */}
                <div className="space-y-2">
                  <Label htmlFor="edit-provider">Provider (exibido na Bet)</Label>
                  <Input
                    id="edit-provider"
                    value={editForm.displayProvider}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, displayProvider: e.target.value }))}
                    placeholder="Ex: PGSoft, Pragmatic..."
                  />
                  <p className="text-xs text-muted-foreground">
                    Nome que aparece no card do jogo
                  </p>
                </div>

                {/* Categoria */}
                <div className="space-y-2">
                  <Label>Categoria</Label>
                  {!showNewCategoryInput ? (
                    <Select
                      value={editForm.category}
                      onValueChange={(value) => {
                        if (value === "__new__") {
                          setShowNewCategoryInput(true);
                        } else {
                          setEditForm((prev) => ({ ...prev, category: value }));
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                        <SelectItem value="__new__">
                          <span className="flex items-center gap-2 text-primary">
                            <Plus className="w-4 h-4" />
                            Criar categoria
                          </span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="flex gap-2">
                      <Input
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value)}
                        placeholder="Nova categoria"
                        autoFocus
                      />
                      <Button size="sm" onClick={addCategory}>
                        <Plus className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setShowNewCategoryInput(false);
                          setNewCategory("");
                        }}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Coluna Direita */}
              <div className="space-y-4">
                {/* Thumbnail customizada */}
                <div className="space-y-2">
                  <Label>Capa do Jogo</Label>
                  <div className="flex items-start gap-3">
                    <div className="w-24 h-32 rounded-lg bg-muted overflow-hidden flex items-center justify-center border-2 border-dashed border-muted-foreground/25">
                      {editForm.customThumbnail || editingGame.thumbnail ? (
                        <Image
                          src={editForm.customThumbnail || editingGame.thumbnail}
                          alt="Preview"
                          width={96}
                          height={128}
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <ImageIcon className="w-8 h-8 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 space-y-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={uploadingImage}
                        onClick={() => document.getElementById("thumbnail-upload")?.click()}
                        className="w-full"
                      >
                        {uploadingImage ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Enviando...
                          </>
                        ) : (
                          <>
                            <ImageIcon className="w-4 h-4 mr-2" />
                            Enviar Imagem
                          </>
                        )}
                      </Button>
                      {editForm.customThumbnail && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="w-full"
                          onClick={() => setEditForm((prev) => ({ ...prev, customThumbnail: "" }))}
                        >
                          <X className="w-4 h-4 mr-2" />
                          Remover
                        </Button>
                      )}
                      <input
                        id="thumbnail-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageUpload}
                      />
                      <p className="text-xs text-muted-foreground">
                        JPG, PNG, GIF ou WebP. Máx 5MB.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Tags */}
                <div className="space-y-2">
                  <Label>Tags</Label>
                  <div className="flex flex-wrap gap-2 min-h-[32px]">
                    {editForm.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="gap-1">
                        {tag}
                        <button
                          onClick={() => removeTag(tag)}
                          className="ml-1 hover:text-destructive"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      placeholder="Adicionar tag..."
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                    />
                    <Button size="sm" variant="outline" onClick={addTag}>
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Toggles */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div>
                      <Label>Habilitado na Bet</Label>
                      <p className="text-xs text-muted-foreground">
                        Jogo aparece para os jogadores
                      </p>
                    </div>
                    <Switch
                      checked={editForm.enabled}
                      onCheckedChange={(checked) =>
                        setEditForm((prev) => ({ ...prev, enabled: checked }))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div>
                      <Label className="flex items-center gap-2">
                        Destaque
                        <Flame className="w-4 h-4 text-orange-500" />
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Marcar como jogo popular/hot
                      </p>
                    </div>
                    <Switch
                      checked={editForm.isHot}
                      onCheckedChange={(checked) =>
                        setEditForm((prev) => ({ ...prev, isHot: checked }))
                      }
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setEditModalOpen(false)}>
              <X className="w-4 h-4 mr-2" />
              Cancelar
            </Button>
            <Button onClick={saveEdit} disabled={savingEdit}>
              {savingEdit ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              {savingEdit ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
