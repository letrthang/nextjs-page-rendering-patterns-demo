import { NextRequest, NextResponse } from 'next/server';

const DIRECTUS_URL = process.env.DIRECTUS_URL || 'http://localhost:8055';
const DIRECTUS_TOKEN = process.env.DIRECTUS_TOKEN;

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const pageId = searchParams.get('page_id');

        let url = `${DIRECTUS_URL}/items/page_blocks`;

        // Filter by page_id if provided
        if (pageId) {
            url += `?filter[page][_eq]=${pageId}`;
        }

        console.log('Fetching sections from URL:', url); // Debug log

        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${DIRECTUS_TOKEN}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`Directus API error: ${response.status}`);
        }

        const data = await response.json();
        console.log('Sections response:', data); // Debug log
        return NextResponse.json(data.data);
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch sections' },
            { status: 500 }
        );
    }
}