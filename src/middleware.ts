import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const response = NextResponse.next();
    const pathname = request.nextUrl.pathname;
    const purpose = request.headers.get('next-router-prefetch') ? 'prefetch' : 'page-load';
    const timestamp = new Date().toLocaleTimeString();

    // Customize Cache-Control for ISR pages
    // if (pathname.startsWith('/isr_page/')) {
    //     console.log(`[${timestamp}] [ISR] ${purpose.toUpperCase()} → ${pathname}`);
    //     response.headers.set(
    //         'Cache-Control',
    //         'public, s-maxage=60, stale-while-revalidate=120' // 10 min SWR window
    //     );
    // }

    // Keep default behavior for SSG pages (1 year SWR)
    // if (pathname.startsWith('/ssg_page/')) {
    //     console.log(`[${timestamp}] [SSG] ${purpose.toUpperCase()} → ${pathname}`);
    //     response.headers.set(
    //         'Cache-Control',
    //         'public, s-maxage=60, stale-while-revalidate=120' // 1 year
    //     );
    // }

    return response;
}

export const config = {
    matcher: [
        '/isr_page/:path*',
        '/ssg_page/:path*',
    ],
};
