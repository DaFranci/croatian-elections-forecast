import { ElectionData, PartyInfo, GeoJSON } from '../types';

// Cache for loaded data
const dataCache = new Map<string, any>();

/**
 * Load municipality ID mapping
 */
async function loadMunicipalityMapping(): Promise<Record<string, string>> {
    const cacheKey = 'municipality-mapping';

    if (dataCache.has(cacheKey)) {
        return dataCache.get(cacheKey);
    }

    try {
        const response = await fetch('/data/elections/municipality_mapping.json');
        if (!response.ok) {
            console.warn('Municipality mapping not found, using direct IDs');
            return {};
        }
        const data = await response.json();
        dataCache.set(cacheKey, data);
        return data;
    } catch (error) {
        console.warn('Error loading municipality mapping:', error);
        return {};
    }
}

/**
 * Load election data from JSON file and apply municipality ID mapping
 */
export async function loadElectionData(electionId: string): Promise<ElectionData> {
    const cacheKey = `election-${electionId}`;

    if (dataCache.has(cacheKey)) {
        return dataCache.get(cacheKey);
    }

    try {
        const response = await fetch(`/data/elections/${electionId}.json`);
        if (!response.ok) {
            throw new Error(`Failed to load election data: ${response.statusText}`);
        }
        const data = await response.json();

        // Load and apply municipality mapping
        const mapping = await loadMunicipalityMapping();

        // Remap municipality IDs if mapping exists
        if (Object.keys(mapping).length > 0) {
            const remappedResults: Record<string, any> = {};

            Object.entries(data.results).forEach(([oldId, result]: [string, any]) => {
                const newId = mapping[oldId] || oldId;
                remappedResults[newId] = {
                    ...result,
                    municipality_id: newId
                };
            });

            data.results = remappedResults;
        }

        dataCache.set(cacheKey, data);
        return data;
    } catch (error) {
        console.error('Error loading election data:', error);
        throw error;
    }
}

/**
 * Load party metadata
 */
export async function loadPartyData(): Promise<PartyInfo[]> {
    const cacheKey = 'parties';

    if (dataCache.has(cacheKey)) {
        return dataCache.get(cacheKey);
    }

    try {
        const response = await fetch('/data/elections/parties.json');
        if (!response.ok) {
            throw new Error(`Failed to load party data: ${response.statusText}`);
        }
        const data = await response.json();
        dataCache.set(cacheKey, data);
        return data;
    } catch (error) {
        console.error('Error loading party data:', error);
        throw error;
    }
}

/**
 * Load GeoJSON data for administrative boundaries
 */
export async function loadGeoJSON(level: 'counties' | 'municipalities' | 'municipalities-2003' | 'zagreb-districts' | 'constituencies' | 'constituencies-1999'): Promise<GeoJSON> {
    const cacheKey = `geo-${level}`;

    if (dataCache.has(cacheKey)) {
        return dataCache.get(cacheKey);
    }

    try {
        const response = await fetch(`/data/geospatial/${level}.geojson`);
        if (!response.ok) {
            throw new Error(`Failed to load GeoJSON: ${response.statusText}`);
        }
        const data = await response.json();
        dataCache.set(cacheKey, data);
        return data;
    } catch (error) {
        console.error('Error loading GeoJSON:', error);
        throw error;
    }
}

/**
 * Clear data cache (useful for development)
 */
export function clearCache() {
    dataCache.clear();
}
