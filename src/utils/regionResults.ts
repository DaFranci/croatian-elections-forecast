import { DIASPORA_ID, ElectionData, ElectionResult, MayorRound, MINORITIES_ID, MinorityGroup, ViewMode } from '../types'
import { allocateDHondt, calculateSeats, SEATS_PER_CONSTITUENCY, THRESHOLD_PERCENTAGE } from './dataProcessor'

export interface PartyResult {
    partyId: string
    listName?: string
    votes: number
    percent: number
    seats: number
    wins?: number // local elections: councils won
}

export interface CountryResult {
    id: string
    name: string
    votes: number
    winner?: string
    winnerPercent: number
}

// What the results panel shows for the national total, a constituency, a municipality,
// the diaspora or the minority constituency
export interface RegionResults {
    id: string | number
    name: string
    scope: string
    turnout: number | null // null where there is no meaningful voter register
    showSeats: boolean
    results: PartyResult[]
    parliament?: { seats: Record<string, number>; minoritySeats: number }
    mayor?: MayorRound[] // local elections, municipality view
    unit?: 'grad' | 'općina'
    round?: 1 | 2 // presidential elections
    runoff?: string[] // round 1: the two candidates who went on to the second round
    countries?: CountryResult[]
    minorities?: MinorityGroup[]
}

// Registers for the diaspora (since 2015) and minorities (since 2020) only count people
// who registered to vote, so their "turnout" is close to 100% and meaningless
function registerTurnout(totalVoters: number, votesCast: number) {
    return totalVoters > votesCast * 1.1 ? (votesCast / totalVoters) * 100 : null
}

function partyResults(parties: ElectionResult['parties'], votesCast: number, seats: Record<string, number> = {}): PartyResult[] {
    return Object.entries(parties)
        .map(([partyId, p]) => ({
            partyId,
            listName: p.coalition_name ?? partyId,
            votes: p.votes,
            percent: (p.votes / votesCast) * 100,
            seats: seats[partyId] || 0,
        }))
        .sort((a, b) => b.votes - a.votes)
}

// Sum the parties and turnout of several results
function aggregate(regions: ElectionResult[]) {
    const parties: ElectionResult['parties'] = {}
    let totalVoters = 0
    let votesCast = 0
    regions.forEach(region => {
        totalVoters += region.total_voters
        votesCast += region.votes_cast
        Object.entries(region.parties).forEach(([partyId, p]) => {
            parties[partyId] ??= { votes: 0, coalition_name: p.coalition_name }
            parties[partyId].votes += p.votes
        })
    })
    return { parties, totalVoters, votesCast }
}

// Diaspora rows in the results: constituency XI countries, or (European elections) stations abroad
function diasporaRegions(data: ElectionData) {
    return Object.entries(data.results).filter(([, r]) =>
        data.constituencies ? r.constituency?.startsWith('XI.') : r.county?.toLowerCase() === 'inozemstvo')
}

export function hasDiaspora(data: ElectionData) {
    return diasporaRegions(data).length > 0
}

function national(data: ElectionData): RegionResults {
    // Constituencies also count stations abroad and special stations (hospitals, prisons),
    // which aren't part of any municipality
    const regions = data.constituencies ? Object.values(data.constituencies) : Object.values(data.results)
    const { parties, totalVoters, votesCast } = aggregate(regions)
    // Presidential elections have no seats
    const hasSeats = !!(data.constituencies || data.seats)
    const seats = hasSeats ? calculateSeats(data) : {}
    const minoritySeats = (data.minorities ?? []).reduce((sum, g) => sum + g.seats, 0)

    return {
        id: 'national',
        name: 'Ukupni rezultati',
        scope: data.type === 'local' ? 'Gradska i općinska vijeća' : 'Republika Hrvatska',
        turnout: (votesCast / totalVoters) * 100,
        showSeats: hasSeats,
        results: data.type === 'local' ? localTotals(data, partyResults(parties, votesCast)) : partyResults(parties, votesCast, seats),
        ...(hasSeats && { parliament: { seats, minoritySeats } }),
    }
}

// Councils won per list, keeping the largest lists and folding thousands of local ones into 'Ostale liste'
const LOCAL_TOP_LISTS = 10
const LOCAL_MIN_WINS = 3
export const OTHER_LISTS_ID = 'OSTALI'

function localTotals(data: ElectionData, results: PartyResult[]): PartyResult[] {
    const wins: Record<string, number> = {}
    Object.values(data.results).forEach(r => { if (r.winner) wins[r.winner] = (wins[r.winner] ?? 0) + 1 })

    const shown: PartyResult[] = []
    const other: PartyResult = { partyId: OTHER_LISTS_ID, listName: 'Ostale liste', votes: 0, percent: 0, seats: 0, wins: 0 }
    results.forEach((r, i) => {
        const won = wins[r.partyId] ?? 0
        if (i < LOCAL_TOP_LISTS || won >= LOCAL_MIN_WINS) {
            shown.push({ ...r, wins: won })
        } else {
            other.votes += r.votes
            other.percent += r.percent
            other.wins! += won
        }
    })
    return other.votes ? [...shown, other] : shown
}

function diaspora(data: ElectionData): RegionResults {
    const rows = diasporaRegions(data)
    const constituency = data.constituencies?.[DIASPORA_ID]
    const { parties, totalVoters, votesCast } = constituency
        ? { parties: constituency.parties, totalVoters: constituency.total_voters, votesCast: constituency.votes_cast }
        : aggregate(rows.map(([, r]) => r))
    const seats = constituency
        ? allocateDHondt(constituency.parties, constituency.seats ?? SEATS_PER_CONSTITUENCY, THRESHOLD_PERCENTAGE)
        : undefined

    const countries = rows
        .map(([id, r]) => {
            const [winner, top] = Object.entries(r.parties).sort((a, b) => b[1].votes - a[1].votes)[0] ?? []
            return { id, name: r.name, votes: r.votes_cast, winner, winnerPercent: top ? (top.votes / r.votes_cast) * 100 : 0 }
        })
        .filter(c => c.votes > 0)
        .sort((a, b) => b.votes - a.votes)

    return {
        id: DIASPORA_ID,
        name: 'Dijaspora',
        scope: constituency ? 'XI. izborna jedinica' : 'Glasovi iz inozemstva',
        turnout: registerTurnout(totalVoters, votesCast),
        showSeats: !!seats,
        results: partyResults(parties, votesCast, seats),
        countries,
    }
}

function minorities(data: ElectionData): RegionResults {
    const groups = data.minorities ?? []
    const totalVoters = groups.reduce((sum, g) => sum + g.total_voters, 0)
    const votesCast = groups.reduce((sum, g) => sum + g.votes_cast, 0)
    return {
        id: MINORITIES_ID,
        name: 'Nacionalne manjine',
        scope: 'XII. izborna jedinica',
        turnout: registerTurnout(totalVoters, votesCast),
        showSeats: true,
        results: [],
        minorities: groups,
    }
}

export function isAvailable(data: ElectionData, activeId: string | number, viewMode: ViewMode) {
    if (activeId === DIASPORA_ID) return hasDiaspora(data)
    if (activeId === MINORITIES_ID) return !!data.minorities?.length
    return viewMode === 'district' ? !!data.constituencies?.[activeId] : !!data.results[activeId]
}

export function regionResults(data: ElectionData, activeId: string | number | null, viewMode: ViewMode): RegionResults | null {
    const results = selectedResults(data, activeId, viewMode)
    if (!results || !data.round) return results

    // A candidate needs a majority of the votes cast; otherwise the top two go to a runoff
    const [first, second] = national(data).results
    const runoff = data.round === 1 && first.percent <= 50 ? [first.partyId, second.partyId] : undefined
    return { ...results, round: data.round, runoff }
}

function selectedResults(data: ElectionData, activeId: string | number | null, viewMode: ViewMode): RegionResults | null {
    if (activeId === null || !isAvailable(data, activeId, viewMode)) return national(data)
    if (activeId === DIASPORA_ID) return diaspora(data)
    if (activeId === MINORITIES_ID) return minorities(data)

    if (viewMode === 'district') {
        const constituency = data.constituencies![activeId]
        const seats = allocateDHondt(constituency.parties, constituency.seats ?? SEATS_PER_CONSTITUENCY, THRESHOLD_PERCENTAGE)
        return {
            id: activeId,
            name: constituency.name,
            scope: 'Izborna jedinica',
            turnout: constituency.turnout * 100,
            showSeats: true,
            results: partyResults(constituency.parties, constituency.votes_cast, seats),
        }
    }

    const municipality = data.results[activeId]
    return {
        id: activeId,
        name: municipality.name,
        scope: municipality.constituency || municipality.county || '',
        turnout: municipality.turnout * 100,
        showSeats: false,
        results: partyResults(municipality.parties, municipality.votes_cast),
        mayor: municipality.mayor,
        unit: municipality.unit,
    }
}
