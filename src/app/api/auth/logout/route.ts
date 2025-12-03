import { NextResponse } from "next/server"

const sharedCookies = [
  "authjs.session-token",
  "__Secure-authjs.session-token",
  "next-auth.session-token",
  "__Secure-next-auth.session-token",
  "authjs.callback-url",
  "__Secure-authjs.callback-url",
  "next-auth.callback-url",
  "__Secure-next-auth.callback-url",
]

const hostOnlyCookies = [
  "__Host-authjs.csrf-token",
  "__Host-next-auth.csrf-token",
]

const clientReadableCookies = [
  "authjs.csrf-token",
  "next-auth.csrf-token",
]

export async function POST() {
  const response = NextResponse.json({ success: true })
  const isProduction = process.env.NODE_ENV === "production"
  const baseDomain = isProduction ? ".primebet.space" : undefined

  const expireDate = new Date(0)

  const buildSharedCookie = (name: string) => ({
    name,
    value: "",
    expires: expireDate,
    path: "/",
    httpOnly: true,
    sameSite: "lax" as const,
    secure: isProduction,
    ...(baseDomain ? { domain: baseDomain } : {}),
  })

  const buildHostCookie = (name: string) => ({
    name,
    value: "",
    expires: expireDate,
    path: "/",
    httpOnly: false,
    sameSite: "lax" as const,
    secure: isProduction,
  })

  sharedCookies.forEach((cookieName) => {
    response.cookies.set(buildSharedCookie(cookieName))
  })

  hostOnlyCookies.forEach((cookieName) => {
    response.cookies.set(buildHostCookie(cookieName))
  })

  clientReadableCookies.forEach((cookieName) => {
    response.cookies.set(buildHostCookie(cookieName))
  })

  response.cookies.set({
    name: "impersonating_user",
    value: "",
    expires: expireDate,
    path: "/",
    httpOnly: false,
    sameSite: "lax",
    secure: isProduction,
    ...(baseDomain ? { domain: baseDomain } : {}),
  })

  return response
}
