"use client";

import { useState } from "react";

const locations = [
  { id: "ss", name: "San Salvador", department: "San Salvador" },
  { id: "santa-tecla", name: "Santa Tecla", department: "La Libertad" },
  { id: "santa-ana", name: "Santa Ana", department: "Santa Ana" },
  { id: "sonsonate", name: "Sonsonate", department: "Sonsonate" },
  { id: "acajutla", name: "Acajutla", department: "Sonsonate" },
  { id: "san-miguel", name: "San Miguel", department: "San Miguel" },
  { id: "la-union", name: "La Unión", department: "La Unión" },
];

const demoVehicles = [
  { id: "p482731", label: "P 482-731 · Isuzu NPR", efficiency: "7.2 km/l" },
  { id: "p619205", label: "P 619-205 · Toyota Hiace", efficiency: "10.4 km/l" },
  { id: "p307894", label: "P 307-894 · Nissan Frontier", efficiency: "11.8 km/l" },
];

type Waypoint = { id: string; locationId: string };
type SavedDraft = {
  id: string;
  name: string;
  originId: string;
  destinationId: string;
  vehicleId: string;
  stopLocationIds: string[];
  optimizationMode: string;
};

export function RoutePlanner() {
  const [routeName, setRouteName] = useState("Ruta de abastecimiento");
  const [origin, setOrigin] = useState("ss");
  const [destination, setDestination] = useState("santa-ana");
  const [vehicleId, setVehicleId] = useState(demoVehicles[0].id);
  const [waypoints, setWaypoints] = useState<Waypoint[]>([
    { id: "waypoint-1", locationId: "santa-tecla" },
  ]);
  const [optimizationMode, setOptimizationMode] = useState("shortest_distance");
  const [draftSaved, setDraftSaved] = useState(false);
  const [savedDrafts, setSavedDrafts] = useState<SavedDraft[]>([]);

  const selectedVehicle = demoVehicles.find((vehicle) => vehicle.id === vehicleId)!;
  const orderedStops = [
    { id: "origin", kind: "Origen", locationId: origin },
    ...waypoints.map((stop, index) => ({
      id: stop.id,
      kind: `Parada ${index + 1}`,
      locationId: stop.locationId,
    })),
    { id: "destination", kind: "Destino", locationId: destination },
  ];

  function addWaypoint() {
    const nextLocation = locations.find((location) =>
      location.id !== origin &&
      location.id !== destination &&
      !waypoints.some((stop) => stop.locationId === location.id),
    );
    if (!nextLocation) return;
    setWaypoints((current) => [
      ...current,
      { id: `waypoint-${crypto.randomUUID()}`, locationId: nextLocation.id },
    ]);
    setDraftSaved(false);
  }

  function moveWaypoint(index: number, direction: -1 | 1) {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= waypoints.length) return;
    setWaypoints((current) => {
      const reordered = [...current];
      [reordered[index], reordered[targetIndex]] = [reordered[targetIndex], reordered[index]];
      return reordered;
    });
    setDraftSaved(false);
  }

  function saveDraft() {
    setSavedDrafts((current) => [
      {
        id: `draft-${crypto.randomUUID()}`,
        name: routeName.trim() || "Ruta sin nombre",
        originId: origin,
        destinationId: destination,
        vehicleId,
        stopLocationIds: waypoints.map((stop) => stop.locationId),
        optimizationMode,
      },
      ...current,
    ]);
    setDraftSaved(true);
  }

  function loadDraft(draft: SavedDraft) {
    setRouteName(draft.name);
    setOrigin(draft.originId);
    setDestination(draft.destinationId);
    setVehicleId(draft.vehicleId);
    setWaypoints(draft.stopLocationIds.map((locationId) => ({
      id: `waypoint-${crypto.randomUUID()}`,
      locationId,
    })));
    setOptimizationMode(draft.optimizationMode);
    setDraftSaved(true);
  }

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#547262]">Módulo C2 · Planificación</p>
          <h1 className="mt-2 text-3xl font-semibold leading-tight text-[#20382f] sm:text-[34px]">Optimización de rutas</h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-[#64736b] sm:text-base">
            Define el recorrido, asigna una unidad y organiza las paradas antes del cálculo.
          </p>
        </div>
        <span className="inline-flex min-h-8 items-center gap-2 border border-[#e1d2b7] bg-[#fff9ed] px-3 text-xs font-medium text-[#795e34]">
          <span className="size-1.5 rounded-full bg-[#d88651]" />
          Borrador local
        </span>
      </div>

      <div className="mt-8 grid items-start gap-6 xl:grid-cols-[minmax(0,1.08fr)_minmax(360px,0.92fr)]">
        <section className="border border-[#dfe6de] bg-white p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#6d7e73]">Nuevo plan</p>
              <h2 className="mt-1 text-lg font-semibold text-[#263d32]">Detalles del recorrido</h2>
            </div>
            <span className="border border-[#e2e9e1] bg-[#f6f8f4] px-2 py-1 font-mono text-[10px] text-[#718076]">BORRADOR</span>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-medium text-[#34483d] sm:col-span-2">
              Nombre de la ruta
              <input className="h-11 rounded-md border border-[#cfd8ce] px-3 text-sm outline-none focus:border-[#36715c]" onChange={(event) => { setRouteName(event.target.value); setDraftSaved(false); }} value={routeName} />
            </label>
            <label className="grid gap-2 text-sm font-medium text-[#34483d]">
              Origen
              <select className="h-11 rounded-md border border-[#cfd8ce] bg-white px-3 text-sm outline-none focus:border-[#36715c]" onChange={(event) => { setOrigin(event.target.value); setDraftSaved(false); }} value={origin}>
                {locations.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}
              </select>
            </label>
            <label className="grid gap-2 text-sm font-medium text-[#34483d]">
              Destino
              <select className="h-11 rounded-md border border-[#cfd8ce] bg-white px-3 text-sm outline-none focus:border-[#36715c]" onChange={(event) => { setDestination(event.target.value); setDraftSaved(false); }} value={destination}>
                {locations.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}
              </select>
            </label>
            <label className="grid gap-2 text-sm font-medium text-[#34483d]">
              Vehículo asignado
              <select className="h-11 rounded-md border border-[#cfd8ce] bg-white px-3 text-sm outline-none focus:border-[#36715c]" onChange={(event) => { setVehicleId(event.target.value); setDraftSaved(false); }} value={vehicleId}>
                {demoVehicles.map((vehicle) => <option key={vehicle.id} value={vehicle.id}>{vehicle.label}</option>)}
              </select>
            </label>
            <label className="grid gap-2 text-sm font-medium text-[#34483d]">
              Criterio de optimización
              <select className="h-11 rounded-md border border-[#cfd8ce] bg-white px-3 text-sm outline-none focus:border-[#36715c]" onChange={(event) => { setOptimizationMode(event.target.value); setDraftSaved(false); }} value={optimizationMode}>
                <option value="shortest_distance">Menor distancia</option>
                <option value="shortest_time">Menor duración</option>
              </select>
            </label>
          </div>

          <div className="mt-7 flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-[#2f463a]">Paradas ordenadas</h3>
            <button className="min-h-9 rounded border border-[#cfded2] px-3 text-xs font-semibold text-[#28634e] hover:bg-[#f0f5ef] disabled:cursor-not-allowed disabled:opacity-40" disabled={waypoints.length >= locations.length - 2} onClick={addWaypoint} type="button">
              + Agregar parada
            </button>
          </div>
          <ol className="mt-4 space-y-2">
            {orderedStops.map((stop, index) => {
              const location = locations.find((item) => item.id === stop.locationId)!;
              const isWaypoint = index > 0 && index < orderedStops.length - 1;
              const waypointIndex = isWaypoint ? index - 1 : -1;
              return (
                <li className="flex min-h-[58px] items-center gap-3 border border-[#e5ebe3] bg-[#fbfcf9] px-3" key={stop.id}>
                  <span className={`grid size-7 shrink-0 place-items-center rounded-full text-xs font-semibold ${index === 0 ? "bg-[#dcebe0] text-[#2d6547]" : index === orderedStops.length - 1 ? "bg-[#f6e4d9] text-[#965734]" : "bg-[#edf0eb] text-[#586960]"}`}>
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#77847c]">{stop.kind}</p>
                    <p className="truncate text-sm font-medium text-[#30473b]">{location.name} <span className="font-normal text-[#88948d]">· {location.department}</span></p>
                  </div>
                  {isWaypoint && (
                    <div className="flex shrink-0 gap-1">
                      <button aria-label={`Mover ${location.name} arriba`} className="grid size-8 place-items-center rounded border border-[#dce4dc] text-[#52675b] hover:bg-[#edf2ec] disabled:opacity-40" disabled={waypointIndex === 0} onClick={() => moveWaypoint(waypointIndex, -1)} type="button">↑</button>
                      <button aria-label={`Mover ${location.name} abajo`} className="grid size-8 place-items-center rounded border border-[#dce4dc] text-[#52675b] hover:bg-[#edf2ec] disabled:opacity-40" disabled={waypointIndex === waypoints.length - 1} onClick={() => moveWaypoint(waypointIndex, 1)} type="button">↓</button>
                      <button aria-label={`Quitar ${location.name}`} className="grid size-8 place-items-center rounded border border-[#e9d8d1] text-[#9a5944] hover:bg-[#fbf0eb]" onClick={() => { setWaypoints((current) => current.filter((item) => item.id !== stop.id)); setDraftSaved(false); }} type="button">×</button>
                    </div>
                  )}
                </li>
              );
            })}
          </ol>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-[#e5ebe3] pt-5">
            <p aria-live="polite" className="text-xs text-[#63756a]">
              {draftSaved ? "Borrador guardado en esta sesión." : "Los cambios se guardan solo en esta vista previa."}
            </p>
            <button className="h-10 rounded-md bg-[#1d5544] px-4 text-sm font-semibold text-white hover:bg-[#174536]" onClick={saveDraft} type="button">Guardar borrador</button>
          </div>
        </section>

        <div className="space-y-5">
          <section aria-label="Vista esquemática del recorrido" className="overflow-hidden border border-[#dfe6de] bg-[#eef2e9]">
            <div className="flex items-center justify-between border-b border-[#d9e1d5] bg-white px-4 py-3">
              <div>
                <h2 className="text-sm font-semibold text-[#2e473a]">Vista del recorrido</h2>
                <p className="mt-0.5 text-[10px] uppercase tracking-[0.12em] text-[#77847c]">Esquema · no a escala</p>
              </div>
              <span className="border border-[#e1e7df] px-2 py-1 text-[10px] text-[#6f7f74]">Sin mapa conectado</span>
            </div>
            <div className="relative min-h-[350px] overflow-hidden p-6 sm:p-8">
              <div aria-hidden="true" className="absolute inset-0 opacity-60 [background-image:linear-gradient(#d8e2d5_1px,transparent_1px),linear-gradient(90deg,#d8e2d5_1px,transparent_1px)] [background-size:28px_28px]" />
              <div className="relative mx-auto flex min-h-[285px] max-w-[300px] flex-col items-center justify-center">
                {orderedStops.map((stop, index) => {
                  const location = locations.find((item) => item.id === stop.locationId)!;
                  return (
                    <div className="flex w-full flex-1 flex-col items-center" key={stop.id}>
                      {index > 0 && <span aria-hidden="true" className="min-h-6 flex-1 border-l border-dashed border-[#8fa998]" />}
                      <div className="flex w-full items-center gap-3 border border-[#dce4dc] bg-white/95 px-3 py-2 shadow-sm">
                        <span className={`grid size-7 shrink-0 place-items-center rounded-full text-[10px] font-bold ${index === 0 ? "bg-[#dcebe0] text-[#2d6547]" : index === orderedStops.length - 1 ? "bg-[#f6e4d9] text-[#965734]" : "bg-[#e9eee7] text-[#596c60]"}`}>{index + 1}</span>
                        <div className="min-w-0"><p className="text-[9px] uppercase tracking-[0.12em] text-[#7c8980]">{stop.kind}</p><p className="truncate text-xs font-semibold text-[#30473b]">{location.name}</p></div>
                      </div>
                      {index < orderedStops.length - 1 && <span aria-hidden="true" className="min-h-6 flex-1 border-l border-dashed border-[#8fa998]" />}
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          <section className="border border-[#dfe6de] bg-white p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-[#6d7e73]">Unidad asignada</p>
                <h2 className="mt-1 text-sm font-semibold text-[#2d4438]">{selectedVehicle.label}</h2>
              </div>
              <span className="bg-[#e5f0e7] px-2 py-1 text-[10px] font-medium text-[#42684b]">{selectedVehicle.efficiency}</span>
            </div>
            <p className="mt-4 border-t border-[#e7ece5] pt-3 text-xs leading-5 text-[#728077]">
              El cálculo de distancia, duración y orden optimizado se habilitará al integrar un proveedor de mapas y el motor de ruteo.
            </p>
            <p className="mt-2 text-xs font-medium text-[#526b5c]">
              Criterio seleccionado: {optimizationMode === "shortest_distance" ? "menor distancia" : "menor duración"}
            </p>
          </section>
        </div>
      </div>

      {savedDrafts.length > 0 && (
        <section aria-label="Borradores guardados en esta sesión" className="mt-6 border border-[#dfe6de] bg-white">
          <div className="border-b border-[#e5ebe3] px-5 py-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#6d7e73]">Esta sesión</p>
            <h2 className="mt-1 text-sm font-semibold text-[#2d4438]">Borradores recientes</h2>
          </div>
          <ul className="divide-y divide-[#e9eee8]">
            {savedDrafts.map((draft) => {
              const draftOrigin = locations.find((location) => location.id === draft.originId)!;
              const draftDestination = locations.find((location) => location.id === draft.destinationId)!;
              return (
                <li className="flex flex-wrap items-center justify-between gap-3 px-5 py-3" key={draft.id}>
                  <div>
                    <p className="text-sm font-medium text-[#30473b]">{draft.name}</p>
                    <p className="mt-1 text-xs text-[#77847c]">{draftOrigin.name} → {draftDestination.name} · {draft.stopLocationIds.length} paradas intermedias</p>
                  </div>
                  <button className="min-h-9 rounded border border-[#cfded2] px-3 text-xs font-semibold text-[#28634e] hover:bg-[#f0f5ef]" onClick={() => loadDraft(draft)} type="button">Cargar borrador</button>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </>
  );
}