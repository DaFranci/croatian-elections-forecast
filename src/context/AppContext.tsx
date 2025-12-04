import React, { createContext, useContext, useState, ReactNode } from 'react';
import { AppState, VisualizationMode, ViewMode, Year } from '../types';

interface AppContextType extends AppState {
    setYear: (year: Year) => void;
    setVisualizationMode: (mode: VisualizationMode) => void;
    setViewMode: (mode: ViewMode) => void;
    setActiveId: (id: number | string | null) => void;
    setHoveredMunicipality: (id: string | undefined) => void;
    setZoomLevel: (zoom: number) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [state, setState] = useState<AppState>({
        year: 2024,
        visualizationMode: 'winner',
        viewMode: 'municipality',
        activeId: null,
        hoveredMunicipality: undefined,
        zoomLevel: 7,
    });

    const setYear = (year: Year) => {
        setState(prev => ({ ...prev, year }));
    };

    const setVisualizationMode = (mode: VisualizationMode) => {
        setState(prev => ({ ...prev, visualizationMode: mode }));
    };

    const setViewMode = (mode: ViewMode) => {
        setState(prev => ({ ...prev, viewMode: mode, activeId: null })); // Reset selection when changing view mode
    };

    const setActiveId = (id: number | string | null) => {
        setState(prev => ({ ...prev, activeId: id }));
    };

    const setHoveredMunicipality = (id: string | undefined) => {
        setState(prev => ({ ...prev, hoveredMunicipality: id }));
    };

    const setZoomLevel = (zoom: number) => {
        setState(prev => ({ ...prev, zoomLevel: zoom }));
    };

    return (
        <AppContext.Provider
            value={{
                ...state,
                setYear,
                setVisualizationMode,
                setViewMode,
                setActiveId,
                setHoveredMunicipality,
                setZoomLevel,
            }}
        >
            {children}
        </AppContext.Provider>
    );
};

export const useAppContext = () => {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error('useAppContext must be used within an AppProvider');
    }
    return context;
};
