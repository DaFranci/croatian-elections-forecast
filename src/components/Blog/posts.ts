import { ComponentType, lazy } from 'react'

export interface Post {
    slug: string
    title: string
    date: string
    summary: string
    Component: ComponentType
}

// Newest first
export const POSTS: Post[] = [
    {
        slug: 'sdp-mozemo-koalicija',
        title: 'Što ako SDP i Možemo izađu zajedno?',
        date: '2026-11-01',
        summary: 'Zajednička lista donijela bi nekoliko mandata više i gotovo sigurno prvo mjesto, ali samo ako zadrži gotovo sve birače obiju stranaka.',
        Component: lazy(() => import('./posts/SdpMozemoKoalicija')),
    },
]
