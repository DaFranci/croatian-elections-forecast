import { useAppContext } from '../../context/AppContext'
import { NO_DATA_COLOR } from '../../utils/dataProcessor'
import { ElectionData, PartyInfo } from '../../types'

function MapLegend({ parties, electionData }: { parties: PartyInfo[]; electionData: ElectionData }) {
    const { visualizationMode, viewMode } = useAppContext()

    // Only the parties that actually color the map
    const regions = viewMode === 'district' ? electionData.constituencies ?? {} : electionData.results
    const winners = new Set(Object.values(regions).map(r => r.winner))
    const shownParties = parties.filter(p => winners.has(p.id))

    return (
        <div className="hidden lg:block absolute z-10 bottom-3 left-3 max-w-[calc(100%-380px)] bg-white/95 backdrop-blur rounded-xl shadow-lg ring-1 ring-slate-200 px-3 py-2 text-slate-600">
            {visualizationMode === 'turnout' ? (
                <div className="w-56">
                    <p className="text-[11px] font-semibold text-slate-500 mb-1">Izlaznost</p>
                    <div className="h-2 rounded-full" style={{ background: 'linear-gradient(to right, #FFFFFF, #276e27)' }} />
                    <div className="flex justify-between text-[10px] text-slate-400 mt-0.5 tabular-nums">
                        <span>0%</span><span>50%</span><span>100%</span>
                    </div>
                </div>
            ) : (
                <>
                    <div className="flex flex-wrap gap-x-3 gap-y-1">
                        {shownParties.map(p => (
                            <div key={p.id} className="flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                                <span className="text-[11px] font-medium">{p.shortName}</span>
                            </div>
                        ))}
                        <div className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: NO_DATA_COLOR }} />
                            <span className="text-[11px] font-medium">Nema podataka</span>
                        </div>
                    </div>
                    {visualizationMode === 'margin' && (
                        <p className="text-[10px] text-slate-400 mt-1">Jača boja = veća razlika između prve dvije liste</p>
                    )}
                </>
            )}
        </div>
    )
}

export default MapLegend
