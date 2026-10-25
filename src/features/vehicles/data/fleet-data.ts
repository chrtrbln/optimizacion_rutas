import { createClient } from "../../../../supabase/client";
import { loadCompanyContext } from "@/features/companies/data/company-context";
import type {
  CompanyProfile,
  CompanyRole,
  FleetVehicle,
  FuelType,
  VehicleStatus,
  VehicleType,
} from "@/features/vehicles/types";

export type FleetData = {
  companyId: string;
  role: "admin" | "planner" | "viewer";
  vehicles: FleetVehicle[];
  profiles: CompanyProfile[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readText(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function readNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
  }
  return null;
}

function vehicleTypeFromDatabase(value: unknown): VehicleType | null {
  if (value === "truck" || value === "camion") return "Camión";
  if (value === "pickup") return "Pickup";
  if (value === "van") return "Van";
  if (value === "other") return "Otro";
  return null;
}

function fuelTypeFromDatabase(value: unknown): FuelType | null {
  if (value === "diesel") return "Diésel";
  if (value === "regular_gasoline") return "Gasolina regular";
  if (value === "premium_gasoline") return "Gasolina superior";
  return null;
}

function vehicleStatusFromDatabase(value: unknown): VehicleStatus | null {
  if (value === "available") return "Disponible";
  if (value === "assigned") return "Asignado";
  if (value === "maintenance") return "Mantenimiento";
  if (value === "inactive") return "Inactivo";
  return null;
}

function companyRoleFromDatabase(value: unknown): CompanyRole | null {
  if (value === "admin") return "Administrador";
  if (value === "planner") return "Planificador";
  if (value === "viewer") return "Consulta";
  return null;
}

function vehicleToDatabase(vehicle: FleetVehicle) {
  const [brand, ...model] = vehicle.makeModel.trim().split(/\s+/);
  return {
    plate_number: vehicle.plateNumber.trim().toLocaleUpperCase("es-SV"),
    internal_code: vehicle.internalCode.trim() || null,
    brand: brand || null,
    model: model.join(" ") || null,
    model_year: vehicle.modelYear,
    vehicle_type: vehicle.vehicleType === "Camión"
      ? "truck"
      : vehicle.vehicleType === "Pickup"
        ? "pickup"
        : vehicle.vehicleType === "Van"
          ? "van"
          : "other",
    fuel_type: vehicle.fuelType === "Diésel"
      ? "diesel"
      : vehicle.fuelType === "Gasolina regular"
        ? "regular_gasoline"
        : "premium_gasoline",
    fuel_efficiency_km_per_liter: vehicle.fuelEfficiencyKmPerLiter,
    status: vehicle.status === "Disponible"
      ? "available"
      : vehicle.status === "Asignado"
        ? "assigned"
        : vehicle.status === "Mantenimiento"
          ? "maintenance"
          : "inactive",
  };
}

function parseVehicle(value: unknown): FleetVehicle | null {
  if (!isRecord(value)) return null;
  const id = readText(value.id);
  const plateNumber = readText(value.plate_number);
  const vehicleType = vehicleTypeFromDatabase(value.vehicle_type);
  const fuelType = fuelTypeFromDatabase(value.fuel_type);
  const status = vehicleStatusFromDatabase(value.status);
  const efficiency = readNumber(value.fuel_efficiency_km_per_liter);
  if (!id || !plateNumber || !vehicleType || !fuelType || !status || efficiency === null || efficiency <= 0) {
    return null;
  }

  const makeModel = [readText(value.brand), readText(value.model)]
    .filter((part): part is string => part !== null)
    .join(" ");
  return {
    id,
    plateNumber,
    internalCode: readText(value.internal_code) ?? "",
    makeModel,
    modelYear: readNumber(value.model_year) ?? 0,
    vehicleType,
    fuelType,
    fuelEfficiencyKmPerLiter: efficiency,
    status,
  };
}

function parseProfile(value: unknown): CompanyProfile | null {
  if (!isRecord(value)) return null;
  const id = readText(value.user_id);
  const fullName = readText(value.full_name);
  const role = companyRoleFromDatabase(value.role);
  if (!id || !fullName || !role || typeof value.is_active !== "boolean") return null;
  return {
    id,
    fullName,
    email: readText(value.email) ?? "Correo no disponible",
    role,
    isActive: value.is_active,
  };
}

export async function loadFleetData(): Promise<FleetData> {
  const context = await loadCompanyContext();
  const supabase = createClient();
  const [vehicleResult, memberResult] = await Promise.all([
    supabase
      .from("vehicles")
      .select("id,plate_number,internal_code,brand,model,model_year,vehicle_type,fuel_type,fuel_efficiency_km_per_liter,status")
      .eq("company_id", context.companyId)
      .order("plate_number"),
    supabase.rpc("get_company_member_directory"),
  ]);

  if (vehicleResult.error) throw new Error("No se pudieron cargar los vehículos. Verifica las políticas RLS.");
  if (memberResult.error) {
    throw new Error("No se pudieron cargar los perfiles. Ejecuta supabase/application_rls.sql en el SQL Editor.");
  }

  const vehicleRows: unknown = vehicleResult.data;
  const memberRows: unknown = memberResult.data;
  return {
    companyId: context.companyId,
    role: context.role,
    vehicles: Array.isArray(vehicleRows)
      ? vehicleRows.map(parseVehicle).filter((vehicle): vehicle is FleetVehicle => vehicle !== null)
      : [],
    profiles: Array.isArray(memberRows)
      ? memberRows.map(parseProfile).filter((profile): profile is CompanyProfile => profile !== null)
      : [],
  };
}

export async function saveFleetVehicle(vehicle: FleetVehicle): Promise<FleetVehicle> {
  const context = await loadCompanyContext();
  if (context.role === "viewer") throw new Error("Tu rol no permite modificar vehículos.");
  const supabase = createClient();
  const record = vehicleToDatabase(vehicle);
  const result = vehicle.id
    ? await supabase
        .from("vehicles")
        .update(record)
        .eq("company_id", context.companyId)
        .eq("id", vehicle.id)
        .select("id,plate_number,internal_code,brand,model,model_year,vehicle_type,fuel_type,fuel_efficiency_km_per_liter,status")
        .single()
    : await supabase
        .from("vehicles")
        .insert({ ...record, company_id: context.companyId })
        .select("id,plate_number,internal_code,brand,model,model_year,vehicle_type,fuel_type,fuel_efficiency_km_per_liter,status")
        .single();

  if (result.error) {
    if (result.error.code === "23505") throw new Error("Ya existe una unidad con esta placa en la flota.");
    throw new Error("No se pudo guardar la unidad. Verifica los datos y las políticas RLS.");
  }

  const parsed = parseVehicle(result.data);
  if (!parsed) throw new Error("La base de datos devolvió una unidad inválida.");
  return parsed;
}

export async function addCompanyProfile(input: {
  email: string;
  fullName: string;
  role: CompanyRole;
}): Promise<void> {
  const context = await loadCompanyContext();
  if (context.role !== "admin") throw new Error("Solo un administrador puede agregar perfiles.");
  const supabase = createClient();
  const role = input.role === "Administrador" ? "admin" : input.role === "Planificador" ? "planner" : "viewer";
  const { error } = await supabase.rpc("add_company_member_by_email", {
    requested_email: input.email.trim().toLocaleLowerCase("es-SV"),
    requested_full_name: input.fullName.trim(),
    requested_role: role,
  });

  if (error) {
    throw new Error(error.message.includes("Auth")
      ? "La persona debe existir primero como usuario en Supabase Auth."
      : "No se pudo agregar el perfil. Verifica que application_rls.sql esté instalado y tu rol sea administrador.");
  }
}

export async function updateCompanyProfile(
  userId: string,
  changes: { role?: CompanyRole; isActive?: boolean },
): Promise<void> {
  const context = await loadCompanyContext();
  if (context.role !== "admin") throw new Error("Solo un administrador puede administrar perfiles.");
  const update: { role?: string; is_active?: boolean } = {};
  if (changes.role) {
    update.role = changes.role === "Administrador" ? "admin" : changes.role === "Planificador" ? "planner" : "viewer";
  }
  if (changes.isActive !== undefined) update.is_active = changes.isActive;
  const supabase = createClient();
  const { error } = await supabase
    .from("company_members")
    .update(update)
    .eq("company_id", context.companyId)
    .eq("user_id", userId);
  if (error) throw new Error("No se pudo actualizar el perfil. Verifica las políticas RLS.");
}