/**
 * Unit tests for the patient query helpers.
 * The Supabase client is mocked, so these tests assert query construction and
 * error handling — not RLS itself. RLS is verified end-to-end against the real
 * database by scripts/test_isolation.py (T1-T10).
 */
import { listPatients, createPatient, softDeletePatient } from '@/lib/patients';

process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://synthetic.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'synthetic-key';

const mockFrom = jest.fn();
const mockSelect = jest.fn();
const mockEq = jest.fn();
const mockIs = jest.fn();
const mockOrder = jest.fn();
const mockLimit = jest.fn();
const mockOr = jest.fn();
const mockRpc = jest.fn();
const mockMaybeSingle = jest.fn();

jest.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({ from: mockFrom, rpc: mockRpc }),
}));

beforeEach(() => {
  jest.clearAllMocks();
  mockFrom.mockReturnValue({
    select: mockSelect,
  });
  mockSelect.mockReturnValue({
    is: mockIs,
    eq: mockEq,
    order: mockOrder,
    limit: mockLimit,
    or: mockOr,
    maybeSingle: mockMaybeSingle,
  });
  mockIs.mockReturnValue({ or: mockOr, order: mockOrder });
  mockOr.mockReturnValue({ order: mockOrder });
  mockOrder.mockReturnValue({ limit: mockLimit });
  mockLimit.mockResolvedValue({ data: [], error: null });
  mockEq.mockReturnValue({ maybeSingle: mockMaybeSingle });
  mockMaybeSingle.mockResolvedValue({ data: null, error: null });
  mockRpc.mockResolvedValue({ data: 'p1', error: null });
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
  it('derives the clinic from the authenticated server session', async () => {
    const input = {
      full_name: 'سارة',
      phone: '+201000000000',
    };
    mockMaybeSingle.mockResolvedValue({ data: { id: 'p1', full_name: 'سارة' }, error: null });
    await createPatient(input);
    expect(mockRpc).toHaveBeenCalledWith('create_patient_for_current_user', expect.objectContaining({
      p_full_name: 'سارة', p_phone: '+201000000000',
    }));
    expect(mockRpc.mock.calls[0][1]).not.toHaveProperty('clinic_id');
  });

  it('surfaces RPC errors', async () => {
    mockRpc.mockResolvedValue({ data: null, error: { message: 'duplicate key' } });
    await expect(
      createPatient({ full_name: 'x', phone: 'y' }),
    ).rejects.toThrow(/duplicate key/);
  });
});

describe('softDeletePatient', () => {
  it('uses the tenant-aware archive RPC', async () => {
    await softDeletePatient('p1');
    expect(mockRpc).toHaveBeenCalledWith('archive_patient_for_current_user', { p_id: 'p1' });
  });
});
