/**
 * Every failure code the database can return, mapped to the Arabic message the
 * user actually sees.
 *
 * During a live event "حدث خطأ" is useless — a startup that just lost a slot
 * needs to know it was taken, not that something went wrong, so each code gets
 * a distinct, actionable sentence.
 */
export const ERROR_MESSAGES: Record<string, string> = {
  // Authentication
  INVALID_CODE: 'الرمز السري غير صحيح. تأكد من اختيار الشركة الصحيحة وأعد المحاولة.',
  BAD_FORMAT: 'الرمز السري يتكوّن من ٤ أرقام.',
  TOO_MANY_ATTEMPTS: 'تم تجاوز عدد المحاولات المسموح بها. الرجاء الانتظار ١٥ دقيقة ثم المحاولة مرة أخرى.',
  INVALID_SESSION: 'انتهت صلاحية الجلسة. الرجاء تسجيل الدخول مرة أخرى.',
  STARTUP_INACTIVE: 'حساب الشركة غير مفعّل حاليًا. الرجاء التواصل مع المنظمين.',
  NOT_ADMIN: 'هذا الحساب لا يملك صلاحية الدخول إلى لوحة المشرف.',
  ADMIN_BAD_CREDENTIALS: 'البريد الإلكتروني أو كلمة المرور غير صحيحة.',

  // Booking
  SLOT_TAKEN: 'تم حجز هذا الموعد للتو من شركة أخرى. اختر موعدًا آخر.',
  SLOT_CLOSED: 'هذا الموعد مغلق حاليًا.',
  SLOT_NOT_FOUND: 'لم يعد هذا الموعد متاحًا.',
  SESSION_CLOSED: 'الحجز مغلق حاليًا.',
  MENTOR_INACTIVE: 'هذا المرشد غير متاح للحجز حاليًا.',
  LIMIT_REACHED: 'لقد وصلت إلى الحد الأقصى من الحجوزات.',
  TIME_CONFLICT: 'لديك حجز آخر في نفس التوقيت.',
  MENTOR_ALREADY_BOOKED: 'لديك حجز مسبق مع هذا المرشد.',
  BOOKING_NOT_FOUND: 'لم يتم العثور على الحجز.',
  ALREADY_CANCELLED: 'هذا الحجز ملغى بالفعل.',
  CANCELLATION_DISABLED: 'لا يمكنك إلغاء الحجز مباشرة. تواصل مع إدارة المعسكر للمساعدة.',

  // Admin operations
  SESSION_NOT_FOUND: 'لم يتم العثور على الجلسة.',
  SESSION_DATE_REQUIRED: 'يجب تحديد تاريخ الجلسة قبل فتحها.',
  NO_SLOTS: 'لا يمكن فتح الجلسة قبل إنشاء المواعيد.',
  SLOT_HAS_BOOKING: 'لا يمكن إغلاق موعد محجوز. ألغِ الحجز أولًا.',
  MENTOR_HAS_BOOKINGS: 'لا يمكن تنفيذ العملية لوجود حجوزات مرتبطة بهذا المرشد.',
  NOT_ASSIGNED: 'هذا المرشد غير مُسنَد إلى الجلسة.',
  MENTOR_NOT_FOUND: 'لم يتم العثور على المرشد.',
  STARTUP_NOT_FOUND: 'لم يتم العثور على الشركة.',
  CROSS_SESSION: 'لا يمكن نقل الحجز إلى جلسة أخرى.',

  // Transport
  NETWORK: 'تعذّر الاتصال بالخادم. تحقق من الاتصال وأعد المحاولة.',
  NOT_CONFIGURED: 'لم يتم ربط التطبيق بقاعدة البيانات بعد.',
  UNKNOWN: 'حدث خطأ غير متوقع. الرجاء إعادة المحاولة.',
}

export function messageFor(code: string | undefined | null): string {
  if (!code) return ERROR_MESSAGES.UNKNOWN!
  return ERROR_MESSAGES[code] ?? ERROR_MESSAGES.UNKNOWN!
}

/** Codes that mean "your session is gone" — the guard signs the user out. */
export const SESSION_DEAD_CODES = new Set(['INVALID_SESSION', 'STARTUP_INACTIVE'])
