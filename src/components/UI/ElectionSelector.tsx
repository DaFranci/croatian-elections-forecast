import { useAppContext } from '../../context/AppContext';
import './ElectionSelector.css';

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

    const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedElection(event.target.value);
    };

    return (
        <div className="election-selector">
            <label htmlFor="election-select" className="selector-label">
                Election:
            </label>
            <select
                id="election-select"
                value={selectedElection}
                onChange={handleChange}
                className="selector-dropdown"
            >
                {ELECTIONS.map(election => (
                    <option key={election.id} value={election.id}>
                        {election.label}
                    </option>
                ))}
            </select>
        </div>
    );
}

export default ElectionSelector;
