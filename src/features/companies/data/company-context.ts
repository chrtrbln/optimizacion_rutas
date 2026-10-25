import { createClient } from "../../../../supabase/client";

export type CompanyContext = {
  userId: string;
  companyId: string;
  role: "admin" | "planner" | "viewer";
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function loadCompanyContext(): Promise<CompanyContext> {
  const supabase = createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Tu sesión no está activa. Inicia sesión nuevamente.");
  }

  const { data, error } = await supabase
    .from("company_members")
    .select("company_id,role")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .maybeSingle();
  const membership: unknown = data;

  if (error) {
    throw new Error("No se pudo consultar tu empresa. Verifica las políticas RLS.");
  }

  if (
    !isRecord(membership) ||
    typeof membership.company_id !== "string" ||
    !["admin", "planner", "viewer"].includes(String(membership.role))
  ) {
    throw new Error("Tu usuario no pertenece a una empresa activa.");
  }

  return {
    userId: user.id,
    companyId: membership.company_id,
    role: membership.role as CompanyContext["role"],
  };
}