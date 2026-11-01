const MONTHS = ['siječnja', 'veljače', 'ožujka', 'travnja', 'svibnja', 'lipnja', 'srpnja', 'kolovoza', 'rujna', 'listopada', 'studenoga', 'prosinca']

// '2026-11-01' -> '1. studenoga 2026.'
export function longDate(date: string) {
    const d = new Date(date)
    return `${d.getDate()}. ${MONTHS[d.getMonth()]} ${d.getFullYear()}.`
}

export const percent = (p: number) => (p < 0.01 ? 'manje od 1%' : p > 0.99 ? 'više od 99%' : `${Math.round(p * 100)}%`)
