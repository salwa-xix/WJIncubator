-- ============================================================================
-- SEED — Mentor organizations
-- ============================================================================
-- The organisation logos printed beneath each mentor card in the source file.
-- Names transcribed exactly as they appear (mixed Arabic/Latin is intentional —
-- the deck prints them that way).
--
-- Rebuilt wholesale on each run so a corrected source file cannot leave stale
-- rows behind. Safe: nothing references these by id.
-- ============================================================================

delete from public.mentor_organizations;

insert into public.mentor_organizations (mentor_id, org_name, sort_order)
select m.id, v.org_name, v.sort_order
from (values
  ('basma-khoja',          'اتحاد الغرف التجارية السعودية', 1),
  ('basma-khoja',          'The Business Family House',     2),

  ('anas-alsufyani',       'ستارتر',                        1),
  ('anas-alsufyani',       'Eradah Studio',                 2),

  ('abduljawad-chowdhry',  'أثير',                          1),
  ('abduljawad-chowdhry',  'EO Jeddah',                     2),

  ('abdullah-nobar',       'Lendoors',                      1),
  ('abdullah-nobar',       'Misk Entrepreneurship',         2),

  ('muna-balhamar',        'حر',                            1),
  ('muna-balhamar',        'Passioneurs Co',                2),

  ('khalid-alkhudair',     'أثير',                          1),
  ('khalid-alkhudair',     'EO Jeddah',                     2),

  ('abdullah-alqahtani',   'منجز',                          1),
  ('abdullah-alqahtani',   'Pure Consulting',               2),

  ('yazeed-almutairi',     'وادي جدة',                      1),
  ('yazeed-almutairi',     'Elvira Technology',             2),

  ('sultan-alzahoufi',     'Grintafy',                      1),
  ('sultan-alzahoufi',     'SportLOOP',                     2),

  ('mohammed-almashjari',  'أنترفلو',                       1),

  ('ahmed-alzubairi',      'SARsatX',                       1),

  ('amin-ramadan',         'مجموعة عزوة الدعم القابضة',     1),
  ('amin-ramadan',         'Yaqteen Technologies',          2),

  ('adel-alsaedi',         'Qewam',                         1),
  ('adel-alsaedi',         'Operater',                      2),

  ('omran-yousef',         'MOZN',                          1),
  ('omran-yousef',         'Tabby',                         2),
  ('omran-yousef',         'D360',                          3)
) as v(mentor_slug, org_name, sort_order)
join public.mentors m on m.slug = v.mentor_slug;
