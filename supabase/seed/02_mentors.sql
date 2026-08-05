-- ============================================================================
-- SEED — Mentors
-- ============================================================================
-- Sources of truth:
--   • مرشدين المعسكر.pdf (4 pages, 14 mentor cards)      → sort_order 1–14
--   • Company.pdf        (pages 2–4, 3 mentor cards)      → sort_order 15–17
--
-- All 17 profiles are seeded. Which of them take part in a given event is an
-- ADMIN decision recorded in session_mentors — never a filter applied here,
-- and never inferred from availability_label.
--
-- `availability_label` is display metadata only; no code branches on it. It was
-- transcribed verbatim from the decks, but "فترتين" and "السبت" are dropped at
-- the organiser's request — they are internal scheduling shorthand and read as
-- noise on a public mentor card, especially now that the card sits directly
-- above the real generated slot times. NULL renders as nothing.
--
-- "الخميس 5–7" is deliberately KEPT (5 mentors): it names an actual time rather
-- than a planning bucket. Drop it the same way if that changes.
--
-- Data-quality issues in the sources, carried over UNCHANGED and flagged
-- rather than silently corrected:
--   1. Six mentors share two duplicated placeholder bios (شودري/الخضير/المشجري
--      and القحطاني/الزبيري/يوسف). They read as unfilled template copy.
--   2. "سلطلن الزحوفي" is very likely a typo for "سلطان". Seeded as printed.
--   3. Company.pdf prints no availability for its three mentors and no bio at
--      all for معاذ العديمي — left NULL rather than invented. The card renders
--      both as optional, so a NULL simply prints nothing.
-- Correcting any of these is a content decision for the organiser, not ours.
--
-- Company.pdf's unhamzated spellings ("ادفانس", "الاسترالية", "الادارة",
-- "للإبتكار") are kept as printed. What IS repaired is that file's broken text
-- layer: it emits lam-alef ligatures reversed and floats the fathatan of
-- "ايضاً" to the head of its line. Those are extraction defects, not content.
--
-- image_url is populated by the asset extraction script, so no row ever points
-- at a file that does not exist yet.
-- ============================================================================

insert into public.mentors (sort_order, slug, name_ar, availability_label, bio)
values
  (1, 'basma-khoja', 'د. بسمة خوجة', 'الخميس 5–7',
   'مديرة حاضنات ومسرّعات الأعمال في جامعة الملك عبدالعزيز، ومستشارة في وادي جدة.'),

  (2, 'anas-alsufyani', 'أنس السفياني', 'الخميس 5–7',
   'رائد أعمال متسلسل بخبرة تتجاوز ١٣ عامًا في تأسيس المشاريع، متخصص في نماذج الأعمال والتحقق من الأفكار واستراتيجيات النمو والاستثمار المبكر.'),

  (3, 'abduljawad-chowdhry', 'عبدالجواد شودري', null,
   'رائد أعمال تقني في مجال الموارد المؤسساتية والتقنيات الصحية.'),

  (4, 'abdullah-nobar', 'عبدالله نوبار', null,
   'قبل سنة كنت أكره الـAI واليوم أنا مهندس ذكاء اصطناعي، وأغلب عملي يصير عبر الـAI Agents، مو مجرد ديمو، هذي طريقتي الأساسية في البناء.'),

  (5, 'muna-balhamar', 'منى بلحمر', null,
   'رائدة أعمال ومستثمرة، تمتلك خبرة واسعة في ريادة الأعمال، وبناء الشركات، وتطوير نماذج الأعمال والاستراتيجيات، كما تركز على دعم الاقتصاد الحر وتمكين الكفاءات المحلية.'),

  (6, 'khalid-alkhudair', 'خالد الخضير', null,
   'رائد أعمال تقني في مجال الموارد المؤسساتية والتقنيات الصحية.'),

  (7, 'abdullah-alqahtani', 'عبدالله القحطاني', 'الخميس 5–7',
   'مستشار استراتيجي في القطاعين العام والخاص، ورائد أعمال شغوف ببناء منتجات وشركات ذات أثر واسع تسهم في تمكين الأفراد، مع التركيز على ابتكار حلول مستدامة تدعم التنمية وتعزز الأثر الاقتصادي والاجتماعي.'),

  (8, 'yazeed-almutairi', 'يزيد المطيري', null,
   'أخصائي أول تطوير أعمال في وادي جدة، ورائد أعمال سابق في قطاع التقنية العميقة.'),

  (9, 'sultan-alzahoufi', 'سلطلن الزحوفي', null,
   'خبرة قيادية ١٣ سنة في أرامكو ومع أبرز الشركات الناشئة الرياضية، بالإضافة إلى خبرات في التشغيل والتطوير وبناء نماذج أعمال مع التركيز على تحقيق الإيرادات.'),

  (10, 'mohammed-almashjari', 'محمد المشجري', null,
   'رائد أعمال تقني في مجال الموارد المؤسساتية والتقنيات الصحية.'),

  (11, 'ahmed-alzubairi', 'أحمد الزبيري', 'الخميس 5–7',
   'مستشار استراتيجي في القطاعين العام والخاص، ورائد أعمال شغوف ببناء منتجات وشركات ذات أثر واسع تسهم في تمكين الأفراد، مع التركيز على ابتكار حلول مستدامة تدعم التنمية وتعزز الأثر الاقتصادي والاجتماعي.'),

  (12, 'amin-ramadan', 'امين رمضان', null,
   'الشريك الإداري في مجموعة عزوة الدعم القابضة، وهي استوديو مؤسسي لبناء الشركات يعمل على تأسيس الشركات وهيكلتها وفق المعايير التي يعترف بها رأس المال المؤسسي.'),

  (13, 'adel-alsaedi', 'عادل الصاعدي', null,
   'قيادي في مجال الابتكار والتقنية، بخبرة طويلة في بناء المشاريع الناشئة والمنتجات المدعومة بالذكاء الاصطناعي.'),

  (14, 'omran-yousef', 'عمران يوسف', 'الخميس 5–7',
   'مستشار استراتيجي في القطاعين العام والخاص، ورائد أعمال شغوف ببناء منتجات وشركات ذات أثر واسع تسهم في تمكين الأفراد، مع التركيز على ابتكار حلول مستدامة تدعم التنمية وتعزز الأثر الاقتصادي والاجتماعي.'),

  -- ---- Company.pdf, in page order (pages 2, 3, 4) --------------------------
  (15, 'sultan-alhayani', 'د. سلطان الحياني', null,
   'المؤسس والرئيس التنفيذي لشركة بيور ادفانس، يشغل ايضاً منصب مستشار قطاع التقنية الحيوية في مجمع وادي جدة للإبتكار، وأستاذ مشارك في الكيمياء الحيوية بجامعة الملك عبدالعزيز، حاصل على درجة الدكتوراه في كيمياء المناعة من جامعة موناش الاسترالية و ماجستير الادارة العامة من جامعة هارفارد.'),

  -- The source page carries this name and nothing else — no bio, no portrait.
  (16, 'muath-aladimi', 'معاذ العديمي', null, null),

  -- Three bullet points on the source page, joined into the single bio field.
  (17, 'abdulrahman-hariri', 'د. عبدالرحمن حريري', null,
   'مؤسس Innovation Ventures، وهي شركة تعنى بتطوير حلول وبرامج فريدة لخدمة منظومة الابتكار وريادة الأعمال. مطوّر حلول تقنية باستخدام تقنيات وأدوات No Code و No Code Ai. مؤسس Payflowly، وهي خدمة تُمكّن الشركات الناشئة من تطوير واختبار الربط ببوابات الدفع وتقديم خدمات أخرى ذات قيمة، مع دمج سريع مع بوابات الدفع الرائدة.')

on conflict (slug) do update set
  sort_order         = excluded.sort_order,
  name_ar            = excluded.name_ar,
  availability_label = excluded.availability_label,
  bio                = excluded.bio;
