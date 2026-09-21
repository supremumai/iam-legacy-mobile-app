// ─── Color Tokens ─────────────────────────────────────────────────────────────
// Semantic role names — change a value here to repaint the whole app.
// Current palette values noted in comments.
// Batch 81: consolidated from 65 → 26 tokens. Merge decisions documented inline.
// ──────────────────────────────────────────────────────────────────────────────

export const Colors = {

  // ── Surfaces ────────────────────────────────────────────────────────────────
  // Merged: surfaceDeep (#181510, 1×) → surface. surfaceDark (#110f09, 1×) → surfaceAlt.
  background:     '#0a0900',  // deepest black — main screen bg              (99×)
  surface:        '#1c1a14',  // charcoal — cards, sheets, modals            (54×)
  surfaceAlt:     '#111008',  // mid-dark — alternate card bg                 (9×)

  // ── Brand gold ──────────────────────────────────────────────────────────────
  // Merged: goldAlt (#c5a454, 6×) → gold (minor hue drift, not design intent).
  //         goldWarm (#c98a4c, 1×) → gold.
  //         goldBright (#e8c060) and goldWarm (#c98a4c) appear ONLY in the
  //         TROPHY_COLORS tuple in leaderboard.tsx — left inline there intentionally.
  //         goldLight (#f5d070) had 0 actual screen uses — dropped.
  gold:           '#c9a84c',  // primary gold — icons, CTAs, highlights      (157×)

  // ── Text whites ─────────────────────────────────────────────────────────────
  // 12 Batch-80 variants consolidated to a 5-level scale.
  // Merge notes:
  //   textFaint65 (0.65, 2×) → textSecondary  (drawer nav icons, 0.05 away)
  //   textFaint70 (0.7, 1×)  → textSecondary  (Switch thumb off, 0.1 away)
  //   textFaint80 (0.8, 1×)  → textPrimary    (PostComposer toggle label, near-white)
  //   textFaint90 (0.9, 1×)  → textPrimary    (YouTubePreview play icon)
  //   textFaint75 (0.75, 1×) → stays INLINE in TROPHY_COLORS (silver trophy icon)
  //   textFaint85 (0.85, 1×) → textPrimary    (quiz option text, near-white)
  //   textHalf    (0.5, 7×)  → textMuted      (0.05 closer to muted than tertiary)
  //   textTertiary45 (0.45, 12×) → textTertiary (0.05 closer to tertiary than muted)
  //   textSubtle  (0.35, 12×) → textFaint     (0.05 away; 12× uses noted — inspect if visually harsh)
  //   textFaint25 (0.25, 1×) → textFaint
  //   textFaint20 (0.2, 2×)  → textFaint      (locked module border + drag handle)
  //   textFaint15 (0.15, 2×) → textFaint      (Switch track + quiz progress bar)
  textPrimary:    '#ffffff',                 // white — headings, main labels (114×)
  textSecondary:  'rgba(255,255,255,0.6)',   // secondary labels, nav icons   (10×)
  textMuted:      'rgba(255,255,255,0.55)',  // muted body text — most common  (64×)
  textTertiary:   'rgba(255,255,255,0.4)',   // tertiary / placeholder         (28× incl. 0.45)
  textFaint:      'rgba(255,255,255,0.3)',   // faint — disabled, timestamps   (26× incl. 0.35, 0.2, 0.15)

  // ── White fills (ultra-low opacity — UI element backgrounds) ────────────────
  // Merged: whiteOverlay8 (0.08, 1×) → whiteOverlay10  (progress bar track)
  //         whiteOverlay6 (0.06, 1×) → whiteOverlay10  (PostComposer tab strip)
  whiteOverlay10: 'rgba(255,255,255,0.1)',   // very subtle tint — tab strips, tracks  (8×)
  whiteOverlay4:  'rgba(255,255,255,0.04)',  // ghost tint — input field bg    (4×)

  // ── Gold borders ────────────────────────────────────────────────────────────
  // 10 Batch-80 gold-border variants (rgba 201,168,76 and 197,164,84) → 3 levels.
  // Also absorbs all rgba(197,164,84,X) borders (goldAlt base → gold base).
  // Merge notes:
  //   borderFaint8  (0.08, 8×)  → borderSubtle  (0.04 away)
  //   borderFaint18 (0.18, 2×)  → border        (0.04 away)
  //   borderAlt12   rgba197 12% → borderSubtle
  //   borderAlt22/25 rgba197    → border
  //   borderAlt40   rgba197 40% → borderStrong
  //   borderMedium  (0.3, 8×)   → borderStrong  (per batch spec; will be slightly more prominent)
  //   borderMedium35 (0.35, 6×) → borderStrong  (per batch spec)
  //   borderStrong45/50/60      → borderStrong
  borderSubtle:   'rgba(201,168,76,0.12)',  // faint dividers, ghost borders   (19× incl. 0.08)
  border:         'rgba(201,168,76,0.22)',  // main border — cards, inputs     (62×)
  borderStrong:   'rgba(201,168,76,0.4)',   // strong border — focus, active   (22× incl. 0.3/0.35)

  // ── Scrim / overlay ─────────────────────────────────────────────────────────
  // Merged: overlay rgba(10,9,0,X) and rgba(0,0,0,X) variants all → one overlay token.
  // All opacity variants (0.45–0.6) unified to 0.55 — perceptibly indistinguishable in a scrim.
  overlay:        'rgba(0,0,0,0.55)',       // dark scrim over images/content  (13× combined)

  // ── State ───────────────────────────────────────────────────────────────────
  // Merged: errorSoft (#e05c5c, 2×) → error. Form error text in sign-in/sign-up
  //         gets the standard error red; the soft variant was not intentional design.
  //         successSoft (#5fa564, 1×) → success. TrackCard % text; muted vs saturated
  //         green is a subtle distinction that isn't worth a separate token here.
  error:          '#ef4444',  // red — errors, destructive actions            (17×)
  success:        '#10b981',  // emerald — success, completed states           (6×)
  warning:        '#f59e0b',  // amber — warnings, pending states              (5×)

  // State tinted backgrounds
  successBg:      'rgba(16,185,129,0.15)',  // success chip / card tint        (3×)
  warningBg:      'rgba(245,158,11,0.15)', // warning chip / card tint         (2×)

  // ── Off-palette — owner review required ─────────────────────────────────────
  // These colors fall outside the core gold/black palette.
  // Each has a specific documented use. DO NOT consolidate without owner sign-off.
  //
  // EventCard badge system (online vs in-person events) — intentional paired design:
  successAlt:     '#16a34a',  // in-person event badge text                   (2×)
  successLight:   '#dcfce7',  // in-person event badge bg                     (1×)
  info:           '#1d4ed8',  // online event badge text                      (1×)
  blueLight:      '#dbeafe',  // online event badge bg                        (1×)
  //
  // Accent (indigo) — education section UI:
  accent:         '#6366f1',  // education section icon + saved.tsx topic label (2×)
  //
  // Education heading text — warm cream instead of white (deliberate design):
  cream:          '#e8e0cc',  // education content heading text               (3×)

} as const;

export type ColorToken = keyof typeof Colors;
