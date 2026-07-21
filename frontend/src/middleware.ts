import { NextRequest, NextResponse } from 'next/server';
const AUTH_COOKIE = 'ai_vendor_contract_risk_monitor_session';

const protectedPaths = [
  '/dashboard',
  '/features',
  '/documents',
  '/profiles',
  '/accounts',
  '/contacts',
  '/leads',
  '/opportunities',
  '/pipeline',
  '/campaigns',
  '/outreach-sequences',
  '/activities',
  '/quotes-contracts',
  '/billing-revenue',
  '/recruiting-staffing',
  '/reports-forecasting',
  '/templates',
  '/integrations',
  '/custom-views',
];

function isProtected(pathname: string) {
  return protectedPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  // Middleware performs navigation only; API routes verify the signed session.
  const hasSession = Boolean(request.cookies.get(AUTH_COOKIE)?.value);

  if ((pathname === '/login' || pathname === '/') && hasSession) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  if (isProtected(pathname) && !hasSession) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/login', '/dashboard/:path*', '/features/:path*', '/documents/:path*', '/profiles/:path*', '/accounts/:path*', '/contacts/:path*', '/leads/:path*', '/opportunities/:path*', '/pipeline/:path*', '/campaigns/:path*', '/outreach-sequences/:path*', '/activities/:path*', '/quotes-contracts/:path*', '/billing-revenue/:path*', '/recruiting-staffing/:path*', '/reports-forecasting/:path*', '/templates/:path*', '/integrations/:path*', '/custom-views/:path*'],
};
