import { useEffect, useState, useCallback, useMemo } from 'react';
import Map, { Source, Layer, MapLayerMouseEvent, Popup } from 'react-map-gl/maplibre';
import type { FillLayer, LineLayer } from 'react-map-gl/maplibre';
import { useAppContext } from '../../context/AppContext';
import { loadGeoJSON, loadElectionData, loadPartyData } from '../../utils/dataLoader';
import { calculateWinners, joinElectionWithGeo } from '../../utils/dataProcessor';
import { ElectionData, PartyInfo } from '../../types';
import MapControls from './MapControls';
import Legend from '../UI/Legend';
import './ElectionMap.css';

const INITIAL_VIEW_STATE = {
    longitude: 16.5,
    latitude: 44.5,
    zoom: 7,
    pitch: 0,
    bearing: 0,
};

const BASE_MAP_STYLE = {
    version: 8 as const,
    sources: {},
    layers: [
        {
            id: 'background',
            type: 'background' as const,
            paint: {
                'background-color': '#F0F2F5',
            },
        },
    ],
};

function ElectionMap() {
    const {
        selectedElection,
        visualizationMode,
        viewMode,
        selectedMunicipality,
        setSelectedMunicipality,
        setHoveredMunicipality,
        setZoomLevel,
    } = useAppContext();

    const [geoData, setGeoData] = useState<any>(null);
    const [constituencyGeoData, setConstituencyGeoData] = useState<any>(null);
    const [electionData, setElectionData] = useState<ElectionData | null>(null);
    const [parties, setParties] = useState<PartyInfo[]>([]);
    const [loading, setLoading] = useState(true);
    const [cursor, setCursor] = useState<string>('grab');
    const [hoverInfo, setHoverInfo] = useState<{
        longitude: number;
        latitude: number;
        feature: any;
    } | null>(null);

    useEffect(() => {
        async function loadData() {
            setLoading(true);
            try {
                const [geo, election, partyData] = await Promise.all([
                    loadGeoJSON('municipalities'),
                    loadElectionData(selectedElection),
                    loadPartyData(),
                ]);

                const processedElection = calculateWinners(election);
                const joinedData = joinElectionWithGeo(geo, processedElection);

                setGeoData(joinedData);
                setElectionData(processedElection);
                setParties(partyData);
            } catch (error) {
                console.error('Error loading data:', error);
            } finally {
                setLoading(false);
            }
        }

        loadData();
    }, [selectedElection]);

    // Load constituency GeoJSON when switching to constituency view
    useEffect(() => {
        async function loadConstituencyData() {
            if (viewMode === 'constituency' && !constituencyGeoData) {
                try {
                    const constGeo = await loadGeoJSON('constituencies');
                    setConstituencyGeoData(constGeo);
                } catch (error) {
                    console.error('Error loading constituency data:', error);
                }
            }
        }
        loadConstituencyData();
    }, [viewMode, constituencyGeoData]);

    const getFillOpacity = useCallback((): any => {
        if (visualizationMode !== 'margin' || !electionData) return 0.7;

        const opacityExpression: any = ['match', ['get', 'id']];

        Object.entries(electionData.results).forEach(([id, result]) => {
            let margin = result.margin || 0;

            if (viewMode === 'constituency' && result.constituency && electionData.constituencies) {
                const constId = result.constituency.split('.')[0].trim();
                const constResult = electionData.constituencies[constId];
                margin = constResult?.margin || 0;
            }

            const opacity = 0.3 + (margin / 100) * 0.7;
            opacityExpression.push(id, opacity);
        });

        opacityExpression.push(0.5);
        return opacityExpression;
    }, [visualizationMode, viewMode, electionData]);

    const turnoutMap = useMemo(() => {
        if (!electionData) return {};

        const map: Record<string, number> = {};
        Object.entries(electionData.results).forEach(([id, result]) => {
            if (viewMode === 'constituency' && result.constituency && electionData.constituencies) {
                const constId = result.constituency.split('.')[0].trim();
                const constResult = electionData.constituencies[constId];
                map[id] = constResult ? constResult.turnout : 0;
            } else {
                map[id] = result.turnout;
            }
        });
        return map;
    }, [electionData, viewMode]);

    const getFillColor = useCallback((): any => {
        if (!electionData || !parties.length) return '#808080';

        switch (visualizationMode) {
            case 'winner': {
                const colorExpression: any = ['match', ['get', 'id']];

                Object.entries(electionData.results).forEach(([id, result]) => {
                    let winnerId: string | undefined;

                    if (viewMode === 'constituency' && result.constituency && electionData.constituencies) {
                        const constId = result.constituency.split('.')[0].trim();
                        const constResult = electionData.constituencies[constId];
                        winnerId = constResult?.winner;
                    } else {
                        winnerId = result.winner;
                    }

                    if (winnerId) {
                        const party = parties.find(p => p.id === winnerId);
                        if (party) {
                            colorExpression.push(id, party.color);
                        }
                    }
                });

                colorExpression.push('#404040');
                return colorExpression;
            }

            case 'turnout': {
                return [
                    'interpolate',
                    ['linear'],
                    ['get', ['get', 'id'], ['literal', turnoutMap]],
                    0.4, '#404040',
                    0.5, '#FFA500',
                    0.7, '#00FF00',
                ];
            }

            case 'margin': {
                const colorExpression: any = ['match', ['get', 'id']];

                Object.entries(electionData.results).forEach(([id, result]) => {
                    let winnerId: string | undefined;

                    if (viewMode === 'constituency' && result.constituency && electionData.constituencies) {
                        const constId = result.constituency.split('.')[0].trim();
                        const constResult = electionData.constituencies[constId];
                        winnerId = constResult?.winner;
                    } else {
                        winnerId = result.winner;
                    }

                    if (winnerId) {
                        const party = parties.find(p => p.id === winnerId);
                        if (party) {
                            colorExpression.push(id, party.color);
                        }
                    }
                });

                colorExpression.push('#404040');
                return colorExpression;
            }

            default:
                return '#808080';
        }
    }, [visualizationMode, viewMode, electionData, parties, turnoutMap]);

    // Constituency fill color - uses constituency data directly
    const getConstituencyFillColor = useCallback((): any => {
        if (!electionData || !parties.length) return '#808080';

        const colorExpression: any = ['match', ['get', 'id']];

        if (electionData.constituencies) {
            Object.entries(electionData.constituencies).forEach(([constId, constData]) => {
                const winnerId = constData.winner;
                if (winnerId) {
                    const party = parties.find(p => p.id === winnerId);
                    if (party) {
                        colorExpression.push(constId, party.color);
                    }
                }
            });
        }

        colorExpression.push('#404040');
        return colorExpression;
    }, [electionData, parties]);

    // Constituency fill opacity
    const getConstituencyFillOpacity = useCallback((): any => {
        if (visualizationMode !== 'margin' || !electionData) return 0.7;

        const opacityExpression: any = ['match', ['get', 'id']];

        if (electionData.constituencies) {
            Object.entries(electionData.constituencies).forEach(([constId, constData]) => {
                const margin = constData.margin || 0;
                const opacity = 0.3 + (margin / 100) * 0.7;
                opacityExpression.push(constId, opacity);
            });
        }

        opacityExpression.push(0.5);
        return opacityExpression;
    }, [visualizationMode, electionData]);

    const municipalityLayer: FillLayer = useMemo(() => ({
        id: 'municipalities',
        type: 'fill',
        paint: {
            'fill-color': getFillColor(),
            'fill-opacity': getFillOpacity(),
        },
    }), [getFillColor, getFillOpacity]);

    const constituencyLayer: FillLayer = useMemo(() => ({
        id: 'constituencies',
        type: 'fill',
        paint: {
            'fill-color': getConstituencyFillColor(),
            'fill-opacity': getConstituencyFillOpacity(),
        },
    }), [getConstituencyFillColor, getConstituencyFillOpacity]);

    const interactiveLayers = useMemo(() => (
        viewMode === 'constituency'
            ? ['constituencies']
            : ['municipalities']
    ), [viewMode]);

    const municipalityOutlineLayer: LineLayer = useMemo(() => ({
        id: 'municipalities-outline',
        type: 'line',
        paint: {
            'line-color': '#FFFFFF',
            'line-width': [
                'case',
                ['==', ['to-string', ['get', 'id']], selectedMunicipality || ''],
                3,
                0.9,
            ],
        },
    }), [selectedMunicipality]);

    const constituencyOutlineLayer: LineLayer = useMemo(() => ({
        id: 'constituencies-outline',
        type: 'line',
        paint: {
            'line-color': '#FFFFFF',
            'line-width': [
                'case',
                ['==', ['to-string', ['get', 'id']], selectedMunicipality || ''],
                3,
                0.9,
            ],
        },
    }), [selectedMunicipality]);

    const handleClick = useCallback((event: MapLayerMouseEvent) => {
        const feature = event.features?.[0];
        if (feature) {
            setSelectedMunicipality(feature.properties?.id);
        }
    }, [setSelectedMunicipality]);

    const handleMouseMove = useCallback((event: MapLayerMouseEvent) => {
        const feature = event.features?.[0];
        const featureId = feature?.properties?.id;

        if (feature) {
            setCursor('pointer');
            setHoveredMunicipality((prev: string | undefined) => (prev !== featureId ? featureId : prev));
            setHoverInfo({
                longitude: event.lngLat.lng,
                latitude: event.lngLat.lat,
                feature: feature
            });
        } else {
            setCursor('grab');
            setHoveredMunicipality(undefined);
            setHoverInfo(null);
        }
    }, [setHoveredMunicipality]);

    const handleMouseLeave = useCallback(() => {
        setCursor('grab');
        setHoveredMunicipality(undefined);
        setHoverInfo(null);
    }, [setHoveredMunicipality]);

    const handleZoom = useCallback((evt: any) => {
        setZoomLevel(evt.viewState.zoom);
    }, [setZoomLevel]);

    if (loading) {
        return (
            <div className="map-container">
                <div className="map-loading">
                    <div className="loading-spinner"></div>
                    <p>Loading election data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="map-container">
            <Map
                initialViewState={INITIAL_VIEW_STATE}
                style={{ width: '100%', height: '100%' }}
                mapStyle={BASE_MAP_STYLE}
                interactiveLayerIds={interactiveLayers}
                onClick={handleClick}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                onMove={handleZoom}
                cursor={cursor}
                reuseMaps
            >
                {/* Constituency layers - shown in constituency view */}
                {constituencyGeoData && (
                    <Source id="constituencies-source" type="geojson" data={constituencyGeoData}>
                        {viewMode === 'constituency' && <Layer {...constituencyLayer} />}
                        {viewMode === 'constituency' && <Layer {...constituencyOutlineLayer} />}
                    </Source>
                )}

                {/* Municipality layers - always shown for interactions */}
                {geoData && (
                    <Source id="municipalities-source" type="geojson" data={geoData}>
                        {viewMode === 'municipality' && <Layer {...municipalityLayer} />}
                        {viewMode === 'municipality' && <Layer {...municipalityOutlineLayer} />}
                    </Source>
                )}

                {hoverInfo && (
                    <Popup
                        longitude={hoverInfo.longitude}
                        latitude={hoverInfo.latitude}
                        offset={[0, -10]}
                        closeButton={false}
                        className="municipality-tooltip"
                    >
                        <div className="municipality-name">
                            {hoverInfo.feature.properties.name}
                            {viewMode === 'constituency' && electionData?.results[hoverInfo.feature.properties.id]?.constituency && (
                                <div style={{ fontSize: '0.8em', opacity: 0.8, marginTop: '2px' }}>
                                    {electionData.results[hoverInfo.feature.properties.id].constituency}
                                </div>
                            )}
                        </div>
                    </Popup>
                )}

                <Legend />
                <MapControls />
            </Map>
        </div>
    );
}

export default ElectionMap;