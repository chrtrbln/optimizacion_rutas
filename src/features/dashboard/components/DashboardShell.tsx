import type { ReactNode } from "react";
import { Sidebar } from "@/features/dashboard/components/Sidebar";

export function DashboardShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f5f7f3] lg:flex">
      <Sidebar />
      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <header className="hidden h-[68px] items-center justify-between border-b border-[#e2e7e0] bg-white px-8 lg:flex">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-[#66776e]">
            Traza <span className="px-2 text-[#b5c0b8]">/</span> Espacio de trabajo
          </p>
          <p className="text-xs text-[#78877f]">Vista de planificación</p>
        </header>
        <main className="flex-1 px-4 py-7 sm:px-7 sm:py-9 lg:px-10 lg:py-10">
          <div className="mx-auto w-full max-w-[1240px]">{children}</div>
        </main>
      </div>
    </div>
  );
}