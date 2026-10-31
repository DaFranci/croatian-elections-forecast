import { useState, useEffect, useMemo } from 'react'
import { AppProvider, useAppContext } from './context/AppContext'
import { loadElectionData, loadPartyData } from './utils/dataLoader'
import { calculateWinners } from './utils/dataProcessor'
import { isAvailable, regionResults } from './utils/regionResults'
import { withCoalitions } from './utils/coalitions'
import { ElectionData, PartyInfo, findElection } from './types'
import ElectionMap from './components/Map/ElectionMap'
import TopBar, { NAV_LINKS } from './components/Layout/TopBar'
import ElectionControls from './components/Panels/ElectionControls'
import ResultsPanel from './components/Panels/ResultsPanel'
import MapLegend from './components/Panels/MapLegend'
import ForecastPage from './components/Forecast/ForecastPage'
import './App.css'

// Minimal hash routing until the blog page exists
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
                setParties(withCoalitions(partyData, processedElection, electionId))
            } catch (error) {
                console.error('Error loading data:', error)
            } finally {
                setLoading(false)
            }
        }

        loadData()
    }, [electionId])

    // A selection can be missing from another year's data (e.g. Vrsi didn't exist in 2003)
    const activeExists = activeId === null || !electionData || isAvailable(electionData, activeId, viewMode)

    useEffect(() => {
        if (!activeExists) setActiveId(null)
    }, [activeExists, setActiveId])

    const activeData = useMemo(
        () => electionData && regionResults(electionData, activeId, viewMode),
        [electionData, activeId, viewMode]
    )

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
            ) : page === '#/prognoza' ? (
                <main className="flex-1 min-h-0 overflow-y-auto flex flex-col">
                    <ForecastPage />
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
