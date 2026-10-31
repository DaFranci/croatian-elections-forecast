import { Marker } from 'react-map-gl/maplibre'
import { useAppContext } from '../../context/AppContext'
import { getPartyInfo, MINORITY_COLOR, NO_DATA_COLOR } from '../../utils/dataProcessor'
import { hasDiaspora, regionResults } from '../../utils/regionResults'
import { DIASPORA_ID, ElectionData, MINORITIES_ID, PartyInfo } from '../../types'
import { cn } from '@/lib/utils'

// Inside Croatia's crescent, over Bosnia and Herzegovina, like the insets of a printed map
const DIASPORA_POSITION = { longitude: 17.65, latitude: 44.5 }
const MINORITIES_POSITION = { longitude: 17.65, latitude: 44.05 }

// Same scale as the turnout fill of the map areas: white to green
function turnoutColor(turnout: number) {
    const t = Math.min(1, Math.max(0, turnout / 100))
    const mix = (from: number, to: number) => Math.round(from + (to - from) * t)
    return `rgb(${mix(255, 0x27)}, ${mix(255, 0x6e)}, ${mix(255, 0x27)})`
}

interface InsetProps {
    label: string
    code?: string
    color: string
    active: boolean
    onClick: () => void
    children: React.ReactNode
}

function Inset({ label, code, color, active, onClick, children }: InsetProps) {
    return (
        <button
            onClick={e => { e.stopPropagation(); onClick() }}
            className={cn(
                "w-40 text-left bg-white/95 backdrop-blur rounded-lg shadow-md ring-1 pl-3 pr-2.5 py-1.5 border-l-4 transition-shadow hover:shadow-lg",
                active ? "ring-2 ring-slate-900" : "ring-slate-200"
            )}
            style={{ borderLeftColor: color }}
        >
            <div className="flex items-baseline justify-between text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                <span>{label}</span>
                {code && <span>{code}</span>}
            </div>
            <div className="text-xs text-slate-700 leading-snug">{children}</div>
        </button>
    )
}

// Clickable stand-ins for the diaspora (XI) and minority (XII) constituencies, which have no area
function MapInsets({ electionData, parties }: { electionData: ElectionData; parties: PartyInfo[] }) {
    const { activeId, viewMode, visualizationMode, setActiveId } = useAppContext()

    const diaspora = hasDiaspora(electionData) ? regionResults(electionData, DIASPORA_ID, viewMode) : null
    const minoritySeats = (electionData.minorities ?? []).reduce((sum, g) => sum + g.seats, 0)

    const [first, second] = diaspora?.results ?? []
    const winner = first ? getPartyInfo(first.partyId, parties, first.listName) : null
    const diasporaColor = visualizationMode === 'turnout'
        ? (diaspora?.turnout != null ? turnoutColor(diaspora.turnout) : NO_DATA_COLOR)
        : winner?.color ?? NO_DATA_COLOR
    const diasporaSeats = diaspora?.showSeats ? diaspora.results.reduce((sum, r) => sum + r.seats, 0) : 0

    return (
        <>
            {diaspora && (
                <Marker {...DIASPORA_POSITION} anchor="center">
                    <Inset
                        label={electionData.constituencies ? 'Dijaspora' : 'Inozemstvo'}
                        code={electionData.constituencies ? DIASPORA_ID : undefined}
                        color={diasporaColor}
                        active={activeId === DIASPORA_ID}
                        onClick={() => setActiveId(DIASPORA_ID)}
                    >
                        {visualizationMode === 'turnout' ? (
                            <span>Izlaznost <b className="text-slate-900">{diaspora.turnout != null ? `${diaspora.turnout.toFixed(1)}%` : 'n/p'}</b></span>
                        ) : winner && (
                            <span className="flex items-baseline justify-between gap-1">
                                <b className="text-slate-900 truncate">{winner.shortName}</b>
                                <span className="tabular-nums">
                                    {visualizationMode === 'margin' && second
                                        ? `+${(first.percent - second.percent).toFixed(1)}`
                                        : `${first.percent.toFixed(1)}%`}
                                </span>
                            </span>
                        )}
                        <div className="text-[10px] text-slate-400 tabular-nums whitespace-nowrap">
                            {diaspora.results.reduce((sum, r) => sum + r.votes, 0).toLocaleString('hr-HR')} glasova
                            {diasporaSeats > 0 && ` · ${diasporaSeats} mandata`}
                        </div>
                    </Inset>
                </Marker>
            )}

            {minoritySeats > 0 && (
                <Marker {...MINORITIES_POSITION} anchor="center">
                    <Inset
                        label="Manjine"
                        code={MINORITIES_ID}
                        color={MINORITY_COLOR}
                        active={activeId === MINORITIES_ID}
                        onClick={() => setActiveId(MINORITIES_ID)}
                    >
                        <b className="text-slate-900">{minoritySeats} zastupnika</b>
                        <div className="text-[10px] text-slate-400">{electionData.minorities!.length} skupina manjina</div>
                    </Inset>
                </Marker>
            )}
        </>
    )
}

export default MapInsets
