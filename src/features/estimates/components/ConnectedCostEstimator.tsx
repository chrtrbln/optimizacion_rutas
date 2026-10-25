"use client";

import { useState } from "react";
import { calculateEstimate } from "@/features/estimates/calculations";
import { useCompanyOperations } from "@/features/estimates/hooks/use-company-operations";

export function ConnectedCostEstimator() {
  const { data, error, isLoading, reload } = useCompanyOperations();
  const [selectedId, setSelectedId] = useState("");
  const [distanceOverride, setDistanceOverride] = useState<number | null>(null);
  const [efficiencyOverride, setEfficiencyOverride] = useState<number | null>(null);
  const [priceOverride, setPriceOverride] = useState<number | null>(null);

  if (isLoading) {
    return <p className="border border-[#dfe6de] bg-white px-5 py-8 text-sm text-[#64736b]" role="status">Cargando rutas y precios de combustible...</p>;
  }
  if (error) {
    return <section className="border border-[#ead7cd] bg-[#fff9f5] p-5" role="alert"><h1 className="font-semibold text-[#793f31]">No se pudieron cargar los datos de costos</h1><p className="mt-2 text-sm text-[#805b50]">{error}</p><button className="mt-4 h-10 rounded-md border border-[#d9b8ab] px-4 text-sm font-semibold text-[#79483a]" onClick={reload} type="button">Reintentar</button></section>;
  }

  const operations = data?.operations ?? [];
  const prices = data?.fuelPrices ?? [];
  const operation = operations.find((item) => item.id === selectedId) ?? operations[0];
  const distance = distanceOverride ?? operation?.distanceKm ?? 0;
  const efficiency = efficiencyOverride ?? operation?.efficiencyKmPerLiter ?? 0;
  const fuelPrice = priceOverride ?? operation?.fuelUnitPriceUsd ?? 0;
  const estimate = operation && efficiency > 0
    ? calculateEstimate({
        distanceKm: distance,
        efficiencyKmPerLiter: efficiency,
        fuelPriceUsdPerLiter: fuelPrice,
        emissionFactorKgCo2ePerLiter: operation.emissionFactor,
      })
    : null;
  const operationPrice = operation ? prices.find((price) => price.id === operation.fuelPriceId) : undefined;

  function selectOperation(id: string) {
    setSelectedId(id);
    setDistanceOverride(null);
    setEfficiencyOverride(null);
    setPriceOverride(null);
  }

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#547262]">Módulo C3 · Estimación</p>
          <h1 className="mt-2 text-3xl font-semibold leading-tight text-[#20382f] sm:text-[34px]">Estimación de costos</h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-[#64736b] sm:text-base">Consulta costos guardados y simula escenarios para rutas de tu empresa.</p>
        </div>
        <span className="inline-flex min-h-8 items-center gap-2 border border-[#d9e2d8] bg-white px-3 text-xs font-medium text-[#526a5d]"><span className="size-1.5 rounded-full bg-[#5b8d68]" />Datos de Supabase</span>
      </div>

      {operations.length === 0 ? (
        <section className="mt-8 border border-[#dfe6de] bg-white px-5 py-10 text-center">
          <h2 className="text-base font-semibold text-[#30473b]">Aún no hay cálculos de ruta</h2>
          <p className="mt-2 text-sm text-[#718076]">Calcula una ruta en C2 para ver su consumo, precio de combustible y costo guardados.</p>
          {prices.length === 0 && <p className="mt-2 text-xs text-[#89958e]">Agrega precios vigentes en la tabla fuel_prices para habilitar costos reales.</p>}
        </section>
      ) : operation && estimate ? (
        <>
          <section className="mt-8 grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(330px,0.75fr)]">
            <div className="border border-[#dfe6de] bg-white p-5 sm:p-7">
              <div><p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#6d7e73]">Escenario de ruta</p><h2 className="mt-1 text-lg font-semibold text-[#263d32]">{operation.routeName}</h2><p className="mt-1 text-xs text-[#77847c]">{operation.routeCode} · {operation.vehiclePlate} · {operation.calculatedAt.slice(0, 10)}</p></div>
              <label className="mt-5 grid gap-2 text-sm font-medium text-[#34483d]">Cálculo guardado
                <select className="h-11 rounded-md border border-[#cfd8ce] bg-white px-3 text-sm outline-none focus:border-[#36715c]" onChange={(event) => selectOperation(event.target.value)} value={operation.id}>
                  {operations.map((item) => <option key={item.id} value={item.id}>{item.routeCode} · {item.routeName} · {item.vehiclePlate}</option>)}
                </select>
              </label>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <label className="grid gap-2 text-sm font-medium text-[#34483d]">Distancia del escenario
                  <span className="relative"><input className="h-11 w-full rounded-md border border-[#cfd8ce] px-3 pr-12 text-sm outline-none focus:border-[#36715c]" min="0.1" onChange={(event) => setDistanceOverride(Number(event.target.value))} step="0.1" type="number" value={distance} /><span className="absolute right-3 top-3 text-xs text-[#7a887e]">km</span></span>
                </label>
                <label className="grid gap-2 text-sm font-medium text-[#34483d]">Rendimiento de la unidad
                  <span className="relative"><input className="h-11 w-full rounded-md border border-[#cfd8ce] px-3 pr-14 text-sm outline-none focus:border-[#36715c]" min="0.1" onChange={(event) => setEfficiencyOverride(Number(event.target.value))} step="0.1" type="number" value={efficiency} /><span className="absolute right-3 top-3 text-xs text-[#7a887e]">km/l</span></span>
                </label>
                <label className="grid gap-2 text-sm font-medium text-[#34483d] sm:col-span-2">Precio de combustible (escenario)
                  <span className="relative"><span className="absolute left-3 top-3 text-xs text-[#7a887e]">$</span><input className="h-11 w-full rounded-md border border-[#cfd8ce] px-7 pr-20 text-sm outline-none focus:border-[#36715c]" min="0" onChange={(event) => setPriceOverride(Number(event.target.value))} step="0.0001" type="number" value={fuelPrice} /><span className="absolute right-3 top-3 text-xs text-[#7a887e]">USD/litro</span></span>
                </label>
              </div>
              <p className="mt-5 border-l-2 border-[#d88651] bg-[#faf6ef] px-4 py-3 text-xs leading-5 text-[#806f59]">
                El escenario no modifica el cálculo histórico. Precio guardado: US$ {operation.fuelUnitPriceUsd.toFixed(4)}/L ({operation.fuelPriceSource}).
              </p>
            </div>

            <section aria-label="Resultado del escenario" className="border border-[#dfe6de] bg-[#173d34] p-5 text-white sm:p-7">
              <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#b7d1ba]">Estimación del escenario</p>
              <h2 className="mt-2 text-xl font-semibold">Costo de combustible</h2>
              <p className="mt-8 text-xs font-medium text-[#b7d1ba]">Costo proyectado</p>
              <p className="mt-1 text-4xl font-semibold tabular-nums">US$ {estimate.fuelCostUsd.toFixed(2)}</p>
              <div className="mt-7 grid grid-cols-2 gap-3 border-t border-white/20 pt-5">
                <div><p className="text-xs text-[#b7d1ba]">Consumo</p><p className="mt-1 text-lg font-semibold tabular-nums">{estimate.fuelLiters.toFixed(2)} L</p></div>
                <div><p className="text-xs text-[#b7d1ba]">Combustible</p><p className="mt-1 text-sm font-semibold">{operation.fuelType.replaceAll("_", " ")}</p></div>
              </div>
              <div className="mt-6 border-t border-white/20 pt-4 text-xs leading-5 text-[#d3dfd6]">Distancia ÷ km/l = litros · litros × USD/litro = costo</div>
            </section>
          </section>

          <section className="mt-7 border border-[#dfe6de] bg-white">
            <div className="flex flex-wrap items-end justify-between gap-3 border-b border-[#e5ebe3] px-5 py-4"><div><p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#6d7e73]">Historial inmutable</p><h2 className="mt-1 text-sm font-semibold text-[#2d4438]">Precios utilizados en cálculos</h2></div><p className="text-xs text-[#77847c]">Los valores conservan fuente y vigencia.</p></div>
            <div className="overflow-x-auto"><table className="w-full min-w-[650px] text-left"><thead className="bg-[#f5f7f3] text-[10px] uppercase tracking-[0.1em] text-[#718076]"><tr><th className="px-5 py-3">Combustible</th><th className="px-5 py-3">USD/litro</th><th className="px-5 py-3">Vigencia</th><th className="px-5 py-3">Fuente</th><th className="px-5 py-3">Usado en ruta</th></tr></thead><tbody className="divide-y divide-[#e9eee8] text-sm text-[#43574c]">{prices.map((price) => <tr key={price.id}><td className="px-5 py-3">{price.fuelType.replaceAll("_", " ")}</td><td className="px-5 py-3 tabular-nums">US$ {price.pricePerLiter.toFixed(4)}</td><td className="px-5 py-3 text-xs">{price.validFrom.slice(0, 10)} – {price.validTo?.slice(0, 10) ?? "Vigente"}</td><td className="px-5 py-3 text-xs">{price.sourceName}</td><td className="px-5 py-3">{price.id === operationPrice?.id ? "Sí" : ""}</td></tr>)}</tbody></table></div>
          </section>
        </>
      ) : null}
    </>
  );
}