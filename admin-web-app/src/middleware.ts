import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Auth gate for admin-web-app.
 * - `BYPASS_AUTH=true` skips cookie auth (local/demo) but still serves `/login`
 *   so the branded login UI can be previewed without flipping the env flag.
 * - Otherwise: unauthenticated → `/login`; non-admin → sign out + `/login?error=access_denied`
 */
export async function middleware(request: NextRequest) {
  if (process.env.BYPASS_AUTH === "true") {
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  if (!user && pathname !== "/login") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (user) {
    if (pathname === "/login") {
      return NextResponse.redirect(new URL("/", request.url));
    }

    if (user.user_metadata?.role !== "admin") {
      await supabase.auth.signOut();
      return NextResponse.redirect(new URL("/login?error=access_denied", request.url));
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
