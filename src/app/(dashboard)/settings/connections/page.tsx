"use client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Github, Slack, Twitter, Zap, Globe, Database, Apple, Chrome, Facebook, Instagram, Dribbble, Gamepad2, Eye, EyeOff, CheckCircle2, XCircle, Loader2, RefreshCw } from "lucide-react"
import { useState, useEffect } from "react"

export default function ConnectionSettings() {
  // Controlled state for switches
  const [appleConnected, setAppleConnected] = useState(true)
  const [googleConnected, setGoogleConnected] = useState(false)
  const [githubConnected, setGithubConnected] = useState(true)
  const [slackConnected, setSlackConnected] = useState(false)
  const [zapierConnected, setZapierConnected] = useState(true)
  const [webhooksConnected, setWebhooksConnected] = useState(false)
  const [dbConnected, setDbConnected] = useState(true)

  // Game Provider state
  const [providerUrl, setProviderUrl] = useState("https://api.gameprovider.fun/api/v1")
  const [providerApiKey, setProviderApiKey] = useState("")
  const [providerApiSecret, setProviderApiSecret] = useState("")
  const [showApiKey, setShowApiKey] = useState(false)
  const [showApiSecret, setShowApiSecret] = useState(false)
  const [providerStatus, setProviderStatus] = useState<"idle" | "testing" | "connected" | "error">("idle")
  const [providerInfo, setProviderInfo] = useState<{ agentName?: string; spinCredits?: number } | null>(null)
  const [providerError, setProviderError] = useState<string | null>(null)

  // Test Game Provider connection
  const testProviderConnection = async () => {
    setProviderStatus("testing")
    setProviderError(null)
    setProviderInfo(null)

    try {
      const response = await fetch("/api/provider/test")
      const data = await response.json()

      if (data.success) {
        setProviderStatus("connected")
        setProviderInfo({ agentName: data.agentName, spinCredits: data.spinCredits })
      } else {
        setProviderStatus("error")
        setProviderError(data.error || "Falha na conexão")
      }
    } catch (error) {
      setProviderStatus("error")
      setProviderError("Erro ao conectar com o servidor")
    }
  }

  // Check connection on mount
  useEffect(() => {
    testProviderConnection()
  }, [])

  return (
    <div className="space-y-6 px-4 lg:px-6">
        <div>
          <h1 className="text-3xl font-bold">Integrações</h1>
          <p className="text-muted-foreground">
            Conecte sua conta com serviços de terceiros e integrações.
          </p>
        </div>

        {/* Game Provider Integration - PRIMEIRO CARD */}
        <Card className="border-2 border-primary/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Gamepad2 className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="flex items-center gap-2">
                    Game Provider
                    {providerStatus === "connected" && (
                      <Badge variant="default" className="bg-green-500 hover:bg-green-600">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Conectado
                      </Badge>
                    )}
                    {providerStatus === "error" && (
                      <Badge variant="destructive">
                        <XCircle className="h-3 w-3 mr-1" />
                        Erro
                      </Badge>
                    )}
                    {providerStatus === "testing" && (
                      <Badge variant="secondary">
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        Testando...
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription>
                    Configurações de conexão com o provedor de jogos (PGSoft)
                  </CardDescription>
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={testProviderConnection}
                disabled={providerStatus === "testing"}
                className="cursor-pointer"
              >
                {providerStatus === "testing" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                <span className="ml-2">Testar Conexão</span>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Status info */}
            {providerStatus === "connected" && providerInfo && (
              <div className="p-4 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-2 text-green-700 dark:text-green-400 font-medium mb-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Conexão estabelecida com sucesso!
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Agente:</span>
                    <span className="ml-2 font-medium">{providerInfo.agentName}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Créditos de Spin:</span>
                    <span className="ml-2 font-medium">{providerInfo.spinCredits?.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            )}

            {providerStatus === "error" && providerError && (
              <div className="p-4 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-200 dark:border-red-800">
                <div className="flex items-center gap-2 text-red-700 dark:text-red-400 font-medium">
                  <XCircle className="h-4 w-4" />
                  {providerError}
                </div>
              </div>
            )}

            {/* API URL */}
            <div className="space-y-2">
              <Label htmlFor="provider-url">URL da API</Label>
              <Input
                id="provider-url"
                type="text"
                value={providerUrl}
                onChange={(e) => setProviderUrl(e.target.value)}
                placeholder="https://api.gameprovider.fun/api/v1"
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Endpoint base da API do Game Provider
              </p>
            </div>

            {/* API Key */}
            <div className="space-y-2">
              <Label htmlFor="provider-api-key">API Key</Label>
              <div className="relative">
                <Input
                  id="provider-api-key"
                  type={showApiKey ? "text" : "password"}
                  value={providerApiKey}
                  onChange={(e) => setProviderApiKey(e.target.value)}
                  placeholder="ag_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  className="font-mono text-sm pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent cursor-pointer"
                  onClick={() => setShowApiKey(!showApiKey)}
                >
                  {showApiKey ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Chave de identificação fornecida pelo Game Provider
              </p>
            </div>

            {/* API Secret */}
            <div className="space-y-2">
              <Label htmlFor="provider-api-secret">API Secret</Label>
              <div className="relative">
                <Input
                  id="provider-api-secret"
                  type={showApiSecret ? "text" : "password"}
                  value={providerApiSecret}
                  onChange={(e) => setProviderApiSecret(e.target.value)}
                  placeholder="••••••••••••••••••••••••••••••••••••••••"
                  className="font-mono text-sm pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent cursor-pointer"
                  onClick={() => setShowApiSecret(!showApiSecret)}
                >
                  {showApiSecret ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Chave secreta para autenticação. <span className="text-amber-600 dark:text-amber-400">Nunca compartilhe esta chave!</span>
              </p>
            </div>

            <Separator />

            <div className="flex justify-end gap-3">
              <Button variant="outline" className="cursor-pointer">
                Cancelar
              </Button>
              <Button className="cursor-pointer">
                Salvar Configurações
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Connected Accounts</CardTitle>
              <CardDescription>
                Display content from your connected accounts on your site
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Apple className="h-8 w-8" />
                    <div>
                      <div className="font-medium">Apple</div>
                      <div className="text-sm text-muted-foreground">Calendar and contacts</div>
                    </div>
                  </div>
                  <Switch
                    className="cursor-pointer"
                    checked={appleConnected}
                    onCheckedChange={setAppleConnected}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Chrome className="h-8 w-8" />
                    <div>
                      <div className="font-medium">Google</div>
                      <div className="text-sm text-muted-foreground">Calendar and contacts</div>
                    </div>
                  </div>
                  <Switch
                    className="cursor-pointer"
                    checked={googleConnected}
                    onCheckedChange={setGoogleConnected}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Github className="h-8 w-8" />
                    <div>
                      <div className="font-medium">Github</div>
                      <div className="text-sm text-muted-foreground">Manage your Git repositories</div>
                    </div>
                  </div>
                  <Switch
                    className="cursor-pointer"
                    checked={githubConnected}
                    onCheckedChange={setGithubConnected}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Slack className="h-8 w-8" />
                    <div>
                      <div className="font-medium">Slack</div>
                      <div className="text-sm text-muted-foreground">Communication</div>
                    </div>
                  </div>
                  <Switch
                    className="cursor-pointer"
                    checked={slackConnected}
                    onCheckedChange={setSlackConnected}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Social Accounts</CardTitle>
              <CardDescription>
                Display content from your connected accounts on your site
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Facebook className="h-8 w-8" />
                    <div>
                      <div className="font-medium">
                        Facebook
                        <Badge variant="outline" className="ml-2">Not Connected</Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">Share updates on Facebook</div>
                    </div>
                  </div>
                  <Button variant="outline" size="icon" className="cursor-pointer">
                    <Globe className="h-4 w-4" />
                  </Button>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Twitter className="h-8 w-8" />
                    <div>
                      <div className="font-medium">
                        Twitter
                        <Badge variant="secondary" className="ml-2">connected</Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">Share updates on Twitter</div>
                    </div>
                  </div>
                  <Button variant="outline" size="icon" className="cursor-pointer text-destructive">
                    <Globe className="h-4 w-4" />
                  </Button>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Instagram className="h-8 w-8" />
                    <div>
                      <div className="font-medium">
                        Instagram
                        <Badge variant="secondary" className="ml-2">connected</Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">Stay connected at Instagram</div>
                    </div>
                  </div>
                  <Button variant="outline" size="icon" className="cursor-pointer text-destructive">
                    <Globe className="h-4 w-4" />
                  </Button>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Dribbble className="h-8 w-8" />
                    <div>
                      <div className="font-medium">
                        Dribbble
                        <Badge variant="outline" className="ml-2">Not Connected</Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">Stay connected at Dribbble</div>
                    </div>
                  </div>
                  <Button variant="outline" size="icon" className="cursor-pointer">
                    <Globe className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>API Integrations</CardTitle>
              <CardDescription>
                Configure API connections and webhooks.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Zap className="h-8 w-8" />
                    <div>
                      <div className="font-medium">Zapier</div>
                      <div className="text-sm text-muted-foreground">Automate workflows with Zapier</div>
                    </div>
                  </div>
                  <Switch
                    className="cursor-pointer"
                    checked={zapierConnected}
                    onCheckedChange={setZapierConnected}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Globe className="h-8 w-8" />
                    <div>
                      <div className="font-medium">Webhooks</div>
                      <div className="text-sm text-muted-foreground">Configure custom webhook endpoints</div>
                    </div>
                  </div>
                  <Switch
                    className="cursor-pointer"
                    checked={webhooksConnected}
                    onCheckedChange={setWebhooksConnected}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Database className="h-8 w-8" />
                    <div>
                      <div className="font-medium">Database Sync</div>
                      <div className="text-sm text-muted-foreground">Sync data with external databases</div>
                    </div>
                  </div>
                  <Switch
                    className="cursor-pointer"
                    checked={dbConnected}
                    onCheckedChange={setDbConnected}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>API Keys</CardTitle>
              <CardDescription>
                Manage your API keys and access tokens.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <div className="font-medium">Production API Key</div>
                    <div className="text-sm text-muted-foreground font-mono">sk_live_••••••••••••••••••••••••4234</div>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" className="cursor-pointer">
                      Regenerate
                    </Button>
                    <Button variant="outline" size="sm" className="cursor-pointer">
                      Copy
                    </Button>
                  </div>
                </div>
                <Separator />
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <div className="font-medium">Development API Key</div>
                    <div className="text-sm text-muted-foreground font-mono">sk_test_••••••••••••••••••••••••5678</div>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" className="cursor-pointer">
                      Regenerate
                    </Button>
                    <Button variant="outline" size="sm" className="cursor-pointer">
                      Copy
                    </Button>
                  </div>
                </div>
                <Separator />
                <div className="pt-4">
                  <Button variant="outline" className="cursor-pointer">Add New API Key</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
  )
}
