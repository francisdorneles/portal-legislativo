/**
 * Sistema de UI do CRM — wrappers sobre shadcn/ui (Radix + Tailwind v4).
 *
 * As páginas importam destes primitivos; por baixo usam os componentes do shadcn
 * (`./button`, `./input`, `./textarea`, `./table`, `./card`). Mantemos `<select>` NATIVO
 * (o Select do Radix não envia valor em form nativo, e os cadastros usam server actions).
 * Polish do skill preservado: tabular-nums, text-wrap, foco, hit area.
 */
import Link from 'next/link'
import type { ComponentProps, ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button as ShButton, buttonVariants } from './button'
import { Input as ShInput } from './input'
import { Textarea as ShTextarea } from './textarea'
import { Table as ShTable, TableHead, TableCell, TableRow } from './table'

/* ---------------- tokens reutilizáveis ---------------- */
export const selectCls =
  'h-9 w-full appearance-none rounded-lg border border-input bg-card px-3 pr-9 text-sm text-foreground shadow-xs outline-none transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40 disabled:opacity-50'
export const panelCls = 'rounded-xl border border-border bg-card text-card-foreground shadow-sm'

/** Botão-ícone padrão de grid (ERP): quadrado, hover discreto, foco acessível, ícone 16px. */
export const iconBtnCls =
  'inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 [&>svg]:h-4 [&>svg]:w-4'
export const iconBtnDangerCls =
  'inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive/40 [&>svg]:h-4 [&>svg]:w-4'

/* ---------------- layout de página ---------------- */
export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string
  subtitle?: ReactNode
  actions?: ReactNode
}) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <div>
        <h1 className="text-balance text-2xl font-semibold tracking-tight">{title}</h1>
        {subtitle != null && <p className="mt-1 text-pretty text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {actions != null && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  )
}

export function Panel({ className = '', children }: { className?: string; children: ReactNode }) {
  return <div className={cn(panelCls, className)}>{children}</div>
}

export function PanelHeader({ title, action }: { title: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
      <h2 className="text-sm font-semibold">{title}</h2>
      {action}
    </div>
  )
}

/* ---------------- botões (mapeiam para variants do shadcn) ---------------- */
type BtnVariant = 'primary' | 'ghost' | 'danger'
const mapVariant: Record<BtnVariant, 'default' | 'ghost' | 'destructive'> = {
  primary: 'default',
  ghost: 'ghost',
  danger: 'destructive',
}

export function Button({
  variant = 'primary',
  ...rest
}: { variant?: BtnVariant } & Omit<ComponentProps<typeof ShButton>, 'variant'>) {
  return <ShButton variant={mapVariant[variant]} {...rest} />
}

export function ButtonLink({
  variant = 'primary',
  className = '',
  ...rest
}: { variant?: BtnVariant } & ComponentProps<typeof Link>) {
  return <Link className={cn(buttonVariants({ variant: mapVariant[variant] }), className)} {...rest} />
}

/* ---------------- form ---------------- */
export function Field({
  label,
  htmlFor,
  hint,
  required,
  className = '',
  children,
}: {
  label: string
  htmlFor?: string
  hint?: string
  required?: boolean
  className?: string
  children: ReactNode
}) {
  return (
    <label htmlFor={htmlFor} className={cn('flex flex-col gap-1.5', className)}>
      <span className="text-[13px] font-medium">
        {label}
        {required && <span className="ml-0.5 text-destructive">*</span>}
      </span>
      {children}
      {hint && <span className="text-pretty text-xs text-muted-foreground">{hint}</span>}
    </label>
  )
}

export function Input(props: ComponentProps<typeof ShInput>) {
  return <ShInput {...props} />
}
export function Textarea(props: ComponentProps<typeof ShTextarea>) {
  return <ShTextarea {...props} />
}
export function Select({ className, children, ...props }: ComponentProps<'select'>) {
  return (
    <div className="relative">
      <select className={cn(selectCls, className)} {...props}>
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
    </div>
  )
}

/* ---------------- badge (tons semânticos — complementa o Badge do shadcn) ---------------- */
type BadgeTone = 'slate' | 'blue' | 'green' | 'amber' | 'red' | 'violet' | 'indigo'
const badgeTone: Record<BadgeTone, string> = {
  slate: 'bg-slate-100 text-slate-600',
  blue: 'bg-blue-100 text-blue-700',
  green: 'bg-green-100 text-green-700',
  amber: 'bg-amber-100 text-amber-800',
  red: 'bg-red-100 text-red-700',
  violet: 'bg-violet-100 text-violet-700',
  indigo: 'bg-indigo-100 text-indigo-700',
}
export function Badge({
  tone = 'slate',
  dot,
  className = '',
  children,
}: {
  tone?: BadgeTone
  dot?: boolean
  className?: string
  children: ReactNode
}) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium', badgeTone[tone], className)}>
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </span>
  )
}

/* ---------------- tabela (shadcn) ---------------- */
export function Table({ children }: { children: ReactNode }) {
  return <ShTable>{children}</ShTable>
}
export function Th({ className, ...props }: ComponentProps<typeof TableHead>) {
  return <TableHead className={cn('h-10 px-4 text-xs font-medium text-muted-foreground', className)} {...props} />
}
export function Td({ className, ...props }: ComponentProps<typeof TableCell>) {
  return <TableCell className={cn('px-4 py-3 align-middle', className)} {...props} />
}
export function Tr({ children }: { children: ReactNode }) {
  return <TableRow>{children}</TableRow>
}

/* ---------------- vazio ---------------- */
export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-muted/40 p-10 text-center">
      <p className="text-sm font-medium">{title}</p>
      {hint && <p className="mx-auto mt-1 max-w-sm text-pretty text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}
