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
export function calculateSeats(electionData: ElectionData): Record<string, number> {
    const seats: Record<string, number> = {};
    const SEATS_PER_CONSTITUENCY = 14;
    const THRESHOLD_PERCENTAGE = 5;

    // If no constituency data, return empty (or fallback to national if we wanted, but let's stick to correct logic)
    if (!electionData.constituencies) {
        console.warn('No constituency data found for seat calculation');
        return {};
    }

    // Iterate through each constituency
    Object.entries(electionData.constituencies).forEach(([constId, constituency]) => {
        // Determine seats for this constituency
        // XI (Diaspora) has 3 seats, others have 14
        const seatsToAllocate = constId === 'XI' ? 3 : SEATS_PER_CONSTITUENCY;

        // 1. Calculate total valid votes in this constituency
        let totalValidVotes = 0;
        Object.values(constituency.parties).forEach(p => {
            totalValidVotes += p.votes;
        });

        if (totalValidVotes === 0) return;

        // 2. Filter parties passing the 5% threshold
        // Note: Threshold might not apply to XI in the same way, but usually does. 
        // For XI, it's often effectively natural threshold due to low seat count.
        // We'll keep the 5% rule for consistency unless specified otherwise.
        const qualifyingParties: Array<{ id: string; votes: number }> = [];
        Object.entries(constituency.parties).forEach(([partyId, partyData]) => {
            const percentage = (partyData.votes / totalValidVotes) * 100;
            if (percentage >= THRESHOLD_PERCENTAGE) {
                qualifyingParties.push({ id: partyId, votes: partyData.votes });
            }
        });

        // 3. D'Hondt allocation for this constituency
        const quotients: Array<{ partyId: string; quotient: number }> = [];

        // Calculate quotients for all qualifying parties
        qualifyingParties.forEach(party => {
            for (let i = 1; i <= seatsToAllocate; i++) {
                quotients.push({
                    partyId: party.id,
                    quotient: party.votes / i
                });
            }
        });

        // Sort by quotient descending
        quotients.sort((a, b) => b.quotient - a.quotient);

        // Allocate seats
        for (let i = 0; i < seatsToAllocate; i++) {
            if (i < quotients.length) {
                const winnerId = quotients[i].partyId;
                seats[winnerId] = (seats[winnerId] || 0) + 1;
            }
        }
    });

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
