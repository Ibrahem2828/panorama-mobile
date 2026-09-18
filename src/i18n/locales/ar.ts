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
    refresh: 'تحديث',
    notSpecified: 'غير محدد',
    notAvailable: 'غير متاح',
    unknown: 'غير معروف',
    open: 'فتح',
    searchLocal: 'بحث محلي',
    retryVerify: 'إعادة التحقق',
    lastUpdatedAt: (time: string) => `آخر تحديث: ${time}`,
    noSearchResultsAlt: 'رسم يوضح عدم وجود نتائج بحث',
  },

  /**
   * Verification wording lived in three places with two different spellings of
   * "needs update". Keeping one entry is what removed that drift.
   */
  verification: {
    verified: 'موثق',
    pending: 'قيد المراجعة',
    rejected: 'مرفوض',
    needsUpdate: 'بحاجة إلى تحديث',
    notSubmitted: 'غير مقدم',
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

  profile: {
    title: 'حسابي',
    subtitle: 'الحساب والخدمات الشخصية',
    loadingAccount: 'جاري تحميل بيانات الحساب...',
    defaultName: 'مستخدم Panorama',
    noContactDetails: 'لا توجد بيانات تواصل مؤكدة حاليا',

    roles: {
      student: 'طالب',
      normalUser: 'مستخدم',
      admin: 'مسؤول',
      itSupport: 'دعم فني',
      printStaff: 'موظف طباعة',
      fallback: 'حساب مستخدم',
    },

    summary: {
      title: 'ملخص الطالب',
      university: 'الجامعة',
      faculty: 'الكلية',
      verification: 'التحقق',
      note: 'للتفاصيل الكاملة افتح شاشة المعلومات الأكاديمية.',
      emailVerified: 'البريد مؤكد',
      emailUnverified: 'البريد غير مؤكد',
      phoneVerified: 'الهاتف مؤكد',
      phoneUnverified: 'الهاتف غير مؤكد',
    },

    accountSection: {
      title: 'الحساب',
      subtitle: 'إدارة البيانات وخدمات الحساب',
      editProfile: 'تعديل الملف الشخصي',
      editProfileSubtitle: 'تعديل الاسم واسم المستخدم فقط',
      academicInfo: 'المعلومات الأكاديمية',
      academicInfoSubtitle: 'عرض بيانات الجامعة والتوثيق',
      settings: 'الإعدادات',
      settingsSubtitle: 'الأمان والمعلومات القانونية',
    },

    servicesSection: {
      title: 'الخدمات',
      subtitle: 'روابط الخدمات المتاحة للطالب',
      printOrders: 'طلبات الطباعة',
      printOrdersSubtitle: 'متابعة طلبات الطباعة الخاصة بك',
      notifications: 'الإشعارات',
      notificationsSubtitle: 'قراءة إشعارات الحساب',
      support: 'الدعم الفني',
      supportSubtitle: 'إنشاء ومتابعة تذاكر الدعم',
      feedback: 'رأيك يهمنا',
      feedbackSubtitle: 'قيّم التطبيق وشارك اقتراحاتك',
    },

    legalSection: {
      title: 'قانوني',
      subtitle: 'معلومات التطبيق',
    },

    logout: {
      action: 'تسجيل الخروج',
      confirmTitle: 'هل تريد تسجيل الخروج؟',
      confirmDescription: 'سيتم مسح رموز الجلسة من التخزين الآمن والعودة إلى شاشة تسجيل الدخول.',
      confirm: 'تأكيد الخروج',
    },

    security: {
      title: 'الحساب والأمان',
      description: 'كلمة المرور تدار من الخادم، ولا يتم حفظها داخل التطبيق.',
      changePassword: 'تغيير كلمة المرور',
    },

    edit: {
      title: 'تعديل الملف الشخصي',
      subtitle: 'تعديل البيانات المسموحة من الخادم',
      notice:
        'يمكن تعديل الاسم الكامل واسم المستخدم فقط. البريد والهاتف والدور حقول للعرض ولا يتم إرسالها في طلب التحديث.',
      fullName: 'الاسم الكامل',
      fullNamePlaceholder: 'اكتب الاسم الكامل',
      username: 'اسم المستخدم',
      usernamePlaceholder: 'اكتب اسم المستخدم',
      readOnlyTitle: 'حقول غير قابلة للتعديل',
      email: (value: string) => `البريد: ${value}`,
      phone: (value: string) => `الهاتف: ${value}`,
      role: (value: string) => `الدور: ${value}`,
      save: 'حفظ التغييرات',
      fullNameRequired: 'يرجى إدخال الاسم الكامل.',
      updateSuccess: 'تم تحديث الملف الشخصي بنجاح.',
    },

    academic: {
      title: 'المعلومات الأكاديمية',
      subtitle: 'بيانات الطالب القادمة من الخادم',
      loading: 'جاري تحميل المعلومات الأكاديمية...',
      university: 'الجامعة',
      faculty: 'الكلية',
      major: 'الاختصاص',
      year: 'السنة',
      semester: 'الفصل',
      studentNumber: 'الرقم الجامعي',
      verifiedNote:
        'تم توثيق الحساب. الحقول الأكاديمية الحساسة مقفلة ولا يتم تعديلها من هذه الشاشة.',
      readOnlyNote:
        'هذه الشاشة للعرض فقط. تعديل البيانات الأكاديمية يتم ضمن تدفق إعداد الطالب حسب قواعد الخادم.',
      privacyNote: 'لا يتم عرض صورة بطاقة التحقق أو روابطها هنا لحماية الخصوصية.',
      incompleteTitle: 'المعلومات الأكاديمية غير مكتملة',
      incompleteMessage:
        'لم يتم العثور على ملف أكاديمي مكتمل. أعد تسجيل الدخول أو تواصل مع الإدارة إذا استمرت المشكلة.',
      cardVerified: 'تم التحقق من بطاقتك الجامعية.',
      cardStatusFromServer: 'حالة توثيق البطاقة الجامعية كما يعيدها الخادم.',
      contactConfirmed: 'بيانات التواصل مؤكدة',
      contactConfirmedDescription: 'يوجد بريد أو رقم هاتف مؤكد على الحساب.',
      contactUnconfirmed: 'بيانات التواصل غير مؤكدة',
      contactUnconfirmedDescription: 'يعرض التطبيق حالة الحساب كما يعيدها الخادم.',
      accountNotLoaded: 'بيانات الحساب غير محملة',
      accountNotLoadedDescription: 'أعد تحميل الملف الشخصي لعرض حالة الحساب.',
      confirmed: 'مؤكد',
      unconfirmed: 'غير مؤكد',
    },

    about: {
      title: 'عن بانوراما',
      subtitle: 'معلومات التطبيق',
      version: (value: string) => `الإصدار ${value}`,
      purposeTitle: 'الغرض من التطبيق',
      purpose: [
        'Panorama تطبيق طلابي عربي وRTL يجمع المواد والمجموعات والملفات والطباعة والإشعارات والدعم في تجربة واحدة منظمة.',
        'يركز التطبيق على خدمات الطالب الأكاديمية اليومية، مع إبقاء الصلاحيات والبيانات التشغيلية خاضعة للخادم.',
        'هذه نسخة MVP مخصصة للوصول العملي والواضح إلى الخدمات الأساسية دون وعود تشغيلية مبالغ فيها.',
      ],
    },

    errors: {
      network: 'تعذر تحميل بيانات الحساب. تحقق من اتصال الإنترنت وحاول مرة أخرى.',
      unauthorized: 'انتهت الجلسة. يرجى تسجيل الدخول مرة أخرى.',
      validation: 'يرجى التأكد من بيانات الملف الشخصي المدخلة.',
      update: 'تعذر تحديث الملف الشخصي. حاول مرة أخرى.',
    },
  },

  legal: {
    privacy: {
      title: 'سياسة الخصوصية',
      subtitle: 'بيان خصوصية مختصر لنسخة MVP',
      sections: [
        {
          title: 'البيانات التي نستخدمها',
          paragraphs: [
            'يستخدم Panorama بيانات الحساب مثل الاسم واسم المستخدم ووسائل التواصل لتقديم تجربة حساب واضحة وآمنة.',
            'تستخدم البيانات الأكاديمية وحالة التوثيق وصورة بطاقة الطالب للتحقق من أهلية الوصول إلى الخدمات الأكاديمية.',
          ],
        },
        {
          title: 'الخدمات المرتبطة بالبيانات',
          paragraphs: [
            'قد يستخدم التطبيق بيانات الوصول إلى الملفات وطلبات الطباعة وتذاكر الدعم والإشعارات لتقديم خدمات Panorama ومتابعة حالاتها.',
            'لا يتم بيع بيانات المستخدمين. يستخدم التطبيق البيانات لتقديم الخدمات وتشغيلها وتحسين وضوح التجربة فقط.',
          ],
        },
        {
          title: 'الخصوصية داخل التطبيق',
          paragraphs: [
            'لا تعرض شاشة المعلومات الأكاديمية روابط صور التوثيق أو ملفات حساسة غير مطلوبة.',
            'الصلاحيات والبيانات المتاحة يحددها الخادم، والتطبيق يعرض ما يسمح به فقط للمستخدم الحالي.',
          ],
        },
      ],
    },

    terms: {
      title: 'الشروط والأحكام',
      subtitle: 'شروط استخدام مختصرة لنسخة MVP',
      sections: [
        {
          title: 'الاستخدام المقبول',
          paragraphs: [
            'يستخدم Panorama للوصول إلى الخدمات الأكاديمية والملفات والمجموعات والطباعة والدعم بطريقة مسؤولة.',
            'يمنع إساءة استخدام الملفات أو المجموعات أو تذاكر الدعم أو محاولة الوصول إلى بيانات لا تخص الحساب الحالي.',
          ],
        },
        {
          title: 'الصلاحيات والخادم',
          paragraphs: [
            'الخادم هو مصدر الحقيقة للصلاحيات وحالة التوثيق وإتاحة الملفات والخدمات.',
            'قد تختلف الخدمات المتاحة حسب حالة الحساب والتوثيق والبيانات الأكاديمية.',
          ],
        },
        {
          title: 'المسؤولية',
          paragraphs: [
            'المستخدم مسؤول عن الحفاظ على سرية كلمة المرور ومراجعة طلبات الطباعة قبل إرسالها.',
            'يجب استخدام الدعم الفني لتقديم معلومات صحيحة تساعد الفريق على معالجة المشكلة.',
          ],
        },
      ],
    },
  },

  files: {
    title: 'الملفات',
    subtitle: 'الملفات المتاحة حسب صلاحيات حسابك',
    loading: 'جاري تحميل الملفات...',
    listTitle: 'قائمة الملفات',
    loadedCount: (count: number) => `عدد الملفات المحملة: ${count}`,
    searchPlaceholder: 'ابحث باسم الملف أو نوعه',
    emptyTitle: 'لا توجد ملفات',
    emptyMessage: 'لا توجد ملفات متاحة حاليا.',
    emptyIllustrationAlt: 'رسم يوضح عدم وجود ملفات',
    untitled: 'ملف بدون عنوان',

    size: {
      bytes: (value: number) => `${value} بايت`,
      kilobytes: (value: string) => `${value} ك.ب`,
      megabytes: (value: string) => `${value} م.ب`,
    },

    type: {
      image: 'صورة',
      document: 'مستند',
      file: 'ملف',
      iconAlt: 'أيقونة نوع الملف',
    },

    visibility: {
      public: 'عام',
      students: 'للطلاب',
      verifiedStudents: 'للطلاب الموثقين',
      byMajor: 'حسب الاختصاص',
      group: 'خاص بالمجموعة',
      staff: 'إداري',
      custom: 'صلاحية مخصصة',
    },

    card: {
      updatedAt: (value: string) => `آخر تحديث: ${value}`,
      createdAt: (value: string) => `تاريخ الإنشاء: ${value}`,
    },

    details: {
      subtitle: 'تفاصيل الملف',
      loading: 'جاري تحميل تفاصيل الملف...',
      unavailableTitle: 'الملف غير متاح',
      unavailableMessage: 'تعذر تحميل تفاصيل الملف.',
      openInApp: 'فتح داخل التطبيق',
      requestPrint: 'طلب طباعة',
      noTicket: 'لا يمكن إصدار تذكرة عرض لهذا الملف حاليًا.',
      descriptionTitle: 'الوصف',
      noDescription: 'لا يوجد وصف متاح لهذا الملف.',
      infoTitle: 'معلومات الملف',
      infoSubtitle: 'بيانات الملف كما يسمح بها الباك إند.',
      type: 'النوع',
      extension: 'الامتداد',
      size: 'الحجم',
      visibility: 'الصلاحية',
      group: 'المجموعة',
      subject: 'المادة',
      createdAt: 'تاريخ الإنشاء',
      updatedAt: 'آخر تحديث',
      protectionNote:
        'لا يوجد زر تنزيل أو مشاركة. إخفاء التنزيل في الواجهة لا يعني حماية مطلقة للملف؛ صلاحيات الوصول يفرضها الباك إند.',
      inAppOnlyNote: 'يفتح هذا الملف داخل التطبيق فقط. لا يوجد زر تنزيل مباشر للطلاب.',
    },

    viewer: {
      fallbackTitle: 'عارض الملفات',
      subtitle: 'عرض محمي داخل التطبيق',
      issuingTicket: 'جاري إصدار تذكرة عرض آمنة...',
      loadError: 'تعذر عرض الملف. قد تكون التذكرة انتهت؛ أعد المحاولة.',
      securityNote:
        'يستخدم العرض رابطًا مؤقتًا من الخادم، ويعطّل التطبيق لقطات الشاشة أثناء فتح الملف قدر الإمكان. لا توجد أزرار تنزيل أو مشاركة.',
      unavailableTitle: 'لا يمكن عرض الملف',
      unavailableAlt: 'رسم يوضح تعذر معاينة الملف',
      protectedReadyTitle: 'العرض المحمي جاهز',
      protectedReadyMessage: (id: string) =>
        `استخدم زر فتح داخل التطبيق لإصدار تذكرة عرض آمنة للملف ${id}.`,
    },

    groupFiles: {
      title: 'ملفات المجموعة',
      subtitle: 'ملفات المجموعة المتاحة للأعضاء',
      loading: 'جاري تحميل ملفات المجموعة...',
      backToGroup: 'رجوع إلى المجموعة',
      listTitle: 'القائمة',
      shownCount: (count: number) => `عدد الملفات المعروضة: ${count}`,
      searchPlaceholder: 'ابحث بعنوان الملف أو الوصف',
      emptyMessage: 'لا توجد ملفات لهذا المجموعة حاليا.',
    },

    errors: {
      network: 'تعذر تحميل الملفات. تحقق من اتصال الإنترنت وحاول مرة أخرى.',
      unauthorized: 'انتهت الجلسة. يرجى تسجيل الدخول مرة أخرى.',
      permission: 'لا تملك صلاحية الوصول إلى هذه الملفات حاليا.',
      generic: 'تعذر تحميل الملفات. حاول مرة أخرى.',
    },
  },

  groups: {
    title: 'المجموعات',
    untitled: 'مجموعة بدون اسم',

    overview: {
      subtitle: 'المجموعات الأكاديمية',
      intro: 'انضم إلى المجموعات الأكاديمية المناسبة لبياناتك الجامعية.',
      destinationsTitle: 'الوجهات',
      destinationsSubtitle:
        'يمكنك متابعة مجموعاتك أو تصفح المجموعات المتاحة حسب صلاحيات الباك إند.',
      myGroupsDescription: 'المجموعات التي تملك عضوية فيها أو طلبات مرتبطة بحسابك.',
      availableDescription: 'المجموعات التي يمكنك طلب الانضمام إليها حسب بياناتك وحالة توثيقك.',
    },

    mine: {
      title: 'مجموعاتي',
      subtitle: 'المجموعات المرتبطة بحسابك',
      loading: 'جاري تحميل مجموعاتك...',
      emptyMessage: 'لم تنضم إلى أي مجموعة بعد.',
    },

    available: {
      title: 'المجموعات المتاحة',
      subtitle: 'المجموعات التي يمكنك طلب الانضمام إليها',
      loading: 'جاري تحميل المجموعات المتاحة...',
      emptyMessage: 'لا توجد مجموعات متاحة حاليا.',
    },

    list: {
      title: 'القائمة',
      loadedCount: (count: number) => `عدد المجموعات المحملة: ${count}`,
      searchPlaceholder: 'ابحث باسم المجموعة أو وصفها',
      emptyTitle: 'لا توجد مجموعات',
      emptyIllustrationAlt: 'رسم يوضح عدم وجود مجموعات',
    },

    details: {
      subtitle: 'تفاصيل المجموعة',
      loading: 'جاري تحميل تفاصيل المجموعة...',
      backToGroups: 'رجوع إلى المجموعات',
      unavailableTitle: 'المجموعة غير متاحة',
      unavailableMessage: 'تعذر تحميل تفاصيل المجموعة.',
      join: 'طلب الانضمام',
      leave: 'مغادرة المجموعة',
      contentTitle: 'محتوى المجموعة',
      contentSubtitle: 'المحادثة مؤجلة، وملفات المجموعة أصبحت متاحة حسب صلاحيات الباك إند.',
      chatTitle: 'المحادثة',
      chatDescription:
        'افتح المحادثة النصية داخل التطبيق. صلاحية الإرسال تعرض داخل شاشة المحادثة حسب عضوية المجموعة وقواعد الخادم.',
      openChat: 'فتح المحادثة داخل التطبيق',
      filesTitle: 'ملفات المجموعة',
      filesDescription: 'افتح الملفات المرتبطة بهذا المجموعة داخل التطبيق بدون زر تنزيل مباشر.',
      openFiles: 'فتح ملفات المجموعة',
      descriptionTitle: 'وصف المجموعة',
      noDescription: 'لا يوجد وصف متاح لهذه المجموعة حاليًا.',
      openWhatsApp: 'فتح قناة واتساب المصرح بها',
      whatsAppNote:
        'لا يظهر رابط واتساب داخل بيانات المجموعة. يطلب التطبيق إذنًا مؤقتًا من الخادم عند الفتح.',
      whatsAppError: 'تعذر فتح رابط واتساب.',
    },

    stats: {
      members: (count: number) => `الأعضاء ${count}`,
      subject: (name: string) => `المادة ${name}`,
      academicYear: (name: string) => `السنة ${name}`,
      semester: (name: string) => `الفصل ${name}`,
      whatsApp: 'واتساب',
      role: (name: string) => `الدور ${name}`,
    },

    membership: {
      pending: 'بانتظار الموافقة',
      member: 'عضو',
      rejected: 'مرفوض',
      blocked: 'محظور',
      left: 'غادرت',
      notJoined: 'غير منضم',
      fallback: 'حالة عضوية',
    },

    permissions: {
      title: 'الصلاحيات',
      allMembersCanSend: 'كل الأعضاء يمكنهم الإرسال',
      adminsOnly: 'الإرسال للمشرفين فقط',
      groupDecides: 'صلاحيات الإرسال يحددها المجموعة',
      sendToAll: 'إرسال للجميع',
      sendToAdmins: 'إرسال للمشرفين',
      sendPermission: 'صلاحيات إرسال',
      yourRole: (role: string) => `دورك: ${role}`,
      sending: (permission: string) => `إرسال: ${permission}`,
      roleMember: 'عضو',
      roleModerator: 'مشرف',
      roleGroupAdmin: 'مدير المجموعة',
      roleAdmin: 'أدمن',
      roleSupport: 'دعم تقني',
      roleNone: 'لا يوجد دور محدد',
    },

    messages: {
      joinSuccess: 'تم إرسال طلب الانضمام.',
      leaveSuccess: 'تمت مغادرة المجموعة.',
      joinError: 'تعذر إرسال طلب الانضمام.',
      leaveError: 'تعذر مغادرة المجموعة.',
    },

    errors: {
      network: 'تعذر تحميل المجموعات. تحقق من اتصال الإنترنت وحاول مرة أخرى.',
      unauthorized: 'انتهت الجلسة. يرجى تسجيل الدخول مرة أخرى.',
      permission: 'لا تملك صلاحية الوصول إلى هذه المجموعات حاليا.',
      generic: 'تعذر تحميل المجموعات. حاول مرة أخرى.',
    },
  },

  printing: {
    title: 'الطباعة',
    home: {
      subtitle: 'طلبات الطباعة',
      illustrationAlt: 'رسم يوضح خدمة الطباعة',
      heading: 'طلب طباعة من ملفاتك',
      description: 'أنشئ طلبا من ملف متاح لك، ثم تابع حالته من طلباتي.',
      newOrder: 'طلب جديد',
      myOrders: 'طلباتي',
      latestOrder: 'آخر طلب طباعة',
      registeredOrders: (count: number) => `${count} طلب مسجل من الباك إند`,
      loadingOrders: 'جاري تحميل طلبات الطباعة...',
      noOrders: 'لا توجد طلبات طباعة حتى الآن.',
    },

    myOrders: {
      title: 'طلباتي',
      subtitle: 'متابعة الحالات',
      createOrder: 'إنشاء طلب',
      emptyTitle: 'لا توجد طلبات طباعة',
      emptyMessage: 'أنشئ أول طلب طباعة من ملف متاح لك.',
      emptyIllustrationAlt: 'رسم يوضح عدم وجود طلبات طباعة',
    },

    create: {
      title: 'طلب طباعة جديد',
      subtitle: 'تسعير آمن من الخادم',
      loadingFiles: 'جاري تحميل الملفات...',
      notesLabel: 'ملاحظات الطلب',
      notesHelper: 'ملاحظات تظهر لموظف الطباعة. لا تضع معلومات حساسة.',
      notesPlaceholder: 'مثال: ترتيب محدد للصفحات',
      pricingNotice:
        'السعر لا يُحسب في الهاتف. يرسل التطبيق الخيارات فقط ويعيد الخادم سعرًا موثقًا.',
      calculatePrice: 'احسب السعر',
      submit: 'تأكيد وإرسال الطلب',
      submitSuccess: 'تم إرسال طلب الطباعة.',
    },

    priceSummary: {
      title: 'ملخص السعر',
      subtitle: 'تسعير صادر من الباك إند',
      recalculate: 'إعادة حساب السعر',
    },

    details: {
      subtitle: 'تفاصيل الطلب',
      loading: 'جاري تحميل تفاصيل الطلب...',
      unavailableTitle: 'الطلب غير متاح',
      unavailableMessage: 'تعذر تحميل تفاصيل طلب الطباعة.',
      statusIllustrationAlt: 'رسم يوضح حالة طلب الطباعة',
      noDate: 'تاريخ الطلب غير متاح',
      extraTitle: 'تفاصيل إضافية',
      completedAt: 'اكتمل الطلب:',
      cancelledAt: 'أُلغي الطلب:',
      updatedAt: 'آخر تحديث:',
      itemsTitle: 'عناصر الطلب',
      itemsSubtitle: 'مصدر الملفات كما أعاده الباك إند',
      noItems: 'لا توجد عناصر مفصلة في استجابة الباك إند.',
      notesTitle: 'ملاحظاتك',
      rejectionReason: 'سبب الرفض',
      cancel: 'إلغاء الطلب',
      cancelSuccess: 'تم إلغاء الطلب.',
      statusIconAlt: 'أيقونة حالة طلب الطباعة',
    },

    fileSelector: {
      title: 'الملف المطلوب طباعته',
      description: 'اختر ملفا من الملفات التي يسمح لك الباك إند بالوصول إليها.',
      searchLabel: 'بحث محلي',
      searchPlaceholder: 'ابحث باسم الملف أو نوعه',
      selectedLabel: 'الملف المحدد',
      unnamedFile: (id: string) => `ملف #${id}`,
      loading: 'جاري تحميل الملفات...',
      noMatches: 'لا توجد ملفات تطابق البحث الحالي.',
      noFiles: 'لا توجد ملفات متاحة للطباعة حاليا.',
      refresh: 'تحديث الملفات',
    },

    copies: {
      title: 'عدد النسخ',
      decrease: 'إنقاص عدد النسخ',
      increase: 'زيادة عدد النسخ',
      limit: 'الحد المسموح حاليا من 1 إلى 99 نسخة.',
    },

    options: {
      title: 'خيارات الطباعة',
      color: 'اللون',
      sides: 'الأوجه',
      paperSize: 'حجم الورق',
      binding: 'التجليد',
      pickupPoint: 'نقطة الاستلام',
      colorBlackWhite: 'أبيض وأسود',
      colorColored: 'ملون',
      sidesSingle: 'وجه واحد',
      sidesDouble: 'وجهان',
      bindingNone: 'بدون',
      bindingStaple: 'تدبيس',
      bindingSpiral: 'تسليك',
      bindingThermal: 'تجليد حراري',
    },

    futureOptions: {
      title: 'تسعير آمن ومرن',
      description:
        'تُرسل خياراتك فقط إلى الخادم، ثم يحسب Backend بانوراما السعر النهائي ويحفظ نسخة من قواعد التسعير المستخدمة. لا يعتمد التطبيق أي سعر محسوب على الجهاز.',
      items: [
        'أبيض وأسود أو ملون',
        'وجه واحد أو وجهين',
        'حجم الورق',
        'التجليد والتسليك',
        'نقطة الاستلام',
      ],
    },

    summaryCard: {
      title: 'ملخص الطلب',
      filesAndCopies: (files: number, copies: number) => `${files} ملف - ${copies} نسخة`,
      noFileSelected: 'لم يتم اختيار ملف.',
      draftLine: (copies: number, paperSize: string, sides: string) =>
        `${copies} نسخة · ${paperSize} · ${sides}`,
      pricePlaceholder: 'احسب السعر من الخادم قبل الإرسال',
    },

    order: {
      fallbackTitle: (id: string) => `طلب طباعة #${id}`,
      fallbackFileTitle: 'ملف مطبوع',
      copies: (count: number) => `${count} نسخة`,
      pages: (count: number) => ` - ${count} صفحة`,
    },

    status: {
      submitted: { label: 'تم الإرسال', action: 'تم استلام طلبك' },
      underReview: { label: 'قيد المراجعة', action: 'تتم مراجعة الطلب' },
      accepted: { label: 'مقبول', action: 'تم قبول الطلب' },
      printing: { label: 'قيد الطباعة', action: 'يتم تجهيز طلبك' },
      ready: { label: 'جاهز للاستلام', action: 'يمكنك استلام الطلب' },
      delivered: { label: 'تم التسليم', action: 'اكتمل الطلب' },
      cancelled: { label: 'ملغي', action: 'تم إلغاء الطلب' },
      rejected: { label: 'مرفوض', action: 'تعذر تنفيذ الطلب' },
      unknownAction: 'تابع حالة الطلب',
    },

    errors: {
      missingFile: 'اختر ملفًا قابلًا للطباعة.',
      invalidCopies: 'عدد النسخ يجب أن يكون بين 1 و99.',
      network: 'تعذر الاتصال بخدمة الطباعة.',
      unauthorized: 'انتهت الجلسة. يرجى تسجيل الدخول.',
      forbidden: 'لا تملك صلاحية استخدام هذه الخدمة.',
      generic: 'تعذر تنفيذ عملية الطباعة.',
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
