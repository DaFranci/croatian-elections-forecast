import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

// Shared layout for the scrolling pages (Prognoza, Blog): container, title and subtitle
export function Page({ title, subtitle, above, children }: { title: string; subtitle?: ReactNode; above?: ReactNode; children: ReactNode }) {
    return (
        <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:py-8">
            <header className="mb-6">
                {above}
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{title}</h1>
                {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
            </header>
            <div className="space-y-5">{children}</div>
        </div>
    )
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
    return <section className={cn("rounded-xl border border-slate-200 bg-white p-4 sm:p-5", className)}>{children}</section>
}

// A card with a heading and a one-line description
export function Section({ title, description, children }: { title: string; description: string; children: ReactNode }) {
    return (
        <Card>
            <h2 className="text-base font-bold text-slate-900">{title}</h2>
            <p className="mt-0.5 mb-4 text-sm text-slate-500">{description}</p>
            {children}
        </Card>
    )
}
