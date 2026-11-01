import { Suspense } from 'react'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { POSTS } from './posts'
import { longDate } from '../../utils/format'
import { Card, Page } from '../Layout/Page'

const Spinner = () => (
    <div className="flex items-center justify-center py-24">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
    </div>
)

// '#/blog' lists the posts, '#/blog/<slug>' shows one
function BlogPage({ slug }: { slug: string }) {
    const post = POSTS.find(p => p.slug === slug)

    if (post) {
        return (
            <Page
                title={post.title}
                subtitle={`Blog · ${longDate(post.date)}`}
                above={
                    <a href="#/blog" className="mb-3 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900">
                        <ArrowLeft size={14} /> Svi članci
                    </a>
                }
            >
                <Card className="sm:p-8">
                    <article className="max-w-3xl">
                        <p className="mb-6 text-lg leading-relaxed text-slate-600">{post.summary}</p>
                        <Suspense fallback={<Spinner />}>
                            <post.Component />
                        </Suspense>
                    </article>
                </Card>
            </Page>
        )
    }

    return (
        <Page title="Blog" subtitle="Analize izbora, anketa i prognoza">
            {slug && <p className="text-sm text-slate-500">Taj članak ne postoji.</p>}
            <div className="grid gap-5 md:grid-cols-2">
                {POSTS.map(p => (
                    <a key={p.slug} href={`#/blog/${p.slug}`} className="group block">
                        <Card className="h-full transition-colors group-hover:border-slate-300">
                            <p className="text-xs text-slate-500">{longDate(p.date)}</p>
                            <h2 className="mt-1 text-base font-bold text-slate-900 group-hover:text-blue-700">{p.title}</h2>
                            <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{p.summary}</p>
                            <p className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-blue-700">
                                Pročitaj <ArrowRight size={14} />
                            </p>
                        </Card>
                    </a>
                ))}
            </div>
        </Page>
    )
}

export default BlogPage
