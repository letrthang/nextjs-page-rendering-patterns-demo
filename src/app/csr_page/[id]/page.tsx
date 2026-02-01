'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

interface Page {
    id: number;
    title: string;
    status: string;
    date_created: string;
    date_updated?: string;
    sections: number[];
}

interface Section {
    id: number;
    code: string;
    page_id: number;
    date_created: string;
    date_updated?: string;
    checkbox: string[];
}

const availableOptions = ['One', 'Two', 'Three', 'Four'];

export default function PageDetail() {
    const params = useParams();
    const id = params.id as string;

    const [page, setPage] = useState<Page | null>(null);
    const [sections, setSections] = useState<Section[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedOptions, setSelectedOptions] = useState<{[key: number]: string[]}>({});

    useEffect(() => {
        if (id) {
            fetchPageAndSections();
        }
    }, [id]);

    const fetchPageAndSections = async () => {
        try {
            setLoading(true);

            // Fetch page details
            const pageResponse = await fetch(`/api/proxy/items/pages/${id}`);
            if (!pageResponse.ok) throw new Error('Failed to fetch page');
            const pageData = await pageResponse.json();
            setPage(pageData.data);

            // Fetch sections for this page
            const sectionsResponse = await fetch(`/api/proxy/items/page_blocks?filter[page][_eq]=${id}`);
            if (!sectionsResponse.ok) throw new Error('Failed to fetch sections');
            const sectionsData = await sectionsResponse.json();
            console.log('Sections data:', sectionsData);
            setSections(sectionsData.data || []);

            // Initialize selected options with current checkbox values
            const initialSelections: {[key: number]: string[]} = {};
            (sectionsData.data || []).forEach((section: Section) => {
                initialSelections[section.id] = section.checkbox || [];
            });
            setSelectedOptions(initialSelections);

        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
            console.error('Error fetching data:', err);
        } finally {
            setLoading(false);
        }
    };

    const toggleOption = (sectionId: number, option: string) => {
        setSelectedOptions(prev => {
            const currentSelections = prev[sectionId] || [];
            const isSelected = currentSelections.includes(option);

            const newSelections = isSelected
                ? currentSelections.filter(opt => opt !== option)
                : [...currentSelections, option];

            return {
                ...prev,
                [sectionId]: newSelections
            };
        });
    };

    if (loading) return <div className="loading">Loading page...</div>;
    if (error) return <div className="error">Error: {error}</div>;
    if (!page) return <div className="error">Page not found</div>;

    return (
        <div className="container">
            <nav className="breadcrumb">
                <Link href="/">← Back to All Pages</Link>
            </nav>

            <article className="page-content">
                <header>
                    <h1>{page.title}</h1>
                    <div className="page-meta">
                        <span className="status">Status: {page.status}</span>
                        <span className="date">
                            Created: {new Date(page.date_created).toLocaleDateString()}
                        </span>
                        {page.date_updated && (
                            <span className="date">
                                Updated: {new Date(page.date_updated).toLocaleDateString()}
                            </span>
                        )}
                    </div>
                </header>

                <section className="sections">
                    <h2>Sections ({sections.length})</h2>

                    {sections.length === 0 ? (
                        <p className="no-sections">No sections found for this page.</p>
                    ) : (
                        <div className="sections-list">
                            {sections.map((section) => (
                                <div key={section.id} className="section-card">
                                    <h3>Section #{section.id}</h3>

                                    {/* Interactive Checkbox Selection */}
                                    <div className="section-checkbox">
                                        <h4>Selected Options:</h4>
                                        <div className="checkbox-options">
                                            {availableOptions.map((option) => {
                                                const isSelected = selectedOptions[section.id]?.includes(option) || false;
                                                return (
                                                    <label key={option} className="checkbox-option">
                                                        <input
                                                            type="checkbox"
                                                            checked={isSelected}
                                                            onChange={() => toggleOption(section.id, option)}
                                                        />
                                                        <span className={`checkbox-label ${isSelected ? 'selected' : ''}`}>
                                                            {option}
                                                        </span>
                                                    </label>
                                                );
                                            })}
                                        </div>

                                        {/* Display currently selected options as tags */}
                                        {selectedOptions[section.id] && selectedOptions[section.id].length > 0 && (
                                            <div className="selected-tags">
                                                <small>Currently selected:</small>
                                                <div className="checkbox-list">
                                                    {selectedOptions[section.id].map((option, index) => (
                                                        <span key={index} className="checkbox-tag">
                                                            {option}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="section-code">
                                        <pre>{section.code}</pre>
                                    </div>
                                    <div className="section-meta">
                                        <small>
                                            Created: {new Date(section.date_created).toLocaleDateString()}
                                            {section.date_updated && (
                                                <> • Updated: {new Date(section.date_updated).toLocaleDateString()}</>
                                            )}
                                        </small>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </article>

            <style jsx>{`
                .container {
                    max-width: 800px;
                    margin: 0 auto;
                    padding: 2rem;
                    font-family: Arial, sans-serif;
                }

                .breadcrumb {
                    margin-bottom: 2rem;
                }

                .breadcrumb a {
                    color: #2563eb;
                    text-decoration: none;
                    font-size: 0.9rem;
                }

                .breadcrumb a:hover {
                    text-decoration: underline;
                }

                .page-content h1 {
                    color: #333;
                    margin-bottom: 1rem;
                    border-bottom: 2px solid #e5e7eb;
                    padding-bottom: 0.5rem;
                }

                .page-meta {
                    display: flex;
                    gap: 1rem;
                    margin-bottom: 2rem;
                    font-size: 0.9rem;
                    color: #666;
                }

                .status {
                    background: #f3f4f6;
                    padding: 0.25rem 0.5rem;
                    border-radius: 4px;
                }

                .sections h2 {
                    color: #374151;
                    margin-bottom: 1.5rem;
                }

                .no-sections {
                    color: #666;
                    font-style: italic;
                    text-align: center;
                    padding: 2rem;
                    background: #f9f9f9;
                    border-radius: 8px;
                }

                .sections-list {
                    display: flex;
                    flex-direction: column;
                    gap: 1.5rem;
                }

                .section-card {
                    border: 1px solid #d1d5db;
                    border-radius: 8px;
                    padding: 1.5rem;
                    background: white;
                }

                .section-card h3 {
                    margin: 0 0 1rem 0;
                    color: #059669;
                    font-size: 1.1rem;
                }

                .section-checkbox {
                    margin-bottom: 1rem;
                    padding: 0.75rem;
                    background: #f0f9ff;
                    border: 1px solid #bae6fd;
                    border-radius: 6px;
                }

                .section-checkbox h4 {
                    margin: 0 0 0.75rem 0;
                    font-size: 0.9rem;
                    color: #0369a1;
                    font-weight: 600;
                }

                .checkbox-options {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 0.75rem;
                    margin-bottom: 1rem;
                }

                .checkbox-option {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    cursor: pointer;
                    user-select: none;
                }

                .checkbox-option input[type="checkbox"] {
                    margin: 0;
                    transform: scale(1.1);
                }

                .checkbox-label {
                    padding: 0.25rem 0.75rem;
                    border-radius: 4px;
                    font-size: 0.85rem;
                    font-weight: 500;
                    border: 2px solid #e5e7eb;
                    background: white;
                    transition: all 0.2s ease;
                }

                .checkbox-label.selected {
                    background: #2563eb;
                    color: white;
                    border-color: #2563eb;
                }

                .checkbox-label:hover {
                    border-color: #2563eb;
                }

                .selected-tags {
                    padding-top: 0.75rem;
                    border-top: 1px solid #bae6fd;
                }

                .selected-tags small {
                    display: block;
                    margin-bottom: 0.5rem;
                    color: #0369a1;
                    font-weight: 600;
                }

                .checkbox-list {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 0.5rem;
                }

                .checkbox-tag {
                    background: #2563eb;
                    color: white;
                    padding: 0.25rem 0.5rem;
                    border-radius: 4px;
                    font-size: 0.8rem;
                    font-weight: 500;
                }

                .section-code {
                    background: #f8fafc;
                    border: 1px solid #e2e8f0;
                    border-radius: 6px;
                    padding: 1rem;
                    margin-bottom: 1rem;
                }

                .section-code pre {
                    margin: 0;
                    font-family: 'Courier New', monospace;
                    font-size: 0.9rem;
                    white-space: pre-wrap;
                    word-break: break-word;
                }

                .section-meta {
                    color: #666;
                    font-size: 0.8rem;
                    border-top: 1px solid #f3f4f6;
                    padding-top: 0.5rem;
                }

                .loading, .error {
                    text-align: center;
                    padding: 2rem;
                    font-size: 1.1rem;
                }

                .error {
                    color: #dc2626;
                }

                .loading {
                    color: #2563eb;
                }
            `}</style>
        </div>
    );
}