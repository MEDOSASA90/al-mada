/**
 * Unit tests for the patient query helpers.
 * The Supabase client is mocked, so these tests assert query construction and
 * error handling — not RLS itself. RLS is verified end-to-end against the real
 * database by scripts/test_isolation.py (T1-T10).
 */
import { listPatients, createPatient, softDeletePatient } from '@/lib/patients';

const mockFrom = jest.fn();
const mockSelect = jest.fn();
const mockEq = jest.fn();
const mockIs = jest.fn();
const mockOrder = jest.fn();
const mockLimit = jest.fn();
const mockOr = jest.fn();
const mockInsert = jest.fn();
const mockUpdate = jest.fn();
const mockSingle = jest.fn();

jest.mock('@/lib/supabase', () => ({
  getBrowserClient: () => ({ from: mockFrom }),
}));

beforeEach(() => {
  jest.clearAllMocks();
  mockFrom.mockReturnValue({
    select: mockSelect,
    insert: mockInsert,
    update: mockUpdate,
  });
  mockSelect.mockReturnValue({
    is: mockIs,
    eq: mockEq,
    order: mockOrder,
    limit: mockLimit,
    or: mockOr,
    single: mockSingle,
  });
  mockIs.mockReturnValue({ or: mockOr, order: mockOrder });
  mockOr.mockReturnValue({ order: mockOrder });
  mockOrder.mockReturnValue({ limit: mockLimit });
  mockLimit.mockResolvedValue({ data: [], error: null });
  mockInsert.mockReturnValue({ select: () => ({ single: mockSingle }) });
  mockUpdate.mockReturnValue({ eq: mockEq });
  mockEq.mockResolvedValue({ data: null, error: null });
  mockSingle.mockResolvedValue({ data: null, error: null });
});

describe('listPatients', () => {
  it('returns rows on success', async () => {
    mockLimit.mockResolvedValue({ data: [{ id: 'p1', full_name: 'محمد' }], error: null });
    const rows = await listPatients();
    expect(rows).toHaveLength(1);
    expect(rows[0].full_name).toBe('محمد');
  });

  it('throws a descriptive error when the query fails', async () => {
    mockLimit.mockResolvedValue({ data: null, error: { message: 'permission denied' } });
    await expect(listPatients()).rejects.toThrow(/permission denied/);
  });

  it('applies the default limit', async () => {
    await listPatients();
    expect(mockLimit).toHaveBeenCalledWith(50);
  });

  it('honours a custom limit', async () => {
    await listPatients({ limit: 10 });
    expect(mockLimit).toHaveBeenCalledWith(10);
  });

  it('strips PostgREST filter metacharacters from the search term', async () => {
    await listPatients({ search: 'a,b(c)%,' });
    const orArg = mockOr.mock.calls[0][0];
    // the search term itself must be sanitised — '%,' still appears legitimately
    // as the separator between the two ilike conditions
    expect(orArg).toContain('ilike.%a b c%');
    expect(orArg).not.toContain('ilike.%a,b');
    expect(orArg).not.toContain('ilike.%a,b(c)');
  });
});

describe('createPatient', () => {
  it('sends the clinic_id so RLS can validate the tenant', async () => {
    const input = {
      clinic_id: 'clinic-a',
      full_name: 'سارة',
      phone: '+201000000000',
    };
    await createPatient(input);
    const insertArg = mockInsert.mock.calls[0][0];
    expect(insertArg.clinic_id).toBe('clinic-a');
    expect(insertArg.full_name).toBe('سارة');
  });

  it('surfaces insert errors', async () => {
    mockSingle.mockResolvedValue({ data: null, error: { message: 'duplicate key' } });
    await expect(
      createPatient({ clinic_id: 'c', full_name: 'x', phone: 'y' }),
    ).rejects.toThrow(/duplicate key/);
  });
});

describe('softDeletePatient', () => {
  it('sets deleted_at instead of hard-deleting', async () => {
    await softDeletePatient('p1');
    const updateArg = mockUpdate.mock.calls[0][0];
    expect(updateArg).toHaveProperty('deleted_at');
  });
});
