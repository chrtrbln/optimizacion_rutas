-- Run in Supabase SQL Editor after supabase_create_tables.sql.
-- Authenticated users can access only their active company. Admin/planner roles
-- can manage operational records; fuel prices and emission factors are read-only.

CREATE OR REPLACE FUNCTION public.route_planner_company_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT membership.company_id
    FROM public.company_members AS membership
    WHERE membership.user_id = (SELECT auth.uid())
      AND membership.is_active = true
    LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.route_planner_has_role(allowed_roles text[])
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.company_members AS membership
        WHERE membership.user_id = (SELECT auth.uid())
          AND membership.company_id = (SELECT public.route_planner_company_id())
          AND membership.is_active = true
          AND membership.role = ANY (allowed_roles)
    );
$$;

REVOKE ALL ON FUNCTION public.route_planner_company_id() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.route_planner_has_role(text[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.route_planner_company_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.route_planner_has_role(text[]) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_company_member_directory()
RETURNS TABLE (
    user_id uuid,
    email text,
    full_name text,
    phone text,
    role text,
    is_active boolean,
    profile_status text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT membership.user_id,
           auth_user.email::text,
           profile.full_name,
           profile.phone,
           membership.role,
           membership.is_active,
           profile.status
    FROM public.company_members AS membership
    JOIN public.profiles AS profile ON profile.id = membership.user_id
    JOIN auth.users AS auth_user ON auth_user.id = membership.user_id
    WHERE membership.company_id = (SELECT public.route_planner_company_id());
$$;

CREATE OR REPLACE FUNCTION public.add_company_member_by_email(
    requested_email text,
    requested_full_name text,
    requested_role text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    current_company_id uuid;
    invited_user_id uuid;
    invited_user_name text;
    previous_company_id uuid;
    normalized_email text := lower(trim(requested_email));
    normalized_name text := nullif(trim(requested_full_name), '');
BEGIN
    current_company_id := public.route_planner_company_id();
    IF current_company_id IS NULL
       OR NOT public.route_planner_has_role(ARRAY['admin']::text[]) THEN
        RAISE EXCEPTION 'Only an active company administrator can add members'
            USING ERRCODE = '42501';
    END IF;

    IF requested_role NOT IN ('admin', 'planner', 'viewer') THEN
        RAISE EXCEPTION 'Unsupported company role';
    END IF;

    SELECT auth_user.id,
           coalesce(nullif(auth_user.raw_user_meta_data ->> 'full_name', ''), split_part(auth_user.email, '@', 1))
      INTO invited_user_id, invited_user_name
      FROM auth.users AS auth_user
     WHERE lower(auth_user.email) = normalized_email
     LIMIT 1;

    IF invited_user_id IS NULL THEN
        RAISE EXCEPTION 'Create or invite this person in Supabase Auth before adding company access';
    END IF;

    SELECT membership.company_id
      INTO previous_company_id
      FROM public.company_members AS membership
     WHERE membership.user_id = invited_user_id
     LIMIT 1;

    IF previous_company_id IS NOT NULL AND previous_company_id <> current_company_id THEN
        RAISE EXCEPTION 'This user already belongs to another company';
    END IF;

    INSERT INTO public.profiles (id, full_name, status)
    VALUES (invited_user_id, coalesce(normalized_name, invited_user_name), 'active')
    ON CONFLICT (id) DO UPDATE
       SET full_name = coalesce(normalized_name, public.profiles.full_name),
           status = 'active',
           updated_at = now();

    INSERT INTO public.company_members (company_id, user_id, role, is_active)
    VALUES (current_company_id, invited_user_id, requested_role, true)
    ON CONFLICT (company_id, user_id) DO UPDATE
       SET role = EXCLUDED.role,
           is_active = true;

    RETURN invited_user_id;
END;
$$;

REVOKE ALL ON FUNCTION public.get_company_member_directory() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.add_company_member_by_email(text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_company_member_directory() TO authenticated;
GRANT EXECUTE ON FUNCTION public.add_company_member_by_email(text, text, text) TO authenticated;

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fuel_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emission_factors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.route_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.route_stops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.route_operator_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.route_calculations ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON
    public.vehicles,
    public.operators,
    public.locations,
    public.route_plans,
    public.route_stops,
    public.route_operator_assignments
TO authenticated;
GRANT SELECT ON
    public.companies,
    public.profiles,
    public.company_members,
    public.vehicles,
    public.operators,
    public.locations,
    public.route_plans,
    public.route_stops,
    public.route_operator_assignments,
    public.route_calculations,
    public.fuel_prices,
    public.emission_factors
TO authenticated;
GRANT UPDATE ON public.companies TO authenticated;
GRANT UPDATE (role, is_active) ON public.company_members TO authenticated;
REVOKE INSERT, DELETE ON public.company_members FROM authenticated;
GRANT INSERT ON public.route_calculations TO authenticated;
REVOKE UPDATE, DELETE ON public.route_calculations FROM authenticated;

DROP POLICY IF EXISTS tenant_company_select ON public.companies;
CREATE POLICY tenant_company_select ON public.companies
    FOR SELECT TO authenticated
    USING (id = (SELECT public.route_planner_company_id()));

DROP POLICY IF EXISTS tenant_company_update ON public.companies;
CREATE POLICY tenant_company_update ON public.companies
    FOR UPDATE TO authenticated
    USING (
        id = (SELECT public.route_planner_company_id())
        AND (SELECT public.route_planner_has_role(ARRAY['admin']::text[]))
    )
    WITH CHECK (id = (SELECT public.route_planner_company_id()));

DROP POLICY IF EXISTS tenant_profile_select ON public.profiles;
CREATE POLICY tenant_profile_select ON public.profiles
    FOR SELECT TO authenticated
    USING (
        id = (SELECT auth.uid())
        OR id IN (
            SELECT membership.user_id
            FROM public.company_members AS membership
            WHERE membership.company_id = (SELECT public.route_planner_company_id())
              AND membership.is_active = true
        )
    );

DROP POLICY IF EXISTS tenant_profile_update_self ON public.profiles;
CREATE POLICY tenant_profile_update_self ON public.profiles
    FOR UPDATE TO authenticated
    USING (id = (SELECT auth.uid()))
    WITH CHECK (id = (SELECT auth.uid()));

DROP POLICY IF EXISTS tenant_membership_select ON public.company_members;
CREATE POLICY tenant_membership_select ON public.company_members
    FOR SELECT TO authenticated
    USING (company_id = (SELECT public.route_planner_company_id()));

DROP POLICY IF EXISTS tenant_membership_insert_admin ON public.company_members;
CREATE POLICY tenant_membership_insert_admin ON public.company_members
    FOR INSERT TO authenticated
    WITH CHECK (
        company_id = (SELECT public.route_planner_company_id())
        AND (SELECT public.route_planner_has_role(ARRAY['admin']::text[]))
    );

DROP POLICY IF EXISTS tenant_membership_update_admin ON public.company_members;
CREATE POLICY tenant_membership_update_admin ON public.company_members
    FOR UPDATE TO authenticated
    USING (
        company_id = (SELECT public.route_planner_company_id())
        AND (SELECT public.route_planner_has_role(ARRAY['admin']::text[]))
    )
    WITH CHECK (company_id = (SELECT public.route_planner_company_id()));

DROP POLICY IF EXISTS tenant_membership_delete_admin ON public.company_members;
CREATE POLICY tenant_membership_delete_admin ON public.company_members
    FOR DELETE TO authenticated
    USING (
        company_id = (SELECT public.route_planner_company_id())
        AND user_id <> (SELECT auth.uid())
        AND (SELECT public.route_planner_has_role(ARRAY['admin']::text[]))
    );

DROP POLICY IF EXISTS tenant_vehicles_select ON public.vehicles;
CREATE POLICY tenant_vehicles_select ON public.vehicles
    FOR SELECT TO authenticated
    USING (company_id = (SELECT public.route_planner_company_id()));

DROP POLICY IF EXISTS tenant_vehicles_manage ON public.vehicles;
CREATE POLICY tenant_vehicles_manage ON public.vehicles
    FOR ALL TO authenticated
    USING (
        company_id = (SELECT public.route_planner_company_id())
        AND (SELECT public.route_planner_has_role(ARRAY['admin', 'planner']::text[]))
    )
    WITH CHECK (
        company_id = (SELECT public.route_planner_company_id())
        AND (SELECT public.route_planner_has_role(ARRAY['admin', 'planner']::text[]))
    );

DROP POLICY IF EXISTS tenant_operators_select ON public.operators;
CREATE POLICY tenant_operators_select ON public.operators
    FOR SELECT TO authenticated
    USING (company_id = (SELECT public.route_planner_company_id()));

DROP POLICY IF EXISTS tenant_operators_manage ON public.operators;
CREATE POLICY tenant_operators_manage ON public.operators
    FOR ALL TO authenticated
    USING (
        company_id = (SELECT public.route_planner_company_id())
        AND (SELECT public.route_planner_has_role(ARRAY['admin', 'planner']::text[]))
    )
    WITH CHECK (
        company_id = (SELECT public.route_planner_company_id())
        AND (SELECT public.route_planner_has_role(ARRAY['admin', 'planner']::text[]))
    );

DROP POLICY IF EXISTS tenant_locations_select ON public.locations;
CREATE POLICY tenant_locations_select ON public.locations
    FOR SELECT TO authenticated
    USING (company_id = (SELECT public.route_planner_company_id()));

DROP POLICY IF EXISTS tenant_locations_manage ON public.locations;
CREATE POLICY tenant_locations_manage ON public.locations
    FOR ALL TO authenticated
    USING (
        company_id = (SELECT public.route_planner_company_id())
        AND (SELECT public.route_planner_has_role(ARRAY['admin', 'planner']::text[]))
    )
    WITH CHECK (
        company_id = (SELECT public.route_planner_company_id())
        AND (SELECT public.route_planner_has_role(ARRAY['admin', 'planner']::text[]))
    );

DROP POLICY IF EXISTS reference_fuel_prices_select ON public.fuel_prices;
CREATE POLICY reference_fuel_prices_select ON public.fuel_prices
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS reference_emission_factors_select ON public.emission_factors;
CREATE POLICY reference_emission_factors_select ON public.emission_factors
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS tenant_route_plans_select ON public.route_plans;
CREATE POLICY tenant_route_plans_select ON public.route_plans
    FOR SELECT TO authenticated
    USING (company_id = (SELECT public.route_planner_company_id()));

DROP POLICY IF EXISTS tenant_route_plans_insert ON public.route_plans;
CREATE POLICY tenant_route_plans_insert ON public.route_plans
    FOR INSERT TO authenticated
    WITH CHECK (
        company_id = (SELECT public.route_planner_company_id())
        AND created_by = (SELECT auth.uid())
        AND (SELECT public.route_planner_has_role(ARRAY['admin', 'planner']::text[]))
    );

DROP POLICY IF EXISTS tenant_route_plans_update ON public.route_plans;
CREATE POLICY tenant_route_plans_update ON public.route_plans
    FOR UPDATE TO authenticated
    USING (
        company_id = (SELECT public.route_planner_company_id())
        AND (SELECT public.route_planner_has_role(ARRAY['admin', 'planner']::text[]))
    )
    WITH CHECK (company_id = (SELECT public.route_planner_company_id()));

DROP POLICY IF EXISTS tenant_route_plans_delete ON public.route_plans;
CREATE POLICY tenant_route_plans_delete ON public.route_plans
    FOR DELETE TO authenticated
    USING (
        company_id = (SELECT public.route_planner_company_id())
        AND (SELECT public.route_planner_has_role(ARRAY['admin', 'planner']::text[]))
    );

DROP POLICY IF EXISTS tenant_route_stops_select ON public.route_stops;
CREATE POLICY tenant_route_stops_select ON public.route_stops
    FOR SELECT TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.route_plans AS route
        WHERE route.id = route_stops.route_plan_id
          AND route.company_id = (SELECT public.route_planner_company_id())
    ));

DROP POLICY IF EXISTS tenant_route_stops_manage ON public.route_stops;
CREATE POLICY tenant_route_stops_manage ON public.route_stops
    FOR ALL TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.route_plans AS route
        WHERE route.id = route_stops.route_plan_id
          AND route.company_id = (SELECT public.route_planner_company_id())
          AND (SELECT public.route_planner_has_role(ARRAY['admin', 'planner']::text[]))
    ))
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.route_plans AS route
            WHERE route.id = route_stops.route_plan_id
              AND route.company_id = (SELECT public.route_planner_company_id())
              AND (SELECT public.route_planner_has_role(ARRAY['admin', 'planner']::text[]))
        )
        AND (
            location_id IS NULL
            OR EXISTS (
                SELECT 1 FROM public.locations AS location
                WHERE location.id = route_stops.location_id
                  AND location.company_id = (SELECT public.route_planner_company_id())
            )
        )
    );

DROP POLICY IF EXISTS tenant_route_operator_assignments_select ON public.route_operator_assignments;
CREATE POLICY tenant_route_operator_assignments_select ON public.route_operator_assignments
    FOR SELECT TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.route_plans AS route
        WHERE route.id = route_operator_assignments.route_plan_id
          AND route.company_id = (SELECT public.route_planner_company_id())
    ));

DROP POLICY IF EXISTS tenant_route_operator_assignments_manage ON public.route_operator_assignments;
CREATE POLICY tenant_route_operator_assignments_manage ON public.route_operator_assignments
    FOR ALL TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.route_plans AS route
        WHERE route.id = route_operator_assignments.route_plan_id
          AND route.company_id = (SELECT public.route_planner_company_id())
          AND (SELECT public.route_planner_has_role(ARRAY['admin', 'planner']::text[]))
    ))
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.route_plans AS route
            WHERE route.id = route_operator_assignments.route_plan_id
              AND route.company_id = (SELECT public.route_planner_company_id())
              AND (SELECT public.route_planner_has_role(ARRAY['admin', 'planner']::text[]))
        )
        AND EXISTS (
            SELECT 1 FROM public.operators AS operator
            WHERE operator.id = route_operator_assignments.operator_id
              AND operator.company_id = (SELECT public.route_planner_company_id())
        )
    );

DROP POLICY IF EXISTS tenant_route_calculations_select ON public.route_calculations;
CREATE POLICY tenant_route_calculations_select ON public.route_calculations
    FOR SELECT TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.route_plans AS route
        WHERE route.id = route_calculations.route_plan_id
          AND route.company_id = (SELECT public.route_planner_company_id())
    ));

DROP POLICY IF EXISTS tenant_route_calculations_update ON public.route_calculations;
DROP POLICY IF EXISTS tenant_route_calculations_insert ON public.route_calculations;
CREATE POLICY tenant_route_calculations_insert ON public.route_calculations
    FOR INSERT TO authenticated
    WITH CHECK (
        calculated_by = (SELECT auth.uid())
        AND (SELECT public.route_planner_has_role(ARRAY['admin', 'planner']::text[]))
        AND EXISTS (
            SELECT 1
            FROM public.route_plans AS route
            JOIN public.vehicles AS vehicle
              ON vehicle.id = route_calculations.vehicle_id
             AND vehicle.company_id = route.company_id
            WHERE route.id = route_calculations.route_plan_id
              AND route.company_id = (SELECT public.route_planner_company_id())
        )
    );


CREATE OR REPLACE FUNCTION public.persist_osrm_route_calculation(
    p_route_name text,
    p_vehicle_id uuid,
    p_fuel_price_id uuid,
    p_emission_factor_id uuid,
    p_distance_meters double precision,
    p_duration_seconds double precision,
    p_geometry jsonb,
    p_ordered_stops jsonb
)
RETURNS TABLE (route_id uuid, route_code text, calculation_id uuid)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
    v_company_id uuid := public.route_planner_company_id();
    v_vehicle public.vehicles%ROWTYPE;
    v_fuel_price public.fuel_prices%ROWTYPE;
    v_emission_factor public.emission_factors%ROWTYPE;
    v_route_geometry extensions.geometry(LineString, 4326);
    v_route_plan_id uuid;
    v_route_code text;
    v_calculation_id uuid;
    v_route_name text := nullif(trim(p_route_name), '');
    v_stop jsonb;
    v_location_id uuid;
    v_stop_type text;
    v_sequence integer := 0;
    v_origin_count integer := 0;
    v_destination_count integer := 0;
    v_stop_count integer;
    v_efficiency numeric(12,4);
    v_distance_km numeric(14,3);
    v_duration_minutes numeric(14,2);
    v_fuel_liters numeric(14,4);
    v_cost numeric(14,2);
    v_emissions numeric(14,4);
    v_location record;
BEGIN
    IF v_company_id IS NULL
       OR NOT public.route_planner_has_role(ARRAY['admin', 'planner']::text[]) THEN
        RAISE EXCEPTION 'An active company planner role is required'
            USING ERRCODE = '42501';
    END IF;

    IF v_route_name IS NULL OR length(v_route_name) > 160 THEN
        RAISE EXCEPTION 'Route name must contain 1 to 160 characters';
    END IF;

    IF p_distance_meters IS NULL OR p_distance_meters < 0
       OR p_distance_meters::text IN ('NaN', 'Infinity', '-Infinity')
       OR p_duration_seconds IS NULL OR p_duration_seconds < 0
       OR p_duration_seconds::text IN ('NaN', 'Infinity', '-Infinity') THEN
        RAISE EXCEPTION 'Route distance and duration must be finite non-negative values';
    END IF;

    IF jsonb_typeof(p_ordered_stops) <> 'array' THEN
        RAISE EXCEPTION 'Ordered stops must be a JSON array';
    END IF;
    v_stop_count := jsonb_array_length(p_ordered_stops);
    IF v_stop_count < 2 OR v_stop_count > 12 THEN
        RAISE EXCEPTION 'A route must contain 2 to 12 ordered stops';
    END IF;

     IF p_geometry IS NULL
         OR jsonb_typeof(p_geometry) <> 'object'
       OR p_geometry ->> 'type' <> 'LineString' THEN
        RAISE EXCEPTION 'OSRM route geometry must be a GeoJSON LineString';
    END IF;
    v_route_geometry := extensions.ST_SetSRID(
        extensions.ST_GeomFromGeoJSON(p_geometry::text),
        4326
    )::extensions.geometry(LineString, 4326);
    IF extensions.ST_NPoints(v_route_geometry) < 2
       OR extensions.ST_NPoints(v_route_geometry) > 50000
       OR NOT extensions.ST_IsValid(v_route_geometry)
       OR extensions.ST_XMin(v_route_geometry) < -180
       OR extensions.ST_XMax(v_route_geometry) > 180
       OR extensions.ST_YMin(v_route_geometry) < -90
       OR extensions.ST_YMax(v_route_geometry) > 90 THEN
        RAISE EXCEPTION 'OSRM route geometry has invalid point count or geographic bounds';
    END IF;

    SELECT vehicle.*
      INTO v_vehicle
      FROM public.vehicles AS vehicle
     WHERE vehicle.id = p_vehicle_id
       AND vehicle.company_id = v_company_id
       AND vehicle.status IN ('available', 'assigned');
    IF NOT FOUND THEN
        RAISE EXCEPTION 'The selected vehicle is unavailable or does not belong to this company'
            USING ERRCODE = '42501';
    END IF;

    SELECT price.*
      INTO v_fuel_price
      FROM public.fuel_prices AS price
     WHERE price.id = p_fuel_price_id
       AND price.fuel_type = v_vehicle.fuel_type
       AND price.is_active = true
       AND price.valid_from <= now()
       AND (price.valid_to IS NULL OR price.valid_to > now())
     ORDER BY price.valid_from DESC
     LIMIT 1;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'No current fuel price exists for this vehicle fuel type';
    END IF;

    SELECT factor.*
      INTO v_emission_factor
      FROM public.emission_factors AS factor
     WHERE factor.id = p_emission_factor_id
       AND factor.fuel_type = v_vehicle.fuel_type
       AND factor.is_active = true
       AND factor.valid_from <= now()
       AND (factor.valid_to IS NULL OR factor.valid_to > now())
     ORDER BY factor.valid_from DESC
     LIMIT 1;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'No current emission factor exists for this vehicle fuel type';
    END IF;

    IF (p_ordered_stops -> 0 ->> 'stop_type') <> 'origin'
       OR (p_ordered_stops -> (v_stop_count - 1) ->> 'stop_type') <> 'destination' THEN
        RAISE EXCEPTION 'The first stop must be origin and the last stop must be destination';
    END IF;

    SELECT count(*) FILTER (WHERE stop_item.value ->> 'stop_type' = 'origin'),
           count(*) FILTER (WHERE stop_item.value ->> 'stop_type' = 'destination')
      INTO v_origin_count, v_destination_count
      FROM jsonb_array_elements(p_ordered_stops) AS stop_item(value);
    IF v_origin_count <> 1 OR v_destination_count <> 1 THEN
        RAISE EXCEPTION 'A route must have exactly one origin and one destination';
    END IF;

    v_route_code := 'OSRM-' || to_char(now() AT TIME ZONE 'America/El_Salvador', 'YYYYMMDD')
        || '-' || upper(substr(gen_random_uuid()::text, 1, 8));

    INSERT INTO public.route_plans (
        company_id,
        vehicle_id,
        route_code,
        name,
        status,
        optimization_mode,
        stop_order_source,
        created_by
    )
    VALUES (
        v_company_id,
        p_vehicle_id,
        v_route_code,
        v_route_name,
        'draft',
        'osrm_trip_recommended_order',
        'optimized',
        auth.uid()
    )
    RETURNING id INTO v_route_plan_id;

    FOR v_stop IN SELECT stop_item.value FROM jsonb_array_elements(p_ordered_stops) AS stop_item(value)
    LOOP
        v_stop_type := v_stop ->> 'stop_type';
        IF v_stop_type NOT IN ('origin', 'waypoint', 'destination') THEN
            RAISE EXCEPTION 'Unsupported route stop type';
        END IF;

        v_location_id := (v_stop ->> 'location_id')::uuid;
        SELECT location.name,
               location.address,
               location.latitude,
               location.longitude,
               location.average_service_minutes
          INTO v_location
          FROM public.locations AS location
         WHERE location.id = v_location_id
           AND location.company_id = v_company_id
           AND location.is_active = true;
        IF NOT FOUND THEN
            RAISE EXCEPTION 'A route stop is inactive or does not belong to this company'
                USING ERRCODE = '42501';
        END IF;

        INSERT INTO public.route_stops (
            route_plan_id,
            location_id,
            stop_type,
            sequence_number,
            name_snapshot,
            address_snapshot,
            latitude,
            longitude,
            service_duration_minutes
        )
        VALUES (
            v_route_plan_id,
            v_location_id,
            v_stop_type,
            v_sequence,
            v_location.name,
            v_location.address,
            v_location.latitude,
            v_location.longitude,
            v_location.average_service_minutes
        );
        v_sequence := v_sequence + 1;
    END LOOP;

    v_efficiency := v_vehicle.fuel_efficiency_km_per_liter;
    v_distance_km := round((p_distance_meters / 1000)::numeric, 3);
    v_duration_minutes := round((p_duration_seconds / 60)::numeric, 2);
    v_fuel_liters := round(v_distance_km / v_efficiency, 4);
    v_cost := round(v_fuel_liters * v_fuel_price.price_per_liter, 2);
    v_emissions := round(v_fuel_liters * v_emission_factor.factor_value, 4);

    INSERT INTO public.route_calculations (
        route_plan_id,
        vehicle_id,
        fuel_price_id,
        emission_factor_id,
        calculation_version,
        routing_provider,
        routing_profile,
        estimated_distance_km,
        estimated_duration_minutes,
        vehicle_efficiency_snapshot,
        estimated_fuel_liters,
        fuel_unit_price_snapshot,
        estimated_fuel_cost,
        emission_factor_snapshot,
        estimated_emissions_kg_co2e,
        route_geometry,
        provider_response,
        is_current,
        calculated_by
    )
    VALUES (
        v_route_plan_id,
        p_vehicle_id,
        v_fuel_price.id,
        v_emission_factor.id,
        1,
        'OSRM',
        'driving',
        v_distance_km,
        v_duration_minutes,
        v_efficiency,
        v_fuel_liters,
        v_fuel_price.price_per_liter,
        v_cost,
        v_emission_factor.factor_value,
        v_emissions,
        v_route_geometry,
        jsonb_build_object('code', 'Ok', 'service', 'trip', 'profile', 'driving'),
        true,
        auth.uid()
    )
    RETURNING id INTO v_calculation_id;

    UPDATE public.route_plans
       SET status = 'calculated',
           updated_at = now()
     WHERE id = v_route_plan_id;

    RETURN QUERY SELECT v_route_plan_id, v_route_code, v_calculation_id;
END;
$$;

REVOKE ALL ON FUNCTION public.persist_osrm_route_calculation(
    text, uuid, uuid, uuid, double precision, double precision, jsonb, jsonb
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.persist_osrm_route_calculation(
    text, uuid, uuid, uuid, double precision, double precision, jsonb, jsonb
) TO authenticated;