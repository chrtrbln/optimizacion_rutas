import type { CompanyProfile, FleetVehicle } from "@/features/vehicles/types";

export const demoVehicles: FleetVehicle[] = [
  {
    id: "vehicle-1",
    plateNumber: "P 482-731",
    internalCode: "TR-01",
    makeModel: "Isuzu NPR",
    modelYear: 2022,
    vehicleType: "Camión",
    fuelType: "Diésel",
    fuelEfficiencyKmPerLiter: 7.2,
    status: "Disponible",
  },
  {
    id: "vehicle-2",
    plateNumber: "P 619-205",
    internalCode: "VN-02",
    makeModel: "Toyota Hiace",
    modelYear: 2021,
    vehicleType: "Van",
    fuelType: "Diésel",
    fuelEfficiencyKmPerLiter: 10.4,
    status: "Asignado",
  },
  {
    id: "vehicle-3",
    plateNumber: "P 307-894",
    internalCode: "PK-03",
    makeModel: "Nissan Frontier",
    modelYear: 2023,
    vehicleType: "Pickup",
    fuelType: "Gasolina regular",
    fuelEfficiencyKmPerLiter: 11.8,
    status: "Disponible",
  },
  {
    id: "vehicle-4",
    plateNumber: "P 155-642",
    internalCode: "TR-04",
    makeModel: "Mitsubishi Fuso",
    modelYear: 2019,
    vehicleType: "Camión",
    fuelType: "Diésel",
    fuelEfficiencyKmPerLiter: 6.5,
    status: "Mantenimiento",
  },
];

export const demoProfiles: CompanyProfile[] = [
  {
    id: "profile-1",
    fullName: "María Fernanda López",
    email: "maria.lopez@ejemplo.com",
    role: "Administrador",
    isActive: true,
  },
  {
    id: "profile-2",
    fullName: "Carlos Mejía",
    email: "carlos.mejia@ejemplo.com",
    role: "Planificador",
    isActive: true,
  },
  {
    id: "profile-3",
    fullName: "Ana Sofía Rivera",
    email: "ana.rivera@ejemplo.com",
    role: "Consulta",
    isActive: false,
  },
];