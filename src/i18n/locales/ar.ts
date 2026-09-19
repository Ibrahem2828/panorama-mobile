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
    searchNoResultsTitle: 'لا توجد نتائج مطابقة',
    searchNoResultsMessage: 'جرّب استخدام كلمات مختلفة أو تعديل الفلاتر.',
    searchClear: 'مسح البحث',
    errorTitle: 'حدث خطأ',
  },

  /** Fallback copy for API error codes, used when the server sends no message. */
  apiErrors: {
    network: 'تعذر الاتصال بالخادم. تحقق من اتصال الإنترنت.',
    timeout: 'استغرق الطلب وقتا أطول من المتوقع. حاول مرة أخرى.',
    unauthorized: 'انتهت الجلسة أو تحتاج إلى تسجيل الدخول.',
    forbidden: 'لا تملك صلاحية تنفيذ هذا الإجراء.',
    notFound: 'العنصر المطلوب غير موجود.',
    validation: 'تعذر التحقق من البيانات المدخلة.',
    server: 'حدث خطأ في الخادم. حاول لاحقا.',
    rateLimited: 'تم تجاوز عدد المحاولات المسموح. حاول مرة أخرى بعد قليل.',
    unknown: 'حدث خطأ غير متوقع. حاول مرة أخرى.',
  },

  relativeTime: {
    now: 'الآن',
    minutesAgo: (value: number) => `منذ ${value} دقيقة`,
    hoursAgo: (value: number) => `منذ ${value} ساعة`,
    daysAgo: (value: number) => `منذ ${value} يوم`,
  },

  connectivity: {
    offline:
      'لا يوجد اتصال بالإنترنت. ستبقى البيانات المحملة ظاهرة وستُعاد المحاولة عند عودة الاتصال.',
  },

  navigation: {
    home: 'الرئيسية',
    subjects: 'موادي',
    groups: 'المجموعات',
    printing: 'الطباعة',
    profile: 'حسابي',
    preparingStart: 'جاري تجهيز البداية...',
    loadingSetup: 'جاري تحميل بيانات الإعداد...',
    studentSetup: 'إعداد الطالب',
  },

  otpInput: {
    digitLabel: (index: number, total: number) => `الرقم ${index} من ${total}`,
    verified: 'تم التحقق بنجاح',
  },

  placeholder: {
    subtitle: 'بنية التنقل',
    description: 'هذه شاشة مبدئية ضمن بنية التنقل. سيتم تنفيذ التفاصيل الوظيفية في مرحلة لاحقة.',
    note: 'لا يوجد Auth أو API أو منطق منتج فعلي في هذه الشاشة.',
  },

  onboarding: {
    appTagline: 'كل جامعتك في مكان واحد',
    skip: 'تخطي',
    skipLabel: 'تخطي التعريف بالتطبيق',
    paginationLabel: 'مؤشر صفحات التعريف',
    previous: 'السابق',
    next: 'التالي',
    start: 'ابدأ الآن',
    slides: [
      {
        imageLabel: 'رسم يوضح الحياة الجامعية داخل تطبيق بانوراما',
        title: 'كل حياتك الجامعية في مكان واحد',
        description:
          'بانوراما يجمع ملفاتك، موادك، المجموعات، وإعلاناتك الجامعية في تجربة واحدة سهلة.',
      },
      {
        imageLabel: 'رسم يوضح توثيق الحساب الجامعي',
        title: 'وثّق حسابك الجامعي بأمان',
        description:
          'ارفع بطاقتك الجامعية ليتم التحقق من بياناتك ومنحك الوصول إلى المواد والخدمات المناسبة لك.',
      },
      {
        imageLabel: 'رسم يوضح مجموعات المواد الجامعية',
        title: 'انضم إلى مجموعات موادك',
        description: 'تابع النقاشات، الإعلانات، والملفات المرتبطة بموادك وجامعتك بسهولة.',
      },
      {
        imageLabel: 'رسم يوضح الملفات وطلبات الطباعة',
        title: 'ملفاتك وطباعتك بخطوات بسيطة',
        description: 'افتح الملفات الجامعية، اطلب طباعتها، وتابع حالة الطلب من التطبيق.',
      },
    ],
  },

  chat: {
    title: 'المحادثة',
    subtitle: 'محادثة نصية داخل المجموعة',
    loadingMessages: 'جاري تحميل الرسائل...',
    membersCount: (count: number) => `عدد الأعضاء: ${count}`,
    inputPlaceholder: 'اكتب رسالة...',
    send: 'إرسال',
    resend: 'إعادة الإرسال',
    emptyTitle: 'لا توجد رسائل بعد',
    emptyMessage: 'لا توجد رسائل بعد. كن أول من يبدأ النقاش إذا كانت صلاحية الإرسال متاحة.',
    emptyIllustrationAlt: 'رسم يوضح عدم وجود رسائل',
    unnamedSender: 'مستخدم',
    emptyMessageBody: 'رسالة بدون نص',

    membership: {
      member: 'عضو',
      pending: 'بانتظار الموافقة',
      blocked: 'محظور',
      unknown: 'غير محدد',
    },

    connection: {
      connecting: 'جاري الاتصال',
      connected: 'متصل',
      reconnecting: 'إعادة اتصال',
      restAvailable: 'REST متاح',
      offline: 'غير متصل',
      note: 'تعمل المحادثة عبر REST، ويستخدم WebSocket كتحديث اختياري فقط.',
    },

    permission: {
      title: 'إرسال الرسائل غير متاح',
      membersOnly: 'يجب أن تكون عضوا في المجموعة لإرسال الرسائل.',
      adminsOnly: 'الإرسال متاح للمشرفين فقط في هذه المجموعة.',
      blocked: 'لا يمكنك إرسال رسائل في هذه المجموعة حاليا.',
      readOnly: 'يمكنك قراءة الرسائل فقط حاليا.',
      loading: 'جاري تحميل صلاحيات المجموعة.',
      undetermined: 'لا يمكن تحديد صلاحية الإرسال لهذا المجموعة حاليا.',
    },

    errors: {
      network: 'تعذر تحميل الرسائل. تحقق من اتصال الإنترنت وحاول مرة أخرى.',
      unauthorized: 'انتهت الجلسة. يرجى تسجيل الدخول مرة أخرى.',
      permission: 'لا يمكنك إرسال رسائل في هذا المجموعة حاليا.',
      send: 'تعذر إرسال الرسالة. حاول مرة أخرى.',
      generic: 'تعذر تحميل الرسائل. حاول مرة أخرى.',
      websocket: 'تم فقد الاتصال بالمحادثة. يمكنك تحديث الرسائل يدويا.',
      emptyMessage: 'يرجى كتابة رسالة قبل الإرسال.',
      longMessage: 'يجب ألا تتجاوز الرسالة 1000 حرف.',
    },
  },

  notifications: {
    title: 'الإشعارات',
    subtitle: 'مركز الإشعارات داخل التطبيق',
    loading: 'جاري تحميل الإشعارات...',
    emptyTitle: 'لا توجد إشعارات حاليا',
    emptyMessage: 'ستظهر هنا تحديثات التوثيق والمجموعات والملفات وطلبات الطباعة عند توفرها.',
    emptyIllustrationAlt: 'رسم يوضح عدم وجود إشعارات',
    screenNote:
      'هذه شاشة إشعارات داخل التطبيق فقط. لا يتم طلب صلاحيات Push ولا تسجيل device tokens في هذه المرحلة.',
    centerTitle: 'مركز الإشعارات',
    hasUnread: 'لديك إشعارات غير مقروءة تحتاج متابعة.',
    allRead: 'كل الإشعارات الحالية مقروءة.',
    unreadBadge: (count: number) => `${count} غير مقروء`,
    noNew: 'لا جديد',
    markAllRead: 'تعليم الكل كمقروء',
    unread: 'غير مقروء',
    read: 'مقروء',
    noDetails: 'لا توجد تفاصيل إضافية لهذا الإشعار.',
    targetLabel: 'الوجهة',
    typeIconAlt: 'أيقونة نوع الإشعار',
    androidChannelName: 'إشعارات بانوراما',
    fallbackTitle: 'إشعار جديد',

    routeMessages: {
      futureTarget: (label: string) => `تم فتح الإشعار. توجيه ${label} سيكتمل في مرحلة لاحقة.`,
      verification: 'تم فتح الإشعار. توجيه التوثيق محفوظ كأساس وسيكتمل حسب قواعد الوصول.',
      none: 'تم فتح الإشعار بدون وجهة مرتبطة.',
    },

    types: {
      announcement: 'إعلان',
      verification: 'توثيق',
      printing: 'طباعة',
      group: 'مجموعة',
      file: 'ملف',
      support: 'دعم',
      system: 'نظام',
      fallback: 'إشعار',
    },

    targets: {
      printOrder: 'طلب طباعة',
      group: 'مجموعة',
      file: 'ملف',
      support: 'دعم فني',
      verification: 'توثيق',
      announcement: 'إعلان',
    },

    messages: {
      markReadSuccess: 'تم تعليم الإشعار كمقروء.',
      markAllReadSuccess: 'تم تعليم كل الإشعارات كمقروءة.',
    },

    errors: {
      network: 'تعذر تحميل الإشعارات. تحقق من اتصال الإنترنت وحاول مرة أخرى.',
      unauthorized: 'انتهت الجلسة. يرجى تسجيل الدخول مرة أخرى.',
      permission: 'لا تملك صلاحية الوصول إلى هذه الإشعارات حاليا.',
      generic: 'تعذر تحميل الإشعارات. حاول مرة أخرى.',
    },
  },

  subjects: {
    title: 'موادي',
    subtitle: 'موادك حسب بياناتك الأكاديمية',
    loading: 'جاري تحميل المواد...',
    listTitle: 'قائمة المواد',
    listSubtitle: 'الفلاتر الأكاديمية تأتي من ملف الطالب: الاختصاص، السنة، والفصل عند توفرها.',
    searchPlaceholder: 'ابحث باسم المادة أو رمزها',
    searchNote: (shown: number, total: number) =>
      `يتم البحث داخل المواد المحملة فقط. النتائج: ${shown} من ${total}.`,
    emptyTitle: 'لا توجد مواد',
    emptyMessage: 'لا توجد مواد متاحة حاليا.',
    emptyIllustrationAlt: 'رسم يوضح عدم وجود مواد',
    untitled: 'مادة بدون اسم',
    badge: 'مادة',
    codeLabel: (code: string) => `رمز المادة: ${code}`,
    codeBadge: (code: string) => `رمز ${code}`,
    filesCount: (count: number) => `ملفات ${count}`,
    groupsCount: (count: number) => `مجموعات ${count}`,
    lecturesCount: (count: number) => `محاضرات ${count}`,
    academicYear: (name: string) => `السنة ${name}`,
    semester: (name: string) => `الفصل ${name}`,

    details: {
      subtitle: 'تفاصيل المادة',
      listSubtitle: 'تفاصيل المادة من بيانات القائمة',
      loading: 'جاري تحميل بيانات المادة...',
      unavailableTitle: 'المادة غير متاحة',
      unavailableMessage: 'تعذر العثور على المادة.',
      academicYearLabel: 'السنة الأكاديمية',
      semesterLabel: 'الفصل',
      majorLabel: 'الاختصاص',
      orderLabel: 'ترتيب العرض',
      linkedTitle: 'المحتوى المرتبط',
      filesTitle: 'الملفات',
      filesDescription:
        'افتح قائمة الملفات المتاحة داخل التطبيق. لا يوجد فلتر موثق حسب المادة في هذه المرحلة.',
      groupsTitle: 'المجموعات',
      groupsDescription:
        'افتح المجموعات العامة المتاحة. لا يوجد ربط موثق حسب المادة في هذه المرحلة.',
      announcementsTitle: 'الإعلانات',
      announcementsDescription: 'لا يوجد endpoint موثق لإعلانات المادة في هذه المرحلة.',
    },

    errors: {
      network: 'تعذر تحميل المواد. تحقق من اتصال الإنترنت وحاول مرة أخرى.',
      unauthorized: 'انتهت الجلسة. يرجى تسجيل الدخول مرة أخرى.',
      generic: 'تعذر تحميل المواد. حاول مرة أخرى.',
      missingMajor: 'لا يمكن تحميل المواد قبل إكمال البيانات الأكاديمية.',
    },
  },

  search: {
    title: 'البحث',
    subtitle: 'ابحث في المحتوى المسموح لحسابك',
    label: 'عبارة البحث',
    placeholder: 'اسم مادة أو مجموعة أو ملف',
    loading: 'جاري البحث...',
    partialResults: 'ظهرت نتائج جزئية لأن أحد مصادر البحث لم يستجب. يمكنك المحاولة مجددًا.',
    startTitle: 'ابدأ البحث',
    startMessage: 'اكتب حرفين على الأقل. تظهر فقط النتائج التي يسمح بها Backend لحسابك.',
    noResultsMessage: 'جرّب كلمات أقل أو اسمًا مختلفًا.',
    resultsCount: (count: number) => `${count} نتيجة`,
    subjectsSection: 'المواد',
    groupsSection: 'المجموعات',
    filesSection: 'الملفات',
    kindSubject: 'مادة',
    kindGroup: 'مجموعة',
    kindFile: 'ملف',
    untitledSubject: 'مادة بدون اسم',
    subjectSubtitle: 'مادة دراسية',
    untitledGroup: 'مجموعة بدون اسم',
    groupSubtitle: 'مجموعة أكاديمية',
    untitledFile: 'ملف بدون عنوان',
    fileSubtitle: 'ملف متاح داخل التطبيق',

    errors: {
      network: 'تعذر البحث بسبب الاتصال. حاول مرة أخرى.',
      unauthorized: 'انتهت الجلسة. يرجى تسجيل الدخول مجددًا.',
      generic: 'تعذر إتمام البحث حاليًا.',
    },
  },

  studentProfile: {
    setupTitle: 'إكمال الملف الأكاديمي',
    setupSubtitle: 'إعداد الطالب',
    loading: 'جاري تحميل بيانات الملف الأكاديمي...',
    cardSubtitle: 'اختر بياناتك الدراسية واربطها بالرقم الجامعي قبل إرسال بطاقة الطالب.',
    noAcademicDataTitle: 'لا توجد بيانات أكاديمية',
    noAcademicDataMessage: 'تعذر تحميل الجامعات حاليا. حاول مرة أخرى أو تواصل مع إدارة الجامعة.',
    studentNumberTitle: 'الرقم الجامعي',
    studentNumberHelper: 'أدخل رقمك الجامعي كما يظهر في بطاقة الطالب.',
    parseNumber: 'تحليل الرقم',
    universityLabel: 'الجامعة',
    universityEmpty: 'لا توجد جامعات متاحة حاليا.',
    facultyLabel: 'الكلية',
    facultyEmpty: 'اختر الجامعة أولا لعرض الكليات.',
    majorLabel: 'الاختصاص',
    majorEmpty: 'اختر الكلية أولا لعرض الاختصاصات.',
    academicYearLabel: 'السنة الأكاديمية',
    academicYearEmpty: 'لا توجد سنوات أكاديمية متاحة حاليا.',
    semesterLabel: 'الفصل الدراسي',
    semesterEmpty: 'لا توجد فصول دراسية متاحة حاليا.',
    majorSubjectsTitle: 'مواد الاختصاص',
    majorSubjectsLoading: 'جاري تحميل المواد المرتبطة بالاختصاص...',
    majorSubjectsLoaded: (count: number) => `تم تحميل ${count} مادة مرتبطة باختصاصك.`,
    majorSubjectsEmpty: 'لا توجد مواد متاحة لهذا الاختصاص حاليا.',
    saveAndContinue: 'حفظ ومتابعة التوثيق',

    selectField: {
      emptyText: 'لا توجد خيارات متاحة حاليا.',
      loading: 'جاري تحميل الخيارات...',
      selected: 'محدد',
    },

    intro: {
      title: 'إكمال ملف الطالب',
      description:
        'يجب إكمال الملف الأكاديمي وتوثيق بطاقة الطالب قبل استخدام خدمات بانوراما للطلاب.',
    },

    stepper: {
      academicProfile: 'الملف الأكاديمي',
      studentCard: 'بطاقة الطالب',
      verificationStatus: 'حالة التوثيق',
    },

    numberPreview: {
      title: 'معاينة الرقم الجامعي',
      hint: 'أدخل الرقم الجامعي ثم اضغط تحليل الرقم لعرض القراءة المتوقعة قبل الحفظ.',
      noDetails: 'تم تحليل الرقم، لكن لم يرجع الخادم تفاصيل إضافية.',
      studentNumber: 'الرقم الجامعي',
      universityCode: 'رمز الجامعة',
      facultyCode: 'رمز الكلية',
      yearCode: 'رمز السنة',
      serial: 'الرقم التسلسلي',
      university: 'الجامعة',
      faculty: 'الكلية',
      academicYear: 'السنة الأكاديمية',
      semester: 'الفصل',
      major: 'الاختصاص',
    },

    errors: {
      network: 'تعذر الاتصال بالخادم. تحقق من اتصال الإنترنت ثم حاول مرة أخرى.',
      validation: 'يرجى التأكد من البيانات الأكاديمية المدخلة.',
      unauthorized: 'انتهت الجلسة. يرجى تسجيل الدخول مرة أخرى.',
      generic: 'تعذر تنفيذ العملية. حاول مرة أخرى.',
      missingFields: 'يرجى إكمال كل حقول الملف الأكاديمي قبل المتابعة.',
      missingStudentNumber: 'يرجى إدخال الرقم الجامعي أولا.',
    },
  },

  verificationFlow: {
    submitTitle: 'إرسال بطاقة الطالب',
    resubmitTitle: 'إعادة إرسال التوثيق',
    subtitle: 'إعداد الطالب',
    loading: 'جاري تحميل حالة التوثيق...',
    cardSubtitle:
      'ارفع صورة واضحة لبطاقة الطالب من المعرض. التوثيق مطلوب للوصول إلى خدمات بانوراما.',
    whyTitle: 'لماذا التوثيق؟',
    whyDescription:
      'يؤكد التوثيق هويتك كطالب جامعي ويفتح الوصول إلى المجموعات والملفات والطباعة والدعم. بعد الإرسال، ستراجع الإدارة طلبك وتصلك الحالة في هذه الشاشة.',
    lockedNote: 'لا يمكن إرسال طلب جديد أثناء هذه الحالة. تابع صفحة الحالة للتحديثات.',
    trackStatus: 'متابعة حالة التوثيق',
    submitRequest: 'إرسال طلب التوثيق',
    resubmitRequest: 'إعادة إرسال الطلب',
    sentTitle: 'تم إرسال الطلب',
    sentHeading: 'تم إرسال طلب التوثيق',
    sentMessage: 'تم استلام طلب التوثيق وسيتم مراجعته من الإدارة.',
    sentIllustrationAlt: 'رسم يوضح نجاح إرسال طلب التوثيق',

    status: {
      title: 'حالة التوثيق',
      cardSubtitle: 'تابع نتيجة مراجعة بطاقة الطالب، وأعد الإرسال عند الحاجة فقط.',
      sendCard: 'إرسال بطاقة الطالب',
      resendUpdated: 'إعادة إرسال صورة محدثة',
      pendingNote:
        'سيتم إشعارك عند اكتمال المراجعة. يمكنك تحديث الحالة لاحقا دون إعادة إرسال الطلب.',
      refreshStatus: 'تحديث الحالة',
      approvedTitle: 'تم قبول التوثيق بنجاح',
      approvedDescription: 'يمكنك الآن الدخول إلى التطبيق واستخدام جميع الخدمات الطلابية.',
      enterApp: 'الدخول إلى التطبيق',
    },

    errors: {
      network: 'تعذر الاتصال بالخادم أثناء التحقق من حالة التوثيق. حاول مرة أخرى.',
      unauthorized: 'انتهت الجلسة. يرجى تسجيل الدخول مرة أخرى.',
      validation: 'يرجى اختيار صورة واضحة لبطاقة الطالب.',
      generic: 'تعذر تنفيذ طلب التوثيق. حاول مرة أخرى.',
      missingImage: 'يرجى اختيار صورة واضحة لبطاقة الطالب قبل الإرسال.',
    },

    statusCard: {
      title: 'حالة التوثيق',
      illustrationAlt: 'رسم يوضح حالة التوثيق',
      rejectionTitle: 'سبب الرفض أو الملاحظة',
      approvedLabel: 'موثق',
      approvedDescription: 'تم قبول طلب التوثيق. يمكنك الآن استخدام خدمات التطبيق للطلاب.',
      pendingLabel: 'قيد المراجعة',
      pendingDescription:
        'طلبك قيد المراجعة من الإدارة. لا حاجة لإعادة الإرسال إلا إذا طُلب منك ذلك صراحة.',
      rejectedLabel: 'مرفوض',
      rejectedDescription: 'تم رفض طلب التوثيق. راجع السبب أدناه ثم أرسل صورة محدثة وواضحة.',
      needsUpdateLabel: 'بحاجة إلى تحديث',
      needsUpdateDescription: 'يحتاج طلبك إلى صورة أو بيانات أوضح. أرسل بطاقة طالب محدثة.',
      notSubmittedLabel: 'غير مرسل',
      notSubmittedDescription:
        'لم يتم إرسال طلب توثيق بعد. التوثيق مطلوب للوصول إلى المجموعات والملفات والخدمات الطلابية.',
    },

    imagePicker: {
      title: 'صورة بطاقة الطالب',
      description:
        'اختر صورة واضحة من المعرض تظهر فيها بطاقة الطالب كاملة بدون انعكاس أو قص. تأكد من وضوح الاسم والرقم الجامعي.',
      guideAlt: 'دليل تصوير بطاقة الطالب',
      exampleAlt: (label: string) => `مثال بطاقة ${label}`,
      noImage: 'لم يتم اختيار صورة بعد.',
      pick: 'اختيار صورة',
      replace: 'استبدال الصورة',
      remove: 'إزالة الصورة',
      permissionDenied: 'يرجى السماح للتطبيق بالوصول إلى الصور لاختيار بطاقة الطالب.',
      invalidImage: 'لم يتم اختيار صورة صالحة. حاول مرة أخرى.',
      exampleClear: 'واضحة',
      exampleBlurry: 'غير واضحة',
      exampleCropped: 'مقصوصة',
      exampleDark: 'مظلمة',
    },
  },

  feedback: {
    centerTitle: 'رأيك يصنع النسخة القادمة',
    centerSubtitle: 'تقييم واقتراحات',
    thanksTitle: 'شكرًا لمساهمتك',
    thanksMessage: 'تم تسجيل رأيك بأمان وسيظهر ضمن لوحة متابعة فريق بانوراما.',
    thanksHeaderTitle: 'ساعدنا على التطوير',
    thanksHeaderSubtitle: 'مشاركة الرأي',
    trackMine: 'متابعة مشاركاتي',
    sendAnother: 'إرسال مشاركة أخرى',
    privacyTitle: 'مشاركة منظمة وقابلة للمتابعة',
    privacyNote:
      'لا ترسل كلمات مرور أو رموز تحقق أو بيانات حساسة. نستخدم هذه الملاحظات لتحسين الأداء والواجهات والميزات.',
    kindLabel: 'نوع المشاركة',
    ratingLabel: 'التقييم',
    ratingOf: (value: number) => `${value} من 5`,
    suggestionTitleLabel: 'عنوان الاقتراح',
    suggestionTitlePlaceholder: 'مثال: تحسين البحث داخل المحاضرات',
    suggestionDetailsLabel: 'تفاصيل الاقتراح',
    shareDetailsLabel: 'تفاصيل المشاركة',
    submit: 'إرسال إلى فريق بانوراما',
    myFeedback: 'مشاركاتي',
    publicSuggestions: 'اقتراحات المجتمع',
    missingSuggestion: 'أدخل عنوانًا واضحًا وتفاصيل الاقتراح.',
    missingDetails: 'اكتب تفاصيل تساعد فريق بانوراما على المراجعة.',
    promptSuccess: 'شكرًا لمساعدتنا في تطوير بانوراما.',

    kinds: {
      rating: 'تقييم عام',
      ratingHint: 'قيّم تجربتك مع بانوراما',
      suggestion: 'اقتراح',
      suggestionHint: 'شارك فكرة تطوير قابلة للتنفيذ',
      issue: 'مشكلة',
      issueHint: 'أبلغ عن خلل وظيفي أو بصري',
      complaint: 'شكوى',
      complaintHint: 'صف تجربة لم تكن بالمستوى المتوقع',
      praise: 'إشادة',
      praiseHint: 'أخبرنا بما أعجبك',
    },

    prompt: {
      title: 'رأيك يهمنا',
      question: 'كيف كانت تجربتك؟',
      noteLabel: 'ملاحظة اختيارية',
      notePlaceholder: 'ما الذي أعجبك؟ وما الذي يحتاج تحسينًا؟',
      submit: 'إرسال التقييم',
      later: 'لاحقًا',
    },

    mine: {
      title: 'مشاركاتي',
      subtitle: 'تقييمات واقتراحات',
      loading: 'جاري تحميل المشاركات...',
      addEntry: 'إضافة مشاركة',
      emptyTitle: 'لا توجد مشاركات بعد',
      emptyMessage: 'أرسل تقييمًا أو اقتراحًا لتطوير النسخة القادمة.',
      sent: 'تم إرسال المشاركة.',
      teamReply: (message: string) => `رد الفريق: ${message}`,
      refresh: 'تحديث القائمة',
      statusNew: 'جديد',
      statusReviewed: 'تمت المراجعة',
      statusPlanned: 'ضمن الخطة',
      statusInProgress: 'قيد التنفيذ',
      statusResolved: 'مكتمل',
      statusRejected: 'غير معتمد',
      statusDuplicate: 'مكرر',
    },

    publicList: {
      title: 'اقتراحات المجتمع',
      subtitle: 'أفكار تم اعتمادها أو العمل عليها',
      loading: 'جاري تحميل الاقتراحات...',
      shareIdea: 'شارك اقتراحك',
      emptyTitle: 'لا توجد اقتراحات منشورة',
      emptyMessage: 'ستظهر هنا الاقتراحات التي اعتمدها فريق بانوراما للنقاش أو التنفيذ.',
      votes: (count: number) => `${count} مؤيد`,
      vote: 'تأييد الاقتراح',
      unvote: 'إلغاء التأييد',
    },

    errors: {
      network: 'تعذر إرسال التقييم. تحقق من الاتصال وحاول مرة أخرى.',
      rateLimited: 'تم إرسال عدة تقييمات مؤخرًا. حاول لاحقًا.',
      generic: 'تعذر إرسال التقييم حاليًا.',
    },
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

  home: {
    title: 'الرئيسية',
    subtitle: 'لوحة الطالب',
    loading: 'جاري تحميل الصفحة الرئيسية...',

    greeting: {
      withName: (name: string) => `مرحبا، ${name}`,
      generic: 'مرحبا بك في بانوراما',
      tagline: 'لوحة الطالب — كل جامعتك في مكان واحد',
      unread: (count: number) => `${count} جديد`,
      accountType: (role: string) => `نوع الحساب: ${role}`,
    },

    academicSummary: {
      title: 'ملخصك الأكاديمي',
      university: (value: string) => `الجامعة: ${value}`,
      faculty: (value: string) => `الكلية: ${value}`,
      major: (value: string) => `الاختصاص: ${value}`,
    },

    studentStatus: {
      title: 'حالة الطالب',
      loadingLabel: 'قيد التحديث',
      loadingDescription: 'سيتم عرض حالة الملف والتوثيق بعد اكتمال تحميل بيانات الحساب.',
      incompleteLabel: 'ملف غير مكتمل',
      incompleteDescription: 'أكمل بياناتك الأكاديمية للاستفادة من خدمات الطالب.',
      verifiedLabel: 'حسابك موثق',
      verifiedDescription: 'يمكنك الآن استخدام الخدمات المخصصة للطلاب الموثقين.',
      pendingLabel: 'قيد المراجعة',
      pendingDescription: 'طلب التوثيق قيد المراجعة من الإدارة.',
      rejectedLabel: 'مرفوض',
      rejectedDescription: 'طلب التوثيق مرفوض. راجع سبب الرفض من شاشة التوثيق.',
      needsUpdateLabel: 'يحتاج تحديث',
      needsUpdateDescription: 'طلب التوثيق يحتاج صورة أو بيانات أوضح.',
      unknownLabel: 'أكمل بياناتك الأكاديمية',
      unknownDescription: 'لم يتم تأكيد حالة التوثيق بعد.',
    },

    announcements: {
      title: 'الإعلانات',
      subtitle: 'آخر الإعلانات المرتبطة بحسابك.',
      emptyTitle: 'لا توجد إعلانات حاليا',
      emptyMessage: 'ستظهر هنا الإعلانات المهمة عند توفرها.',
      emptyIllustrationAlt: 'رسم يوضح عدم وجود إعلانات',
      untitled: 'إعلان',
      noDetails: 'لا توجد تفاصيل إضافية لهذا الإعلان.',
    },

    services: {
      title: 'الخدمات',
      subtitle: 'اختصارات سريعة لأهم خدمات الطالب.',
      subjects: 'موادي',
      subjectsDescription: 'انتقل إلى قائمة المواد الدراسية.',
      groups: 'المجموعات',
      groupsDescription: 'تصفح المجموعات والمساحات المرتبطة بالدراسة.',
      files: 'الملفات',
      filesDescription: 'افتح الملفات المتاحة داخل التطبيق.',
      search: 'البحث',
      searchDescription: 'ابحث في المواد والمجموعات والملفات المسموحة لحسابك.',
      printing: 'الطباعة',
      printingDescription: 'اطلب طباعة الملفات ومتابعة الطلبات.',
      support: 'الدعم',
      supportDescription: 'افتح تذاكر الدعم الفني ومتابعتها.',
      notifications: 'الإشعارات',
      notificationsDescription: 'تابع التنبيهات المهمة داخل حسابك.',
      profile: 'حسابي',
      profileDescription: 'راجع بيانات الحساب والإعدادات.',
    },

    /** Single-letter glyphs standing in for service icons; each locale picks its own. */
    serviceInitials: {
      subjects: 'م',
      groups: 'غ',
      files: 'ف',
      search: 'ب',
      printing: 'ط',
      support: 'د',
      notifications: 'ن',
      profile: 'ح',
    },

    errors: {
      network: 'تعذر تحميل الصفحة الرئيسية. تحقق من اتصال الإنترنت ثم حاول مرة أخرى.',
      unauthorized: 'انتهت الجلسة. يرجى تسجيل الدخول مرة أخرى.',
      generic: 'تعذر تحميل الصفحة الرئيسية. حاول مرة أخرى.',
    },
  },

  support: {
    title: 'الدعم الفني',
    subtitle: 'تذاكر دعم الطلاب',
    loading: 'جاري تحميل تذاكر الدعم...',
    intro:
      'يمكنك إنشاء تذكرة دعم ومتابعة الردود الخاصة بك فقط. لا توجد مرفقات أو محادثة فورية في هذه المرحلة.',
    ticketsCount: (count: number) => `عدد التذاكر: ${count}`,
    createTicket: 'إنشاء تذكرة جديدة',
    createFirstTicket: 'إنشاء أول تذكرة',
    emptyTitle: 'لا توجد تذاكر دعم',
    emptyMessage: 'لم يتم إنشاء أي تذاكر دعم بعد.',
    emptyIllustrationAlt: 'رسم يوضح عدم وجود تذاكر دعم',
    fallbackTitle: (id: string) => `تذكرة دعم #${id}`,
    emptyMessageBody: 'رسالة بدون نص',

    create: {
      title: 'إنشاء تذكرة دعم',
      subtitle: 'إرسال مشكلة إلى فريق الدعم',
      notice:
        'يتم إرسال التصنيف والعنوان والرسالة فقط حسب واجهة الدعم الرسمية. لا يتم رفع مرفقات أو طلب تصنيفات من الخادم في هذه المرحلة.',
      subjectLabel: 'عنوان المشكلة',
      subjectPlaceholder: 'مثال: مشكلة في فتح ملف',
      messageLabel: 'تفاصيل المشكلة',
      messagePlaceholder: 'اكتب التفاصيل التي تساعد فريق الدعم على فهم المشكلة',
      submit: 'إرسال التذكرة',
      categoryTitle: 'تصنيف التذكرة',
      categoryNote: 'التصنيفات ثابتة محليا في MVP ولا يتم جلبها من API في هذه المرحلة.',
    },

    details: {
      title: 'تفاصيل التذكرة',
      subtitle: 'متابعة المحادثة مع فريق الدعم',
      loading: 'جاري تحميل تفاصيل التذكرة...',
      messagesTitle: 'سجل الرسائل',
      messagesSubtitle: 'الرسائل المرتبطة بهذه التذكرة',
      noMessagesTitle: 'لا توجد رسائل إضافية',
      noMessagesMessage: 'ستظهر ردود فريق الدعم والرسائل الإضافية هنا عند توفرها.',
      addMessageTitle: 'إضافة رسالة',
      addMessageSubtitle: 'إرسال تحديث لفريق الدعم',
      reload: 'إعادة التحميل',
      notFoundTitle: 'التذكرة غير متوفرة',
      notFoundMessage: 'تعذر العثور على التذكرة محليا. حاول إعادة التحميل.',
      primaryMessage: 'الرسالة الأساسية',
      staffSender: 'فريق الدعم',
      selfSender: 'أنت',
      replyLabel: 'إضافة رسالة',
      replyPlaceholder: 'اكتب تفاصيل إضافية لفريق الدعم',
      sendReply: 'إرسال الرسالة',
    },

    status: {
      open: 'مفتوحة',
      waiting: 'قيد الانتظار',
      inProgress: 'قيد المعالجة',
      answered: 'تم الرد',
      resolved: 'محلولة',
      closed: 'مغلقة',
      rejected: 'مرفوضة',
    },

    category: {
      technical: 'مشكلة تقنية',
      account: 'الحساب',
      verification: 'التوثيق',
      printing: 'الطباعة',
      files: 'الملفات',
      groups: 'المجموعات',
      other: 'أخرى',
      custom: 'تصنيف مخصص',
      none: 'غير مصنف',
    },

    priority: {
      low: 'منخفضة',
      medium: 'متوسطة',
      high: 'عالية',
      urgent: 'عاجلة',
      custom: 'أولوية مخصصة',
      none: 'غير محددة',
    },

    validation: {
      categoryRequired: 'يرجى اختيار التصنيف.',
      subjectRequired: 'يرجى إدخال عنوان المشكلة.',
      messageRequired: 'يرجى كتابة تفاصيل المشكلة.',
      replyRequired: 'يرجى كتابة الرسالة قبل الإرسال.',
      /** Shown by both the store and the ticket screen, which each had their own copy. */
      closedTicket: 'لا يمكن إضافة رسائل جديدة على تذكرة مغلقة أو محلولة.',
    },

    messages: {
      createSuccess: 'تم إنشاء تذكرة الدعم.',
      sendSuccess: 'تم إرسال الرسالة.',
    },

    errors: {
      network: 'تعذر تحميل تذاكر الدعم. تحقق من اتصال الإنترنت وحاول مرة أخرى.',
      unauthorized: 'انتهت الجلسة. يرجى تسجيل الدخول مرة أخرى.',
      permission: 'لا تملك صلاحية الوصول إلى هذه التذكرة حاليا.',
      generic: 'تعذر تنفيذ عملية الدعم. حاول مرة أخرى.',
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

    changePassword: {
      title: 'تغيير كلمة المرور',
      subtitle: 'تغيير كلمة المرور للحساب الحالي',
      note: 'لا يتم حفظ كلمات المرور خارج مسودة الإدخال الحالية، ولا يتم تسجيلها في السجلات.',
      current: 'كلمة المرور الحالية',
      new: 'كلمة المرور الجديدة',
      confirm: 'تأكيد كلمة المرور الجديدة',
      success: 'تم تغيير كلمة المرور بنجاح.',
      currentRequired: 'يرجى إدخال كلمة المرور الحالية.',
      newRequired: 'يرجى إدخال كلمة المرور الجديدة.',
      confirmRequired: 'يرجى تأكيد كلمة المرور الجديدة.',
      tooShort: 'يجب أن تكون كلمة المرور الجديدة 8 أحرف على الأقل.',
      mismatch: 'كلمتا المرور غير متطابقتين.',
    },

    errors: {
      network: 'تعذر تغيير كلمة المرور. تحقق من اتصال الإنترنت وحاول مرة أخرى.',
      unauthorized: 'انتهت الجلسة. يرجى تسجيل الدخول مرة أخرى.',
      validation: 'يرجى التأكد من بيانات كلمة المرور المدخلة.',
      generic: 'تعذر تغيير كلمة المرور. حاول مرة أخرى.',
    },
  },
} as const;
