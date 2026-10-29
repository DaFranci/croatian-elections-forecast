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
    winner?: string;
    margin?: number;
}

export interface ElectionData {
    election_id: string;
    date: string;
    turnout_national: number;
    results: Record<string, ElectionResult>;
    constituencies?: Record<string, ElectionResult>;
}

export interface PartyInfo {
    id: string;
    name: string;
    shortName: string;
    color: string;
    coalition?: string[];
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

// Available elections, oldest first
export const ELECTIONS = [
    { year: 2007, date: '25. studenoga 2007.' },
    { year: 2011, date: '4. prosinca 2011.' },
    { year: 2015, date: '8. studenoga 2015.' },
    { year: 2016, date: '11. rujna 2016.' },
    { year: 2020, date: '5. srpnja 2020.' },
    { year: 2024, date: '17. travnja 2024.' },
] as const;
export type Year = typeof ELECTIONS[number]['year'];

// App state types
export interface AppState {
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
