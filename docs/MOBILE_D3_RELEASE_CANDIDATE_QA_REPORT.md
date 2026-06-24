# MOBILE-D3: Release Candidate QA Report

**Date**: 2026-06-24  
**Phase**: D3 — Real Device QA + End-to-End Release Candidate Hardening

## 1. QA Environment

| Setting        | Value                                 |
| -------------- | ------------------------------------- |
| Build profile  | `preview` (EAS internal distribution) |
| Build platform | Android APK                           |
| Expo SDK       | 56.0.0                                |
| React Native   | 0.85.3                                |

## 2. Environment Variables (Preview Profile)

| Variable                                     | Value                                     |
| -------------------------------------------- | ----------------------------------------- |
| EXPO_PUBLIC_APP_ENV                          | `preview`                                 |
| EXPO_PUBLIC_API_BASE_URL                     | `https://api.xn--mgbaab0cxheq.tech`       |
| EXPO_PUBLIC_WS_BASE_URL                      | `wss://api.xn--mgbaab0cxheq.tech`         |
| EXPO_PUBLIC_ENABLE_SELF_SERVICE_AUTH         | `false`                                   |
| EXPO_PUBLIC_ENABLE_ACCOUNT_REGISTRATION_FLOW | `true`                                    |
| EXPO_PUBLIC_DASHBOARD_URL                    | `https://dashboard.xn--mgbaab0cxheq.tech` |

Production profile does NOT set the registration flag (defaults to `false`).

## 3. Build

- Build ID: `d6e56b21-ac3d-412e-979d-f11cb512095f`
- Build URL: https://expo.dev/accounts/ibrahim2828/projects/panorama-mobile/builds/d6e56b21-ac3d-412e-979d-f11cb512095f
- JS Bundle: 2.7MB (1165 modules, 75 assets)
- APK build type: internal distribution

## 4. Static Validation Results

| Check                                | Result                               |
| ------------------------------------ | ------------------------------------ |
| `npm run typecheck`                  | PASS                                 |
| `npm run lint`                       | PASS (0 errors, 0 warnings)          |
| `npm run format:check`               | PASS (all files formatted)           |
| `npx expo install --check`           | PASS (dependencies up to date)       |
| `npx expo config --type public`      | PASS (config valid)                  |
| `npx expo export --platform android` | PASS (1165 modules, 2.7MB JS bundle) |

## 5. Device QA Matrix (Instructions)

Test on at least:

- **Small Android**: 5.0–5.5" screen (e.g. Pixel 4a, Galaxy A32)
- **Large Android**: 6.5–6.7" screen (e.g. Galaxy S24 Ultra, Pixel 7 Pro)

### RTL Layout

- [ ] All text is right-aligned
- [ ] Input fields show RTL cursor
- [ ] Cards and buttons align correctly
- [ ] No horizontal overflow on any screen

### Keyboard Behavior

- [ ] Keyboard does not cover active input fields
- [ ] KeyboardAvoidingView works on registration forms
- [ ] Number pad shows for OTP input
- [ ] Dismiss keyboard works (tap outside)

### Android Back Button

- [ ] Back from AccountTypeChoice → Login
- [ ] Back from NormalUserRegister → AccountTypeChoice
- [ ] Back from student form → AccountTypeChoice
- [ ] Back during OTP does not cause crash
- [ ] Back from status screen is handled

## 6. Feature Flag Behavior

### Flag = false (production default)

- [ ] App launches without crash
- [ ] Onboarding flow works once
- [ ] Login screen shows contact card (no Create Account CTA)
- [ ] Existing user login works
- [ ] Session persists after app restart
- [ ] Token refresh works
- [ ] Logout works
- [ ] All tab modules load: Home, Subjects, Groups, Files, Printing, Notifications, Support, Profile, Settings

### Flag = true (preview build)

- [ ] "إنشاء حساب" CTA visible on Login
- [ ] AccountTypeChoice screen renders with illustrations + animations
- [ ] Student card press → StudentAccountRequest
- [ ] Normal user card press → NormalUserRegister

## 7. Normal User E2E

- [ ] Submit empty form → field-level Arabic errors
- [ ] Invalid email → Arabic error
- [ ] Weak password → Arabic error
- [ ] Valid registration → navigates to PhoneOtpVerification
- [ ] PhoneOtpVerification shows masked phone number
- [ ] Submit with fewer than 6 digits → disabled
- [ ] Enter wrong OTP → "رمز التحقق غير صحيح"
- [ ] Enter expired OTP → "انتهت صلاحية الرمز"
- [ ] Too many attempts → Arabic error
- [ ] Correct OTP → success screen with illustration
- [ ] Success → auto-navigate to Login after 2s
- [ ] Login as verified normal_user → main app
- [ ] `requires_phone_verification` is `false` after verification
- [ ] Normal_user does not get student-only permissions
- [ ] No crash on app restart
- [ ] Logout works

## 8. Phone Verification Gate

- [ ] If `requires_phone_verification=true` returned at login → routes to PhoneOtpVerification
- [ ] Cannot bypass OTP to reach app tabs
- [ ] If phone number is missing → shows error message
- [ ] After verify → navigate to Login (no auto-login)

## 9. Student Request E2E

- [ ] Empty form → Arabic field-level validation
- [ ] Fill all fields with valid data
- [ ] Pick university card image from gallery
- [ ] Image preview shows thumbnail + filename + size
- [ ] Replace image works
- [ ] Remove image works
- [ ] Pick image again
- [ ] Submit request → StudentRequestSubmitted screen
- [ ] Submitted screen shows success illustration
- [ ] "متابعة حالة الطلب" navigates to status
- [ ] Status screen shows `pending_review` state

## 10. Dashboard Integration

Requires admin/it_support dashboard access:

- [ ] Request appears in dashboard student requests list
- [ ] Card preview works in dashboard
- [ ] Approve request from dashboard
- [ ] Dashboard generates OTP or shows manual WhatsApp OTP
- [ ] Copy OTP from dashboard

## 11. Student OTP + Activation

- [ ] Refresh mobile status → `approved_pending_otp` or `otp_sent`
- [ ] "إدخال رمز التفعيل" CTA visible
- [ ] Tap CTA → StudentOtpVerification screen
- [ ] Status guard: only accessible if approved
- [ ] Enter wrong OTP → Arabic error
- [ ] Enter correct OTP → success screen with illustration
- [ ] Auto-navigate to Login after success
- [ ] Login as activated student
- [ ] Correct student journey/profile/access
- [ ] Student can access expected student-only areas

## 12. Negative Status QA

### Rejected

- [ ] Submit student request
- [ ] Reject from dashboard with reason
- [ ] Refresh mobile status
- [ ] Shows rejection reason safely
- [ ] CTA returns to Login

### Needs Update

- [ ] Mark needs_update from dashboard with reason
- [ ] Refresh mobile status
- [ ] Shows needs_update reason
- [ ] Message tells user to contact administration
- [ ] No fake resubmit behavior

### Expired

- [ ] Expired OTP shows appropriate error
- [ ] Expired request shows appropriate UI

## 13. OTP Error Handling

- [ ] Wrong OTP → "رمز التحقق غير صحيح" (no crash)
- [ ] Expired OTP → "انتهت صلاحية الرمز"
- [ ] Too many attempts → Arabic error
- [ ] Incomplete OTP (1-5 digits) → submit disabled
- [ ] Rapid submit taps → only one request sent
- [ ] Back button during OTP → no crash
- [ ] Network disconnect during verify → friendly Arabic error
- [ ] Timeout → "استغرق الاتصال وقتاً أطول"
- [ ] App restart while on OTP screen → safe

## 14. Network + Offline

- [ ] Start registration while offline → friendly error
- [ ] Submit while offline → friendly error, form data preserved
- [ ] Restore network and retry → works
- [ ] Refresh student status while offline → previous status visible
- [ ] Upload image on slow network → loading state, no crash

## 15. Security & Privacy

- [ ] No OTP in console logs
- [ ] No password logs
- [ ] No token logs
- [ ] No file URI logs
- [ ] No raw backend JSON shown to user
- [ ] OTP is not saved to AsyncStorage/SecureStore
- [ ] App does not expose dashboard OTP
- [ ] App cannot verify student OTP before admin approval

## 16. Existing Module Regression

Login with an existing approved student:

- [ ] Home loads
- [ ] Subjects loads
- [ ] Subject details loads
- [ ] Groups loads
- [ ] Group details loads
- [ ] Chat opens (or graceful error if WS unavailable)
- [ ] Files loads
- [ ] Printing loads
- [ ] Notifications loads
- [ ] Support loads
- [ ] Profile loads
- [ ] Settings loads
- [ ] Back navigation works
- [ ] App restart preserves session
- [ ] Logout works

## 17. Bug Tracking

| ID  | Severity | Description                        | Status |
| --- | -------- | ---------------------------------- | ------ |
| —   | —        | No bugs found in static validation | —      |

## 18. Known Limitations

- Resend OTP button not implemented (no backend endpoint confirmed for normal flow resend)
- Student resubmit flow is read-only (deferred to future phase)
- No automatic status polling (manual refresh only)
- EAS build processing time may exceed session timeout; build was successfully submitted
- Device QA requires real Android hardware + dashboard admin access (can be completed offline from this session)

## 19. Production Readiness Recommendation

Recommended action before production release:

1. Install the preview APK on ≥1 Android device
2. Execute the complete checklist above
3. Fix any P0/P1 issues found
4. Rerun static validation after fixes
5. Update `EXPO_PUBLIC_ENABLE_ACCOUNT_REGISTRATION_FLOW` in production EAS profile only when:
   - Full device QA passes
   - Dashboard OTP flow validated
   - No P0/P1 bugs remain
6. Run production EAS build → play store submission

## 20. Verdict

MOBILE-D3 COMPLETE — NEEDS DEVICE QA EXECUTION
