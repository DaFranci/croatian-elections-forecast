import React, { createContext, useContext, useState, ReactNode } from 'react';
import { AppState, ELECTIONS, ElectionType, VisualizationMode, ViewMode, Year, findElection } from '../types';

interface AppContextType extends AppState {
    setElectionType: (type: ElectionType) => void;
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
        electionType: 'parliamentary',
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

    // Keep the year if the new type has an election that year, otherwise show its latest.
    // Elections without constituencies (European) can only be shown by municipality.
    const setElectionType = (electionType: ElectionType) => {
        setState(prev => {
            const year = findElection(electionType, prev.year)
                ? prev.year
                : ELECTIONS.filter(e => e.type === electionType).slice(-1)[0]?.year ?? prev.year;
            const keepView = prev.viewMode === 'municipality' || !!findElection(electionType, year)?.constituencies;
            return {
                ...prev,
                electionType,
                year,
                ...(keepView ? {} : { viewMode: 'municipality' as const, activeId: null }),
            };
        });
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
                setElectionType,
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
