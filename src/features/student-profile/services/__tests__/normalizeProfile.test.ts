import { normalizeStudentProfile } from '../normalizeProfile';

describe('normalizeStudentProfile', () => {
  it('folds *_detail objects into the main relation fields', () => {
    const profile = normalizeStudentProfile({
      id: 4,
      university: 2,
      university_detail: { id: 2, name: 'الجامعة السورية الخاصة', code: 'SPU' },
      faculty: 8,
      faculty_detail: { id: 8, name: 'كلية الهندسة المعلوماتية', code: '4' },
      major: null,
      major_detail: null,
      academic_year: 8,
      academic_year_detail: { id: 8, name: 'السنة الثانية' },
      semester: 9,
      semester_detail: { id: 9, name: 'الفصل الاول سنة ثانية' },
      student_number: '4777001',
    });

    expect(profile.faculty).toEqual({ id: 8, name: 'كلية الهندسة المعلوماتية', code: '4' });
    expect(profile.university?.id).toBe(2);
    expect(profile.academic_year?.id).toBe(8);
    expect(profile.semester?.id).toBe(9);
    expect(profile.major).toBeNull();
    expect(profile.student_number).toBe('4777001');
  });

  it('keeps an id usable when the detail object is missing', () => {
    const profile = normalizeStudentProfile({ faculty: 8, university: null });

    expect(profile.faculty).toEqual({ id: 8, name: '' });
    expect(profile.university).toBeNull();
    expect(profile.semester).toBeNull();
  });

  it('leaves already-nested relations untouched', () => {
    const faculty = { id: 3, name: 'كلية الصيدلة' };

    expect(normalizeStudentProfile({ faculty }).faculty).toEqual(faculty);
  });
});
