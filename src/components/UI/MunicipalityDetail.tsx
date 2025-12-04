import { ElectionData, PartyInfo, ElectionResult } from '../../types';
import { formatNumber, formatPercentage, getPartyColor } from '../../utils/dataProcessor';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

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
            <Card className="bg-white/[0.02] border-white/5">
                <CardContent className="p-6">
                    <p className="text-red-400 text-center">Municipality data not found</p>
                </CardContent>
            </Card>
        );
    }

    // Check if this is a constituency (district) view
    const isConstituency = electionData.constituencies && electionData.constituencies[municipalityId] !== undefined;

    // Calculate seats for this constituency if applicable
    let constituencySeats: Record<string, number> = {};
    if (isConstituency) {
        const SEATS_PER_CONSTITUENCY = 14;
        const THRESHOLD_PERCENTAGE = 5;
        const seatsToAllocate = municipalityId === 'XI' ? 3 : SEATS_PER_CONSTITUENCY;

        // Calculate total valid votes
        let totalValidVotes = 0;
        Object.values(result.parties).forEach(p => {
            totalValidVotes += p.votes;
        });

        if (totalValidVotes > 0) {
            // Filter parties passing the 5% threshold
            const qualifyingParties: Array<{ id: string; votes: number }> = [];
            Object.entries(result.parties).forEach(([partyId, partyData]) => {
                const percentage = (partyData.votes / totalValidVotes) * 100;
                if (percentage >= THRESHOLD_PERCENTAGE) {
                    qualifyingParties.push({ id: partyId, votes: partyData.votes });
                }
            });

            // D'Hondt allocation
            const quotients: Array<{ partyId: string; quotient: number }> = [];
            qualifyingParties.forEach(party => {
                for (let i = 1; i <= seatsToAllocate; i++) {
                    quotients.push({
                        partyId: party.id,
                        quotient: party.votes / i
                    });
                }
            });

            quotients.sort((a, b) => b.quotient - a.quotient);

            for (let i = 0; i < seatsToAllocate; i++) {
                if (i < quotients.length) {
                    const winnerId = quotients[i].partyId;
                    constituencySeats[winnerId] = (constituencySeats[winnerId] || 0) + 1;
                }
            }
        }
    }

    // Prepare chart data
    const chartData = Object.entries(result.parties)
        .map(([partyId, partyData]) => ({
            party: parties.find(p => p.id === partyId)?.shortName || partyId,
            partyId,
            votes: partyData.votes,
            coalitionName: partyData.coalition_name,
            percentage: (partyData.votes / result.votes_cast) * 100,
            seats: isConstituency ? (constituencySeats[partyId] || 0) : undefined,
        }))
        .sort((a, b) => b.votes - a.votes);

    const winnerParty = parties.find(p => p.id === result.winner);

    return (
        <Card className="bg-white/[0.02] border-white/5">
            <CardHeader>
                <CardTitle className="text-2xl font-bold text-white">{result.name}</CardTitle>
            </CardHeader>
            <CardContent>

                <Card className="mb-4 border-2" style={{
                    backgroundColor: winnerParty ? `${winnerParty.color}20` : 'transparent',
                    borderColor: winnerParty?.color || '#808080'
                }}>
                    <CardContent className="p-4 flex items-center">
                        <span className="text-sm text-[#b8b8b8] font-medium mr-2">Winner: </span>
                        <span className="text-lg font-bold" style={{ color: winnerParty?.color }}>
                            {winnerParty?.shortName || result.winner}
                        </span>
                        {result.margin !== undefined && (
                            <span className="ml-2 text-sm text-green-400 font-semibold">
                                +{formatPercentage(result.margin)}
                            </span>
                        )}
                    </CardContent>
                </Card>

                <div className="grid grid-cols-3 gap-3 mb-4">
                    <Card className="bg-white/[0.03] border-0">
                        <CardContent className="p-3 text-center">
                            <div className="text-xs text-[#b8b8b8] font-medium mb-1">Total Voters</div>
                            <div className="text-lg font-bold text-white">{formatNumber(result.total_voters)}</div>
                        </CardContent>
                    </Card>
                    <Card className="bg-white/[0.03] border-0">
                        <CardContent className="p-3 text-center">
                            <div className="text-xs text-[#b8b8b8] font-medium mb-1">Votes Cast</div>
                            <div className="text-lg font-bold text-white">{formatNumber(result.votes_cast)}</div>
                        </CardContent>
                    </Card>
                    <Card className="bg-white/[0.03] border-0">
                        <CardContent className="p-3 text-center">
                            <div className="text-xs text-[#b8b8b8] font-medium mb-1">Turnout</div>
                            <div className="text-lg font-bold text-white">{formatPercentage(result.turnout * 100)}</div>
                        </CardContent>
                    </Card>
                </div>

                <div className="mb-4">
                    <h4 className="text-base font-semibold text-white mb-3">Results by Party</h4>
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

                <div className="flex flex-col gap-2">
                    {chartData.map(item => (
                        <div key={item.partyId} className="flex justify-between items-center p-2 bg-white/[0.03] rounded-lg hover:bg-white/[0.05] transition-colors" title={item.coalitionName || item.party}>
                            <div className="flex items-center gap-2">
                                <div
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: getPartyColor(item.partyId, parties) }}
                                />
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium text-white">{item.party}</span>
                                    {item.seats !== undefined && (
                                        <span className="text-xs text-[#b8b8b8]">
                                            {item.seats > 0 ? `${item.seats} ${item.seats === 1 ? 'seat' : 'seats'}` : 'No seats'}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-sm text-[#b8b8b8]">{formatNumber(item.votes)}</span>
                                <span className="text-sm font-semibold text-white min-w-[3rem] text-right">{formatPercentage(item.percentage)}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

export default MunicipalityDetail;
