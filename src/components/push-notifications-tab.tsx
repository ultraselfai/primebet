"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Bell,
  Send,
  Trash2,
  Loader2,
  Users,
  Image as ImageIcon,
  Link2,
  CheckCircle,
  XCircle,
} from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface PushNotification {
  id: string;
  title: string;
  body: string;
  bannerUrl: string | null;
  linkUrl: string | null;
  targetType: "ALL" | "SPECIFIC";
  sentAt: string | null;
  createdAt: string;
}

export function PushNotificationsTab() {
  const [notifications, setNotifications] = useState<PushNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [activeSubscriptions, setActiveSubscriptions] = useState(0);
  
  // Formulário
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  const [linkUrl, setLinkUrl] = useState("");

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/push-notifications?limit=10");
      const data = await res.json();
      
      if (data.success) {
        setNotifications(data.notifications || []);
        setActiveSubscriptions(data.activeSubscriptions || 0);
      }
    } catch (error) {
      console.error("Erro ao carregar notificações:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleSend = async () => {
    if (!title.trim() || !body.trim()) {
      toast.error("Título e mensagem são obrigatórios");
      return;
    }

    setSending(true);

    try {
      const res = await fetch("/api/admin/push-notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          body: body.trim(),
          bannerUrl: bannerUrl.trim() || null,
          linkUrl: linkUrl.trim() || null,
          targetType: "ALL",
        }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success(
          `Notificação enviada para ${data.stats.sent} dispositivo(s)!`
        );
        setTitle("");
        setBody("");
        setBannerUrl("");
        setLinkUrl("");
        fetchNotifications();
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error("Erro ao enviar:", error);
      toast.error("Erro ao enviar notificação");
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/push-notifications?id=${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("Notificação removida");
        fetchNotifications();
      }
    } catch (error) {
      console.error("Erro ao deletar:", error);
      toast.error("Erro ao remover notificação");
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(dateString));
  };

  return (
    <div className="space-y-4">
      {/* Stats */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4" />
            Dispositivos Cadastrados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-primary">
              {activeSubscriptions}
            </span>
            <span className="text-sm text-muted-foreground">
              usuários com push ativo
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Form para nova notificação */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Nova Notificação Push
          </CardTitle>
          <CardDescription>
            Envie uma notificação para todos os dispositivos cadastrados
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Título *</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Nova promoção! 🎰"
                maxLength={50}
              />
              <p className="text-xs text-muted-foreground">
                {title.length}/50 caracteres
              </p>
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Link2 className="h-3 w-3" />
                Link (opcional)
              </Label>
              <Input
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://..."
              />
              <p className="text-xs text-muted-foreground">
                URL aberta ao clicar na notificação
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Mensagem *</Label>
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Descreva a promoção ou novidade..."
              rows={3}
              maxLength={200}
            />
            <p className="text-xs text-muted-foreground">
              {body.length}/200 caracteres
            </p>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <ImageIcon className="h-3 w-3" />
              Banner (opcional)
            </Label>
            <Input
              value={bannerUrl}
              onChange={(e) => setBannerUrl(e.target.value)}
              placeholder="https://cdn.exemplo.com/banner.jpg"
            />
            <p className="text-xs text-muted-foreground">
              Imagem exibida junto com a notificação (alguns dispositivos)
            </p>
          </div>

          <Button
            onClick={handleSend}
            disabled={sending || !title.trim() || !body.trim()}
            className="w-full"
          >
            {sending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Enviar para {activeSubscriptions} dispositivo(s)
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Histórico */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Histórico de Notificações</CardTitle>
          <CardDescription>
            Últimas 10 notificações enviadas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Nenhuma notificação enviada ainda</p>
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Título</TableHead>
                    <TableHead>Mensagem</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Enviado em</TableHead>
                    <TableHead className="w-[60px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {notifications.map((notif) => (
                    <TableRow key={notif.id}>
                      <TableCell className="font-medium max-w-[150px] truncate">
                        {notif.title}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate text-muted-foreground">
                        {notif.body}
                      </TableCell>
                      <TableCell>
                        {notif.sentAt ? (
                          <Badge variant="default" className="gap-1">
                            <CheckCircle className="h-3 w-3" />
                            Enviada
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="gap-1">
                            <XCircle className="h-3 w-3" />
                            Rascunho
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(notif.sentAt || notif.createdAt)}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => handleDelete(notif.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
