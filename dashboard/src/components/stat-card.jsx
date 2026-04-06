import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export function StatCard({ title, value, description, icon: Icon, trend, color = "blue" }) {
  const colorClasses = {
    blue: "text-blue-400",
    green: "text-emerald-400",
    yellow: "text-amber-400",
    purple: "text-purple-400",
    red: "text-red-400"
  }

  return (
    <Card className="bg-zinc-900/50 border-zinc-800 backdrop-blur">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-zinc-400">
          {title}
        </CardTitle>
        {Icon && <Icon className={cn("h-4 w-4", colorClasses[color])} />}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-white">{value}</div>
        {description && (
          <p className="text-xs text-zinc-500 mt-1">
            {description}
          </p>
        )}
        {trend && (
          <div className={cn(
            "text-xs mt-1 font-medium",
            trend > 0 ? "text-emerald-400" : "text-red-400"
          )}>
            {trend > 0 ? "↑" : "↓"} {Math.abs(trend)}%
          </div>
        )}
      </CardContent>
    </Card>
  )
}

