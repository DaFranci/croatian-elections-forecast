import { ElectionData, PartyInfo, ElectionResult } from '../../types';
import { formatNumber, formatPercentage, getPartyColor } from '../../utils/dataProcessor';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import './MunicipalityDetail.css';

interface Props {
    municipalityId: string;
    electionData: ElectionData;
    parties: PartyInfo[];
}

function MunicipalityDetail({ municipalityId, electionData, parties }: Props) {
    const result = electionData.results[municipalityId] ||
        (electionData.constituencies ? electionData.constituencies[municipalityId] : undefined);

    if (!result) {
        return (
            <div className="sidebar-section">
                <p className="error-text">Municipality data not found</p>
            </div>
        );
    }

    // Prepare chart data
    const chartData = Object.entries(result.parties)
        .map(([partyId, partyData]) => ({
            party: parties.find(p => p.id === partyId)?.shortName || partyId,
            partyId,
            votes: partyData.votes,
            coalitionName: partyData.coalition_name,
            percentage: (partyData.votes / result.votes_cast) * 100,
        }))
        .sort((a, b) => b.votes - a.votes);

    const winnerParty = parties.find(p => p.id === result.winner);

    return (
        <div className="sidebar-section municipality-detail">
            <h3 className="municipality-name">{result.name}</h3>

            <div className="winner-badge" style={{
                backgroundColor: winnerParty ? `${winnerParty.color}20` : 'transparent',
                borderColor: winnerParty?.color || '#808080'
            }}>
                <span className="badge-label">Winner:</span>
                <span className="badge-value" style={{ color: winnerParty?.color }}>
                    {winnerParty?.shortName || result.winner}
                </span>
                {result.margin !== undefined && (
                    <span className="badge-margin">
                        +{formatPercentage(result.margin)}
                    </span>
                )}
            </div>

            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-label">Total Voters</div>
                    <div className="stat-value">{formatNumber(result.total_voters)}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-label">Votes Cast</div>
                    <div className="stat-value">{formatNumber(result.votes_cast)}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-label">Turnout</div>
                    <div className="stat-value">{formatPercentage(result.turnout * 100)}</div>
                </div>
            </div>

            <div className="chart-container">
                <h4 className="chart-title">Results by Party</h4>
                <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                        <XAxis type="number" stroke="#b8b8b8" fontSize={12} />
                        <YAxis type="category" dataKey="party" stroke="#b8b8b8" fontSize={12} width={80} />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: '#1a1a2e',
                                border: '1px solid #2a2a3e',
                                borderRadius: '8px',
                                color: '#ffffff',
                            }}
                            formatter={(value: number, name: string, props: any) => {
                                const coalitionInfo = props.payload.coalitionName
                                    ? `\n${props.payload.coalitionName}`
                                    : '';
                                return [
                                    `${formatNumber(value)} votes (${formatPercentage(props.payload.percentage)})${coalitionInfo}`,
                                    props.payload.party
                                ];
                            }}
                        />
                        <Bar dataKey="votes" radius={[0, 8, 8, 0]}>
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={getPartyColor(entry.partyId, parties)} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>

            <div className="results-table">
                {chartData.map(item => (
                    <div key={item.partyId} className="result-row" title={item.coalitionName || item.party}>
                        <div className="result-party">
                            <div
                                className="party-color-dot"
                                style={{ backgroundColor: getPartyColor(item.partyId, parties) }}
                            />
                            <span className="party-name">{item.party}</span>
                        </div>
                        <div className="result-stats">
                            <span className="result-votes">{formatNumber(item.votes)}</span>
                            <span className="result-percentage">{formatPercentage(item.percentage)}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default MunicipalityDetail;
