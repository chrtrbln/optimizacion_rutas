-- Run in the Supabase SQL Editor after supabase_create_tables.sql.
-- First create a dedicated test user in Supabase Auth and replace the email below.
-- This script creates no Auth user/password and will not move a user from another company.

DO $seed$
DECLARE
    v_test_email text := 'test.admin@example.com';
    v_test_full_name text := 'Administrador de Prueba';
    v_user_id uuid;
    v_company_id uuid;
    v_existing_company_id uuid;
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
            'This Auth user already belongs to another company. Use a dedicated test user to avoid changing tenant membership.';
    END IF;

    INSERT INTO public.profiles (id, full_name, phone, status)
    VALUES (v_user_id, v_test_full_name, '+503 7000-0001', 'active')
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

    RAISE NOTICE 'Test company and admin membership are ready (company id: %).', v_company_id;
END;
$seed$;

SELECT
    company.id AS company_id,
    company.name AS company_name,
    profile.id AS user_id,
    profile.full_name,
    membership.role,
    membership.is_active
FROM public.companies AS company
JOIN public.company_members AS membership ON membership.company_id = company.id
JOIN public.profiles AS profile ON profile.id = membership.user_id
WHERE company.tax_identifier = 'TEST-ROUTE-001';