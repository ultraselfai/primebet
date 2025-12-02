import { Heart } from "lucide-react"
import Link from "next/link"

export function SiteFooter() {
  return (
    <footer className="border-t bg-background">
      <div className="px-4 py-6 lg:px-6">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="flex items-center space-x-1 text-sm text-muted-foreground">
            <span>Desenvolvido por</span>
            <Link
              href="https://decode.ink"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-foreground hover:text-primary transition-colors"
            >
              Decode.ink
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
