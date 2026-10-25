import { createClient } from "../../../../supabase/client";
import { loadCompanyContext } from "@/features/companies/data/company-context";
import { loadCompanyOperationsData } from "@/features/estimates/data/operations-query";

export async function loadCurrentCompanyOperations(periodDays: number | null = null) {
  const context = await loadCompanyContext();
  return loadCompanyOperationsData(createClient(), context.companyId, periodDays);
}