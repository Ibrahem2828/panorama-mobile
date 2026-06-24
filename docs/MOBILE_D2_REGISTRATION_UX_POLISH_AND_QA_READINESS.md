# MOBILE-D2: Registration UX Polish + Robust State Handling + Device QA Readiness

**Date**: 2026-06-24  
**Phase**: D2 — Polish and hardening of D1 registration flows

## Screens Polished

| Screen                  | Polish Applied                                                                                                                                                                                                       |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AccountTypeChoice       | Header entrance animation, university building illustration, press scale on both cards                                                                                                                               |
| NormalUserRegister      | Field-level validation with per-field errors, form card entrance animation, double-submit protection                                                                                                                 |
| PhoneOtpVerification    | Success state with illustration + fade-in, masked phone display, error mapping, disabled submit until 6 digits, missing-phone guard                                                                                  |
| StudentAccountRequest   | 4 section cards (بيانات الطالب, بيانات الجامعة, إثبات الطالب, كلمة المرور), field-level validation, image preview/replace/remove with file info, permission denied handling, dividers, helper text                   |
| StudentRequestSubmitted | Success illustration, fade-in animation, refined copy, request_id display only when meaningful                                                                                                                       |
| StudentRequestStatus    | Professional status cards per state, illustrations (pending/review, success, warning), needs_update_reason and rejection_reason display, last checked timestamp, unknown status fallback, non-blocking refresh error |
| StudentOtpVerification  | Status guard (checks approved_pending_otp/otp_sent/can_enter_otp on mount), success state with illustration, proper error handling, blocked access view with warning illustration                                    |

## OTP Input Behavior

File: `src/components/forms/OtpCodeInput.tsx`

- 6 visual boxes (48x48 each), LTR layout for RTL-safe digit order
- Numeric keyboard, auto-focus first box
- Auto-advance on digit entry, backspace moves backward
- Paste support (6+ digits into any box fills forward)
- Error state (red border + message below)
- Loading/disabled state (grayed out, not editable)
- Success state (green border + green background)
- No OTP values logged or stored

## Upload Preview Behavior

File: `src/features/auth/screens/StudentAccountRequestScreen.tsx` (Section 3)

- `"أرفق صورة البطاقة الجامعية"` label
- `"يجب أن يظهر الاسم والرقم الجامعي بوضوح."` helper in section subtitle
- Default button: `"اختيار صورة"`
- After selection: image thumbnail (64x64) + file name + file size display
- Replace button: `"استبدال الصورة"`
- Remove button: `"إزالة"`
- Permission denied error: `"لم نتمكن من الوصول إلى الصور. يمكنك السماح من إعدادات الجهاز."`
- Invalid asset error: `"تعذر استخدام هذا الملف. اختر صورة أخرى."`
- File missing field error: `"يرجى إرفاق صورة البطاقة الجامعية."`
- No file URI logging, no FormData clearing on selection failure

## Phone Verification Gate Behavior

File: `src/features/auth/screens/LoginScreen.tsx` (post-login)

When login succeeds and backend returns `requires_phone_verification=true`:

- If `phone_number` is available: navigate to `PhoneOtpVerification`
- If `phone_number` is missing: log out with message "لا يمكن التحقق من رقم الجوال حالياً. يرجى تسجيل الدخول مرة أخرى أو التواصل مع الدعم."

After `verifyPhoneOtp` success:

- Navigate to Login with success message display ("تم التحقق من رقم الجوال بنجاح. يمكنك تسجيل الدخول الآن.")
- No auto-login executed. User must log in with credentials after phone verification.

No token deletion occurs. The safest behavior was chosen: navigate to Login.

## Student Status Mapping

| Status                          | Title                 | Message                                 | CTA                  |
| ------------------------------- | --------------------- | --------------------------------------- | -------------------- |
| pending_review                  | طلبك قيد المراجعة     | يقوم فريق الإدارة بمراجعة بياناتك...    | —                    |
| approved_pending_otp / otp_sent | تمت الموافقة على طلبك | أدخل رمز التفعيل الذي أرسلته الإدارة... | إدخال رمز التفعيل    |
| active                          | تم تفعيل حسابك        | يمكنك الآن تسجيل الدخول إلى حسابك.      | تسجيل الدخول         |
| rejected                        | تم رفض الطلب          | rejection_reason (إذا وجد)              | العودة لتسجيل الدخول |
| needs_update                    | يحتاج طلبك إلى تعديل  | needs_update_reason (إذا وجد)           | العودة لتسجيل الدخول |
| expired                         | انتهت صلاحية الطلب    | رسالة عامة                              | العودة لتسجيل الدخول |

## Arabic Error Mapping

File: `src/features/auth/services/registrationService.ts` — `toSafeD1ErrorMessage() + mapD1Error()`

Maps these error patterns to Arabic messages:

- Network error → تعذر الاتصال بالخادم. تحقق من الإنترنت وحاول مرة أخرى.
- Timeout → استغرق الاتصال وقتاً أطول من المتوقع. حاول مرة أخرى.
- Duplicate phone → رقم الجوال مسجل مسبقاً.
- Duplicate email → البريد الإلكتروني مسجل مسبقاً.
- Invalid phone → رقم الجوال غير صحيح.
- Invalid email → البريد الإلكتروني غير صحيح.
- Password mismatch → كلمتا المرور غير متطابقتين.
- Weak password → كلمة المرور ضعيفة. يجب أن تكون 8 أحرف على الأقل.
- File required → يرجى إرفاق صورة البطاقة الجامعية.
- Invalid file → تعذر استخدام هذا الملف. اختر صورة أخرى.
- Invalid OTP → رمز التحقق غير صحيح.
- Expired OTP → انتهت صلاحية الرمز. يرجى طلب رمز جديد.
- Too many attempts → عدد محاولات خاطئة كثير. حاول لاحقاً.
- Resend cooldown → انتظر قليلاً قبل طلب رمز جديد.
- Not approved yet → لم تتم الموافقة على طلبك بعد.
- Request not found → الطلب غير موجود.
- Forbidden → لا تملك صلاحية تنفيذ هذا الإجراء.
- Server unavailable → الخدمة غير متاحة حالياً. حاول لاحقاً.

No raw JSON, stack traces, or English backend messages shown to user.

## Feature Flag Behavior

`EXPO_PUBLIC_ENABLE_ACCOUNT_REGISTRATION_FLOW` in `.env.example`:

- Default: `false`
- false → Login shows contact card (no registration CTA), existing app behavior preserved
- true → Login shows "إنشاء حساب" → AccountTypeChoice → polished flow
- Production must remain false until full device QA passes

## Manual QA Checklist

### Flag false (existing behavior unaffected):

1. App launches without crash
2. Login screen unchanged (contact card shown when both flags false)
3. Existing login with credentials works
4. Onboarding once flow unchanged
5. Tab navigation works (Home, Subjects, Groups, etc.)
6. Logout/session/refresh works

### Flag true (registration flow):

7. "إنشاء حساب" CTA visible on Login
8. AccountTypeChoice screen renders with illustrations + animations
9. Student card press navigates to student request form
10. Normal user card press navigates to normal registration
11. Normal register: field validation works (empty, invalid email, weak password)
12. Normal register: success navigates to PhoneOtpVerification
13. PhoneOTP: wrong code displays error "رمز التحقق غير صحيح"
14. PhoneOTP: success shows success screen then navigates to Login
15. PhoneOTP: missing phone shows error message
16. Student form: 4 sections render, field validation works
17. Student form: image picker → permission handling works
18. Student form: image preview, replace, remove work
19. Student form: submit disabled while uploading, double-submit guarded
20. Student form: network error shows friendly Arabic message
21. Submitted screen: success illustration renders, CTAs work
22. Status pending_review: professional card with illustration
23. Status approved_pending_otp: OTP CTA navigates to StudentOtpVerification
24. StudentOTP: status guard redirects if not approved
25. StudentOTP: wrong code shows error
26. StudentOTP: success shows success screen then navigates to Login
27. Status rejected: shows rejection_reason
28. Status needs_update: shows needs_update_reason
29. Offline: friendly error message displayed
30. Login with requires_phone_verification → routes to PhoneOTP (or shows error if phone missing)

## Known Limitations

- Resend OTP not wired (no backend endpoint confirmed for all paths)
- Student resubmit / needs_update flow remains read-only (deferred to future phase)
- Full real-device keyboard, small screen, and backend error scenarios require field QA
- No automatic polling of status (manual refresh only)
- StudentAccountRequest response returns request_id but may be "pending" before real backend confirms

## Next Phase

Device QA + end-to-end release candidate:

- Real device testing on Android (small + large screens)
- Backend API integration testing with real accounts
- Full 27-item checklist execution
- Accessibility audit on device
- Production build + store submission preparation
