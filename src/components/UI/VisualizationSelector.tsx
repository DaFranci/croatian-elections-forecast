import { useAppContext } from '../../context/AppContext';
import { VisualizationMode } from '../../types';
import './VisualizationSelector.css';

const MODES: Array<{ id: VisualizationMode; label: string; icon: string }> = [
    { id: 'winner', label: 'Winner', icon: '🏆' },
    { id: 'margin', label: 'Margin', icon: '📊' },
    { id: 'turnout', label: 'Turnout', icon: '📈' },
    { id: 'swing', label: 'Swing', icon: '↔️' },
];

function VisualizationSelector() {
    const { visualizationMode, setVisualizationMode } = useAppContext();

    return (
        <div className="visualization-selector">
            {MODES.map(mode => (
                <button
                    key={mode.id}
                    className={`viz-mode-btn ${visualizationMode === mode.id ? 'active' : ''}`}
                    onClick={() => setVisualizationMode(mode.id)}
                    title={mode.label}
                >
                    <span className="mode-icon">{mode.icon}</span>
                    <span className="mode-label">{mode.label}</span>
                </button>
            ))}
        </div>
    );
}

export default VisualizationSelector;
