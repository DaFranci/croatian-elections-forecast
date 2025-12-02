import { ElectionData, PartyInfo } from '../../types';
import { calculateSeats, formatNumber, getPartyColor } from '../../utils/dataProcessor';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import './NationalSummary.css';

interface Props {
    electionData: ElectionData;
    parties: PartyInfo[];
}

function NationalSummary({ electionData, parties }: Props) {
    const seats = calculateSeats(electionData);

    // Prepare chart data
    const chartData = Object.entries(seats)
        .map(([partyId, seatCount]) => ({
            name: parties.find(p => p.id === partyId)?.shortName || partyId,
            partyId,
            value: seatCount,
            color: getPartyColor(partyId, parties),
        }))
        .sort((a, b) => b.value - a.value);

    return (
        <div className="sidebar-section national-summary">
            <h3 className="section-title">
                <span className="title-icon">🏛️</span>
                Parliament Seats (D'Hondt)
            </h3>

            <div className="seats-chart">
                <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                        <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={80}
                            paddingAngle={2}
                            dataKey="value"
                        >
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Pie>
                        <Tooltip
                            contentStyle={{
                                backgroundColor: '#1a1a2e',
                                border: '1px solid #2a2a3e',
                                borderRadius: '8px',
                                color: '#ffffff',
                            }}
                            formatter={(value: number, name: string) => [`${value} seats`, name]}
                        />
                    </PieChart>
                </ResponsiveContainer>
            </div>

            <div className="seats-list">
                {chartData.map(item => (
                    <div key={item.partyId} className="seat-row">
                        <div className="seat-party">
                            <div
                                className="party-color-bar"
                                style={{ backgroundColor: item.color }}
                            />
                            <span className="party-name">{item.name}</span>
                        </div>
                        <div className="seat-count">{item.value}</div>
                    </div>
                ))}
            </div>

            <div className="total-seats">
                Total: {Object.values(seats).reduce((a, b) => a + b, 0)} seats
            </div>
        </div>
    );
}

export default NationalSummary;
