import { revalidatePath, revalidateTag } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  // Verify secret token to prevent unauthorized revalidation
  const secret = request.nextUrl.searchParams.get('secret');

  if (secret !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json(
      { message: 'Invalid secret token' },
      { status: 401 }
    );
  }

  try {
    // Get optional parameters from request body
    const body = await request.json().catch(() => ({}));
    const { path, tag, type = 'page', revalidateAll = false } = body;

    // Option 1: Revalidate specific path
    if (path) {
      revalidatePath(path, type as 'page' | 'layout');
      return NextResponse.json({
        revalidated: true,
        message: `Path revalidated: ${path}`,
        timestamp: new Date().toISOString(),
      });
    }

    // Option 2: Revalidate by cache tag
    if (tag) {
      revalidateTag(tag, 'max');
      return NextResponse.json({
        revalidated: true,
        message: `Tag revalidated: ${tag}`,
        timestamp: new Date().toISOString(),
      });
    }

    // Option 3: Revalidate all ISR pages using tag (default behavior)
    // Use the broad tag 'isr-pages' to invalidate all ISR pages at once
    if (!revalidateAll) {
      revalidateTag('isr-pages', 'max');
      return NextResponse.json({
        revalidated: true,
        message: 'All ISR pages revalidated via tag: isr-pages',
        timestamp: new Date().toISOString(),
      });
    }

    // Option 4: Revalidate all ISR pages without tag (using path pattern)
    // This revalidates the entire /isr_page route and all its children
    revalidatePath('/isr_page', 'layout');

    return NextResponse.json({
      revalidated: true,
      message: 'All ISR pages revalidated via path: /isr_page',
      timestamp: new Date().toISOString(),
    });

  } catch (err) {
    console.error('Revalidation error:', err);
    return NextResponse.json(
      { 
        message: 'Error during revalidation',
        error: err instanceof Error ? err.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
