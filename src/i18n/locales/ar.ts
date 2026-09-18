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
