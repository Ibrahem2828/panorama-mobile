jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));
jest.mock('expo-constants', () => ({
  __esModule: true,
  default: { expoConfig: { extra: { apiBaseUrl: 'https://api.example.com' } } },
}));
jest.mock('../../../../api/services/academic.service', () => ({
  ...jest.requireActual('../../../../api/services/academic.service'),
  listSubjectCatalog: jest.fn(),
  getSubjectCatalogDetail: jest.fn(),
}));

import { endpoints } from '../../../../api/endpoints';
import {
  getSubjectCatalogDetail,
  listSubjectCatalog,
} from '../../../../api/services/academic.service';
import { loadSubjectCatalog, loadSubjectDetail } from '../subjectsService';

const list = listSubjectCatalog as jest.Mock;
const detail = getSubjectCatalogDetail as jest.Mock;

const record = (id: number) => ({
  id,
  name: `مادة ${id}`,
  code: `C${id}`,
  academic_year: { id: 1, name: 'الأولى', order: 1 },
  semester: { id: 10, name: 'الأول', order: 1 },
  major: null,
  faculty: { id: 5, name: 'كلية' },
  in_current_term: false,
  is_enrolled: false,
  has_description: false,
});

beforeEach(() => {
  list.mockReset();
  detail.mockReset();
});

describe('loadSubjectCatalog', () => {
  it('reads every page and drops unusable rows', async () => {
    list
      .mockResolvedValueOnce({ count: 3, next: 'p2', previous: null, results: [record(1), {}] })
      .mockResolvedValueOnce({ count: 3, next: null, previous: 'p1', results: [record(2)] });

    const { subjects, count } = await loadSubjectCatalog('token');

    expect(subjects.map((s) => s.id)).toEqual([1, 2]);
    expect(count).toBe(3);
    expect(list).toHaveBeenCalledTimes(2);
    expect(list).toHaveBeenNthCalledWith(2, { page: 2, pageSize: 100 }, 'token');
  });

  it('stops on an empty page even if the server still says there is a next one', async () => {
    list.mockResolvedValue({ count: 0, next: 'more', previous: null, results: [] });

    expect((await loadSubjectCatalog('t')).subjects).toEqual([]);
    expect(list).toHaveBeenCalledTimes(1);
  });
});

describe('loadSubjectDetail', () => {
  it('returns the subject with its description', async () => {
    detail.mockResolvedValue({ ...record(7), description: 'وصف المقرر', has_description: true });

    await expect(loadSubjectDetail(7, 't')).resolves.toMatchObject({
      id: 7,
      description: 'وصف المقرر',
    });
    expect(detail).toHaveBeenCalledWith(7, 't');
  });

  it('gives a null description for an empty one', async () => {
    detail.mockResolvedValue({ ...record(8), description: '' });

    await expect(loadSubjectDetail(8, 't')).resolves.toMatchObject({ description: null });
  });

  it('rejects a malformed payload', async () => {
    detail.mockResolvedValue({});

    await expect(loadSubjectDetail(9, 't')).rejects.toThrow();
  });
});

describe('subject endpoints', () => {
  it('are plain GET paths under /api/v1/subjects/', () => {
    expect(endpoints.academic.subjectCatalog).toBe('/api/v1/subjects/');
    expect(endpoints.academic.subjectCatalogDetail(4)).toBe('/api/v1/subjects/4/');
  });
});
