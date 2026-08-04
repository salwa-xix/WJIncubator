-- ============================================================================
-- WJIncubator — DATA (step 2 of 3)
-- ============================================================================
-- Startups, mentors, mentor organisations, image URLs, and ONE draft session.
-- Every value is transcribed from the two source PDFs.
--
-- The session is created in `draft` with NO date, NO assigned mentors and NO
-- slots. Those are admin decisions made in the UI -- the session physically
-- cannot be opened without a date (sessions_open_needs_date).
--
-- Idempotent: re-running updates profiles in place and never duplicates.
-- Access codes are NOT set here -- that is step 3.
-- ============================================================================

-- ==================== 01_startups.sql ====================
-- ============================================================================
-- SEED — Startups
-- ============================================================================
-- Source of truth: Incubator_Startup_Profiles.pdf (19 pages, one per company).
-- Every field below is transcribed verbatim from that file. Nothing invented.
--
-- NOT set here: access_code_hash. Codes do not exist in any source file, so
-- they are issued separately (see scripts/issue-codes.ts or
-- admin_reset_startup_code). Seeding a roster and issuing credentials are
-- deliberately different steps.
--
-- NOT set here: logo_url / founder photos — populated by the asset extraction
-- script so nothing ever points at a file that does not exist yet.
--
-- Idempotent: re-running updates the profile text and leaves codes untouched.
-- ============================================================================

insert into public.startups
  (sort_order, slug, name_ar, name_en, founder_name, founder_role, stage, hq, linkedin_url, sector, description)
values
  (1, 'mabien', 'مبين', 'Mabien', 'طلال الباز', 'المؤسس',
   'النموذج الأولي', 'الرياض', 'https://linkedin.com/in/dr-talal-albaz', 'قطاع الذكاء الاصطناعي',
   'شركة سعودية متخصصة في الذكاء الاصطناعي وتقنيات التأمين، تطوّر منظومة وكلاء ذكاء اصطناعي لأتمتة قرارات الموافقات والمطالبات الطبية ورفع دقتها وكفاءتها.'),

  (2, 'nanoclean', 'نانوكلين', 'NanoClean', 'عبدالله مهراب', 'المؤسس',
   'النموذج الأولي', 'جدة', 'https://linkedin.com/in/abdallah-mohrab', 'قطاع الذكاء الاصطناعي',
   'شركة ناشئة بيئية وتقنية تطوّر عوامة ذكية تجمع النفط المتسرب من البحر وتحوّله إلى وقود حيوي باستخدام تقنيات النانو والذكاء الاصطناعي، دعمًا للاستدامة والاقتصاد الدائري.'),

  (3, 'groupz', 'قروبز', 'Groupz', 'عمرو القاضي', 'المؤسس',
   'الإطلاق المبكر', 'الرياض', 'https://linkedin.com/in/amr123', 'قطاع الذكاء الاصطناعي',
   'منصة شراء جماعي تربط التجار بالموردين، وتوفر إدارة للطلبات وأدوات تواصل ودفعًا مرنًا وتمويلًا يساعد التجار على تنفيذ طلباتهم ويزيد مبيعات الموردين.'),

  (4, 'mustahaq', 'مستحق', 'Mustahaq', 'حاتم العتيبي', 'المؤسس',
   'الإطلاق المبكر', 'الدمام', 'https://linkedin.com/in/hatem-alotaibi', 'قطاع الذكاء الاصطناعي',
   'تخدم المقاولين والموردين في المشاريع الحكومية، وتحل مشكلة تأخر السيولة عبر البيع الآجل حتى ١٨٠ يومًا دون قروض أو فوائد، مع إدارة كاملة لعمليات التوريد.'),

  (5, 'thella', 'ظِلَّة', 'Thella', 'ماجد الدسوقي', 'المؤسس',
   'النموذج الأولي', 'الرياض', 'https://linkedin.com/in/majiddasuqi', 'قطاع التقنيات الحيوية والصحية',
   'حقيبة مبتكرة تجمع الحماية والتبريد والراحة في نظام واحد قابل للارتداء، يضم مظلة متعددة الوظائف تعمل بالطاقة الشمسية ومبرّدًا مائيًا وكرسيًا قابلًا للطي.'),

  (6, 'senoz-ai', 'سينوز', 'Senoz AI', 'وليد السنوسي', 'المؤسس',
   'الإطلاق المبكر', 'الرياض', 'https://linkedin.com/in/waleed-elsenoucy', 'قطاع التقنيات الحيوية والصحية',
   'شركة سعودية ناشئة تطوّر منصة تعتمد على التعلم العميق لمساعدة الأطباء في تحليل صور الأشعة الطبية والكشف المبكر عن الأمراض ورفع دقة التشخيص.'),

  (7, 'wound-care-ai', 'وند كير', 'Wound Care AI', 'د. عبدالله المحيميد', 'المؤسس',
   'الإطلاق المبكر', 'الرياض', 'https://linkedin.com/in/abdullah-almuhaimeed', 'قطاع التقنيات الحيوية والصحية',
   'منصة وتطبيق يعتمدان على الذكاء الاصطناعي لتحليل صور الجروح ومتابعة تطورها، مع تركيز على جروح القدم السكرية والجروح المزمنة، لدعم الرعاية عن بُعد والاكتشاف المبكر للمضاعفات.'),

  (8, 'dithar', 'دِثار', 'Dithar', 'ريناس مرير', 'المؤسسة',
   'النموذج الأولي', 'جدة', 'https://linkedin.com/in/rinas-abdullah', 'قطاع التقنيات الحيوية والصحية',
   'شركة تقنية صحية سعودية تطوّر نعلًا ذكيًا ومنصة مدعومة بالذكاء الاصطناعي لمتابعة المرضى بعد الخروج من المستشفى، وتحليل المؤشرات الحركية للكشف المبكر عن أي تراجع في الحالة.'),

  (9, 'medirect', 'ميد دايركت', 'MEDirect', 'الوليد الترابي', 'المؤسس',
   'الإطلاق المبكر', 'الرياض', 'https://linkedin.com/in/alwaleed-altorabi', 'قطاع التقنيات الحيوية والصحية',
   'منصة تقنية صحية سعودية تمكّن الأطباء المرخصين من إطلاق عياداتهم الافتراضية خلال دقائق، مع احتفاظهم الكامل بإيراداتهم وعلاقتهم بمرضاهم وبياناتهم.'),

  (10, 'juthoor', 'جذور', 'Juthoor', 'محمد العلوش', 'المؤسس',
   'الإطلاق المبكر', 'الرياض', 'https://linkedin.com/in/mohammed-alallush', 'قطاع التقنيات الحيوية والصحية',
   'منصة تمكّن الأندية والأكاديميات الرياضية والأهالي من اكتشاف المواهب الرياضية وتطويرها باستخدام التحاليل الجينية وتقنيات الذكاء الاصطناعي.'),

  (11, 'stetholink', 'ستيثولينك', 'StethoLink', 'فيصل يوسف', 'المؤسس',
   'النموذج الأولي', 'جدة', 'https://linkedin.com/in/faisal-alhashmi', 'قطاع التقنيات الحيوية والصحية',
   'شركة بيانات طبية تطوّر قطعة ذكية تُضاف إلى سماعة الطبيب لالتقاط البيانات السريرية وتحليلها بالذكاء الاصطناعي، لتمكين قرارات تشخيصية أسرع وأكثر موثوقية.'),

  (12, 'cartiheal', 'كارتي هيل', 'CartiHeal', 'د. ماريا البقمي', 'المؤسسة',
   'النموذج الأولي', 'جدة', 'https://linkedin.com/in/dr-maria-albaqami', 'قطاع التقنيات الحيوية والصحية',
   'شركة تقنية طبية تعيد تعريف علاج إصابات الغضاريف والمفاصل عبر حلول حيوية متقدمة مبنية على أبحاث علمية منشورة دوليًا، لتقديم علاج آمن وعالي الكفاءة.'),

  (13, 'phagetech', 'فيجتيك', 'PhageTech', 'شروق الغامدي', 'المؤسسة',
   'الإطلاق المبكر', 'جدة', 'https://linkedin.com/in/shuruq-abdullah', 'قطاع التقنيات الحيوية والصحية',
   'شركة بيوتك ناشئة تقدّم حلولًا حيوية وتقنية تعتمد على العاثيات والذكاء الاصطناعي للحد من مشكلة مقاومة المضادات الحيوية في قطاع الدواجن والغذاء.'),

  (14, 'aquanova', 'أكوا نوفا', 'AquaNova', 'لمى زيادي', 'المؤسسة',
   'النمو المبكر', 'جدة', 'https://linkedin.com/in/raghad-altayyar', 'قطاع المدن الذكية والتنقل',
   'شركة ناشئة سعودية تطوّر حلول ترشيح نانوية لمعالجة مياه الصرف الصحي، لتحسين إزالة الملوثات وخفض استهلاك الطاقة ودعم إعادة استخدام المياه بشكل مستدام.'),

  (15, 'plstka', 'بلستكا', 'Plstka', 'أحمد رضا النجار', 'المؤسس',
   'النمو المبكر', 'الرياض', 'https://linkedin.com/in/ahmed-elnagar', 'قطاع المدن الذكية والتنقل',
   'منصة لإدارة المخلفات مدعومة بالذكاء الاصطناعي، تجمع بين نظام ولاء محفّز ومنصة للأعمال ولوجستيات مجتمعية مشتركة لرفع كفاءة الجمع وخفض التكاليف التشغيلية.'),

  (16, 'hader', 'هدر', 'Hader', 'علاء العيدروس', 'المؤسس',
   'الإطلاق المبكر', 'جدة', 'https://linkedin.com/in/alaaalaidroos', 'قطاع المدن الذكية والتنقل',
   'شركة تقنية سعودية تطوّر حلولًا ذكية لإدارة كفاءة استهلاك الطاقة في المباني السكنية، تبدأ بأنظمة التكييف، وتقدّم توصيات مؤتمتة تخفض الاستهلاك وفاتورة الكهرباء.'),

  (17, 'evinex', 'ايڤينكس', 'EVINEX', 'د. أحمد تركي', 'المؤسس',
   'الإطلاق المبكر', 'جدة', 'https://linkedin.com/in/ahmad-fawzi-turki', 'قطاع المدن الذكية والتنقل',
   'شركة تقنية سعودية تطوّر حلولًا هندسية ورقمية لمنظومة المركبات الكهربائية والتنقل الذكي، تشمل السجل الرقمي لمركبات الاختبار وأنظمة القيادة الذاتية والمواد المستدامة.'),

  (18, 'oprato', 'اوبراتو', 'Oprato', 'مروان رفه', 'المؤسس',
   'الإطلاق المبكر', 'جدة', 'https://linkedin.com/in/marwan-raffa', 'قطاع تقنيات الغذاء',
   'منصة سحابية مدعومة بالذكاء الاصطناعي تمكّن منشآت الأغذية والمشروبات من إنشاء الأدلة التشغيلية ومراقبة الجودة وقياس الامتثال عبر تقارير وتحليلات ذكية.'),

  (19, 'floraex', 'فلوراكس', 'Floraex', 'عبدالرحمن قدسي', 'المؤسس',
   'الإطلاق المبكر', 'جدة', 'https://linkedin.com/in/abdulrhman-qudsi', 'قطاع تقنيات الغذاء',
   'شركة سعودية ناشئة تطوّر وتصنّع حلول التنظيف والتطهير لقطاع الأغذية والمنشآت الحساسة، بمنتجات محلية تدعم سلامة الغذاء وتقلل الروائح الكيميائية والهدر.')

on conflict (slug) do update set
  sort_order   = excluded.sort_order,
  name_ar      = excluded.name_ar,
  name_en      = excluded.name_en,
  founder_name = excluded.founder_name,
  founder_role = excluded.founder_role,
  stage        = excluded.stage,
  hq           = excluded.hq,
  linkedin_url = excluded.linkedin_url,
  sector       = excluded.sector,
  description  = excluded.description;
  -- access_code_hash and logo_url intentionally untouched on conflict.

-- ==================== 02_mentors.sql ====================
-- ============================================================================
-- SEED — Mentors
-- ============================================================================
-- Source of truth: مرشدين المعسكر.pdf (4 pages, 14 mentor cards).
-- All 14 profiles are seeded. Which of them take part in a given event is an
-- ADMIN decision recorded in session_mentors — never a filter applied here,
-- and never inferred from availability_label.
--
-- `availability_label` is transcribed verbatim ("الخميس 5–7", "فترتين",
-- "السبت"). It is display metadata; no code branches on it.
--
-- Two known data-quality issues in the source, carried over UNCHANGED and
-- flagged rather than silently corrected:
--   1. Six mentors share two duplicated placeholder bios (شودري/الخضير/المشجري
--      and القحطاني/الزبيري/يوسف). They read as unfilled template copy.
--   2. "سلطلن الزحوفي" is very likely a typo for "سلطان". Seeded as printed.
-- Correcting either is a content decision for the organiser, not ours.
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

  (3, 'abduljawad-chowdhry', 'عبدالجواد شودري', 'فترتين',
   'رائد أعمال تقني في مجال الموارد المؤسساتية والتقنيات الصحية.'),

  (4, 'abdullah-nobar', 'عبدالله نوبار', 'فترتين',
   'قبل سنة كنت أكره الـAI واليوم أنا مهندس ذكاء اصطناعي، وأغلب عملي يصير عبر الـAI Agents، مو مجرد ديمو، هذي طريقتي الأساسية في البناء.'),

  (5, 'muna-balhamar', 'منى بلحمر', 'السبت',
   'رائدة أعمال ومستثمرة، تمتلك خبرة واسعة في ريادة الأعمال، وبناء الشركات، وتطوير نماذج الأعمال والاستراتيجيات، كما تركز على دعم الاقتصاد الحر وتمكين الكفاءات المحلية.'),

  (6, 'khalid-alkhudair', 'خالد الخضير', 'فترتين',
   'رائد أعمال تقني في مجال الموارد المؤسساتية والتقنيات الصحية.'),

  (7, 'abdullah-alqahtani', 'عبدالله القحطاني', 'الخميس 5–7',
   'مستشار استراتيجي في القطاعين العام والخاص، ورائد أعمال شغوف ببناء منتجات وشركات ذات أثر واسع تسهم في تمكين الأفراد، مع التركيز على ابتكار حلول مستدامة تدعم التنمية وتعزز الأثر الاقتصادي والاجتماعي.'),

  (8, 'yazeed-almutairi', 'يزيد المطيري', 'فترتين',
   'أخصائي أول تطوير أعمال في وادي جدة، ورائد أعمال سابق في قطاع التقنية العميقة.'),

  (9, 'sultan-alzahoufi', 'سلطلن الزحوفي', 'السبت',
   'خبرة قيادية ١٣ سنة في أرامكو ومع أبرز الشركات الناشئة الرياضية، بالإضافة إلى خبرات في التشغيل والتطوير وبناء نماذج أعمال مع التركيز على تحقيق الإيرادات.'),

  (10, 'mohammed-almashjari', 'محمد المشجري', 'فترتين',
   'رائد أعمال تقني في مجال الموارد المؤسساتية والتقنيات الصحية.'),

  (11, 'ahmed-alzubairi', 'أحمد الزبيري', 'الخميس 5–7',
   'مستشار استراتيجي في القطاعين العام والخاص، ورائد أعمال شغوف ببناء منتجات وشركات ذات أثر واسع تسهم في تمكين الأفراد، مع التركيز على ابتكار حلول مستدامة تدعم التنمية وتعزز الأثر الاقتصادي والاجتماعي.'),

  (12, 'amin-ramadan', 'امين رمضان', 'فترتين',
   'الشريك الإداري في مجموعة عزوة الدعم القابضة، وهي استوديو مؤسسي لبناء الشركات يعمل على تأسيس الشركات وهيكلتها وفق المعايير التي يعترف بها رأس المال المؤسسي.'),

  (13, 'adel-alsaedi', 'عادل الصاعدي', 'فترتين',
   'قيادي في مجال الابتكار والتقنية، بخبرة طويلة في بناء المشاريع الناشئة والمنتجات المدعومة بالذكاء الاصطناعي.'),

  (14, 'omran-yousef', 'عمران يوسف', 'الخميس 5–7',
   'مستشار استراتيجي في القطاعين العام والخاص، ورائد أعمال شغوف ببناء منتجات وشركات ذات أثر واسع تسهم في تمكين الأفراد، مع التركيز على ابتكار حلول مستدامة تدعم التنمية وتعزز الأثر الاقتصادي والاجتماعي.')

on conflict (slug) do update set
  sort_order         = excluded.sort_order,
  name_ar            = excluded.name_ar,
  availability_label = excluded.availability_label,
  bio                = excluded.bio;

-- ==================== 03_mentor_organizations.sql ====================
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

-- ==================== 06_asset_urls.sql ====================
-- ============================================================
-- SEED — asset URLs
-- ============================================================
-- Generated by scripts/extract_assets.py from the source PDFs.
-- Do not edit by hand; re-run the script instead.
--
-- Paths are app-relative (public/assets/...). Point them at
-- Supabase Storage instead by changing the prefix here.
-- ============================================================

update public.mentors set image_url = '/assets/mentors/basma-khoja.png' where slug = 'basma-khoja';
update public.mentors set image_url = '/assets/mentors/anas-alsufyani.png' where slug = 'anas-alsufyani';
update public.mentors set image_url = '/assets/mentors/abduljawad-chowdhry.png' where slug = 'abduljawad-chowdhry';
update public.mentors set image_url = '/assets/mentors/abdullah-nobar.png' where slug = 'abdullah-nobar';
update public.mentor_organizations set org_logo_url = '/assets/mentors/basma-khoja-org1.png' where mentor_id = (select id from public.mentors where slug = 'basma-khoja') and sort_order = 1;
update public.mentor_organizations set org_logo_url = '/assets/mentors/basma-khoja-org2.png' where mentor_id = (select id from public.mentors where slug = 'basma-khoja') and sort_order = 2;
update public.mentor_organizations set org_logo_url = '/assets/mentors/anas-alsufyani-org1.png' where mentor_id = (select id from public.mentors where slug = 'anas-alsufyani') and sort_order = 1;
update public.mentor_organizations set org_logo_url = '/assets/mentors/anas-alsufyani-org2.png' where mentor_id = (select id from public.mentors where slug = 'anas-alsufyani') and sort_order = 2;
update public.mentor_organizations set org_logo_url = '/assets/mentors/abduljawad-chowdhry-org1.png' where mentor_id = (select id from public.mentors where slug = 'abduljawad-chowdhry') and sort_order = 1;
update public.mentor_organizations set org_logo_url = '/assets/mentors/abduljawad-chowdhry-org2.png' where mentor_id = (select id from public.mentors where slug = 'abduljawad-chowdhry') and sort_order = 2;
update public.mentor_organizations set org_logo_url = '/assets/mentors/abdullah-nobar-org1.png' where mentor_id = (select id from public.mentors where slug = 'abdullah-nobar') and sort_order = 1;
update public.mentor_organizations set org_logo_url = '/assets/mentors/abdullah-nobar-org2.png' where mentor_id = (select id from public.mentors where slug = 'abdullah-nobar') and sort_order = 2;
update public.mentors set image_url = '/assets/mentors/yazeed-almutairi.png' where slug = 'yazeed-almutairi';
update public.mentors set image_url = '/assets/mentors/abdullah-alqahtani.png' where slug = 'abdullah-alqahtani';
update public.mentors set image_url = '/assets/mentors/khalid-alkhudair.png' where slug = 'khalid-alkhudair';
update public.mentors set image_url = '/assets/mentors/muna-balhamar.png' where slug = 'muna-balhamar';
update public.mentor_organizations set org_logo_url = '/assets/mentors/yazeed-almutairi-org1.png' where mentor_id = (select id from public.mentors where slug = 'yazeed-almutairi') and sort_order = 1;
update public.mentor_organizations set org_logo_url = '/assets/mentors/yazeed-almutairi-org2.png' where mentor_id = (select id from public.mentors where slug = 'yazeed-almutairi') and sort_order = 2;
update public.mentor_organizations set org_logo_url = '/assets/mentors/abdullah-alqahtani-org1.png' where mentor_id = (select id from public.mentors where slug = 'abdullah-alqahtani') and sort_order = 1;
update public.mentor_organizations set org_logo_url = '/assets/mentors/abdullah-alqahtani-org2.png' where mentor_id = (select id from public.mentors where slug = 'abdullah-alqahtani') and sort_order = 2;
update public.mentor_organizations set org_logo_url = '/assets/mentors/khalid-alkhudair-org1.png' where mentor_id = (select id from public.mentors where slug = 'khalid-alkhudair') and sort_order = 1;
update public.mentor_organizations set org_logo_url = '/assets/mentors/khalid-alkhudair-org2.png' where mentor_id = (select id from public.mentors where slug = 'khalid-alkhudair') and sort_order = 2;
update public.mentor_organizations set org_logo_url = '/assets/mentors/muna-balhamar-org1.png' where mentor_id = (select id from public.mentors where slug = 'muna-balhamar') and sort_order = 1;
update public.mentor_organizations set org_logo_url = '/assets/mentors/muna-balhamar-org2.png' where mentor_id = (select id from public.mentors where slug = 'muna-balhamar') and sort_order = 2;
update public.mentors set image_url = '/assets/mentors/amin-ramadan.png' where slug = 'amin-ramadan';
update public.mentors set image_url = '/assets/mentors/ahmed-alzubairi.png' where slug = 'ahmed-alzubairi';
update public.mentors set image_url = '/assets/mentors/mohammed-almashjari.png' where slug = 'mohammed-almashjari';
update public.mentors set image_url = '/assets/mentors/sultan-alzahoufi.png' where slug = 'sultan-alzahoufi';
update public.mentor_organizations set org_logo_url = '/assets/mentors/amin-ramadan-org1.png' where mentor_id = (select id from public.mentors where slug = 'amin-ramadan') and sort_order = 1;
update public.mentor_organizations set org_logo_url = '/assets/mentors/amin-ramadan-org2.png' where mentor_id = (select id from public.mentors where slug = 'amin-ramadan') and sort_order = 2;
update public.mentor_organizations set org_logo_url = '/assets/mentors/ahmed-alzubairi-org1.png' where mentor_id = (select id from public.mentors where slug = 'ahmed-alzubairi') and sort_order = 1;
update public.mentor_organizations set org_logo_url = '/assets/mentors/mohammed-almashjari-org1.png' where mentor_id = (select id from public.mentors where slug = 'mohammed-almashjari') and sort_order = 1;
update public.mentor_organizations set org_logo_url = '/assets/mentors/sultan-alzahoufi-org1.png' where mentor_id = (select id from public.mentors where slug = 'sultan-alzahoufi') and sort_order = 1;
update public.mentor_organizations set org_logo_url = '/assets/mentors/sultan-alzahoufi-org2.png' where mentor_id = (select id from public.mentors where slug = 'sultan-alzahoufi') and sort_order = 2;
update public.mentors set image_url = '/assets/mentors/omran-yousef.png' where slug = 'omran-yousef';
update public.mentors set image_url = '/assets/mentors/adel-alsaedi.png' where slug = 'adel-alsaedi';
update public.mentor_organizations set org_logo_url = '/assets/mentors/omran-yousef-org1.png' where mentor_id = (select id from public.mentors where slug = 'omran-yousef') and sort_order = 1;
update public.mentor_organizations set org_logo_url = '/assets/mentors/omran-yousef-org2.png' where mentor_id = (select id from public.mentors where slug = 'omran-yousef') and sort_order = 2;
update public.mentor_organizations set org_logo_url = '/assets/mentors/omran-yousef-org3.png' where mentor_id = (select id from public.mentors where slug = 'omran-yousef') and sort_order = 3;
update public.mentor_organizations set org_logo_url = '/assets/mentors/adel-alsaedi-org1.png' where mentor_id = (select id from public.mentors where slug = 'adel-alsaedi') and sort_order = 1;
update public.mentor_organizations set org_logo_url = '/assets/mentors/adel-alsaedi-org2.png' where mentor_id = (select id from public.mentors where slug = 'adel-alsaedi') and sort_order = 2;
update public.startups set logo_url = '/assets/startups/mabien.png' where slug = 'mabien';
update public.startups set logo_url = '/assets/startups/nanoclean.png' where slug = 'nanoclean';
update public.startups set logo_url = '/assets/startups/groupz.png' where slug = 'groupz';
update public.startups set logo_url = '/assets/startups/mustahaq.png' where slug = 'mustahaq';
update public.startups set logo_url = '/assets/startups/thella.png' where slug = 'thella';
update public.startups set logo_url = '/assets/startups/senoz-ai.png' where slug = 'senoz-ai';
update public.startups set logo_url = '/assets/startups/wound-care-ai.png' where slug = 'wound-care-ai';
update public.startups set logo_url = '/assets/startups/dithar.png' where slug = 'dithar';
update public.startups set logo_url = '/assets/startups/medirect.png' where slug = 'medirect';
update public.startups set logo_url = '/assets/startups/juthoor.png' where slug = 'juthoor';
update public.startups set logo_url = '/assets/startups/stetholink.png' where slug = 'stetholink';
update public.startups set logo_url = '/assets/startups/phagetech.png' where slug = 'phagetech';
update public.startups set logo_url = '/assets/startups/aquanova.png' where slug = 'aquanova';
update public.startups set logo_url = '/assets/startups/plstka.png' where slug = 'plstka';
update public.startups set logo_url = '/assets/startups/hader.png' where slug = 'hader';
update public.startups set logo_url = '/assets/startups/evinex.png' where slug = 'evinex';
update public.startups set logo_url = '/assets/startups/oprato.png' where slug = 'oprato';
update public.startups set logo_url = '/assets/startups/floraex.png' where slug = 'floraex';

-- ==================== session (draft, no date) ====================
-- Rewritten from 04_session.sql for the SQL Editor: the original uses psql
-- \if/\set to accept an optional -v session_date. Here the date is left NULL
-- and the admin sets it in Admin -> الجلسة before opening the session.

insert into public.sessions
  (name, session_date, starts_at, ends_at, slot_minutes,
   max_bookings_per_startup, allow_startup_cancellation, block_duplicate_mentor, status)
select
  'جلسات الإرشاد — WJIncubator',
  null,           -- admin sets the real event date in the UI
  time '17:00',   -- 5 PM  — the slot generator's start
  time '19:00',   -- 7 PM  — the slot generator's end
  20,             -- 20-minute intervals
  3,              -- max 3 confirmed bookings per startup
  false,          -- startup self-cancellation OFF
  true,           -- never the same mentor twice
  'draft'
where not exists (
  select 1 from public.sessions where name = 'جلسات الإرشاد — WJIncubator'
);

select s.name,
       coalesce(s.session_date::text, '(غير محدد — يحدده المشرف)') as session_date,
       s.status,
       s.starts_at, s.ends_at, s.slot_minutes,
       s.max_bookings_per_startup as cap,
       (select count(*) from public.startups) as startups,
       (select count(*) from public.mentors)  as mentors
  from public.sessions s
 where s.name = 'جلسات الإرشاد — WJIncubator';
