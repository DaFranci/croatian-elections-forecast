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
export type VisualizationMode = 'winner' | 'margin' | 'turnout' | 'swing';
export type ViewMode = 'municipality' | 'constituency';

// App state types
export interface AppState {
    selectedElection: string;
    comparisonElection?: string;
    visualizationMode: VisualizationMode;
    viewMode: ViewMode;
    selectedMunicipality?: string;
    hoveredMunicipality?: string;
    sidebarOpen: boolean;
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
