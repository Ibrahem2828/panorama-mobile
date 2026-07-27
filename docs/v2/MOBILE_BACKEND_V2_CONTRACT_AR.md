# عقد Mobile مع Panorama Backend v2

## Auth

- `POST /api/v1/auth/register/student/`
- `POST /api/v1/auth/register/normal/`
- `POST /api/v1/auth/otp/send/`
- `POST /api/v1/auth/otp/verify/`
- `POST /api/v1/auth/login/`
- `POST /api/v1/auth/token/refresh/`
- `POST /api/v1/auth/logout/`
- `GET/PATCH /api/v1/auth/me/`

## Student & Verification

- `GET/PATCH /api/v1/students/me/profile/`
- `POST /api/v1/students/student-number/parse/`
- `POST /api/v1/verification/submit/`
- `POST /api/v1/verification/resubmit/`
- `GET /api/v1/verification/me/`

## Groups & Chat

- available/my/detail/join/leave.
- `POST /groups/{id}/whatsapp-ticket/` ثم فتح redirect داخلي قصير العمر.
- REST للرسائل وWebSocket للمحادثة الفورية.

## Files

- List/detail لا يعيدان Storage URL خامًا.
- `POST /files/{id}/access-ticket/` يعيد `preview_url` قصير العمر.
- التطبيق يقبل فقط أصل API ومسار `/api/v1/protected-files/`.

## Printing

- `POST /printing/quote/` لحساب السعر من الخادم.
- `POST /printing/orders/` لتأكيد الطلب بنفس الخيارات.
- `GET /printing/orders/my/` وdetail/cancel.
- لا يُرسل أي `price` من العميل.

## Feedback

- Prompt eligibility، prompt events، submit، mine، public suggestions، vote.
- سياسات cooldown وsampling يحددها Backend.
