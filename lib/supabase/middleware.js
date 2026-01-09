import { NextResponse } from "next/server";
import { supabaseServer } from "./lib/supabase/server";

export async function middleware(req) {
  const supabase = supabaseServer();
  const { data: { session } } = await supabase.auth.getSession();

  const protectedRoutes = ["/dashboard"];

  if (protectedRoutes.some(path => req.nextUrl.pathname.startsWith(path))) {
    if (!session) {
      return NextResponse.redirect(new URL("/auth/login", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"]
};
