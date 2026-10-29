import { useState, useEffect, useMemo } from 'react'
import { AppProvider, useAppContext } from './context/AppContext'
import { loadElectionData, loadPartyData } from './utils/dataLoader'
import { calculateWinners, calculateSeats } from './utils/dataProcessor'
import { ELECTIONS, ElectionData, PartyInfo } from './types'
import ElectionMap from './components/Map/ElectionMap'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
    ChevronRight,
    Info,
    MapIcon,
    BarChart3,
    Users,
    Calendar,
    Globe,
    LayoutGrid,
    Layers
} from 'lucide-react'
import './App.css'

function AppContent() {
    const {
        year,
        activeId,
        visualizationMode,
        viewMode,
        setYear,
        setActiveId,
        setVisualizationMode,
        setViewMode
    } = useAppContext()

    const [electionData, setElectionData] = useState<ElectionData | null>(null)
    const [parties, setParties] = useState<PartyInfo[]>([])
    const [loading, setLoading] = useState(true)

    // Map year to election ID
    const electionId = `${year}-parliamentary`

    useEffect(() => {
        async function loadData() {
            setLoading(true)
            try {
                const [election, partyData] = await Promise.all([
                    loadElectionData(electionId),
                    loadPartyData(),
                ])

                const processedElection = calculateWinners(election)
                setElectionData(processedElection)
                setParties(partyData)
            } catch (error) {
                console.error('Error loading data:', error)
            } finally {
                setLoading(false)
            }
        }

        loadData()
    }, [electionId])

    // Calculate active data based on activeId
    const activeData = useMemo(() => {
        if (!electionData) return null

        if (activeId === null) {
            // National view - aggregate all results
            const allResults: Record<string, { votes: number; seats: number }> = {}
            let totalVoters = 0
            let totalVotesCast = 0

            // Calculate national seats
            const nationalSeats = calculateSeats(electionData);

            Object.values(electionData.results).forEach(result => {
                totalVoters += result.total_voters
                totalVotesCast += result.votes_cast

                Object.entries(result.parties).forEach(([partyId, partyVotes]) => {
                    if (!allResults[partyId]) {
                        allResults[partyId] = { votes: 0, seats: 0 }
                    }
                    allResults[partyId].votes += partyVotes.votes
                })
            })

            const results = Object.entries(allResults)
                .map(([partyId, data]) => ({
                    partyId,
                    votes: data.votes,
                    percent: (data.votes / totalVotesCast) * 100,
                    seats: nationalSeats[partyId] || 0
                }))
                .sort((a, b) => b.percent - a.percent)

            return {
                id: 'national',
                name: 'Republika Hrvatska',
                turnout: (totalVotesCast / totalVoters) * 100,
                results
            }
        }

        // District or municipality view
        if (viewMode === 'district' && electionData.constituencies) {
            const constData = electionData.constituencies[activeId as string]
            if (constData) {
                // Calculate seats for this constituency
                const seats: Record<string, number> = {};
                const SEATS_PER_CONSTITUENCY = 14;
                const THRESHOLD_PERCENTAGE = 5;
                const seatsToAllocate = activeId === 'XI' ? 3 : SEATS_PER_CONSTITUENCY;

                let totalValidVotes = 0;
                Object.values(constData.parties).forEach(p => totalValidVotes += p.votes);

                if (totalValidVotes > 0) {
                    const qualifyingParties = Object.entries(constData.parties)
                        .filter(([_, p]) => (p.votes / totalValidVotes) * 100 >= THRESHOLD_PERCENTAGE)
                        .map(([id, p]) => ({ id, votes: p.votes }));

                    const quotients: { id: string, val: number }[] = [];
                    qualifyingParties.forEach(p => {
                        for (let i = 1; i <= seatsToAllocate; i++) {
                            quotients.push({ id: p.id, val: p.votes / i });
                        }
                    });

                    quotients.sort((a, b) => b.val - a.val);
                    quotients.slice(0, seatsToAllocate).forEach(q => {
                        seats[q.id] = (seats[q.id] || 0) + 1;
                    });
                }

                const results = Object.entries(constData.parties)
                    .map(([partyId, partyVotes]) => ({
                        partyId,
                        votes: partyVotes.votes,
                        percent: (partyVotes.votes / constData.votes_cast) * 100,
                        seats: seats[partyId] || 0
                    }))
                    .sort((a, b) => b.percent - a.percent)

                return {
                    id: activeId,
                    name: constData.name,
                    turnout: constData.turnout * 100,
                    results
                }
            }
        } else {
            const muniData = electionData.results[activeId as string]
            if (muniData) {
                const results = Object.entries(muniData.parties)
                    .map(([partyId, partyVotes]) => ({
                        partyId,
                        votes: partyVotes.votes,
                        percent: (partyVotes.votes / muniData.votes_cast) * 100,
                        seats: 0
                    }))
                    .sort((a, b) => b.percent - a.percent)

                return {
                    id: activeId,
                    name: muniData.name,
                    turnout: muniData.turnout * 100,
                    constituency: muniData.constituency,
                    results
                }
            }
        }

        return null
    }, [electionData, activeId, viewMode])

    if (loading || !electionData || !activeData) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="mt-4 text-slate-600">Loading election data...</p>
                </div>
            </div>
        )
    }

    const leadingParty = parties.find(p => p.id === activeData.results[0]?.partyId)
    const dateString = ELECTIONS.find(e => e.year === year)?.date

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans p-4 md:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Parlamentarni Izbori</h1>
                        <p className="text-slate-500 mt-1 flex items-center gap-2">
                            <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                            Službeni rezultati - {year}.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 bg-white p-1.5 rounded-lg border border-slate-200 shadow-sm">
                        {ELECTIONS.map((election, i) => (
                            <div key={election.year} className="flex items-center gap-2">
                                {i > 0 && <div className="w-px h-4 bg-slate-200"></div>}
                                <button
                                    onClick={() => setYear(election.year)}
                                    className={cn("px-4 py-1.5 rounded-md text-sm font-medium transition-all", year === election.year ? 'bg-slate-100 text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900')}
                                >
                                    {election.year}.
                                </button>
                            </div>
                        ))}
                    </div>
                </header>

                {/* Key Metrics Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="p-4 flex items-center justify-between cursor-pointer hover:border-blue-300 transition-colors bg-white" onClick={() => setActiveId(null)}>
                        <div>
                            <p className="text-sm font-medium text-slate-500">Ukupna izlaznost</p>
                            <h3 className="text-2xl font-bold text-slate-900 mt-1">{activeData.turnout.toFixed(1)}%</h3>
                        </div>
                        <div className="h-10 w-10 bg-blue-50 rounded-full flex items-center justify-center">
                            <Users className="w-5 h-5 text-blue-600" />
                        </div>
                    </Card>

                    <Card className="p-4 flex items-center justify-between bg-white">
                        <div>
                            <p className="text-sm font-medium text-slate-500">Datum izbora</p>
                            <h3 className="text-xl font-bold text-slate-900 mt-1">{dateString}</h3>
                        </div>
                        <div className="h-10 w-10 bg-purple-50 rounded-full flex items-center justify-center">
                            <Calendar className="w-5 h-5 text-purple-600" />
                        </div>
                    </Card>

                    <Card className="p-4 flex items-center justify-between bg-slate-900 text-white border-slate-800">
                        <div>
                            <p className="text-sm font-medium text-slate-400">Vodeća stranka {activeId === null ? '(RH)' : ''}</p>
                            <h3 className="text-2xl font-bold mt-1" style={{ color: leadingParty?.color || '#fff' }}>
                                {leadingParty?.shortName || 'N/A'}
                            </h3>
                        </div>
                        <div className="h-10 w-10 bg-slate-800 rounded-full flex items-center justify-center">
                            <BarChart3 className="w-5 h-5 text-slate-300" />
                        </div>
                    </Card>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Left Column: Map & Controls */}
                    <div className="lg:col-span-7 xl:col-span-8 space-y-4">
                        <Card className="p-1 overflow-hidden bg-slate-50/50">
                            {/* Map Toolbar */}
                            <div className="flex flex-wrap items-center justify-between gap-3 p-2 mb-2 bg-white m-1 rounded-lg border border-slate-100">
                                {/* Granularity Toggle */}
                                <div className="flex bg-slate-100 p-0.5 rounded-md">
                                    <button
                                        onClick={() => setViewMode('district')}
                                        className={cn("px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-2", viewMode === 'district' ? "bg-white shadow-sm text-slate-900" : "text-slate-500 hover:text-slate-700")}
                                    >
                                        <MapIcon size={14} /> Izborne Jedinice
                                    </button>
                                    <button
                                        onClick={() => setViewMode('municipality')}
                                        className={cn("px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-2", viewMode === 'municipality' ? "bg-white shadow-sm text-slate-900" : "text-slate-500 hover:text-slate-700")}
                                    >
                                        <LayoutGrid size={14} /> Općine / Gradovi
                                    </button>
                                </div>

                                {/* Scope Button */}
                                <button
                                    onClick={() => setActiveId(null)}
                                    className={cn("px-3 py-1.5 rounded-md text-xs font-semibold border transition-colors flex items-center gap-2", activeId === null ? "bg-blue-50 border-blue-200 text-blue-700" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50")}
                                >
                                    <Globe size={14} /> Prikaz: Hrvatska
                                </button>

                                {/* View Mode */}
                                <div className="flex gap-1">
                                    <button
                                        onClick={() => setVisualizationMode('winner')}
                                        title="Pobjednici"
                                        className={cn("p-1.5 rounded hover:bg-slate-100", visualizationMode === 'winner' ? "text-blue-600 bg-blue-50" : "text-slate-400")}
                                    >
                                        <BarChart3 size={18} />
                                    </button>
                                    <button
                                        onClick={() => setVisualizationMode('turnout')}
                                        title="Izlaznost"
                                        className={cn("p-1.5 rounded hover:bg-slate-100", visualizationMode === 'turnout' ? "text-blue-600 bg-blue-50" : "text-slate-400")}
                                    >
                                        <Users size={18} />
                                    </button>
                                    <button
                                        onClick={() => setVisualizationMode('margin')}
                                        title="Margina pobjede"
                                        className={cn("p-1.5 rounded hover:bg-slate-100", visualizationMode === 'margin' ? "text-blue-600 bg-blue-50" : "text-slate-400")}
                                    >
                                        <Layers size={18} />
                                    </button>
                                </div>
                            </div>

                            {/* The Map */}
                            <div className="aspect-[4/3] w-full px-4 md:px-12 py-4 relative">
                                <ElectionMap />
                            </div>

                            {/* Legend (Winner Mode) */}
                            {visualizationMode === 'winner' && (
                                <div className="p-4 border-t border-slate-100 flex flex-wrap justify-center gap-x-6 gap-y-2">
                                    {parties.map((p) => (
                                        <div key={p.id} className="flex items-center gap-2">
                                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }}></span>
                                            <span className="text-xs font-medium text-slate-600">{p.shortName}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </Card>
                    </div>

                    {/* Right Column: Details Sidebar */}
                    <div className="lg:col-span-5 xl:col-span-4">
                        <Card className="h-full max-h-[800px] flex flex-col border-0 shadow-lg ring-1 ring-slate-200">
                            {/* Sidebar Header */}
                            <div className="p-6 border-b border-slate-100 bg-slate-50/80">
                                <div className="flex items-center justify-between mb-2">
                                    <Badge variant={activeId === null ? 'default' : 'outline'} className={activeId === null ? "bg-blue-600" : "bg-white"}>
                                        {activeId === null ? "Nacionalni rezultati" : (viewMode === 'district' ? `Izborna jedinica` : activeData.constituency)}
                                    </Badge>
                                    <span className="text-xs text-slate-400 font-mono">
                                        {year}
                                    </span>
                                </div>

                                <h2 className="text-2xl font-bold text-slate-900">{activeData.name}</h2>

                                <div className="flex items-center gap-4 mt-3 text-sm text-slate-500">
                                    <div className="flex items-center gap-1.5">
                                        <Users size={14} />
                                        <span>Izlaznost: <span className="font-semibold text-slate-900">{activeData.turnout.toFixed(1)}%</span></span>
                                    </div>
                                </div>
                            </div>

                            {/* Results List */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-white">
                                <div className="space-y-4">
                                    {activeData.results.map((result, idx) => {
                                        const party = parties.find(p => p.id === result.partyId)
                                        if (!party) return null

                                        return (
                                            <div key={idx} className="group">
                                                <div className="flex justify-between items-end mb-1.5">
                                                    <div>
                                                        <div className="font-bold text-slate-800 text-sm">{party.name}</div>
                                                        {(activeId === null || viewMode === 'district') && (
                                                            <div className="text-xs text-slate-500 font-medium">
                                                                <span className="text-slate-400">Osvojeno:</span> {result.seats > 0 ? `${result.seats} mandata` : 'Bez mandata'}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-lg font-bold text-slate-900">{result.percent.toFixed(1)}%</div>
                                                        <div className="text-xs text-slate-500 font-medium">{result.votes.toLocaleString('hr-HR')} glasova</div>
                                                    </div>
                                                </div>
                                                {/* Progress Bar */}
                                                <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full rounded-full transition-all duration-1000 ease-out"
                                                        style={{
                                                            width: `${result.percent}%`,
                                                            backgroundColor: party.color
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>

                            {/* Sidebar Footer */}
                            <div className="p-4 bg-slate-50 border-t border-slate-100 rounded-b-xl">
                                {activeId === null ? (
                                    <div className="flex gap-3 text-xs text-slate-500 items-start bg-blue-50/50 p-3 rounded border border-blue-100">
                                        <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                                        <p>
                                            Prikazuju se ukupni rezultati za Republiku Hrvatsku. Odaberite regiju na karti za detaljnije podatke.
                                        </p>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => setActiveId(null)}
                                        className="w-full py-2 bg-white border border-slate-200 rounded text-sm font-medium text-slate-600 hover:text-blue-600 hover:border-blue-200 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <ChevronRight className="rotate-180" size={16} /> Natrag na nacionalni prikaz
                                    </button>
                                )}
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    )
}

function App() {
    return (
        <AppProvider>
            <AppContent />
        </AppProvider>
    )
}

export default App
