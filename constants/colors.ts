// ─── Color Tokens ─────────────────────────────────────────────────────────────
// Semantic role names — change a value here to repaint the whole app.
// Batch 91: applied new brand palette (Legacy Black / Deep Charcoal / Legacy Gold /
//           Rich Gold / Warm Champagne / Soft Ivory). Only RGB base changed per token;
//           every rgba opacity channel is preserved exactly as-was.
// ────────────────────────────────────────────────────────────────────────────────

export const Colors = {

  // ── Surfaces ──────────────────────────────────────────────────────────────────
  // Merged: surfaceDeep (#181510, 1×) → surface. surfaceDark (#110f09, 1×) → surfaceAlt.
  background:     '#0A0A0A',  // Legacy Black — deepest black, main screen bg              (99×)
  surface:        '#1E1E1E',  // Deep Charcoal — cards, sheets, modals                     (54×)
  surfaceAlt:     '#141414',  // Deep Charcoal darker — alternate card bg (neutral darker)  (9×)
  // Batch 86: Education-specific tinted surfaces (warm-dark, used in quiz options / video placeholder / admin destructive)
  // Batch 91: offsets vs #1E1E1E chosen to preserve original directional warmth tint
  surfacePanel:   '#1C180A',  // Deep Charcoal + warm tint — quiz option resting bg, video placeholder, upload area
  surfaceDeep:    '#171206',  // Deep Charcoal + deeper warm — quiz explanation box bg
  errorSurface:   '#1C0000',  // Deep Charcoal + red tint — destructive action button bg (admin remove video)

  // ── Brand gold ────────────────────────────────────────────────────────────────
  // Merged: goldAlt (#c5a454, 6×) → gold (minor hue drift, not design intent).
  //         goldWarm (#c98a4c, 1×) → gold.
  //         goldBright (#e8c060) and goldWarm (#c98a4c) appear ONLY in the
  //         TROPHY_COLORS tuple in leaderboard.tsx — left inline there intentionally.
  //         goldLight (#f5d070) had 0 actual screen uses — dropped.
  gold:           '#C8A96B',  // Legacy Gold — icons, CTAs, highlights                    (157×)
  // Batch 86: high-opacity gold for key-term labels in the module screen
  // Batch 91: Rich Gold #B68B3A at opacity 0.85 (only RGB base changed)
  goldStrong:     'rgba(182,139,58,0.85)',  // Rich Gold — key term text in moduleId admin
  // Batch 90: mid-opacity gold for secondary CTA text (quiz result.tsx)
  // Batch 91: Rich Gold #B68B3A at opacity 0.7 (only RGB base changed)
  goldMid:        'rgba(182,139,58,0.7)',   // Rich Gold — secondary CTA text, result.tsx

  // ── Text ──────────────────────────────────────────────────────────────────────
  // 12 Batch-80 variants consolidated to a 5-level scale.
  // Batch 91: base changed from white (255,255,255) to Warm Champagne (230,211,163);
  //           every opacity is preserved exactly. textPrimary → Soft Ivory #F5F1E8 (solid).
  textPrimary:    '#F5F1E8',                    // Soft Ivory — headings, main labels       (114×)
  textSecondary:  'rgba(230,211,163,0.6)',       // Warm Champagne — secondary labels, nav icons (10×)
  textMuted:      'rgba(230,211,163,0.55)',      // Warm Champagne — muted body text          (64×)
  textTertiary:   'rgba(230,211,163,0.4)',       // Warm Champagne — tertiary / placeholder   (28×)
  textFaint:      'rgba(230,211,163,0.3)',       // Warm Champagne — disabled, timestamps     (26×)
  // Batch 86: placeholder text for TextInput fields in admin panels
  // Batch 91: Warm Champagne at 0.22 (only RGB base changed)
  textPlaceholder: 'rgba(230,211,163,0.22)',     // Warm Champagne — admin form input placeholder

  // ── White fills (ultra-low opacity — UI element backgrounds) ─────────────────
  // Merged: whiteOverlay8 (0.08, 1×) → whiteOverlay10  (progress bar track)
  //         whiteOverlay6 (0.06, 1×) → whiteOverlay10  (PostComposer tab strip)
  // Batch 90: grab handle / clear button bg in CommentsSheet
  // Batch 91: white utility overlays — SIN CAMBIO (neutral, not brand)
  whiteOverlay20: 'rgba(255,255,255,0.2)',   // grab handle bg — CommentsSheet
  whiteOverlay10: 'rgba(255,255,255,0.1)',   // very subtle tint — tab strips, tracks       (8×)
  whiteOverlay4:  'rgba(255,255,255,0.04)',  // ghost tint — input field bg                 (4×)
  // Batch 90: play icon over video thumbnail (YouTubePreview.tsx)
  // Batch 91: SIN CAMBIO
  playIconColor:  'rgba(255,255,255,0.9)',   // play button icon — YouTubePreview.tsx

  // ── Gold borders ──────────────────────────────────────────────────────────────
  // 10 Batch-80 gold-border variants → 3 levels.
  // Batch 91: base changed to Legacy Gold (200,169,107) for borderSubtle/border;
  //           borderStrong uses Rich Gold (182,139,58); opacities unchanged.
  borderSubtle:   'rgba(200,169,107,0.12)',  // Legacy Gold — faint dividers, ghost borders (19×)
  border:         'rgba(200,169,107,0.22)',  // Legacy Gold — main border, cards/inputs     (62×)
  borderStrong:   'rgba(182,139,58,0.4)',    // Rich Gold — focus/active border             (22×)

  // ── Scrim / overlay ───────────────────────────────────────────────────────────
  // Batch 91: SIN CAMBIO (neutral utility, not brand)
  overlay:        'rgba(0,0,0,0.55)',        // dark scrim over images/content              (13×)
  // Batch 90: semi-transparent bg-hue color for disabled CTA icon/text (edit-post.tsx)
  // Batch 91: SIN CAMBIO
  bgDisabled:     'rgba(10,9,0,0.5)',        // disabled CTA text/icon — edit-post.tsx

  // ── State ─────────────────────────────────────────────────────────────────────
  // Batch 91: error/success/warning solid + bg tokens — SIN CAMBIO (universal semaphores)
  error:          '#ef4444',  // red — errors, destructive actions                         (17×)
  success:        '#10b981',  // emerald — success, completed states                        (6×)
  warning:        '#f59e0b',  // amber — warnings, pending states                           (5×)

  // State tinted backgrounds — SIN CAMBIO
  successBg:      'rgba(16,185,129,0.15)',  // success chip / card tint                    (3×)
  warningBg:      'rgba(245,158,11,0.15)',  // warning chip / card tint                    (2×)
  // Batch 86: error-family transparent variants
  errorBg:        'rgba(239,68,68,0.15)',   // wrong-answer bg / error tint — quiz.tsx

  // Batch 91: successBorder and errorBorder migrated to Legacy Gold base (owner spec);
  //           opacities preserved exactly.
  successBorder:  'rgba(200,169,107,0.4)',  // Legacy Gold — pass-state icon border, result.tsx
  errorBorder:    'rgba(200,169,107,0.35)', // Legacy Gold — destructive action border, moduleId admin

  // (off-palette tokens removed in Batch 82 — see commit for decisions)

} as const;

export type ColorToken = keyof typeof Colors;
