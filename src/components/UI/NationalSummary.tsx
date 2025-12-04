import { ElectionData, PartyInfo } from '../../types';
import { calculateSeats, getPartyColor } from '../../utils/dataProcessor';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

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
        <Card className="bg-white/[0.02] border-white/5">
            <CardHeader>
                <CardTitle className="text-xl font-bold text-white flex items-center gap-2">
                    <span className="text-3xl">🏛️</span>
                    Parliament Seats (D'Hondt)
                </CardTitle>
            </CardHeader>

            <CardContent>
                <div className="mb-4">
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

                <div className="flex flex-col gap-2 mb-4">
                    {chartData.map(item => (
                        <div key={item.partyId} className="flex justify-between items-center p-2 bg-white/[0.03] rounded-lg">
                            <div className="flex items-center gap-2">
                                <div
                                    className="w-1 h-6 rounded"
                                    style={{ backgroundColor: item.color }}
                                />
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium text-white">{item.name}</span>
                                    <span className="text-xs text-[#b8b8b8]">
                                        {item.value} {item.value === 1 ? 'seat' : 'seats'}
                                    </span>
                                </div>
                            </div>
                            <div className="text-lg font-bold text-white">{item.value}</div>
                        </div>
                    ))}
                </div>

                <div className="text-center text-base font-semibold text-[#b8b8b8] pt-3 border-t border-white/10">
                    Total: {Object.values(seats).reduce((a, b) => a + b, 0)} seats
                </div>
            </CardContent>
        </Card>
    );
}

export default NationalSummary;

