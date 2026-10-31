import { useEffect, useState } from 'react'
import { useAppContext } from '../../context/AppContext'
import { getPartyInfo } from '../../utils/dataProcessor'
import { PartyInfo } from '../../types'
import { cn } from '@/lib/utils'
import { ChevronDown, ChevronUp, PanelRightClose, PanelRightOpen, X } from 'lucide-react'

export interface RegionResults {
    id: string | number
    name: string
    turnout: number
    constituency?: string
    results: {
        partyId: string
        listName?: string
        votes: number
        percent: number
        seats: number
    }[]
}

interface ResultsPanelProps {
    data: RegionResults
    parties: PartyInfo[]
    dateString?: string
    loading: boolean
}

const isDesktop = () => window.matchMedia('(min-width: 1024px)').matches

// Floating sidebar on desktop, bottom sheet on mobile
function ResultsPanel({ data, parties, dateString, loading }: ResultsPanelProps) {
    const { activeId, viewMode, setActiveId } = useAppContext()
    const [open, setOpen] = useState(isDesktop)

    // Show the results whenever a region is picked on the map
    useEffect(() => {
        if (activeId !== null) setOpen(true)
    }, [activeId])

    const showSeats = activeId === null || viewMode === 'district'
    const scopeLabel = activeId === null
        ? 'Republika Hrvatska'
        : viewMode === 'district' ? 'Izborna jedinica' : data.constituency

    return (
        <>
            <aside
                className={cn(
                    "absolute z-10 flex flex-col bg-white/95 backdrop-blur shadow-lg ring-1 ring-slate-200 text-slate-900 transition-opacity",
                    "inset-x-0 bottom-0 max-h-[60%] rounded-t-2xl",
                    "lg:inset-x-auto lg:top-3 lg:right-3 lg:bottom-3 lg:w-[340px] lg:max-h-none lg:rounded-xl",
                    !open && "lg:hidden",
                    loading && "opacity-60"
                )}
            >
                {/* Header */}
                <div className="px-4 pt-2 pb-3 lg:pt-4 border-b border-slate-100">
                    <button onClick={() => setOpen(o => !o)} className="lg:hidden block mx-auto mb-2 w-10 h-1 rounded-full bg-slate-300" aria-label="Rezultati" />
                    <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 truncate">{scopeLabel}</p>
                            <h2 className="text-lg font-bold leading-tight truncate">{activeId === null ? 'Ukupni rezultati' : data.name}</h2>
                            <p className="text-xs text-slate-500 mt-0.5">
                                {dateString} · Izlaznost <span className="font-semibold text-slate-900">{data.turnout.toFixed(1)}%</span>
                            </p>
                        </div>
                        <div className="flex items-center gap-0.5 shrink-0">
                            {activeId !== null && (
                                <button onClick={() => setActiveId(null)} title="Natrag na nacionalni prikaz" className="p-1.5 rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700">
                                    <X size={16} />
                                </button>
                            )}
                            <button onClick={() => setOpen(o => !o)} title={open ? 'Sakrij rezultate' : 'Prikaži rezultate'} className="p-1.5 rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700">
                                <span className="lg:hidden">{open ? <ChevronDown size={16} /> : <ChevronUp size={16} />}</span>
                                <PanelRightClose size={16} className="hidden lg:block" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Results */}
                {open && (
                    <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                        {data.results.map(result => {
                            const party = getPartyInfo(result.partyId, parties, result.listName)
                            return (
                                <div key={result.partyId}>
                                    <div className="flex items-baseline justify-between gap-2">
                                        <span className="text-sm font-semibold text-slate-800 truncate" title={party.name}>{party.name}</span>
                                        <span className="text-sm font-bold tabular-nums shrink-0">{result.percent.toFixed(1)}%</span>
                                    </div>
                                    <div className="mt-1 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full rounded-full transition-all duration-700 ease-out"
                                            style={{ width: `${result.percent}%`, backgroundColor: party.color }}
                                        />
                                    </div>
                                    <div className="mt-0.5 flex justify-between text-[11px] text-slate-400 tabular-nums">
                                        <span>{result.votes.toLocaleString('hr-HR')} glasova</span>
                                        {showSeats && <span>{result.seats > 0 ? `${result.seats} mandata` : 'Bez mandata'}</span>}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </aside>

            {/* Reopen button when the desktop sidebar is collapsed */}
            {!open && (
                <button
                    onClick={() => setOpen(true)}
                    className="hidden lg:flex absolute z-10 top-3 right-3 items-center gap-2 px-3 py-2 bg-white/95 backdrop-blur rounded-xl shadow-lg ring-1 ring-slate-200 text-sm font-semibold text-slate-700 hover:text-slate-900"
                >
                    <PanelRightOpen size={16} /> Rezultati
                </button>
            )}
        </>
    )
}

export default ResultsPanel
