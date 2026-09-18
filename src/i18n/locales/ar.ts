/**
 * Source catalog. Every user-visible string belongs here, grouped by feature.
 *
 * Parameterised strings are functions rather than templates with placeholders, so the
 * compiler checks the arguments and each locale can order or inflect them differently.
 */
export const ar = {
  appName: 'بانوراما',

  common: {
    loading: 'جاري التحميل...',
    retry: 'إعادة المحاولة',
    error: 'حدث خطأ غير متوقع',
    comingSoon: 'لاحقا',
    back: 'رجوع',
    cancel: 'إلغاء',
    save: 'حفظ',
  },

  environment: {
    production: 'إنتاج',
    preview: 'معاينة',
    development: 'تطوير',
  },

  auth: {
    backToLogin: 'العودة لتسجيل الدخول',
    back: 'العودة',
    logoAlt: 'شعار بانوراما',

    fields: {
      identifier: 'البريد أو رقم الهاتف',
      identifierPlaceholder: 'student@example.com',
      email: 'البريد الإلكتروني',
      fullName: 'الاسم الكامل',
      phone: 'رقم الهاتف',
      phonePlaceholder: 'أدخل رقم الجوال بدون مفتاح الدولة',
      studentNumber: 'الرقم الجامعي',
      password: 'كلمة المرور',
      passwordPlaceholder: 'أدخل كلمة المرور',
      passwordConfirm: 'تأكيد كلمة المرور',
      showPassword: 'إظهار كلمة المرور',
      hidePassword: 'إخفاء كلمة المرور',
      show: 'إظهار',
      hide: 'إخفاء',
      otpCode: 'رمز التحقق',
    },

    login: {
      title: 'تسجيل الدخول',
      tagline: 'موادك، مجموعاتك، ملفاتك وخدماتك الجامعية في مكان واحد.',
      cardSubtitle: 'يمكنك استخدام البريد الإلكتروني أو رقم الهاتف.',
      submit: 'تسجيل الدخول',
      createAccount: 'إنشاء حساب جديد',
      forgotPassword: 'نسيت كلمة المرور؟',
      missingCredentials: 'يرجى إدخال البريد أو رقم الهاتف وكلمة المرور.',
    },

    accountType: {
      illustrationAlt: 'إنشاء حساب',
      title: 'اختر نوع الحساب',
      description: 'يمكن ترقية حساب الطالب بعد استكمال الملف الأكاديمي والتوثيق.',
      studentAlt: 'طالب',
      studentTitle: 'حساب طالب',
      studentDescription: 'للوصول إلى المواد والمجموعات والملفات الأكاديمية بعد التوثيق.',
      studentAction: 'متابعة كطالب',
      normalAlt: 'مستخدم عادي',
      normalTitle: 'حساب مستخدم عادي',
      normalDescription: 'للخدمات العامة والطباعة والدعم بحسب الصلاحيات المتاحة.',
      normalAction: 'متابعة كمستخدم عادي',
    },

    registerStudent: {
      title: 'إنشاء حساب طالب',
      subtitle: 'سيصل رمز التحقق إلى البريد الإلكتروني.',
      cardTitle: 'بيانات الحساب',
      cardSubtitle: 'بعد التحقق ستكمل بياناتك الأكاديمية وترفع البطاقة الجامعية.',
      submit: 'إنشاء الحساب',
      haveAccount: 'لديك حساب؟ تسجيل الدخول',
    },

    registerNormal: {
      title: 'إنشاء حساب عام',
      subtitle: 'سيتم التحقق عبر البريد الإلكتروني.',
      cardTitle: 'بيانات الحساب',
      cardSubtitle: 'يمكن استخدام الخدمات العامة وفق صلاحيات النظام.',
      submit: 'إنشاء الحساب',
    },

    otp: {
      title: 'تأكيد الحساب',
      sentTo: (destination: string, identifier: string) =>
        `أدخل الرمز المرسل إلى ${destination}: ${identifier}`,
      destinationEmail: 'البريد الإلكتروني',
      destinationPhone: 'رقم الهاتف',
      cardTitle: 'رمز التحقق',
      cardSubtitle: 'الرمز صالح لمدة محدودة ولا يجب مشاركته مع أي شخص.',
      submit: 'تأكيد الرمز',
      resend: 'إعادة إرسال الرمز',
      resendIn: (seconds: number) => `إعادة الإرسال بعد ${seconds}ث`,
    },

    forgotPassword: {
      title: 'استعادة كلمة المرور',
      subtitle: 'سنرسل رمزًا إلى البريد المرتبط بالحساب دون كشف وجود الحساب.',
      cardTitle: 'البريد الإلكتروني',
      cardSubtitle: 'أدخل البريد الإلكتروني المستخدم في بانوراما.',
      submit: 'إرسال رمز الاستعادة',
    },

    resetPassword: {
      title: 'كلمة مرور جديدة',
      subtitle: 'اختر كلمة مرور قوية ولا تعِد استخدامها في خدمات أخرى.',
      cardTitle: 'إعادة التعيين',
      cardSubtitle: (identifier: string) => `أدخل الرمز المرسل إلى ${identifier}.`,
      submit: 'حفظ كلمة المرور',
    },

    bootstrap: {
      checkingSession: 'جاري التحقق من الجلسة...',
      preparingStudentAccount: 'جاري تجهيز حسابك الطلابي...',
    },

    roleDenied: {
      title: 'لا يمكن الوصول إلى التطبيق',
      message: 'تطبيق بانوراما للجوال مخصص للطلاب. يرجى استخدام لوحة التحكم للمهام الإدارية.',
      dashboardLabel: 'لوحة التحكم:',
      logout: 'تسجيل الخروج',
    },

    validation: {
      fullNameRequired: 'يرجى إدخال الاسم الكامل.',
      emailInvalid: 'يرجى إدخال بريد إلكتروني صالح.',
      studentNumberRequired: 'يرجى إدخال الرقم الجامعي.',
      phoneRequired: 'يرجى إدخال رقم الجوال.',
      phoneFormat: 'صيغة رقم الجوال غير صحيحة. يجب أن يبدأ بمفتاح الدولة.',
      phoneDigitsOnly: 'رقم الجوال يجب أن يحتوي على أرقام فقط.',
      phoneTooShort: 'رقم الجوال قصير جداً. يجب أن يتكون من 8 أرقام على الأقل بعد مفتاح الدولة.',
      phoneTooLong: 'رقم الجوال طويل جداً.',
      passwordTooShort: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل.',
      passwordMismatch: 'تأكيد كلمة المرور غير مطابق.',
      otpInvalid: 'أدخل رمز تحقق صالحاً.',
    },

    errors: {
      network: 'تعذر الاتصال بالخادم. تحقق من اتصال الإنترنت.',
      registrationGeneric: 'تعذر إكمال التسجيل. حاول مرة أخرى.',
      passwordResetGeneric: 'تعذر استعادة كلمة المرور. حاول مرة أخرى.',
      rateLimited: 'تم تجاوز عدد المحاولات المسموح.',
      rateLimitedRetryAfter: (seconds: number) => `انتظر ${seconds} ثانية ثم حاول مجددًا.`,
      passwordResetRateLimited: 'تم تجاوز عدد المحاولات. حاول لاحقًا.',
      invalidCredentials: 'بيانات الدخول غير صحيحة.',
      sessionExpired: 'انتهت الجلسة. يرجى تسجيل الدخول مرة أخرى.',
      forbidden: 'لا تملك صلاحية تنفيذ هذا الإجراء.',
      generic: 'تعذر تنفيذ العملية. حاول مرة أخرى.',
    },

    countryPicker: {
      selectCountry: 'اختر الدولة',
      close: 'إغلاق',
    },

    countries: {
      sy: 'سوريا',
      iq: 'العراق',
      jo: 'الأردن',
      lb: 'لبنان',
      sa: 'السعودية',
      ae: 'الإمارات',
      eg: 'مصر',
      tr: 'تركيا',
      us: 'أمريكا',
      gb: 'بريطانيا',
      de: 'ألمانيا',
      fr: 'فرنسا',
    },
  },

  settings: {
    title: 'الإعدادات',
    subtitle: 'إعدادات الحساب والتطبيق',

    account: {
      title: 'الحساب والأمان',
      subtitle: 'إجراءات الأمان الخاصة بالحساب الحالي',
      changePassword: 'تغيير كلمة المرور',
      changePasswordDescription: 'تحديث كلمة المرور من خلال الخادم',
    },

    app: {
      title: 'التطبيق',
      subtitle: 'إعدادات التطبيق المتاحة في هذه النسخة',
      notifications: 'الإشعارات',
      notificationsDescription: 'فتح مركز الإشعارات داخل التطبيق',
      darkMode: 'الوضع الليلي',
      darkModeDescription: 'سيتم دعم الوضع الليلي لاحقا عند توفر نطاقه',
      version: 'إصدار التطبيق',
      versionDescription: 'رقم إصدار التطبيق الحالي',
      environment: 'بيئة التشغيل',
      environmentDescription: 'بيئة التشغيل الحالية',
    },

    language: {
      title: 'اللغة',
      description: 'اختر لغة واجهة التطبيق',
      arabic: 'العربية',
      english: 'English',
      restartRequired: 'تم حفظ اللغة. أعد تشغيل التطبيق ليكتمل تغيير اتجاه الواجهة.',
    },

    legal: {
      title: 'قانوني',
      subtitle: 'معلومات قانونية ثابتة لهذه النسخة',
      privacy: 'سياسة الخصوصية',
      terms: 'الشروط والأحكام',
      about: 'عن بانوراما',
    },
  },
} as const;
