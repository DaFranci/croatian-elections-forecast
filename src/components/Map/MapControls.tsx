import { useCallback } from 'react';
import { useMap } from 'react-map-gl/maplibre';
import { useAppContext } from '../../context/AppContext';
import './MapControls.css';

function MapControls() {
    const { current: map } = useMap();
    const { viewMode, setViewMode } = useAppContext();

    const handleZoomIn = useCallback(() => {
        map?.zoomIn();
    }, [map]);

    const handleZoomOut = useCallback(() => {
        map?.zoomOut();
    }, [map]);

    const handleResetView = useCallback(() => {
        map?.flyTo({
            center: [16.5, 44.5],
            zoom: 7,
            duration: 1000,
        });
    }, [map]);

    return (
        <div className="map-controls">
            <div className="view-mode-selector">
                <select
                    value={viewMode}
                    onChange={(e) => setViewMode(e.target.value as any)}
                    className="map-control-select"
                >
                    <option value="municipality">By Municipality</option>
                    <option value="constituency">By Voting District</option>
                </select>
            </div>

            <button
                className="map-control-btn"
                onClick={handleZoomIn}
                title="Zoom In"
                aria-label="Zoom In"
            >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10 4v12M4 10h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
            </button>

            <button
                className="map-control-btn"
                onClick={handleZoomOut}
                title="Zoom Out"
                aria-label="Zoom Out"
            >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M4 10h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
            </button>

            <button
                className="map-control-btn"
                onClick={handleResetView}
                title="Reset View"
                aria-label="Reset View"
            >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10 2a8 8 0 100 16 8 8 0 000-16zm0 14a6 6 0 110-12 6 6 0 010 12z" />
                    <path d="M10 6v4l3 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
                </svg>
            </button>
        </div>
    );
}

export default MapControls;
