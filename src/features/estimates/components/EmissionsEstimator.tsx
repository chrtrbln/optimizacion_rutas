"use client";

import { useState } from "react";
import { getSampleOperationsForPeriod } from "@/features/estimates/sample-operations";

const illustrativeFactors = {
  Diésel: { value: 2.68, unit: "kg CO2e/litro" },
  "Gasolina regular": { value: 2.31, unit: "kg CO2e/litro" },
  "Gasolina superior": { value: 2.31, unit: "kg CO2e/litro" },
} as const;

type Period = "30" | "90" | "365";

export function EmissionsEstimator() {
  const [period, setPeriod] = useState<Period>("30");
  const [fuelType, setFuelType] = useState<keyof typeof illustrativeFactors>("Diésel");
  const [distanceKm, setDistanceKm] = useState(67);
  const [efficiency, setEfficiency] = useState(7.2);
  const [factor, setFactor] = useState<number>(illustrativeFactors.Diésel.value);

  const factorOption = illustrativeFactors[fuelType];
  const fuelLiters = distanceKm > 0 && efficiency > 0 ? distanceKm / efficiency : 0;
  const emissions = fuelLiters * factor;
  const periodOperations = getSampleOperationsForPeriod(Number(period));
  const periodEmissions = periodOperations.reduce(
    (total, operation) => total + (operation.distanceKm / operation.efficiencyKmPerLiter) * operation.emissionFactorKgPerLiter,
    0,
  );
  const peakEmissions = Math.max(
    1,
    ...periodOperations.map((operation) => (operation.distanceKm / operation.efficiencyKmPerLiter) * operation.emissionFactorKgPerLiter),
  );

  function changeFuelType(value: keyof typeof illustrativeFactors) {
    setFuelType(value);
    setFactor(illustrativeFactors[value].value);
  }

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#547262]">Módulo C4 · Estimación ambiental</p>
          <h1 className="mt-2 text-3xl font-semibold leading-tight text-[#20382f] sm:text-[34px]">Cálculo de CO2e</h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-[#64736b] sm:text-base">Explora las emisiones estimadas por recorrido y período.</p>
        </div>
        <span className="inline-flex min-h-8 items-center gap-2 border border-[#e1d2b7] bg-[#fff9ed] px-3 text-xs font-medium text-[#795e34]"><span className="size-1.5 rounded-full bg-[#d88651]" />Factores ilustrativos</span>
      </div>

      <section className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(360px,1.1fr)]">
        <div className="border border-[#dfe6de] bg-white p-5 sm:p-6">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#6d7e73]">Estimación por ruta</p>
          <h2 className="mt-1 text-lg font-semibold text-[#263d32]">Parámetros de cálculo</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-medium text-[#34483d]">
              Tipo de combustible
              <select className="h-11 rounded-md border border-[#cfd8ce] bg-white px-3 text-sm outline-none focus:border-[#36715c]" onChange={(event) => changeFuelType(event.target.value as keyof typeof illustrativeFactors)} value={fuelType}>
                {Object.keys(illustrativeFactors).map((fuel) => <option key={fuel}>{fuel}</option>)}
              </select>
            </label>
            <label className="grid gap-2 text-sm font-medium text-[#34483d]">
              Distancia de ruta
              <span className="relative"><input className="h-11 w-full rounded-md border border-[#cfd8ce] px-3 pr-12 text-sm outline-none focus:border-[#36715c]" min="0.1" onChange={(event) => setDistanceKm(Number(event.target.value))} step="0.1" type="number" value={distanceKm} /><span className="absolute right-3 top-3 text-xs text-[#7a887e]">km</span></span>
            </label>
            <label className="grid gap-2 text-sm font-medium text-[#34483d]">
              Rendimiento del vehículo
              <span className="relative"><input className="h-11 w-full rounded-md border border-[#cfd8ce] px-3 pr-14 text-sm outline-none focus:border-[#36715c]" min="0.1" onChange={(event) => setEfficiency(Number(event.target.value))} step="0.1" type="number" value={efficiency} /><span className="absolute right-3 top-3 text-xs text-[#7a887e]">km/l</span></span>
            </label>
            <label className="grid gap-2 text-sm font-medium text-[#34483d]">
              Factor de emisión editable
              <span className="relative"><input className="h-11 w-full rounded-md border border-[#cfd8ce] px-3 pr-28 text-sm outline-none focus:border-[#36715c]" min="0" onChange={(event) => setFactor(Number(event.target.value))} step="0.01" type="number" value={factor} /><span className="absolute right-3 top-3 text-xs text-[#7a887e]">kg CO2e/L</span></span>
            </label>
          </div>
          <div className="mt-5 border-l-2 border-[#7b9b7d] bg-[#f0f5ee] px-4 py-3">
            <p className="text-xs font-semibold text-[#45634c]">Factor de demostración</p>
            <p className="mt-1 text-xs leading-5 text-[#637a68]">
              Valor inicial: {factorOption.value.toFixed(2)} {factorOption.unit}. Debe reemplazarse por un factor validado con fuente, versión y vigencia antes de uso operativo.
            </p>
          </div>
        </div>

        <section aria-label="Resultado de emisiones" className="flex flex-col justify-between border border-[#dfe6de] bg-[#eaf0e7] p-5 sm:p-7">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#617764]">Resultado preliminar</p>
            <h2 className="mt-1 text-lg font-semibold text-[#263d32]">Emisiones del recorrido</h2>
            <p className="mt-7 text-4xl font-semibold tabular-nums text-[#234334]">{emissions.toFixed(1)} <span className="text-lg font-medium text-[#607568]">kg CO2e</span></p>
          </div>
          <div className="mt-8 grid grid-cols-2 gap-4 border-t border-[#d3dfd1] pt-5">
            <div><p className="text-xs text-[#718076]">Combustible estimado</p><p className="mt-1 text-base font-semibold text-[#30473b]">{fuelLiters.toFixed(1)} L</p></div>
            <div><p className="text-xs text-[#718076]">Factor utilizado</p><p className="mt-1 text-base font-semibold text-[#30473b]">{factor.toFixed(2)} kg/L</p></div>
            <p className="col-span-2 border-t border-[#d3dfd1] pt-3 text-xs text-[#66776c]">Litros estimados × factor de emisión = kg CO2e estimados</p>
          </div>
        </section>
      </section>

      <section className="mt-7 border border-[#dfe6de] bg-white">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#e5ebe3] px-5 py-4 sm:px-6">
          <div><p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#6d7e73]">Historial de demostración</p><h2 className="mt-1 text-base font-semibold text-[#2d4438]">Emisiones por operación</h2></div>
          <label className="grid gap-1 text-xs font-medium text-[#607168]">Período<select className="h-9 min-w-40 rounded-md border border-[#cfd8ce] bg-white px-2 text-sm text-[#34483d]" onChange={(event) => setPeriod(event.target.value as Period)} value={period}><option value="30">Últimos 30 días</option><option value="90">Últimos 90 días</option><option value="365">Últimos 12 meses</option></select></label>
        </div>
        <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[220px_1fr]">
          <div className="border-r-0 border-[#e5ebe3] lg:border-r lg:pr-6">
            <p className="text-xs text-[#718076]">Total de período</p>
            <p className="mt-2 text-3xl font-semibold tabular-nums text-[#234334]">{periodEmissions.toFixed(1)} <span className="text-sm font-medium">kg</span></p>
            <p className="mt-2 text-xs leading-5 text-[#77847c]">{periodOperations.length} operaciones de muestra incluidas.</p>
          </div>
          <div className="space-y-4">
            {periodOperations.map((operation) => {
              const operationEmissions = (operation.distanceKm / operation.efficiencyKmPerLiter) * operation.emissionFactorKgPerLiter;
              return <div className="grid grid-cols-[minmax(110px,1fr)_minmax(70px,2fr)_60px] items-center gap-3" key={operation.id}><span className="truncate text-xs font-medium text-[#455b4d]">{operation.route}</span><span className="h-2 overflow-hidden bg-[#edf1eb]"><span className="block h-full bg-[#719276]" style={{ width: `${Math.max(6, operationEmissions / peakEmissions * 100)}%` }} /></span><span className="text-right text-xs tabular-nums text-[#586b5e]">{operationEmissions.toFixed(1)} kg</span></div>;
            })}
            {periodOperations.length === 0 && <p className="py-8 text-center text-sm text-[#718076]">No hay operaciones de muestra para este período.</p>}
          </div>
        </div>
        <p className="border-t border-[#e5ebe3] px-5 py-3 text-xs leading-5 text-[#77847c] sm:px-6">Los factores y operaciones son ilustrativos. No representan un inventario oficial ni sustituyen factores documentados IPCC, EPA o GLEC.</p>
      </section>
    </>
  );
}