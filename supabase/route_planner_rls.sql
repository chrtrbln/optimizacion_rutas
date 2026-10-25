-- Run in the Supabase SQL Editor after supabase_create_tables.sql.
-- This enables read access only for the signed-in user's active company.

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

REVOKE ALL ON FUNCTION public.route_planner_company_id() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.route_planner_company_id() TO authenticated;

ALTER TABLE public.company_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON public.company_members, public.locations, public.vehicles TO authenticated;

DROP POLICY IF EXISTS route_planner_read_own_membership ON public.company_members;
CREATE POLICY route_planner_read_own_membership
    ON public.company_members
    FOR SELECT
    TO authenticated
    USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS route_planner_read_company_locations ON public.locations;
CREATE POLICY route_planner_read_company_locations
    ON public.locations
    FOR SELECT
    TO authenticated
    USING (company_id = (SELECT public.route_planner_company_id()));

DROP POLICY IF EXISTS route_planner_read_company_vehicles ON public.vehicles;
CREATE POLICY route_planner_read_company_vehicles
    ON public.vehicles
    FOR SELECT
    TO authenticated
    USING (company_id = (SELECT public.route_planner_company_id()));