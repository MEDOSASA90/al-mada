'use client';

import { useState } from 'react';
import { consumeSessionAction } from './actions';

export function SessionConsumeButton({
  packageId,
  remaining,
  active,
}: {
  packageId: string;
  remaining: number;
  active: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  async function handleConsume() {
    if (remaining <= 0 || !active) return;
    if (!confirm('هل تريد تسجيل حضور وخصم جلسة من هذه الباقة الآن؟')) return;

    setBusy(true);
    setMsg('');
    const res = await consumeSessionAction(packageId);
    setMsg(res.message);
    setBusy(false);
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={handleConsume}
        disabled={busy || remaining <= 0 || !active}
        className="primary-button text-xs py-1.5 px-3 disabled:opacity-50"
        type="button"
      >
        {busy ? 'جارٍ الخصم…' : '✓ تسجيل استخدام جلسة'}
      </button>
      {msg && <span className="text-[11px] text-teal-800">{msg}</span>}
    </div>
  );
}
