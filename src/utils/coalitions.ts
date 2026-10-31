import { ElectionData, PartyInfo } from '../types'
import { getPartyColor } from './dataProcessor'

// Campaign names of coalitions, which the ballot (and so the data) doesn't carry.
// Lists are identified by their lead party.
const COALITION_NAMES: Record<string, Record<string, { name: string; shortName: string }>> = {
    '2011-parliamentary': { SDP: { name: 'Kukuriku koalicija', shortName: 'Kukuriku' } },
    '2014-eu': { SDP: { name: 'Kukuriku koalicija', shortName: 'Kukuriku' } },
    '2015-parliamentary': {
        HDZ: { name: 'Domoljubna koalicija', shortName: 'Domoljubna koalicija' },
        SDP: { name: 'Hrvatska raste', shortName: 'Hrvatska raste' },
    },
    '2016-parliamentary': { SDP: { name: 'Narodna koalicija', shortName: 'Narodna koalicija' } },
    '2019-eu': {
        HSS: { name: 'Amsterdamska koalicija', shortName: 'Amsterdamska koalicija' },
        HRAST: { name: 'Hrvatski suverenisti', shortName: 'Suverenisti' },
    },
    '2020-parliamentary': {
        SDP: { name: 'Restart koalicija', shortName: 'Restart' },
        'POLITIČKA PLATFORMA': { name: 'Zeleno-lijeva koalicija', shortName: 'Možemo! i partneri' },
    },
    '2024-parliamentary': { SDP: { name: 'Rijeke pravde', shortName: 'Rijeke pravde' } },
}

// 'BOSNA I HERCEGOVINA' -> 'Bosna i Hercegovina', 'dr. sc. MILORAD PUPOVAC' -> 'dr. sc. Milorad Pupovac'
export function displayName(name: string) {
    return name.split(' ').map(word => {
        if (word !== word.toUpperCase() || !/[A-ZČĆĐŠŽ]/.test(word)) return word
        if (['I', 'U'].includes(word)) return word.toLowerCase()
        return word.charAt(0) + word.slice(1).toLowerCase().replace(/([-(])(\p{L})/gu, (_, sep, c) => sep + c.toUpperCase())
    }).join(' ')
}

// 'ZAGREB JE NAŠ!' -> 'Zagreb je naš!', 'PROMIJENIMO HRVATSKU' -> 'Promijenimo Hrvatsku'
function sentenceCase(name: string) {
    const lower = name.toLocaleLowerCase('hr').replace(/(^|\s)(hrvatsk(?:a|e|u|oj)|zagreb)(?=[\s!]|$)/gu,
        (_, space, noun) => space + noun.charAt(0).toUpperCase() + noun.slice(1))
    return lower.charAt(0).toLocaleUpperCase('hr') + lower.slice(1)
}

// 'HRVATSKI LABURISTI - STRANKA RADA' and 'HRVATSKI LABURISTI-STRANKA RADA' are the same party
const normalize = (name: string) => name.replace(/"/g, '').replace(/\s*-\s*/g, '-').trim().toUpperCase()

// 'HRVATSKA SOCIJALNO - LIBERALNA STRANKA - HSLS' -> 'HSLS', 'ZAGREB JE NAŠ!' -> 'Zagreb je naš!'
function memberLabel(member: string, parties: PartyInfo[]) {
    const parts = member.replace(/"/g, '').split(' - ').map(p => p.trim()).filter(Boolean)
    for (const part of [member, ...parts.reverse()]) {
        const known = parties.find(p => normalize(p.id) === normalize(part))
        if (known) return known.partyShortName ?? known.shortName
    }
    parts.reverse()
    const last = parts[parts.length - 1]
    const isAbbreviation = parts.length > 1 && last.length < parts[0].length && /^[A-ZČĆĐŠŽ][\p{L}.]{0,4}$/u.test(last.split(' ')[0])
    return isAbbreviation ? last : sentenceCase(parts[0])
}

// Party labels of a list name, the lead party (labelled `lead`) first
function coalitionMembers(listName: string, lead: string, parties: PartyInfo[]) {
    const partners = listName.split(',').slice(1).map(m => m.trim()).filter(Boolean).map(m => memberLabel(m, parties))
    return [...new Set([lead, ...partners])]
}

function withMembers(party: PartyInfo, members: string[]): PartyInfo {
    if (party.campaignName) return { ...party, coalition: members }
    if (members.length < 2) {
        return { ...party, name: party.partyName ?? party.name, shortName: party.partyShortName ?? party.shortName, coalition: undefined }
    }
    // Short name for the legend and seat chart: up to three partners while it stays short
    let shown = 1
    while (shown < Math.min(3, members.length) && members.slice(0, shown + 1).join('–').length <= 26) shown++
    const extra = members.length - shown
    return {
        ...party,
        name: members.join(' – '),
        shortName: members.slice(0, shown).join('–') + (extra > 0 ? ` +${extra}` : ''),
        coalition: members,
    }
}

// Party info for this election: lists that ran as coalitions are named after the coalition.
// Where partners differ between constituencies, all partners are named, most-voted lists first.
export function withCoalitions(parties: PartyInfo[], data: ElectionData, electionId: string): PartyInfo[] {
    const names = COALITION_NAMES[electionId] ?? {}
    const listVotes: Record<string, Record<string, number>> = {}
    const regions = data.constituencies ? Object.values(data.constituencies) : Object.values(data.results)
    regions.forEach(region => Object.entries(region.parties).forEach(([partyId, p]) => {
        listVotes[partyId] ??= {}
        const listName = p.coalition_name ?? partyId
        listVotes[partyId][listName] = (listVotes[partyId][listName] ?? 0) + p.votes
    }))

    const result = new Map(parties.map(p => [p.id, p]))
    Object.entries(listVotes).forEach(([partyId, lists]) => {
        const listNames = Object.keys(lists).sort((a, b) => lists[b] - lists[a])
        const known = parties.find(p => p.id === partyId)
        const base: PartyInfo = known ?? {
            id: partyId,
            // 'NEOVISNA LISTA - NINA SKOČAK' -> 'Neovisna lista - Nina Skočak', 'AKCIJA MLADIH - AM' -> 'Akcija mladih - AM'
            name: listNames[0].split(',')[0].replace(/"/g, '').split(' - ')
                .map((part, i) => i === 0 ? sentenceCase(part.trim()) : part.trim().length <= 5 ? part.trim() : displayName(part.trim()))
                .join(' - '),
            shortName: partyId.length > 24 ? memberLabel(listNames[0].split(',')[0], parties) : partyId,
            color: getPartyColor('Other', parties),
        }
        const members = [...new Set(listNames.flatMap(l => coalitionMembers(l, base.shortName, parties)))]
        const campaign = names[partyId]
        result.set(partyId, withMembers({
            ...base,
            partyName: base.name,
            partyShortName: base.shortName,
            ...(campaign && { name: campaign.name, shortName: campaign.shortName, campaignName: true }),
        }, members))
    })
    return [...result.values()]
}

// The same list as run in one constituency or municipality, with only its local partners
export function localParty(party: PartyInfo, listName: string | undefined, parties: PartyInfo[]): PartyInfo {
    if (!listName || !party.coalition) return party
    return withMembers(party, coalitionMembers(listName, party.partyShortName ?? party.shortName, parties))
}
