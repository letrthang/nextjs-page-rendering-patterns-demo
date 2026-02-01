import { NextRequest, NextResponse } from 'next/server';

const DIRECTUS_URL = process.env.DIRECTUS_URL || 'http://localhost:8055';
const DIRECTUS_TOKEN = process.env.DIRECTUS_TOKEN;

async function handleProxy(request: NextRequest, path: string[]) {
    const targetPath = path.join('/');
    const targetUrl = `${DIRECTUS_URL}/${targetPath}${request.nextUrl.search}`;

    const headers = new Headers();
    headers.set('Authorization', `Bearer ${DIRECTUS_TOKEN}`);
    headers.set('Accept', 'application/json');

    if (request.headers.get('content-type')) {
        headers.set('Content-Type', request.headers.get('content-type') as string);
    }

    const init: RequestInit = {
        method: request.method,
        headers,
    };

    if (request.method !== 'GET' && request.method !== 'HEAD') {
        init.body = await request.text();
    }

    const response = await fetch(targetUrl, init);
    const responseBody = await response.text();

    return new NextResponse(responseBody, {
        status: response.status,
        headers: {
            'Content-Type': response.headers.get('content-type') || 'application/json',
        },
    });
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
    const { path } = await params;
    return handleProxy(request, path);
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
    const { path } = await params;
    return handleProxy(request, path);
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
    const { path } = await params;
    return handleProxy(request, path);
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
    const { path } = await params;
    return handleProxy(request, path);
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
    const { path } = await params;
    return handleProxy(request, path);
}
