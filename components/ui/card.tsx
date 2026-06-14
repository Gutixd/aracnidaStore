import { cn } from '@/lib/utils'

interface CardProps {
  children: React.ReactNode
  className?: string
  variant?: 'default' | 'glass' | 'dark'
}

export function Card({ children, className }: CardProps) {
  return (
    <div className={cn('rounded-2xl', className)} style={{ background: '#fff', border: '1px solid var(--gray-100)', boxShadow: 'var(--shadow-sm)' }}>
      {children}
    </div>
  )
}

export function CardHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('p-6', className)} style={{ borderBottom: '1px solid var(--gray-100)' }}>{children}</div>
}

export function CardBody({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('p-6', className)}>{children}</div>
}

export function CardFooter({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('p-6', className)} style={{ borderTop: '1px solid var(--gray-100)' }}>{children}</div>
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
    <div className={cn('stat-card', className)}>
      <div className="flex items-start justify-between mb-4">
        <p className="text-sm font-semibold" style={{ color: 'var(--gray-600)' }}>{title}</p>
        {icon && (
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(192,57,43,.08)', color: 'var(--red)' }}>
            {icon}
          </div>
        )}
      </div>
      <p className="text-2xl font-black mb-1 tabular-nums" style={{ color: 'var(--text)' }}>{value}</p>
      {subtitle && <p className="text-xs" style={{ color: 'var(--gray-400)' }}>{subtitle}</p>}
      {trend && (
        <div className={cn('flex items-center gap-1 mt-2 text-xs font-semibold')} style={{ color: trend.value >= 0 ? '#15803d' : 'var(--red)' }}>
          <span>{trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}%</span>
          <span style={{ color: 'var(--gray-400)' }}>{trend.label}</span>
        </div>
      )}
    </div>
  )
}
