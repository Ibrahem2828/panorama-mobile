import { ar } from '../../../../i18n';
import { validateRegistrationFields } from '../authFormValidation';

const messages = ar.auth.validation;
const valid = {
  fullName: 'Ali Ahmad',
  email: 'ali@example.com',
  phone: '+963912345678',
  studentNumber: '2150094',
  password: 'secret123',
  passwordConfirm: 'secret123',
};

describe('validateRegistrationFields', () => {
  it('accepts valid values', () => {
    expect(validateRegistrationFields(valid, messages, { requireStudentNumber: true })).toEqual({});
  });

  it('reports every bad field separately', () => {
    const errors = validateRegistrationFields(
      { ...valid, fullName: ' ', email: 'x', phone: '', studentNumber: '', password: '123' },
      messages,
      { requireStudentNumber: true },
    );
    expect(Object.keys(errors).sort()).toEqual(
      ['email', 'fullName', 'password', 'phone', 'studentNumber'].sort(),
    );
  });

  it('does not require the student number for normal accounts', () => {
    expect(validateRegistrationFields({ ...valid, studentNumber: '' }, messages)).toEqual({});
  });

  it('flags a mismatching confirmation on its own field', () => {
    expect(validateRegistrationFields({ ...valid, passwordConfirm: 'other' }, messages)).toEqual({
      passwordConfirm: messages.passwordMismatch,
    });
  });
});
