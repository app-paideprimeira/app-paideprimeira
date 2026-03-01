import { NextResponse } from "next/server";

export async function middleware(req) {
  const { pathname } = req.nextUrl;

  // Bloqueia /admin fora de localhost
  if (pathname.startsWith("/admin")) {
    const host = req.headers.get("host") || "";
    const isLocal =
      host.startsWith("localhost") ||
      host.startsWith("127.0.0.1");

    if (!isLocal) {
      return new NextResponse(null, { status: 404 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};