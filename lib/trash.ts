import { createClient } from '@/lib/supabase/server';
import { DEMO_TRASH_ITEMS } from './demo-data';

export type TrashItem = {
  id: string;
  item_type: string;
  title: string;
  subtitle: string;
  deleted_at: string;
};

export async function listTrashItems(): Promise<TrashItem[]> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return DEMO_TRASH_ITEMS;
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc('list_trash_for_current_user');
  if (error) return [];
  return (data ?? []) as TrashItem[];
}
