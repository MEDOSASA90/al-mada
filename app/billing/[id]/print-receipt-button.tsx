'use client';

export function PrintReceiptButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="secondary-button text-xs py-2 px-3 inline-flex items-center gap-1.5"
    >
      <span>🖨️</span>
      <span>طباعة الإيصال (PDF)</span>
    </button>
  );
}
