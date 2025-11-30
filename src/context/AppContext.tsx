import React, { createContext, useContext, useState, ReactNode } from 'react';
import { AppState, VisualizationMode, ViewMode } from '../types';

interface AppContextType extends AppState {
    setSelectedElection: (election: string) => void;
    setComparisonElection: (election: string | undefined) => void;
    setVisualizationMode: (mode: VisualizationMode) => void;
    setViewMode: (mode: ViewMode) => void;
    setSelectedMunicipality: (id: string | undefined) => void;
    setHoveredMunicipality: (id: string | undefined) => void;
    toggleSidebar: () => void;
    setZoomLevel: (zoom: number) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [state, setState] = useState<AppState>({
        selectedElection: '2024-parliamentary',
        comparisonElection: undefined,
        visualizationMode: 'winner',
        viewMode: 'municipality',
        selectedMunicipality: undefined,
        hoveredMunicipality: undefined,
        sidebarOpen: true,
        zoomLevel: 7,
    });

    const setSelectedElection = (election: string) => {
        setState(prev => ({ ...prev, selectedElection: election }));
    };

    const setComparisonElection = (election: string | undefined) => {
        setState(prev => ({
            ...prev,
            comparisonElection: election,
            visualizationMode: election ? 'swing' : 'winner'
        }));
    };

    const setVisualizationMode = (mode: VisualizationMode) => {
        setState(prev => ({ ...prev, visualizationMode: mode }));
    };

    const setViewMode = (mode: ViewMode) => {
        setState(prev => ({ ...prev, viewMode: mode }));
    };

    const setSelectedMunicipality = (id: string | undefined) => {
        setState(prev => ({ ...prev, selectedMunicipality: id }));
    };

    const setHoveredMunicipality = (id: string | undefined) => {
        setState(prev => ({ ...prev, hoveredMunicipality: id }));
    };

    const toggleSidebar = () => {
        setState(prev => ({ ...prev, sidebarOpen: !prev.sidebarOpen }));
    };

    const setZoomLevel = (zoom: number) => {
        setState(prev => ({ ...prev, zoomLevel: zoom }));
    };

    return (
        <AppContext.Provider
            value={{
                ...state,
                setSelectedElection,
                setComparisonElection,
                setVisualizationMode,
                setViewMode,
                setSelectedMunicipality,
                setHoveredMunicipality,
                toggleSidebar,
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
