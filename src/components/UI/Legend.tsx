import { useAppContext } from '../../context/AppContext';
import { useEffect, useState } from 'react';
import { loadPartyData } from '../../utils/dataLoader';
import { PartyInfo } from '../../types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

function Legend() {
    const { visualizationMode } = useAppContext();
    const [parties, setParties] = useState<PartyInfo[]>([]);

    useEffect(() => {
        async function loadParties() {
            try {
                const partyData = await loadPartyData();
                setParties(partyData);
            } catch (error) {
                console.error('Error loading parties:', error);
            }
        }
        loadParties();
    }, []);

    const renderLegend = () => {
        switch (visualizationMode) {
            case 'winner':
            case 'margin':
                return (
                    <>
                        <CardHeader className="p-4 pb-2">
                            <CardTitle className="text-sm font-semibold text-white uppercase tracking-wide">
                                {visualizationMode === 'winner' ? 'Winning Party' : 'Victory Margin'}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0 flex flex-col gap-2">
                            {parties.map(party => (
                                <div key={party.id} className="flex items-center gap-2">
                                    <div
                                        className="w-4 h-4 rounded shadow-sm"
                                        style={{ backgroundColor: party.color }}
                                    />
                                    <span className="text-sm text-white font-medium">{party.shortName}</span>
                                </div>
                            ))}
                            {visualizationMode === 'margin' && (
                                <div className="text-xs text-[#b8b8b8] italic mt-2 border-t border-white/10 pt-2">
                                    Opacity indicates margin strength
                                </div>
                            )}
                        </CardContent>
                    </>
                );

            case 'turnout':
                return (
                    <>
                        <CardHeader className="p-4 pb-2">
                            <CardTitle className="text-sm font-semibold text-white uppercase tracking-wide">Voter Turnout</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0 flex flex-col gap-2">
                            <div
                                className="h-4 rounded shadow-inner"
                                style={{
                                    background: 'linear-gradient(to right, #404040, #FFA500, #00FF00)'
                                }}
                            />
                            <div className="flex justify-between text-xs text-white font-medium">
                                <span>40%</span>
                                <span>50%</span>
                                <span>70%+</span>
                            </div>
                        </CardContent>
                    </>
                );

            case 'swing':
                return (
                    <>
                        <CardHeader className="p-4 pb-2">
                            <CardTitle className="text-sm font-semibold text-white uppercase tracking-wide">Political Swing</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0 flex flex-col gap-2">
                            <div
                                className="h-4 rounded shadow-inner"
                                style={{
                                    background: 'linear-gradient(to right, #E31E24, #FFFFFF, #0047AB)'
                                }}
                            />
                            <div className="flex justify-between text-xs text-white font-medium">
                                <span>← Left</span>
                                <span>No Change</span>
                                <span>Right →</span>
                            </div>
                        </CardContent>
                    </>
                );

            default:
                return null;
        }
    };

    return (
        <Card className="absolute bottom-6 left-6 bg-[#1a1a2e]/90 backdrop-blur-sm border-white/10 max-w-[220px] shadow-xl">
            {renderLegend()}
        </Card>
    );
}

export default Legend;
