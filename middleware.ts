import { getToken } from "next-auth/jwt";
import { NextResponse, type NextRequest } from "next/server";

export const config = { matcher: ["/dashboard/:path*"] };

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.JWT_SECRET });

  if (req.nextUrl.pathname.startsWith("/dashboard") && !token) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  const res = NextResponse.next();

  // Asegura header Origin cuando un proxy lo elimina; requerido por Server Actions
  if (!req.headers.get("origin")) {
    const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
    const proto = req.headers.get("x-forwarded-proto") || "https";
    if (host) {
      res.headers.set("origin", `${proto}://${host}`);
    }
  }

  return res;
}
