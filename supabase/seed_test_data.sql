-- Test-only seed for the route-planning prototype.
-- 1. Create this user first in Supabase Auth (or replace the email below with an existing test user's email).
-- 2. Run this script in the Supabase SQL Editor after supabase_create_tables.sql.
-- 3. Run route_planner_rls.sql before testing data reads from the signed-in browser.
-- All fuel prices and emission factors below are synthetic and are NOT official values.
-- Re-running this script updates the same test records instead of duplicating them.

DO $seed$
DECLARE
    v_test_email text := 'test.admin@example.com';
    v_user_id uuid;
    v_company_id uuid;
    v_existing_company_id uuid;
    v_vehicle_truck_id uuid;
    v_vehicle_van_id uuid;
    v_operator_driver_id uuid;
    v_operator_assistant_id uuid;
    v_location_origin_id uuid;
    v_location_waypoint_id uuid;
    v_location_destination_id uuid;
    v_route_plan_id uuid;
    v_diesel_price_id uuid;
    v_diesel_factor_id uuid;
    v_regular_price_id uuid;
    v_regular_factor_id uuid;
    v_premium_price_id uuid;
    v_premium_factor_id uuid;
    v_test_source text := 'TEST DATA - NOT OFFICIAL';
BEGIN
    SELECT users.id
      INTO v_user_id
      FROM auth.users AS users
     WHERE lower(users.email) = lower(v_test_email)
     LIMIT 1;

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION
            'No Supabase Auth user found for %. Create this user in Authentication first, then rerun this script.',
            v_test_email;
    END IF;

    SELECT company.id
      INTO v_company_id
      FROM public.companies AS company
     WHERE company.tax_identifier = 'TEST-ROUTE-001'
     LIMIT 1;

    IF v_company_id IS NULL THEN
        INSERT INTO public.companies (
            name,
            legal_name,
            tax_identifier,
            email,
            phone,
            address,
            department,
            district,
            currency_code,
            timezone,
            status
        )
        VALUES (
            'Empresa de Prueba de Rutas',
            'Empresa de Prueba de Rutas, S.A. de C.V.',
            'TEST-ROUTE-001',
            v_test_email,
            '+503 2000-0000',
            'Centro de prueba, San Salvador',
            'San Salvador',
            'San Salvador',
            'USD',
            'America/El_Salvador',
            'active'
        )
        RETURNING id INTO v_company_id;
    ELSE
        UPDATE public.companies
           SET name = 'Empresa de Prueba de Rutas',
               email = v_test_email,
               status = 'active',
               updated_at = now()
         WHERE id = v_company_id;
    END IF;

    SELECT membership.company_id
      INTO v_existing_company_id
      FROM public.company_members AS membership
     WHERE membership.user_id = v_user_id
     LIMIT 1;

    IF v_existing_company_id IS NOT NULL AND v_existing_company_id <> v_company_id THEN
        RAISE EXCEPTION
            'The selected Auth user already belongs to another company. Use a dedicated test user to avoid changing tenant membership.';
    END IF;

    INSERT INTO public.profiles (id, full_name, phone, status)
    VALUES (v_user_id, 'Administrador de Prueba', '+503 7000-0001', 'active')
    ON CONFLICT (id) DO UPDATE
        SET full_name = EXCLUDED.full_name,
            phone = EXCLUDED.phone,
            status = 'active',
            updated_at = now();

    INSERT INTO public.company_members (company_id, user_id, role, is_active)
    VALUES (v_company_id, v_user_id, 'admin', true)
    ON CONFLICT (company_id, user_id) DO UPDATE
        SET role = 'admin',
            is_active = true;

    INSERT INTO public.vehicles (
        company_id,
        plate_number,
        internal_code,
        brand,
        model,
        model_year,
        vehicle_type,
        fuel_type,
        tank_capacity_liters,
        cargo_capacity_kg,
        fuel_efficiency_km_per_liter,
        odometer_km,
        status,
        notes
    )
    VALUES
        (v_company_id, 'P 900-001', 'TEST-TR-01', 'Isuzu', 'NPR', 2022, 'truck', 'diesel', 100, 3500, 7.2, 45200, 'available', 'Unidad sintética para pruebas.'),
        (v_company_id, 'P 900-002', 'TEST-VN-02', 'Toyota', 'Hiace', 2021, 'van', 'regular_gasoline', 70, 1200, 10.4, 31800, 'available', 'Unidad sintética para pruebas.')
    ON CONFLICT (company_id, plate_number) DO UPDATE
        SET internal_code = EXCLUDED.internal_code,
            brand = EXCLUDED.brand,
            model = EXCLUDED.model,
            model_year = EXCLUDED.model_year,
            vehicle_type = EXCLUDED.vehicle_type,
            fuel_type = EXCLUDED.fuel_type,
            tank_capacity_liters = EXCLUDED.tank_capacity_liters,
            cargo_capacity_kg = EXCLUDED.cargo_capacity_kg,
            fuel_efficiency_km_per_liter = EXCLUDED.fuel_efficiency_km_per_liter,
            odometer_km = EXCLUDED.odometer_km,
            status = EXCLUDED.status,
            notes = EXCLUDED.notes,
            updated_at = now();

    SELECT vehicle.id INTO v_vehicle_truck_id
      FROM public.vehicles AS vehicle
     WHERE vehicle.company_id = v_company_id
       AND vehicle.plate_number = 'P 900-001';

    SELECT vehicle.id INTO v_vehicle_van_id
      FROM public.vehicles AS vehicle
     WHERE vehicle.company_id = v_company_id
       AND vehicle.plate_number = 'P 900-002';

        SELECT op.id INTO v_operator_driver_id
            FROM public.operators AS op
         WHERE op.company_id = v_company_id
             AND op.employee_code = 'TEST-OP-001'
     LIMIT 1;

    IF v_operator_driver_id IS NULL THEN
        INSERT INTO public.operators (
            company_id,
            employee_code,
            full_name,
            phone,
            license_number,
            license_type,
            license_expiration,
            status,
            notes
        )
        VALUES (
            v_company_id,
            'TEST-OP-001',
            'Conductor de Prueba',
            '+503 7000-0002',
            'TEST-LIC-001',
            'Pesada',
            DATE '2028-12-31',
            'available',
            'Operador sintético para pruebas.'
        )
        RETURNING id INTO v_operator_driver_id;
    ELSE
        UPDATE public.operators
           SET full_name = 'Conductor de Prueba',
               status = 'available',
               updated_at = now()
         WHERE id = v_operator_driver_id;
    END IF;

        SELECT op.id INTO v_operator_assistant_id
            FROM public.operators AS op
         WHERE op.company_id = v_company_id
             AND op.employee_code = 'TEST-OP-002'
     LIMIT 1;

    IF v_operator_assistant_id IS NULL THEN
        INSERT INTO public.operators (
            company_id,
            employee_code,
            full_name,
            phone,
            status,
            notes
        )
        VALUES (
            v_company_id,
            'TEST-OP-002',
            'Asistente de Prueba',
            '+503 7000-0003',
            'available',
            'Operador sintético para pruebas.'
        )
        RETURNING id INTO v_operator_assistant_id;
    ELSE
        UPDATE public.operators
           SET full_name = 'Asistente de Prueba',
               status = 'available',
               updated_at = now()
         WHERE id = v_operator_assistant_id;
    END IF;

    SELECT location.id INTO v_location_origin_id
      FROM public.locations AS location
     WHERE location.company_id = v_company_id
       AND location.name = 'Bodega de Prueba - San Salvador'
     LIMIT 1;

    IF v_location_origin_id IS NULL THEN
        INSERT INTO public.locations (
            company_id, name, location_type, address, department, district,
            latitude, longitude, contact_name, contact_phone,
            average_service_minutes, notes, is_active
        )
        VALUES (
            v_company_id, 'Bodega de Prueba - San Salvador', 'warehouse',
            'San Salvador, El Salvador', 'San Salvador', 'San Salvador',
            13.6929, -89.2182, 'Contacto de Prueba', '+503 7000-0004',
            20, 'Ubicación sintética para probar OSRM y PostGIS.', true
        )
        RETURNING id INTO v_location_origin_id;
    ELSE
        UPDATE public.locations
           SET latitude = 13.6929,
               longitude = -89.2182,
               department = 'San Salvador',
               district = 'San Salvador',
               is_active = true,
               updated_at = now()
         WHERE id = v_location_origin_id;
    END IF;

    SELECT location.id INTO v_location_waypoint_id
      FROM public.locations AS location
     WHERE location.company_id = v_company_id
       AND location.name = 'Cliente de Prueba - Santa Tecla'
     LIMIT 1;

    IF v_location_waypoint_id IS NULL THEN
        INSERT INTO public.locations (
            company_id, name, location_type, address, department, district,
            latitude, longitude, contact_name, contact_phone,
            average_service_minutes, notes, is_active
        )
        VALUES (
            v_company_id, 'Cliente de Prueba - Santa Tecla', 'customer',
            'Santa Tecla, La Libertad, El Salvador', 'La Libertad', 'Santa Tecla',
            13.6769, -89.2797, 'Contacto de Prueba', '+503 7000-0005',
            15, 'Ubicación sintética para probar paradas intermedias.', true
        )
        RETURNING id INTO v_location_waypoint_id;
    ELSE
        UPDATE public.locations
           SET latitude = 13.6769,
               longitude = -89.2797,
               department = 'La Libertad',
               district = 'Santa Tecla',
               is_active = true,
               updated_at = now()
         WHERE id = v_location_waypoint_id;
    END IF;

    SELECT location.id INTO v_location_destination_id
      FROM public.locations AS location
     WHERE location.company_id = v_company_id
       AND location.name = 'Centro de Prueba - Santa Ana'
     LIMIT 1;

    IF v_location_destination_id IS NULL THEN
        INSERT INTO public.locations (
            company_id, name, location_type, address, department, district,
            latitude, longitude, contact_name, contact_phone,
            average_service_minutes, notes, is_active
        )
        VALUES (
            v_company_id, 'Centro de Prueba - Santa Ana', 'delivery_point',
            'Santa Ana, El Salvador', 'Santa Ana', 'Santa Ana',
            13.9942, -89.5597, 'Contacto de Prueba', '+503 7000-0006',
            15, 'Ubicación sintética para probar destino y geometría.', true
        )
        RETURNING id INTO v_location_destination_id;
    ELSE
        UPDATE public.locations
           SET latitude = 13.9942,
               longitude = -89.5597,
               department = 'Santa Ana',
               district = 'Santa Ana',
               is_active = true,
               updated_at = now()
         WHERE id = v_location_destination_id;
    END IF;

    SELECT price.id INTO v_diesel_price_id
      FROM public.fuel_prices AS price
     WHERE price.fuel_type = 'diesel'
       AND price.source_name = v_test_source
       AND price.valid_from = TIMESTAMPTZ '2026-01-01 00:00:00-06';

    IF v_diesel_price_id IS NULL THEN
        INSERT INTO public.fuel_prices (
            fuel_type, price_per_liter, currency_code, source_name,
            source_reference, valid_from, valid_to, is_active, created_by
        )
        VALUES (
            'diesel', 1.00, 'USD', v_test_source, 'Seed value for UI testing only',
            TIMESTAMPTZ '2026-01-01 00:00:00-06', TIMESTAMPTZ '2027-01-01 00:00:00-06', true, v_user_id
        )
        RETURNING id INTO v_diesel_price_id;
    ELSE
        UPDATE public.fuel_prices
           SET price_per_liter = 1.00,
               valid_to = TIMESTAMPTZ '2027-01-01 00:00:00-06',
               is_active = true
         WHERE id = v_diesel_price_id;
    END IF;

    SELECT factor.id INTO v_diesel_factor_id
      FROM public.emission_factors AS factor
     WHERE factor.fuel_type = 'diesel'
       AND factor.source_name = v_test_source
       AND factor.source_version = 'seed-v1';

    IF v_diesel_factor_id IS NULL THEN
        INSERT INTO public.emission_factors (
            fuel_type, factor_value, factor_unit, source_name,
            source_reference, source_version, valid_from, valid_to, is_active
        )
        VALUES (
            'diesel', 2.680000, 'kg_co2e_per_liter', v_test_source,
            'Seed value for UI testing only', 'seed-v1',
            TIMESTAMPTZ '2026-01-01 00:00:00-06', TIMESTAMPTZ '2027-01-01 00:00:00-06', true
        )
        RETURNING id INTO v_diesel_factor_id;
    ELSE
        UPDATE public.emission_factors
           SET factor_value = 2.680000,
               valid_to = TIMESTAMPTZ '2027-01-01 00:00:00-06',
               is_active = true
         WHERE id = v_diesel_factor_id;
    END IF;

    SELECT price.id INTO v_regular_price_id
      FROM public.fuel_prices AS price
     WHERE price.fuel_type = 'regular_gasoline'
       AND price.source_name = v_test_source
       AND price.valid_from = TIMESTAMPTZ '2026-01-01 00:00:00-06';

    IF v_regular_price_id IS NULL THEN
        INSERT INTO public.fuel_prices (
            fuel_type, price_per_liter, currency_code, source_name,
            source_reference, valid_from, valid_to, is_active, created_by
        )
        VALUES (
            'regular_gasoline', 1.05, 'USD', v_test_source, 'Seed value for UI testing only',
            TIMESTAMPTZ '2026-01-01 00:00:00-06', TIMESTAMPTZ '2027-01-01 00:00:00-06', true, v_user_id
        )
        RETURNING id INTO v_regular_price_id;
    ELSE
        UPDATE public.fuel_prices
           SET price_per_liter = 1.05,
               valid_to = TIMESTAMPTZ '2027-01-01 00:00:00-06',
               is_active = true
         WHERE id = v_regular_price_id;
    END IF;

    SELECT factor.id INTO v_regular_factor_id
      FROM public.emission_factors AS factor
     WHERE factor.fuel_type = 'regular_gasoline'
       AND factor.source_name = v_test_source
       AND factor.source_version = 'seed-v1';

    IF v_regular_factor_id IS NULL THEN
        INSERT INTO public.emission_factors (
            fuel_type, factor_value, factor_unit, source_name,
            source_reference, source_version, valid_from, valid_to, is_active
        )
        VALUES (
            'regular_gasoline', 2.310000, 'kg_co2e_per_liter', v_test_source,
            'Seed value for UI testing only', 'seed-v1',
            TIMESTAMPTZ '2026-01-01 00:00:00-06', TIMESTAMPTZ '2027-01-01 00:00:00-06', true
        )
        RETURNING id INTO v_regular_factor_id;
    ELSE
        UPDATE public.emission_factors
           SET factor_value = 2.310000,
               valid_to = TIMESTAMPTZ '2027-01-01 00:00:00-06',
               is_active = true
         WHERE id = v_regular_factor_id;
    END IF;

    SELECT price.id INTO v_premium_price_id
      FROM public.fuel_prices AS price
     WHERE price.fuel_type = 'premium_gasoline'
       AND price.source_name = v_test_source
       AND price.valid_from = TIMESTAMPTZ '2026-01-01 00:00:00-06';

    IF v_premium_price_id IS NULL THEN
        INSERT INTO public.fuel_prices (
            fuel_type, price_per_liter, currency_code, source_name,
            source_reference, valid_from, valid_to, is_active, created_by
        )
        VALUES (
            'premium_gasoline', 1.10, 'USD', v_test_source, 'Seed value for UI testing only',
            TIMESTAMPTZ '2026-01-01 00:00:00-06', TIMESTAMPTZ '2027-01-01 00:00:00-06', true, v_user_id
        )
        RETURNING id INTO v_premium_price_id;
    ELSE
        UPDATE public.fuel_prices
           SET price_per_liter = 1.10,
               valid_to = TIMESTAMPTZ '2027-01-01 00:00:00-06',
               is_active = true
         WHERE id = v_premium_price_id;
    END IF;

    SELECT factor.id INTO v_premium_factor_id
      FROM public.emission_factors AS factor
     WHERE factor.fuel_type = 'premium_gasoline'
       AND factor.source_name = v_test_source
       AND factor.source_version = 'seed-v1';

    IF v_premium_factor_id IS NULL THEN
        INSERT INTO public.emission_factors (
            fuel_type, factor_value, factor_unit, source_name,
            source_reference, source_version, valid_from, valid_to, is_active
        )
        VALUES (
            'premium_gasoline', 2.310000, 'kg_co2e_per_liter', v_test_source,
            'Seed value for UI testing only', 'seed-v1',
            TIMESTAMPTZ '2026-01-01 00:00:00-06', TIMESTAMPTZ '2027-01-01 00:00:00-06', true
        )
        RETURNING id INTO v_premium_factor_id;
    ELSE
        UPDATE public.emission_factors
           SET factor_value = 2.310000,
               valid_to = TIMESTAMPTZ '2027-01-01 00:00:00-06',
               is_active = true
         WHERE id = v_premium_factor_id;
    END IF;

    SELECT route.id INTO v_route_plan_id
      FROM public.route_plans AS route
     WHERE route.company_id = v_company_id
       AND route.route_code = 'TEST-ROUTE-001';

    IF v_route_plan_id IS NULL THEN
        INSERT INTO public.route_plans (
            company_id, vehicle_id, route_code, name, description, status,
            scheduled_date, scheduled_start_time, optimization_mode,
            stop_order_source, created_by, notes
        )
        VALUES (
            v_company_id, v_vehicle_truck_id, 'TEST-ROUTE-001',
            'Prueba OSRM: San Salvador - Santa Ana',
            'Ruta sintética con origen, parada y destino para probar OSRM.',
            'calculated', CURRENT_DATE, TIME '08:00', 'shortest_distance',
            'optimized', v_user_id, 'Datos sintéticos; no usar como ruta operativa.'
        )
        RETURNING id INTO v_route_plan_id;
    ELSE
        UPDATE public.route_plans
           SET vehicle_id = v_vehicle_truck_id,
               name = 'Prueba OSRM: San Salvador - Santa Ana',
               description = 'Ruta sintética con origen, parada y destino para probar OSRM.',
               status = 'calculated',
               scheduled_date = CURRENT_DATE,
               scheduled_start_time = TIME '08:00',
               optimization_mode = 'shortest_distance',
               stop_order_source = 'optimized',
               created_by = v_user_id,
               updated_at = now()
         WHERE id = v_route_plan_id;
    END IF;

    DELETE FROM public.route_stops WHERE route_plan_id = v_route_plan_id;

    INSERT INTO public.route_stops (
        route_plan_id, location_id, stop_type, sequence_number,
        name_snapshot, address_snapshot, latitude, longitude,
        service_duration_minutes, distance_from_previous_km,
        duration_from_previous_minutes, notes
    )
    SELECT
        v_route_plan_id,
        sample.location_id,
        sample.stop_type,
        sample.sequence_number,
        sample.name_snapshot,
        sample.address_snapshot,
        sample.latitude,
        sample.longitude,
        sample.service_duration_minutes,
        sample.distance_from_previous_km,
        sample.duration_from_previous_minutes,
        sample.notes
    FROM (
        VALUES
            (v_location_origin_id, 'origin', 0, 'Bodega de Prueba - San Salvador', 'San Salvador, El Salvador', 13.6929::double precision, -89.2182::double precision, 20, 0.000::numeric, 0.00::numeric, 'Inicio de prueba.'),
            (v_location_waypoint_id, 'waypoint', 1, 'Cliente de Prueba - Santa Tecla', 'Santa Tecla, La Libertad, El Salvador', 13.6769::double precision, -89.2797::double precision, 15, 15.000::numeric, 28.00::numeric, 'Parada intermedia de prueba.'),
            (v_location_destination_id, 'destination', 2, 'Centro de Prueba - Santa Ana', 'Santa Ana, El Salvador', 13.9942::double precision, -89.5597::double precision, 15, 52.000::numeric, 62.00::numeric, 'Fin de prueba.')
    ) AS sample(
        location_id, stop_type, sequence_number, name_snapshot, address_snapshot,
        latitude, longitude, service_duration_minutes, distance_from_previous_km,
        duration_from_previous_minutes, notes
    );

    DELETE FROM public.route_operator_assignments
     WHERE route_plan_id = v_route_plan_id
       AND operator_id IN (v_operator_driver_id, v_operator_assistant_id);

    INSERT INTO public.route_operator_assignments (route_plan_id, operator_id, assignment_role)
    VALUES
        (v_route_plan_id, v_operator_driver_id, 'primary_driver'),
        (v_route_plan_id, v_operator_assistant_id, 'assistant');

    UPDATE public.route_calculations
       SET is_current = false
     WHERE route_plan_id = v_route_plan_id
       AND is_current = true;

    INSERT INTO public.route_calculations (
        route_plan_id, vehicle_id, fuel_price_id, emission_factor_id,
        calculation_version, routing_provider, routing_profile,
        estimated_distance_km, estimated_duration_minutes,
        vehicle_efficiency_snapshot, estimated_fuel_liters,
        fuel_unit_price_snapshot, estimated_fuel_cost,
        emission_factor_snapshot, estimated_emissions_kg_co2e,
        route_geometry, provider_response, is_current, calculated_by
    )
    VALUES (
        v_route_plan_id,
        v_vehicle_truck_id,
        v_diesel_price_id,
        v_diesel_factor_id,
        1,
        'OSRM (test seed)',
        'driving',
        67.000,
        90.00,
        7.2000,
        9.3056,
        1.0000,
        9.31,
        2.680000,
        24.9390,
        extensions.ST_MakeLine(ARRAY[
            extensions.ST_SetSRID(extensions.ST_MakePoint(-89.2182, 13.6929), 4326),
            extensions.ST_SetSRID(extensions.ST_MakePoint(-89.2797, 13.6769), 4326),
            extensions.ST_SetSRID(extensions.ST_MakePoint(-89.5597, 13.9942), 4326)
        ])::extensions.geometry(LineString, 4326),
        jsonb_build_object(
            'note', 'Synthetic test response; not fetched from OSRM.',
            'code', 'Ok'
        ),
        true,
        v_user_id
    )
    ON CONFLICT (route_plan_id, calculation_version) DO UPDATE
        SET vehicle_id = EXCLUDED.vehicle_id,
            fuel_price_id = EXCLUDED.fuel_price_id,
            emission_factor_id = EXCLUDED.emission_factor_id,
            routing_provider = EXCLUDED.routing_provider,
            routing_profile = EXCLUDED.routing_profile,
            estimated_distance_km = EXCLUDED.estimated_distance_km,
            estimated_duration_minutes = EXCLUDED.estimated_duration_minutes,
            vehicle_efficiency_snapshot = EXCLUDED.vehicle_efficiency_snapshot,
            estimated_fuel_liters = EXCLUDED.estimated_fuel_liters,
            fuel_unit_price_snapshot = EXCLUDED.fuel_unit_price_snapshot,
            estimated_fuel_cost = EXCLUDED.estimated_fuel_cost,
            emission_factor_snapshot = EXCLUDED.emission_factor_snapshot,
            estimated_emissions_kg_co2e = EXCLUDED.estimated_emissions_kg_co2e,
            route_geometry = EXCLUDED.route_geometry,
            provider_response = EXCLUDED.provider_response,
            is_current = true,
            calculated_by = EXCLUDED.calculated_by,
            calculated_at = now();

    RAISE NOTICE
        'Test data ready. Company id: %, route code: TEST-ROUTE-001, Auth email: %',
        v_company_id,
        v_test_email;
END;
$seed$;

SELECT
    company.id AS company_id,
    company.name AS company_name,
    (SELECT count(*) FROM public.vehicles AS vehicle WHERE vehicle.company_id = company.id AND vehicle.plate_number IN ('P 900-001', 'P 900-002')) AS seeded_vehicles,
    (SELECT count(*) FROM public.locations AS location WHERE location.company_id = company.id AND location.name IN ('Bodega de Prueba - San Salvador', 'Cliente de Prueba - Santa Tecla', 'Centro de Prueba - Santa Ana')) AS seeded_locations,
    (SELECT count(*) FROM public.operators AS op WHERE op.company_id = company.id AND op.employee_code IN ('TEST-OP-001', 'TEST-OP-002')) AS seeded_operators,
    route.route_code,
    route.status AS route_status,
    (SELECT count(*) FROM public.route_stops AS stop WHERE stop.route_plan_id = route.id) AS route_stops,
    (SELECT calculation.estimated_distance_km FROM public.route_calculations AS calculation WHERE calculation.route_plan_id = route.id AND calculation.is_current LIMIT 1) AS estimated_distance_km,
    (SELECT calculation.estimated_fuel_cost FROM public.route_calculations AS calculation WHERE calculation.route_plan_id = route.id AND calculation.is_current LIMIT 1) AS estimated_fuel_cost_usd,
    (SELECT calculation.estimated_emissions_kg_co2e FROM public.route_calculations AS calculation WHERE calculation.route_plan_id = route.id AND calculation.is_current LIMIT 1) AS estimated_emissions_kg_co2e
FROM public.companies AS company
LEFT JOIN public.route_plans AS route
    ON route.company_id = company.id
   AND route.route_code = 'TEST-ROUTE-001'
WHERE company.tax_identifier = 'TEST-ROUTE-001';