"use client";

import { useEffect, useState, type FormEvent } from "react";
import type { OptimizedRoute } from "@/lib/routing/osrm";
import {
  loadRoutePlannerData,
  type RoutePlannerData,
} from "@/features/routes/data/route-planner-data";

type Waypoint = { id: string; locationId: string };
type SavedDraft = {
  id: string;
  name: string;
  originId: string;
  destinationId: string;
  vehicleId: string;
  stopLocationIds: string[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseRouteResult(value: unknown, expectedStopIds: string[]): OptimizedRoute | null {
  if (!isRecord(value)) return null;
  if (
    typeof value.distanceMeters !== "number" ||
    !Number.isFinite(value.distanceMeters) ||
    value.distanceMeters < 0 ||
    typeof value.durationSeconds !== "number" ||
    !Number.isFinite(value.durationSeconds) ||
    value.durationSeconds < 0 ||
    !Array.isArray(value.geometry) ||
    !Array.isArray(value.orderedStopIds) ||
    !Array.isArray(value.snappedPoints)
  ) {
    return null;
  }

  const geometry: OptimizedRoute["geometry"] = [];
  for (const coordinate of value.geometry) {
    if (
      !Array.isArray(coordinate) ||
      coordinate.length < 2 ||
      typeof coordinate[0] !== "number" ||
      !Number.isFinite(coordinate[0]) ||
      typeof coordinate[1] !== "number" ||
      !Number.isFinite(coordinate[1])
    ) {
      return null;
    }
    geometry.push([coordinate[0], coordinate[1]]);
  }

  const orderedStopIds = value.orderedStopIds;
  if (
    orderedStopIds.length !== expectedStopIds.length ||
    orderedStopIds.some((id) => typeof id !== "string" || !expectedStopIds.includes(id)) ||
    new Set(orderedStopIds).size !== expectedStopIds.length ||
    orderedStopIds[0] !== expectedStopIds[0] ||
    orderedStopIds.at(-1) !== expectedStopIds.at(-1)
  ) {
    return null;
  }

  const snappedPoints: OptimizedRoute["snappedPoints"] = [];
  for (const point of value.snappedPoints) {
    if (
      !isRecord(point) ||
      typeof point.id !== "string" ||
      typeof point.name !== "string" ||
      typeof point.distanceMeters !== "number" ||
      !Number.isFinite(point.distanceMeters) ||
      !Array.isArray(point.coordinate) ||
      typeof point.coordinate[0] !== "number" ||
      typeof point.coordinate[1] !== "number"
    ) {
      return null;
    }
    snappedPoints.push({
      id: point.id,
      name: point.name,
      distanceMeters: point.distanceMeters,
      coordinate: [point.coordinate[0], point.coordinate[1]],
    });
  }

  if (geometry.length < 2 || snappedPoints.length !== expectedStopIds.length) return null;

  return {
    distanceMeters: value.distanceMeters,
    durationSeconds: value.durationSeconds,
    geometry,
    orderedStopIds,
    snappedPoints,
  };
}

function RouteGeometry({ route }: { route: OptimizedRoute }) {
  const width = 760;
  const height = 330;
  const padding = 30;
  const longitudes = route.geometry.map(([longitude]) => longitude);
  const latitudes = route.geometry.map(([, latitude]) => latitude);
  const minLongitude = Math.min(...longitudes);
  const maxLongitude = Math.max(...longitudes);
  const minLatitude = Math.min(...latitudes);
  const maxLatitude = Math.max(...latitudes);
  const longitudeRange = maxLongitude - minLongitude || 0.001;
  const latitudeRange = maxLatitude - minLatitude || 0.001;
  const scale = Math.min(
    (width - padding * 2) / longitudeRange,
    (height - padding * 2) / latitudeRange,
  );
  const usedWidth = longitudeRange * scale;
  const usedHeight = latitudeRange * scale;
  const left = (width - usedWidth) / 2;
  const top = (height - usedHeight) / 2;
  const project = ([longitude, latitude]: [number, number]) => [
    left + (longitude - minLongitude) * scale,
    height - top - (latitude - minLatitude) * scale,
  ];
  const sampleStep = Math.max(1, Math.ceil(route.geometry.length / 2500));
  const displayGeometry = route.geometry.filter(
    (_, index) => index % sampleStep === 0 || index === route.geometry.length - 1,
  );
  const pathPoints = displayGeometry.map((point) => project(point).join(",")).join(" ");
  const orderedSnaps = route.orderedStopIds.flatMap((id, index) => {
    const point = route.snappedPoints.find((snap) => snap.id === id);
    return point ? [{ ...point, number: index + 1, point: project(point.coordinate) }] : [];
  });

  return (
    <svg
      aria-label="Geometría del recorrido calculada por OSRM"
      className="block h-auto w-full"
      role="img"
      viewBox={`0 0 ${width} ${height}`}
    >
      <defs>
        <pattern height="24" id="route-grid" patternUnits="userSpaceOnUse" width="24">
          <path d="M 24 0 L 0 0 0 24" fill="none" stroke="#dfe8dc" strokeWidth="1" />
        </pattern>
      </defs>
      <rect fill="#f1f5ee" height={height} width={width} />
      <rect fill="url(#route-grid)" height={height} width={width} />
      <polyline
        fill="none"
        points={pathPoints}
        stroke="#1d654d"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="5"
        vectorEffect="non-scaling-stroke"
      />
      {orderedSnaps.map((snap) => (
        <g key={snap.id}>
          <circle cx={snap.point[0]} cy={snap.point[1]} fill="#fff" r="10" stroke="#1d654d" strokeWidth="3" />
          <text
            dominantBaseline="central"
            fill="#1d4f3d"
            fontSize="9"
            fontWeight="700"
            textAnchor="middle"
            x={snap.point[0]}
            y={snap.point[1]}
          >
            {snap.number}
          </text>
        </g>
      ))}
    </svg>
  );
}

export function RouteOptimizer() {
  const [plannerData, setPlannerData] = useState<RoutePlannerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [reloadCount, setReloadCount] = useState(0);
  const [loadError, setLoadError] = useState("");
  const [routeName, setRouteName] = useState("Nueva ruta");
  const [originId, setOriginId] = useState("");
  const [destinationId, setDestinationId] = useState("");
  const [vehicleId, setVehicleId] = useState("");
  const [waypoints, setWaypoints] = useState<Waypoint[]>([]);
  const [routeResult, setRouteResult] = useState<OptimizedRoute | null>(null);
  const [savedRouteCode, setSavedRouteCode] = useState("");
  const [routeError, setRouteError] = useState("");
  const [calculating, setCalculating] = useState(false);
  const [savedDraft, setSavedDraft] = useState(false);
  const [savedDrafts, setSavedDrafts] = useState<SavedDraft[]>([]);

  useEffect(() => {
    let isActive = true;

    loadRoutePlannerData()
      .then((data) => {
        if (!isActive) return;
        setPlannerData(data);
        setOriginId((current) => data.locations.some((location) => location.id === current)
          ? current
          : data.locations[0]?.id ?? "");
        setDestinationId((current) => data.locations.some((location) => location.id === current)
          ? current
          : data.locations[1]?.id ?? data.locations[0]?.id ?? "");
        setVehicleId((current) => data.vehicles.some((vehicle) => vehicle.id === current)
          ? current
          : data.vehicles[0]?.id ?? "");
      })
      .catch((error: unknown) => {
        if (!isActive) return;
        setPlannerData(null);
        setLoadError(error instanceof Error ? error.message : "No se pudieron cargar los datos de la empresa.");
      })
      .finally(() => {
        if (isActive) setLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, [reloadCount]);

  const locations = plannerData?.locations ?? [];
  const vehicles = plannerData?.vehicles ?? [];
  const selectedVehicle = vehicles.find((vehicle) => vehicle.id === vehicleId);
  const orderedStops = [
    { id: "origin", kind: "Origen", locationId: originId },
    ...waypoints.map((stop, index) => ({ id: stop.id, kind: `Parada ${index + 1}`, locationId: stop.locationId })),
    { id: "destination", kind: "Destino", locationId: destinationId },
  ];

  function clearCalculation() {
    setRouteResult(null);
    setSavedRouteCode("");
    setRouteError("");
    setSavedDraft(false);
  }

  function addWaypoint() {
    const location = locations.find((candidate) =>
      candidate.id !== originId &&
      candidate.id !== destinationId &&
      !waypoints.some((stop) => stop.locationId === candidate.id),
    );
    if (!location) return;

    setWaypoints((current) => [...current, {
      id: `waypoint-${crypto.randomUUID()}`,
      locationId: location.id,
    }]);
    clearCalculation();
  }

  function updateWaypoint(index: number, locationId: string) {
    setWaypoints((current) => current.map((stop, stopIndex) =>
      stopIndex === index ? { ...stop, locationId } : stop,
    ));
    clearCalculation();
  }

  function moveWaypoint(index: number, direction: -1 | 1) {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= waypoints.length) return;
    setWaypoints((current) => {
      const reordered = [...current];
      [reordered[index], reordered[targetIndex]] = [reordered[targetIndex], reordered[index]];
      return reordered;
    });
    clearCalculation();
  }

  function removeWaypoint(id: string) {
    setWaypoints((current) => current.filter((stop) => stop.id !== id));
    clearCalculation();
  }

  function saveDraft() {
    setSavedDrafts((current) => [{
      id: `draft-${crypto.randomUUID()}`,
      name: routeName.trim() || "Ruta sin nombre",
      originId,
      destinationId,
      vehicleId,
      stopLocationIds: waypoints.map((stop) => stop.locationId),
    }, ...current]);
    setSavedDraft(true);
  }

  function loadDraft(draft: SavedDraft) {
    setRouteName(draft.name);
    setOriginId(draft.originId);
    setDestinationId(draft.destinationId);
    setVehicleId(draft.vehicleId);
    setWaypoints(draft.stopLocationIds.map((locationId) => ({
      id: `waypoint-${crypto.randomUUID()}`,
      locationId,
    })));
    setRouteResult(null);
    setSavedRouteCode("");
    setRouteError("");
    setSavedDraft(true);
  }

  async function calculateRoute(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!plannerData || !selectedVehicle || !originId || !destinationId) return;

    const stops = orderedStops.map((stop) => ({
      ...stop,
      location: locations.find((location) => location.id === stop.locationId),
    }));
    if (stops.some((stop) => !stop.location)) {
      setRouteError("Verifica que todos los puntos seleccionados sigan activos en la empresa.");
      return;
    }

    setCalculating(true);
    setRouteError("");
    setRouteResult(null);

    try {
      const response = await fetch("/api/routing/trip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          routeName,
          vehicleId,
          stops: stops.map((stop) => ({ id: stop.id, locationId: stop.locationId })),
        }),
      });
      let body: unknown;
      try {
        body = await response.json();
      } catch {
        throw new Error("El servicio de rutas devolvió una respuesta inválida.");
      }

      if (!response.ok) {
        const message = isRecord(body) && typeof body.error === "string"
          ? body.error
          : "No se pudo calcular el recorrido.";
        throw new Error(message);
      }

      const route = parseRouteResult(body, stops.map((stop) => stop.id));
      if (!route) throw new Error("La respuesta del servicio de rutas no tiene un formato válido.");
      if (!isRecord(body) || typeof body.routeCode !== "string") {
        throw new Error("El recorrido se calculó pero no se recibió su código guardado.");
      }

      const waypointsById = new Map(waypoints.map((waypoint) => [waypoint.id, waypoint]));
      const optimizedWaypoints = route.orderedStopIds
        .slice(1, -1)
        .map((id) => waypointsById.get(id));
      if (optimizedWaypoints.some((waypoint) => waypoint === undefined)) {
        throw new Error("El servicio de rutas devolvió un orden de paradas inesperado.");
      }

      setWaypoints(optimizedWaypoints as Waypoint[]);
      setRouteResult(route);
      setSavedRouteCode(body.routeCode);
      setSavedDraft(false);
    } catch (error) {
      setRouteError(error instanceof Error ? error.message : "No se pudo calcular el recorrido.");
    } finally {
      setCalculating(false);
    }
  }

  const availableWaypointLocations = locations.filter((location) =>
    location.id !== originId &&
    location.id !== destinationId &&
    !waypoints.some((stop) => stop.locationId === location.id),
  );
  const fuelEstimate = routeResult && selectedVehicle
    ? routeResult.distanceMeters / 1000 / selectedVehicle.efficiencyKmPerLiter
    : null;
  const canCalculate = !loading && !loadError && Boolean(
    locations.length >= 2 && selectedVehicle && originId && destinationId,
  );

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#547262]">Módulo C2 · Planificación</p>
          <h1 className="mt-2 text-3xl font-semibold leading-tight text-[#20382f] sm:text-[34px]">Optimización de rutas</h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-[#64736b] sm:text-base">
            Selecciona ubicaciones de tu empresa y calcula un recorrido vial con OSRM.
          </p>
        </div>
        <span className="inline-flex min-h-8 items-center gap-2 border border-[#d9e2d8] bg-white px-3 text-xs font-medium text-[#526a5d]">
          <span className={`size-1.5 rounded-full ${loading ? "bg-[#d88651]" : loadError ? "bg-[#aa5540]" : "bg-[#5b8d68]"}`} />
          {loading ? "Cargando empresa" : loadError ? "Datos no disponibles" : "Datos de Supabase"}
        </span>
      </div>

      {loading && (
        <div aria-live="polite" className="mt-8 border border-[#dfe6de] bg-white px-5 py-8 text-sm text-[#64736b]" role="status">
          Cargando ubicaciones y vehículos de tu empresa...
        </div>
      )}

      {!loading && loadError && (
        <section className="mt-8 border border-[#ead7cd] bg-[#fff9f5] p-5" role="alert">
          <h2 className="font-semibold text-[#793f31]">No se pudieron cargar los datos</h2>
          <p className="mt-2 text-sm leading-6 text-[#805b50]">{loadError}</p>
          <button className="mt-4 h-10 rounded-md border border-[#d9b8ab] px-4 text-sm font-semibold text-[#79483a] hover:bg-[#fff1ea]" onClick={() => { setLoading(true); setLoadError(""); setReloadCount((current) => current + 1); }} type="button">
            Reintentar
          </button>
        </section>
      )}

      {!loading && !loadError && locations.length === 0 && (
        <div className="mt-8 border border-[#dfe6de] bg-white px-5 py-10 text-center">
          <h2 className="text-base font-semibold text-[#30473b]">Tu empresa todavía no tiene ubicaciones activas</h2>
          <p className="mt-2 text-sm text-[#718076]">Agrega al menos dos ubicaciones desde el módulo de ubicaciones para comenzar.</p>
        </div>
      )}

      {!loading && !loadError && locations.length > 0 && vehicles.length === 0 && (
        <div className="mt-8 border border-[#eadfca] bg-[#fffaf0] px-5 py-4 text-sm leading-6 text-[#765e38]">
          No hay vehículos disponibles para asignar. Activa una unidad en Gestión de flotas para continuar.
        </div>
      )}

      {!loading && !loadError && locations.length > 0 && (
        <div className="mt-8 grid items-start gap-6 xl:grid-cols-[minmax(0,1.08fr)_minmax(360px,0.92fr)]">
          <form className="border border-[#dfe6de] bg-white p-5 sm:p-6" onSubmit={calculateRoute}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#6d7e73]">Nuevo plan</p>
                <h2 className="mt-1 text-lg font-semibold text-[#263d32]">Detalles del recorrido</h2>
              </div>
              <span className="border border-[#e2e9e1] bg-[#f6f8f4] px-2 py-1 font-mono text-[10px] text-[#718076]">OSRM · driving</span>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2 text-sm font-medium text-[#34483d] sm:col-span-2">
                Nombre de la ruta
                <input className="h-11 rounded-md border border-[#cfd8ce] px-3 text-sm outline-none focus:border-[#36715c]" onChange={(event) => { setRouteName(event.target.value); setSavedDraft(false); }} value={routeName} />
              </label>
              <label className="grid gap-2 text-sm font-medium text-[#34483d]">
                Origen
                <select className="h-11 rounded-md border border-[#cfd8ce] bg-white px-3 text-sm outline-none focus:border-[#36715c]" onChange={(event) => { setOriginId(event.target.value); clearCalculation(); }} required value={originId}>
                  {locations.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}
                </select>
              </label>
              <label className="grid gap-2 text-sm font-medium text-[#34483d]">
                Destino
                <select className="h-11 rounded-md border border-[#cfd8ce] bg-white px-3 text-sm outline-none focus:border-[#36715c]" onChange={(event) => { setDestinationId(event.target.value); clearCalculation(); }} required value={destinationId}>
                  {locations.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}
                </select>
              </label>
              <label className="grid gap-2 text-sm font-medium text-[#34483d] sm:col-span-2">
                Vehículo asignado
                <select className="h-11 rounded-md border border-[#cfd8ce] bg-white px-3 text-sm outline-none focus:border-[#36715c]" onChange={(event) => { setVehicleId(event.target.value); clearCalculation(); }} required value={vehicleId}>
                  {vehicles.map((vehicle) => <option key={vehicle.id} value={vehicle.id}>{vehicle.plateNumber} · {vehicle.description} · {vehicle.efficiencyKmPerLiter.toFixed(1)} km/l</option>)}
                </select>
              </label>
            </div>

            <div className="mt-7 flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-[#2f463a]">Orden de visita</h3>
              <button className="min-h-9 rounded border border-[#cfded2] px-3 text-xs font-semibold text-[#28634e] hover:bg-[#f0f5ef] disabled:cursor-not-allowed disabled:opacity-40" disabled={availableWaypointLocations.length === 0 || waypoints.length >= 10} onClick={addWaypoint} type="button">
                + Agregar parada
              </button>
            </div>
            <ol className="mt-4 space-y-2">
              {orderedStops.map((stop, index) => {
                const location = locations.find((item) => item.id === stop.locationId);
                const isWaypoint = index > 0 && index < orderedStops.length - 1;
                const waypointIndex = index - 1;
                return (
                  <li className="flex min-h-[58px] items-center gap-3 border border-[#e5ebe3] bg-[#fbfcf9] px-3 py-2" key={stop.id}>
                    <span className={`grid size-7 shrink-0 place-items-center rounded-full text-xs font-semibold ${index === 0 ? "bg-[#dcebe0] text-[#2d6547]" : index === orderedStops.length - 1 ? "bg-[#f6e4d9] text-[#965734]" : "bg-[#edf0eb] text-[#586960]"}`}>
                      {index + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#77847c]">{stop.kind}</p>
                      {isWaypoint ? (
                        <select aria-label={`Ubicación de parada ${waypointIndex + 1}`} className="mt-1 h-8 w-full max-w-sm rounded border border-[#d8e1d7] bg-white px-2 text-xs text-[#30473b] outline-none focus:border-[#36715c]" onChange={(event) => updateWaypoint(waypointIndex, event.target.value)} value={stop.locationId}>
                          {locations.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}
                        </select>
                      ) : (
                        <p className="truncate text-sm font-medium text-[#30473b]">{location?.name ?? "Ubicación no disponible"}<span className="font-normal text-[#88948d]">{location?.department ? ` · ${location.department}` : ""}</span></p>
                      )}
                    </div>
                    {isWaypoint && (
                      <div className="flex shrink-0 gap-1">
                        <button aria-label={`Mover parada ${waypointIndex + 1} arriba`} className="grid size-8 place-items-center rounded border border-[#dce4dc] text-[#52675b] hover:bg-[#edf2ec] disabled:opacity-40" disabled={waypointIndex === 0} onClick={() => moveWaypoint(waypointIndex, -1)} type="button">↑</button>
                        <button aria-label={`Mover parada ${waypointIndex + 1} abajo`} className="grid size-8 place-items-center rounded border border-[#dce4dc] text-[#52675b] hover:bg-[#edf2ec] disabled:opacity-40" disabled={waypointIndex === waypoints.length - 1} onClick={() => moveWaypoint(waypointIndex, 1)} type="button">↓</button>
                        <button aria-label={`Quitar parada ${waypointIndex + 1}`} className="grid size-8 place-items-center rounded border border-[#e9d8d1] text-[#9a5944] hover:bg-[#fbf0eb]" onClick={() => removeWaypoint(stop.id)} type="button">×</button>
                      </div>
                    )}
                  </li>
                );
              })}
            </ol>

            <div className="mt-6 space-y-3 border-t border-[#e5ebe3] pt-5">
              {routeError && <p aria-live="polite" className="text-sm text-[#a34e36]" role="alert">{routeError}</p>}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p aria-live="polite" className="text-xs text-[#63756a]">
                  {savedDraft ? "Borrador guardado en esta sesión." : "El orden se optimiza con OSRM al calcular."}
                </p>
                <div className="flex gap-2">
                  <button className="h-10 rounded-md border border-[#cfd8ce] px-3 text-xs font-semibold text-[#40564a] hover:bg-[#f0f3ee] disabled:opacity-40" disabled={!originId || !destinationId || !vehicleId} onClick={saveDraft} type="button">Guardar borrador</button>
                  <button className="h-10 rounded-md bg-[#1d5544] px-4 text-sm font-semibold text-white hover:bg-[#174536] disabled:cursor-not-allowed disabled:opacity-50" disabled={!canCalculate || calculating} type="submit">{calculating ? "Calculando..." : "Optimizar ruta"}</button>
                </div>
              </div>
              <p className="text-[10px] leading-5 text-[#7b8880]">OSRM recomienda el orden de las paradas intermedias; la ruta no garantiza ser la distancia global mínima ni implementa Dijkstra/A*.</p>
            </div>
          </form>

          <div className="space-y-5">
            <section aria-label="Vista de ruta calculada" className="overflow-hidden border border-[#dfe6de] bg-[#eef2e9]">
              <div className="flex items-center justify-between gap-3 border-b border-[#d9e1d5] bg-white px-4 py-3">
                <div>
                  <h2 className="text-sm font-semibold text-[#2e473a]">Geometría del recorrido</h2>
                  <p className="mt-0.5 text-[10px] uppercase tracking-[0.12em] text-[#77847c]">OSRM · vista esquemática</p>
                </div>
                <span className="border border-[#e1e7df] px-2 py-1 text-[10px] text-[#6f7f74]">Sin mapa base</span>
              </div>
              {routeResult ? (
                <div className="p-2 sm:p-4"><RouteGeometry route={routeResult} /></div>
              ) : (
                <div className="grid min-h-[260px] place-items-center px-6 text-center sm:min-h-[330px]">
                  <div><p className="text-sm font-medium text-[#52665a]">La geometría aparecerá aquí</p><p className="mt-2 max-w-xs text-xs leading-5 text-[#77847c]">Selecciona ubicaciones de la empresa y calcula para consultar el recorrido vial.</p></div>
                </div>
              )}
            </section>

            {routeResult && selectedVehicle && (
              <section aria-label="Resumen de ruta" className="border border-[#dfe6de] bg-[#173d34] p-5 text-white">
                <div className="flex flex-wrap items-end justify-between gap-4">
                  <div><p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#b7d1ba]">{savedRouteCode || "Resumen OSRM"}</p><p className="mt-1 text-3xl font-semibold tabular-nums">{(routeResult.distanceMeters / 1000).toFixed(1)} <span className="text-sm font-medium text-[#c9d8ce]">km</span></p></div>
                  <div className="text-right"><p className="text-xs text-[#b7d1ba]">Duración estimada</p><p className="mt-1 text-lg font-semibold tabular-nums">{Math.floor(routeResult.durationSeconds / 60)} min</p></div>
                </div>
                <div className="mt-5 grid grid-cols-2 gap-4 border-t border-white/20 pt-4">
                  <div><p className="text-xs text-[#b7d1ba]">Combustible estimado</p><p className="mt-1 text-base font-semibold tabular-nums">{fuelEstimate?.toFixed(1)} L</p></div>
                  <div><p className="text-xs text-[#b7d1ba]">Unidad</p><p className="mt-1 truncate text-sm font-semibold">{selectedVehicle.plateNumber}</p></div>
                </div>
                {routeResult.snappedPoints.some((point) => point.distanceMeters > 150) && (
                  <p className="mt-4 border-t border-white/20 pt-3 text-xs leading-5 text-[#f0d6a5]">Una o más ubicaciones se ajustaron a una vía a más de 150 m del punto guardado. Revisa su ubicación.</p>
                )}
              </section>
            )}
          </div>
        </div>
      )}

      {savedDrafts.length > 0 && (
        <section aria-label="Borradores de esta sesión" className="mt-6 border border-[#dfe6de] bg-white">
          <div className="border-b border-[#e5ebe3] px-5 py-4"><p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#6d7e73]">Esta sesión</p><h2 className="mt-1 text-sm font-semibold text-[#2d4438]">Borradores recientes</h2></div>
          <ul className="divide-y divide-[#e9eee8]">
            {savedDrafts.map((draft) => {
              const origin = locations.find((location) => location.id === draft.originId)?.name ?? "Origen";
              const destination = locations.find((location) => location.id === draft.destinationId)?.name ?? "Destino";
              return <li className="flex flex-wrap items-center justify-between gap-3 px-5 py-3" key={draft.id}><div><p className="text-sm font-medium text-[#30473b]">{draft.name}</p><p className="mt-1 text-xs text-[#77847c]">{origin} → {destination} · {draft.stopLocationIds.length} paradas</p></div><button className="min-h-9 rounded border border-[#cfded2] px-3 text-xs font-semibold text-[#28634e] hover:bg-[#f0f5ef]" onClick={() => loadDraft(draft)} type="button">Cargar borrador</button></li>;
            })}
          </ul>
        </section>
      )}
    </>
  );
}