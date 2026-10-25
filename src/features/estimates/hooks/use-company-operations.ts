"use client";

import { useEffect, useState } from "react";
import {
  loadCurrentCompanyOperations,
} from "@/features/estimates/data/current-company-operations";
import type { CompanyOperationsData } from "@/features/estimates/data/operations-query";

export function useCompanyOperations(periodDays: number | null = null) {
  const [data, setData] = useState<CompanyOperationsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadCount, setReloadCount] = useState(0);

  useEffect(() => {
    let isActive = true;
    loadCurrentCompanyOperations(periodDays)
      .then((nextData) => {
        if (isActive) setData(nextData);
      })
      .catch((loadError: unknown) => {
        if (isActive) {
          setError(loadError instanceof Error ? loadError.message : "No se pudieron cargar las operaciones.");
        }
      })
      .finally(() => {
        if (isActive) setIsLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, [periodDays, reloadCount]);

  function reload() {
    setData(null);
    setError("");
    setIsLoading(true);
    setReloadCount((current) => current + 1);
  }

  return { data, error, isLoading, reload };
}