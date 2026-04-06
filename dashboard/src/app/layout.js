import { Inter } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/lib/useAuth"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "FiveM Logs Dashboard",
  description: "Modern log management dashboard",
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <body className={inter.className}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}

