import { useAppContext } from '../../context/AppContext'
import { ELECTIONS, ELECTION_TYPES } from '../../types'
import { cn } from '@/lib/utils'
import { MapIcon, LayoutGrid, ChevronDown } from 'lucide-react'

const VISUALIZATION_MODES = [
    { id: 'winner', label: 'Pobjednik' },
    { id: 'turnout', label: 'Izlaznost' },
    { id: 'margin', label: 'Margina' },
] as const

const segment = (active: boolean) => cn(
    "flex-1 px-2 py-1.5 rounded text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors",
    active ? "bg-white shadow-sm text-slate-900" : "text-slate-500 hover:text-slate-700"
)

function ElectionControls() {
    const { year, viewMode, visualizationMode, setYear, setViewMode, setVisualizationMode } = useAppContext()

    return (
        <div className="absolute z-10 top-3 left-3 w-[min(340px,calc(100%-24px))] bg-white/95 backdrop-blur rounded-xl shadow-lg ring-1 ring-slate-200 p-3 space-y-2.5 text-slate-900">
            {/* Election type */}
            <div className="relative">
                <select
                    defaultValue="parliamentary"
                    className="w-full appearance-none bg-transparent pr-6 text-base font-bold tracking-tight cursor-pointer focus:outline-none"
                >
                    {ELECTION_TYPES.map(type => (
                        <option key={type.id} value={type.id} disabled={!type.available}>
                            {type.label}{type.available ? '' : ' (uskoro)'}
                        </option>
                    ))}
                </select>
                <ChevronDown size={16} className="absolute right-0 top-1.5 text-slate-400 pointer-events-none" />
                <p className="text-[11px] text-slate-400 font-medium">Službeni rezultati DIP-a</p>
            </div>

            {/* Year */}
            <div className="grid grid-cols-7 gap-0.5">
                {ELECTIONS.map(election => (
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

            <div className="h-px bg-slate-100" />

            {/* Granularity */}
            <div className="flex bg-slate-100 p-0.5 rounded-md">
                <button onClick={() => setViewMode('district')} className={segment(viewMode === 'district')}>
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
