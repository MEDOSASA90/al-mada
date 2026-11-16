import { createClient } from '@/lib/supabase/server';
import { DEMO_INVENTORY } from './demo-data';
import { isDemoSession } from './session';

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
  if (await isDemoSession()) {
    return DEMO_INVENTORY as InventoryItem[];
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('inventory_items')
      .select('id,clinic_id,name,sku,category,unit,quantity_on_hand,reorder_level,cost_price,selling_price,is_active,created_at')
      .is('deleted_at', null)
      .order('name', { ascending: true });

    if (error || !data || data.length === 0) {
      return DEMO_INVENTORY as InventoryItem[];
    }
    return data as InventoryItem[];
  } catch {
    return DEMO_INVENTORY as InventoryItem[];
  }
}

export async function getInventoryItem(id: string): Promise<InventoryItem | null> {
  if (await isDemoSession()) {
    const item = DEMO_INVENTORY.find((i) => i.id === id) || DEMO_INVENTORY[0];
    return (item ?? null) as InventoryItem | null;
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('inventory_items')
      .select('id,clinic_id,name,sku,category,unit,quantity_on_hand,reorder_level,cost_price,selling_price,is_active,created_at')
      .eq('id', id)
      .is('deleted_at', null)
      .maybeSingle();

    if (error || !data) {
      const fallback = DEMO_INVENTORY.find((i) => i.id === id) || DEMO_INVENTORY[0];
      return (fallback ?? null) as InventoryItem | null;
    }
    return data as InventoryItem;
  } catch {
    const fallback = DEMO_INVENTORY.find((i) => i.id === id) || DEMO_INVENTORY[0];
    return (fallback ?? null) as InventoryItem | null;
  }
}
