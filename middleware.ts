// Protecting routes with next-auth
// https://next-auth.js.org/configuration/nextjs#middleware
// https://nextjs.org/docs/app/building-your-application/routing/middleware

export { default } from "next-auth/middleware";
export const config = { matcher: ["/dashboard/:path*"] };

import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";

export async function middleware(req: any) {
  const token = await getToken({ req, secret: process.env.JWT_SECRET });
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/dashboard")) {
    if (!token) {
      return NextResponse.redirect(new URL('/', req.url));
    }
  }

  return NextResponse.next();
}

