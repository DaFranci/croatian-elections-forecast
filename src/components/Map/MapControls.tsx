import { useCallback } from 'react';
import { useMap } from 'react-map-gl/maplibre';
import { useAppContext } from '../../context/AppContext';
import { Button } from '@/components/ui/button';
import {
    ToggleGroup,
    ToggleGroupItem,
} from "@/components/ui/toggle-group"

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
        <div className="absolute top-6 right-6 flex flex-col gap-2 z-10 items-end max-md:top-4 max-md:right-4">
            <div className="mb-1 bg-[#1a1a2e]/90 backdrop-blur-sm border border-white/10 rounded-lg p-1">
                <ToggleGroup type="single" value={viewMode} onValueChange={(value) => { if (value) setViewMode(value as any) }}>
                    <ToggleGroupItem value="municipality" aria-label="Toggle municipality view" className="data-[state=on]:bg-[#e94560] data-[state=on]:text-white text-[#b8b8b8] hover:text-white hover:bg-white/10">
                        Municipality
                    </ToggleGroupItem>
                    <ToggleGroupItem value="constituency" aria-label="Toggle constituency view" className="data-[state=on]:bg-[#e94560] data-[state=on]:text-white text-[#b8b8b8] hover:text-white hover:bg-white/10">
                        Constituency
                    </ToggleGroupItem>
                </ToggleGroup>
            </div>

            <Button
                variant="outline"
                size="icon"
                className="bg-[#1a1a2e]/90 backdrop-blur-sm hover:bg-[#1a1a2e] hover:border-[#e94560] hover:scale-105 active:scale-95 max-md:w-9 max-md:h-9"
                onClick={handleZoomIn}
                title="Zoom In"
                aria-label="Zoom In"
            >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10 4v12M4 10h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
            </Button>

            <Button
                variant="outline"
                size="icon"
                className="bg-[#1a1a2e]/90 backdrop-blur-sm hover:bg-[#1a1a2e] hover:border-[#e94560] hover:scale-105 active:scale-95 max-md:w-9 max-md:h-9"
                onClick={handleZoomOut}
                title="Zoom Out"
                aria-label="Zoom Out"
            >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M4 10h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
            </Button>

            <Button
                variant="outline"
                size="icon"
                className="bg-[#1a1a2e]/90 backdrop-blur-sm hover:bg-[#1a1a2e] hover:border-[#e94560] hover:scale-105 active:scale-95 max-md:w-9 max-md:h-9"
                onClick={handleResetView}
                title="Reset View"
                aria-label="Reset View"
            >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10 2a8 8 0 100 16 8 8 0 000-16zm0 14a6 6 0 110-12 6 6 0 010 12z" />
                    <path d="M10 6v4l3 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
                </svg>
            </Button>
        </div>
    );
}

export default MapControls;
