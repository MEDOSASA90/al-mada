'use client';

import { useState } from 'react';
import { restoreTrashItemAction } from './actions';

export function RestoreButton({ itemId, itemType }: { itemId: string; itemType: string }) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  async function handleRestore() {
    if (!confirm('هل أنت متأكد من رغبتك في استعادة هذا السجل إلى العيادة؟')) return;
    setBusy(true);
    setMsg('');
    const res = await restoreTrashItemAction(itemId, itemType);
    setBusy(false);
    setMsg(res.message);
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleRestore}
        disabled={busy}
        className="secondary-button text-xs py-1.5 px-3 font-semibold text-teal-800 hover:bg-teal-50"
      >
        {busy ? 'جارٍ الاستعادة…' : '♻️ استعادة الملف'}
      </button>
      {msg && <span className="text-xs text-teal-800 font-medium">{msg}</span>}
    </div>
  );
}
