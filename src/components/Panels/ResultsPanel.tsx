import { useEffect, useState } from 'react'
import { useAppContext } from '../../context/AppContext'
import { getPartyInfo, MINORITY_COLOR } from '../../utils/dataProcessor'
import { RegionResults, CountryResult, PartyResult } from '../../utils/regionResults'
import { MayorRound, MinorityGroup, PartyInfo } from '../../types'
import { displayName, localParty } from '../../utils/coalitions'
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

// '1 vijeće', '3 vijeća', '5 vijeća': councils where the list came first
const councils = (n: number) => (n % 10 === 1 && n % 100 !== 11 ? 'vijeće' : 'vijeća')

// Mayoral race, latest round first; candidates are elected by name, so there are no party colours
function MayorResults({ rounds, title }: { rounds: MayorRound[]; title: string }) {
    return (
        <div className="px-4 py-3 border-t border-slate-100 space-y-3">
            {[...rounds].reverse().map((round, i) => (
                <div key={round.round} className={cn(i > 0 && "opacity-80")}>
                    <div className="flex items-baseline justify-between gap-2">
                        <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500">{title}</h3>
                        {rounds.length > 1 && <span className="text-[11px] text-slate-400">{round.round}. krug</span>}
                    </div>
                    <div className="mt-1.5 space-y-1.5">
                        {round.candidates.map(candidate => {
                            const percent = round.votes_cast ? (candidate.votes / round.votes_cast) * 100 : 0
                            return (
                                <div key={candidate.name}>
                                    <div className="flex items-baseline justify-between gap-2 text-sm">
                                        <span className={cn("truncate flex items-center gap-1", candidate.elected ? "font-semibold text-slate-800" : "text-slate-600")}>
                                            {candidate.elected && <Check size={13} className="shrink-0 text-emerald-600" aria-label="Izabran/a" />}
                                            {candidate.name}
                                        </span>
                                        <span className="text-xs tabular-nums text-slate-500 shrink-0">
                                            {candidate.votes.toLocaleString('hr-HR')} · <span className="font-semibold text-slate-900">{percent.toFixed(1)}%</span>
                                        </span>
                                    </div>
                                    <div className="mt-0.5 h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                                        <div className="h-full rounded-full" style={{ width: `${percent}%`, backgroundColor: candidate.elected ? '#334155' : '#CBD5E1' }} />
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            ))}
        </div>
    )
}

// Second round of a presidential election: both candidates on one bar, split by their share of the valid votes
function Runoff({ results, parties, national }: { results: PartyResult[]; parties: PartyInfo[]; national: boolean }) {
    const [a, b] = results.map(r => ({ ...r, party: getPartyInfo(r.partyId, parties, r.listName) }))
    const valid = a.votes + b.votes
    const share = (votes: number) => (valid ? (votes / valid) * 100 : 0)
    return (
        <div className="px-4 pt-3 pb-3 border-b border-slate-100">
            <div className="flex items-end justify-between gap-3">
                {[a, b].map((c, i) => (
                    <div key={c.partyId} className={cn("min-w-0", i === 1 && "text-right")}>
                        <div className={cn("flex items-center gap-1 text-sm font-semibold text-slate-800", i === 1 && "justify-end")}>
                            {national && i === 0 && <Check size={14} className="shrink-0 text-emerald-600" aria-label="Izabran/a" />}
                            <span className="truncate">{c.party.shortName}</span>
                        </div>
                        <div className="text-2xl font-bold tabular-nums leading-tight">{share(c.votes).toFixed(1)}%</div>
                    </div>
                ))}
            </div>
            <div className="relative mt-1.5 flex h-3 rounded-full overflow-hidden gap-0.5">
                <div style={{ width: `${share(a.votes)}%`, backgroundColor: a.party.color }} />
                <div style={{ width: `${share(b.votes)}%`, backgroundColor: b.party.color }} />
                <div className="absolute inset-y-[-2px] left-1/2 w-px bg-slate-900/40" />
            </div>
            <div className="mt-1 flex justify-between text-[11px] text-slate-400 tabular-nums">
                <span>{a.votes.toLocaleString('hr-HR')}</span>
                <span>{national ? 'Udio važećih glasova' : `Razlika ${Math.abs(a.votes - b.votes).toLocaleString('hr-HR')}`}</span>
                <span>{b.votes.toLocaleString('hr-HR')}</span>
            </div>
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

                        {data.round === 2 && data.results.length === 2 && <Runoff results={data.results} parties={parties} national={data.id === 'national'} />}

                        {data.mayor && (
                            <h3 className="px-4 pt-3 -mb-1 text-xs font-bold uppercase tracking-wide text-slate-500">
                                {data.id === 'zagreb' ? 'Gradska skupština' : data.unit === 'grad' ? 'Gradsko vijeće' : 'Općinsko vijeće'}
                            </h3>
                        )}

                        {data.results.length > 0 && (
                            <div className="px-4 py-3 space-y-3">
                                {data.results.map(result => {
                                    // The national total names every partner; elsewhere only the local ones
                                    const listParty = getPartyInfo(result.partyId, parties, result.listName)
                                    const party = data.id === 'national' ? listParty : localParty(listParty, result.listName, parties)
                                    return (
                                        <div key={result.partyId}>
                                            <div className="flex items-baseline justify-between gap-2">
                                                <span className="text-sm font-semibold text-slate-800 truncate flex items-center gap-1.5" title={party.name}>
                                                    <span className="truncate">{party.name}</span>
                                                    {data.runoff?.includes(result.partyId) && (
                                                        <span className="shrink-0 text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-px rounded" title="Ušao/la u drugi krug">2. krug</span>
                                                    )}
                                                </span>
                                                <span className="text-sm font-bold tabular-nums shrink-0">{result.percent.toFixed(1)}%</span>
                                            </div>
                                            {party.description && <p className="text-[11px] text-slate-400 truncate" title={party.description}>{party.description}</p>}
                                            {party.campaignName && party.coalition && (
                                                <p className="text-[11px] text-slate-400 truncate" title={party.coalition.join(', ')}>{party.coalition.join(' · ')}</p>
                                            )}
                                            <div className="mt-1 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full rounded-full transition-all duration-700 ease-out"
                                                    style={{ width: `${result.percent}%`, backgroundColor: party.color }}
                                                />
                                            </div>
                                            <div className="mt-0.5 flex justify-between text-[11px] text-slate-400 tabular-nums">
                                                <span>{result.votes.toLocaleString('hr-HR')} glasova</span>
                                                {data.showSeats && <span>{result.seats > 0 ? `${result.seats} mandata` : 'Bez mandata'}</span>}
                                                {result.wins !== undefined && <span>{result.wins > 0 ? `${result.wins} ${councils(result.wins)}` : 'Bez većine'}</span>}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}

                        {data.mayor && <MayorResults rounds={data.mayor} title={data.unit === 'grad' ? 'Gradonačelnik' : 'Načelnik'} />}

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
