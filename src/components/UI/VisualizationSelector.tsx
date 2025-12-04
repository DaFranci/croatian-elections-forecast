import { useAppContext } from '../../context/AppContext';
import { VisualizationMode } from '../../types';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

const MODES: Array<{ id: VisualizationMode; label: string; icon: string }> = [
    { id: 'winner', label: 'Winner', icon: '🏆' },
    { id: 'margin', label: 'Margin', icon: '📊' },
    { id: 'turnout', label: 'Turnout', icon: '📈' },
    { id: 'swing', label: 'Swing', icon: '↔️' },
];

function VisualizationSelector() {
    const { visualizationMode, setVisualizationMode } = useAppContext();

    return (
        <Tabs
            value={visualizationMode}
            onValueChange={(val) => setVisualizationMode(val as VisualizationMode)}
            className="w-full max-w-[600px]"
        >
            <TabsList className="grid w-full grid-cols-4 bg-[#1a1a2e]/80 border border-white/10">
                {MODES.map(mode => (
                    <TabsTrigger
                        key={mode.id}
                        value={mode.id}
                        className="data-[state=active]:bg-[#e94560] data-[state=active]:text-white text-[#b8b8b8] hover:text-white transition-colors"
                    >
                        <span className="mr-2 text-lg">{mode.icon}</span>
                        <span className="hidden md:inline">{mode.label}</span>
                    </TabsTrigger>
                ))}
            </TabsList>
        </Tabs>
    );
}

export default VisualizationSelector;
