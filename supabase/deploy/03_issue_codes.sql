-- ============================================================================
-- WJIncubator — ACCESS CODES (step 3 of 3)
-- ============================================================================
--   *** THE CODES ARE SHOWN ONCE. COPY THE RESULT BEFORE LEAVING THIS PAGE. ***
--
-- Codes are stored as bcrypt hashes and cannot be read back afterwards. If a
-- company loses its code, reset it from Admin -> الشركات, which reveals a new
-- one once.
--
-- Only startups WITHOUT a code are touched, so re-running will not invalidate
-- codes already handed out.
-- ============================================================================

-- ============================================================================
-- SEED — Issue startup access codes
-- ============================================================================
-- The 19 private codes appear in NO source file, so they are not invented in a
-- seed — they are generated here, hashed immediately, and printed ONCE for the
-- organiser to distribute.
--
--   psql ... -f supabase/seed/05_issue_codes.sql
--
-- Only startups that do not already have a code are touched, so re-running is
-- safe and will not invalidate codes already handed out.
--
-- If you have your own list instead, skip this file and call
-- admin_set_startup_code(startup_id, '1234') per company.
--
-- Codes are stored as bcrypt hashes and CANNOT be read back afterwards. That
-- is deliberate: a readable credential column is a liability, and
-- reset-and-reveal covers the real support case ("we lost our code").
-- Capture this output when you run it.
-- ============================================================================


create temp table issued (slug text, name_ar text, code text);

do $$
declare
  r      record;
  v_rand bytea;
  v_code text;
begin
  for r in select id, slug, name_ar from public.startups
            where access_code_hash is null order by sort_order loop
    -- Retry until the code is unused, so no two companies share one.
    loop
      v_rand := extensions.gen_random_bytes(3);
      v_code := lpad(((get_byte(v_rand,0)::int * 65536
                     + get_byte(v_rand,1)::int * 256
                     + get_byte(v_rand,2)::int) % 10000)::text, 4, '0');
      exit when not exists (select 1 from issued i where i.code = v_code);
    end loop;

    update public.startups
       set access_code_hash = extensions.crypt(v_code, extensions.gen_salt('bf', 10))
     where id = r.id;

    insert into issued values (r.slug, r.name_ar, v_code);
  end loop;
end $$;

select name_ar as "الشركة", slug, code as "الرمز السري" from issued order by slug;

select case
  when count(*) = 0 then 'No new codes issued — every startup already had one.'
  else count(*) || ' codes issued. This is the ONLY time they are shown — save them now.'
end as note
from issued;
