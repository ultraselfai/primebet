"use client"

import * as React from "react"
import {
  LayoutDashboard,
  Gamepad2,
  Users,
  Plug,
  Landmark,
  Palette,
  Settings,
  TrendingUp,
  ArrowDownToLine,
  ArrowUpFromLine,
  History,
  ShieldCheck,
  BarChart3,
  PiggyBank,
  Wallet,
  FileCheck,
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { Logo } from "@/components/logo"
import { usePublicSettings } from "@/contexts/public-settings-context"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const data = {
  user: {
    name: "Admin",
    email: "admin@primebet.com",
    avatar: "",
  },
  navGroups: [
    {
      label: "Visão Geral",
      items: [
        {
          title: "Dashboard",
          url: "/dashboard",
          icon: LayoutDashboard,
        },
        {
          title: "Relatórios",
          url: "/relatorios",
          icon: BarChart3,
        },
      ],
    },
    {
      label: "Financeiro",
      items: [
        {
          title: "Depósitos",
          url: "/financeiro/depositos",
          icon: ArrowDownToLine,
        },
        {
          title: "Saques",
          url: "/financeiro/saques",
          icon: ArrowUpFromLine,
        },
        {
          title: "Extrato Geral",
          url: "/financeiro/extrato",
          icon: History,
        },
      ],
    },
    {
      label: "Investimentos",
      items: [
        {
          title: "Carteiras",
          url: "/investimentos/carteiras",
          icon: PiggyBank,
        },
        {
          title: "Rendimentos",
          url: "/investimentos/rendimentos",
          icon: TrendingUp,
        },
        {
          title: "Liberações",
          url: "/investimentos/liberacoes",
          icon: Wallet,
        },
      ],
    },
    {
      label: "Operações",
      items: [
        {
          title: "Jogos",
          url: "/jogos",
          icon: Gamepad2,
        },
        {
          title: "Usuários",
          url: "/users",
          icon: Users,
        },
        {
          title: "KYC / Verificação",
          url: "/usuarios/kyc",
          icon: ShieldCheck,
        },
        {
          title: "Aprovações",
          url: "/aprovacoes",
          icon: FileCheck,
        },
      ],
    },
    {
      label: "Sistema",
      items: [
        {
          title: "Integrações",
          url: "/integracoes",
          icon: Plug,
        },
        {
          title: "Banking (FBSPAY)",
          url: "/banking",
          icon: Landmark,
        },
        {
          title: "Editor Visual",
          url: "/editor",
          icon: Palette,
        },
        {
          title: "Configurações",
          url: "/configuracoes",
          icon: Settings,
        },
      ],
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { settings } = usePublicSettings();
  
  // Usar favicon ou logo das configurações
  const sidebarIconUrl = settings?.experience?.media?.favicon?.url || settings?.experience?.media?.logo?.url;
  const siteName = settings?.experience?.identity?.siteName || "PrimeBet";

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/dashboard">
                <div className="flex size-8 items-center justify-center shrink-0">
                  {sidebarIconUrl ? (
                    <Image
                      src={sidebarIconUrl}
                      alt={siteName}
                      width={32}
                      height={32}
                      className="object-contain w-8 h-8"
                    />
                  ) : (
                    <div className="flex items-center justify-center rounded-lg bg-primary text-primary-foreground size-8">
                      <Logo size={24} className="text-current" />
                    </div>
                  )}
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{siteName}</span>
                  <span className="truncate text-xs">Painel Administrativo</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {data.navGroups.map((group) => (
          <NavMain key={group.label} label={group.label} items={group.items} />
        ))}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  )
}
