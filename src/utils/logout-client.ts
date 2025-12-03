"use client"

import { signOut } from "next-auth/react"

function buildTargetUrl(pathOrUrl: string) {
  if (!pathOrUrl) return "/"
  if (/^https?:\/\//i.test(pathOrUrl)) {
    return pathOrUrl
  }
  const normalized = pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`
  if (typeof window === "undefined") {
    return normalized
  }
  return `${window.location.origin}${normalized}`
}

export async function logoutAndRedirect(pathOrUrl: string) {
  const target = buildTargetUrl(pathOrUrl)

  try {
    const response = await fetch("/api/auth/logout", {
      method: "POST",
      cache: "no-store",
    })

    if (!response.ok) {
      console.error("Falha ao limpar cookies de sessão", await response.text())
    }
  } catch (error) {
    console.error("Erro ao chamar logout API:", error)
  }

  try {
    await signOut({ redirect: false })
  } catch (error) {
    console.error("Erro ao chamar signOut do NextAuth:", error)
  }

  if (typeof window !== "undefined") {
    window.location.href = target
  }

  return target
}
