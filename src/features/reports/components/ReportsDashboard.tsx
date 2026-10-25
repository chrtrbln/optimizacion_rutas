"use client";

import { useState } from "react";
import { getSampleOperationsForPeriod, sampleOperations } from "@/features/estimates/sample-operations";

type Period = "30" | "90" | "365";

function downloadCsv(rows: typeof sampleOperations) {
  const headers = ["Código", "Fecha", "Ruta", "Origen", "Destino", "Vehículo", "Distancia_km", "Costo_USD", "Emisiones_kg_CO2e", "Ahorro_USD", "Reducción_kg_CO2e"];
  const values = rows.map((operation) => {
    const liters = operation.distanceKm / operation.efficiencyKmPerLiter;
    const cost = liters * operation.fuelPriceUsdPerLiter;
    const emissions = liters * operation.emissionFactorKgPerLiter;
    return [operation.id, operation.date, operation.route, operation.origin, operation.destination, operation.vehicle, operation.distanceKm, cost.toFixed(2), emissions.toFixed(2), operation.fuelSavingsUsd.toFixed(2), operation.emissionsReducedKg.toFixed(2)];
  });
  const csv = [headers, ...values]
    .map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(","))
    .join("\r\n");
  const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "traza-reporte-operativo.csv";
  link.click();
  URL.revokeObjectURL(url);
}

export function ReportsDashboard() {
  const [period, setPeriod] = useState<Period>("30");
  const operations = getSampleOperationsForPeriod(Number(period));
  const totalCost = operations.reduce((total, operation) => total + (operation.distanceKm / operation.efficiencyKmPerLiter) * operation.fuelPriceUsdPerLiter, 0);
  const totalEmissions = operations.reduce((total, operation) => total + (operation.distanceKm / operation.efficiencyKmPerLiter) * operation.emissionFactorKgPerLiter, 0);
  const totalSavings = operations.reduce((total, operation) => total + operation.fuelSavingsUsd, 0);
  const totalReducedEmissions = operations.reduce((total, operation) => total + operation.emissionsReducedKg, 0);
  const maxCost = Math.max(1, ...operations.map((operation) => (operation.distanceKm / operation.efficiencyKmPerLiter) * operation.fuelPriceUsdPerLiter));

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#547262]">Módulo C5 · Desempeño operativo</p>
          <h1 className="mt-2 text-3xl font-semibold leading-tight text-[#20382f] sm:text-[34px]">Analítica y reportes</h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-[#64736b] sm:text-base">Consulta indicadores de operación y prepara un reporte para exportar.</p>
        </div>
        <span className="inline-flex min-h-8 items-center gap-2 border border-[#e1d2b7] bg-[#fff9ed] px-3 text-xs font-medium text-[#795e34]"><span className="size-1.5 rounded-full bg-[#d88651]" />Datos de ejemplo</span>
      </div>

      <div className="mt-8 flex flex-wrap items-end justify-between gap-4">
        <label className="grid gap-1 text-xs font-medium text-[#607168]">Período del informe<select className="h-10 min-w-44 rounded-md border border-[#cfd8ce] bg-white px-3 text-sm text-[#34483d]" onChange={(event) => setPeriod(event.target.value as Period)} value={period}><option value="30">Últimos 30 días</option><option value="90">Últimos 90 días</option><option value="365">Últimos 12 meses</option></select></label>
        <div className="flex flex-wrap gap-2">
          <button className="h-10 rounded-md border border-[#cfd8ce] bg-white px-4 text-sm font-medium text-[#40564a] hover:bg-[#f0f3ee] disabled:opacity-50" disabled={operations.length === 0} onClick={() => downloadCsv(operations)} type="button">Exportar CSV</button>
          <button className="h-10 rounded-md bg-[#1d5544] px-4 text-sm font-semibold text-white hover:bg-[#174536]" onClick={() => window.print()} type="button">Imprimir / guardar PDF</button>
        </div>
      </div>

      <section aria-label="Indicadores del período" className="mt-5 grid gap-px border border-[#dfe6de] bg-[#dfe6de] sm:grid-cols-2 xl:grid-cols-4">
        <div className="bg-white px-5 py-4"><p className="text-xs text-[#718076]">Viajes registrados</p><p className="mt-2 text-2xl font-semibold tabular-nums text-[#20382f]">{operations.length}</p></div>
        <div className="bg-white px-5 py-4"><p className="text-xs text-[#718076]">Gasto estimado en combustible</p><p className="mt-2 text-2xl font-semibold tabular-nums text-[#20382f]">US$ {totalCost.toFixed(2)}</p></div>
        <div className="bg-white px-5 py-4"><p className="text-xs text-[#718076]">Emisiones estimadas</p><p className="mt-2 text-2xl font-semibold tabular-nums text-[#20382f]">{totalEmissions.toFixed(1)} <span className="text-sm font-medium">kg</span></p></div>
        <div className="bg-[#eaf1e8] px-5 py-4"><p className="text-xs text-[#607564]">Ahorro de combustible estimado</p><p className="mt-2 text-2xl font-semibold tabular-nums text-[#315b3d]">US$ {totalSavings.toFixed(2)}</p><p className="mt-1 text-[10px] text-[#718076]">{totalReducedEmissions.toFixed(1)} kg CO2e reducidos · muestra</p></div>
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(280px,0.72fr)]">
        <div className="border border-[#dfe6de] bg-white">
          <div className="border-b border-[#e5ebe3] px-5 py-4"><p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#6d7e73]">Comparativo</p><h2 className="mt-1 text-sm font-semibold text-[#2d4438]">Costo estimado por operación</h2></div>
          <div className="space-y-4 p-5">
            {operations.map((operation) => {
              const cost = (operation.distanceKm / operation.efficiencyKmPerLiter) * operation.fuelPriceUsdPerLiter;
              return <div className="grid grid-cols-[minmax(120px,1fr)_minmax(80px,2fr)_72px] items-center gap-3" key={operation.id}><div className="min-w-0"><p className="truncate text-xs font-medium text-[#455b4d]">{operation.route}</p><p className="mt-0.5 text-[10px] text-[#89948d]">{operation.date}</p></div><span className="h-2 overflow-hidden bg-[#edf1eb]"><span className="block h-full bg-[#d88651]" style={{ width: `${Math.max(6, cost / maxCost * 100)}%` }} /></span><span className="text-right text-xs tabular-nums text-[#586b5e]">US$ {cost.toFixed(2)}</span></div>;
            })}
            {operations.length === 0 && <p className="py-6 text-center text-sm text-[#718076]">No hay operaciones para el período.</p>}
          </div>
        </div>

        <aside className="border border-[#dfe6de] bg-[#f8faf6] p-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#6d7e73]">Resumen del informe</p>
          <h2 className="mt-1 text-sm font-semibold text-[#2d4438]">Período seleccionado</h2>
          <p className="mt-4 text-3xl font-semibold text-[#20382f]">{operations.length} <span className="text-sm font-medium text-[#718076]">operaciones</span></p>
          <div className="mt-5 space-y-3 border-t border-[#dfe6de] pt-4 text-xs text-[#596d60]">
            <div className="flex justify-between gap-3"><span>Ahorro estimado</span><span className="font-semibold tabular-nums">US$ {totalSavings.toFixed(2)}</span></div>
            <div className="flex justify-between gap-3"><span>Emisiones evitadas</span><span className="font-semibold tabular-nums">{totalReducedEmissions.toFixed(1)} kg</span></div>
          </div>
          <p className="mt-5 text-[10px] leading-5 text-[#7b8880]">Los indicadores se calculan sobre operaciones ilustrativas; no reflejan datos de una empresa.</p>
        </aside>
      </section>

      <section className="mt-6 border border-[#dfe6de] bg-white">
        <div className="border-b border-[#e5ebe3] px-5 py-4"><p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#6d7e73]">Registro</p><h2 className="mt-1 text-sm font-semibold text-[#2d4438]">Historial operativo</h2></div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left">
            <thead className="bg-[#f5f7f3] text-[10px] uppercase tracking-[0.1em] text-[#718076]"><tr><th className="px-4 py-3">Fecha / código</th><th className="px-4 py-3">Ruta</th><th className="px-4 py-3">Unidad</th><th className="px-4 py-3 text-right">Distancia</th><th className="px-4 py-3 text-right">Costo</th><th className="px-4 py-3 text-right">CO2e</th></tr></thead>
            <tbody className="divide-y divide-[#e9eee8] text-sm text-[#43574c]">{operations.map((operation) => { const liters = operation.distanceKm / operation.efficiencyKmPerLiter; return <tr key={operation.id}><td className="px-4 py-3"><p className="font-medium">{operation.date}</p><p className="mt-0.5 text-[10px] text-[#87938b]">{operation.id}</p></td><td className="px-4 py-3"><p className="font-medium">{operation.route}</p><p className="mt-0.5 text-[10px] text-[#87938b]">{operation.origin} → {operation.destination}</p></td><td className="px-4 py-3">{operation.vehicle}</td><td className="px-4 py-3 text-right tabular-nums">{operation.distanceKm} km</td><td className="px-4 py-3 text-right tabular-nums">US$ {(liters * operation.fuelPriceUsdPerLiter).toFixed(2)}</td><td className="px-4 py-3 text-right tabular-nums">{(liters * operation.emissionFactorKgPerLiter).toFixed(1)} kg</td></tr>; })}</tbody>
          </table>
          {operations.length === 0 && <p className="px-5 py-10 text-center text-sm text-[#718076]">No hay historial en este período.</p>}
        </div>
      </section>
    </>
  );
}