# MOBILE-D1: Registration + OTP + Student Account Request Integration

**Date**: 2026-06-22  
**Phase**: D1 — Registration + Phone OTP + Student Account Request Foundation

## Business Flow Summary

### Normal User

1. User selects "مستخدم عادي" in AccountTypeChoice.
2. Fills NormalUserRegister form (full_name, email, phone, password).
3. POST /api/v1/auth/register/normal/
4. Immediately navigates to PhoneOtpVerification.
5. Calls verify-phone (mapped to existing verifyOtp).
6. On success → back to Login.

### Student Account Request

1. User selects "طالب في الجامعة".
2. Submits StudentAccountRequest (personal + university data + university_card file via FormData).
3. POST /api/v1/auth/student-account-requests/
4. Goes to StudentRequestSubmitted.
5. Polls /status/ manually.
6. When status = approved_pending_otp or otp_sent → shows "إدخال رمز التفعيل".
7. Student enters OTP (sent by admin via WhatsApp).
8. POST .../verify-otp/
9. On success → account activated → Login.

**Key rules enforced**:

- No OTP shown or requested before admin approval for students.
- No WhatsApp API calls in mobile.
- No fake success states.
- Feature flag `EXPO_PUBLIC_ENABLE_ACCOUNT_REGISTRATION_FLOW` controls visibility.

## Files Changed / Added

### New Files

- src/features/auth/screens/AccountTypeChoiceScreen.tsx
- src/features/auth/screens/NormalUserRegisterScreen.tsx
- src/features/auth/screens/PhoneOtpVerificationScreen.tsx
- src/features/auth/screens/StudentAccountRequestScreen.tsx
- src/features/auth/screens/StudentRequestSubmittedScreen.tsx
- src/features/auth/screens/StudentRequestStatusScreen.tsx
- src/features/auth/screens/StudentOtpVerificationScreen.tsx

### Modified

- .env.example (new flag documentation)
- src/config/env.ts (new flag + isAccountRegistrationFlowEnabled)
- src/api/endpoints.ts (added student-account-requests paths)
- src/api/types.ts (added all D1 payload/response types)
- src/features/auth/types.ts (added requires_phone_verification)
- src/features/auth/services/registrationService.ts (new D1 methods + FormData support)
- src/features/auth/services/index.ts (exports)
- src/features/auth/services/authSessionService.ts (normalize new field)
- src/navigation/routes.ts + types.ts (new routes + params)
- src/navigation/PublicNavigator.tsx (registered new screens)
- src/features/auth/screens/LoginScreen.tsx (flag-gated "إنشاء حساب" CTA)

## Feature Flag Behavior

Default: `EXPO_PUBLIC_ENABLE_ACCOUNT_REGISTRATION_FLOW=false`

- false → Existing Login behavior (contact card or legacy self-service if other flag true).
- true → "إنشاء حساب" appears → AccountTypeChoice.

The old `ENABLE_SELF_SERVICE_AUTH` continues to control the legacy direct RegisterStudent flow.

## Validation Results (as of this doc)

- `npm run typecheck`: PASS
- `npm run lint`: PASS
- `npm run format:check`: PASS
- `npx expo install --check`: PASS
- Bundle export (android): PASS (assets and code resolve)

Manual smoke checklist items (code paths):
1-5, 7-8, 12-14, 16-20 exercised via structure and navigation.
Full device testing with real backend required for complete sign-off.

## Known Limitations / D2 Recommendations

- Student resubmit / needs_update flow is read-only in status screen (deferred).
- Resend OTP for normal flow uses existing sendOtp when available.
- Phone verification gate after login is prepared (requires backend to return the field).
- More polish on OTP input (6 separate boxes) and file picker real integration can be done in polish phase.
- StudentRequestScreen currently uses a mock file for MVP; wire real ImagePicker + preview component from verification in next iteration.

## Recommendation

MOBILE-D1 foundation is implemented. All new flows are flag-gated, reuse existing patterns, and do not break prior auth/onboarding/journey logic.

Next: Enable flag in preview, perform full manual + device QA against real backend using the 20-item list, then move to polish / D2 enhancements.
