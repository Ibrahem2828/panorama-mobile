/**
 * Source catalog. Every user-visible string belongs here, grouped by feature.
 *
 * Parameterised strings are functions rather than templates with placeholders, so the
 * compiler checks the arguments and each locale can order or inflect them differently.
 */
export const ar = {
  appName: 'بانوراما',

  tabs: {
    home: 'الرئيسية',
    subjects: 'المواد',
    groups: 'المجموعات',
    printing: 'الطباعة',
    profile: 'حسابي',
  },

  common: {
    loading: 'جارٍ التحميل...',
    retry: 'إعادة المحاولة',
    error: 'حدث خطأ ما',
    comingSoon: 'قريبًا',
    back: 'رجوع',
    cancel: 'إلغاء',
    save: 'حفظ',
    refresh: 'تحديث',
    notSpecified: 'غير محدد',
    notAvailable: 'غير متاح',
    unknown: 'غير معروف',
    open: 'فتح',
    searchLocal: 'بحث',
    retryVerify: 'إعادة التحقق',
    lastUpdatedAt: (time: string) => `آخر تحديث: ${time}`,
    noSearchResultsAlt: 'رسم يوضح عدم وجود نتائج بحث',
    searchNoResultsTitle: 'لا توجد نتائج مطابقة',
    searchNoResultsMessage: 'جرّب كلمات أخرى أو غيّر خيارات التصفية.',
    searchClear: 'مسح البحث',
    errorTitle: 'حدث خطأ ما',
  },

  /** Fallback copy for API error codes, used when the server sends no message. */
  apiErrors: {
    network: 'تعذر الاتصال. تحقق من الإنترنت وحاول مرة أخرى.',
    timeout: 'استغرق الأمر وقتًا أطول من المعتاد. حاول مرة أخرى.',
    unauthorized: 'انتهت جلستك. سجّل الدخول مرة أخرى للمتابعة.',
    forbidden: 'لا تتوفر لك صلاحية تنفيذ هذا الإجراء.',
    notFound: 'تعذر العثور على المحتوى المطلوب.',
    validation: 'راجع البيانات التي أدخلتها وحاول مرة أخرى.',
    server: 'حدثت مشكلة مؤقتة. حاول بعد قليل.',
    rateLimited: 'عدد المحاولات كبير. انتظر قليلًا ثم حاول مرة أخرى.',
    unknown: 'حدث خطأ ما. حاول مرة أخرى.',
    conflict: 'تغيّرت البيانات أثناء تنفيذ طلبك. حدّث الشاشة وحاول مرة أخرى.',
    maintenance: 'بانوراما قيد الصيانة حاليًا. سنعود قريبًا.',
    updateRequired: 'حدّث التطبيق إلى أحدث إصدار للمتابعة.',
    idempotencyKeyReused: 'تغيّرت البيانات بعد إرسال الطلب. راجعها ثم أرسل الطلب مرة أخرى.',
    idempotencyInProgress: 'طلبك قيد التنفيذ بالفعل. انتظر لحظات ثم تحقق من النتيجة.',
  },

  lifecycle: {
    maintenanceTitle: 'التطبيق قيد الصيانة',
    maintenanceMessage: 'نعمل على تحسين الخدمة. سيعمل التطبيق تلقائيًا فور انتهاء الصيانة.',
    maintenanceEstimatedEnd: (time: string) => `الانتهاء المتوقع: ${time}`,
    retry: 'إعادة المحاولة',
    checking: 'جارٍ التحقق من حالة الخدمة...',
    stillDown: 'ما زال التطبيق قيد الصيانة.',
    checkFailed: 'تعذر التحقق من حالة الخدمة. تحقق من الإنترنت وحاول مرة أخرى.',
    updateTitle: 'يلزم تحديث التطبيق',
    updateMessage: 'لم يعد هذا الإصدار مدعومًا. حدّث بانوراما من المتجر للمتابعة.',
    updateAction: 'تحديث التطبيق',
    updateOpenFailed: 'تعذر فتح المتجر. ابحث عن «بانوراما» في متجر التطبيقات وحدّثه.',
  },

  relativeTime: {
    now: 'الآن',
    minutesAgo: (value: number) =>
      value === 1
        ? 'منذ دقيقة'
        : value === 2
          ? 'منذ دقيقتين'
          : `منذ ${value} ${value >= 3 && value <= 10 ? 'دقائق' : 'دقيقة'}`,
    hoursAgo: (value: number) =>
      value === 1
        ? 'منذ ساعة'
        : value === 2
          ? 'منذ ساعتين'
          : `منذ ${value} ${value >= 3 && value <= 10 ? 'ساعات' : 'ساعة'}`,
    daysAgo: (value: number) =>
      value === 1
        ? 'منذ يوم'
        : value === 2
          ? 'منذ يومين'
          : `منذ ${value} ${value >= 3 && value <= 10 ? 'أيام' : 'يومًا'}`,
  },

  connectivity: {
    offline:
      'لا يوجد اتصال بالإنترنت. ستبقى البيانات التي حُمّلت ظاهرة، وسيُحدَّث كل شيء عند عودة الاتصال.',
  },

  navigation: {
    home: 'الرئيسية',
    subjects: 'المواد',
    groups: 'المجموعات',
    printing: 'الطباعة',
    profile: 'حسابي',
    preparingStart: 'جارٍ تجهيز حسابك...',
    loadingSetup: 'جارٍ تحميل بياناتك...',
    studentSetup: 'إعداد حساب الطالب',
  },

  forms: {
    close: 'إغلاق',
    searchPlaceholder: 'ابحث...',
    noResults: 'لا توجد نتائج مطابقة.',
    noOptions: 'لا توجد خيارات متاحة حاليًا.',
  },

  otpInput: {
    digitLabel: (index: number, total: number) => `الرقم ${index} من ${total}`,
    verified: 'تم التحقق بنجاح',
    inputLabel: (total: number) => `رمز التحقق المكوّن من ${total} أرقام`,
  },

  placeholder: {
    subtitle: 'قريبًا',
    description: 'هذه الصفحة ستتوفر قريبًا.',
    note: 'نعمل على تجهيزها لك.',
  },

  onboarding: {
    appTagline: 'كل جامعتك في مكان واحد',
    skip: 'تخطي',
    skipLabel: 'تخطي مقدمة التطبيق',
    paginationLabel: 'صفحات المقدمة',
    previous: 'السابق',
    next: 'التالي',
    start: 'ابدأ الآن',
    slides: [
      {
        imageLabel: 'رسم يوضح الحياة الجامعية داخل تطبيق بانوراما',
        title: 'كل حياتك الجامعية في مكان واحد',
        description: 'بانوراما يجمع موادك وملفاتك ومجموعاتك وإعلانات جامعتك في تطبيق واحد سهل.',
      },
      {
        imageLabel: 'رسم يوضح توثيق الحساب الجامعي',
        title: 'وثّق حسابك الجامعي بأمان',
        description:
          'ارفع صورة بطاقتك الجامعية لنتحقق من بياناتك ونفتح لك المواد والخدمات المناسبة.',
      },
      {
        imageLabel: 'رسم يوضح مجموعات المواد الجامعية',
        title: 'انضم إلى مجموعات موادك',
        description: 'تابع النقاشات والإعلانات والملفات الخاصة بموادك وجامعتك بسهولة.',
      },
      {
        imageLabel: 'رسم يوضح الملفات وطلبات الطباعة',
        title: 'ملفاتك وطباعتك بخطوات بسيطة',
        description: 'افتح ملفات موادك، واطلب طباعتها، وتابع طلبك من التطبيق.',
      },
    ],
  },

  chat: {
    title: 'المحادثة',
    subtitle: 'محادثة المجموعة',
    loadingMessages: 'جارٍ تحميل الرسائل...',
    membersCount: (count: number) => `الأعضاء: ${count}`,
    inputPlaceholder: 'اكتب رسالة...',
    send: 'إرسال',
    resend: 'إعادة الإرسال',
    emptyTitle: 'لا توجد رسائل بعد',
    emptyMessage: 'ستظهر الرسائل هنا. كن أول من يبدأ النقاش إن كان الإرسال متاحًا لك.',
    emptyIllustrationAlt: 'رسم يوضح عدم وجود رسائل',
    unnamedSender: 'عضو',
    emptyMessageBody: 'رسالة بدون نص',

    membership: {
      member: 'عضو',
      pending: 'بانتظار الموافقة',
      blocked: 'محظور',
      unknown: 'غير محدد',
    },

    connection: {
      connecting: 'جارٍ الاتصال',
      connected: 'متصل',
      reconnecting: 'جارٍ إعادة الاتصال…',
      restAvailable: 'جارٍ إعادة الاتصال…',
      offline: 'غير متصل',
      note: 'ستصلك الرسائل الجديدة تلقائيًا عند عودة الاتصال.',
      offlineBanner:
        'لا يوجد اتصال بالإنترنت. يمكنك قراءة الرسائل المحفوظة، وسيعود التحديث عند عودة الاتصال.',
    },

    today: 'اليوم',
    yesterday: 'أمس',
    systemMessage: 'رسالة من بانوراما',
    messagesLog: 'رسائل المحادثة',
    composerLabel: 'نص الرسالة',
    sending: 'جارٍ الإرسال…',
    sendingAttachment: (percent: number) => `جارٍ رفع الصورة ${percent}%`,
    failed: 'لم تُرسل الرسالة',
    retrySend: 'إعادة المحاولة',
    discard: 'حذف',
    cancelUpload: 'إلغاء الرفع',
    loadOlder: 'تحميل رسائل أقدم',
    loadingOlder: 'جارٍ تحميل رسائل أقدم…',
    loadOlderFailed: 'تعذر تحميل الرسائل الأقدم. اضغط للمحاولة مرة أخرى.',
    jumpToLatest: 'الانتقال إلى أحدث الرسائل',
    newMessages: (count: number) =>
      count === 1
        ? 'رسالة جديدة'
        : count === 2
          ? 'رسالتان جديدتان'
          : `${count} ${count >= 3 && count <= 10 ? 'رسائل' : 'رسالة'} جديدة`,
    charCount: (used: number, max: number) => `${used} / ${max}`,
    messageFrom: (name: string) => `رسالة من ${name}`,
    ownMessage: 'رسالتك',

    attachment: {
      attach: 'إرفاق صورة',
      remove: 'إزالة الصورة',
      image: 'صورة',
      file: 'ملف مرفق',
      tapToView: 'اضغط للعرض',
      viewerTitle: 'عرض المرفق',
      loading: 'جارٍ تجهيز المرفق…',
      loadError: 'تعذر عرض المرفق. حاول مرة أخرى.',
      permissionDenied: 'اسمح للتطبيق بالوصول إلى الصور لتتمكن من اختيار صورة.',
      pickError: 'تعذر اختيار الصورة. حاول مرة أخرى.',
      sizeLabel: (megabytes: string) => `${megabytes} م.ب`,
    },

    guard: {
      title: 'المحادثة للأعضاء فقط',
      message: 'انضم إلى المجموعة وانتظر الموافقة لتقرأ الرسائل وتشارك في المحادثة.',
      pendingMessage: 'طلب انضمامك قيد المراجعة. ستفتح المحادثة فور الموافقة عليه.',
      removedTitle: 'لم يعد بإمكانك فتح هذه المحادثة',
      removedMessage: 'تغيّرت عضويتك في هذه المجموعة. ارجع إلى المجموعة لمعرفة التفاصيل.',
      back: 'العودة إلى المجموعة',
    },

    permission: {
      title: 'إرسال الرسائل غير متاح',
      membersOnly: 'يجب أن تكون عضوًا في المجموعة لإرسال الرسائل.',
      adminsOnly: 'الإرسال في هذه المجموعة للمشرفين فقط.',
      blocked: 'لا يمكنك إرسال رسائل في هذه المجموعة حاليًا.',
      readOnly: 'يمكنك قراءة الرسائل فقط حاليًا.',
      loading: 'جارٍ التحقق من صلاحيات المجموعة.',
      undetermined: 'تعذر تحديد إمكانية الإرسال في هذه المجموعة الآن.',
    },

    errors: {
      network: 'تعذر تحميل الرسائل. تحقق من اتصال الإنترنت وحاول مرة أخرى.',
      unauthorized: 'انتهت جلستك. سجّل الدخول مرة أخرى للمتابعة.',
      permission: 'لا يمكنك إرسال رسائل في هذه المجموعة حاليًا.',
      send: 'تعذر إرسال الرسالة. حاول مرة أخرى.',
      generic: 'تعذر تحميل الرسائل. حاول مرة أخرى.',
      websocket: 'انقطع الاتصال بالمحادثة. نحاول إعادته.',
      emptyMessage: 'اكتب رسالة قبل الإرسال.',
      longMessage: 'الرسالة طويلة. الحد الأقصى 4000 حرف.',
      rateLimited: 'أرسلت رسائل كثيرة بسرعة. انتظر قليلا ثم حاول مرة أخرى.',
      sendNetwork: 'لم تُرسل الرسالة بسبب ضعف الاتصال. اضغط لإعادة المحاولة.',
      attachmentType: 'الصيغ المدعومة للصور: PNG وJPG وWEBP.',
      attachmentSize: 'حجم الصورة كبير. الحد الأقصى 25 م.ب.',
      attachmentEmpty: 'الصورة المختارة فارغة. اختر صورة أخرى.',
      attachmentRejected: 'تعذر قبول المرفق. جرّب صورة أخرى.',
    },
  },

  notifications: {
    title: 'الإشعارات',
    subtitle: 'كل تنبيهاتك في مكان واحد',
    loading: 'جارٍ تحميل الإشعارات...',
    emptyTitle: 'لا توجد إشعارات حاليًا',
    emptyMessage: 'ستجد هنا تنبيهات التوثيق والمجموعات والملفات وطلبات الطباعة.',
    emptyIllustrationAlt: 'رسم يوضح عدم وجود إشعارات',
    centerTitle: 'مركز الإشعارات',
    hasUnread: 'لديك إشعارات لم تقرأها بعد.',
    allRead: 'قرأت كل إشعاراتك.',
    unreadBadge: (count: number) => `${count} غير مقروء`,
    noNew: 'لا جديد',
    markAllRead: 'تعليم الكل كمقروء',
    unread: 'غير مقروء',
    read: 'مقروء',
    noDetails: 'لا توجد تفاصيل إضافية لهذا الإشعار.',
    typeIconAlt: 'أيقونة نوع الإشعار',
    androidChannelName: 'إشعارات بانوراما',
    fallbackTitle: 'إشعار جديد',

    filterLabel: 'عرض الإشعارات',
    filterAll: 'الكل',
    filterUnread: 'غير المقروءة',
    unreadEmptyTitle: 'لا توجد إشعارات غير مقروءة',
    unreadEmptyMessage: 'قرأت كل إشعاراتك.',
    dayToday: 'اليوم',
    dayYesterday: 'أمس',
    dayUnknown: 'تاريخ غير معروف',
    expired: 'منتهي',
    expiredNotice: 'انتهت صلاحية هذا الإشعار، لذلك لا يمكن فتح ما يرتبط به.',
    expiredHidden: (count: number) => `إشعارات منتهية مخفية: ${count}`,
    showExpired: 'عرض المنتهية',
    hideExpired: 'إخفاء المنتهية',
    loadMore: 'عرض المزيد',
    loadingMore: 'جارٍ تحميل المزيد...',
    openFailed: 'تعذر فتح هذا الإشعار.',

    prefs: {
      title: 'تفضيلات الإشعارات',
      description: 'اختر أنواع الإشعارات التي تريد استلامها.',
      show: 'عرض',
      hide: 'إخفاء',
      inApp: 'إشعارات التطبيق',
      typesTitle: 'الأنواع',
      loadFailed: 'تعذر تحميل تفضيلاتك. حاول مرة أخرى.',
      saveFailed: 'تعذر حفظ تفضيلاتك. حاول مرة أخرى.',
    },

    routeMessages: {
      verification: 'يمكنك متابعة حالة التوثيق من شاشة التوثيق.',
      none: 'لا توجد صفحة مرتبطة بهذا الإشعار.',
    },

    types: {
      announcement: 'إعلان',
      verification: 'توثيق',
      printing: 'طباعة',
      group: 'مجموعة',
      file: 'ملف',
      support: 'الدعم',
      system: 'النظام',
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
      unauthorized: 'انتهت جلستك. سجّل الدخول مرة أخرى للمتابعة.',
      permission: 'لا تتوفر لك صلاحية عرض هذه الإشعارات حاليًا.',
      generic: 'تعذر تحميل الإشعارات. حاول مرة أخرى.',
    },
  },

  subjects: {
    title: 'المواد',
    subtitle: 'مواد كليتك',
    loading: 'جارٍ تحميل المواد...',
    listTitle: 'قائمة المواد',
    listSubtitle: 'تُعرض المواد افتراضيًا حسب سنتك وفصلك، ويمكنك تغيير ذلك من الفلاتر.',
    searchPlaceholder: 'ابحث باسم المادة أو رمزها',
    searchNote: (shown: number, total: number) =>
      `يشمل البحث المواد المعروضة فقط. النتائج: ${shown} من ${total}.`,
    emptyTitle: 'لا توجد مواد',
    emptyMessage: 'لا توجد مواد متاحة الآن.',
    emptyIllustrationAlt: 'رسم يوضح عدم وجود مواد',
    untitled: 'مادة بدون اسم',
    badge: 'مادة',
    codeLabel: (code: string) => `رمز المادة: ${code}`,
    filters: {
      year: 'السنة',
      semester: 'الفصل',
      all: 'الكل',
    },
    locked: {
      title: 'المحاضرات والملفات لأعضاء مجموعة المادة',
      message: 'انضم إلى مجموعة هذه المادة وانتظر موافقة المشرف لتفتح لك المحاضرات والملفات.',
      pending: 'طلب انضمامك قيد المراجعة. ستفتح لك المحاضرات والملفات فور الموافقة عليه.',
      join: 'الانضمام إلى مجموعة المادة',
      openGroup: 'عرض مجموعة المادة',
      rejected:
        'تم رفض طلب انضمامك إلى مجموعة المادة. يمكنك إرسال طلب جديد لفتح المحاضرات والملفات.',
      blocked:
        'تم حظرك من مجموعة هذه المادة، لذلك لا يمكنك الوصول إلى المحاضرات والملفات. تواصل مع الدعم إن كان هذا خطأً.',
      left: 'غادرت مجموعة هذه المادة. انضم إليها من جديد لتفتح لك المحاضرات والملفات.',
      rejoin: 'إرسال طلب انضمام جديد',
      loadError: 'تعذر التحقق من عضويتك في مجموعة المادة. تحقق من الاتصال وحاول مرة أخرى.',
    },
    general: 'مادة عامة',
    resultsCount: (count: number) =>
      count === 1
        ? 'مادة واحدة'
        : count === 2
          ? 'مادتان'
          : `${count} ${count >= 3 && count <= 10 ? 'مواد' : 'مادة'}`,
    levelHint:
      'تُعرض المواد افتراضيًا حسب سنتك وفصلك. اختر «الكل» لتصفح أي سنة أو فصل، مثل مواد الإعادة.',
    codeBadge: (code: string) => `رمز ${code}`,
    filesCount: (count: number) => `ملفات ${count}`,
    groupsCount: (count: number) => `مجموعات ${count}`,
    lecturesCount: (count: number) => `محاضرات ${count}`,
    academicYear: (name: string) => `السنة ${name}`,
    semester: (name: string) => `الفصل ${name}`,

    details: {
      subtitle: 'تفاصيل المادة',
      listSubtitle: 'تفاصيل المادة',
      loading: 'جارٍ تحميل بيانات المادة...',
      unavailableTitle: 'المادة غير متاحة',
      unavailableMessage: 'تعذر العثور على هذه المادة.',
      academicYearLabel: 'السنة الدراسية',
      semesterLabel: 'الفصل',
      majorLabel: 'الاختصاص',
      orderLabel: 'الترتيب',
      linkedTitle: 'محتوى المادة',
      filesTitle: 'الملفات',
      filesDescription: 'تصفح ملفات المادة وملخصاتها المتاحة لك.',
      groupsTitle: 'المجموعات',
      groupsDescription: 'انضم إلى مجموعات هذه المادة وتابع النقاش مع زملائك.',
      announcementsTitle: 'الإعلانات',
      announcementsDescription: 'لا توجد إعلانات خاصة بهذه المادة حاليًا.',
      chatTitle: 'دردشة المجموعة',
      chatDescription: 'تحدّث مع زملائك وأعضاء مجموعة المادة.',
    },

    errors: {
      network: 'تعذر تحميل المواد. تحقق من اتصال الإنترنت وحاول مرة أخرى.',
      unauthorized: 'انتهت جلستك. سجّل الدخول مرة أخرى للمتابعة.',
      generic: 'تعذر تحميل المواد. حاول مرة أخرى.',
      missingFaculty: 'أكمل بياناتك الدراسية أولًا لتظهر لك المواد.',
    },
  },

  lectures: {
    title: 'المحاضرات',
    subtitle: 'اقرأ محاضرات موادك والمحاضرات العامة داخل التطبيق، وأضف ملاحظاتك الخاصة.',
    listTitle: 'قائمة المحاضرات',
    searchPlaceholder: 'ابحث بعنوان المحاضرة',
    generalFilter: 'محاضرات عامة',
    generalBadge: 'عامة',
    subjectFilterLabel: 'تصفية حسب المادة',
    allSubjects: 'كل المواد',
    emptyTitle: 'لا توجد محاضرات بعد',
    emptyMessage: 'ستظهر هنا المحاضرات المنشورة لموادك والمحاضرات العامة.',
    loading: 'جارٍ تحميل المحاضرات...',
    totalCount: (count: number) => `عدد المحاضرات: ${count}`,
    pagesCount: (count: number) =>
      count === 1
        ? 'صفحة واحدة'
        : count === 2
          ? 'صفحتان'
          : `${count} ${count >= 3 && count <= 10 ? 'صفحات' : 'صفحة'}`,
    updatedOn: (date: string) => `آخر تحديث ${date}`,
    untitled: 'محاضرة بدون عنوان',
    openLecture: (title: string) => `فتح المحاضرة: ${title}`,
    subjectSection: {
      title: 'محاضرات المادة',
      description: 'المحاضرات المنشورة لهذه المادة.',
      empty: 'لا توجد محاضرات منشورة لهذه المادة بعد.',
      openAll: 'عرض كل المحاضرات',
    },
    status: {
      uploaded: 'تم الرفع',
      queued: 'بانتظار الدور',
      scanning: 'جارٍ الفحص',
      converting: 'جارٍ تحويل الملف',
      extracting: 'جارٍ استخراج النص',
      rendering: 'جارٍ تجهيز الصفحات',
      ready: 'جاهزة',
      failed: 'تعذرت المعالجة',
      quarantined: 'غير متاحة',
      unknown: 'غير معروفة',
    },
    processing: {
      title: 'المحاضرة قيد التجهيز',
      message: 'نجهّز صفحات هذه المحاضرة لتقرأها بأمان، وستُفتح تلقائيًا عند اكتمال التجهيز.',
      step: (label: string) => `الخطوة الحالية: ${label}`,
      checkNow: 'تحقق الآن',
      autoCheck: 'نتحقق تلقائيًا كل فترة ما دامت الشاشة مفتوحة.',
      failedTitle: 'تعذّر تجهيز المحاضرة',
      failedMessage:
        'حدثت مشكلة أثناء تجهيز هذه المحاضرة. حاول لاحقًا، وإن استمرت المشكلة تواصل مع الدعم.',
      quarantinedTitle: 'المحاضرة غير متاحة',
      quarantinedMessage: 'هذه المحاضرة غير متاحة حاليًا.',
      unpublishedTitle: 'المحاضرة غير متاحة للعرض',
      unpublishedMessage: 'هذه المحاضرة غير منشورة حاليًا أو غير متاحة لك.',
    },
    detail: {
      unavailableTitle: 'تعذّر فتح المحاضرة',
      loading: 'جارٍ فتح المحاضرة...',
    },
    viewer: {
      pageOf: (page: number, total: number) => `الصفحة ${page} من ${total}`,
      prev: 'الصفحة السابقة',
      next: 'الصفحة التالية',
      jumpTitle: 'الانتقال إلى صفحة',
      jumpLabel: 'رقم الصفحة',
      jumpGo: 'انتقال',
      jumpInvalid: (total: number) => `أدخل رقما بين 1 و ${total}.`,
      zoomIn: 'تكبير',
      zoomOut: 'تصغير',
      zoomLevel: (percent: number) => `التكبير ${percent}%`,
      zoomHint: 'اضغط مرتين على الصفحة للتكبير أو التصغير.',
      showText: 'عرض النص',
      hideText: 'عرض الصفحة',
      textTitle: 'نص الصفحة',
      textEmpty: 'لا يوجد نص لهذه الصفحة.',
      textLoading: 'جارٍ تحميل النص...',
      textError: 'تعذّر تحميل نص الصفحة.',
      loadingPage: 'جارٍ تحميل الصفحة...',
      sessionStarting: 'جارٍ تجهيز العرض...',
      pageAlt: (title: string, page: number) => `${title} - الصفحة ${page}`,
      pageErrorTitle: 'تعذّر تحميل الصفحة',
      pageErrorMessage: 'تحقق من اتصالك بالإنترنت ثم أعد المحاولة.',
      retry: 'إعادة المحاولة',
      protectedNotice: 'محتوى محمي: يُعرض داخل التطبيق فقط ولا يمكن حفظه أو مشاركته.',
      notes: 'الملاحظات',
      bookmarkAdd: 'وضع علامة على هذه الصفحة',
      bookmarkRemove: 'إزالة العلامة',
      bookmarkError: 'تعذّر تحديث العلامة. حاول مرة أخرى.',
      noPages: 'لا توجد صفحات في هذه المحاضرة.',
    },
    notes: {
      title: 'ملاحظاتي',
      subtitle: 'ملاحظات خاصة بك فقط، لا يراها غيرك.',
      contentPlaceholder: 'اكتب ملاحظتك هنا...',
      attachToPage: (page: number) => `ربط الملاحظة بالصفحة ${page}`,
      pageChip: (page: number) => `ص ${page}`,
      generalNote: 'ملاحظة عامة',
      jumpToPage: (page: number) => `الانتقال إلى الصفحة ${page}`,
      add: 'إضافة ملاحظة',
      save: 'حفظ',
      pending: 'جارٍ الحفظ...',
      cancel: 'إلغاء',
      edit: 'تعديل',
      delete: 'حذف',
      deleteTitle: 'حذف الملاحظة؟',
      deleteMessage: 'ستُحذف هذه الملاحظة ولا يمكن التراجع عن ذلك.',
      deleteConfirm: 'حذف الملاحظة',
      favorite: 'إضافة إلى المفضلة',
      unfavorite: 'إزالة من المفضلة',
      close: 'إغلاق الملاحظات',
      filterAll: 'الكل',
      filterPage: (page: number) => `الصفحة ${page}`,
      filterBookmarks: 'العلامات',
      empty: 'لا توجد ملاحظات بعد. أضف أول ملاحظة لك.',
      emptyPage: 'لا توجد ملاحظات لهذه الصفحة.',
      emptyBookmarks: 'لا توجد علامات بعد.',
      loading: 'جارٍ تحميل الملاحظات...',
      loadError: 'تعذّر تحميل الملاحظات.',
      charCount: (count: number, max: number) => `${count} / ${max}`,
      bookmarkBadge: 'علامة',
      bookmarkContent: (page: number) => `علامة على الصفحة ${page}`,
      errorEmpty: 'اكتب نص الملاحظة أولًا.',
      errorTooLong: (max: number) => `الحد الأقصى للملاحظة ${max} حرف.`,
      errorConflict: 'عُدّلت هذه الملاحظة من جهاز آخر. حمّلنا آخر نسخة، راجعها ثم حاول مرة أخرى.',
      errorSave: 'تعذّر حفظ الملاحظة. حاول مرة أخرى.',
      errorDelete: 'تعذّر حذف الملاحظة. حاول مرة أخرى.',
    },
    errors: {
      network: 'تعذّر الاتصال. تحقق من الإنترنت وحاول مرة أخرى.',
      timeout: 'استغرق الأمر وقتًا طويلًا. حاول مرة أخرى.',
      rateLimited: 'الطلبات كثيرة الآن. انتظر قليلًا ثم حاول مرة أخرى.',
      featureDisabled: 'هذه الخدمة غير متاحة مؤقتًا.',
      unavailable: 'الخدمة غير متاحة مؤقتًا. حاول مرة أخرى بعد قليل.',
      notFound: 'هذا المحتوى غير متاح أو انتهت مدة عرضه. أعد فتحه وحاول مرة أخرى.',
      forbidden: 'لا تتوفر لك صلاحية عرض هذا المحتوى.',
      unknown: 'حدث خطأ ما. حاول مرة أخرى.',
    },
  },

  search: {
    title: 'البحث',
    subtitle: 'ابحث في موادك ومجموعاتك وملفاتك',
    label: 'عبارة البحث',
    placeholder: 'اسم مادة أو مجموعة أو ملف أو إعلان',
    loading: 'جارٍ البحث...',
    partialResults: 'بعض النتائج لم تظهر لتعذر البحث في أحد الأقسام. حاول مرة أخرى.',
    filterLabel: 'نوع النتائج',
    filterAll: 'الكل',
    showMore: 'عرض المزيد',
    tooShort: 'اكتب حرفين على الأقل.',
    tooLong: (max: number) => `الحد الأقصى ${max} حرفًا.`,
    announcementsSection: 'الإعلانات',
    kindAnnouncement: 'إعلان',
    untitledAnnouncement: 'إعلان بدون عنوان',
    announcementSubtitle: 'إعلان',
    fileInGroup: 'ملف في مجموعة',
    startTitle: 'ابدأ البحث',
    startMessage: 'اكتب حرفين على الأقل لتبدأ البحث.',
    noResultsMessage: 'جرّب كلمات أقل أو اسمًا مختلفًا.',
    resultsCount: (count: number) =>
      count === 1
        ? 'نتيجة واحدة'
        : count === 2
          ? 'نتيجتان'
          : `${count} ${count >= 3 && count <= 10 ? 'نتائج' : 'نتيجة'}`,
    subjectsSection: 'المواد',
    groupsSection: 'المجموعات',
    filesSection: 'الملفات',
    kindSubject: 'مادة',
    kindGroup: 'مجموعة',
    kindFile: 'ملف',
    untitledSubject: 'مادة بدون اسم',
    subjectSubtitle: 'مادة دراسية',
    untitledGroup: 'مجموعة بدون اسم',
    groupSubtitle: 'مجموعة دراسية',
    untitledFile: 'ملف بدون عنوان',
    fileSubtitle: 'ملف متاح داخل التطبيق',

    errors: {
      network: 'تعذر البحث. تحقق من الإنترنت وحاول مرة أخرى.',
      unauthorized: 'انتهت جلستك. سجّل الدخول مرة أخرى للمتابعة.',
      generic: 'تعذر إتمام البحث الآن. حاول مرة أخرى.',
    },
  },

  studentProfile: {
    setupTitle: 'إكمال الملف الأكاديمي',
    setupSubtitle: 'إعداد حساب الطالب',
    loading: 'جارٍ تحميل بياناتك الدراسية...',
    cardSubtitle: 'اختر بياناتك الدراسية وأدخل رقمك الجامعي قبل إرسال بطاقتك.',
    noAcademicDataTitle: 'لا توجد بيانات دراسية',
    noAcademicDataMessage:
      'تعذر تحميل قائمة الجامعات الآن. حاول مرة أخرى، وإن استمرت المشكلة تواصل مع الدعم.',
    studentNumberTitle: 'الرقم الجامعي',
    studentNumberHelper: 'أدخل رقمك الجامعي كما يظهر على بطاقتك.',
    studentNumberPlaceholder: '2150094',
    academicSectionTitle: 'بياناتك الدراسية',
    universityPlaceholder: 'اختر الجامعة',
    facultyPlaceholder: 'اختر الكلية',
    facultyNone: 'لا توجد كليات متاحة لهذه الجامعة حاليًا.',
    academicYearPlaceholder: 'اختر السنة الدراسية',
    semesterPlaceholder: 'اختر الفصل الدراسي',
    majorNone: 'بدون تخصص',
    majorNoneAvailable: 'لا توجد اختصاصات لهذه الكلية. هذا الحقل اختياري.',
    parseNumber: 'قراءة الرقم',
    universityLabel: 'الجامعة',
    universityEmpty: 'لا توجد جامعات متاحة حاليًا.',
    facultyLabel: 'الكلية',
    facultyEmpty: 'اختر الجامعة أولًا لتظهر الكليات.',
    majorLabel: 'الاختصاص (اختياري)',
    majorOptionalHint: 'اختياري، ويبدأ الاختصاص عادةً من السنة الثالثة.',
    majorEmpty: 'اختر الكلية أولًا لتظهر الاختصاصات.',
    academicYearLabel: 'السنة الدراسية',
    academicYearEmpty: 'لا توجد سنوات دراسية متاحة حاليًا.',
    semesterLabel: 'الفصل الدراسي',
    semesterEmpty: 'لا توجد فصول دراسية متاحة حاليًا.',
    majorSubjectsTitle: 'مواد كليتك',
    majorSubjectsLoading: 'جارٍ تحميل مواد كليتك...',
    majorSubjectsLoaded: (count: number) =>
      `عدد المواد المتوفرة في كليتك: ${count}. يمكنك فتح مواد أي سنة أو فصل.`,
    majorSubjectsEmpty: 'لا توجد مواد متاحة لهذه الكلية حاليًا.',
    saveAndContinue: 'حفظ ومتابعة التوثيق',

    selectField: {
      emptyText: 'لا توجد خيارات متاحة حاليًا.',
      loading: 'جارٍ تحميل الخيارات...',
      selected: 'محدد',
      placeholder: 'اختر',
    },

    intro: {
      title: 'إكمال ملف الطالب',
      description: 'أكمل بياناتك الدراسية ووثّق بطاقتك الجامعية لتستفيد من خدمات بانوراما.',
    },

    stepper: {
      academicProfile: 'الملف الأكاديمي',
      studentCard: 'بطاقة الطالب',
      verificationStatus: 'حالة التوثيق',
      stepOf: (current: number, total: number) => `الخطوة ${current} من ${total}`,
    },

    numberPreview: {
      title: 'تعرّفنا على بياناتك',
      hint: 'اكتب رقمك الجامعي ثم اضغط «قراءة الرقم» لنتعرّف على كليتك وسنتك الدراسية.',
      noDetails: 'قرأنا الرقم، لكن لا توجد تفاصيل إضافية لعرضها.',
      studentNumber: 'الرقم الجامعي',
      universityCode: 'رمز الجامعة',
      facultyCode: 'رمز الكلية',
      yearCode: 'رمز السنة',
      serial: 'الرقم التسلسلي',
      university: 'الجامعة',
      faculty: 'الكلية',
      academicYear: 'السنة الدراسية',
      semester: 'الفصل',
      major: 'الاختصاص',
    },

    errors: {
      network: 'تعذر الاتصال. تحقق من الإنترنت وحاول مرة أخرى.',
      validation: 'راجع بياناتك الدراسية وحاول مرة أخرى.',
      unauthorized: 'انتهت جلستك. سجّل الدخول مرة أخرى للمتابعة.',
      generic: 'تعذر إكمال العملية. حاول مرة أخرى.',
      missingFields: 'أكمل الحقول المطلوبة قبل المتابعة.',
      missingStudentNumber: 'أدخل رقمك الجامعي أولًا.',
    },
  },

  verificationFlow: {
    submitTitle: 'إرسال بطاقة الطالب',
    resubmitTitle: 'إعادة إرسال التوثيق',
    subtitle: 'إعداد حساب الطالب',
    loading: 'جارٍ تحميل حالة التوثيق...',
    cardSubtitle:
      'ارفع من المعرض صورة واضحة لبطاقتك الجامعية. التوثيق مطلوب لاستخدام خدمات بانوراما.',
    whyTitle: 'لماذا التوثيق؟',
    whyDescription:
      'التوثيق يؤكد أنك طالب جامعي ويفتح لك المجموعات والملفات والطباعة والدعم. بعد الإرسال تراجع الإدارة طلبك، وتجد النتيجة في شاشة الحالة.',
    lockedNote: 'لا يمكن إرسال طلب جديد الآن. تابع شاشة الحالة لمعرفة المستجدات.',
    trackStatus: 'متابعة حالة التوثيق',
    submitRequest: 'إرسال طلب التوثيق',
    resubmitRequest: 'إعادة إرسال الطلب',
    sentTitle: 'تم إرسال الطلب',
    sentHeading: 'تم إرسال طلب التوثيق',
    sentMessage: 'استلمنا طلبك، وستراجعه الإدارة قريبًا.',
    sentIllustrationAlt: 'رسم يوضح نجاح إرسال طلب التوثيق',

    status: {
      title: 'حالة التوثيق',
      cardSubtitle: 'تابع نتيجة مراجعة بطاقتك، ولا تعد الإرسال إلا عند الحاجة.',
      sendCard: 'إرسال بطاقة الطالب',
      resendUpdated: 'إعادة إرسال صورة محدثة',
      pendingNote: 'سنُعلمك عند اكتمال المراجعة. يمكنك تحديث الحالة لاحقًا دون إعادة إرسال الطلب.',
      refreshStatus: 'تحديث الحالة',
      approvedTitle: 'تم توثيق حسابك',
      approvedDescription: 'يمكنك الآن الدخول إلى التطبيق واستخدام كل خدمات الطلاب.',
      enterApp: 'الدخول إلى التطبيق',
    },

    errors: {
      network: 'تعذر التحقق من حالة التوثيق. تحقق من الإنترنت وحاول مرة أخرى.',
      unauthorized: 'انتهت جلستك. سجّل الدخول مرة أخرى للمتابعة.',
      validation: 'اختر صورة واضحة لبطاقتك الجامعية.',
      generic: 'تعذر إرسال طلب التوثيق. حاول مرة أخرى.',
      missingImage: 'اختر صورة واضحة لبطاقتك قبل الإرسال.',
    },

    statusCard: {
      title: 'حالة التوثيق',
      illustrationAlt: 'رسم يوضح حالة التوثيق',
      rejectionTitle: 'سبب الرفض أو الملاحظة',
      approvedLabel: 'موثق',
      approvedDescription: 'تم توثيق حسابك. يمكنك الآن استخدام خدمات الطلاب.',
      pendingLabel: 'قيد المراجعة',
      pendingDescription: 'طلبك قيد المراجعة. لا حاجة لإعادة الإرسال إلا إذا طلبنا منك ذلك.',
      rejectedLabel: 'مرفوض',
      rejectedDescription: 'لم يُقبل طلب التوثيق. راجع السبب أدناه ثم أرسل صورة أوضح.',
      needsUpdateLabel: 'بحاجة إلى تحديث',
      needsUpdateDescription: 'يحتاج طلبك إلى صورة أو بيانات أوضح. أرسل صورة محدّثة لبطاقتك.',
      notSubmittedLabel: 'لم يُرسل',
      notSubmittedDescription:
        'لم ترسل طلب توثيق بعد. التوثيق مطلوب للوصول إلى المجموعات والملفات وخدمات الطلاب.',
    },

    timeline: {
      label: 'مراحل التوثيق',
      submitted: 'تم إرسال الطلب',
      submittedPending: 'أرسل صورة بطاقتك لنبدأ',
      review: 'قيد المراجعة',
      reviewCurrent: 'تراجع الإدارة بطاقتك الآن',
      reviewUpcoming: 'تراجع الإدارة بطاقتك بعد الإرسال',
      approved: 'تم التوثيق',
      needsUpdate: 'بحاجة إلى صورة محدّثة',
      decisionUpcoming: 'ستصلك النتيجة هنا',
    },

    imagePicker: {
      title: 'صورة بطاقة الطالب',
      description:
        'اختر من المعرض صورة واضحة تظهر فيها بطاقتك كاملة دون انعكاس أو قص، مع وضوح الاسم والرقم الجامعي.',
      pick: 'اختر صورة من المعرض',
      pickHint: 'بطاقتك كاملة وبوضوح',
      previewAlt: 'صورة بطاقتك الجامعية المختارة',
      uploading: (percent: number) => `جارٍ رفع الصورة ${percent}%`,
      tipsTitle: 'لتتم الموافقة بسرعة',
      goodWhole: 'البطاقة ظاهرة كاملة داخل الصورة',
      goodReadable: 'الاسم والرقم الجامعي واضحان',
      goodLight: 'إضاءة جيدة بدون انعكاس',
      badCropped: 'صورة مقصوصة أو ناقصة',
      badBlurry: 'صورة مهتزة أو غير واضحة',
      badGlare: 'صورة مظلمة أو عليها انعكاس',
      replace: 'استبدال الصورة',
      remove: 'إزالة الصورة',
      permissionDenied: 'اسمح للتطبيق بالوصول إلى الصور لتختار صورة بطاقتك.',
      invalidImage: 'تعذر استخدام هذه الصورة. اختر صورة أخرى.',
    },
  },

  feedback: {
    centerTitle: 'رأيك يصنع النسخة القادمة',
    centerSubtitle: 'تقييم واقتراحات',
    thanksTitle: 'شكرًا لمساهمتك',
    thanksMessage: 'وصل رأيك إلى فريق بانوراما. نقدّر وقتك.',
    thanksHeaderTitle: 'ساعدنا على التطوير',
    thanksHeaderSubtitle: 'شاركنا رأيك',
    trackMine: 'متابعة مشاركاتي',
    sendAnother: 'إرسال مشاركة أخرى',
    privacyTitle: 'قبل أن ترسل',
    privacyNote:
      'لا تكتب كلمات مرور أو رموز تحقق أو بيانات شخصية حساسة. نستخدم ملاحظاتك لتحسين التطبيق.',
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
    missingSuggestion: 'اكتب عنوانًا واضحًا وتفاصيل الاقتراح.',
    missingDetails: 'اكتب تفاصيل تساعد فريق بانوراما على فهم ملاحظتك.',
    promptSuccess: 'شكرًا لمساعدتنا في تطوير بانوراما.',

    kinds: {
      rating: 'تقييم عام',
      ratingHint: 'قيّم تجربتك مع بانوراما',
      suggestion: 'اقتراح',
      suggestionHint: 'شاركنا فكرة لتحسين التطبيق',
      issue: 'مشكلة',
      issueHint: 'أبلغنا عن مشكلة في عمل التطبيق أو شكله',
      complaint: 'شكوى',
      complaintHint: 'أخبرنا عن تجربة لم تكن كما توقعت',
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
      loading: 'جارٍ تحميل المشاركات...',
      addEntry: 'إضافة مشاركة',
      emptyTitle: 'لا توجد مشاركات بعد',
      emptyMessage: 'أرسل تقييمًا أو اقتراحًا لتطوير النسخة القادمة.',
      sent: 'تم إرسال مشاركتك.',
      teamReply: (message: string) => `رد الفريق: ${message}`,
      refresh: 'تحديث القائمة',
      loadMore: 'عرض المزيد',
      loadingMore: 'جارٍ تحميل المزيد...',
      hiddenBadge: 'مخفية',
      deletionBadge: 'طُلب حذفها',
      privacy: {
        hide: 'إخفاء',
        hideTitle: 'إخفاء هذه الملاحظة؟',
        hideMessage: 'ستختفي ملاحظتك من الاقتراحات العامة، وسيبقى الفريق قادرًا على الاطلاع عليها.',
        hideConfirm: 'نعم، أخفِ الملاحظة',
        hideDone: 'تم إخفاء ملاحظتك.',
        requestDelete: 'طلب الحذف',
        deleteTitle: 'طلب حذف هذه الملاحظة؟',
        deleteMessage:
          'سنخفي الملاحظة الآن ونرسل طلب حذفها إلى الفريق لمراجعته. لا يمكن التراجع عن هذا الطلب من التطبيق.',
        deleteConfirm: 'نعم، اطلب الحذف',
        deleteDone: 'تم إرسال طلب حذف ملاحظتك.',
        failed: 'تعذر تنفيذ طلبك. حاول مرة أخرى.',
        cancel: 'تراجع',
      },
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
      subtitle: 'أفكار اعتُمدت أو يعمل عليها الفريق',
      loading: 'جارٍ تحميل الاقتراحات...',
      shareIdea: 'شارك اقتراحك',
      emptyTitle: 'لا توجد اقتراحات منشورة',
      emptyMessage: 'ستظهر هنا الاقتراحات التي يعتمدها فريق بانوراما.',
      votes: (count: number) => `التأييدات: ${count}`,
      vote: 'تأييد الاقتراح',
      unvote: 'إلغاء التأييد',
    },

    errors: {
      network: 'تعذر إرسال رأيك. تحقق من الإنترنت وحاول مرة أخرى.',
      rateLimited: 'أرسلت عدة مشاركات مؤخرًا. حاول لاحقًا.',
      generic: 'تعذر إرسال رأيك الآن. حاول مرة أخرى.',
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
    notSubmitted: 'لم يُرسل',
  },

  environment: {
    production: 'نسخة رسمية',
    preview: 'نسخة تجريبية',
    development: 'نسخة تطوير',
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
      phonePlaceholder: '9XX XXX XXX',
      studentNumber: 'الرقم الجامعي',
      password: 'كلمة المرور',
      passwordPlaceholder: 'أدخل كلمة المرور',
      passwordConfirm: 'تأكيد كلمة المرور',
      showPassword: 'إظهار كلمة المرور',
      hidePassword: 'إخفاء كلمة المرور',
      show: 'إظهار',
      hide: 'إخفاء',
      otpCode: 'رمز التحقق',
      emailPlaceholder: 'name@example.com',
      studentNumberHelper: 'كما يظهر على بطاقتك الجامعية.',
      passwordHint: 'ثمانية أحرف على الأقل.',
      passwordConfirmPlaceholder: 'أعد كتابة كلمة المرور',
    },

    login: {
      title: 'تسجيل الدخول',
      tagline: 'موادك ومجموعاتك وملفاتك وخدماتك الجامعية في مكان واحد.',
      cardSubtitle: 'استخدم بريدك الإلكتروني أو رقم هاتفك.',
      submit: 'تسجيل الدخول',
      createAccount: 'إنشاء حساب جديد',
      forgotPassword: 'نسيت كلمة المرور؟',
      missingCredentials: 'أدخل بريدك أو رقم هاتفك مع كلمة المرور.',
      identifierRequired: 'أدخل بريدك أو رقم هاتفك.',
      passwordRequired: 'أدخل كلمة المرور.',
      noAccount: 'ليس لديك حساب بعد؟',
    },

    accountType: {
      illustrationAlt: 'رسم يوضح إنشاء حساب',
      title: 'اختر نوع الحساب',
      description: 'اختر نوع الحساب الذي يناسبك.',
      studentAlt: 'طالب',
      studentTitle: 'حساب طالب',
      studentDescription: 'للوصول إلى المواد والمجموعات والملفات الدراسية بعد التوثيق.',
      studentAction: 'متابعة كطالب',
      normalAlt: 'حساب عام',
      normalTitle: 'حساب عام',
      normalDescription: 'للخدمات العامة والطباعة والدعم.',
      normalAction: 'متابعة بحساب عام',
    },

    registerStudent: {
      title: 'إنشاء حساب طالب',
      subtitle: 'سنرسل رمز التحقق إلى بريدك الإلكتروني.',
      cardTitle: 'بيانات الحساب',
      cardSubtitle: 'بعد التحقق ستكمل بياناتك الدراسية وترفع صورة بطاقتك الجامعية.',
      submit: 'إنشاء الحساب',
      haveAccount: 'لديك حساب؟ تسجيل الدخول',
    },

    registerNormal: {
      title: 'إنشاء حساب عام',
      subtitle: 'سنرسل رمز التحقق إلى بريدك الإلكتروني.',
      cardTitle: 'بيانات الحساب',
      cardSubtitle: 'يمكنك استخدام الخدمات العامة بعد إنشاء الحساب.',
      submit: 'إنشاء الحساب',
    },

    otp: {
      title: 'تأكيد الحساب',
      sentTo: (destination: string, identifier: string) =>
        `أدخل الرمز المرسل إلى ${destination}: ${identifier}`,
      destinationEmail: 'البريد الإلكتروني',
      destinationPhone: 'رقم الهاتف',
      cardTitle: 'رمز التحقق',
      cardSubtitle: 'الرمز صالح لمدة قصيرة، ولا تشاركه مع أي شخص.',
      submit: 'تأكيد الرمز',
      resend: 'إعادة إرسال الرمز',
      resendIn: (time: string) => `يمكنك إعادة الإرسال بعد ${time}`,
      spamHint:
        'لم يصلك الرمز؟ تفقّد مجلد الرسائل غير المرغوب فيها (Spam)، ثم أعد الإرسال بعد انتهاء المؤقت.',
      wrongEmail: 'البريد غير صحيح؟ ارجع وصحّحه',
    },

    forgotPassword: {
      title: 'استعادة كلمة المرور',
      subtitle: 'إذا كان البريد مسجلًا لدينا، سنرسل إليه رمز الاستعادة.',
      cardTitle: 'البريد الإلكتروني',
      cardSubtitle: 'أدخل البريد الإلكتروني المستخدم في بانوراما.',
      submit: 'إرسال رمز الاستعادة',
    },

    resetPassword: {
      title: 'كلمة مرور جديدة',
      subtitle: 'اختر كلمة مرور قوية ولا تستخدمها في أي خدمة أخرى.',
      cardTitle: 'إعادة تعيين كلمة المرور',
      cardSubtitle: (identifier: string) => `أدخل الرمز المرسل إلى ${identifier}.`,
      submit: 'حفظ كلمة المرور',
      newPassword: 'كلمة المرور الجديدة',
    },

    consent: {
      combinedPrefix: 'قرأت ووافقت على ',
      combinedLink: 'الشروط والأحكام وسياسة الخصوصية',
      combinedRequired: 'يجب الموافقة على الشروط والأحكام وسياسة الخصوصية للمتابعة.',
      loading: 'جارٍ تجهيز الموافقات...',
      loadFailed: 'تعذر تحميل الشروط والسياسات. أعد المحاولة للمتابعة.',
      termsPrefix: 'قرأت ووافقت على ',
      privacyPrefix: 'قرأت ووافقت على ',
      terms: 'الشروط والأحكام',
      privacy: 'سياسة الخصوصية',
      termsRequired: 'يجب الموافقة على الشروط والأحكام للمتابعة.',
      privacyRequired: 'يجب الموافقة على سياسة الخصوصية للمتابعة.',
    },

    bootstrap: {
      checkingSession: 'جارٍ التحقق من حسابك...',
      preparingStudentAccount: 'جارٍ تجهيز حسابك...',
      studentContextError: 'تعذر تحميل بيانات حسابك. تحقق من الاتصال وحاول مرة أخرى.',
    },

    roleDenied: {
      title: 'هذا التطبيق غير متاح لحسابك',
      message: 'تطبيق بانوراما للجوال مخصص للطلاب. استخدم لوحة التحكم للمهام الإدارية.',
      dashboardLabel: 'لوحة التحكم:',
      logout: 'تسجيل الخروج',
    },

    validation: {
      fullNameRequired: 'أدخل اسمك الكامل.',
      emailInvalid: 'أدخل بريدًا إلكترونيًا صحيحًا.',
      studentNumberRequired: 'أدخل رقمك الجامعي.',
      phoneRequired: 'أدخل رقم جوالك.',
      phoneFormat: 'رقم الجوال غير صحيح. تأكد من اختيار الدولة وكتابة الرقم بشكل صحيح.',
      phoneDigitsOnly: 'اكتب أرقامًا فقط في رقم الجوال.',
      phoneTooShort: 'رقم الجوال قصير. يجب أن يتكون من 8 أرقام على الأقل بعد مفتاح الدولة.',
      phoneTooLong: 'رقم الجوال طويل.',
      passwordTooShort: 'يجب ألا تقل كلمة المرور عن 8 أحرف.',
      passwordMismatch: 'كلمتا المرور غير متطابقتين.',
      otpInvalid: 'أدخل رمز التحقق كاملًا.',
    },

    errors: {
      network: 'تعذر الاتصال. تحقق من الإنترنت وحاول مرة أخرى.',
      registrationGeneric: 'تعذر إكمال التسجيل. حاول مرة أخرى.',
      passwordResetGeneric: 'تعذر استعادة كلمة المرور. حاول مرة أخرى.',
      rateLimited: 'عدد المحاولات كبير.',
      rateLimitedRetryAfter: (seconds: number) => `انتظر ${seconds} ثانية ثم حاول مرة أخرى.`,
      otpInvalid: 'رمز التحقق غير صحيح أو انتهت صلاحيته.',
      otpLocked: 'تكررت المحاولات الخاطئة. اطلب رمزًا جديدًا.',
      otpUnavailable:
        'تعذّر إرسال رمز التحقق الآن. حاول بعد قليل، وإن استمرت المشكلة تواصل مع الدعم.',
      passwordResetRateLimited: 'عدد المحاولات كبير. حاول لاحقًا.',
      invalidCredentials: 'بيانات الدخول غير صحيحة. تحقق منها وحاول مرة أخرى.',
      sessionExpired: 'انتهت جلستك. سجّل الدخول مرة أخرى للمتابعة.',
      forbidden: 'لا تتوفر لك صلاحية تنفيذ هذا الإجراء.',
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
      us: 'الولايات المتحدة',
      gb: 'المملكة المتحدة',
      de: 'ألمانيا',
      fr: 'فرنسا',
    },
  },

  profile: {
    title: 'حسابي',
    subtitle: 'حسابك وخدماتك',
    loadingAccount: 'جارٍ تحميل بيانات حسابك...',
    defaultName: 'مستخدم بانوراما',
    noContactDetails: 'لا توجد بيانات تواصل مؤكدة حاليًا',

    roles: {
      student: 'طالب',
      normalUser: 'مستخدم',
      admin: 'مسؤول',
      itSupport: 'دعم فني',
      printStaff: 'موظف طباعة',
      fallback: 'مستخدم',
    },

    summary: {
      title: 'ملخص الطالب',
      university: 'الجامعة',
      faculty: 'الكلية',
      verification: 'التوثيق',
      note: 'لعرض كل التفاصيل افتح «المعلومات الأكاديمية».',
      emailVerified: 'البريد مؤكد',
      emailUnverified: 'البريد غير مؤكد',
      phoneVerified: 'الهاتف مؤكد',
      phoneUnverified: 'الهاتف غير مؤكد',
    },

    accountSection: {
      title: 'الحساب',
      subtitle: 'بياناتك وخدمات حسابك',
      editProfile: 'تعديل الملف الشخصي',
      editProfileSubtitle: 'الاسم واسم المستخدم',
      academicInfo: 'المعلومات الأكاديمية',
      academicInfoSubtitle: 'بيانات جامعتك وحالة التوثيق',
      settings: 'الإعدادات',
      settingsSubtitle: 'كلمة المرور واللغة والمعلومات القانونية',
    },

    servicesSection: {
      title: 'الخدمات',
      subtitle: 'خدمات الطالب',
      printOrders: 'طلبات الطباعة',
      printOrdersSubtitle: 'تابع طلبات الطباعة',
      notifications: 'الإشعارات',
      notificationsSubtitle: 'اقرأ إشعاراتك',
      support: 'الدعم الفني',
      supportSubtitle: 'أرسل مشكلتك وتابع الرد عليها',
      feedback: 'رأيك يهمنا',
      feedbackSubtitle: 'قيّم التطبيق وشاركنا اقتراحاتك',
    },

    legalSection: {
      title: 'معلومات قانونية',
      subtitle: 'الخصوصية والشروط',
    },

    logout: {
      action: 'تسجيل الخروج',
      confirmTitle: 'هل تريد تسجيل الخروج؟',
      confirmDescription: 'ستعود إلى شاشة تسجيل الدخول، ويمكنك الدخول مرة أخرى في أي وقت.',
      confirm: 'تأكيد الخروج',
    },

    security: {
      title: 'الحساب والأمان',
      description: 'يمكنك تغيير كلمة مرور حسابك في أي وقت.',
      changePassword: 'تغيير كلمة المرور',
    },

    edit: {
      title: 'تعديل الملف الشخصي',
      subtitle: 'عدّل بياناتك الشخصية',
      notice:
        'يمكنك تعديل الاسم الكامل واسم المستخدم فقط. البريد والهاتف ونوع الحساب للعرض ولا يمكن تغييرها من هنا.',
      fullName: 'الاسم الكامل',
      fullNamePlaceholder: 'اكتب الاسم الكامل',
      username: 'اسم المستخدم',
      usernamePlaceholder: 'اكتب اسم المستخدم',
      readOnlyTitle: 'بيانات للعرض فقط',
      email: (value: string) => `البريد: ${value}`,
      phone: (value: string) => `الهاتف: ${value}`,
      role: (value: string) => `نوع الحساب: ${value}`,
      save: 'حفظ التغييرات',
      fullNameRequired: 'أدخل اسمك الكامل.',
      updateSuccess: 'تم تحديث ملفك الشخصي.',
    },

    academic: {
      title: 'المعلومات الأكاديمية',
      subtitle: 'بياناتك الدراسية',
      loading: 'جارٍ تحميل المعلومات الأكاديمية...',
      university: 'الجامعة',
      faculty: 'الكلية',
      major: 'الاختصاص',
      year: 'السنة',
      semester: 'الفصل',
      studentNumber: 'الرقم الجامعي',
      verifiedNote: 'تم توثيق حسابك، لذلك لا يمكن تعديل بياناتك الدراسية الأساسية من هنا.',
      readOnlyNote: 'هذه الشاشة للعرض فقط. إن احتجت إلى تعديل بياناتك الدراسية فتواصل مع الدعم.',
      privacyNote: 'لا نعرض صورة بطاقتك هنا حفاظًا على خصوصيتك.',
      incompleteTitle: 'المعلومات الأكاديمية غير مكتملة',
      incompleteMessage:
        'لم نجد ملفًا دراسيًا مكتملًا. سجّل الدخول مرة أخرى، وإن استمرت المشكلة تواصل مع الدعم.',
      cardVerified: 'تم التحقق من بطاقتك الجامعية.',
      cardStatusFromServer: 'حالة توثيق بطاقتك الجامعية.',
      contactConfirmed: 'بيانات التواصل مؤكدة',
      contactConfirmedDescription: 'لدى حسابك بريد إلكتروني أو رقم هاتف مؤكد.',
      contactUnconfirmed: 'بيانات التواصل غير مؤكدة',
      contactUnconfirmedDescription: 'لا يوجد بريد إلكتروني أو رقم هاتف مؤكد على حسابك.',
      accountNotLoaded: 'تعذر عرض بيانات الحساب',
      accountNotLoadedDescription: 'أعد تحميل الشاشة لعرض حالة حسابك.',
      confirmed: 'مؤكد',
      unconfirmed: 'غير مؤكد',
    },

    about: {
      title: 'عن بانوراما',
      subtitle: 'معلومات التطبيق',
      version: (value: string) => `الإصدار ${value}`,
      purposeTitle: 'عن التطبيق',
      purpose: [
        'بانوراما تطبيق عربي للطلاب يجمع موادك ومجموعاتك وملفاتك وطباعتك وإشعاراتك والدعم في مكان واحد.',
        'نركّز على ما تحتاجه في دراستك كل يوم، ونحافظ على خصوصية بياناتك.',
        'نعمل باستمرار على تحسين التطبيق وإضافة خدمات جديدة للطلبة.',
      ],
    },

    errors: {
      network: 'تعذر تحميل بيانات حسابك. تحقق من الإنترنت وحاول مرة أخرى.',
      unauthorized: 'انتهت جلستك. سجّل الدخول مرة أخرى للمتابعة.',
      validation: 'راجع بياناتك وحاول مرة أخرى.',
      update: 'تعذر تحديث ملفك الشخصي. حاول مرة أخرى.',
    },
  },

  legal: {
    privacy: {
      title: 'سياسة الخصوصية',
      subtitle: 'كيف نجمع بياناتك ونستخدمها ونحميها',
      openOnline: 'قراءة السياسة الكاملة على الموقع',
      sections: [
        {
          title: 'البيانات التي نستخدمها',
          paragraphs: [
            'تستخدم بانوراما بيانات حسابك، مثل الاسم واسم المستخدم ووسائل التواصل، لتوفير تجربة واضحة وآمنة.',
            'نستخدم بياناتك الدراسية وحالة التوثيق وصورة بطاقتك الجامعية للتأكد من أحقيتك في الخدمات الدراسية.',
          ],
        },
        {
          title: 'كيف نستخدم بياناتك في الخدمات',
          paragraphs: [
            'قد نستخدم بيانات الملفات وطلبات الطباعة وتذاكر الدعم والإشعارات لتقديم خدماتك ومتابعة حالتها.',
            'لا نبيع بيانات المستخدمين. نستخدمها لتقديم الخدمات وتشغيلها وتحسين التجربة فقط.',
          ],
        },
        {
          title: 'خصوصيتك داخل التطبيق',
          paragraphs: [
            'لا نعرض صورة بطاقتك أو أي ملفات حساسة في شاشات التطبيق.',
            'يرى كل مستخدم ما يتاح لحسابه فقط.',
          ],
        },
      ],
    },

    terms: {
      title: 'الشروط والأحكام',
      subtitle: 'شروط استخدام تطبيق بانوراما',
      openOnline: 'قراءة الشروط الكاملة على الموقع',
      sections: [
        {
          title: 'الاستخدام المقبول',
          paragraphs: [
            'تتيح لك بانوراما الوصول إلى الخدمات الدراسية والملفات والمجموعات والطباعة والدعم. نرجو استخدامها بمسؤولية.',
            'يُمنع إساءة استخدام الملفات أو المجموعات أو تذاكر الدعم، ومحاولة الوصول إلى بيانات لا تخص حسابك.',
          ],
        },
        {
          title: 'الصلاحيات والخدمات المتاحة',
          paragraphs: [
            'تعتمد الخدمات والملفات المتاحة لك على نوع حسابك وحالة التوثيق وبياناتك الدراسية.',
            'قد تتغير الخدمات المتاحة لك عندما تتغير هذه البيانات.',
          ],
        },
        {
          title: 'المسؤولية',
          paragraphs: [
            'أنت مسؤول عن سرية كلمة المرور، وعن مراجعة طلبات الطباعة قبل إرسالها.',
            'عند التواصل مع الدعم الفني، قدّم معلومات صحيحة تساعد الفريق على حل مشكلتك.',
          ],
        },
      ],
    },
  },

  announcements: {
    title: 'الإعلانات',
    subtitle: 'آخر الإعلانات الموجّهة إليك.',
    detailTitle: 'تفاصيل الإعلان',
    loading: 'جارٍ تحميل الإعلانات...',
    loadingMore: 'جارٍ تحميل المزيد...',
    loadMore: 'عرض المزيد',
    total: (count: number) =>
      count === 1
        ? 'إعلان واحد'
        : count === 2
          ? 'إعلانان'
          : `${count} ${count >= 3 && count <= 10 ? 'إعلانات' : 'إعلانًا'}`,
    emptyTitle: 'لا توجد إعلانات حاليًا',
    emptyMessage: 'ستظهر هنا الإعلانات المهمة عند توفرها.',
    emptyIllustrationAlt: 'رسم يوضح عدم وجود إعلانات',
    untitled: 'إعلان',
    noDetails: 'لا توجد تفاصيل إضافية لهذا الإعلان.',
    newBadge: 'جديد',
    endingSoon: 'ينتهي قريبًا',
    openDetails: (title: string) => `فتح الإعلان: ${title}`,
    imageAlt: 'صورة الإعلان',
    publishedAt: 'تاريخ النشر',
    validUntil: 'ساري حتى',
    audience: 'الفئة المستهدفة',
    audienceAll: 'الجميع',
    audienceStudents: 'الطلاب',
    audienceNormal: 'المستخدمون',
    audienceVerified: 'الطلاب الموثّقون',
    audienceAdmins: 'المشرفون',
    audienceCustom: 'فئة محددة',
    targetsTitle: 'موجّه إلى',
    targetUniversity: 'جامعة محددة',
    targetFaculty: 'كلية محددة',
    targetMajor: 'اختصاص محدد',
    targetYear: 'سنة دراسية محددة',
    targetSemester: 'فصل محدد',
    createdBy: 'نُشر بواسطة',
    openLink: 'فتح الرابط',
    notFoundTitle: 'الإعلان غير متاح',
    notFoundMessage: 'ربما انتهت مدة هذا الإعلان أو لم يعد موجّهًا إليك.',
    errors: {
      network: 'تعذر تحميل الإعلانات. تحقق من اتصال الإنترنت وحاول مرة أخرى.',
      unauthorized: 'انتهت جلستك. سجّل الدخول مرة أخرى للمتابعة.',
      generic: 'تعذر تحميل الإعلانات. حاول مرة أخرى.',
    },
  },

  attachments: {
    attach: 'إرفاق صورة',
    hint: 'الصيغ المدعومة: PNG وJPG وWEBP، بحد أقصى 25 م.ب.',
    remove: 'إزالة المرفق',
    selected: 'مرفق مختار',
    uploading: (percent: number) => `جارٍ الرفع ${percent}%`,
    invalidType: 'صيغة الملف غير مدعومة. اختر صورة بصيغة PNG أو JPG أو WEBP.',
    tooLarge: 'حجم الملف أكبر من 25 م.ب.',
    empty: 'الملف فارغ. اختر ملفًا آخر.',
    pickerFailed: 'تعذر فتح معرض الصور. حاول مرة أخرى.',
    viewAttachment: 'عرض المرفق',
    viewerTitle: 'مرفق',
    viewerSubtitle: 'يُعرض داخل التطبيق فقط',
  },

  policies: {
    title: 'تحديث الشروط والسياسات',
    description: 'حدّثنا الشروط أو سياسة الخصوصية. راجعها ووافق عليها للمتابعة.',
    terms: 'الشروط والأحكام',
    privacy: 'سياسة الخصوصية',
    version: (version: string) => `الإصدار ${version}`,
    read: 'قراءة',
    checkbox: 'قرأت الشروط وسياسة الخصوصية وأوافق عليها.',
    needCheckbox: 'أكّد موافقتك للمتابعة.',
    accept: 'أوافق وأتابع',
    accepting: 'جارٍ تسجيل موافقتك...',
    logout: 'تسجيل الخروج',
    errors: {
      network: 'تعذر تسجيل موافقتك. تحقق من الإنترنت وحاول مرة أخرى.',
      generic: 'تعذر تسجيل موافقتك. حاول مرة أخرى.',
    },
  },

  home: {
    title: 'الرئيسية',
    subtitle: 'لوحة الطالب',
    loading: 'جارٍ تحميل الصفحة الرئيسية...',

    hero: {
      welcome: 'أهلا بك',
      guest: 'عزيزي الطالب',
      notifications: 'الإشعارات',
      searchPlaceholder: 'ابحث عن مادة أو مجموعة أو ملف',
    },

    greeting: {
      withName: (name: string) => `مرحبًا، ${name}`,
      generic: 'مرحبًا بك في بانوراما',
      tagline: 'كل جامعتك في مكان واحد',
      heroImageAlt: 'رسم يعبّر عن رحلة الطالب في بانوراما',
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
      loadingLabel: 'جارٍ التحديث',
      loadingDescription: 'ستظهر حالة ملفك والتوثيق بعد اكتمال تحميل بيانات حسابك.',
      incompleteLabel: 'ملف غير مكتمل',
      incompleteDescription: 'أكمل بياناتك الدراسية للاستفادة من خدمات الطلاب.',
      verifiedLabel: 'حسابك موثق',
      verifiedDescription: 'يمكنك الآن استخدام الخدمات المخصصة للطلاب الموثقين.',
      pendingLabel: 'قيد المراجعة',
      pendingDescription: 'طلب التوثيق قيد مراجعة الإدارة.',
      rejectedLabel: 'مرفوض',
      rejectedDescription: 'لم يُقبل طلب التوثيق. اعرف السبب من شاشة التوثيق.',
      needsUpdateLabel: 'يحتاج تحديثًا',
      needsUpdateDescription: 'يحتاج طلب التوثيق إلى صورة أو بيانات أوضح.',
      unknownLabel: 'أكمل بياناتك الدراسية',
      unknownDescription: 'لم نتمكن من تحديد حالة التوثيق بعد.',
    },

    announcements: {
      seeAll: 'عرض الكل',
      title: 'الإعلانات',
      subtitle: 'آخر الإعلانات الموجّهة إليك.',
      emptyTitle: 'لا توجد إعلانات حاليًا',
      emptyMessage: 'ستظهر هنا الإعلانات المهمة عند توفرها.',
      emptyIllustrationAlt: 'رسم يوضح عدم وجود إعلانات',
      untitled: 'إعلان',
      noDetails: 'لا توجد تفاصيل إضافية لهذا الإعلان.',
    },

    services: {
      title: 'الخدمات',
      subtitle: 'اختصارات سريعة لأهم خدماتك.',
      subjects: 'المواد',
      subjectsDescription: 'تصفح مواد كليتك.',
      groups: 'المجموعات',
      groupsDescription: 'انضم إلى مجموعات موادك وتابع النقاش.',
      lectures: 'المحاضرات',
      lecturesDescription: 'اقرأ محاضرات موادك والمحاضرات العامة داخل التطبيق.',
      files: 'الملفات',
      filesDescription: 'افتح ملفات موادك داخل التطبيق.',
      search: 'البحث',
      searchDescription: 'ابحث في المواد والمجموعات والملفات.',
      printing: 'الطباعة',
      printingDescription: 'اطلب طباعة ملفاتك وتابع طلباتك.',
      support: 'الدعم',
      supportDescription: 'أرسل مشكلتك وتابع الرد عليها.',
      notifications: 'الإشعارات',
      notificationsDescription: 'تابع التنبيهات المهمة.',
      profile: 'حسابي',
      profileDescription: 'راجع بيانات حسابك وإعداداتك.',
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
      unauthorized: 'انتهت جلستك. سجّل الدخول مرة أخرى للمتابعة.',
      generic: 'تعذر تحميل الصفحة الرئيسية. حاول مرة أخرى.',
    },
  },

  support: {
    title: 'الدعم الفني',
    subtitle: 'تواصل مع فريق الدعم',
    loading: 'جارٍ تحميل تذاكر الدعم...',
    intro: 'أرسل مشكلتك مع صورة توضحها إن أمكن، وتابع ردود فريق الدعم هنا.',
    filterLabel: 'تصفية حسب الحالة',
    filterAll: 'الكل',
    filteredEmptyTitle: 'لا توجد تذاكر بهذه الحالة',
    filteredEmptyMessage: 'جرّب حالة أخرى أو اعرض كل التذاكر.',
    loadMore: 'عرض المزيد',
    cancelUpload: 'إلغاء الرفع',
    ticketsCount: (count: number) => `عدد التذاكر: ${count}`,
    createTicket: 'إنشاء تذكرة جديدة',
    createFirstTicket: 'إنشاء أول تذكرة',
    emptyTitle: 'لا توجد تذاكر دعم',
    emptyMessage: 'لم تنشئ أي تذكرة دعم بعد.',
    emptyIllustrationAlt: 'رسم يوضح عدم وجود تذاكر دعم',
    fallbackTitle: (id: string) => `تذكرة دعم #${id}`,
    emptyMessageBody: 'رسالة بدون نص',

    create: {
      title: 'إنشاء تذكرة دعم',
      subtitle: 'أرسل مشكلتك إلى فريق الدعم',
      notice: 'اختر التصنيف واشرح المشكلة، ويمكنك إرفاق صورة تساعدنا على فهمها.',
      subjectLabel: 'عنوان المشكلة',
      subjectPlaceholder: 'مثال: مشكلة في فتح ملف',
      messageLabel: 'تفاصيل المشكلة',
      messagePlaceholder: 'اشرح المشكلة بالتفصيل',
      submit: 'إرسال التذكرة',
      categoryTitle: 'تصنيف التذكرة',
      categoryNote: 'اختر التصنيف الأقرب لمشكلتك ليصل طلبك إلى الفريق المناسب.',
    },

    details: {
      title: 'تفاصيل التذكرة',
      subtitle: 'تابع المحادثة مع فريق الدعم',
      loading: 'جارٍ تحميل تفاصيل التذكرة...',
      messagesTitle: 'سجل الرسائل',
      messagesSubtitle: 'رسائل هذه التذكرة',
      noMessagesTitle: 'لا توجد رسائل إضافية',
      noMessagesMessage: 'ستظهر هنا ردود فريق الدعم عند وصولها.',
      addMessageTitle: 'إضافة رسالة',
      addMessageSubtitle: 'أرسل معلومات إضافية لفريق الدعم',
      reload: 'إعادة التحميل',
      notFoundTitle: 'التذكرة غير متوفرة',
      notFoundMessage: 'تعذر العثور على هذه التذكرة. حاول إعادة التحميل.',
      primaryMessage: 'الرسالة الأساسية',
      staffSender: 'فريق الدعم',
      selfSender: 'أنت',
      replyLabel: 'إضافة رسالة',
      replyPlaceholder: 'اكتب ما تريد إضافته',
      sendReply: 'إرسال الرسالة',
    },

    status: {
      open: 'مفتوحة',
      waiting: 'بانتظار الرد',
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
      custom: 'تصنيف آخر',
      none: 'بدون تصنيف',
    },

    priority: {
      low: 'منخفضة',
      medium: 'متوسطة',
      high: 'عالية',
      urgent: 'عاجلة',
      custom: 'أولوية أخرى',
      none: 'غير محددة',
    },

    validation: {
      categoryRequired: 'اختر التصنيف.',
      subjectRequired: 'اكتب عنوان المشكلة.',
      messageRequired: 'اشرح المشكلة.',
      replyRequired: 'اكتب رسالتك قبل الإرسال.',
      /** Shown by both the store and the ticket screen, which each had their own copy. */
      closedTicket: 'لا يمكن إضافة رسائل إلى تذكرة مغلقة أو محلولة.',
    },

    messages: {
      createSuccess: 'تم إنشاء تذكرة الدعم.',
      sendSuccess: 'تم إرسال الرسالة.',
    },

    errors: {
      network: 'تعذر تحميل تذاكر الدعم. تحقق من اتصال الإنترنت وحاول مرة أخرى.',
      unauthorized: 'انتهت جلستك. سجّل الدخول مرة أخرى للمتابعة.',
      permission: 'لا تتوفر لك صلاحية عرض هذه التذكرة حاليًا.',
      generic: 'تعذر إكمال طلب الدعم. حاول مرة أخرى.',
    },
  },

  files: {
    title: 'الملفات',
    subtitle: 'ملفات موادك ومجموعاتك',
    loading: 'جارٍ تحميل الملفات...',
    listTitle: 'قائمة الملفات',
    loadedCount: (count: number) => `عدد الملفات: ${count}`,
    searchPlaceholder: 'ابحث باسم الملف أو نوعه',
    emptyTitle: 'لا توجد ملفات',
    emptyMessage: 'لا توجد ملفات متاحة حاليًا.',
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
      staff: 'للإدارة',
      custom: 'مخصص',
    },

    card: {
      updatedAt: (value: string) => `آخر تحديث: ${value}`,
      createdAt: (value: string) => `تاريخ الإنشاء: ${value}`,
    },

    details: {
      subtitle: 'تفاصيل الملف',
      loading: 'جارٍ تحميل تفاصيل الملف...',
      unavailableTitle: 'الملف غير متاح',
      unavailableMessage: 'تعذر تحميل تفاصيل الملف. حاول مرة أخرى.',
      openInApp: 'فتح داخل التطبيق',
      requestPrint: 'طلب طباعة',
      noTicket: 'لا يمكن عرض هذا الملف حاليًا.',
      descriptionTitle: 'الوصف',
      noDescription: 'لا يوجد وصف متاح لهذا الملف.',
      infoTitle: 'معلومات الملف',
      infoSubtitle: 'تفاصيل هذا الملف.',
      type: 'النوع',
      extension: 'الصيغة',
      size: 'الحجم',
      visibility: 'متاح لـ',
      group: 'المجموعة',
      subject: 'المادة',
      createdAt: 'تاريخ الإنشاء',
      updatedAt: 'آخر تحديث',
      pages: 'عدد الصفحات',
      printable: 'قابل للطباعة',
      yes: 'نعم',
      no: 'لا',
      notPrintable: 'هذا الملف غير متاح للطباعة.',
      protectionNote: 'الملفات محمية: تُعرض داخل التطبيق فقط ولا يمكن تنزيلها أو مشاركتها.',
      inAppOnlyNote: 'يُفتح هذا الملف داخل التطبيق فقط.',
    },

    viewer: {
      fallbackTitle: 'عارض الملفات',
      subtitle: 'يُعرض داخل التطبيق فقط',
      issuingTicket: 'جارٍ تجهيز العرض...',
      loadError: 'تعذر عرض الملف. حاول مرة أخرى.',
      securityNote:
        'يُعرض الملف داخل التطبيق فقط ولا يمكن تنزيله أو مشاركته. وقد تُمنع لقطات الشاشة أثناء العرض.',
      unavailableTitle: 'لا يمكن عرض الملف',
      unavailableAlt: 'رسم يوضح تعذر معاينة الملف',
      protectedReadyTitle: 'الملف جاهز للعرض',
      protectedReadyMessage: (id: string) => `اضغط «فتح داخل التطبيق» لعرض الملف رقم ${id}.`,
    },

    groupFiles: {
      title: 'ملفات المجموعة',
      subtitle: 'ملفات المجموعة لأعضائها',
      loading: 'جارٍ تحميل ملفات المجموعة...',
      backToGroup: 'رجوع إلى المجموعة',
      listTitle: 'القائمة',
      shownCount: (count: number) => `عدد الملفات: ${count}`,
      searchPlaceholder: 'ابحث بعنوان الملف أو الوصف',
      emptyMessage: 'لا توجد ملفات لهذه المجموعة حاليًا.',
    },

    errors: {
      network: 'تعذر تحميل الملفات. تحقق من اتصال الإنترنت وحاول مرة أخرى.',
      unauthorized: 'انتهت جلستك. سجّل الدخول مرة أخرى للمتابعة.',
      permission: 'لا تتوفر لك صلاحية عرض هذه الملفات حاليًا.',
      generic: 'تعذر تحميل الملفات. حاول مرة أخرى.',
    },

    list: {
      all: 'الكل',
      total: (count: number) => `عدد الملفات: ${count}`,
      loadMore: 'عرض المزيد',
      loadingMore: 'جارٍ تحميل المزيد...',
      orderingLabel: 'الترتيب',
      newest: 'الأحدث',
      oldest: 'الأقدم',
      titleAsc: 'حسب العنوان',
      largest: 'الأكبر حجما',
      printableOnly: 'قابل للطباعة فقط',
      filtersLabel: 'تصفية الملفات',
      subjectFilter: (name: string) => `المادة: ${name}`,
      subjectFallback: 'مادة محددة',
      clearSubject: 'إزالة تصفية المادة',
      noSearchResults: 'لا توجد ملفات تطابق بحثك.',
    },
  },

  groups: {
    title: 'المجموعات',
    untitled: 'مجموعة بدون اسم',

    overview: {
      subtitle: 'المجموعات الأكاديمية',
      intro: 'انضم إلى مجموعات موادك وتابع النقاش والملفات مع زملائك.',
      destinationsTitle: 'ابدأ من هنا',
      destinationsSubtitle: 'تابع مجموعاتك أو تصفح المجموعات المتاحة في كليتك.',
      myGroupsDescription: 'مجموعاتك وطلبات الانضمام التي أرسلتها.',
      availableDescription: 'مجموعات يمكنك طلب الانضمام إليها.',
    },

    mine: {
      title: 'مجموعاتي',
      subtitle: 'المجموعات التي تنتمي إليها',
      loading: 'جارٍ تحميل مجموعاتك...',
      emptyMessage: 'لم تنضم إلى أي مجموعة بعد.',
    },

    available: {
      title: 'المجموعات المتاحة',
      subtitle: 'المجموعات التي يمكنك طلب الانضمام إليها',
      loading: 'جارٍ تحميل المجموعات المتاحة...',
      emptyMessage: 'لا توجد مجموعات متاحة حاليًا.',
    },

    list: {
      title: 'القائمة',
      loadedCount: (count: number) => `عدد المجموعات: ${count}`,
      searchPlaceholder: 'ابحث باسم المجموعة أو المادة',
      emptyTitle: 'لا توجد مجموعات',
      emptyIllustrationAlt: 'رسم يوضح عدم وجود مجموعات',
    },

    details: {
      subtitle: 'تفاصيل المجموعة',
      loading: 'جارٍ تحميل تفاصيل المجموعة...',
      backToGroups: 'رجوع إلى المجموعات',
      unavailableTitle: 'المجموعة غير متاحة',
      unavailableMessage: 'تعذر تحميل تفاصيل المجموعة. حاول مرة أخرى.',
      join: 'طلب الانضمام',
      leave: 'مغادرة المجموعة',
      contentTitle: 'محتوى المجموعة',
      contentSubtitle: 'المحادثة والملفات لأعضاء المجموعة.',
      chatTitle: 'المحادثة',
      chatDescription:
        'شارك زملاءك النقاش داخل التطبيق. تظهر لك إمكانية الإرسال في شاشة المحادثة بحسب عضويتك.',
      openChat: 'فتح المحادثة',
      filesTitle: 'ملفات المجموعة',
      filesDescription: 'افتح ملفات هذه المجموعة داخل التطبيق.',
      openFiles: 'فتح ملفات المجموعة',
      descriptionTitle: 'وصف المجموعة',
      noDescription: 'لا يوجد وصف متاح لهذه المجموعة حاليًا.',
      openWhatsApp: 'فتح مجموعة واتساب',
      whatsAppNote: 'يفتح الزر تطبيق واتساب مباشرة دون عرض أي رابط.',
      whatsAppError: 'تعذر فتح واتساب. حاول مرة أخرى.',
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
      left: 'غادرت المجموعة',
      notJoined: 'غير منضم',
      fallback: 'حالة العضوية',
    },

    permissions: {
      title: 'الصلاحيات',
      allMembersCanSend: 'كل الأعضاء يمكنهم الإرسال',
      adminsOnly: 'الإرسال للمشرفين فقط',
      groupDecides: 'يحدد مشرفو المجموعة من يمكنه الإرسال',
      sendToAll: 'الإرسال للجميع',
      sendToAdmins: 'الإرسال للمشرفين',
      sendPermission: 'صلاحية الإرسال',
      yourRole: (role: string) => `دورك: ${role}`,
      sending: (permission: string) => `إرسال: ${permission}`,
      roleMember: 'عضو',
      roleModerator: 'مشرف',
      roleGroupAdmin: 'مدير المجموعة',
      roleAdmin: 'مسؤول',
      roleSupport: 'دعم فني',
      roleNone: 'بدون دور',
    },

    messages: {
      joinSuccess: 'تم إرسال طلب الانضمام.',
      joinApproved: 'تم انضمامك إلى المجموعة.',
      leaveSuccess: 'تمت مغادرة المجموعة.',
      joinError: 'تعذر إرسال طلب الانضمام. حاول مرة أخرى.',
      leaveError: 'تعذرت مغادرة المجموعة. حاول مرة أخرى.',
    },

    available2: {
      subjectFilterActive: 'تُعرض مجموعات مادة واحدة فقط.',
      showAllGroups: 'عرض كل المجموعات',
      resultsCount: (count: number) =>
        count === 1
          ? 'مجموعة واحدة'
          : count === 2
            ? 'مجموعتان'
            : `${count} ${count >= 3 && count <= 10 ? 'مجموعات' : 'مجموعة'}`,
      searchLabel: 'بحث',
      loadMore: 'عرض المزيد',
      loadingMore: 'جارٍ تحميل المزيد...',
    },

    card: {
      subjectCode: (code: string) => `رمز المادة ${code}`,
      whatsAppAvailable: 'واتساب متاح',
      joinShort: 'طلب الانضمام',
      pendingShort: 'بانتظار الموافقة',
      openGroup: (name: string) => `فتح المجموعة ${name}`,
    },

    notices: {
      pending: 'طلبك قيد المراجعة، وسنُعلمك عند الموافقة عليه.',
      rejected: 'لم يُقبل طلبك السابق. يمكنك إرسال طلب جديد.',
      blocked: 'لا يمكنك الانضمام إلى هذه المجموعة حاليًا.',
      membersOnly: 'المحادثة والملفات وواتساب لأعضاء المجموعة فقط.',
    },

    leaveConfirm: {
      title: 'مغادرة المجموعة؟',
      message: 'ستفقد الوصول إلى محادثة المجموعة وملفاتها، ويمكنك طلب الانضمام مرة أخرى لاحقًا.',
      confirm: 'مغادرة',
    },

    whatsapp: {
      title: 'مجموعة واتساب',
      subtitle: 'تواصل مع زملائك على واتساب مباشرة.',
      open: 'فتح واتساب',
      opening: 'جارٍ الفتح...',
      note: 'يفتح الزر تطبيق واتساب مباشرة دون عرض أي رابط.',
      opened: 'تم فتح واتساب.',
      notInstalled: 'تعذر فتح واتساب. تأكد من تثبيت التطبيق على هاتفك ثم حاول مرة أخرى.',
      error: 'تعذر فتح واتساب الآن. حاول مرة أخرى بعد قليل.',
      unavailable: 'لم تتم إضافة رابط مجموعة الواتساب بعد، سيظهر هنا عندما تضيفه الإدارة',
    },

    emptyMine: {
      title: 'لا توجد مجموعات بعد',
      action: 'تصفح المجموعات المتاحة',
    },

    errors: {
      network: 'تعذر تحميل المجموعات. تحقق من اتصال الإنترنت وحاول مرة أخرى.',
      unauthorized: 'انتهت جلستك. سجّل الدخول مرة أخرى للمتابعة.',
      permission: 'لا تتوفر لك صلاحية عرض هذه المجموعات حاليًا.',
      generic: 'تعذر تحميل المجموعات. حاول مرة أخرى.',
    },
  },

  printing: {
    title: 'الطباعة',
    home: {
      subtitle: 'طلبات الطباعة',
      illustrationAlt: 'رسم يوضح خدمة الطباعة',
      heading: 'اطبع ملفاتك بسهولة',
      description:
        'اختر ملفًا من الملفات المتاحة أو ارفع صورة من هاتفك، واعرف السعر قبل التأكيد، ثم تابع طلبك.',
      newOrder: 'طلب جديد',
      myOrders: 'طلباتي',
      latestOrder: 'آخر طلب طباعة',
      registeredOrders: (count: number) =>
        count === 1
          ? 'طلب واحد'
          : count === 2
            ? 'طلبان'
            : `${count} ${count >= 3 && count <= 10 ? 'طلبات' : 'طلبًا'}`,
      loadingOrders: 'جارٍ تحميل طلبات الطباعة...',
      noOrders: 'لا توجد طلبات طباعة بعد.',
    },

    myOrders: {
      title: 'طلباتي',
      subtitle: 'تابع حالة طلباتك',
      createOrder: 'إنشاء طلب',
      emptyTitle: 'لا توجد طلبات طباعة',
      emptyMessage: 'أنشئ أول طلب طباعة وسيظهر هنا مع حالته.',
      emptyIllustrationAlt: 'رسم يوضح عدم وجود طلبات طباعة',
      total: (count: number) =>
        count === 1
          ? 'طلب واحد'
          : count === 2
            ? 'طلبان'
            : `${count} ${count >= 3 && count <= 10 ? 'طلبات' : 'طلبًا'}`,
      loadMore: 'عرض المزيد',
      statusFilterLabel: 'تصفية حسب الحالة',
      statusAll: 'الكل',
      filteredEmptyTitle: 'لا توجد طلبات بهذه الحالة',
      filteredEmptyMessage: 'جرّب حالة أخرى أو اعرض كل الطلبات.',
    },

    create: {
      title: 'طلب طباعة جديد',
      subtitle: 'اختر الملفات وخيارات الطباعة',
      stepConfigure: 'الخيارات',
      stepSummary: 'ملخص السعر',
      stepsLabel: (current: number, total: number) => `الخطوة ${current} من ${total}`,
      cartTitle: 'ملفات الطلب',
      cartDescription: (max: number) =>
        `يمكنك إضافة حتى ${max} ملفات في طلب واحد، ولكل ملف خياراته الخاصة.`,
      itemTitle: (index: number) => `الملف ${index}`,
      addItem: 'إضافة ملف آخر',
      removeItem: (index: number) => `إزالة الملف ${index}`,
      limitReached: (max: number) => `وصلت إلى الحد الأقصى (${max} ملفات في الطلب الواحد).`,
      itemsCount: (count: number, max: number) => `${count} من ${max} ملفات`,
      changeFile: 'تغيير الملف',
      itemMissingFile: 'اختر ملفًا للطباعة.',
      pickFromLibrary: 'من الملفات المتاحة',
      pickPdf: 'ملف PDF أو Word',
      pickFromDevice: 'صورة من هاتفك',
      uploadHintGeneral:
        'ارفع ملفك بصيغة PDF أو Word أو PowerPoint أو صورة (PNG وJPG وWEBP)، بحد أقصى 25 م.ب. نحوّل ملفات Word وPowerPoint إلى PDF تلقائيًا.',
      uploadHint: 'الصيغ المدعومة: PDF وWord وPowerPoint وPNG وJPG وWEBP، بحد أقصى 25 م.ب لكل ملف.',
      converting: 'نحوّل الملف إلى PDF، قد يستغرق ذلك لحظات…',
      convertFailed:
        'تعذر تحويل الملف إلى PDF. جرّب حفظه بصيغة PDF من تطبيق Word أو PowerPoint ثم ارفعه.',
      convertedLabel: 'ملف تم تحويله إلى PDF',
      convertedPages: (pages: number) => `${pages} صفحة`,
      uploadNote: 'نفحص الملف قبل حساب السعر، ولا يمكن تنزيله لاحقًا.',
      uploadSelected: 'ملف من هاتفك',
      uploadInvalidType:
        'صيغة الملف غير مدعومة. اختر PDF أو Word أو PowerPoint أو صورة بصيغة PNG أو JPG أو WEBP.',
      uploadTooLarge: 'حجم الملف أكبر من 25 م.ب.',
      uploadEmpty: 'الملف فارغ. اختر ملفًا آخر.',
      uploadPickerFailed: 'تعذر فتح معرض الصور. حاول مرة أخرى.',
      pickupTitle: 'نقطة الاستلام',
      pickupLoadFailed: 'تعذر تحميل نقاط الاستلام. حاول مرة أخرى.',
      pickupNone: 'لا توجد نقاط استلام متاحة حاليًا.',
      notesLabel: 'ملاحظات الطلب',
      notesHelper: 'ملاحظات يراها موظف الطباعة. لا تكتب فيها معلومات شخصية حساسة.',
      notesPlaceholder: 'مثال: ترتيب محدد للصفحات',
      pricingNotice: 'تحسب بانوراما السعر النهائي بعد فحص الملف، ويظهر لك قبل تأكيد الطلب.',
      currencyLabel: 'عملة السعر',
      currencySyp: 'ل.س جديدة',
      currencyUsd: 'دولار $',
      calculatePrice: 'احسب السعر',
      submit: 'تأكيد وإرسال الطلب',
      submitSuccess: 'تم إرسال طلب الطباعة.',
      prefilledFile: 'اخترنا الملف من الصفحة السابقة.',
      startOver: 'مسح الطلب والبدء من جديد',
    },

    library: {
      title: 'اختر ملفًا',
      searchPlaceholder: 'ابحث باسم الملف',
      close: 'إغلاق',
      loading: 'جارٍ تحميل الملفات...',
      noMatches: 'لا توجد ملفات تطابق البحث.',
      noFiles: 'لا توجد ملفات قابلة للطباعة حاليًا.',
      loadFailed: 'تعذر تحميل الملفات. حاول مرة أخرى.',
      selected: 'محدد',
      fileLabel: 'ملف من الملفات المتاحة',
      unnamedFile: (id: string) => `ملف #${id}`,
    },

    transfer: {
      quoteTitle: 'جارٍ فحص ملفاتك وحساب السعر',
      orderTitle: 'جارٍ إرسال طلبك',
      percent: (value: number) => `${value}%`,
      bytes: (loaded: string, total: string) => `${loaded} من ${total}`,
      processing: 'اكتمل الرفع. نجهّز طلبك...',
      cancel: 'إلغاء',
      cancelLabel: 'إلغاء الرفع',
      keepOpen: 'أبقِ التطبيق مفتوحًا حتى ينتهي الرفع.',
    },

    priceSummary: {
      title: 'ملخص السعر',
      subtitle: 'راجع السعر والتفاصيل قبل التأكيد',
      recalculate: 'إعادة حساب السعر',
      editOptions: 'تعديل الخيارات',
      empty: 'لم يُحسب السعر بعد. ارجع إلى الخيارات واحسب السعر أولًا.',
      back: 'العودة إلى الخيارات',
      totalFiles: 'عدد الملفات',
      totalCopies: 'إجمالي النسخ',
      pickupSummary: 'نقطة الاستلام',
      notesSummary: 'ملاحظاتك',
      linesTitle: 'تفاصيل التسعير',
      quoteLine: (index: number) => `الملف ${index}`,
      copiesSummary: 'النسخ',
      optionsSummary: 'الخيارات',
      pages: 'الصفحات',
      sheets: 'الأوراق',
      unitPrice: 'سعر الورقة',
      bindingPrice: 'سعر التجليد',
      subtotal: 'المجموع الفرعي',
      total: 'الإجمالي',
      rounding: 'التقريب',
      roundingNote:
        'تُقرَّب الليرة السورية إلى عشرة: ما ينتهي بـ 1 أو 2 ينزل وما ينتهي بـ 3 فأكثر يصعد.',
      calculatedAt: (time: string) => `حُسب في ${time}`,
      staleTitle: 'تغيّرت الخيارات',
      staleMessage: 'تغيّرت الخيارات بعد حساب السعر. أعد حساب السعر قبل التأكيد.',
      confirmNote: 'بعد التأكيد يصل طلبك إلى فريق الطباعة، ويمكنك إلغاؤه قبل أن تبدأ الطباعة.',
    },

    details: {
      subtitle: 'تفاصيل الطلب',
      loading: 'جارٍ تحميل تفاصيل الطلب...',
      unavailableTitle: 'الطلب غير متاح',
      statusIllustrationAlt: 'رسم يوضح حالة طلب الطباعة',
      noDate: 'تاريخ الطلب غير متاح',
      extraTitle: 'تفاصيل إضافية',
      completedAt: 'اكتمل الطلب:',
      cancelledAt: 'أُلغي الطلب:',
      updatedAt: 'آخر تحديث:',
      itemsTitle: 'ملفات الطلب',
      itemsSubtitle: 'الملفات وخيارات الطباعة',
      noItems: 'لا توجد تفاصيل للملفات.',
      notesTitle: 'ملاحظاتك',
      rejectionReason: 'سبب الرفض',
      cancel: 'إلغاء الطلب',
      cancelSuccess: 'تم إلغاء الطلب.',
      cancelConfirmTitle: 'إلغاء طلب الطباعة؟',
      cancelConfirmMessage: 'سيُلغى الطلب ولا يمكن التراجع عن ذلك. هل تريد المتابعة؟',
      cancelConfirm: 'نعم، إلغاء الطلب',
      cancelKeep: 'إبقاء الطلب',
      statusIconAlt: 'أيقونة حالة طلب الطباعة',
      progressTitle: 'مراحل الطلب',
      timelineTitle: 'سجل الحالة',
      timelineEmpty: 'لا توجد تحديثات على الحالة بعد.',
      timelineFrom: (from: string) => `من ${from}`,
      timelineCreated: 'تم إنشاء الطلب',
      pickupTitle: 'نقطة الاستلام',
      pickupInstructions: 'تعليمات الاستلام',
      pickupReady: 'طلبك جاهز. توجه إلى نقطة الاستلام التالية:',
      itemPrice: 'سعر الملف',
      viewFile: 'عرض الملف',
      viewFileLabel: (name: string) => `عرض الملف: ${name}`,
      autoRefresh: 'تتحدث الحالة تلقائيًا.',
      roundingLine: (amount: string) => `بعد التقريب: ${amount}`,
    },

    itemViewer: {
      title: 'ملف الطلب',
      subtitle: 'يُعرض داخل التطبيق فقط',
    },

    copies: {
      title: 'عدد النسخ',
      decrease: 'إنقاص عدد النسخ',
      increase: 'زيادة عدد النسخ',
    },

    options: {
      color: 'اللون',
      sides: 'الأوجه',
      paperSize: 'حجم الورق',
      binding: 'التجليد',
      colorBlackWhite: 'أبيض وأسود',
      colorColored: 'ملون',
      sidesSingle: 'وجه واحد',
      sidesDouble: 'وجهان',
      bindingNone: 'بدون',
      bindingStaple: 'تدبيس',
      bindingSpiral: 'تسليك',
      bindingThermal: 'تجليد حراري',
    },

    preview: {
      title: 'محاكاة الطلب',
      copies: (n: number) => `${n} نسخ`,
      pages: (n: number) => `${n} صفحة`,
      bindingHint: {
        none: 'أوراق منفصلة غير مجلّدة.',
        staple: 'تُدبَّس الأوراق بدبّوس في الزاوية. مناسب للملفات القصيرة.',
        spiral: 'تُجلَّد بسلك حلزوني ويُفتح الملف بسهولة ويبقى مسطحًا. مناسب للمحاضرات والمذكرات.',
        thermal: 'تجليد حراري بكعب لاصق وغلاف: شكل رسمي للأبحاث والتقارير.',
      },
    },

    futureOptions: {
      title: 'سعر واضح قبل التأكيد',
      description:
        'اختر الخيارات التي تناسبك وسنحسب لك السعر النهائي قبل أن ترسل الطلب، فلا مفاجآت عند الاستلام.',
      items: [
        'أبيض وأسود أو ملون',
        'وجه واحد أو وجهين',
        'حجم الورق',
        'التجليد والتسليك',
        'نقطة الاستلام',
      ],
    },

    summaryCard: {
      filesAndCopies: (files: number, copies: number) =>
        `${files} ${files >= 3 && files <= 10 ? 'ملفات' : 'ملف'} - ${copies} ${copies >= 3 && copies <= 10 ? 'نسخ' : 'نسخة'}`,
    },

    order: {
      fallbackTitle: (id: string) => `طلب طباعة #${id}`,
      fallbackFileTitle: 'ملف مطبوع',
      uploadedFile: 'ملف مرفوع',
      copies: (count: number) =>
        count === 1
          ? 'نسخة واحدة'
          : count === 2
            ? 'نسختان'
            : `${count} ${count >= 3 && count <= 10 ? 'نسخ' : 'نسخة'}`,
      pages: (count: number) => ` - ${count} ${count >= 3 && count <= 10 ? 'صفحات' : 'صفحة'}`,
    },

    status: {
      submitted: { label: 'تم الإرسال', action: 'استلمنا طلبك' },
      underReview: { label: 'قيد المراجعة', action: 'نراجع طلبك الآن' },
      accepted: { label: 'مقبول', action: 'تم قبول طلبك' },
      printing: { label: 'قيد الطباعة', action: 'نجهّز طلبك للطباعة' },
      ready: { label: 'جاهز للاستلام', action: 'طلبك جاهز، يمكنك استلامه' },
      delivered: { label: 'تم التسليم', action: 'اكتمل طلبك' },
      cancelled: { label: 'ملغي', action: 'تم إلغاء الطلب' },
      rejected: { label: 'مرفوض', action: 'تعذر تنفيذ الطلب' },
      unknownAction: 'تابع حالة طلبك',
    },

    errors: {
      missingFile: 'اختر ملفًا قابلًا للطباعة.',
      invalidCopies: 'اختر عدد نسخ بين 1 و99.',
      pricingUnavailable:
        'أسعار الطباعة غير مفعّلة بعد لهذه الخيارات. حاول لاحقًا أو تواصل مع الدعم.',
      pricingUnavailableSwitchCurrency: 'يمكنك تجربة تغيير العملة.',
      bindingUnavailable: 'خدمة التجليد غير متاحة حاليًا. اختر «بدون تجليد» أو حاول لاحقًا.',
      noItems: 'أضف ملفًا واحدًا على الأقل.',
      uploadsTooLarge:
        'مجموع حجم الملفات التي رفعتها كبير لطلب واحد (الحد الأقصى 48 م.ب). قلّل عدد الملفات أو اختر ملفات من الملفات المتاحة.',
      quoteStale: 'تغيّرت الخيارات بعد حساب السعر. أعد حساب السعر أولًا.',
      quoteMismatch: 'تغيّرت الملفات بعد حساب السعر. أعد حساب السعر.',
      network: 'تعذر الاتصال. تحقق من الإنترنت وحاول مرة أخرى.',
      tooLarge: 'حجم الملفات كبير. قلّل عدد الملفات أو حجمها وحاول مرة أخرى.',
      unauthorized: 'انتهت جلستك. سجّل الدخول مرة أخرى للمتابعة.',
      forbidden: 'لا تتوفر لك صلاحية استخدام خدمة الطباعة.',
      generic: 'تعذر إكمال عملية الطباعة. حاول مرة أخرى.',
      retry: 'إعادة المحاولة',
    },
  },

  settings: {
    title: 'الإعدادات',
    subtitle: 'إعدادات حسابك والتطبيق',

    account: {
      title: 'الحساب والأمان',
      subtitle: 'أمان حسابك',
      changePassword: 'تغيير كلمة المرور',
      deleteAccount: 'حذف الحساب',
      deleteAccountDescription: 'اطلب حذف حسابك وبياناتك نهائيًا',
      changePasswordDescription: 'اختر كلمة مرور جديدة لحسابك',
    },

    app: {
      title: 'التطبيق',
      subtitle: 'إعدادات التطبيق',
      notifications: 'الإشعارات',
      notificationsDescription: 'افتح مركز الإشعارات',
      version: 'إصدار التطبيق',
      versionDescription: 'رقم إصدار التطبيق الحالي',
      environment: 'نوع النسخة',
      environmentDescription: 'النسخة التي تستخدمها حاليًا',
    },

    theme: {
      title: 'المظهر',
      description: 'اختر مظهر التطبيق: فاتح أو داكن أو حسب نظام الجهاز',
      system: 'النظام',
      light: 'فاتح',
      dark: 'داكن',
      restartRequired: 'تم حفظ المظهر. أعد تشغيل التطبيق ليظهر المظهر الجديد.',
    },

    language: {
      title: 'اللغة',
      description: 'اختر لغة التطبيق',
      arabic: 'العربية',
      english: 'English',
      restartRequired: 'تم حفظ اللغة. أعد تشغيل التطبيق ليكتمل تغيير اتجاه الشاشة.',
    },

    legal: {
      title: 'معلومات قانونية',
      subtitle: 'الخصوصية والشروط',
      privacy: 'سياسة الخصوصية',
      terms: 'الشروط والأحكام',
      about: 'عن بانوراما',
    },

    deleteAccountFlow: {
      title: 'حذف الحساب',
      subtitle: 'اطلب حذف حسابك وبياناتك من بانوراما',
      warning:
        'سيُحذف حسابك وبياناتك بعد مهلة يمكنك خلالها إلغاء الطلب. بعد انتهاء المهلة لا يمكن استرجاع الحساب.',
      reasonLabel: 'سبب الحذف (اختياري)',
      reasonPlaceholder: 'أخبرنا لماذا تريد المغادرة',
      request: 'طلب حذف الحساب',
      confirmTitle: 'تأكيد حذف الحساب',
      confirmMessage: 'هل تريد فعلًا حذف حسابك؟ يمكنك إلغاء الطلب خلال مدة المهلة.',
      confirmAction: 'نعم، احذف حسابي',
      cancelAction: 'تراجع',
      pendingTitle: 'طلب الحذف قيد التنفيذ',
      pendingScheduled: (date: string) => `موعد الحذف النهائي: ${date}`,
      cancelRequest: 'إلغاء طلب الحذف',
      cancelledNotice: 'تم إلغاء طلب الحذف وحسابك آمن.',
      requestedNotice: 'استلمنا طلب حذف حسابك.',
      loadError: 'تعذّر تحميل حالة الطلب. حاول مرة أخرى.',
      statusLoading: 'جارٍ التحقق من حالة طلب الحذف...',
      statusError: 'تعذر تحميل حالة طلب الحذف. حاول مرة أخرى.',
      unavailable: 'لا يمكن طلب حذف الحساب حاليًا.',
      requestedAt: (date: string) => `تاريخ الطلب: ${date}`,
      cancelledBefore: 'تم إلغاء طلب الحذف السابق. يمكنك تقديم طلب جديد في أي وقت.',
      completedNote: 'تم حذف هذا الحساب.',
      failed: 'تعذر إكمال العملية. حاول مرة أخرى.',
      cancelConfirmTitle: 'إلغاء طلب الحذف؟',
      cancelConfirmMessage: 'سيبقى حسابك كما هو ولن يُحذف.',
      cancelConfirmAction: 'نعم، ألغِ الطلب',
      keepRequest: 'إبقاء الطلب',
      reasonCounter: (count: number, max: number) => `${count}/${max}`,
    },

    changePassword: {
      title: 'تغيير كلمة المرور',
      subtitle: 'غيّر كلمة مرور حسابك',
      note: 'اختر كلمة مرور من 8 أحرف على الأقل، ولا تستخدمها في أي خدمة أخرى.',
      current: 'كلمة المرور الحالية',
      new: 'كلمة المرور الجديدة',
      confirm: 'تأكيد كلمة المرور الجديدة',
      success: 'تم تغيير كلمة المرور بنجاح.',
      currentRequired: 'أدخل كلمة المرور الحالية.',
      newRequired: 'أدخل كلمة المرور الجديدة.',
      confirmRequired: 'أكّد كلمة المرور الجديدة.',
      tooShort: 'يجب أن تكون كلمة المرور الجديدة 8 أحرف على الأقل.',
      mismatch: 'كلمتا المرور غير متطابقتين.',
    },

    errors: {
      network: 'تعذر تغيير كلمة المرور. تحقق من اتصال الإنترنت وحاول مرة أخرى.',
      unauthorized: 'انتهت جلستك. سجّل الدخول مرة أخرى للمتابعة.',
      validation: 'راجع بيانات كلمة المرور وحاول مرة أخرى.',
      generic: 'تعذر تغيير كلمة المرور. حاول مرة أخرى.',
    },
  },
} as const;
