# Traza — Planificación de Rutas

Aplicación web para planificar rutas de transporte en El Salvador. Está construida con Next.js App Router, TypeScript, Tailwind CSS y Supabase (Auth y PostgreSQL con PostGIS); utiliza OSRM para el cálculo de rutas.

## Requisitos y desarrollo local

Se requiere Node.js 24 y npm. Configura las variables públicas de Supabase en un archivo `.env.local` (ignorado por Git):

```text
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
OSRM_BASE_URL=https://router.project-osrm.org
```

No incluyas claves `service_role` de Supabase ni credenciales privadas en variables accesibles desde el cliente. El servidor público de demostración de OSRM es solo para desarrollo; para producción, configura un servicio OSRM propio o administrado.

Inicia la aplicación con `npm run dev`.

## Configuración de la base de datos

En el editor SQL de Supabase, ejecuta una vez `supabase_create_tables.sql` y luego `supabase/application_rls.sql`. Crea un usuario de prueba de Auth antes de ejecutar `supabase/seed_test_data.sql`. Los cambios en las políticas o en las funciones RPC de persistencia deben aplicarse en cada entorno de Supabase.

## Comprobaciones de calidad

Los comandos disponibles para revisar el código son `npm run lint`, `npm run test:unit`, `npm run test:integration`, `npm run test:security`, `npm run typecheck` y `npm run build`.

La prueba RLS en vivo con dos cuentas se omite si no se proporcionan credenciales específicas mediante `SUPABASE_TEST_URL`, `SUPABASE_TEST_PUBLISHABLE_KEY`, `SUPABASE_TEST_USER_A_ACCESS_TOKEN` y `SUPABASE_TEST_USER_B_ACCESS_TOKEN`. No uses usuarios ni tokens de producción para esta prueba.

## Alcance actual

El planificador guarda los cálculos y sus versiones. Las pantallas de combustible y emisiones usan esos cálculos guardados. La interfaz aún no incluye datos oficiales de DGEHM, un catálogo oficial de factores IPCC/EPA/GLEC ni un mapa cartográfico. OSRM Trip ordena los puntos mediante una heurística; no implementa los algoritmos Dijkstra ni A*.
