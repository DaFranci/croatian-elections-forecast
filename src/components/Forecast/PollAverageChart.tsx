import { useMemo, useState } from 'react'
import { Area, ComposedChart, Line, ResponsiveContainer, Scatter, Tooltip, TooltipProps, XAxis, YAxis, CartesianGrid } from 'recharts'
import { ForecastData, PollPoint, TrendPoint } from '../../types/forecast'
import { cn } from '@/lib/utils'

const MONTHS = ['sij', 'velj', 'ožu', 'tra', 'svi', 'lip', 'srp', 'kol', 'ruj', 'lis', 'stu', 'pro']
const time = (date: string) => new Date(date).getTime()
const monthLabel = (t: number) => {
    const d = new Date(t)
    return d.getMonth() === 0 ? `${d.getFullYear()}.` : MONTHS[d.getMonth()]
}
const dateLabel = (t: number) => {
    const d = new Date(t)
    return `${d.getDate()}. ${MONTHS[d.getMonth()]} ${d.getFullYear()}.`
}

type TrendRow = TrendPoint & { t: number }
type PollRow = PollPoint & { t: number }

// Poll average: house-effect-adjusted trend with its 80 % band, individual polls as dots
function PollAverageChart({ data }: { data: ForecastData }) {
    const [hovered, setHovered] = useState<string | null>(null)
    const lists = data.trendLists.map(id => data.lists.find(l => l.id === id)!).filter(Boolean)

    const trend = useMemo(() => data.trend.map(p => ({ ...p, t: time(p.date) }) as TrendRow), [data])
    const polls = useMemo(() => data.polls.map(p => ({ ...p, t: time(p.date) }) as PollRow), [data])
    const byTime = useMemo(() => new Map(trend.map(p => [p.t, p])), [trend])

    // Ticks on the first of every third month
    const ticks = useMemo(() => {
        const out: number[] = []
        const d = new Date(trend[0].t)
        d.setDate(1)
        d.setMonth(Math.ceil(d.getMonth() / 3) * 3)
        while (d.getTime() <= trend[trend.length - 1].t) {
            out.push(d.getTime())
            d.setMonth(d.getMonth() + 3)
        }
        return out
    }, [trend])

    const renderTooltip = ({ active, label, payload }: TooltipProps<number, string>) => {
        if (!active || !payload?.length) return null
        const poll = payload[0].payload as PollRow
        // Hovering a poll dot shows that poll; anywhere else shows the average on that date
        if (typeof poll.firm === 'string') {
            return (
                <div className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs shadow-md">
                    <p className="font-semibold text-slate-900">{poll.firm}</p>
                    <p className="text-slate-500">{dateLabel(poll.t as number)}</p>
                    <div className="mt-1 space-y-0.5">
                        {lists.filter(l => typeof poll[l.id] === 'number').map(l => (
                            <div key={l.id} className="flex items-center justify-between gap-4">
                                <span className="flex items-center gap-1.5 text-slate-600">
                                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: l.color }} />
                                    {l.id}
                                </span>
                                <span className="tabular-nums font-semibold text-slate-900">{(poll[l.id] as number).toFixed(1)}%</span>
                            </div>
                        ))}
                    </div>
                </div>
            )
        }
        const point = typeof label === 'number' ? byTime.get(label) : undefined
        if (!point) return null
        return (
            <div className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs shadow-md">
                <p className="font-semibold text-slate-900">Prosjek, {dateLabel(point.t)}</p>
                <div className="mt-1 space-y-0.5">
                    {lists.map(l => {
                        const [, mean] = point[l.id] as [number, number, number]
                        return (
                            <div key={l.id} className="flex items-center justify-between gap-4">
                                <span className="flex items-center gap-1.5 text-slate-600">
                                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: l.color }} />
                                    {l.id}
                                </span>
                                <span className="tabular-nums font-semibold text-slate-900">{mean.toFixed(1)}%</span>
                            </div>
                        )
                    })}
                </div>
            </div>
        )
    }

    const dim = (id: string) => hovered !== null && hovered !== id

    return (
        <div>
            <div className="mb-3 flex flex-wrap gap-x-4 gap-y-1.5">
                {lists.map(l => (
                    <button
                        key={l.id}
                        title={l.name}
                        onMouseEnter={() => setHovered(l.id)}
                        onMouseLeave={() => setHovered(null)}
                        className={cn("flex items-center gap-1.5 text-xs transition-opacity", dim(l.id) && "opacity-40")}
                    >
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: l.color }} />
                        <span className="font-medium text-slate-600">{l.id}</span>
                        <span className="font-bold tabular-nums text-slate-900">{l.pollAverage.mean.toFixed(1)}%</span>
                    </button>
                ))}
            </div>

            <div className="h-72 sm:h-80">
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={trend} margin={{ top: 5, right: 8, bottom: 0, left: -18 }}>
                        <CartesianGrid stroke="#e2e8f0" vertical={false} />
                        <XAxis
                            dataKey="t"
                            type="number"
                            scale="time"
                            domain={[trend[0].t, trend[trend.length - 1].t]}
                            ticks={ticks}
                            tickFormatter={monthLabel}
                            tick={{ fontSize: 11, fill: '#64748b' }}
                            axisLine={{ stroke: '#cbd5e1' }}
                            tickLine={false}
                        />
                        <YAxis
                            domain={[0, 40]}
                            ticks={[0, 10, 20, 30, 40]}
                            tickFormatter={v => `${v}%`}
                            tick={{ fontSize: 11, fill: '#64748b' }}
                            axisLine={false}
                            tickLine={false}
                        />
                        <Tooltip content={renderTooltip} cursor={{ stroke: '#94a3b8', strokeDasharray: '3 3' }} />
                        {lists.map(l => (
                            <Area
                                key={`band-${l.id}`}
                                dataKey={(p: Record<string, number[] | undefined>) => (Array.isArray(p[l.id]) ? [p[l.id]![0], p[l.id]![2]] : null)}
                                stroke="none"
                                fill={l.color}
                                fillOpacity={dim(l.id) ? 0.03 : 0.12}
                                isAnimationActive={false}
                                activeDot={false}
                            />
                        ))}
                        {lists.map(l => (
                            <Scatter
                                key={`polls-${l.id}`}
                                data={polls.filter(p => typeof p[l.id] === 'number')}
                                dataKey={l.id}
                                fill={l.color}
                                fillOpacity={dim(l.id) ? 0.08 : 0.35}
                                shape={(props: { cx?: number; cy?: number; fill?: string; fillOpacity?: number }) => (
                                    <circle cx={props.cx} cy={props.cy} r={2.5} fill={props.fill} fillOpacity={props.fillOpacity} />
                                )}
                                isAnimationActive={false}
                            />
                        ))}
                        {lists.map(l => (
                            <Line
                                key={`line-${l.id}`}
                                dataKey={(p: Record<string, number[] | undefined>) => (Array.isArray(p[l.id]) ? p[l.id]![1] : null)}
                                stroke={l.color}
                                strokeWidth={2}
                                strokeOpacity={dim(l.id) ? 0.2 : 1}
                                dot={false}
                                activeDot={false}
                                isAnimationActive={false}
                            />
                        ))}
                    </ComposedChart>
                </ResponsiveContainer>
            </div>
        </div>
    )
}

export default PollAverageChart
