import type { DashboardModule } from "@/features/dashboard/navigation";

export function ModuleWorkspace({
  module,
}: {
  module: DashboardModule;
}) {
  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#547262]">
            Módulo {module.code}
          </p>
          <h1 className="mt-2 text-3xl font-semibold leading-tight text-[#20382f] sm:text-[34px]">
            {module.name}
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-[#64736b] sm:text-base">
            {module.summary}
          </p>
        </div>
        <span className="inline-flex min-h-8 items-center gap-2 border border-[#d9e2d8] bg-white px-3 text-xs font-medium text-[#526a5d]">
          <span className="size-1.5 rounded-full bg-[#d88651]" />
          Diseño inicial
        </span>
      </div>

      <section
        aria-label={`Área de trabajo: ${module.name}`}
        className="relative mt-8 flex min-h-[360px] flex-col justify-between overflow-hidden border border-[#dfe6de] bg-[#fbfcf9] p-5 sm:min-h-[440px] sm:p-7"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-50 [background-image:linear-gradient(#e9eee7_1px,transparent_1px),linear-gradient(90deg,#e9eee7_1px,transparent_1px)] [background-size:32px_32px]"
        />
        <div className="relative flex items-center justify-between gap-3">
          <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#6d7e73]">
            Área de trabajo
          </span>
          <span className="border border-[#dce5dc] bg-[#fbfcf9] px-2 py-1 font-mono text-[10px] text-[#718076]">
            {module.code}
          </span>
        </div>
        <div className="relative max-w-md border-l-2 border-[#d88651] bg-[#fbfcf9]/90 py-1 pl-5">
          <p className="text-base font-medium text-[#294238]">
            El espacio de {module.name.toLocaleLowerCase("es-SV")} está listo.
          </p>
          <p className="mt-2 text-sm leading-6 text-[#718076]">
            Aquí se incorporarán las herramientas y vistas del módulo. Por ahora,
            esta estructura es solo una vista previa sin datos conectados.
          </p>
        </div>
      </section>
    </>
  );
}