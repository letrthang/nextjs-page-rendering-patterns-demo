import Link from 'next/link';
import './isr_page.css';

interface Page {
    id: string;
    title: string;
    status: string;
    date_created: string;
    date_updated?: string;
    permalink: string;
}

interface PageBlock {
    id: string;
    sort: number;
    page: string;
    item: string;
    collection: string;
    hide_block: boolean;
    background: string;
}

// ISR - Incremental Static Regeneration
// Generated at build time, revalidated every 60 seconds
export const revalidate = 60;

// Optional: Set custom cache headers for the page response
// Next.js will automatically add: Cache-Control: s-maxage=60, stale-while-revalidate
// You can customize further if needed:
// export const dynamic = 'force-static';
// export const dynamicParams = true;

async function getISRPageData(id: string) {
    try {
        // ISR always runs on server, so we can call Directus directly
        // (both at build time and during revalidation)
        const [pageResponse, blocksResponse] = await Promise.all([
            fetch(`${process.env.DIRECTUS_URL}/items/pages/${id}`, {
                headers: {
                    'Authorization': `Bearer ${process.env.DIRECTUS_TOKEN}`,
                },
                next: {
                    revalidate: 600, // Revalidate every 60 seconds
                    tags: ['isr-pages', `isr-page-${id}`] // ← Add cache tags
                }
            }),
            fetch(`${process.env.DIRECTUS_URL}/items/page_blocks?filter[page][_eq]=${id}`, {
                headers: {
                    'Authorization': `Bearer ${process.env.DIRECTUS_TOKEN}`,
                },
                next: {
                    revalidate: 600,
                    tags: ['isr-pages', 'page-blocks', `page-blocks-${id}`] // ← Add cache tags
                }
            }),
        ]);

        if (!pageResponse.ok) {
            return null;
        }

        const page = await pageResponse.json();
        const blocks = await blocksResponse.json();

        return {
            page: page.data,
            blocks: blocks.data,
        };
    } catch (error) {
        console.error('Error fetching ISR data:', error);
        return null;
    }
}

export async function generateStaticParams() {
    try {
        const response = await fetch(`${process.env.DIRECTUS_URL}/items/pages`, {
            headers: {
                'Authorization': `Bearer ${process.env.DIRECTUS_TOKEN}`,
            },
        });
        const data = await response.json();

        return data.data.map((page: Page) => ({
            id: page.id.toString(),
        }));
    } catch (error) {
        console.error('Error generating static params:', error);
        return [];
    }
}

export default async function ISRPageDetail({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const data = await getISRPageData(id);

    if (!data) {
        return <div className="isr-error">ISR Page not found</div>;
    }

    const { page, blocks } = data;
    const currentTime = new Date().toLocaleString();

    return (
        <div className="isr-container">
            <nav className="isr-breadcrumb">
                <Link href="/">← Back to All Pages</Link>
            </nav>

            <article className="isr-page-content">
                <header>
                    <h1>{page.title} (ISR)</h1>
                    <div className="isr-page-meta">
                        <span className="isr-status">Type: Incremental Static Regeneration</span>
                        <span className="isr-revalidate">Revalidates: Every 60 seconds</span>
                        <span className="isr-date">
                            Page Status: {page.status}
                        </span>
                        <span className="isr-date">
                            Created: {new Date(page.date_created).toLocaleDateString()}
                        </span>
                        {page.date_updated && (
                            <span className="isr-date">
                                Updated: {new Date(page.date_updated).toLocaleDateString()}
                            </span>
                        )}
                        <span className="isr-rendered">
                            Last Rendered: {currentTime}
                        </span>
                    </div>
                </header>

                <section className="isr-blocks">
                    <h2>Page Blocks ({blocks.length})</h2>

                    <div className="isr-blocks-list">
                        {blocks.map((block: PageBlock) => (
                            <div key={block.id} className="isr-block-card">
                                <h3>Block #{block.sort}</h3>
                                <div className="isr-block-info">
                                    <p><strong>Collection:</strong> {block.collection}</p>
                                    <p><strong>Background:</strong> {block.background}</p>
                                    <p><strong>Hidden:</strong> {block.hide_block ? 'Yes' : 'No'}</p>
                                    <p><strong>Item ID:</strong> {block.item}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="isr-info">
                    <h3>About ISR (Incremental Static Regeneration)</h3>
                    <ul>
                        <li>✅ Pages are pre-rendered at build time</li>
                        <li>✅ Cached and served instantly from CDN</li>
                        <li>✅ Automatically revalidated every 60 seconds</li>
                        <li>✅ Stale content is served while regenerating in background</li>
                        <li>✅ Best of both worlds: Static performance + Fresh content</li>
                    </ul>
                </section>
            </article>
        </div>
    );
}
