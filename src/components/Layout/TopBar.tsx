import { useState } from 'react'
import { Menu, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export const NAV_LINKS = [
    { href: '#/', label: 'Rezultati' },
    { href: '#/prognoza', label: 'Prognoza' },
    { href: '#/blog', label: 'Blog' },
] as const

function TopBar({ page }: { page: string }) {
    const [menuOpen, setMenuOpen] = useState(false)

    return (
        <header className="relative z-20 h-12 shrink-0 bg-white border-b border-slate-200 px-4 flex items-center justify-between">
            <a href="#/" className="flex items-center gap-2 font-bold text-slate-900 tracking-tight">
                <span className="w-6 h-6 rounded-md bg-slate-900 grid place-items-center">
                    <span className="w-2.5 h-2.5 rounded-sm bg-blue-500" />
                </span>
                Izborna karta
            </a>

            {/* Desktop links */}
            <nav className="hidden md:flex items-center gap-1">
                {NAV_LINKS.map(link => (
                    <a
                        key={link.href}
                        href={link.href}
                        className={cn(
                            "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                            page === link.href ? "bg-slate-100 text-slate-900" : "text-slate-500 hover:text-slate-900"
                        )}
                    >
                        {link.label}
                    </a>
                ))}
            </nav>

            {/* Mobile menu */}
            <button
                onClick={() => setMenuOpen(open => !open)}
                className="md:hidden p-1.5 rounded-md text-slate-600 hover:bg-slate-100"
                aria-label="Izbornik"
            >
                {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            {menuOpen && (
                <nav className="md:hidden absolute top-12 inset-x-0 bg-white border-b border-slate-200 shadow-md flex flex-col p-2">
                    {NAV_LINKS.map(link => (
                        <a
                            key={link.href}
                            href={link.href}
                            onClick={() => setMenuOpen(false)}
                            className={cn(
                                "px-3 py-2 rounded-md text-sm font-medium",
                                page === link.href ? "bg-slate-100 text-slate-900" : "text-slate-600"
                            )}
                        >
                            {link.label}
                        </a>
                    ))}
                </nav>
            )}
        </header>
    )
}

export default TopBar
