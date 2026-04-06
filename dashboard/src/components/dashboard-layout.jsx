import { Sidebar } from "@/components/sidebar"
import { Navbar } from "@/components/navbar"

export function DashboardLayout({ children }) {
  return (
    <div className="h-full relative bg-black">
      <div className="hidden h-full md:flex md:w-72 md:flex-col md:fixed md:inset-y-0 z-80">
        <Sidebar />
      </div>
      <main className="md:pl-72 min-h-screen">
        <Navbar />
        <div className="p-8 bg-gradient-to-b from-black via-zinc-950 to-black">
          {children}
        </div>
      </main>
    </div>
  )
}

