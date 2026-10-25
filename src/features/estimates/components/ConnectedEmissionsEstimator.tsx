"use client";

import { useState } from "react";
import { calculateEstimate } from "@/features/estimates/calculations";
import { useCompanyOperations } from "@/features/estimates/hooks/use-company-operations";

type Period = 30 | 90 | 365;

export function ConnectedEmissionsEstimator() {
  const [period, setPeriod] = useState<Period>(30);
  const { data, error, isLoading, reload } = useCompanyOperations(period);
  const [selectedId, setSelectedId] = useState("");
  const [distanceOverride, setDistanceOverride] = useState<number | null>(null);
  const [efficiencyOverride, setEfficiencyOverride] = useState<number | null>(null);
  const [factorOverride, setFactorOverride] = useState<number | null>(null);

  if (isLoading) return <p className="border border-[#dfe6de] bg-white px-5 py-8 text-sm text-[#64736b]" role="status">Cargando cálculos de emisiones...</p>;
  if (error) return <section className="border border-[#ead7cd] bg-[#fff9f5] p-5" role="alert"><h1 className="font-semibold text-[#793f31]">No se pudieron cargar las emisiones</h1><p className="mt-2 text-sm text-[#805b50]">{error}</p><button className="mt-4 h-10 rounded-md border border-[#d9b8ab] px-4 text-sm font-semibold text-[#79483a]" onClick={reload} type="button">Reintentar</button></section>;

  const operations = data?.operations ?? [];
  const operation = operations.find((item) => item.id === selectedId) ?? operations[0];
  const distance = distanceOverride ?? operation?.distanceKm ?? 0;
  const efficiency = efficiencyOverride ?? operation?.efficiencyKmPerLiter ?? 0;
  const factor = factorOverride ?? operation?.emissionFactor ?? 0;
  const estimate = operation && efficiency > 0
    ? calculateEstimate({
        distanceKm: distance,
        efficiencyKmPerLiter: efficiency,
        fuelPriceUsdPerLiter: operation.fuelUnitPriceUsd,
        emissionFactorKgCo2ePerLiter: factor,
      })
    : null;
  const totalPeriodEmissions = operations.reduce((total, item) => total + item.emissionsKgCo2e, 0);
  const peakEmissions = Math.max(1, ...operations.map((item) => item.emissionsKgCo2e));

  function selectOperation(id: string) {
    setSelectedId(id);
    setDistanceOverride(null);
    setEfficiencyOverride(null);
    setFactorOverride(null);
  }

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div className="max-w-2xl"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#547262]">Módulo C4 · Estimación ambiental</p><h1 className="mt-2 text-3xl font-semibold leading-tight text-[#20382f] sm:text-[34px]">Cálculo de CO2e</h1><p className="mt-3 max-w-xl text-sm leading-6 text-[#64736b] sm:text-base">Consulta emisiones calculadas con los factores guardados para cada recorrido.</p></div>
        <span className="inline-flex min-h-8 items-center gap-2 border border-[#d9e2d8] bg-white px-3 text-xs font-medium text-[#526a5d]"><span className="size-1.5 rounded-full bg-[#5b8d68]" />Datos de Supabase</span>
      </div>

      <section className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(360px,1.1fr)]">
        <div className="border border-[#dfe6de] bg-white p-5 sm:p-6">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#6d7e73]">Análisis de ruta</p><h2 className="mt-1 text-lg font-semibold text-[#263d32]">Escenario comparativo</h2>
          {operation && estimate ? <>
            <label className="mt-5 grid gap-2 text-sm font-medium text-[#34483d]">Cálculo histórico
              <select className="h-11 rounded-md border border-[#cfd8ce] bg-white px-3 text-sm outline-none focus:border-[#36715c]" onChange={(event) => selectOperation(event.target.value)} value={operation.id}>
                {operations.map((item) => <option key={item.id} value={item.id}>{item.routeCode} · {item.routeName} · {item.vehiclePlate}</option>)}
              </select>
            </label>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2 text-sm font-medium text-[#34483d]">Distancia del escenario<span className="relative"><input className="h-11 w-full rounded-md border border-[#cfd8ce] px-3 pr-12 text-sm outline-none focus:border-[#36715c]" min="0.1" onChange={(event) => setDistanceOverride(Number(event.target.value))} step="0.1" type="number" value={distance} /><span className="absolute right-3 top-3 text-xs text-[#7a887e]">km</span></span></label>
              <label className="grid gap-2 text-sm font-medium text-[#34483d]">Rendimiento<span className="relative"><input className="h-11 w-full rounded-md border border-[#cfd8ce] px-3 pr-14 text-sm outline-none focus:border-[#36715c]" min="0.1" onChange={(event) => setEfficiencyOverride(Number(event.target.value))} step="0.1" type="number" value={efficiency} /><span className="absolute right-3 top-3 text-xs text-[#7a887e]">km/l</span></span></label>
              <label className="grid gap-2 text-sm font-medium text-[#34483d] sm:col-span-2">Factor de emisión (escenario)<span className="relative"><input className="h-11 w-full rounded-md border border-[#cfd8ce] px-3 pr-28 text-sm outline-none focus:border-[#36715c]" min="0" onChange={(event) => setFactorOverride(Number(event.target.value))} step="0.000001" type="number" value={factor} /><span className="absolute right-3 top-3 text-xs text-[#7a887e]">kg CO2e/L</span></span></label>
            </div>
            <div className="mt-5 border-l-2 border-[#7b9b7d] bg-[#f0f5ee] px-4 py-3"><p className="text-xs font-semibold text-[#45634c]">Factor snapshot usado</p><p className="mt-1 text-xs leading-5 text-[#637a68]">{operation.emissionFactor.toFixed(6)} kg CO2e/L · {operation.emissionFactorSource}{operation.emissionFactorVersion ? ` · ${operation.emissionFactorVersion}` : ""}. El escenario editable no altera el cálculo guardado.</p></div>
          </> : <p className="mt-5 text-sm text-[#718076]">Selecciona una operación para calcular un escenario.</p>}
        </div>

        <section aria-label="Resultado de emisiones" className="flex flex-col justify-between border border-[#dfe6de] bg-[#eaf0e7] p-5 sm:p-7">
          {estimate && operation ? <>
            <div><p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#617764]">Estimación por recorrido</p><h2 className="mt-1 text-lg font-semibold text-[#263d32]">{operation.routeName}</h2><p className="mt-7 text-4xl font-semibold tabular-nums text-[#234334]">{estimate.emissionsKgCo2e.toFixed(2)} <span className="text-lg font-medium text-[#607568]">kg CO2e</span></p></div>
            <div className="mt-8 grid grid-cols-2 gap-4 border-t border-[#d3dfd1] pt-5"><div><p className="text-xs text-[#718076]">Combustible estimado</p><p className="mt-1 text-base font-semibold text-[#30473b]">{estimate.fuelLiters.toFixed(2)} L</p></div><div><p className="text-xs text-[#718076]">Factor utilizado</p><p className="mt-1 text-base font-semibold text-[#30473b]">{factor.toFixed(6)} kg/L</p></div><p className="col-span-2 border-t border-[#d3dfd1] pt-3 text-xs text-[#66776c]">Litros estimados × factor versionado = kg CO2e estimados.</p></div>
          </> : <div><p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#617764]">Resultado</p><p className="mt-3 text-sm text-[#617764]">Aún no hay operaciones con cálculos guardados.</p></div>}
        </section>
      </section>

      <section className="mt-7 border border-[#dfe6de] bg-white">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#e5ebe3] px-5 py-4 sm:px-6"><div><p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#6d7e73]">Historial de emisiones</p><h2 className="mt-1 text-base font-semibold text-[#2d4438]">Operaciones de la empresa</h2></div><label className="grid gap-1 text-xs font-medium text-[#607168]">Período<select className="h-9 min-w-40 rounded-md border border-[#cfd8ce] bg-white px-2 text-sm text-[#34483d]" onChange={(event) => setPeriod(Number(event.target.value) as Period)} value={period}><option value={30}>Últimos 30 días</option><option value={90}>Últimos 90 días</option><option value={365}>Últimos 12 meses</option></select></label></div>
        <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[220px_1fr]">
          <div className="lg:border-r lg:border-[#e5ebe3] lg:pr-6"><p className="text-xs text-[#718076]">Total del período</p><p className="mt-2 text-3xl font-semibold tabular-nums text-[#234334]">{totalPeriodEmissions.toFixed(2)} <span className="text-sm font-medium">kg</span></p><p className="mt-2 text-xs leading-5 text-[#77847c]">{operations.length} cálculos actuales.</p></div>
          <div className="space-y-4">{operations.map((item) => <div className="grid grid-cols-[minmax(110px,1fr)_minmax(70px,2fr)_70px] items-center gap-3" key={item.id}><span className="truncate text-xs font-medium text-[#455b4d]">{item.routeName}</span><span className="h-2 overflow-hidden bg-[#edf1eb]"><span className="block h-full bg-[#719276]" style={{ width: `${Math.max(6, item.emissionsKgCo2e / peakEmissions * 100)}%` }} /></span><span className="text-right text-xs tabular-nums text-[#586b5e]">{item.emissionsKgCo2e.toFixed(1)} kg</span></div>)}{operations.length === 0 && <p className="py-8 text-center text-sm text-[#718076]">No hay cálculos de ruta en este período.</p>}</div>
        </div>
        <p className="border-t border-[#e5ebe3] px-5 py-3 text-xs leading-5 text-[#77847c] sm:px-6">Los factores se muestran con la fuente y versión guardadas en cada cálculo. Confirma su procedencia antes de presentar resultados oficiales.</p>
      </section>
    </>
  );
}