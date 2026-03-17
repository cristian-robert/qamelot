import { NextRequest, NextResponse } from 'next/server';

const PUBLIC_PATHS = ['/login', '/register'];

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('access_token')?.value;

  const isPublic = PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );

  if (!isPublic && !token) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('from', pathname);
    return NextResponse.redirect(url);
  }

  if (isPublic && token) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
};
