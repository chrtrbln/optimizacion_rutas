import { SignInForm } from "@/features/auth/components/SignInForm";

export function SignInPage() {
  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      <section className="relative isolate flex min-h-[360px] flex-col overflow-hidden bg-[#173d34] px-7 py-7 text-[#f7f7ef] sm:px-12 sm:py-10 lg:min-h-screen lg:px-16 lg:py-12">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.11] [background-image:linear-gradient(rgba(255,255,255,0.22)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.22)_1px,transparent_1px)] [background-size:44px_44px]"
        />
        <div className="relative flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-md bg-[#e17b53] text-lg font-bold text-[#1d302a]">
            T
          </div>
          <span className="text-lg font-semibold">traza</span>
        </div>

        <div className="relative my-auto max-w-xl py-12 lg:py-20">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#b7d1ba]">
            Planificación de transporte · El Salvador
          </p>
          <h1 className="mt-5 max-w-lg text-4xl font-semibold leading-[1.12] sm:text-5xl">
            Cada recorrido empieza con un buen plan.
          </h1>
          <p className="mt-5 max-w-md text-base leading-7 text-[#d1ddd3]">
            Organiza rutas, paradas y equipos desde un solo lugar.
          </p>

          <div className="mt-12 max-w-md border-t border-white/20 pt-6">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#b7d1ba]">
              Ruta de ejemplo
            </p>
            <ol className="mt-5 space-y-0">
              <li className="flex gap-4">
                <span className="flex w-3 shrink-0 flex-col items-center">
                  <span className="mt-1 size-3 rounded-full border-[3px] border-[#e17b53] bg-[#173d34]" />
                  <span className="h-10 w-px bg-white/30" />
                </span>
                <span className="pb-4">
                  <span className="block text-xs text-[#b7d1ba]">ORIGEN</span>
                  <span className="mt-1 block font-medium">San Salvador</span>
                </span>
              </li>
              <li className="flex gap-4">
                <span className="mt-1 size-3 shrink-0 rounded-full bg-[#b7d1ba] ring-4 ring-white/10" />
                <span>
                  <span className="block text-xs text-[#b7d1ba]">DESTINO</span>
                  <span className="mt-1 block font-medium">Santa Ana</span>
                </span>
              </li>
            </ol>
          </div>
        </div>

        <p className="relative text-xs text-[#b7d1ba]">
          Diseñado para equipos de transporte salvadoreños.
        </p>
      </section>

      <section className="flex items-center justify-center px-6 py-14 sm:px-12 lg:px-16">
        <div className="w-full max-w-md">
          <p className="text-sm font-medium text-[#567064]">Bienvenido de nuevo</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-[#1d302a]">
            Inicia sesión
          </h2>
          <p className="mt-2 text-sm leading-6 text-[#64736c]">
            Ingresa tus datos para continuar con tu espacio de trabajo.
          </p>
          <div className="mt-9">
            <SignInForm />
          </div>
          <p className="mt-8 border-t border-[#dfe5dc] pt-5 text-sm leading-6 text-[#64736c]">
            ¿Necesitas acceso? Contacta al administrador de tu empresa.
          </p>
        </div>
      </section>
    </main>
  );
}