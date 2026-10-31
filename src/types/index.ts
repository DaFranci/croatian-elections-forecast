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
    winner?: string;
    margin?: number;
}

export interface ElectionData {
    election_id: string;
    date: string;
    turnout_national: number;
    seats?: number; // elections with a single national constituency
    results: Record<string, ElectionResult>;
    constituencies?: Record<string, ElectionResult>; // I-X on the map, XI = diaspora
    minorities?: MinorityGroup[]; // constituency XII
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
    { id: 'presidential', label: 'Predsjednički izbori', available: false },
    { id: 'local', label: 'Lokalni izbori', available: false },
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
] as const;
export type Year = typeof ELECTIONS[number]['year'];

export function findElection(type: ElectionType, year: Year) {
    return ELECTIONS.find(e => e.type === type && e.year === year);
}

// App state types
export interface AppState {
    electionType: ElectionType;
    year: Year;
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
