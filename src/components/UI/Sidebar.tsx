import { useEffect, useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { loadElectionData, loadPartyData } from '../../utils/dataLoader';
import { calculateWinners, calculateSeats, formatNumber, formatPercentage } from '../../utils/dataProcessor';
import { ElectionData, PartyInfo } from '../../types';
import MunicipalityDetail from './MunicipalityDetail';
import NationalSummary from './NationalSummary';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"

function Sidebar() {
    const { sidebarOpen, setSidebarOpen, selectedMunicipality, selectedElection, viewMode } = useAppContext();
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

    return (
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen} modal={false}>
            <SheetContent side="right" className="w-[400px] p-0 bg-gradient-to-b from-[#1a1a2e] to-[#16213e] border-l border-[#2a2a3e] text-white sm:max-w-[400px]">
                <ScrollArea className="h-full">
                    <div className="p-6 flex flex-col gap-6">
                        <Card className="bg-white/[0.02] border-white/5">
                            <CardHeader>
                                <CardTitle className="text-xl font-bold text-white flex items-center gap-2">
                                    <span className="text-3xl">📋</span>
                                    Parliamentary Elections
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-col gap-2">
                                    <div className="flex justify-between items-center p-2 bg-white/[0.03] rounded">
                                        <span className="text-sm text-[#b8b8b8] font-medium">Date:</span>
                                        <span className="text-base text-white font-semibold">{electionData?.date}</span>
                                    </div>
                                    <div className="flex justify-between items-center p-2 bg-white/[0.03] rounded">
                                        <span className="text-sm text-[#b8b8b8] font-medium">National Turnout:</span>
                                        <span className="text-base text-white font-semibold">
                                            {electionData && formatPercentage(electionData.turnout_national * 100)}
                                        </span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

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
                            <Card className="bg-white/[0.02] border-white/5">
                                <CardContent className="pt-6">
                                    <div className="p-6 bg-gradient-to-br from-[#e94560]/10 to-[#e94560]/5 border border-[#e94560]/20 rounded-lg text-center">
                                        <p className="text-base text-white leading-relaxed">
                                            Click on a {viewMode === 'constituency' ? 'constituency' : 'municipality'} to see detailed results
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </ScrollArea>
            </SheetContent>
        </Sheet>
    );
}

export default Sidebar;

