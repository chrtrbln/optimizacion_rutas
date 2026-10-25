"use client";

import { useState } from "react";
import { useCompanyOperations } from "@/features/estimates/hooks/use-company-operations";
import { downloadOperationsCsv } from "@/features/reports/export-csv";

type Period = 30 | 90 | 365;

export function ConnectedReportsDashboard() {
  const [period, setPeriod] = useState<Period>(30);
  const { data, error, isLoading, reload } = useCompanyOperations(period);

  if (isLoading) return <p className="border border-[#dfe6de] bg-white px-5 py-8 text-sm text-[#64736b]" role="status">Cargando reportes de tu empresa...</p>;
  if (error) return <section className="border border-[#ead7cd] bg-[#fff9f5] p-5" role="alert"><h1 className="font-semibold text-[#793f31]">No se pudo cargar el informe</h1><p className="mt-2 text-sm text-[#805b50]">{error}</p><button className="mt-4 h-10 rounded-md border border-[#d9b8ab] px-4 text-sm font-semibold text-[#79483a]" onClick={reload} type="button">Reintentar</button></section>;

  const operations = data?.operations ?? [];
  const totalDistance = operations.reduce((total, operation) => total + operation.distanceKm, 0);
  const totalFuel = operations.reduce((total, operation) => total + operation.fuelLiters, 0);
  const totalCost = operations.reduce((total, operation) => total + operation.fuelCostUsd, 0);
  const totalEmissions = operations.reduce((total, operation) => total + operation.emissionsKgCo2e, 0);
  const maxCost = Math.max(1, ...operations.map((operation) => operation.fuelCostUsd));

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div className="max-w-2xl"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#547262]">Módulo C5 · Desempeño operativo</p><h1 className="mt-2 text-3xl font-semibold leading-tight text-[#20382f] sm:text-[34px]">Analítica y reportes</h1><p className="mt-3 max-w-xl text-sm leading-6 text-[#64736b] sm:text-base">Indicadores derivados de los cálculos guardados para tu empresa.</p></div>
        <span className="inline-flex min-h-8 items-center gap-2 border border-[#d9e2d8] bg-white px-3 text-xs font-medium text-[#526a5d]"><span className="size-1.5 rounded-full bg-[#5b8d68]" />Datos de Supabase</span>
      </div>

      <div className="mt-8 flex flex-wrap items-end justify-between gap-4">
        <label className="grid gap-1 text-xs font-medium text-[#607168]">Período del informe<select className="h-10 min-w-44 rounded-md border border-[#cfd8ce] bg-white px-3 text-sm text-[#34483d]" onChange={(event) => setPeriod(Number(event.target.value) as Period)} value={period}><option value={30}>Últimos 30 días</option><option value={90}>Últimos 90 días</option><option value={365}>Últimos 12 meses</option></select></label>
        <div className="flex flex-wrap gap-2"><button className="h-10 rounded-md border border-[#cfd8ce] bg-white px-4 text-sm font-medium text-[#40564a] hover:bg-[#f0f3ee] disabled:opacity-50" disabled={operations.length === 0} onClick={() => downloadOperationsCsv(operations)} type="button">Exportar CSV</button><button className="h-10 rounded-md bg-[#1d5544] px-4 text-sm font-semibold text-white hover:bg-[#174536]" onClick={() => window.print()} type="button">Imprimir / guardar PDF</button></div>
      </div>

      <section aria-label="Indicadores del período" className="mt-5 grid gap-px border border-[#dfe6de] bg-[#dfe6de] sm:grid-cols-2 xl:grid-cols-4">
        <div className="bg-white px-5 py-4"><p className="text-xs text-[#718076]">Cálculos de ruta</p><p className="mt-2 text-2xl font-semibold tabular-nums text-[#20382f]">{operations.length}</p></div>
        <div className="bg-white px-5 py-4"><p className="text-xs text-[#718076]">Distancia calculada</p><p className="mt-2 text-2xl font-semibold tabular-nums text-[#20382f]">{totalDistance.toFixed(1)} <span className="text-sm font-medium">km</span></p></div>
        <div className="bg-white px-5 py-4"><p className="text-xs text-[#718076]">Combustible estimado</p><p className="mt-2 text-2xl font-semibold tabular-nums text-[#20382f]">{totalFuel.toFixed(1)} <span className="text-sm font-medium">L</span></p></div>
        <div className="bg-[#eaf1e8] px-5 py-4"><p className="text-xs text-[#607564]">Costo / emisiones</p><p className="mt-2 text-lg font-semibold tabular-nums text-[#315b3d]">US$ {totalCost.toFixed(2)}</p><p className="mt-1 text-xs tabular-nums text-[#607564]">{totalEmissions.toFixed(2)} kg CO2e</p></div>
      </section>

      {operations.length === 0 ? (
        <section className="mt-6 border border-[#dfe6de] bg-white px-5 py-10 text-center"><h2 className="text-base font-semibold text-[#30473b]">No hay cálculos en el período seleccionado</h2><p className="mt-2 text-sm text-[#718076]">Calcula una ruta desde C2 para que aparezca en tus reportes.</p></section>
      ) : (
        <>
          <section className="mt-6 border border-[#dfe6de] bg-white">
            <div className="border-b border-[#e5ebe3] px-5 py-4"><p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#6d7e73]">Comparativo</p><h2 className="mt-1 text-sm font-semibold text-[#2d4438]">Costo guardado por cálculo</h2></div>
            <div className="space-y-4 p-5">{operations.map((operation) => <div className="grid grid-cols-[minmax(120px,1fr)_minmax(80px,2fr)_90px] items-center gap-3" key={operation.id}><div className="min-w-0"><p className="truncate text-xs font-medium text-[#455b4d]">{operation.routeName}</p><p className="mt-0.5 text-[10px] text-[#89948d]">{operation.calculatedAt.slice(0, 10)}</p></div><span className="h-2 overflow-hidden bg-[#edf1eb]"><span className="block h-full bg-[#d88651]" style={{ width: `${Math.max(6, operation.fuelCostUsd / maxCost * 100)}%` }} /></span><span className="text-right text-xs tabular-nums text-[#586b5e]">US$ {operation.fuelCostUsd.toFixed(2)}</span></div>)}</div>
          </section>
          <section className="mt-6 border border-[#dfe6de] bg-white">
            <div className="border-b border-[#e5ebe3] px-5 py-4"><p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#6d7e73]">Registro</p><h2 className="mt-1 text-sm font-semibold text-[#2d4438]">Historial de cálculos</h2></div>
            <div className="overflow-x-auto"><table className="w-full min-w-[950px] text-left"><thead className="bg-[#f5f7f3] text-[10px] uppercase tracking-[0.1em] text-[#718076]"><tr><th className="px-4 py-3">Fecha / ruta</th><th className="px-4 py-3">Unidad</th><th className="px-4 py-3 text-right">Distancia</th><th className="px-4 py-3 text-right">Consumo</th><th className="px-4 py-3 text-right">Costo</th><th className="px-4 py-3 text-right">CO2e</th><th className="px-4 py-3">Fuente factor</th></tr></thead><tbody className="divide-y divide-[#e9eee8] text-sm text-[#43574c]">{operations.map((operation) => <tr key={operation.id}><td className="px-4 py-3"><p className="font-medium">{operation.routeName}</p><p className="mt-0.5 text-[10px] text-[#87938b]">{operation.routeCode} · {operation.calculatedAt.slice(0, 10)}</p></td><td className="px-4 py-3">{operation.vehiclePlate}</td><td className="px-4 py-3 text-right tabular-nums">{operation.distanceKm.toFixed(1)} km</td><td className="px-4 py-3 text-right tabular-nums">{operation.fuelLiters.toFixed(2)} L</td><td className="px-4 py-3 text-right tabular-nums">US$ {operation.fuelCostUsd.toFixed(2)}</td><td className="px-4 py-3 text-right tabular-nums">{operation.emissionsKgCo2e.toFixed(2)} kg</td><td className="px-4 py-3 text-xs">{operation.emissionFactorSource}{operation.emissionFactorVersion ? ` · ${operation.emissionFactorVersion}` : ""}</td></tr>)}</tbody></table></div>
          </section>
        </>
      )}
    </>
  );
}