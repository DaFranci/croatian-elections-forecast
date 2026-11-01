import { useEffect, useState, useCallback, useMemo } from 'react';
import Map, { Source, Layer, MapLayerMouseEvent, Popup } from 'react-map-gl/maplibre';
import type { FillLayer, LineLayer } from 'react-map-gl/maplibre';
import { useAppContext } from '../../context/AppContext';
import { loadGeoJSON, loadElectionData, loadPartyData } from '../../utils/dataLoader';
import { calculateWinners, getPartyColor, joinElectionWithGeo, NO_DATA_COLOR } from '../../utils/dataProcessor';
import { ElectionData, PartyInfo, findElection, electionId as fileId } from '../../types';
import MapInsets from './MapInsets';
import { withCoalitions } from '../../utils/coalitions';

const CROATIA_BOUNDS: [[number, number], [number, number]] = [[13.4, 42.35], [19.5, 46.6]];

// Last camera position, kept outside the component so it survives remounts
// (e.g. visiting the forecast page and coming back)
let lastViewState: { longitude: number; latitude: number; zoom: number } | null = null;

// Fit the whole of Croatia on first load into the space the floating panels leave free:
// the results sidebar on the right on desktop, controls and bottom sheet on mobile
function initialViewState() {
    if (lastViewState) return { ...lastViewState, pitch: 0, bearing: 0 };
    const desktop = window.matchMedia('(min-width: 1024px)').matches;
    return {
        bounds: CROATIA_BOUNDS,
        fitBoundsOptions: {
            padding: desktop
                ? { top: 30, bottom: 70, left: 30, right: 380 }
                : { top: 240, bottom: 110, left: 12, right: 12 },
        },
        pitch: 0,
        bearing: 0,
    };
}

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
        electionType,
        year,
        round,
        visualizationMode,
        viewMode,
        activeId,
        setActiveId,
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

    const electionId = fileId(electionType, year, round);

    // Boundaries in force for the selected election
    const electionInfo = findElection(electionType, year);
    const municipalityLevel = electionInfo?.municipalities ?? 'municipalities';
    const constituencyLevel = electionInfo?.constituencies ?? 'constituencies';

    useEffect(() => {
        async function loadData() {
            setLoading(true);
            try {
                const [geo, election, partyData] = await Promise.all([
                    loadGeoJSON(municipalityLevel),
                    loadElectionData(electionId),
                    loadPartyData(),
                ]);

                const processedElection = calculateWinners(election);
                const joinedData = joinElectionWithGeo(geo, processedElection);

                setGeoData(joinedData);
                setElectionData(processedElection);
                setParties(withCoalitions(partyData, processedElection, electionId));
            } catch (error) {
                console.error('Error loading data:', error);
            } finally {
                setLoading(false);
            }
        }

        loadData();
    }, [electionId, municipalityLevel]);

    // Load constituency GeoJSON when in district view (cached by loadGeoJSON)
    useEffect(() => {
        async function loadConstituencyData() {
            if (viewMode === 'district') {
                try {
                    const constGeo = await loadGeoJSON(constituencyLevel);
                    setConstituencyGeoData(constGeo);
                } catch (error) {
                    console.error('Error loading constituency data:', error);
                }
            }
        }
        loadConstituencyData();
    }, [viewMode, constituencyLevel]);

    const getFillOpacity = useCallback((): any => {
        if (visualizationMode !== 'margin' || !electionData) return 0.7;

        const opacityExpression: any = ['match', ['get', 'id']];

        Object.entries(electionData.results).forEach(([id, result]) => {
            let margin = result.margin || 0;

            if (viewMode === 'district' && result.constituency && electionData.constituencies) {
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
            if (viewMode === 'district' && result.constituency && electionData.constituencies) {
                const constId = result.constituency.split('.')[0].trim();
                const constResult = electionData.constituencies[constId];
                map[id] = constResult ? constResult.turnout : 0;
            } else {
                map[id] = result.turnout;
            }
        });
        return map;
    }, [electionData, viewMode]);

    const constituencyTurnoutMap = useMemo(() => {
        if (!electionData?.constituencies) return {};
        const map: Record<string, number> = {};
        Object.entries(electionData.constituencies).forEach(([id, data]) => {
            map[id] = data.turnout;
        });
        return map;
    }, [electionData]);

    const getFillColor = useCallback((): any => {
        if (!electionData || !parties.length) return '#808080';

        switch (visualizationMode) {
            case 'winner': {
                const colorExpression: any = ['match', ['get', 'id']];

                Object.entries(electionData.results).forEach(([id, result]) => {
                    let winnerId: string | undefined;

                    if (viewMode === 'district' && result.constituency && electionData.constituencies) {
                        const constId = result.constituency.split('.')[0].trim();
                        const constResult = electionData.constituencies[constId];
                        winnerId = constResult?.winner;
                    } else {
                        winnerId = result.winner;
                    }

                    if (winnerId) {
                        colorExpression.push(id, getPartyColor(winnerId, parties));
                    }
                });

                colorExpression.push(NO_DATA_COLOR);
                return colorExpression;
            }

            case 'turnout': {
                return [
                    'case',
                    ['==', ['typeof', ['get', ['get', 'id'], ['literal', turnoutMap]]], 'number'],
                    [
                        'interpolate',
                        ['linear'],
                        ['get', ['get', 'id'], ['literal', turnoutMap]],
                        0, '#FFFFFF',
                        1, '#276e27ff',
                    ],
                    NO_DATA_COLOR,
                ];
            }

            case 'margin': {
                const colorExpression: any = ['match', ['get', 'id']];

                Object.entries(electionData.results).forEach(([id, result]) => {
                    let winnerId: string | undefined;

                    if (viewMode === 'district' && result.constituency && electionData.constituencies) {
                        const constId = result.constituency.split('.')[0].trim();
                        const constResult = electionData.constituencies[constId];
                        winnerId = constResult?.winner;
                    } else {
                        winnerId = result.winner;
                    }

                    if (winnerId) {
                        colorExpression.push(id, getPartyColor(winnerId, parties));
                    }
                });

                colorExpression.push(NO_DATA_COLOR);
                return colorExpression;
            }

            default:
                return '#808080';
        }
    }, [visualizationMode, viewMode, electionData, parties, turnoutMap]);

    // Constituency fill color - uses constituency data directly
    const getConstituencyFillColor = useCallback((): any => {
        if (!electionData || !parties.length) return '#808080';

        if (visualizationMode === 'turnout') {
            return [
                'case',
                ['==', ['typeof', ['get', ['get', 'id'], ['literal', constituencyTurnoutMap]]], 'number'],
                [
                    'interpolate',
                    ['linear'],
                    ['get', ['get', 'id'], ['literal', constituencyTurnoutMap]],
                    0, '#FFFFFF',
                    1, '#276e27ff',
                ],
                NO_DATA_COLOR,
            ];
        }

        const colorExpression: any = ['match', ['get', 'id']];

        if (electionData.constituencies) {
            Object.entries(electionData.constituencies).forEach(([constId, constData]) => {
                const winnerId = constData.winner;
                if (winnerId) {
                    colorExpression.push(constId, getPartyColor(winnerId, parties));
                }
            });
        }

        colorExpression.push(NO_DATA_COLOR);
        return colorExpression;
    }, [electionData, parties, visualizationMode, constituencyTurnoutMap]);

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
        viewMode === 'district'
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
                ['==', ['to-string', ['get', 'id']], String(activeId) || ''],
                3,
                0.3,
            ],
        },
    }), [activeId]);

    const constituencyOutlineLayer: LineLayer = useMemo(() => ({
        id: 'constituencies-outline',
        type: 'line',
        paint: {
            'line-color': '#FFFFFF',
            'line-width': [
                'case',
                ['==', ['to-string', ['get', 'id']], String(activeId) || ''],
                3,
                0.3,
            ],
        },
    }), [activeId]);

    const handleClick = useCallback((event: MapLayerMouseEvent) => {
        const feature = event.features?.[0];
        if (feature) {
            const id = feature.properties?.id;
            // Municipalities that didn't exist yet (e.g. Vrsi in 2003) have no result to show
            if (viewMode === 'municipality' && !electionData?.results[id]) return;
            // Convert to number if it's a district ID (numeric string)
            const parsedId = viewMode === 'district' ? id : id;
            setActiveId(parsedId);
        }
    }, [setActiveId, viewMode, electionData]);

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
        const { longitude, latitude, zoom } = evt.viewState;
        lastViewState = { longitude, latitude, zoom };
        setZoomLevel(zoom);
    }, [setZoomLevel]);

    // Only block on the first load; later election switches keep the map mounted
    // so the zoom and position stay put while the new data arrives
    if (loading && !geoData) {
        return (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-100">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="mt-4 text-slate-600 text-lg">Loading map data...</p>
            </div>
        );
    }

    return (
        <div className="absolute inset-0 w-full h-full">
            <Map
                initialViewState={initialViewState()}
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
                {/* Constituency layers - shown in district view */}
                {constituencyGeoData && (
                    <Source id="constituencies-source" type="geojson" data={constituencyGeoData}>
                        {viewMode === 'district' && <Layer {...constituencyLayer} />}
                        {viewMode === 'district' && <Layer {...constituencyOutlineLayer} />}
                    </Source>
                )}

                {/* Municipality layers - always shown for interactions */}
                {geoData && (
                    <Source id="municipalities-source" type="geojson" data={geoData}>
                        {viewMode === 'municipality' && <Layer {...municipalityLayer} />}
                        {viewMode === 'municipality' && <Layer {...municipalityOutlineLayer} />}
                    </Source>
                )}

                {electionData && <MapInsets electionData={electionData} parties={parties} />}

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
                            {viewMode === 'municipality' && electionData && !electionData.results[hoverInfo.feature.properties.id] && (
                                <div style={{ fontSize: '0.8em', opacity: 0.8, marginTop: '2px' }}>
                                    Nema podataka za {year}.
                                </div>
                            )}
                            {viewMode === 'district' && electionData?.results[hoverInfo.feature.properties.id]?.constituency && (
                                <div style={{ fontSize: '0.8em', opacity: 0.8, marginTop: '2px' }}>
                                    {electionData.results[hoverInfo.feature.properties.id].constituency}
                                </div>
                            )}
                        </div>
                    </Popup>
                )}
            </Map>
        </div>
    );
}

export default ElectionMap;