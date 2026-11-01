import { useEffect, useState } from 'react'
import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, TooltipProps, XAxis, YAxis } from 'recharts'
import { longDate, percent } from '../../../utils/format'
import { asset } from '../../../utils/assets'

type Range3 = [number, number, number] // 10th percentile, median, 90th percentile

interface Scenario {
    vote: number
    seats: Range3
    hdzSeats: Range3
    pFirst: number
    pHdzFirst: number
    leftSeats: Range3
    pLeftMajority: number
    pLeftMajorityWithMinorities: number
    pRightMajority: number
}

interface ScenarioData {
    updated: string
    electionDay: string
    simulations: number
    separate: Scenario & { seatsMean: number; sdpSeats: Range3; mozemoSeats: Range3 }
    joint: (Scenario & { retention: number; bonus?: Range3; bonusMean?: number })[]
    curve: { retention: number; seats: number; pFirst: number; pLeftMajority: number }[]
    breakEven: number
}

const JOINT_COLOR = '#E31E24'

const H2 = ({ children }: { children: React.ReactNode }) => (
    <h2 className="mt-8 mb-3 text-lg font-bold tracking-tight text-slate-900">{children}</h2>
)
const P = ({ children }: { children: React.ReactNode }) => (
    <p className="mb-4 leading-relaxed text-slate-700">{children}</p>
)

function RetentionChart({ data }: { data: ScenarioData }) {
    const curve = data.curve.map(c => ({ ...c, pct: Math.round(c.retention * 100) }))
    const renderTooltip = ({ active, payload }: TooltipProps<number, string>) => {
        if (!active || !payload?.length) return null
        const c = payload[0].payload as (typeof curve)[number]
        return (
            <div className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs shadow-md">
                <p className="font-semibold text-slate-900">Zadrži {c.pct}% birača</p>
                <p className="text-slate-600">Prosječno <span className="font-semibold text-slate-900">{c.seats.toFixed(0)}</span> mandata</p>
                <p className="text-slate-600">Najjača lista: {percent(c.pFirst)}</p>
            </div>
        )
    }
    return (
        <figure className="my-6">
            <div className="h-64 sm:h-72">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={curve} margin={{ top: 10, right: 12, bottom: 4, left: -16 }}>
                        <CartesianGrid stroke="#e2e8f0" vertical={false} />
                        <XAxis
                            dataKey="pct"
                            type="number"
                            domain={[80, 100]}
                            ticks={[80, 85, 90, 95, 100]}
                            tickFormatter={v => `${v}%`}
                            tick={{ fontSize: 11, fill: '#64748b' }}
                            axisLine={{ stroke: '#cbd5e1' }}
                            tickLine={false}
                        />
                        <YAxis
                            domain={[50, 70]}
                            ticks={[50, 55, 60, 65, 70]}
                            tick={{ fontSize: 11, fill: '#64748b' }}
                            axisLine={false}
                            tickLine={false}
                        />
                        <Tooltip content={renderTooltip} cursor={{ stroke: '#94a3b8', strokeDasharray: '3 3' }} />
                        <ReferenceLine
                            y={data.separate.seatsMean}
                            stroke="#64748b"
                            strokeDasharray="4 4"
                            label={{ value: `Odvojeno: ${Math.round(data.separate.seatsMean)}`, position: 'insideTopLeft', fontSize: 11, fill: '#475569' }}
                        />
                        <ReferenceLine x={Math.round(data.breakEven * 100)} stroke="#cbd5e1" />
                        <Line dataKey="seats" stroke={JOINT_COLOR} strokeWidth={2} dot={{ r: 2.5, fill: JOINT_COLOR, strokeWidth: 0 }} activeDot={{ r: 5 }} isAnimationActive={false} />
                    </LineChart>
                </ResponsiveContainer>
            </div>
            <figcaption className="mt-2 text-xs leading-relaxed text-slate-500">
                Prosječan broj mandata zajedničke liste SDP-a i Možemo (crvena linija) ovisno o tome koliki dio
                birača obiju stranaka zadrži. Isprekidana linija: koliko bi mandata imale dvije odvojene liste.
                Okomita linija: prag isplativosti od {Math.round(data.breakEven * 100)}%.
            </figcaption>
        </figure>
    )
}

function SummaryTable({ data }: { data: ScenarioData }) {
    const rows = [
        { label: 'Odvojeno', s: data.separate },
        ...data.joint.map(j => ({ label: `Zajedno, zadrži ${Math.round(j.retention * 100)}%`, s: j })),
    ]
    return (
        <div className="-mx-4 my-6 overflow-x-auto px-4">
            <table className="w-full min-w-[34rem] text-sm">
                <thead>
                    <tr className="border-b border-slate-300 text-left text-xs text-slate-500">
                        <th className="py-2 pr-3 font-semibold">Scenarij</th>
                        <th className="py-2 px-2 text-right font-semibold">Glasovi</th>
                        <th className="py-2 px-2 text-right font-semibold">Mandati SDP-a i Možemo</th>
                        <th className="py-2 px-2 text-right font-semibold">HDZ</th>
                        <th className="py-2 px-2 text-right font-semibold">Najjača lista</th>
                        <th className="py-2 pl-2 text-right font-semibold">Većina lijevog centra</th>
                    </tr>
                </thead>
                <tbody className="tabular-nums">
                    {rows.map(({ label, s }) => (
                        <tr key={label} className="border-b border-slate-100">
                            <td className="py-2 pr-3 text-slate-700">{label}</td>
                            <td className="py-2 px-2 text-right text-slate-700">{s.vote.toFixed(1)}%</td>
                            <td className="py-2 px-2 text-right">
                                <span className="font-semibold text-slate-900">{s.seats[1]}</span>
                                <span className="text-xs text-slate-400"> {s.seats[0]}–{s.seats[2]}</span>
                            </td>
                            <td className="py-2 px-2 text-right text-slate-700">{s.hdzSeats[1]}</td>
                            <td className="py-2 px-2 text-right text-slate-700">{percent(s.pFirst)}</td>
                            <td className="py-2 pl-2 text-right text-slate-700">{percent(s.pLeftMajority)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <p className="mt-2 text-xs leading-relaxed text-slate-500">
                Mandati: medijan i raspon u koji pada 80% simulacija. „Najjača lista”: šansa da SDP ili zajednička
                lista osvoji najviše mandata. Lijevi centar: SDP, Možemo, IDS, NPS, Fokus i RF, bez zastupnika manjina.
            </p>
        </div>
    )
}

function SdpMozemoKoalicija() {
    const [data, setData] = useState<ScenarioData | null>(null)
    const [error, setError] = useState(false)

    useEffect(() => {
        fetch(asset('data/blog/sdp-mozemo-koalicija.json'))
            .then(r => (r.ok ? r.json() : Promise.reject()))
            .then(setData)
            .catch(() => setError(true))
    }, [])

    if (error) return <p className="text-slate-500">Podaci za ovaj članak trenutno nisu dostupni.</p>
    if (!data) return null

    const s = data.separate
    const [full, ninety, eighty] = data.joint
    const breakEven = Math.round(data.breakEven * 100)

    return (
        <div>
            <P>
                SDP i Možemo u anketama zajedno imaju oko {s.vote.toFixed(0)}% glasova, znatno više od HDZ-a. Ipak,
                u našoj <a href="#/prognoza" className="text-blue-700 underline underline-offset-2">prognozi</a> HDZ
                je najjača lista u {percent(s.pHdzFirst)} simulacija, jer se ti glasovi dijele na dvije liste. Što bi
                se promijenilo da SDP i Možemo na izbore izađu zajedno? Model kojim radimo prognozu pustili smo i s
                jednom zajedničkom listom, na istih {data.simulations.toLocaleString('hr-HR')} simuliranih izbora.
            </P>

            <H2>Isti glasovi, više mandata</H2>
            <P>
                Kad bi zajednička lista zadržala sve birače obiju stranaka, osvojila bi {full.seats[1]} mandata,
                a dvije odvojene liste zajedno {s.seats[1]}. Razlika od oko {full.bonusMean?.toFixed(0)} mandata
                dolazi samo od načina raspodjele. D'Hondtova metoda u svakoj izbornoj jedinici nagrađuje veće liste,
                pa jedna velika lista na „ostatke” gubi manje glasova nego dvije manje. Te mandate uglavnom gubi HDZ,
                koji pada s {s.hdzSeats[1]} na {full.hdzSeats[1]}.
            </P>
            <P>
                Još je veća promjena na vrhu: zajednička lista bila bi najjača u {percent(full.pFirst)} simulacija,
                a HDZ u samo {percent(full.pHdzFirst)}. Odvojeno, SDP je najjači u tek {percent(s.pFirst)}.
            </P>

            <H2>Ali koalicija rijetko zadrži sve birače</H2>
            <P>
                Dio birača SDP-a ne bi glasao za listu s Možemo, a dio birača Možemo ne bi glasao za listu sa
                SDP-om. Koliko je takvih birača, ne znamo, jer ankete to ne mjere. Zato smo izračunali koliko
                mandata zajednička lista osvaja ovisno o tome koliki dio birača obiju stranaka zadrži.
            </P>

            <RetentionChart data={data} />

            <P>
                Prag isplativosti je oko {breakEven}%. Ako zajednička lista izgubi više od {100 - breakEven}% birača
                obiju stranaka, osvaja manje mandata nego dvije odvojene liste. Uz 90% zadržanih birača imala bi
                {' '}{ninety.seats[1]} mandata, a uz 80% njih {eighty.seats[1]}.
            </P>

            <H2>Prvo mjesto nije isto što i većina</H2>
            <P>
                Prvo mjesto je otpornije: i uz 10% izgubljenih birača zajednička lista bila bi najjača
                u {percent(ninety.pFirst)} simulacija. Ali vladu sastavlja onaj tko skupi 76 ruku u Saboru.
                Lijevi centar samostalnu većinu ima u {percent(s.pLeftMajority)} simulacija kad stranke izlaze
                odvojeno, u {percent(full.pLeftMajority)} uz zajedničku listu koja zadrži sve birače, a u
                samo {percent(ninety.pLeftMajority)} uz listu koja zadrži njih 90%.
            </P>

            <SummaryTable data={data} />

            <P>
                Ukratko, zajednička lista je oklada na disciplinu birača. Ako gotovo svi ostanu, SDP i Možemo
                dobivaju nekoliko mandata i gotovo sigurno prvo mjesto. Ako ode više od {100 - breakEven} od
                svakih sto birača, mandata je manje nego da su išli odvojeno. Prvo mjesto lista bi tada još
                vjerojatno zadržala, ali uz gubitak petine birača više ne.
            </P>

            <H2>Pretpostavke</H2>
            <ul className="mb-4 list-disc space-y-2 pl-5 leading-relaxed text-slate-700">
                <li>
                    Polazište je ista prognoza kao na stranici Prognoza: prosjek anketa do {longDate(data.updated)},
                    projiciran do izbora koje pretpostavljamo {longDate(data.electionDay)}
                </li>
                <li>
                    Birači koje zajednička lista izgubi ostaju kod kuće. To ima isti učinak kao da se razmjerno
                    rasporede na sve ostale liste. Kad bi prešli malim lijevim strankama, lijevi centar bi izgubio manje.
                </li>
                <li>Zajednička lista po izbornim jedinicama prati zbroj glasova SDP-ove liste i Možemo iz 2024.</li>
                <li>Sve ostale stranke izlaze kao u prognozi.</li>
                <li>Tri mandata dijaspore pripisana su HDZ-u, a osam zastupnika manjina nije pripisano nijednoj strani.</li>
            </ul>
        </div>
    )
}

export default SdpMozemoKoalicija
