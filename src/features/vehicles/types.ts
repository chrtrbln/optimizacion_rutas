export type VehicleType = "Camión" | "Pickup" | "Van";
export type FuelType = "Diésel" | "Gasolina regular" | "Gasolina superior";
export type VehicleStatus = "Disponible" | "Asignado" | "Mantenimiento" | "Inactivo";

export type FleetVehicle = {
  id: string;
  plateNumber: string;
  internalCode: string;
  makeModel: string;
  modelYear: number;
  vehicleType: VehicleType;
  fuelType: FuelType;
  fuelEfficiencyKmPerLiter: number;
  status: VehicleStatus;
};

export type CompanyRole = "Administrador" | "Planificador" | "Consulta";

export type CompanyProfile = {
  id: string;
  fullName: string;
  email: string;
  role: CompanyRole;
  isActive: boolean;
};