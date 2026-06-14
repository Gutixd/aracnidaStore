import { cn } from '@/lib/utils'

interface CardProps {
  children: React.ReactNode
  className?: string
  variant?: 'default' | 'glass' | 'dark'
}

export function Card({ children, className, variant = 'default' }: CardProps) {
  const variants = {
    default: 'bg-[#111827] border border-white/5',
    glass: 'bg-white/5 backdrop-blur-md border border-white/10',
    dark: 'bg-[#0d1117] border border-white/5',
  }

  return (
    <div className={cn('rounded-xl', variants[variant], className)}>
      {children}
    </div>
  )
}

export function CardHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('p-6 border-b border-white/5', className)}>{children}</div>
}

export function CardBody({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('p-6', className)}>{children}</div>
}

export function CardFooter({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('p-6 border-t border-white/5', className)}>{children}</div>
}

interface StatCardProps {
  title: string
  value: string
  subtitle?: string
  icon?: React.ReactNode
  trend?: { value: number; label: string }
  className?: string
}

export function StatCard({ title, value, subtitle, icon, trend, className }: StatCardProps) {
  return (
    <Card className={cn('p-6', className)}>
      <div className="flex items-start justify-between mb-4">
        <p className="text-sm font-medium text-white/50">{title}</p>
        {icon && (
          <div className="w-10 h-10 bg-red-700/10 rounded-lg flex items-center justify-center text-red-400">
            {icon}
          </div>
        )}
      </div>
      <p className="text-2xl font-bold text-white mb-1">{value}</p>
      {subtitle && <p className="text-xs text-white/40">{subtitle}</p>}
      {trend && (
        <div className={cn('flex items-center gap-1 mt-2 text-xs font-medium', trend.value >= 0 ? 'text-green-400' : 'text-red-400')}>
          <span>{trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}%</span>
          <span className="text-white/30">{trend.label}</span>
        </div>
      )}
    </Card>
  )
}
