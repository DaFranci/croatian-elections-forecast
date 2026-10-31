// Published forecast (public/data/forecast/forecast.json)

export interface Range {
    lo: number;
    median: number;
    hi: number;
}

export interface ForecastList {
    id: string;
    name: string;
    color: string;
    result2024: number | null; // share of the domestic vote, null for lists that didn't run
    pollAverage: { mean: number; lo: number; hi: number }; // 80 % band, % of decided voters
    vote: Range; // simulated election-day share, 10th / 50th / 90th percentile
    seats: Range;
    expectedSeats: number; // mean seats rounded so all lists add up to the 143 non-minority seats
    pLargest: number;
    seatDistribution: number[]; // probability of each seat count, index = seats
}

export interface ForecastBloc {
    name: string;
    lists: string[];
    medianSeats: number;
    lo: number;
    hi: number;
    pMajority: number;
    pMajorityWithMinorities: number;
}

// One point per week; each list holds [lo, mean, hi] of the 80 % band
export type TrendPoint = { date: string } & Record<string, [number, number, number] | string>;
export type PollPoint = { date: string; firm: string } & Record<string, number | string>;

export interface ForecastData {
    updated: string;
    electionDay: string;
    lastElection: string;
    simulations: number;
    majority: number;
    minoritySeats: number;
    diaspora: Record<string, number>;
    pollCount: number;
    lists: ForecastList[];
    othersVote: number;
    trendLists: string[];
    trend: TrendPoint[];
    polls: PollPoint[];
    blocs: ForecastBloc[];
}
