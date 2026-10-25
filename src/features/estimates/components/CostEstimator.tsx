"use client";

import { useState } from "react";

const fuelPrices = [
  { fuel: "Diésel", price: 1.2, validFrom: "2026-10-01", validTo: "2026-10-15" },
  { fuel: "Gasolina regular", price: 1.15, validFrom: "2026-10-01", validTo: "2026-10-15" },
  { fuel: "Gasolina superior", price: 1.25, validFrom: "2026-10-01", validTo: "2026-10-15" },
] as const;

const demoRoutes = [
  { name: "San Salvador → Santa Ana", distanceKm: 67, efficiency: 7.2, fuel: "Diésel" },
  { name: "Santa Tecla → Sonsonate", distanceKm: 62, efficiency: 10.4, fuel: "Diésel" },
  { name: "San Salvador → Soyapango", distanceKm: 24, efficiency: 11.8, fuel: "Gasolina regular" },
] as const;

export function CostEstimator() {
  const [selectedRoute, setSelectedRoute] = useState(0);
  const route = demoRoutes[selectedRoute];
  const [distance, setDistance] = useState<number>(route.distanceKm);
  const [efficiency, setEfficiency] = useState<number>(route.efficiency);
  const [fuelType, setFuelType] = useState<string>(route.fuel);
  const [unitPrice, setUnitPrice] = useState<number>(
    fuelPrices.find((item) => item.fuel === route.fuel)!.price,
  );

  const estimatedLiters = distance > 0 && efficiency > 0 ? distance / efficiency : 0;
  const estimatedCost = estimatedLiters * unitPrice;
  const selectedFuelPrice = fuelPrices.find((item) => item.fuel === fuelType)!;

  function chooseRoute(index: number) {
    const nextRoute = demoRoutes[index];
    setSelectedRoute(index);
    setDistance(nextRoute.distanceKm);
    setEfficiency(nextRoute.efficiency);
    setFuelType(nextRoute.fuel);
    setUnitPrice(fuelPrices.find((item) => item.fuel === nextRoute.fuel)!.price);
  }

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#547262]">Módulo C3 · Estimación</p>
          <h1 className="mt-2 text-3xl font-semibold leading-tight text-[#20382f] sm:text-[34px]">Estimación de costos</h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-[#64736b] sm:text-base">Proyecta el consumo y el gasto de combustible de un recorrido.</p>
        </div>
        <span className="inline-flex min-h-8 items-center gap-2 border border-[#e1d2b7] bg-[#fff9ed] px-3 text-xs font-medium text-[#795e34]"><span className="size-1.5 rounded-full bg-[#d88651]" />Precios ilustrativos</span>
      </div>

      <div className="mt-8 grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(330px,0.75fr)]">
        <section className="border border-[#dfe6de] bg-white p-5 sm:p-7">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#6d7e73]">Parámetros del viaje</p>
            <h2 className="mt-1 text-lg font-semibold text-[#263d32]">Consumo estimado</h2>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-medium text-[#34483d] sm:col-span-2">
              Ruta de referencia
              <select className="h-11 rounded-md border border-[#cfd8ce] bg-white px-3 text-sm outline-none focus:border-[#36715c]" onChange={(event) => chooseRoute(Number(event.target.value))} value={selectedRoute}>
                {demoRoutes.map((item, index) => <option key={item.name} value={index}>{item.name}</option>)}
              </select>
            </label>
            <label className="grid gap-2 text-sm font-medium text-[#34483d]">
              Distancia estimada
              <span className="relative"><input className="h-11 w-full rounded-md border border-[#cfd8ce] bg-white px-3 pr-14 text-sm outline-none focus:border-[#36715c]" min="0.1" onChange={(event) => setDistance(Number(event.target.value))} step="0.1" type="number" value={distance} /><span className="absolute right-3 top-3 text-xs text-[#7a887e]">km</span></span>
            </label>
            <label className="grid gap-2 text-sm font-medium text-[#34483d]">
              Rendimiento del vehículo
              <span className="relative"><input className="h-11 w-full rounded-md border border-[#cfd8ce] bg-white px-3 pr-16 text-sm outline-none focus:border-[#36715c]" min="0.1" onChange={(event) => setEfficiency(Number(event.target.value))} step="0.1" type="number" value={efficiency} /><span className="absolute right-3 top-3 text-xs text-[#7a887e]">km/l</span></span>
            </label>
            <label className="grid gap-2 text-sm font-medium text-[#34483d]">
              Combustible
              <select className="h-11 rounded-md border border-[#cfd8ce] bg-white px-3 text-sm outline-none focus:border-[#36715c]" onChange={(event) => { setFuelType(event.target.value); setUnitPrice(fuelPrices.find((item) => item.fuel === event.target.value)!.price); }} value={fuelType}>
                {fuelPrices.map((item) => <option key={item.fuel}>{item.fuel}</option>)}
              </select>
            </label>
            <label className="grid gap-2 text-sm font-medium text-[#34483d]">
              Precio de referencia
              <span className="relative"><span className="absolute left-3 top-3 text-xs text-[#7a887e]">$</span><input className="h-11 w-full rounded-md border border-[#cfd8ce] bg-white px-7 pr-14 text-sm outline-none focus:border-[#36715c]" min="0" onChange={(event) => setUnitPrice(Number(event.target.value))} step="0.01" type="number" value={unitPrice} /><span className="absolute right-3 top-3 text-xs text-[#7a887e]">/ litro</span></span>
            </label>
          </div>
          <div className="mt-6 border-l-2 border-[#d88651] bg-[#faf6ef] px-4 py-3">
            <p className="text-xs font-semibold text-[#745c3f]">Referencia de precio de demostración</p>
            <p className="mt-1 text-xs leading-5 text-[#806f59]">
              {selectedFuelPrice.fuel}: US$ {selectedFuelPrice.price.toFixed(2)}/litro · período de ejemplo {selectedFuelPrice.validFrom} al {selectedFuelPrice.validTo}. No corresponde a una consulta oficial.
            </p>
          </div>
        </section>

        <section aria-label="Resultado de estimación" className="border border-[#dfe6de] bg-[#173d34] p-5 text-white sm:p-7">
          <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#b7d1ba]">Resultado preliminar</p>
          <h2 className="mt-2 text-xl font-semibold">Costo del viaje</h2>
          <p className="mt-8 text-xs font-medium text-[#b7d1ba]">Gasto estimado en combustible</p>
          <p className="mt-1 text-4xl font-semibold tabular-nums">US$ {estimatedCost.toFixed(2)}</p>
          <div className="mt-7 grid grid-cols-2 gap-3 border-t border-white/20 pt-5">
            <div><p className="text-xs text-[#b7d1ba]">Consumo estimado</p><p className="mt-1 text-lg font-semibold tabular-nums">{estimatedLiters.toFixed(1)} L</p></div>
            <div><p className="text-xs text-[#b7d1ba]">Distancia</p><p className="mt-1 text-lg font-semibold tabular-nums">{distance.toFixed(1)} km</p></div>
          </div>
          <div className="mt-6 border-t border-white/20 pt-4 text-xs leading-5 text-[#d3dfd6]">
            <p>Distancia ÷ rendimiento = litros estimados</p>
            <p>Litros estimados × precio por litro = costo</p>
          </div>
        </section>
      </div>

      <section className="mt-7 border border-[#dfe6de] bg-white">
        <div className="flex flex-wrap items-end justify-between gap-3 border-b border-[#e5ebe3] px-5 py-4">
          <div><p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#6d7e73]">Historial de referencia</p><h2 className="mt-1 text-sm font-semibold text-[#2d4438]">Precios de muestra por combustible</h2></div>
          <p className="text-xs text-[#77847c]">Los períodos se conservan como datos de ejemplo.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] text-left">
            <thead className="bg-[#f5f7f3] text-[10px] uppercase tracking-[0.1em] text-[#718076]"><tr><th className="px-5 py-3">Combustible</th><th className="px-5 py-3">Precio (USD/litro)</th><th className="px-5 py-3">Vigencia de ejemplo</th><th className="px-5 py-3">Fuente</th></tr></thead>
            <tbody className="divide-y divide-[#e9eee8] text-sm text-[#43574c]">{fuelPrices.map((item) => <tr key={item.fuel}><td className="px-5 py-3 font-medium">{item.fuel}</td><td className="px-5 py-3 tabular-nums">US$ {item.price.toFixed(2)}</td><td className="px-5 py-3 text-xs">{item.validFrom} — {item.validTo}</td><td className="px-5 py-3 text-xs text-[#78867d]">Dato ilustrativo</td></tr>)}</tbody>
          </table>
        </div>
      </section>
    </>
  );
}