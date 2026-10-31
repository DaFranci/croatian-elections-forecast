import { useState, useEffect, useMemo } from 'react'
import { AppProvider, useAppContext } from './context/AppContext'
import { loadElectionData, loadPartyData } from './utils/dataLoader'
import { calculateWinners, calculateSeats } from './utils/dataProcessor'
import { ElectionData, PartyInfo, findElection } from './types'
import ElectionMap from './components/Map/ElectionMap'
import TopBar, { NAV_LINKS } from './components/Layout/TopBar'
import ElectionControls from './components/Panels/ElectionControls'
import ResultsPanel from './components/Panels/ResultsPanel'
import MapLegend from './components/Panels/MapLegend'
import './App.css'

// Minimal hash routing until the forecast and blog pages exist
function useHashPage() {
    const read = () => NAV_LINKS.some(l => l.href === window.location.hash) ? window.location.hash : '#/'
    const [page, setPage] = useState(read)

    useEffect(() => {
        const onChange = () => setPage(read())
        window.addEventListener('hashchange', onChange)
        return () => window.removeEventListener('hashchange', onChange)
    }, [])

    return page
}

function AppContent() {
    const { electionType, year, activeId, viewMode, setActiveId } = useAppContext()

    const [electionData, setElectionData] = useState<ElectionData | null>(null)
    const [parties, setParties] = useState<PartyInfo[]>([])
    const [loading, setLoading] = useState(true)
    const page = useHashPage()

    // Map year to election ID
    const electionId = `${year}-${electionType}`

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

    // A selection can be missing from another year's data (e.g. Vrsi didn't exist in 2003)
    const activeExists = activeId === null || !electionData || (viewMode === 'district'
        ? !!electionData.constituencies?.[activeId as string]
        : !!electionData.results[activeId as string])

    useEffect(() => {
        if (!activeExists) setActiveId(null)
    }, [activeExists, setActiveId])

    // Calculate active data based on activeId
    const activeData = useMemo(() => {
        if (!electionData) return null

        if (activeId === null || !activeExists) {
            // National view - aggregate all results
            const allResults: Record<string, { votes: number; seats: number; listName: string }> = {}
            let totalVoters = 0
            let totalVotesCast = 0

            // Calculate national seats
            const nationalSeats = calculateSeats(electionData);

            Object.values(electionData.results).forEach(result => {
                totalVoters += result.total_voters
                totalVotesCast += result.votes_cast

                Object.entries(result.parties).forEach(([partyId, partyVotes]) => {
                    if (!allResults[partyId]) {
                        allResults[partyId] = { votes: 0, seats: 0, listName: partyVotes.coalition_name ?? partyId }
                    }
                    allResults[partyId].votes += partyVotes.votes
                })
            })

            const results = Object.entries(allResults)
                .map(([partyId, data]) => ({
                    partyId,
                    listName: data.listName,
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
                        listName: partyVotes.coalition_name,
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
                        listName: partyVotes.coalition_name,
                        votes: partyVotes.votes,
                        percent: (partyVotes.votes / muniData.votes_cast) * 100,
                        seats: 0
                    }))
                    .sort((a, b) => b.percent - a.percent)

                return {
                    id: activeId,
                    name: muniData.name,
                    turnout: muniData.turnout * 100,
                    constituency: muniData.constituency || muniData.county,
                    results
                }
            }
        }

        return null
    }, [electionData, activeId, activeExists, viewMode])

    const dateString = findElection(electionType, year)?.date

    return (
        <div className="h-dvh flex flex-col bg-slate-50 text-slate-900 font-sans overflow-hidden">
            <TopBar page={page} />

            {page === '#/' ? (
                <main className="relative flex-1 min-h-0">
                    {!electionData || !activeData ? (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-center">
                                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                                <p className="mt-4 text-slate-600">Učitavanje podataka...</p>
                            </div>
                        </div>
                    ) : (
                        <>
                            <ElectionMap />
                            <ElectionControls />
                            <MapLegend parties={parties} electionData={electionData} />
                            <ResultsPanel data={activeData} parties={parties} dateString={dateString} loading={loading} />
                        </>
                    )}
                </main>
            ) : (
                <main className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <h1 className="text-2xl font-bold">{NAV_LINKS.find(l => l.href === page)?.label}</h1>
                        <p className="text-slate-500 mt-1">Uskoro.</p>
                    </div>
                </main>
            )}
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
