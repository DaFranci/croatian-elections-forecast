import { useEffect, useState } from 'react'
import { useAppContext } from '../../context/AppContext'
import { getPartyInfo, MINORITY_COLOR } from '../../utils/dataProcessor'
import { RegionResults, CountryResult } from '../../utils/regionResults'
import { MinorityGroup, PartyInfo } from '../../types'
import { cn } from '@/lib/utils'
import { Check, ChevronDown, ChevronUp, PanelRightClose, PanelRightOpen, X } from 'lucide-react'
import Parliament from './Parliament'

interface ResultsPanelProps {
    data: RegionResults
    parties: PartyInfo[]
    dateString?: string
    loading: boolean
}

const isDesktop = () => window.matchMedia('(min-width: 1024px)').matches

// 'BOSNA I HERCEGOVINA' -> 'Bosna i Hercegovina', 'dr. sc. MILORAD PUPOVAC' -> 'dr. sc. Milorad Pupovac'
function displayName(name: string) {
    return name.split(' ').map(word => {
        if (word !== word.toUpperCase() || !/[A-ZČĆĐŠŽ]/.test(word)) return word
        if (['I', 'U'].includes(word)) return word.toLowerCase()
        return word.charAt(0) + word.slice(1).toLowerCase().replace(/([-(])(\p{L})/gu, (_, sep, c) => sep + c.toUpperCase())
    }).join(' ')
}

// Candidates per minority group; the ones with the most votes are elected
function MinorityResults({ groups }: { groups: MinorityGroup[] }) {
    return (
        <div className="px-4 py-3 space-y-4">
            {groups.map(group => {
                const valid = group.candidates.reduce((sum, c) => sum + c.votes, 0)
                const shown = group.candidates.slice(0, group.seats + 2)
                return (
                    <div key={group.id}>
                        <div className="flex items-baseline justify-between gap-2">
                            <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500 leading-snug">{group.name}</h3>
                            <span className="text-[11px] text-slate-400 shrink-0 tabular-nums">{group.seats} {group.seats === 1 ? 'mandat' : 'mandata'}</span>
                        </div>
                        <div className="mt-1.5 space-y-1.5">
                            {shown.map(candidate => {
                                const percent = valid ? (candidate.votes / valid) * 100 : 0
                                return (
                                    <div key={candidate.name}>
                                        <div className="flex items-baseline justify-between gap-2 text-sm">
                                            <span className={cn("truncate flex items-center gap-1", candidate.elected ? "font-semibold text-slate-800" : "text-slate-500")}>
                                                {candidate.elected && <Check size={13} className="shrink-0 text-violet-600" aria-label="Izabran" />}
                                                {displayName(candidate.name)}
                                            </span>
                                            <span className="text-xs tabular-nums text-slate-500 shrink-0">
                                                {candidate.votes.toLocaleString('hr-HR')} · <span className="font-semibold text-slate-900">{percent.toFixed(1)}%</span>
                                            </span>
                                        </div>
                                        <div className="mt-0.5 h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                                            <div className="h-full rounded-full" style={{ width: `${percent}%`, backgroundColor: candidate.elected ? MINORITY_COLOR : '#CBD5E1' }} />
                                        </div>
                                    </div>
                                )
                            })}
                            {group.candidates.length > shown.length && (
                                <p className="text-[11px] text-slate-400">+ još {group.candidates.length - shown.length} kandidata</p>
                            )}
                        </div>
                    </div>
                )
            })}
        </div>
    )
}

// Votes per country, coloured by the list that won there
function CountryResults({ countries, parties }: { countries: CountryResult[]; parties: PartyInfo[] }) {
    const [expanded, setExpanded] = useState(false)
    const shown = expanded ? countries : countries.slice(0, 8)
    const max = countries[0].votes
    return (
        <div className="px-4 py-3 border-t border-slate-100">
            <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500">Po državama</h3>
            <div className="mt-2 space-y-1.5">
                {shown.map(country => {
                    const winner = country.winner ? getPartyInfo(country.winner, parties) : null
                    return (
                        <div key={country.id} title={winner ? `${winner.name}: ${country.winnerPercent.toFixed(1)}%` : undefined}>
                            <div className="flex items-baseline justify-between gap-2 text-xs">
                                <span className="truncate text-slate-700">{displayName(country.name)}</span>
                                <span className="tabular-nums text-slate-500 shrink-0">
                                    {country.votes.toLocaleString('hr-HR')}
                                    {winner && <> · {winner.shortName} <span className="font-semibold text-slate-900">{country.winnerPercent.toFixed(0)}%</span></>}
                                </span>
                            </div>
                            <div className="mt-0.5 h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full rounded-full" style={{ width: `${(country.votes / max) * 100}%`, backgroundColor: winner?.color ?? '#CBD5E1' }} />
                            </div>
                        </div>
                    )
                })}
            </div>
            {countries.length > 8 && (
                <button onClick={() => setExpanded(e => !e)} className="mt-2 text-[11px] font-semibold text-blue-600 hover:text-blue-700">
                    {expanded ? 'Prikaži manje' : `Prikaži sve (${countries.length})`}
                </button>
            )}
        </div>
    )
}

// Floating sidebar on desktop, bottom sheet on mobile
function ResultsPanel({ data, parties, dateString, loading }: ResultsPanelProps) {
    const { activeId, setActiveId } = useAppContext()
    const [open, setOpen] = useState(isDesktop)

    // Show the results whenever a region is picked on the map
    useEffect(() => {
        if (activeId !== null) setOpen(true)
    }, [activeId])


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
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 truncate">{data.scope}</p>
                            <h2 className="text-lg font-bold leading-tight truncate">{data.name}</h2>
                            <p className="text-xs text-slate-500 mt-0.5">
                                {dateString}
                                {data.turnout !== null && <> · Izlaznost <span className="font-semibold text-slate-900">{data.turnout.toFixed(1)}%</span></>}
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
                    <div className="flex-1 overflow-y-auto">
                        {data.parliament && (
                            <Parliament seats={data.parliament.seats} minoritySeats={data.parliament.minoritySeats} parties={parties} />
                        )}

                        {data.minorities && <MinorityResults groups={data.minorities} />}

                        {data.results.length > 0 && (
                            <div className="px-4 py-3 space-y-3">
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
                                                {data.showSeats && <span>{result.seats > 0 ? `${result.seats} mandata` : 'Bez mandata'}</span>}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}

                        {data.countries && data.countries.length > 0 && (
                            <CountryResults countries={data.countries} parties={parties} />
                        )}
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
