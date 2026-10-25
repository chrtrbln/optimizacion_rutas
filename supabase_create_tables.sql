-- Run this script in the Supabase SQL Editor.
-- It creates the prototype schema and enables PostGIS for spatial columns.
-- If PostGIS is already enabled, CREATE EXTENSION IF NOT EXISTS is a no-op.

CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA extensions;

CREATE TABLE public.companies (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    legal_name text,
    tax_identifier text,
    email text,
    phone text,
    address text,
    department text,
    district text,
    currency_code text NOT NULL DEFAULT 'USD' CHECK (currency_code = 'USD'),
    timezone text NOT NULL DEFAULT 'America/El_Salvador' CHECK (timezone = 'America/El_Salvador'),
    status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.profiles (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name text NOT NULL,
    phone text,
    avatar_path text,
    status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'blocked')),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.company_members (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    user_id uuid NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
    role text NOT NULL CHECK (role IN ('admin', 'planner', 'viewer')),
    is_active boolean NOT NULL DEFAULT true,
    joined_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (company_id, user_id)
);

CREATE TABLE public.vehicles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    plate_number text NOT NULL,
    internal_code text,
    brand text,
    model text,
    model_year integer CHECK (model_year IS NULL OR model_year BETWEEN 1886 AND 2200),
    vehicle_type text NOT NULL,
    fuel_type text NOT NULL CHECK (fuel_type IN ('diesel', 'regular_gasoline', 'premium_gasoline')),
    tank_capacity_liters numeric(12,2) CHECK (tank_capacity_liters IS NULL OR tank_capacity_liters >= 0),
    cargo_capacity_kg numeric(12,2) CHECK (cargo_capacity_kg IS NULL OR cargo_capacity_kg >= 0),
    fuel_efficiency_km_per_liter numeric(12,4) NOT NULL CHECK (fuel_efficiency_km_per_liter > 0),
    odometer_km numeric(14,2) CHECK (odometer_km IS NULL OR odometer_km >= 0),
    status text NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'assigned', 'maintenance', 'inactive')),
    notes text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (company_id, plate_number),
    UNIQUE (company_id, id)
);

CREATE TABLE public.operators (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    employee_code text,
    full_name text NOT NULL,
    phone text,
    license_number text,
    license_type text,
    license_expiration date,
    status text NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'assigned', 'inactive')),
    notes text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (company_id, id)
);

CREATE TABLE public.locations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    name text NOT NULL,
    location_type text NOT NULL CHECK (location_type IN ('office', 'warehouse', 'customer', 'supplier', 'pickup_point', 'delivery_point', 'other')),
    address text,
    department text,
    district text,
    latitude double precision NOT NULL CHECK (latitude BETWEEN -90 AND 90),
    longitude double precision NOT NULL CHECK (longitude BETWEEN -180 AND 180),
    geographic_point extensions.geography(Point, 4326) GENERATED ALWAYS AS
        (extensions.ST_SetSRID(extensions.ST_MakePoint(longitude, latitude), 4326)::extensions.geography) STORED,
    contact_name text,
    contact_phone text,
    average_service_minutes integer CHECK (average_service_minutes IS NULL OR average_service_minutes >= 0),
    notes text,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (company_id, id)
);

CREATE TABLE public.fuel_prices (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    fuel_type text NOT NULL CHECK (fuel_type IN ('diesel', 'regular_gasoline', 'premium_gasoline')),
    price_per_liter numeric(12,4) NOT NULL CHECK (price_per_liter >= 0),
    currency_code text NOT NULL DEFAULT 'USD' CHECK (currency_code = 'USD'),
    source_name text NOT NULL,
    source_reference text,
    valid_from timestamptz NOT NULL,
    valid_to timestamptz,
    is_active boolean NOT NULL DEFAULT true,
    created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    CHECK (valid_to IS NULL OR valid_to > valid_from)
);

CREATE TABLE public.emission_factors (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    fuel_type text NOT NULL CHECK (fuel_type IN ('diesel', 'regular_gasoline', 'premium_gasoline')),
    factor_value numeric(12,6) NOT NULL CHECK (factor_value >= 0),
    factor_unit text NOT NULL DEFAULT 'kg_co2e_per_liter' CHECK (factor_unit = 'kg_co2e_per_liter'),
    source_name text NOT NULL,
    source_reference text,
    source_version text,
    valid_from timestamptz NOT NULL,
    valid_to timestamptz,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    CHECK (valid_to IS NULL OR valid_to > valid_from)
);

CREATE TABLE public.route_plans (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    vehicle_id uuid,
    route_code text NOT NULL,
    name text NOT NULL,
    description text,
    status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'calculated', 'scheduled', 'completed', 'cancelled', 'archived')),
    scheduled_date date,
    scheduled_start_time time,
    optimization_mode text NOT NULL DEFAULT 'shortest_distance',
    stop_order_source text NOT NULL DEFAULT 'manual' CHECK (stop_order_source IN ('manual', 'optimized')),
    created_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    notes text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (company_id, route_code),
    UNIQUE (company_id, id),
    FOREIGN KEY (company_id, vehicle_id) REFERENCES public.vehicles(company_id, id)
);

CREATE TABLE public.route_stops (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    route_plan_id uuid NOT NULL REFERENCES public.route_plans(id) ON DELETE CASCADE,
    location_id uuid REFERENCES public.locations(id) ON DELETE SET NULL,
    stop_type text NOT NULL CHECK (stop_type IN ('origin', 'waypoint', 'destination')),
    sequence_number integer NOT NULL CHECK (sequence_number >= 0),
    name_snapshot text NOT NULL,
    address_snapshot text,
    latitude double precision NOT NULL CHECK (latitude BETWEEN -90 AND 90),
    longitude double precision NOT NULL CHECK (longitude BETWEEN -180 AND 180),
    geographic_point extensions.geography(Point, 4326) GENERATED ALWAYS AS
        (extensions.ST_SetSRID(extensions.ST_MakePoint(longitude, latitude), 4326)::extensions.geography) STORED,
    estimated_arrival_at timestamptz,
    service_duration_minutes integer CHECK (service_duration_minutes IS NULL OR service_duration_minutes >= 0),
    distance_from_previous_km numeric(12,3) CHECK (distance_from_previous_km IS NULL OR distance_from_previous_km >= 0),
    duration_from_previous_minutes numeric(12,2) CHECK (duration_from_previous_minutes IS NULL OR duration_from_previous_minutes >= 0),
    notes text,
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (route_plan_id, sequence_number)
);

CREATE TABLE public.route_operator_assignments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    route_plan_id uuid NOT NULL REFERENCES public.route_plans(id) ON DELETE CASCADE,
    operator_id uuid NOT NULL REFERENCES public.operators(id) ON DELETE RESTRICT,
    assignment_role text NOT NULL CHECK (assignment_role IN ('primary_driver', 'assistant', 'relief_driver')),
    assigned_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (route_plan_id, operator_id)
);

CREATE TABLE public.route_calculations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    route_plan_id uuid NOT NULL REFERENCES public.route_plans(id) ON DELETE CASCADE,
    vehicle_id uuid NOT NULL REFERENCES public.vehicles(id) ON DELETE RESTRICT,
    fuel_price_id uuid NOT NULL REFERENCES public.fuel_prices(id) ON DELETE RESTRICT,
    emission_factor_id uuid NOT NULL REFERENCES public.emission_factors(id) ON DELETE RESTRICT,
    calculation_version integer NOT NULL CHECK (calculation_version > 0),
    routing_provider text NOT NULL,
    routing_profile text,
    estimated_distance_km numeric(14,3) NOT NULL CHECK (estimated_distance_km >= 0),
    estimated_duration_minutes numeric(14,2) NOT NULL CHECK (estimated_duration_minutes >= 0),
    vehicle_efficiency_snapshot numeric(12,4) NOT NULL CHECK (vehicle_efficiency_snapshot > 0),
    estimated_fuel_liters numeric(14,4) NOT NULL CHECK (estimated_fuel_liters >= 0),
    fuel_unit_price_snapshot numeric(12,4) NOT NULL CHECK (fuel_unit_price_snapshot >= 0),
    estimated_fuel_cost numeric(14,2) NOT NULL CHECK (estimated_fuel_cost >= 0),
    emission_factor_snapshot numeric(12,6) NOT NULL CHECK (emission_factor_snapshot >= 0),
    estimated_emissions_kg_co2e numeric(14,4) NOT NULL CHECK (estimated_emissions_kg_co2e >= 0),
    encoded_polyline text,
    route_geometry extensions.geometry(LineString, 4326),
    provider_response jsonb,
    is_current boolean NOT NULL DEFAULT true,
    calculated_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    calculated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (route_plan_id, calculation_version)
);

CREATE UNIQUE INDEX route_calculations_one_current_per_route
    ON public.route_calculations(route_plan_id) WHERE is_current;

CREATE INDEX locations_geographic_point_gist
    ON public.locations USING gist (geographic_point);

CREATE INDEX route_stops_geographic_point_gist
    ON public.route_stops USING gist (geographic_point);

CREATE INDEX route_calculations_route_geometry_gist
    ON public.route_calculations USING gist (route_geometry);

CREATE INDEX company_members_user_active_idx ON public.company_members(user_id) WHERE is_active;
CREATE INDEX vehicles_company_status_idx ON public.vehicles(company_id, status);
CREATE INDEX operators_company_status_idx ON public.operators(company_id, status);
CREATE INDEX locations_company_active_idx ON public.locations(company_id, is_active);
CREATE INDEX route_plans_company_status_idx ON public.route_plans(company_id, status);
CREATE INDEX route_stops_route_idx ON public.route_stops(route_plan_id, sequence_number);
CREATE INDEX route_operator_assignments_route_idx ON public.route_operator_assignments(route_plan_id);
CREATE INDEX route_calculations_route_idx ON public.route_calculations(route_plan_id, calculated_at DESC);

-- Enable RLS and add company-scoped policies before using these tables from client applications.
