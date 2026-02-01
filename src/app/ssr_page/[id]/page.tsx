import Link from 'next/link';
import './ssr_page.css';

interface SSRPage {
    id: number;
    title: string;
    date_created: string;
    date_updated?: string;
    ssr_sections: number[];
}

interface SSRSection {
    id: number;
    text_editor: {
        time: number;
        blocks: Array<{
            id: string;
            type: string;
            data: {
                text: string;
            };
        }>;
        version: string;
    };
    page_id: string;
    date_created: string;
    date_updated?: string;
}

// Server-Side Rendering - runs on each request
async function getSSRPageData(id: string) {
    try {
        // SSR runs on server, so we can call Directus directly
        const [pageResponse, blocksResponse] = await Promise.all([
            fetch(`${process.env.DIRECTUS_URL}/items/pages/${id}`, {
                headers: {
                    'Authorization': `Bearer ${process.env.DIRECTUS_TOKEN}`,
                },
                cache: 'no-store', // Always fresh data
            }),
            fetch(`${process.env.DIRECTUS_URL}/items/page_blocks?filter[page][_eq]=${id}`, {
                headers: {
                    'Authorization': `Bearer ${process.env.DIRECTUS_TOKEN}`,
                },
                cache: 'no-store',
            }),
        ]);

        if (!pageResponse.ok) {
            return null;
        }

        const page = await pageResponse.json();
        const blocks = await blocksResponse.json();

        return {
            page: page.data,
            blocks: blocks.data || [],
        };
    } catch (error) {
        console.error('Error fetching SSR data:', error);
        return null;
    }
}

export default async function SSRPageDetail({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const data = await getSSRPageData(id);

    if (!data) {
        return <div className="ssr-error">SSR Page not found</div>;
    }

    const { page, blocks } = data;
    const requestTime = new Date().toLocaleString();

    return (
        <div className="ssr-container">
            <nav className="ssr-breadcrumb">
                <Link href="/">← Back to All Pages</Link>
            </nav>

            <article className="ssr-page-content">
                <header>
                    <h1>{page.title} (SSR)</h1>
                    <div className="ssr-page-meta">
                        <span className="ssr-status">Type: Server-Side Rendering</span>
                        <span className="ssr-date">
                            Status: {page.status}
                        </span>
                        <span className="ssr-date">
                            Created: {new Date(page.date_created).toLocaleDateString()}
                        </span>
                        {page.date_updated && (
                            <span className="ssr-date">
                                Updated: {new Date(page.date_updated).toLocaleDateString()}
                            </span>
                        )}
                        <span className="ssr-date">
                            Rendered at: {requestTime}
                        </span>
                    </div>
                </header>

                <section className="ssr-sections">
                    <h2>Page Blocks ({blocks.length})</h2>

                    <div className="ssr-sections-list">
                        {blocks.map((block: any) => (
                            <div key={block.id} className="ssr-section-card">
                                <h3>Block #{block.sort}</h3>

                                <div className="ssr-section-editor">
                                    <h4>Block Details:</h4>
                                    <div className="ssr-editor-content">
                                        <p><strong>Collection:</strong> {block.collection}</p>
                                        <p><strong>Background:</strong> {block.background}</p>
                                        <p><strong>Hidden:</strong> {block.hide_block ? 'Yes' : 'No'}</p>
                                        <p><strong>Item ID:</strong> {block.item}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="ssr-info">
                    <h3>About SSR (Server-Side Rendering)</h3>
                    <ul>
                        <li>✅ Rendered on every request</li>
                        <li>✅ Always fresh, up-to-date content</li>
                        <li>❌ Slower response time (no caching)</li>
                        <li>✅ Perfect for dynamic, real-time data</li>
                    </ul>
                </section>
            </article>
        </div>
    );
}