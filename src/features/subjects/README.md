# subjects

The read-only subject catalogue (bottom tab «المواد»).

- `GET /api/v1/subjects/` lists every subject of the student's faculty, all years and semesters, with
  `in_current_term`, `is_enrolled` and `has_description`. The whole list is read (bounded paging) and the
  term / year / search filters run on the device, so they also work on the saved copy while offline.
- `GET /api/v1/subjects/<id>/` returns the same row plus the full course description.
- The list is grouped by semester (current term first). Cards show name, code, «السنة · الفصل» and the
  «مسجَّل» / «الفصل الحالي» badges. Tapping opens the details screen.
- There is deliberately no join, enroll, register or request action or hint in this feature. Students get
  into a subject's groups only through the subject-registration flow (`features/enrollment`), after which the
  server adds them. A guard test (`src/__tests__/noGroupJoinGuards.test.ts`) keeps it that way.
- Members of a subject's group still see that group's chat, files and lectures on the details screen.

Pure logic lives in `services/subjectsModel.ts` (normalising, filters, semester sections, badges).
