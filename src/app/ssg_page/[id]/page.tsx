import Link from 'next/link';
import './ssg_page.css';
import TitleDialog from './TitleDialog';

interface SSGPage {
    id: number;
    title: string;
    date_created: string;
    date_updated?: string;
    ssg_sections: number[];
}

interface SSGSection {
    id: number;
    radio_button: string;
    page_id: number;
    date_created: string;
    date_updated?: string;
}

// Static Site Generation - runs at build time
export async function generateStaticParams() {
    try {
        const response = await fetch(`${process.env.DIRECTUS_URL}/items/pages`, {
            headers: {
                'Authorization': `Bearer ${process.env.DIRECTUS_TOKEN}`,
            },
        });
        const data = await response.json();

        if (!data.data) return [];

        return data.data.map((page: SSGPage) => ({
            id: page.id.toString(),
        }));
    } catch (error) {
        console.error('Error generating static params:', error);
        return [];
    }
}

// Generate random number with 5 digits
function generateRandomNumber(): string {
    return Math.floor(10000 + Math.random() * 90000).toString();
}

async function getSSGPageData(id: string) {
    try {
        const [pageResponse, blocksResponse] = await Promise.all([
            fetch(`${process.env.DIRECTUS_URL}/items/pages/${id}`, {
                headers: { 'Authorization': `Bearer ${process.env.DIRECTUS_TOKEN}` },
            }),
            fetch(`${process.env.DIRECTUS_URL}/items/page_blocks?filter[page][_eq]=${id}`, {
                headers: { 'Authorization': `Bearer ${process.env.DIRECTUS_TOKEN}` },
            }),
        ]);

        if (!pageResponse.ok) return null;

        const page = await pageResponse.json();
        const blocks = await blocksResponse.json();

        return {
            page: page.data,
            blocks: blocks.data || [],
        };
    } catch (error) {
        console.error('Error fetching SSG data:', error);
        return null;
    }
}

export default async function SSGPageDetail({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const data = await getSSGPageData(id);

    if (!data || !data.page) {
        return <div className="ssg-error">SSG Page not found</div>;
    }

    const { page, blocks } = data;
    const buildTime = new Date().toLocaleString();
    const randomNumber = generateRandomNumber();

    return (
        <div className="ssg-container">
            <nav className="ssg-breadcrumb">
                <Link href="/">← Back to All Pages</Link>
            </nav>

            <article className="ssg-page-content">
                <header>
                    <h1>{page.title} (SSG)</h1>
                    <TitleDialog title={page.title} randomNumber={randomNumber} />
                    <div className="ssg-page-meta">
                        <span className="ssg-status">Type: Static Site Generation</span>
                        <span className="ssg-date">
                            Status: {page.status}
                        </span>
                        <span className="ssg-date">
                            Created: {new Date(page.date_created).toLocaleDateString()}
                        </span>
                        {page.date_updated && (
                            <span className="ssg-date">
                                Updated: {new Date(page.date_updated).toLocaleDateString()}
                            </span>
                        )}
                        <span className="ssg-date">
                            Built at: {buildTime}
                        </span>
                    </div>
                </header>

                <section className="ssg-sections">
                    <h2>Page Blocks ({blocks.length})</h2>

                    <div className="ssg-sections-list">
                        {blocks.map((block: any) => (
                            <div key={block.id} className="ssg-section-card">
                                <h3>Block #{block.sort}</h3>

                                <div className="ssg-section-radio">
                                    <h4>Block Details:</h4>
                                    <div className="ssg-radio-display">
                                        <p><strong>Collection:</strong> {block.collection}</p>
                                        <p><strong>Background:</strong> {block.background}</p>
                                        <p><strong>Hidden:</strong> {block.hide_block ? 'Yes' : 'No'}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="ssg-info">
                    <h3>About SSG (Static Site Generation)</h3>
                    <ul>
                        <li>✅ Pre-rendered at build time</li>
                        <li>✅ Served as static HTML (fastest)</li>
                        <li>❌ Content never updates until rebuild</li>
                        <li>✅ Perfect for content that rarely changes</li>
                    </ul>
                </section>
            </article>
        </div>
    );
}