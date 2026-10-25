import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { getSupabaseConfig } from "./config";

export const updateSession = async (request: NextRequest) => {
  const { url, publishableKey } = getSupabaseConfig();
  let supabaseResponse = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    url,
    publishableKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser()
  const pathname = request.nextUrl.pathname
  const shouldGoToLogin = !user && pathname.startsWith("/dashboard")
  const shouldGoToDashboard = Boolean(user) && pathname === "/login"

  if (shouldGoToLogin || shouldGoToDashboard) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = shouldGoToLogin ? "/login" : "/dashboard"
    redirectUrl.search = ""
    const redirectResponse = NextResponse.redirect(redirectUrl)
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie)
    })
    return redirectResponse
  }

  return supabaseResponse
};