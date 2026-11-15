import { createClient } from '@/lib/supabase/server';
import { DEMO_INVENTORY } from './demo-data';

export type InventoryItem = {
  id: string;
  clinic_id: string;
  name: string;
  sku: string | null;
  category: string;
  unit: string;
  quantity_on_hand: number;
  reorder_level: number;
  cost_price: number;
  selling_price: number;
  is_active: boolean;
  created_at: string;
};

export async function listInventoryItems(): Promise<InventoryItem[]> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return DEMO_INVENTORY as InventoryItem[];
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('inventory_items')
    .select('id,clinic_id,name,sku,category,unit,quantity_on_hand,reorder_level,cost_price,selling_price,is_active,created_at')
    .is('deleted_at', null)
    .order('name', { ascending: true });

  if (error) return [];
  return (data ?? []) as InventoryItem[];
}

export async function getInventoryItem(id: string): Promise<InventoryItem | null> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    const item = DEMO_INVENTORY.find((i) => i.id === id) || DEMO_INVENTORY[0];
    return (item ?? null) as InventoryItem | null;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('inventory_items')
    .select('id,clinic_id,name,sku,category,unit,quantity_on_hand,reorder_level,cost_price,selling_price,is_active,created_at')
    .eq('id', id)
    .is('deleted_at', null)
    .maybeSingle();

  if (error || !data) return null;
  return data as InventoryItem;
}
