import {
  applyTermAnswerToProfile,
  getDefaultNextLevel,
  groupSubjectsByTerm,
  orderSemesters,
  shouldShowTermSheet,
  sortSubjectsCurrentTermFirst,
} from '../termPresentation';

const years = [
  { id: 1, name: 'السنة الأولى' },
  { id: 2, name: 'السنة الثانية' },
  { id: 3, name: 'السنة الثالثة' },
];
const semesters = [
  { id: 10, name: 'الأول' },
  { id: 11, name: 'الثاني' },
];

describe('groupSubjectsByTerm', () => {
  it('puts current-term subjects first and keeps the server order inside each group', () => {
    const items = [
      { id: 'a', in_current_term: false },
      { id: 'b', in_current_term: true },
      { id: 'c' },
      { id: 'd', in_current_term: true },
    ];

    expect(groupSubjectsByTerm(items)).toEqual({
      current: [items[1], items[3]],
      other: [items[0], items[2]],
    });
    expect(sortSubjectsCurrentTermFirst(items).map((item) => item.id)).toEqual([
      'b',
      'd',
      'a',
      'c',
    ]);
  });
});

describe('orderSemesters', () => {
  it('lists the current semester first whatever its id', () => {
    expect(orderSemesters(semesters, 11).map((item) => item.id)).toEqual([11, 10]);
    expect(orderSemesters(semesters, '10').map((item) => item.id)).toEqual([10, 11]);
    expect(orderSemesters(semesters, null).map((item) => item.id)).toEqual([10, 11]);
  });
});

describe('getDefaultNextLevel', () => {
  it('defaults to the year after the current one and the semester of the current term', () => {
    expect(getDefaultNextLevel({ years, semesters, currentYearId: 1, termSemesterId: 11 })).toEqual(
      { academicYearId: 2, semesterId: 11 },
    );
  });

  it('stays on the last year and falls back to the first options when nothing matches', () => {
    expect(
      getDefaultNextLevel({ years, semesters, currentYearId: '3', termSemesterId: undefined }),
    ).toEqual({ academicYearId: 3, semesterId: 10 });
    expect(
      getDefaultNextLevel({ years, semesters, currentYearId: null, termSemesterId: 99 }),
    ).toEqual({ academicYearId: 1, semesterId: 10 });
    expect(
      getDefaultNextLevel({ years: [], semesters: [], currentYearId: 1, termSemesterId: 1 }),
    ).toEqual({ academicYearId: null, semesterId: null });
  });
});

describe('shouldShowTermSheet', () => {
  const base = {
    isStudent: true,
    needsConfirmation: true,
    answered: false,
    postponed: false,
    isOnline: true,
    sheetOpenWhenOffline: false,
  };

  it('shows only for a student the server asks, who has not answered', () => {
    expect(shouldShowTermSheet(base)).toBe(true);
    expect(shouldShowTermSheet({ ...base, isStudent: false })).toBe(false);
    expect(shouldShowTermSheet({ ...base, needsConfirmation: false })).toBe(false);
    expect(shouldShowTermSheet({ ...base, needsConfirmation: undefined })).toBe(false);
    expect(shouldShowTermSheet({ ...base, answered: true })).toBe(false);
    expect(shouldShowTermSheet({ ...base, postponed: true })).toBe(false);
  });

  it('never blocks offline use, but keeps an open sheet open when the connection drops', () => {
    expect(shouldShowTermSheet({ ...base, isOnline: false })).toBe(false);
    expect(shouldShowTermSheet({ ...base, isOnline: false, sheetOpenWhenOffline: true })).toBe(
      true,
    );
  });
});

describe('applyTermAnswerToProfile', () => {
  const profile = {
    needs_term_confirmation: true,
    academic_year: { id: 1, name: 'السنة الأولى' },
    semester: { id: 10, name: 'الأول' },
  };

  it('clears the flag and keeps the level when the student did not move up', () => {
    const next = applyTermAnswerToProfile(profile, { promoted: false, year: null, semester: null });

    expect(next).toMatchObject({ ...profile, needs_term_confirmation: false });
  });

  it('moves the student to the chosen level when they did', () => {
    const next = applyTermAnswerToProfile(profile, {
      promoted: true,
      year: years[1] ?? null,
      semester: semesters[1] ?? null,
    });

    expect(next).toMatchObject({
      needs_term_confirmation: false,
      academic_year: { id: 2 },
      academicYear: { id: 2 },
      semester: { id: 11 },
    });
    expect(profile.needs_term_confirmation).toBe(true);
  });

  it('passes a missing profile through', () => {
    expect(applyTermAnswerToProfile(null, { promoted: false, year: null, semester: null })).toBe(
      null,
    );
  });
});
