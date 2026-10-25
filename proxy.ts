import type { NextRequest } from "next/server";
import { updateSession } from "./supabase/middleware";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: ["/login", "/dashboard/:path*"],
};