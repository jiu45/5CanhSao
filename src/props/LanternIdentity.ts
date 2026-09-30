export const LANTERN_STYLES = ['star', 'carp', 'butterfly', 'rabbit'] as const;
export type LanternStyle = typeof LANTERN_STYLES[number];

const STORAGE_KEY = 'trungthu.recipientLanternStyle';

export function isLanternStyle(value: unknown): value is LanternStyle {
  return typeof value === 'string' && LANTERN_STYLES.includes(value as LanternStyle);
}

/** Only the recipient, who plays the childhood chapters, owns this choice. */
export function readRecipientLanternStyle(): LanternStyle {
  try {
    const value = sessionStorage.getItem(STORAGE_KEY);
    return isLanternStyle(value) ? value : 'star';
  } catch { return 'star'; }
}

export function saveRecipientLanternStyle(style: LanternStyle): void {
  try { sessionStorage.setItem(STORAGE_KEY, style); } catch { /* Still works for this play. */ }
}

export const LANTERN_NAMES: Record<LanternStyle, string> = {
  star: 'Đèn ông sao', carp: 'Đèn cá chép',
  butterfly: 'Đèn bươm bướm', rabbit: 'Đèn con thỏ'
};

/** Keep broad and tall paper silhouettes equally legible in the close threshold shot. */
export const THRESHOLD_HOLD: Record<LanternStyle, { scale: number; height: number }> = {
  star: { scale: .68, height: 1.22 },
  carp: { scale: .40, height: 1.78 },
  butterfly: { scale: .37, height: 1.82 },
  rabbit: { scale: .40, height: 1.78 }
};
