import { useEffect, useMemo, useState } from 'react'
import { loadForecast } from '../../utils/dataLoader'
import { ForecastData, ForecastList } from '../../types/forecast'
import { PartyInfo } from '../../types'
import Parliament from '../Panels/Parliament'
import PollAverageChart from './PollAverageChart'
import { Page, Section } from '../Layout/Page'
import { longDate } from '../../utils/format'

const probability = (p: number) => (p < 0.01 ? '<1%' : p > 0.99 ? '>99%' : `${Math.round(p * 100)}%`)

// Median seats with the 80 % range, on a common scale
function SeatRanges({ lists, max }: { lists: ForecastList[]; max: number }) {
    const x = (seats: number) => `${(seats / max) * 100}%`
    return (
        <div className="space-y-2.5">
            {lists.map(l => (
                <div key={l.id} className="grid grid-cols-[5.25rem_1fr_4.5rem] items-center gap-3 text-sm" title={l.name}>
                    <span className="flex items-center gap-1.5 truncate font-medium text-slate-700">
                        <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: l.color }} />
                        {l.id}
                    </span>
                    <div className="relative h-4">
                        <div className="absolute inset-x-0 top-1/2 h-px bg-slate-200" />
                        <div
                            className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full"
                            style={{ left: x(l.seats.lo), width: `max(2px, ${x(l.seats.hi - l.seats.lo)})`, backgroundColor: l.color, opacity: 0.35 }}
                        />
                        <div
                            className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white"
                            style={{ left: x(l.seats.median), backgroundColor: l.color }}
                        />
                    </div>
                    <span className="text-right tabular-nums">
                        <span className="font-bold text-slate-900">{l.seats.median}</span>
                        <span className="text-xs text-slate-400"> {l.seats.lo}–{l.seats.hi}</span>
                    </span>
                </div>
            ))}
        </div>
    )
}

function ForecastPage() {
    const [data, setData] = useState<ForecastData | null>(null)
    const [error, setError] = useState(false)

    useEffect(() => {
        loadForecast().then(setData).catch(() => setError(true))
    }, [])

    // Lists the hemicycle can draw: expected seats, diaspora included
    const hemicycle = useMemo(() => {
        if (!data) return null
        const parties: PartyInfo[] = data.lists.map(l => ({ id: l.id, name: l.name, shortName: l.id, color: l.color }))
        const seats = Object.fromEntries(data.lists.map(l => [l.id, l.expectedSeats]))
        return { parties, seats }
    }, [data])

    if (error) {
        return <p className="p-8 text-center text-slate-500">Prognoza trenutno nije dostupna.</p>
    }
    if (!data || !hemicycle) {
        return (
            <div className="flex flex-1 items-center justify-center">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
            </div>
        )
    }

    const seated = data.lists.filter(l => l.seats.hi > 0)
    const maxSeats = Math.ceil(Math.max(...seated.map(l => l.seats.hi)) / 10) * 10
    const leaders = [...data.lists].sort((a, b) => b.pLargest - a.pLargest).slice(0, 2)

    return (
        <Page
            title="Prognoza parlamentarnih izbora"
            subtitle={`Sljedeći izbori za Hrvatski sabor · ažurirano ${longDate(data.updated)} · ${data.pollCount} anketa od izbora 2024.`}
        >
            <Section
                title="Prognoza mandata"
                description={`Rezultat ${data.simulations.toLocaleString('hr-HR')} simuliranih izbora, uz pretpostavku da se održe ${longDate(data.electionDay)}`}
            >
                <div className="grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
                    <div>
                        <div className="-mx-4 [&>div]:border-b-0">
                            <Parliament seats={hemicycle.seats} minoritySeats={data.minoritySeats} parties={hemicycle.parties} />
                        </div>
                        <p className="text-xs text-slate-400">Očekivani raspored: prosječan broj mandata u simulacijama.</p>
                        <div className="mt-4 grid grid-cols-2 gap-3">
                            {leaders.map(l => (
                                <div key={l.id} className="rounded-lg bg-slate-50 px-3 py-2.5">
                                    <p className="text-2xl font-bold tabular-nums text-slate-900">{probability(l.pLargest)}</p>
                                    <p className="text-xs text-slate-500">šansa da je {l.id} najjača lista</p>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div>
                        <div className="mb-2 flex justify-between text-[11px] font-medium uppercase tracking-wide text-slate-400">
                            <span>Lista</span>
                            <span>Medijan i raspon (80%)</span>
                        </div>
                        <SeatRanges lists={seated} max={maxSeats} />
                    </div>
                </div>

                <div className="mt-6 border-t border-slate-100 pt-4">
                    <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500">Šansa za većinu ({data.majority} od 151)</h3>
                    <div className="mt-3 space-y-3">
                        {data.blocs.map(b => (
                            <div key={b.name}>
                                <div className="flex items-baseline justify-between gap-3 text-sm">
                                    <span className="text-slate-700">{b.name}</span>
                                    <span className="shrink-0 font-bold tabular-nums text-slate-900">{probability(b.pMajority)}</span>
                                </div>
                                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100">
                                    <div className="h-full rounded-full bg-slate-700" style={{ width: `${b.pMajority * 100}%` }} />
                                </div>
                                <p className="mt-0.5 text-[11px] text-slate-400">
                                    Medijan {b.medianSeats} mandata ({b.lo}–{b.hi}) · uz svih {data.minoritySeats} zastupnika manjina {probability(b.pMajorityWithMinorities)}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </Section>

            <Section
                title="Prosjek anketa"
                description="Udio među opredijeljenim biračima. Linija je prosjek svih anketa, korigiran za sustavna odstupanja pojedinih agencija; pojas je raspon u koji pada oko 80% anketa, a točke pojedine ankete."
            >
                <PollAverageChart data={data} />
            </Section>

            <section className="px-1 text-xs leading-relaxed text-slate-500">
                <h2 className="mb-1 font-semibold text-slate-600">Kako nastaje prognoza</h2>
                <p>
                    Prosjek anketa projicira se do dana izbora, s nesigurnošću koja raste s vremenom do izbora.
                    Uzima se u obzir da su ankete na prošlim izborima u pravilu podcjenjivale HDZ, a projekcija se
                    kombinira s modelom koji se oslanja na kretanje nezaposlenosti tijekom mandata. Rezultat se
                    raspoređuje po izbornim jedinicama prema obrascu iz 2024. i pretvara u mandate D'Hondtovom metodom
                    uz prag od 5%. Tri mandata dijaspore pripisana su HDZ-u, a osam zastupnika manjina nije pripisano
                    nijednoj strani. Pretpostavlja se da stranke izlaze u istim koalicijama kao 2024., osim DOMiNO-a,
                    koji se odvojio od DP-a.
                </p>
            </section>
        </Page>
    )
}

export default ForecastPage
