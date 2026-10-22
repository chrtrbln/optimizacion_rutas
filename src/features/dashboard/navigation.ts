export const dashboardModules = [
  {
    code: "C1",
    name: "Gestión de flotas",
    href: "/dashboard/fleet",
    summary: "Vehículos, rendimiento y perfiles de usuario.",
  },
  {
    code: "C2",
    name: "Optimización de rutas",
    href: "/dashboard/routes",
    summary: "Planificación de recorridos y orden de paradas.",
  },
  {
    code: "C3",
    name: "Estimación de costos",
    href: "/dashboard/costs",
    summary: "Estimación de combustible y costos por viaje.",
  },
  {
    code: "C4",
    name: "Cálculo de CO2",
    href: "/dashboard/emissions",
    summary: "Emisiones estimadas por ruta y período.",
  },
  {
    code: "C5",
    name: "Analítica y reportes",
    href: "/dashboard/reports",
    summary: "Historial operativo y reportes de desempeño.",
  },
] as const;

export type DashboardModule = (typeof dashboardModules)[number];