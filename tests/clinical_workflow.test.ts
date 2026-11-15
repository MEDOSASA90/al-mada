/**
 * Unit tests for Phase 3A Clinical & Operational Helpers
 */
import { listAppointmentsForDate, countAppointmentsForToday } from '@/lib/appointments';
import { listMedicalRecordsForPatient } from '@/lib/medical-records';
import { listInvoices, getTotalRevenue } from '@/lib/billing';
import { listActiveQueueTickets } from '@/lib/queue';

process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://synthetic.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'synthetic-key';

const mockFrom = jest.fn();
const mockSelect = jest.fn();
const mockEq = jest.fn();
const mockIs = jest.fn();
const mockIn = jest.fn();
const mockOrder = jest.fn();
const mockLimit = jest.fn();
const mockRpc = jest.fn();

jest.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({ from: mockFrom, rpc: mockRpc }),
}));

beforeEach(() => {
  jest.clearAllMocks();
  mockFrom.mockReturnValue({ select: mockSelect });
  mockSelect.mockReturnValue({
    eq: mockEq,
    is: mockIs,
    in: mockIn,
    order: mockOrder,
    limit: mockLimit,
  });
  mockEq.mockReturnValue({
    is: mockIs,
    order: mockOrder,
    limit: mockLimit,
  });
  mockIs.mockReturnValue({
    order: mockOrder,
    limit: mockLimit,
  });
  mockIn.mockReturnValue({
    order: mockOrder,
    eq: mockEq,
  });
  mockOrder.mockReturnValue({
    limit: mockLimit,
    order: mockOrder,
  });
  mockLimit.mockResolvedValue({ data: [], error: null });
});

describe('Appointments Helpers', () => {
  it('returns empty array when no appointments found', async () => {
    mockLimit.mockResolvedValue({ data: [], error: null });
    const res = await listAppointmentsForDate('2026-11-15');
    expect(res).toEqual([]);
  });

  it('calculates today appointment count', async () => {
    mockSelect.mockReturnValue({
      eq: jest.fn().mockReturnValue({
        is: jest.fn().mockResolvedValue({ count: 5, error: null }),
      }),
    });
    const count = await countAppointmentsForToday();
    expect(count).toBe(5);
  });
});

describe('Medical Records Helpers', () => {
  it('fetches clinical records for a patient', async () => {
    mockOrder.mockResolvedValue({
      data: [
        {
          id: 'rec-1',
          patient_id: 'p-1',
          chief_complaint: 'صداع مزمن',
          diagnosis: 'صداع نصفي',
          is_locked: true,
        },
      ],
      error: null,
    });
    const records = await listMedicalRecordsForPatient('p-1');
    expect(records).toHaveLength(1);
    expect(records[0].diagnosis).toBe('صداع نصفي');
  });
});

describe('Billing Helpers', () => {
  it('lists invoices for clinic', async () => {
    mockLimit.mockResolvedValue({
      data: [
        {
          id: 'inv-1',
          invoice_number: 'INV-20261115-0001',
          total: 500,
          paid_total: 500,
          status: 'paid',
        },
      ],
      error: null,
    });
    const invoices = await listInvoices();
    expect(invoices).toHaveLength(1);
    expect(invoices[0].invoice_number).toBe('INV-20261115-0001');
  });

  it('aggregates total revenue from paid invoices', async () => {
    mockIs.mockResolvedValue({
      data: [
        { paid_total: 300 },
        { paid_total: 200 },
      ],
      error: null,
    });
    const rev = await getTotalRevenue();
    expect(rev).toBe(500);
  });
});

describe('Queue Helpers', () => {
  it('lists active queue tickets', async () => {
    mockOrder.mockReturnValue({
      order: jest.fn().mockResolvedValue({
        data: [
          { id: 't-1', ticket_number: 1, status: 'waiting', patient_id: 'p-1' },
        ],
        error: null,
      }),
    });
    const tickets = await listActiveQueueTickets();
    expect(tickets).toHaveLength(1);
    expect(tickets[0].ticket_number).toBe(1);
  });
});

describe('Phase 3B - Packages & Inventory Helpers', () => {
  it('lists inventory items', async () => {
    mockOrder.mockResolvedValue({
      data: [
        { id: 'item-1', name: 'سرنجات معقمة', quantity_on_hand: 50, cost_price: 2 },
      ],
      error: null,
    });
    const { listInventoryItems } = await import('@/lib/inventory');
    const items = await listInventoryItems();
    expect(items).toHaveLength(1);
    expect(items[0].name).toBe('سرنجات معقمة');
  });

  it('lists clinic packages', async () => {
    mockLimit.mockResolvedValue({
      data: [
        { id: 'pkg-1', name: 'باقة علاج طبيعي', total_sessions: 10, used_sessions: 3 },
      ],
      error: null,
    });
    const { listAllClinicPackages } = await import('@/lib/packages');
    const pkgs = await listAllClinicPackages();
    expect(pkgs).toHaveLength(1);
    expect(pkgs[0].total_sessions).toBe(10);
  });
});
