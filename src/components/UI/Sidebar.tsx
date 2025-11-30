import { useEffect, useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { loadElectionData, loadPartyData } from '../../utils/dataLoader';
import { calculateWinners, calculateSeats, formatNumber, formatPercentage } from '../../utils/dataProcessor';
import { ElectionData, PartyInfo } from '../../types';
import MunicipalityDetail from './MunicipalityDetail';
import NationalSummary from './NationalSummary';
import './Sidebar.css';

function Sidebar() {
    const { sidebarOpen, selectedMunicipality, selectedElection, viewMode } = useAppContext();
    const [electionData, setElectionData] = useState<ElectionData | null>(null);
    const [parties, setParties] = useState<PartyInfo[]>([]);

    useEffect(() => {
        async function loadData() {
            try {
                const [election, partyData] = await Promise.all([
                    loadElectionData(selectedElection),
                    loadPartyData(),
                ]);

                const processedElection = calculateWinners(election);
                setElectionData(processedElection);
                setParties(partyData);
            } catch (error) {
                console.error('Error loading sidebar data:', error);
            }
        }

        loadData();
    }, [selectedElection]);

    if (!sidebarOpen) {
        return null;
    }

    return (
        <aside className="sidebar">
            <div className="sidebar-content">
                <div className="sidebar-section">
                    <h2 className="section-title">
                        <span className="title-icon">dY-3�,?</span>
                        2024 Parliamentary Elections
                    </h2>
                    <div className="election-meta">
                        <div className="meta-item">
                            <span className="meta-label">Date:</span>
                            <span className="meta-value">April 17, 2024</span>
                        </div>
                        <div className="meta-item">
                            <span className="meta-label">National Turnout:</span>
                            <span className="meta-value">
                                {electionData && formatPercentage(electionData.turnout_national * 100)}
                            </span>
                        </div>
                    </div>
                </div>

                {electionData && parties.length > 0 && (
                    <NationalSummary electionData={electionData} parties={parties} />
                )}

                {selectedMunicipality && electionData && parties.length > 0 && (
                    <MunicipalityDetail
                        municipalityId={selectedMunicipality}
                        electionData={electionData}
                        parties={parties}
                    />
                )}

                {!selectedMunicipality && (
                    <div className="sidebar-section">
                        <div className="info-box">
                            <p className="info-text">
                                dY`+ Click on a {viewMode === 'constituency' ? 'constituency' : 'municipality'} to see detailed results
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </aside>
    );
}

export default Sidebar;
