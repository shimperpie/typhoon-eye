import { type ReactNode } from 'react'

interface GlassCardProps {
  children: ReactNode
  className?: string
  glow?: boolean
}

export default function GlassCard({ children, className = '', glow = false }: GlassCardProps) {
  return (
    <div
      className={`
        rounded-xl border backdrop-blur-xl overflow-hidden
        bg-[var(--color-glass-bg)] border-[var(--color-border)]
        ${glow ? 'shadow-[0_0_30px_rgba(59,130,246,0.15)]' : 'shadow-[0_8px_32px_rgba(0,0,0,0.15)]'}
        ${className}
      `}
    >
      {children}
    </div>
  )
}
