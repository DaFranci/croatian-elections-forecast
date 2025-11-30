import { useAppContext } from '../../context/AppContext';
import { useEffect, useState } from 'react';
import { loadPartyData } from '../../utils/dataLoader';
import { PartyInfo } from '../../types';
import './Legend.css';

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
                    <div className="legend-items">
                        <div className="legend-title">
                            {visualizationMode === 'winner' ? 'Winning Party' : 'Victory Margin'}
                        </div>
                        {parties.map(party => (
                            <div key={party.id} className="legend-item">
                                <div
                                    className="legend-color"
                                    style={{ backgroundColor: party.color }}
                                />
                                <span className="legend-label">{party.shortName}</span>
                            </div>
                        ))}
                        {visualizationMode === 'margin' && (
                            <div className="legend-note">
                                Opacity indicates margin strength
                            </div>
                        )}
                    </div>
                );

            case 'turnout':
                return (
                    <div className="legend-items">
                        <div className="legend-title">Voter Turnout</div>
                        <div className="legend-gradient">
                            <div
                                className="gradient-bar"
                                style={{
                                    background: 'linear-gradient(to right, #404040, #FFA500, #00FF00)'
                                }}
                            />
                            <div className="gradient-labels">
                                <span>40%</span>
                                <span>50%</span>
                                <span>70%+</span>
                            </div>
                        </div>
                    </div>
                );

            case 'swing':
                return (
                    <div className="legend-items">
                        <div className="legend-title">Political Swing</div>
                        <div className="legend-gradient">
                            <div
                                className="gradient-bar"
                                style={{
                                    background: 'linear-gradient(to right, #E31E24, #FFFFFF, #0047AB)'
                                }}
                            />
                            <div className="gradient-labels">
                                <span>← Left</span>
                                <span>No Change</span>
                                <span>Right →</span>
                            </div>
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="legend">
            {renderLegend()}
        </div>
    );
}

export default Legend;
