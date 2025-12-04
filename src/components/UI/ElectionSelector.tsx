import { useAppContext } from '../../context/AppContext';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

interface ElectionOption {
    id: string;
    year: number;
    date: string;
    label: string;
}

const ELECTIONS: ElectionOption[] = [
    {
        id: '2024-parliamentary',
        year: 2024,
        date: '2024-04-17',
        label: '2024 Parliamentary'
    },
    {
        id: '2020-parliamentary',
        year: 2020,
        date: '2020-07-05',
        label: '2020 Parliamentary'
    },
    {
        id: '2016-parliamentary',
        year: 2016,
        date: '2016-09-11',
        label: '2016 Parliamentary'
    }
];

function ElectionSelector() {
    const { selectedElection, setSelectedElection } = useAppContext();

    return (
        <div className="flex items-center gap-2 max-md:flex-col max-md:items-start max-md:gap-1">
            <label className="text-sm font-semibold text-white uppercase tracking-wide max-md:text-xs">
                Election:
            </label>
            <Select value={selectedElection} onValueChange={setSelectedElection}>
                <SelectTrigger className="w-[180px] bg-[#1a1a2e]/80 border-white/20 text-white hover:bg-[#1a1a2e]/95 hover:border-white/40 focus:ring-offset-0 focus:ring-0">
                    <SelectValue placeholder="Select election" />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a2e] border-white/20 text-white">
                    {ELECTIONS.map(election => (
                        <SelectItem
                            key={election.id}
                            value={election.id}
                            className="focus:bg-white/10 focus:text-white cursor-pointer"
                        >
                            {election.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}

export default ElectionSelector;
