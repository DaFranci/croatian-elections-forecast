// Party votes with coalition information
export interface PartyVotes {
    votes: number;
    coalition_name?: string;
}

// Election data types
export interface ElectionResult {
    municipality_id: string;
    name: string;
    total_voters: number;
    votes_cast: number;
    turnout: number;
    parties: Record<string, PartyVotes>;
    constituency?: string;
    county?: string;
    seats?: number; // constituencies only
    unit?: 'grad' | 'općina'; // local elections
    mayor?: MayorRound[]; // local elections: every round held, the elected candidate marked
    winner?: string;
    margin?: number;
}

// One round of a mayoral election (local elections), candidates by votes
export interface MayorRound {
    round: number;
    total_voters: number;
    votes_cast: number;
    candidates: { name: string; votes: number; elected?: boolean }[];
}

export interface ElectionData {
    election_id: string;
    type?: 'parliamentary' | 'presidential' | 'eu' | 'local';
    date: string;
    turnout_national: number;
    seats?: number; // elections with a single national constituency
    results: Record<string, ElectionResult>;
    constituencies?: Record<string, ElectionResult>; // I-X on the map, XI = diaspora
    minorities?: MinorityGroup[]; // constituency XII
    round?: 1 | 2; // presidential elections
    candidates?: Record<string, Candidate>; // presidential elections, by the IDs used in results
}

// Presidential candidate: coloured by the party that nominated or backed them, or a colour of their own
export interface Candidate {
    name: string;
    party?: string;
    color?: string;
    label?: string;
}

// Constituency XII: each national minority group elects its candidates with the most votes
export interface MinorityGroup {
    id: string;
    name: string;
    seats: number;
    total_voters: number;
    votes_cast: number;
    turnout: number;
    candidates: { name: string; votes: number; elected: boolean }[];
}

// Selections for the units drawn as map insets rather than areas
export const DIASPORA_ID = 'XI';
export const MINORITIES_ID = 'XII';

export interface PartyInfo {
    id: string;
    name: string;
    shortName: string;
    color: string;
    coalition?: string[]; // partner labels when the list ran as a coalition, lead party first
    description?: string; // shown under the name, e.g. a presidential candidate's backing
    partyName?: string; // name and short name of the lead party on its own
    partyShortName?: string;
    campaignName?: boolean; // name is the coalition's campaign name rather than its partners
}

export interface GeoFeature {
    type: 'Feature';
    properties: {
        id: string;
        name: string;
        admin_level: number;
        [key: string]: any;
    };
    geometry: {
        type: 'Polygon' | 'MultiPolygon';
        coordinates: number[][][] | number[][][][];
    };
}

export interface GeoJSON {
    type: 'FeatureCollection';
    features: GeoFeature[];
}

// Visualization modes
export type VisualizationMode = 'winner' | 'margin' | 'turnout';
export type ViewMode = 'district' | 'municipality';

// Election types shown in the picker
export const ELECTION_TYPES = [
    { id: 'parliamentary', label: 'Parlamentarni izbori', available: true },
    { id: 'presidential', label: 'Predsjednički izbori', available: true },
    { id: 'local', label: 'Lokalni izbori', available: true },
    { id: 'eu', label: 'Izbori za Europski parlament', available: true },
] as const;
export type ElectionType = typeof ELECTION_TYPES[number]['id'];

// Available elections, oldest first, with the municipality and constituency
// boundaries in force. European elections have a single national constituency.
export const ELECTIONS = [
    { type: 'parliamentary', year: 2003, date: '23. studenoga 2003.', municipalities: 'municipalities-2003', constituencies: 'constituencies-1999' },
    { type: 'parliamentary', year: 2007, date: '25. studenoga 2007.', municipalities: 'municipalities', constituencies: 'constituencies-1999' },
    { type: 'parliamentary', year: 2011, date: '4. prosinca 2011.', municipalities: 'municipalities', constituencies: 'constituencies-1999' },
    { type: 'parliamentary', year: 2015, date: '8. studenoga 2015.', municipalities: 'municipalities', constituencies: 'constituencies-1999' },
    { type: 'parliamentary', year: 2016, date: '11. rujna 2016.', municipalities: 'municipalities', constituencies: 'constituencies-1999' },
    { type: 'parliamentary', year: 2020, date: '5. srpnja 2020.', municipalities: 'municipalities', constituencies: 'constituencies-1999' },
    { type: 'parliamentary', year: 2024, date: '17. travnja 2024.', municipalities: 'municipalities', constituencies: 'constituencies' },
    { type: 'eu', year: 2013, date: '14. travnja 2013.', municipalities: 'municipalities', constituencies: null },
    { type: 'eu', year: 2014, date: '25. svibnja 2014.', municipalities: 'municipalities', constituencies: null },
    { type: 'eu', year: 2019, date: '26. svibnja 2019.', municipalities: 'municipalities', constituencies: null },
    { type: 'eu', year: 2024, date: '9. lipnja 2024.', municipalities: 'municipalities', constituencies: null },
    // Local elections: the map shows councils; mayors are listed per municipality
    { type: 'local', year: 2013, date: '19. svibnja 2013.', municipalities: 'municipalities', constituencies: null },
    { type: 'local', year: 2017, date: '21. svibnja 2017.', municipalities: 'municipalities', constituencies: null },
    { type: 'local', year: 2021, date: '16. svibnja 2021.', municipalities: 'municipalities', constituencies: null },
    { type: 'local', year: 2025, date: '18. svibnja 2025.', municipalities: 'municipalities', constituencies: null },
    // Presidential elections have two rounds: date is the first, secondRound the runoff
    { type: 'presidential', year: 2005, date: '2. siječnja 2005.', secondRound: '16. siječnja 2005.', municipalities: 'municipalities-2005', constituencies: null },
    { type: 'presidential', year: 2009, date: '27. prosinca 2009.', secondRound: '10. siječnja 2010.', municipalities: 'municipalities', constituencies: null },
    { type: 'presidential', year: 2014, date: '28. prosinca 2014.', secondRound: '11. siječnja 2015.', municipalities: 'municipalities', constituencies: null },
    { type: 'presidential', year: 2019, date: '22. prosinca 2019.', secondRound: '5. siječnja 2020.', municipalities: 'municipalities', constituencies: null },
    { type: 'presidential', year: 2024, date: '29. prosinca 2024.', secondRound: '12. siječnja 2025.', municipalities: 'municipalities', constituencies: null },
] as const;
export type Year = typeof ELECTIONS[number]['year'];

export type Round = 1 | 2;

export function findElection(type: ElectionType, year: Year) {
    return ELECTIONS.find(e => e.type === type && e.year === year);
}

export const hasRounds = (type: ElectionType) => type === 'presidential';

// Name of the results file: '2024-parliamentary', '2024-presidential-2'
export function electionId(type: ElectionType, year: Year, round: Round) {
    return hasRounds(type) ? `${year}-${type}-${round}` : `${year}-${type}`;
}

export function electionDate(type: ElectionType, year: Year, round: Round) {
    const election = findElection(type, year);
    return election && round === 2 && 'secondRound' in election ? election.secondRound : election?.date;
}

// App state types
export interface AppState {
    electionType: ElectionType;
    year: Year;
    round: Round; // presidential elections
    visualizationMode: VisualizationMode;
    viewMode: ViewMode;
    activeId: number | string | null; // null = national view, number = district, string = municipality
    hoveredMunicipality?: string;
    zoomLevel: number;
}

// Map interaction types
export interface MapViewState {
    longitude: number;
    latitude: number;
    zoom: number;
    pitch?: number;
    bearing?: number;
}
