"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { dashboardModules } from "@/features/dashboard/navigation";

function ModuleLinks({ compact = false }: { compact?: boolean }) {
  const pathname = usePathname();

  return dashboardModules.map((module) => {
    const isActive = pathname === module.href;

    return (
      <Link
        aria-current={isActive ? "page" : undefined}
        className={
          compact
            ? `flex min-h-12 shrink-0 items-center gap-2.5 border-b-2 px-3 text-sm transition-colors ${
                isActive
                  ? "border-[#e17b53] text-white"
                  : "border-transparent text-[#c0d1c7] hover:text-white"
              }`
            : `group flex min-h-12 items-center gap-3 rounded-md px-3 text-sm transition-colors ${
                isActive
                  ? "bg-[#e17b53] font-semibold text-[#1d302a]"
                  : "text-[#d4e0d9] hover:bg-white/10 hover:text-white"
              }`
        }
        href={module.href}
        key={module.code}
      >
        <span
          className={`grid size-7 shrink-0 place-items-center rounded text-[10px] font-bold ${
            compact
              ? isActive
                ? "bg-[#e17b53] text-[#1d302a]"
                : "bg-white/10 text-[#d4e0d9]"
              : isActive
                ? "bg-[#1d302a]/10 text-[#1d302a]"
                : "bg-white/10 text-[#d4e0d9] group-hover:bg-white/15"
          }`}
        >
          {module.code}
        </span>
        <span className="whitespace-nowrap">{module.name}</span>
      </Link>
    );
  });
}

export function Sidebar() {
  return (
    <>
      <aside className="hidden min-h-screen w-[272px] shrink-0 flex-col bg-[#173d34] px-5 py-6 text-white lg:flex">
        <Link aria-label="Traza, espacio de trabajo" className="flex items-center gap-3 px-2" href="/dashboard">
          <span className="grid size-10 place-items-center rounded-md bg-[#e17b53] text-lg font-bold text-[#1d302a]">
            T
          </span>
          <span className="text-lg font-semibold tracking-wide">traza</span>
        </Link>

        <div className="mt-9 px-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#a9c3b5]">
            Planificación operativa
          </p>
          <p className="mt-2 text-sm text-[#e0e9e3]">El Salvador</p>
        </div>

        <nav aria-label="Módulos principales" className="mt-8 flex flex-col gap-1">
          <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#a9c3b5]">
            Módulos
          </p>
          <ModuleLinks />
        </nav>

        <div className="mt-auto border-t border-white/15 px-2 pt-5">
          <p className="text-xs font-medium text-white">Prototipo frontend</p>
          <p className="mt-1 text-xs leading-5 text-[#b7c9bf]">
            Sin datos ni servicios conectados.
          </p>
          <p className="mt-4 text-[10px] uppercase tracking-[0.15em] text-[#a9c3b5]">
            USD · km · litros · kg CO2e
          </p>
        </div>
      </aside>

      <div className="sticky top-0 z-20 bg-[#173d34] px-4 pt-4 text-white lg:hidden">
        <div className="flex items-center justify-between gap-4">
          <Link aria-label="Traza, espacio de trabajo" className="flex items-center gap-2.5" href="/dashboard">
            <span className="grid size-8 place-items-center rounded bg-[#e17b53] font-bold text-[#1d302a]">
              T
            </span>
            <span className="font-semibold tracking-wide">traza</span>
          </Link>
          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#c0d1c7]">
            Prototipo frontend
          </span>
        </div>
        <nav
          aria-label="Módulos principales"
          className="mt-3 flex -mx-4 overflow-x-auto px-2 [scrollbar-width:thin]"
        >
          <ModuleLinks compact />
        </nav>
      </div>
    </>
  );
}