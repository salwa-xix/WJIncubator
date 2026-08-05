-- ============================================================================
-- SEED — Startups
-- ============================================================================
-- Sources of truth:
--   • Incubator_Startup_Profiles.pdf (19 pages, one per company) → rows 1–18
--   • Company.pdf (page 1)                                       → row 19
--
-- Company.pdf replaces the deck's 19th company (Floraex / فلوراكس) with نقطة.
-- It is a one-page cover carrying the name and logo only, so every other
-- column on that row is NULL — the profile fields simply do not exist in the
-- source yet. Every field below is transcribed verbatim. Nothing invented.
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

-- ---------------------------------------------------------------------------
-- Floraex → نقطة
-- ---------------------------------------------------------------------------
-- Removed rather than renamed in place. It is a different company, and reusing
-- the row would silently carry over Floraex's founder, sector, description,
-- logo and — the one that actually matters — its already-issued access code,
-- handing نقطة a credential that was given to someone else.
--
-- Guarded, because bookings.startup_id is ON DELETE RESTRICT: if Floraex has
-- already booked, an unguarded DELETE aborts the whole seed. In that case the
-- row is archived instead, so the bookings stay auditable and the operator is
-- told what to do about it.
-- ---------------------------------------------------------------------------
do $$
declare
  v_id       uuid;
  v_bookings integer;
begin
  select id into v_id from public.startups where slug = 'floraex';
  if v_id is null then
    return;                                   -- already replaced; nothing to do
  end if;

  select count(*) into v_bookings from public.bookings where startup_id = v_id;

  if v_bookings = 0 then
    delete from public.startups where id = v_id;
    raise notice 'Floraex removed — replaced by نقطة (no bookings existed).';
  else
    update public.startups set is_active = false where id = v_id;
    raise notice 'Floraex has % booking(s), so it was archived (is_active = false) '
                 'rather than deleted. Cancel those bookings and re-run this seed '
                 'to remove the row outright.', v_bookings;
  end if;
end $$;

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

  -- Company.pdf, page 1. Name and logo are all the source provides; the deck's
  -- profile fields (founder, stage, HQ, LinkedIn, sector, description) have no
  -- equivalent there, so they stay NULL until a profile slide exists.
  (19, 'nkta', 'نقطة', 'NKTA', null, null,
   null, null, null, null, null)

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
