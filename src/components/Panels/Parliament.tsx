import { useMemo, useState } from 'react'
import { getPartyInfo, MINORITY_COLOR } from '../../utils/dataProcessor'
import { PartyInfo } from '../../types'
import { cn } from '@/lib/utils'

interface Block {
    id: string
    label: string
    name: string
    color: string
    seats: number
}

const WIDTH = 200
const INNER_RADIUS = 0.42

// Seat positions in a half circle, ordered left to right, as (x, y) in a 200 x 100 box
function seatPositions(total: number) {
    const rows = Math.max(1, Math.round(Math.sqrt(total / 4)))
    const radii = Array.from({ length: rows }, (_, i) => INNER_RADIUS + (1 - INNER_RADIUS) * (rows === 1 ? 1 : i / (rows - 1)))
    const radiusSum = radii.reduce((a, b) => a + b, 0)

    // Seats per row in proportion to its length; the outer row takes the rounding remainder
    const perRow = radii.map(r => Math.max(1, Math.round((total * r) / radiusSum)))
    perRow[rows - 1] += total - perRow.reduce((a, b) => a + b, 0)

    const seats: { x: number; y: number; angle: number }[] = []
    radii.forEach((r, i) => {
        const n = perRow[i]
        for (let j = 0; j < n; j++) {
            const angle = n === 1 ? Math.PI / 2 : Math.PI * (1 - j / (n - 1))
            seats.push({ x: WIDTH / 2 + Math.cos(angle) * r * 95, y: 98 - Math.sin(angle) * r * 95, angle })
        }
    })
    // Fill wedges: by angle from the left, inner rows first within a wedge
    seats.sort((a, b) => b.angle - a.angle)

    const rowGap = rows === 1 ? 95 : ((1 - INNER_RADIUS) * 95) / (rows - 1)
    const arcGap = (Math.PI * INNER_RADIUS * 95) / Math.max(1, perRow[0] - 1)
    return { seats, dotRadius: Math.min(rowGap, arcGap, 14) * 0.4 }
}

// Hemicycle of all seats: party blocks by size, minority representatives at the right end
function Parliament({ seats, minoritySeats, parties }: { seats: Record<string, number>; minoritySeats: number; parties: PartyInfo[] }) {
    const [hovered, setHovered] = useState<string | null>(null)

    const blocks: Block[] = useMemo(() => {
        const partyBlocks = Object.entries(seats)
            .filter(([, n]) => n > 0)
            .sort((a, b) => b[1] - a[1])
            .map(([id, n]) => {
                const party = getPartyInfo(id, parties)
                return { id, label: party.shortName, name: party.name, color: party.color, seats: n }
            })
        return minoritySeats > 0
            ? [...partyBlocks, { id: 'minorities', label: 'Manjine', name: 'Predstavnici nacionalnih manjina', color: MINORITY_COLOR, seats: minoritySeats }]
            : partyBlocks
    }, [seats, minoritySeats, parties])

    const total = blocks.reduce((sum, b) => sum + b.seats, 0)
    const { seats: positions, dotRadius } = useMemo(() => seatPositions(total), [total])
    if (total === 0) return null

    const owners = blocks.flatMap(b => Array<Block>(b.seats).fill(b))

    return (
        <div className="px-4 pt-3 pb-3 border-b border-slate-100">
            <svg viewBox={`0 0 ${WIDTH} 102`} className="w-full" role="img" aria-label={`Raspodjela ${total} mandata`}>
                {positions.map((seat, i) => {
                    const block = owners[i]
                    return (
                        <circle
                            key={i}
                            cx={seat.x}
                            cy={seat.y}
                            r={dotRadius}
                            fill={block.color}
                            className="transition-opacity"
                            opacity={hovered && hovered !== block.id ? 0.2 : 1}
                            onMouseEnter={() => setHovered(block.id)}
                            onMouseLeave={() => setHovered(null)}
                        >
                            <title>{`${block.name}: ${block.seats}`}</title>
                        </circle>
                    )
                })}
                <text x={WIDTH / 2} y={88} textAnchor="middle" className="fill-slate-900 font-bold" fontSize={18}>{total}</text>
                <text x={WIDTH / 2} y={99} textAnchor="middle" className="fill-slate-400" fontSize={7}>
                    mandata · većina {Math.floor(total / 2) + 1}
                </text>
            </svg>

            <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
                {blocks.map(b => (
                    <button
                        key={b.id}
                        title={b.name}
                        onMouseEnter={() => setHovered(b.id)}
                        onMouseLeave={() => setHovered(null)}
                        className={cn("flex items-center gap-1.5 text-[11px] transition-opacity", hovered && hovered !== b.id && "opacity-40")}
                    >
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: b.color }} />
                        <span className="font-medium text-slate-600">{b.label}</span>
                        <span className="font-bold tabular-nums text-slate-900">{b.seats}</span>
                    </button>
                ))}
            </div>
        </div>
    )
}

export default Parliament
