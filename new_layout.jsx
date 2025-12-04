import React, { useState, useMemo } from 'react';
import {
    ChevronRight,
    Info,
    Map as MapIcon,
    BarChart3,
    Users,
    Calendar,
    Check,
    Globe,
    LayoutGrid
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// --- Utility Components ---

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

const Card = ({ className, children }: { className?: string, children: React.ReactNode }) => (
    <div className={cn("bg-white rounded-xl border border-slate-200 shadow-sm transition-all", className)}>
        {children}
    </div>
);

const Badge = ({ children, className, variant = 'default' }: { children: React.ReactNode, className?: string, variant?: 'default' | 'outline' }) => {
    const variants = {
        default: "bg-slate-900 text-white border-transparent",
        outline: "text-slate-950 border-slate-200"
    };
    return (
        <div className={cn(`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2`, variants[variant], className)}>
            {children}
        </div>
    );
};

// --- Data Models & Constants ---

type Party = 'HDZ' | 'SDP' | 'DP' | 'MOST' | 'MOZEMO' | 'IDS' | 'FOKUS' | 'NP';

interface PartyInfo {
    id: Party;
    name: string;
    fullName: string;
    color: string;
}

const PARTIES: Record<Party, PartyInfo> = {
    HDZ: { id: 'HDZ', name: "HDZ", fullName: "Hrvatska demokratska zajednica", color: "#3b82f6" }, // Blue-500
    SDP: { id: 'SDP', name: "Rijeke Pravde", fullName: "SDP / Rijeke Pravde", color: "#ef4444" }, // Red-500
    DP: { id: 'DP', name: "DP", fullName: "Domovinski Pokret", color: "#1e293b" }, // Slate-800
    MOZEMO: { id: 'MOZEMO', name: "Možemo!", fullName: "Možemo! - Politička platforma", color: "#22c55e" }, // Green-500
    MOST: { id: 'MOST', name: "Most", fullName: "Most", color: "#f97316" }, // Orange-500
    IDS: { id: 'IDS', name: "IDS", fullName: "Istarski demokratski sabor", color: "#84cc16" }, // Lime-500
    FOKUS: { id: 'FOKUS', name: "Fokus", fullName: "Fokus / Republika", color: "#06b6d4" }, // Cyan-500
    NP: { id: 'NP', name: "Nezavisni", fullName: "Nezavisna platforma Sjever", color: "#64748b" } // Slate-500
};

interface ResultItem {
    partyId: Party;
    votes: number;
    seats: number;
    percent: number;
}

interface RegionData {
    id: number | string;
    label: string;
    name: string;
    parentId?: number; // For municipalities, pointing to district ID
    turnout: number;
    results: ResultItem[];
}

// --- Data Generation ---

// Helper to generate random results biased by region
const generateResultsForRegion = (regionId: number, is2024: boolean, isMunicipality = false): ResultItem[] => {
    let results: ResultItem[] = [];

    // Region groups
    const isIstria = regionId === 8;
    const isSlavonia = regionId === 4 || regionId === 5;
    const isZagreb = regionId === 1 || regionId === 6 || regionId === 2;
    const isDalmatia = regionId === 9 || regionId === 10;
    const isNorth = regionId === 3;

    if (isIstria) {
        results = [
            { partyId: 'SDP', votes: 0, seats: 6, percent: 34 + (Math.random() * 5) },
            { partyId: 'IDS', votes: 0, seats: 3, percent: 20 + (Math.random() * 5) },
            { partyId: 'HDZ', votes: 0, seats: 3, percent: 15 + (Math.random() * 5) },
            { partyId: 'MOZEMO', votes: 0, seats: 2, percent: 10 + (Math.random() * 5) },
        ];
    } else if (isSlavonia) {
        results = [
            { partyId: 'HDZ', votes: 0, seats: 7, percent: 42 + (Math.random() * 8) },
            { partyId: 'DP', votes: 0, seats: 3, percent: 20 + (Math.random() * 5) },
            { partyId: 'SDP', votes: 0, seats: 3, percent: 18 + (Math.random() * 4) },
            { partyId: 'MOST', votes: 0, seats: 1, percent: 7 + (Math.random() * 3) },
        ];
    } else if (isZagreb) {
        if (is2024) {
            results = [
                { partyId: 'SDP', votes: 0, seats: 5, percent: 26 + (Math.random() * 5) },
                { partyId: 'HDZ', votes: 0, seats: 5, percent: 25 + (Math.random() * 5) },
                { partyId: 'MOZEMO', votes: 0, seats: 3, percent: 21 + (Math.random() * 5) },
                { partyId: 'MOST', votes: 0, seats: 1, percent: 8 + (Math.random() * 3) },
                { partyId: 'DP', votes: 0, seats: 1, percent: 9 + (Math.random() * 3) },
            ];
        } else {
            results = [
                { partyId: 'HDZ', votes: 0, seats: 5, percent: 28 },
                { partyId: 'MOZEMO', votes: 0, seats: 3, percent: 18 },
                { partyId: 'SDP', votes: 0, seats: 3, percent: 17 },
                { partyId: 'MOST', votes: 0, seats: 1, percent: 8 },
            ];
        }
    } else if (isDalmatia) {
        results = [
            { partyId: 'HDZ', votes: 0, seats: 7, percent: 41 + (Math.random() * 6) },
            { partyId: 'SDP', votes: 0, seats: 3, percent: 20 + (Math.random() * 4) },
            { partyId: 'MOST', votes: 0, seats: 2, percent: 12 + (Math.random() * 3) },
            { partyId: 'DP', votes: 0, seats: 2, percent: 11 + (Math.random() * 3) },
        ];
    } else if (isNorth) {
        results = [
            { partyId: 'SDP', votes: 0, seats: 6, percent: 36 + (Math.random() * 4) },
            { partyId: 'HDZ', votes: 0, seats: 5, percent: 28 + (Math.random() * 4) },
            { partyId: 'NP', votes: 0, seats: 2, percent: 13 + (Math.random() * 3) },
            { partyId: 'MOZEMO', votes: 0, seats: 1, percent: 6 + (Math.random() * 2) },
        ];
    } else {
        results = [
            { partyId: 'HDZ', votes: 0, seats: 6, percent: 38 + (Math.random() * 5) },
            { partyId: 'SDP', votes: 0, seats: 4, percent: 24 + (Math.random() * 4) },
            { partyId: 'DP', votes: 0, seats: 2, percent: 12 + (Math.random() * 3) },
            { partyId: 'MOST', votes: 0, seats: 1, percent: 8 + (Math.random() * 3) },
            { partyId: 'MOZEMO', votes: 0, seats: 1, percent: 6 + (Math.random() * 2) },
        ];
    }

    // If calculating municipalities, add more noise/variance
    if (isMunicipality) {
        results = results.map(r => ({
            ...r,
            percent: Math.max(0, r.percent + (Math.random() * 20 - 10))
        }));
    }

    // Re-normalize percentages to 100%
    const total = results.reduce((sum, r) => sum + r.percent, 0);
    results = results.map(r => ({ ...r, percent: Math.round((r.percent / total) * 100) }));

    return results.sort((a, b) => b.percent - a.percent);
};

// Generate Full Dataset
const generateElectionData = (year: number) => {
    const is2024 = year === 2024;
    const districts: Record<number, RegionData> = {};
    const municipalities: Record<string, RegionData> = {};

    const districtNames: Record<number, string> = {
        1: "Zagreb - Centar",
        2: "Bjelovar / Istok ZG",
        3: "Sjever (Varaždin)",
        4: "Osijek / Baranja",
        5: "Slavonija / Vukovar",
        6: "Zagreb - Zapad",
        7: "Karlovac / Lika",
        8: "Istra / Rijeka",
        9: "Dalmacija - Sjever",
        10: "Dalmacija - Jug",
    };

    // Generate Districts
    for (let i = 1; i <= 10; i++) {
        districts[i] = {
            id: i,
            label: convertToRoman(i),
            name: districtNames[i],
            turnout: Math.round(is2024 ? 58 + Math.random() * 10 : 42 + Math.random() * 8),
            results: generateResultsForRegion(i, is2024)
        };

        // Generate Mock Municipalities for this District
        // We create 4 mock municipalities per district for visualization
        ['A', 'B', 'C', 'D'].forEach((suffix) => {
            const muniId = `${i}-${suffix}`;
            municipalities[muniId] = {
                id: muniId,
                label: muniId,
                parentId: i,
                name: `Općina ${districtNames[i].split(' ')[0]} ${suffix}`,
                turnout: Math.round(districts[i].turnout + (Math.random() * 15 - 7.5)),
                results: generateResultsForRegion(i, is2024, true)
            };
        });
    }

    // Generate National Aggregate
    const nationalResultsMap: Record<string, number> = {};
    let totalTurnout = 0;

    Object.values(districts).forEach(d => {
        totalTurnout += d.turnout;
        d.results.forEach(r => {
            nationalResultsMap[r.partyId] = (nationalResultsMap[r.partyId] || 0) + r.percent;
        });
    });

    const nationalResults: ResultItem[] = Object.keys(nationalResultsMap).map(key => ({
        partyId: key as Party,
        votes: 0,
        seats: 0, // Mock seat calculation would be complex here
        percent: Math.round(nationalResultsMap[key] / 10) // Averaging percentages for demo
    })).sort((a, b) => b.percent - a.percent);

    const national: RegionData = {
        id: 'national',
        label: 'RH',
        name: "Republika Hrvatska",
        turnout: Number((totalTurnout / 10).toFixed(1)),
        results: nationalResults
    };

    return { districts, municipalities, national, date: is2024 ? "17. travnja 2024." : "5. srpnja 2020." };
};

function convertToRoman(num: number): string {
    const roman = { X: 10, IX: 9, V: 5, IV: 4, I: 1 };
    let str = '';
    // Simple version for 1-10
    if (num === 10) return "X";
    if (num === 9) return "IX";
    if (num === 8) return "VIII";
    if (num >= 5) { str += "V"; num -= 5; }
    if (num === 4) return "IV";
    while (num > 0) { str += "I"; num--; }
    return str;
}

const DATASETS = {
    2020: generateElectionData(2020),
    2024: generateElectionData(2024),
};

// --- SVG Map Components ---

const DISTRICT_PATHS = [
    { id: 3, d: "M 30,5 L 60,5 L 60,25 L 30,25 Z", cx: 45, cy: 15 },
    { id: 1, d: "M 30,25 L 45,25 L 45,40 L 30,40 Z", cx: 37.5, cy: 32.5 },
    { id: 2, d: "M 45,25 L 70,25 L 70,40 L 45,40 Z", cx: 57.5, cy: 32.5 },
    { id: 4, d: "M 70,15 L 95,15 L 95,35 L 70,35 Z", cx: 82.5, cy: 25 },
    { id: 5, d: "M 70,35 L 95,35 L 95,55 L 60,55 L 60,40 L 70,40 Z", cx: 80, cy: 45 },
    { id: 6, d: "M 30,40 L 60,40 L 60,55 L 40,55 L 40,55 L 30,55 Z", cx: 45, cy: 47.5 },
    { id: 7, d: "M 30,55 L 50,55 L 50,75 L 30,75 Z", cx: 40, cy: 65 },
    { id: 8, d: "M 5,35 L 30,35 L 30,65 L 15,65 L 5,50 Z", cx: 18, cy: 50 },
    { id: 9, d: "M 30,75 L 50,75 L 65,90 L 40,90 Z", cx: 46, cy: 82 },
    { id: 10, d: "M 50,75 L 80,75 L 90,95 L 60,95 L 50,85 Z", cx: 70, cy: 85 },
];

// Simulated Municipalities: Subdividing district shapes mathematically
// This generates 4 "sub-polygons" per district for the visual demo
const generateMuniPaths = () => {
    const paths: any[] = [];
    DISTRICT_PATHS.forEach(d => {
        // We just create 4 smaller polys based on the bounding box logic of the parent
        // This is a visual approximation to simulate granularity
        const { cx, cy } = d;
        // Top Left
        paths.push({ id: `${d.id}-A`, parentId: d.id, d: `M ${cx - 4},${cy - 4} L ${cx},${cy - 4} L ${cx},${cy} L ${cx - 4},${cy} Z`, cx: cx - 2, cy: cy - 2 });
        // Top Right
        paths.push({ id: `${d.id}-B`, parentId: d.id, d: `M ${cx},${cy - 4} L ${cx + 4},${cy - 4} L ${cx + 4},${cy} L ${cx},${cy} Z`, cx: cx + 2, cy: cy - 2 });
        // Bottom Left
        paths.push({ id: `${d.id}-C`, parentId: d.id, d: `M ${cx - 4},${cy} L ${cx},${cy} L ${cx},${cy + 4} L ${cx - 4},${cy + 4} Z`, cx: cx - 2, cy: cy + 2 });
        // Bottom Right
        paths.push({ id: `${d.id}-D`, parentId: d.id, d: `M ${cx},${cy} L ${cx + 4},${cy} L ${cx + 4},${cy + 4} L ${cx},${cy + 4} Z`, cx: cx + 2, cy: cy + 2 });

        // Add the original shape as a transparent overlay for outlines
        paths.push({ id: `outline-${d.id}`, isOutline: true, d: d.d });
    });
    return paths;
};

const MUNI_PATHS = generateMuniPaths();

const CroatianMap = ({
    data,
    activeId,
    onSelect,
    mode,
    granularity
}: {
    data: { districts: Record<number, RegionData>, municipalities: Record<string, RegionData> },
    activeId: number | string | null,
    onSelect: (id: number | string | null) => void,
    mode: 'winner' | 'turnout',
    granularity: 'district' | 'municipality'
}) => {

    const pathsToRender = granularity === 'district' ? DISTRICT_PATHS : MUNI_PATHS;

    return (
        <div className="w-full h-full relative group cursor-crosshair" onClick={(e) => {
            // If clicking background, reset to National (null)
            if (e.target === e.currentTarget) onSelect(null);
        }}>
            <svg viewBox="0 0 100 100" className="w-full h-auto drop-shadow-xl">
                <defs>
                    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="1" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                </defs>

                {/* Background to catch clicks for "National" view */}
                <rect x="0" y="0" width="100" height="100" fill="transparent" onClick={() => onSelect(null)} />

                {pathsToRender.map((shape) => {
                    // Skip rendering logic for outlines
                    if (shape.isOutline) {
                        return (
                            <path
                                key={shape.id}
                                d={shape.d}
                                fill="none"
                                stroke="white"
                                strokeWidth="0.8"
                                className="pointer-events-none opacity-50"
                            />
                        );
                    }

                    // Determine Data Source
                    let region: RegionData | undefined;
                    if (granularity === 'district') {
                        region = data.districts[shape.id as number];
                    } else {
                        region = data.municipalities[shape.id as string];
                    }

                    if (!region) return null;

                    const winner = region.results[0];

                    let fill = "#cbd5e1"; // slate-300 default
                    if (mode === 'winner') {
                        fill = PARTIES[winner.partyId].color;
                    } else {
                        const intensity = Math.max(0.2, Math.min(1, (region.turnout - 35) / 40));
                        fill = `rgba(37, 99, 235, ${intensity})`;
                    }

                    const isActive = activeId === shape.id;
                    const isChildOfActive = granularity === 'municipality' && activeId === shape.parentId;
                    const isHighlighted = isActive || isChildOfActive;

                    // Label logic
                    const showLabel = granularity === 'district' || (granularity === 'municipality' && shape.id.includes('-A'));
                    const labelText = granularity === 'district' ? convertToRoman(shape.id) : (shape.id as string).split('-')[1];

                    return (
                        <g
                            key={shape.id}
                            onClick={(e) => {
                                e.stopPropagation();
                                onSelect(shape.id);
                            }}
                            className="transition-all duration-300 ease-out"
                            style={{
                                transformOrigin: `${shape.cx}px ${shape.cy}px`,
                                transform: isHighlighted ? 'scale(1.05)' : 'scale(1)',
                                zIndex: isHighlighted ? 50 : 1
                            }}
                        >
                            <path
                                d={shape.d}
                                fill={fill}
                                stroke={isHighlighted ? "white" : "white"}
                                strokeWidth={isHighlighted ? (granularity === 'district' ? 1.5 : 0.5) : (granularity === 'district' ? 0.5 : 0.2)}
                                className={`
                   transition-all duration-300
                   hover:brightness-110
                   ${isHighlighted ? 'drop-shadow-lg' : ''}
                 `}
                            />
                            {showLabel && (
                                <text
                                    x={shape.cx}
                                    y={shape.cy}
                                    textAnchor="middle"
                                    dominantBaseline="middle"
                                    fill="white"
                                    className={`font-bold pointer-events-none drop-shadow-md select-none ${granularity === 'district' ? 'text-[3px]' : 'text-[1.5px]'}`}
                                >
                                    {labelText}
                                </text>
                            )}
                        </g>
                    );
                })}
            </svg>

            {/* Legend Overlay */}
            <div className="absolute bottom-2 left-2 flex flex-col gap-2">
                {mode === 'turnout' && (
                    <div className="bg-white/90 backdrop-blur border border-slate-200 p-2 rounded-md shadow-sm">
                        <div className="text-[10px] font-semibold text-slate-500 mb-1">Izlaznost</div>
                        <div className="h-2 w-24 bg-gradient-to-r from-blue-100 to-blue-700 rounded-full mb-1"></div>
                        <div className="flex justify-between text-[8px] text-slate-400">
                            <span>Niska</span>
                            <span>Visoka</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// --- Main App Component ---

export default function ElectionDashboard() {
    const [year, setYear] = useState < 2020 | 2024 > (2024);
    const [activeId, setActiveId] = useState < number | string | null > (null); // null = National
    const [viewMode, setViewMode] = useState < 'winner' | 'turnout' > ('winner');
    const [granularity, setGranularity] = useState < 'district' | 'municipality' > ('district');

    const currentDataset = DATASETS[year];

    // Determine what data to show in Sidebar
    const activeData = useMemo(() => {
        if (activeId === null) return currentDataset.national;

        if (granularity === 'district') {
            return currentDataset.districts[activeId as number] || currentDataset.national;
        } else {
            // Try to find municipality, if not fall back (e.g. switching modes)
            return currentDataset.municipalities[activeId as string] || currentDataset.national;
        }
    }, [activeId, currentDataset, granularity]);

    // Handle switching granularity gracefully
    const handleGranularityChange = (newGranularity: 'district' | 'municipality') => {
        setGranularity(newGranularity);
        setActiveId(null); // Reset selection when changing layers to avoid ID mismatch
    };

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans p-4 md:p-6 lg:p-8">

            {/* Top Navigation / Header */}
            <div className="max-w-7xl mx-auto space-y-6">
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Parlamentarni Izbori</h1>
                        <p className="text-slate-500 mt-1 flex items-center gap-2">
                            <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                            Službeni rezultati - {year}.
                        </p>
                    </div>

                    <div className="flex items-center gap-2 bg-white p-1.5 rounded-lg border border-slate-200 shadow-sm">
                        <button
                            onClick={() => setYear(2020)}
                            className={cn("px-4 py-1.5 rounded-md text-sm font-medium transition-all", year === 2020 ? 'bg-slate-100 text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900')}
                        >
                            2020.
                        </button>
                        <div className="w-px h-4 bg-slate-200"></div>
                        <button
                            onClick={() => setYear(2024)}
                            className={cn("px-4 py-1.5 rounded-md text-sm font-medium transition-all", year === 2024 ? 'bg-slate-100 text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900')}
                        >
                            2024.
                        </button>
                    </div>
                </header>

                {/* Key Metrics Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="p-4 flex items-center justify-between cursor-pointer hover:border-blue-300 transition-colors" onClick={() => setActiveId(null)}>
                        <div>
                            <p className="text-sm font-medium text-slate-500">Ukupna izlaznost</p>
                            <h3 className="text-2xl font-bold text-slate-900 mt-1">{currentDataset.national.turnout}%</h3>
                        </div>
                        <div className="h-10 w-10 bg-blue-50 rounded-full flex items-center justify-center">
                            <Users className="w-5 h-5 text-blue-600" />
                        </div>
                    </Card>

                    <Card className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-500">Datum izbora</p>
                            <h3 className="text-xl font-bold text-slate-900 mt-1">{currentDataset.date}</h3>
                        </div>
                        <div className="h-10 w-10 bg-purple-50 rounded-full flex items-center justify-center">
                            <Calendar className="w-5 h-5 text-purple-600" />
                        </div>
                    </Card>

                    <Card className="p-4 flex items-center justify-between bg-slate-900 text-white border-slate-800">
                        <div>
                            <p className="text-sm font-medium text-slate-400">Vodeća stranka (RH)</p>
                            <h3 className="text-2xl font-bold mt-1" style={{ color: PARTIES[currentDataset.national.results[0].partyId].color }}>
                                {PARTIES[currentDataset.national.results[0].partyId].name}
                            </h3>
                        </div>
                        <div className="h-10 w-10 bg-slate-800 rounded-full flex items-center justify-center">
                            <BarChart3 className="w-5 h-5 text-slate-300" />
                        </div>
                    </Card>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                    {/* Left Column: Map & Controls (8 cols) */}
                    <div className="lg:col-span-7 xl:col-span-8 space-y-4">
                        <Card className="p-1 overflow-hidden bg-slate-50/50">

                            {/* Map Toolbar */}
                            <div className="flex flex-wrap items-center justify-between gap-3 p-2 mb-2 bg-white m-1 rounded-lg border border-slate-100">
                                {/* Granularity Toggle */}
                                <div className="flex bg-slate-100 p-0.5 rounded-md">
                                    <button
                                        onClick={() => handleGranularityChange('district')}
                                        className={cn("px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-2", granularity === 'district' ? "bg-white shadow-sm text-slate-900" : "text-slate-500 hover:text-slate-700")}
                                    >
                                        <MapIcon size={14} /> Izborne Jedinice
                                    </button>
                                    <button
                                        onClick={() => handleGranularityChange('municipality')}
                                        className={cn("px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-2", granularity === 'municipality' ? "bg-white shadow-sm text-slate-900" : "text-slate-500 hover:text-slate-700")}
                                    >
                                        <LayoutGrid size={14} /> Općine / Gradovi
                                    </button>
                                </div>

                                {/* Scope Button */}
                                <button
                                    onClick={() => setActiveId(null)}
                                    className={cn("px-3 py-1.5 rounded-md text-xs font-semibold border transition-colors flex items-center gap-2", activeId === null ? "bg-blue-50 border-blue-200 text-blue-700" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50")}
                                >
                                    <Globe size={14} /> Prikaz: Hrvatska
                                </button>

                                {/* View Mode */}
                                <div className="flex gap-1">
                                    <button
                                        onClick={() => setViewMode('winner')}
                                        title="Pobjednici"
                                        className={cn("p-1.5 rounded hover:bg-slate-100", viewMode === 'winner' ? "text-blue-600 bg-blue-50" : "text-slate-400")}
                                    >
                                        <BarChart3 size={18} />
                                    </button>
                                    <button
                                        onClick={() => setViewMode('turnout')}
                                        title="Izlaznost"
                                        className={cn("p-1.5 rounded hover:bg-slate-100", viewMode === 'turnout' ? "text-blue-600 bg-blue-50" : "text-slate-400")}
                                    >
                                        <Users size={18} />
                                    </button>
                                </div>
                            </div>

                            {/* The Map */}
                            <div className="aspect-[4/3] w-full px-4 md:px-12 py-4 relative">
                                <CroatianMap
                                    data={currentDataset}
                                    activeId={activeId}
                                    onSelect={setActiveId}
                                    mode={viewMode}
                                    granularity={granularity}
                                />

                                {/* Overlay Hint */}
                                {granularity === 'municipality' && (
                                    <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-amber-50 text-amber-800 px-3 py-1 rounded-full text-[10px] border border-amber-100 shadow-sm pointer-events-none opacity-80">
                                        Simulirani prikaz općina
                                    </div>
                                )}
                            </div>

                            {/* Legend (Winner Mode) */}
                            {viewMode === 'winner' && (
                                <div className="p-4 border-t border-slate-100 flex flex-wrap justify-center gap-x-6 gap-y-2">
                                    {Object.values(PARTIES).map((p) => (
                                        <div key={p.id} className="flex items-center gap-2">
                                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }}></span>
                                            <span className="text-xs font-medium text-slate-600">{p.name}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </Card>
                    </div>

                    {/* Right Column: Details Sidebar (4 cols) */}
                    <div className="lg:col-span-5 xl:col-span-4">
                        <Card className="h-full max-h-[800px] flex flex-col border-0 shadow-lg ring-1 ring-slate-200">

                            {/* Sidebar Header */}
                            <div className="p-6 border-b border-slate-100 bg-slate-50/80">
                                <div className="flex items-center justify-between mb-2">
                                    <Badge variant={activeId === null ? 'default' : 'outline'} className={activeId === null ? "bg-blue-600" : "bg-white"}>
                                        {activeId === null ? "Nacionalni rezultati" : (granularity === 'district' ? `Izborna jedinica ${convertToRoman(activeData.id as number)}` : `Općina`)}
                                    </Badge>
                                    <span className="text-xs text-slate-400 font-mono">
                                        {year}
                                    </span>
                                </div>

                                <h2 className="text-2xl font-bold text-slate-900">{activeData.name}</h2>

                                <div className="flex items-center gap-4 mt-3 text-sm text-slate-500">
                                    <div className="flex items-center gap-1.5">
                                        <Users size={14} />
                                        <span>Izlaznost: <span className="font-semibold text-slate-900">{activeData.turnout}%</span></span>
                                    </div>
                                </div>
                            </div>

                            {/* Results List */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                                <div className="space-y-4">
                                    {activeData.results.map((result, idx) => {
                                        const party = PARTIES[result.partyId];
                                        return (
                                            <div key={idx} className="group">
                                                <div className="flex justify-between items-end mb-1.5">
                                                    <div>
                                                        <div className="font-bold text-slate-800 text-sm">{party.fullName}</div>
                                                        {/* Only show seats if not national or simplified view */}
                                                        {activeId !== null && (
                                                            <div className="text-xs text-slate-500 font-medium">
                                                                <span className="text-slate-400">Osvojeno:</span> {result.seats > 0 ? `${result.seats} mandata` : 'Bez mandata'}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-lg font-bold text-slate-900">{result.percent}%</div>
                                                    </div>
                                                </div>
                                                {/* Progress Bar */}
                                                <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full rounded-full transition-all duration-1000 ease-out"
                                                        style={{
                                                            width: `${result.percent}%`,
                                                            backgroundColor: party.color
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Sidebar Footer */}
                            <div className="p-4 bg-slate-50 border-t border-slate-100 rounded-b-xl">
                                {activeId === null ? (
                                    <div className="flex gap-3 text-xs text-slate-500 items-start bg-blue-50/50 p-3 rounded border border-blue-100">
                                        <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                                        <p>
                                            Prikazuju se ukupni rezultati za Republiku Hrvatsku. Odaberite regiju na karti za detaljnije podatke.
                                        </p>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => setActiveId(null)}
                                        className="w-full py-2 bg-white border border-slate-200 rounded text-sm font-medium text-slate-600 hover:text-blue-600 hover:border-blue-200 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <ChevronRight className="rotate-180" size={16} /> Natrag na nacionalni prikaz
                                    </button>
                                )}
                            </div>

                        </Card>
                    </div>

                </div>
            </div>
        </div>
    );
}