import { useAppContext } from '../../context/AppContext'
import { ELECTIONS, ELECTION_TYPES, ElectionType, findElection, hasRounds } from '../../types'
import { cn } from '@/lib/utils'
import * as Select from '@radix-ui/react-select'
import { MapIcon, LayoutGrid, ChevronDown, Check, Landmark, UserRound, Building2, Globe } from 'lucide-react'

const TYPE_ICONS: Record<ElectionType, typeof Landmark> = {
    parliamentary: Landmark,
    presidential: UserRound,
    local: Building2,
    eu: Globe,
}

const VISUALIZATION_MODES = [
    { id: 'winner', label: 'Pobjednik' },
    { id: 'turnout', label: 'Izlaznost' },
    { id: 'margin', label: 'Margina' },
] as const

const segment = (active: boolean) => cn(
    "flex-1 px-2 py-1.5 rounded text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors",
    active ? "bg-white shadow-sm text-slate-900" : "text-slate-500 hover:text-slate-700"
)

function TypeIcon({ type, active }: { type: ElectionType; active?: boolean }) {
    const Icon = TYPE_ICONS[type]
    return (
        <span className={cn("w-8 h-8 shrink-0 rounded-lg grid place-items-center", active ? "bg-blue-50 text-blue-600" : "bg-slate-100 text-slate-400")}>
            <Icon size={16} />
        </span>
    )
}

function ElectionControls() {
    const { electionType, year, round, viewMode, visualizationMode, setElectionType, setYear, setRound, setViewMode, setVisualizationMode } = useAppContext()
    const elections = ELECTIONS.filter(e => e.type === electionType)
    const hasConstituencies = !!findElection(electionType, year)?.constituencies

    return (
        <div className="absolute z-10 top-3 left-3 w-[min(340px,calc(100%-24px))] bg-white/95 backdrop-blur rounded-xl shadow-lg ring-1 ring-slate-200 p-3 space-y-2.5 text-slate-900">
            {/* Election type */}
            <Select.Root value={electionType} onValueChange={value => setElectionType(value as ElectionType)}>
                <Select.Trigger className="group w-full flex items-center gap-2.5 -mx-1 -mt-1 p-1 rounded-lg text-left hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 data-[state=open]:bg-slate-100 transition-colors">
                    <TypeIcon type={electionType} active />
                    <div className="flex-1 min-w-0">
                        <div className="text-base font-bold tracking-tight leading-tight truncate">
                            <Select.Value />
                        </div>
                        <p className="text-[11px] text-slate-400 font-medium">Službeni rezultati DIP-a</p>
                    </div>
                    <Select.Icon>
                        <ChevronDown size={16} className="text-slate-400 transition-transform group-data-[state=open]:rotate-180" />
                    </Select.Icon>
                </Select.Trigger>

                <Select.Portal>
                    <Select.Content
                        position="popper"
                        sideOffset={8}
                        className="z-50 w-[var(--radix-select-trigger-width)] overflow-hidden bg-white rounded-xl shadow-xl ring-1 ring-slate-200 p-1 text-slate-900 font-sans"
                    >
                        <Select.Viewport>
                            {ELECTION_TYPES.map(type => (
                                <Select.Item
                                    key={type.id}
                                    value={type.id}
                                    disabled={!type.available}
                                    className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-sm font-semibold cursor-pointer select-none outline-none data-[highlighted]:bg-slate-100 data-[disabled]:cursor-default data-[disabled]:text-slate-400"
                                >
                                    <TypeIcon type={type.id} active={type.id === electionType} />
                                    <Select.ItemText>{type.label}</Select.ItemText>
                                    <span className="ml-auto flex items-center">
                                        {type.available ? (
                                            <Select.ItemIndicator><Check size={16} className="text-blue-600" /></Select.ItemIndicator>
                                        ) : (
                                            <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">Uskoro</span>
                                        )}
                                    </span>
                                </Select.Item>
                            ))}
                        </Select.Viewport>
                    </Select.Content>
                </Select.Portal>
            </Select.Root>

            {/* Year */}
            <div className="grid gap-0.5" style={{ gridTemplateColumns: `repeat(${elections.length}, minmax(0, 1fr))` }}>
                {elections.map(election => (
                    <button
                        key={election.year}
                        onClick={() => setYear(election.year)}
                        className={cn(
                            "py-1 rounded-md text-xs font-semibold tabular-nums transition-colors",
                            year === election.year ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                        )}
                    >
                        {election.year}.
                    </button>
                ))}
            </div>

            {/* Round (presidential elections) */}
            {hasRounds(electionType) && (
                <div className="flex bg-slate-100 p-0.5 rounded-md">
                    {([1, 2] as const).map(r => (
                        <button key={r} onClick={() => setRound(r)} className={segment(round === r)}>
                            {r}. krug
                        </button>
                    ))}
                </div>
            )}

            <div className="h-px bg-slate-100" />

            {/* Granularity */}
            <div className="flex bg-slate-100 p-0.5 rounded-md">
                <button
                    onClick={() => setViewMode('district')}
                    disabled={!hasConstituencies}
                    title={hasConstituencies ? undefined : 'Cijela Hrvatska jedna je izborna jedinica'}
                    className={cn(segment(viewMode === 'district'), "disabled:opacity-40 disabled:cursor-not-allowed")}
                >
                    <MapIcon size={13} /> Izborne jedinice
                </button>
                <button onClick={() => setViewMode('municipality')} className={segment(viewMode === 'municipality')}>
                    <LayoutGrid size={13} /> Općine / gradovi
                </button>
            </div>

            {/* Visualization mode */}
            <div className="flex bg-slate-100 p-0.5 rounded-md">
                {VISUALIZATION_MODES.map(mode => (
                    <button key={mode.id} onClick={() => setVisualizationMode(mode.id)} className={segment(visualizationMode === mode.id)}>
                        {mode.label}
                    </button>
                ))}
            </div>
        </div>
    )
}

export default ElectionControls
