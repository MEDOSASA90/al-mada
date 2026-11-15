'use client';

import { useState } from 'react';
import { createPortalAttachmentUrl } from './actions';

export function AttachmentLink({ id, fileName }: { id: string; fileName: string }) {
  const [url, setUrl] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  async function requestLink() {
    setBusy(true);
    setMessage('');
    const result = await createPortalAttachmentUrl(id);
    if (result.url) setUrl(result.url);
    else setMessage(result.error ?? 'تعذّر فتح الملف.');
    setBusy(false);
  }

  return <div className="flex flex-col items-start gap-2">
    {url ? (
      <a href={url} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-teal-800 underline underline-offset-4">فتح {fileName}</a>
    ) : (
      <button type="button" onClick={requestLink} disabled={busy} className="text-sm font-semibold text-teal-800 underline underline-offset-4 disabled:opacity-60">
        {busy ? 'جارٍ تجهيز رابط آمن…' : 'عرض الملف'}
      </button>
    )}
    {message && <span role="status" className="text-xs text-rose-700">{message}</span>}
    {url && <span className="text-xs text-slate-500">الرابط صالح لمدة دقيقتين.</span>}
  </div>;
}
