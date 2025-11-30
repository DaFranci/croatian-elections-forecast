import { ElectionData, ElectionResult, PartyInfo } from '../types';

/**
 * Calculate the winner and margin for each municipality
 */
export function calculateWinners(electionData: ElectionData): ElectionData {
    const processedResults: Record<string, ElectionResult> = {};

    Object.entries(electionData.results).forEach(([id, result]) => {
        const parties = Object.entries(result.parties);

        // Sort parties by votes (extract votes from PartyVotes object)
        parties.sort((a, b) => b[1].votes - a[1].votes);

        const winner = parties[0]?.[0];
        const winnerVotes = parties[0]?.[1]?.votes || 0;
        const runnerUpVotes = parties[1]?.[1]?.votes || 0;

        // Calculate margin as percentage of total votes
        const margin = result.votes_cast > 0
            ? ((winnerVotes - runnerUpVotes) / result.votes_cast) * 100
            : 0;

        processedResults[id] = {
            ...result,
            winner,
            margin,
        };
    });

    return {
        ...electionData,
        results: processedResults,
    };
}

/**
 * Calculate swing between two elections
 */
export function calculateSwing(
    election1: ElectionData,
    election2: ElectionData,
    partyId: string
): Record<string, number> {
    const swing: Record<string, number> = {};

    Object.keys(election1.results).forEach(municipalityId => {
        const result1 = election1.results[municipalityId];
        const result2 = election2.results[municipalityId];

        if (!result1 || !result2) return;

        const votes1 = result1.parties[partyId]?.votes || 0;
        const votes2 = result2.parties[partyId]?.votes || 0;

        const percentage1 = result1.votes_cast > 0 ? (votes1 / result1.votes_cast) * 100 : 0;
        const percentage2 = result2.votes_cast > 0 ? (votes2 / result2.votes_cast) * 100 : 0;

        swing[municipalityId] = percentage2 - percentage1;
    });

    return swing;
}

/**
 * Get party color by ID
 */
export function getPartyColor(partyId: string, parties: PartyInfo[]): string {
    const party = parties.find(p => p.id === partyId);
    return party?.color || '#808080';
}

/**
 * Format number with thousand separators
 */
export function formatNumber(num: number): string {
    return num.toLocaleString('hr-HR');
}

/**
 * Format percentage
 */
export function formatPercentage(num: number, decimals: number = 1): string {
    return `${num.toFixed(decimals)}%`;
}

/**
 * Calculate total seats by party (simplified D'Hondt method)
 * This is a simplified version - real implementation would need constituency-level data
 */
export function calculateSeats(electionData: ElectionData, totalSeats: number = 140): Record<string, number> {
    // Aggregate national votes
    const nationalVotes: Record<string, number> = {};

    Object.values(electionData.results).forEach(result => {
        Object.entries(result.parties).forEach(([party, partyData]) => {
            nationalVotes[party] = (nationalVotes[party] || 0) + partyData.votes;
        });
    });

    // D'Hondt method
    const seats: Record<string, number> = {};
    const quotients: Array<{ party: string; quotient: number }> = [];

    // Calculate all quotients
    Object.entries(nationalVotes).forEach(([party, votes]) => {
        for (let i = 1; i <= totalSeats; i++) {
            quotients.push({
                party,
                quotient: votes / i,
            });
        }
    });

    // Sort by quotient and assign seats
    quotients.sort((a, b) => b.quotient - a.quotient);

    for (let i = 0; i < totalSeats; i++) {
        const party = quotients[i].party;
        seats[party] = (seats[party] || 0) + 1;
    }

    return seats;
}

/**
 * Join election results with GeoJSON features
 */
export function joinElectionWithGeo(
    geoJSON: any,
    electionData: ElectionData
): any {
    return {
        ...geoJSON,
        features: geoJSON.features.map((feature: any) => ({
            ...feature,
            properties: {
                ...feature.properties,
                electionResult: electionData.results[feature.properties.id],
            },
        })),
    };
}
