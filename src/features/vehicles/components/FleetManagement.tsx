"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { demoProfiles, demoVehicles } from "@/features/vehicles/demo-data";
import type {
  CompanyProfile,
  CompanyRole,
  FleetVehicle,
  FuelType,
  VehicleStatus,
  VehicleType,
} from "@/features/vehicles/types";

type FleetTab = "vehicles" | "people";
type VehicleDraft = Omit<FleetVehicle, "id">;

const vehicleTypes: VehicleType[] = ["Camión", "Pickup", "Van"];
const fuelTypes: FuelType[] = ["Diésel", "Gasolina regular", "Gasolina superior"];
const vehicleStatuses: VehicleStatus[] = [
  "Disponible",
  "Asignado",
  "Mantenimiento",
  "Inactivo",
];
const companyRoles: CompanyRole[] = ["Administrador", "Planificador", "Consulta"];

const emptyVehicle: VehicleDraft = {
  plateNumber: "",
  internalCode: "",
  makeModel: "",
  modelYear: new Date().getFullYear(),
  vehicleType: "Camión",
  fuelType: "Diésel",
  fuelEfficiencyKmPerLiter: 1,
  status: "Disponible",
};

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="grid gap-2 text-sm font-medium text-[#34483d]">
      {label}
      {children}
    </label>
  );
}

const inputClassName =
  "h-11 w-full rounded-md border border-[#cfd8ce] bg-white px-3 text-sm text-[#20382f] outline-none focus:border-[#36715c] focus:ring-2 focus:ring-[#36715c]/15";

function VehicleDialog({
  vehicle,
  vehicles,
  onClose,
  onSave,
}: {
  vehicle: FleetVehicle | null;
  vehicles: FleetVehicle[];
  onClose: () => void;
  onSave: (vehicle: FleetVehicle) => void;
}) {
  const [draft, setDraft] = useState<VehicleDraft>(
    vehicle
      ? {
          plateNumber: vehicle.plateNumber,
          internalCode: vehicle.internalCode,
          makeModel: vehicle.makeModel,
          modelYear: vehicle.modelYear,
          vehicleType: vehicle.vehicleType,
          fuelType: vehicle.fuelType,
          fuelEfficiencyKmPerLiter: vehicle.fuelEfficiencyKmPerLiter,
          status: vehicle.status,
        }
      : emptyVehicle,
  );
  const [errorMessage, setErrorMessage] = useState("");

  function updateDraft<Key extends keyof VehicleDraft>(key: Key, value: VehicleDraft[Key]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedPlate = draft.plateNumber.trim().toLocaleUpperCase("es-SV");
    const duplicatePlate = vehicles.some(
      (current) =>
        current.id !== vehicle?.id &&
        current.plateNumber.toLocaleUpperCase("es-SV") === normalizedPlate,
    );

    if (duplicatePlate) {
      setErrorMessage("Ya existe una unidad con esta placa en la flota.");
      return;
    }

    onSave({
      ...draft,
      id: vehicle?.id ?? `vehicle-${crypto.randomUUID()}`,
      plateNumber: normalizedPlate,
      internalCode: draft.internalCode.trim(),
      makeModel: draft.makeModel.trim(),
    });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#14271f]/45 p-0 sm:items-center sm:p-5">
      <section
        aria-labelledby="vehicle-dialog-title"
        aria-modal="true"
        className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-t-lg bg-[#fbfcf9] p-5 shadow-2xl sm:rounded-lg sm:p-7"
        role="dialog"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#587465]">
              Flota de la empresa
            </p>
            <h2 className="mt-1 text-xl font-semibold text-[#20382f]" id="vehicle-dialog-title">
              {vehicle ? "Editar unidad" : "Agregar unidad"}
            </h2>
          </div>
          <button
            aria-label="Cerrar formulario"
            className="grid size-9 place-items-center rounded border border-[#d8e0d6] text-lg text-[#50635a] hover:bg-[#edf1eb]"
            onClick={onClose}
            type="button"
          >
            ×
          </button>
        </div>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Placa">
              <input
                autoFocus
                className={inputClassName}
                onChange={(event) => updateDraft("plateNumber", event.target.value)}
                placeholder="P 000-000"
                required
                value={draft.plateNumber}
              />
            </Field>
            <Field label="Código interno">
              <input
                className={inputClassName}
                onChange={(event) => updateDraft("internalCode", event.target.value)}
                placeholder="Ej. TR-01"
                value={draft.internalCode}
              />
            </Field>
            <Field label="Marca y modelo">
              <input
                className={inputClassName}
                onChange={(event) => updateDraft("makeModel", event.target.value)}
                placeholder="Ej. Isuzu NPR"
                required
                value={draft.makeModel}
              />
            </Field>
            <Field label="Año del modelo">
              <input
                className={inputClassName}
                max={new Date().getFullYear() + 1}
                min="1980"
                onChange={(event) => updateDraft("modelYear", Number(event.target.value))}
                required
                type="number"
                value={draft.modelYear}
              />
            </Field>
            <Field label="Tipo de unidad">
              <select
                className={inputClassName}
                onChange={(event) => updateDraft("vehicleType", event.target.value as VehicleType)}
                value={draft.vehicleType}
              >
                {vehicleTypes.map((type) => <option key={type}>{type}</option>)}
              </select>
            </Field>
            <Field label="Tipo de combustible">
              <select
                className={inputClassName}
                onChange={(event) => updateDraft("fuelType", event.target.value as FuelType)}
                value={draft.fuelType}
              >
                {fuelTypes.map((type) => <option key={type}>{type}</option>)}
              </select>
            </Field>
            <Field label="Rendimiento (km/litro)">
              <input
                className={inputClassName}
                min="0.1"
                onChange={(event) => updateDraft("fuelEfficiencyKmPerLiter", Number(event.target.value))}
                required
                step="0.1"
                type="number"
                value={draft.fuelEfficiencyKmPerLiter}
              />
            </Field>
            <Field label="Estado de la unidad">
              <select
                className={inputClassName}
                onChange={(event) => updateDraft("status", event.target.value as VehicleStatus)}
                value={draft.status}
              >
                {vehicleStatuses.map((status) => <option key={status}>{status}</option>)}
              </select>
            </Field>
          </div>
          {errorMessage && (
            <p aria-live="polite" className="text-sm text-[#a34e36]">
              {errorMessage}
            </p>
          )}
          <div className="flex justify-end gap-3 border-t border-[#e2e8df] pt-4">
            <button
              className="h-10 rounded-md border border-[#cfd8ce] px-4 text-sm font-medium text-[#40564a] hover:bg-[#f0f3ee]"
              onClick={onClose}
              type="button"
            >
              Cancelar
            </button>
            <button className="h-10 rounded-md bg-[#1d5544] px-4 text-sm font-semibold text-white hover:bg-[#174536]" type="submit">
              Guardar unidad
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

function ProfileDialog({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (profile: CompanyProfile) => void;
}) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<CompanyRole>("Planificador");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSave({
      id: `profile-${crypto.randomUUID()}`,
      fullName: fullName.trim(),
      email: email.trim().toLocaleLowerCase("es-SV"),
      role,
      isActive: true,
    });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#14271f]/45 p-0 sm:items-center sm:p-5">
      <section
        aria-labelledby="profile-dialog-title"
        aria-modal="true"
        className="w-full max-w-lg rounded-t-lg bg-[#fbfcf9] p-5 shadow-2xl sm:rounded-lg sm:p-7"
        role="dialog"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#587465]">
              Acceso a la empresa
            </p>
            <h2 className="mt-1 text-xl font-semibold text-[#20382f]" id="profile-dialog-title">
              Agregar perfil
            </h2>
          </div>
          <button
            aria-label="Cerrar formulario"
            className="grid size-9 place-items-center rounded border border-[#d8e0d6] text-lg text-[#50635a] hover:bg-[#edf1eb]"
            onClick={onClose}
            type="button"
          >
            ×
          </button>
        </div>
        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <Field label="Nombre completo">
            <input className={inputClassName} onChange={(event) => setFullName(event.target.value)} required value={fullName} />
          </Field>
          <Field label="Correo electrónico">
            <input className={inputClassName} onChange={(event) => setEmail(event.target.value)} required type="email" value={email} />
          </Field>
          <Field label="Rol en la empresa">
            <select className={inputClassName} onChange={(event) => setRole(event.target.value as CompanyRole)} value={role}>
              {companyRoles.map((companyRole) => <option key={companyRole}>{companyRole}</option>)}
            </select>
          </Field>
          <p className="text-xs leading-5 text-[#738178]">
            El perfil se agrega solo a esta vista previa. No se enviará una invitación.
          </p>
          <div className="flex justify-end gap-3 border-t border-[#e2e8df] pt-4">
            <button className="h-10 rounded-md border border-[#cfd8ce] px-4 text-sm font-medium text-[#40564a] hover:bg-[#f0f3ee]" onClick={onClose} type="button">
              Cancelar
            </button>
            <button className="h-10 rounded-md bg-[#1d5544] px-4 text-sm font-semibold text-white hover:bg-[#174536]" type="submit">
              Agregar perfil
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

function StatusBadge({ status }: { status: VehicleStatus }) {
  const colorClassName =
    status === "Disponible"
      ? "bg-[#e4f1e7] text-[#315f3d]"
      : status === "Asignado"
        ? "bg-[#e7eef3] text-[#425e70]"
        : status === "Mantenimiento"
          ? "bg-[#fbefdf] text-[#8a5c22]"
          : "bg-[#eceeeb] text-[#647068]";

  return (
    <span className={`inline-flex min-h-7 items-center rounded px-2.5 text-xs font-medium ${colorClassName}`}>
      {status}
    </span>
  );
}

export function FleetManagement() {
  const [vehicles, setVehicles] = useState(demoVehicles);
  const [profiles, setProfiles] = useState(demoProfiles);
  const [activeTab, setActiveTab] = useState<FleetTab>("vehicles");
  const [search, setSearch] = useState("");
  const [vehicleStatus, setVehicleStatus] = useState("Todos los estados");
  const [vehicleDialog, setVehicleDialog] = useState<FleetVehicle | "new" | null>(null);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);

  const filteredVehicles = vehicles.filter((vehicle) => {
    const query = search.trim().toLocaleLowerCase("es-SV");
    const matchesSearch =
      !query ||
      [vehicle.plateNumber, vehicle.internalCode, vehicle.makeModel, vehicle.vehicleType]
        .some((value) => value.toLocaleLowerCase("es-SV").includes(query));
    const matchesStatus = vehicleStatus === "Todos los estados" || vehicle.status === vehicleStatus;
    return matchesSearch && matchesStatus;
  });

  const activeVehicles = vehicles.filter((vehicle) => vehicle.status !== "Inactivo").length;
  const activeProfiles = profiles.filter((profile) => profile.isActive).length;
  const averageEfficiency = vehicles.length
    ? vehicles.reduce((total, vehicle) => total + vehicle.fuelEfficiencyKmPerLiter, 0) / vehicles.length
    : 0;

  function saveVehicle(vehicle: FleetVehicle) {
    setVehicles((current) => {
      const exists = current.some((item) => item.id === vehicle.id);
      return exists
        ? current.map((item) => item.id === vehicle.id ? vehicle : item)
        : [vehicle, ...current];
    });
  }

  function updateProfileRole(profileId: string, role: CompanyRole) {
    setProfiles((current) => current.map((profile) =>
      profile.id === profileId ? { ...profile, role } : profile,
    ));
  }

  function toggleProfile(profileId: string) {
    setProfiles((current) => current.map((profile) =>
      profile.id === profileId ? { ...profile, isActive: !profile.isActive } : profile,
    ));
  }

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#547262]">
            Módulo C1 · Administración de empresa
          </p>
          <h1 className="mt-2 text-3xl font-semibold leading-tight text-[#20382f] sm:text-[34px]">
            Gestión de flotas
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-[#64736b] sm:text-base">
            Administra las unidades, su rendimiento y quién tiene acceso al espacio de trabajo.
          </p>
        </div>
        <span className="inline-flex min-h-8 items-center gap-2 border border-[#e1d2b7] bg-[#fff9ed] px-3 text-xs font-medium text-[#795e34]">
          <span className="size-1.5 rounded-full bg-[#d88651]" />
          Vista previa · datos de ejemplo
        </span>
      </div>

      <section aria-label="Resumen de flota" className="mt-8 grid gap-px border border-[#dfe6de] bg-[#dfe6de] sm:grid-cols-3">
        <div className="bg-white px-5 py-4">
          <p className="text-xs font-medium text-[#718076]">Unidades registradas</p>
          <p className="mt-2 text-2xl font-semibold text-[#20382f]">{vehicles.length}</p>
        </div>
        <div className="bg-white px-5 py-4">
          <p className="text-xs font-medium text-[#718076]">Unidades operativas</p>
          <p className="mt-2 text-2xl font-semibold text-[#20382f]">{activeVehicles}</p>
        </div>
        <div className="bg-white px-5 py-4">
          <p className="text-xs font-medium text-[#718076]">Rendimiento promedio</p>
          <p className="mt-2 text-2xl font-semibold text-[#20382f]">
            {averageEfficiency.toFixed(1)} <span className="text-sm font-medium text-[#718076]">km/litro</span>
          </p>
        </div>
      </section>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-b border-[#dce4dc]">
        <div aria-label="Secciones de gestión" className="flex gap-6" role="tablist">
          <button
            aria-selected={activeTab === "vehicles"}
            className={`min-h-11 border-b-2 px-1 text-sm font-medium ${activeTab === "vehicles" ? "border-[#1d5544] text-[#1d5544]" : "border-transparent text-[#728078] hover:text-[#34483d]"}`}
            onClick={() => setActiveTab("vehicles")}
            role="tab"
            type="button"
          >
            Vehículos <span className="ml-1 text-xs">{vehicles.length}</span>
          </button>
          <button
            aria-selected={activeTab === "people"}
            className={`min-h-11 border-b-2 px-1 text-sm font-medium ${activeTab === "people" ? "border-[#1d5544] text-[#1d5544]" : "border-transparent text-[#728078] hover:text-[#34483d]"}`}
            onClick={() => setActiveTab("people")}
            role="tab"
            type="button"
          >
            Perfiles <span className="ml-1 text-xs">{profiles.length}</span>
          </button>
        </div>
        {activeTab === "vehicles" ? (
          <button
            className="mb-2 inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#1d5544] px-4 text-sm font-semibold text-white transition hover:bg-[#174536]"
            onClick={() => setVehicleDialog("new")}
            type="button"
          >
            <span aria-hidden="true" className="text-lg leading-none">+</span>
            Agregar unidad
          </button>
        ) : (
          <button
            className="mb-2 inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#1d5544] px-4 text-sm font-semibold text-white transition hover:bg-[#174536]"
            onClick={() => setProfileDialogOpen(true)}
            type="button"
          >
            <span aria-hidden="true" className="text-lg leading-none">+</span>
            Agregar perfil
          </button>
        )}
      </div>

      {activeTab === "vehicles" ? (
        <section aria-label="Vehículos de la empresa" className="mt-5">
          <div className="flex flex-col gap-3 pb-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-[#66766d]">
              {filteredVehicles.length} de {vehicles.length} unidades
            </p>
            <div className="grid gap-2 sm:grid-cols-[minmax(220px,300px)_190px]">
              <label className="sr-only" htmlFor="vehicle-search">Buscar unidades</label>
              <input
                className="h-10 rounded-md border border-[#cfd8ce] bg-white px-3 text-sm outline-none placeholder:text-[#89958e] focus:border-[#36715c] focus:ring-2 focus:ring-[#36715c]/15"
                id="vehicle-search"
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar placa, código o modelo"
                type="search"
                value={search}
              />
              <label className="sr-only" htmlFor="vehicle-status">Filtrar por estado</label>
              <select
                className="h-10 rounded-md border border-[#cfd8ce] bg-white px-3 text-sm text-[#40564a] outline-none focus:border-[#36715c]"
                id="vehicle-status"
                onChange={(event) => setVehicleStatus(event.target.value)}
                value={vehicleStatus}
              >
                <option>Todos los estados</option>
                {vehicleStatuses.map((status) => <option key={status}>{status}</option>)}
              </select>
            </div>
          </div>

          <div className="overflow-hidden border border-[#dfe6de] bg-white">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] border-collapse text-left">
                <thead className="bg-[#f3f6f1]">
                  <tr className="border-b border-[#dfe6de] text-[10px] font-semibold uppercase tracking-[0.12em] text-[#6d7e73]">
                    <th className="px-4 py-3">Unidad</th>
                    <th className="px-4 py-3">Tipo</th>
                    <th className="px-4 py-3">Combustible</th>
                    <th className="px-4 py-3 text-right">Rendimiento</th>
                    <th className="px-4 py-3">Estado</th>
                    <th className="px-4 py-3"><span className="sr-only">Acciones</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e9eee8]">
                  {filteredVehicles.map((vehicle) => (
                    <tr className="text-sm hover:bg-[#fafbf8]" key={vehicle.id}>
                      <td className="px-4 py-4">
                        <p className="font-semibold text-[#2a4035]">{vehicle.plateNumber}</p>
                        <p className="mt-1 text-xs text-[#738178]">
                          {vehicle.internalCode || "Sin código"} · {vehicle.makeModel} · {vehicle.modelYear}
                        </p>
                      </td>
                      <td className="px-4 py-4 text-[#43574c]">{vehicle.vehicleType}</td>
                      <td className="px-4 py-4 text-[#43574c]">{vehicle.fuelType}</td>
                      <td className="px-4 py-4 text-right font-medium tabular-nums text-[#2a4035]">
                        {vehicle.fuelEfficiencyKmPerLiter.toFixed(1)} km/l
                      </td>
                      <td className="px-4 py-4"><StatusBadge status={vehicle.status} /></td>
                      <td className="px-4 py-4 text-right">
                        <button
                          aria-label={`Editar ${vehicle.plateNumber}`}
                          className="min-h-9 rounded px-2 text-xs font-semibold text-[#28634e] underline-offset-4 hover:bg-[#eef4ee] hover:underline"
                          onClick={() => setVehicleDialog(vehicle)}
                          type="button"
                        >
                          Editar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredVehicles.length === 0 && (
                <p className="px-5 py-12 text-center text-sm text-[#718076]">
                  No hay unidades que coincidan con la búsqueda.
                </p>
              )}
            </div>
          </div>
          <p className="mt-3 text-xs leading-5 text-[#77847c]">
            El rendimiento se expresa en km por litro. Los cambios se conservan solo durante esta sesión de vista previa.
          </p>
        </section>
      ) : (
        <section aria-label="Perfiles de la empresa" className="mt-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-[#66766d]">
              {activeProfiles} perfiles activos de {profiles.length}
            </p>
            <p className="text-xs text-[#77847c]">Los perfiles de ejemplo no representan usuarios reales.</p>
          </div>
          <div className="overflow-hidden border border-[#dfe6de] bg-white">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] border-collapse text-left">
                <thead className="bg-[#f3f6f1]">
                  <tr className="border-b border-[#dfe6de] text-[10px] font-semibold uppercase tracking-[0.12em] text-[#6d7e73]">
                    <th className="px-4 py-3">Perfil</th>
                    <th className="px-4 py-3">Rol</th>
                    <th className="px-4 py-3">Estado</th>
                    <th className="px-4 py-3 text-right">Acceso</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e9eee8]">
                  {profiles.map((profile) => (
                    <tr className="text-sm" key={profile.id}>
                      <td className="px-4 py-4">
                        <p className="font-semibold text-[#2a4035]">{profile.fullName}</p>
                        <p className="mt-1 text-xs text-[#738178]">{profile.email}</p>
                      </td>
                      <td className="px-4 py-4">
                        <label className="sr-only" htmlFor={`role-${profile.id}`}>
                          Rol de {profile.fullName}
                        </label>
                        <select
                          className="h-9 rounded-md border border-[#d6dfd5] bg-white px-2 text-xs text-[#40564a] outline-none focus:border-[#36715c]"
                          id={`role-${profile.id}`}
                          onChange={(event) => updateProfileRole(profile.id, event.target.value as CompanyRole)}
                          value={profile.role}
                        >
                          {companyRoles.map((companyRole) => <option key={companyRole}>{companyRole}</option>)}
                        </select>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex min-h-7 items-center rounded px-2.5 text-xs font-medium ${profile.isActive ? "bg-[#e4f1e7] text-[#315f3d]" : "bg-[#eceeeb] text-[#647068]"}`}>
                          {profile.isActive ? "Activo" : "Inactivo"}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <button
                          aria-label={`${profile.isActive ? "Desactivar" : "Activar"} perfil de ${profile.fullName}`}
                          className="min-h-9 rounded px-2 text-xs font-semibold text-[#28634e] underline-offset-4 hover:bg-[#eef4ee] hover:underline"
                          onClick={() => toggleProfile(profile.id)}
                          type="button"
                        >
                          {profile.isActive ? "Desactivar" : "Activar"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <p className="mt-3 text-xs leading-5 text-[#77847c]">
            Los roles y estados son locales. Contraseñas, invitaciones y autenticación se gestionarán al conectar Supabase Auth.
          </p>
        </section>
      )}

      {vehicleDialog !== null && (
        <VehicleDialog
          onClose={() => setVehicleDialog(null)}
          onSave={saveVehicle}
          vehicle={vehicleDialog === "new" ? null : vehicleDialog}
          vehicles={vehicles}
        />
      )}
      {profileDialogOpen && (
        <ProfileDialog
          onClose={() => setProfileDialogOpen(false)}
          onSave={(profile) => setProfiles((current) => [profile, ...current])}
        />
      )}
    </>
  );
}