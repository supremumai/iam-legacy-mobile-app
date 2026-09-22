// ─── Color Tokens ─────────────────────────────────────────────────────────────
// Semantic role names – change a value here to repaint the whole app.
// Batch 91: applied new brand palette (Legacy Black / Deep Charcoal / Legacy Gold /
//           Rich Gold / Warm Champagne / Soft Ivory). Only RGB base changed per token;
//           every rgba opacity channel is preserved exactly as-was.
// Batch 92: split into darkColors (= Batch 91 values) + lightColors (new light mode).
//           Colors (static export) still points to darkColors for backwards-compat:
//           screens not yet migrated to useColors() keep working unchanged.
//           Migrated screens call useColors() from ThemeContext to get the active set.
// ─────────────────────────────────────────────────────────────────────────────

// ─── DARK set (Batch 91 values, unchanged) ────────────────────────────────────
export const darkColors = {

  // ── Surfaces ─────────────────────────────────────────────────────────────────
  background:     '#0A0A0A',  // Legacy Black – deepest black, main screen bg              (99×)
  surface:        '#1E1E1E',  // Deep Charcoal – cards, sheets, modals                     (54×)
  surfaceAlt:     '#141414',  // Deep Charcoal darker – alternate card bg                   (9×)
  surfacePanel:   '#1C180A',  // Deep Charcoal + warm tint – quiz option resting bg, video placeholder
  surfaceDeep:    '#171206',  // Deep Charcoal + deeper warm – quiz explanation box bg
  errorSurface:   '#1C0000',  // Deep Charcoal + red tint – destructive action button bg (admin)

  // ── Brand gold ───────────────────────────────────────────────────────────────
  gold:           '#C8A96B',  // Legacy Gold – icons, CTAs, highlights                    (157×)
  goldStrong:     'rgba(182,139,58,0.85)',  // Rich Gold – key term text in moduleId admin
  goldMid:        'rgba(182,139,58,0.7)',   // Rich Gold – secondary CTA text, result.tsx

  // ── Text ─────────────────────────────────────────────────────────────────────
  textPrimary:    '#F5F1E8',                    // Soft Ivory – headings, main labels       (114×)
  textSecondary:  'rgba(230,211,163,0.6)',       // Warm Champagne – secondary labels, nav icons (10×)
  textMuted:      'rgba(230,211,163,0.55)',      // Warm Champagne – muted body text          (64×)
  textTertiary:   'rgba(230,211,163,0.4)',       // Warm Champagne – tertiary / placeholder   (28×)
  textFaint:      'rgba(230,211,163,0.3)',       // Warm Champagne – disabled, timestamps     (26×)
  textPlaceholder: 'rgba(230,211,163,0.22)',     // Warm Champagne – admin form input placeholder

  // ── White fills (ultra-low opacity) ──────────────────────────────────────────
  whiteOverlay20: 'rgba(255,255,255,0.2)',   // grab handle bg – CommentsSheet
  whiteOverlay10: 'rgba(255,255,255,0.1)',   // very subtle tint – tab strips, tracks       (8×)
  whiteOverlay4:  'rgba(255,255,255,0.04)',  // ghost tint – input field bg                 (4×)
  playIconColor:  'rgba(255,255,255,0.9)',   // play button icon – YouTubePreview.tsx

  // ── Gold borders ─────────────────────────────────────────────────────────────
  borderSubtle:   'rgba(200,169,107,0.12)',  // Legacy Gold – faint dividers, ghost borders (19×)
  border:         'rgba(200,169,107,0.22)',  // Legacy Gold – main border, cards/inputs     (62×)
  borderStrong:   'rgba(182,139,58,0.4)',    // Rich Gold – focus/active border             (22×)

  // ── Scrim / overlay ──────────────────────────────────────────────────────────
  overlay:        'rgba(0,0,0,0.55)',        // dark scrim over images/content              (13×)
  bgDisabled:     'rgba(10,9,0,0.5)',        // disabled CTA text/icon – edit-post.tsx

  // ── State ────────────────────────────────────────────────────────────────────
  error:          '#ef4444',
  success:        '#10b981',
  warning:        '#f59e0b',
  successBg:      'rgba(16,185,129,0.15)',
  warningBg:      'rgba(245,158,11,0.15)',
  errorBg:        'rgba(239,68,68,0.15)',
  successBorder:  'rgba(200,169,107,0.4)',
  errorBorder:    'rgba(200,169,107,0.35)',

} as const;

// ─── LIGHT set (Batch 92 mapping) ─────────────────────────────────────────────
// Design decisions documented per token:
// • whiteOverlay* → darkOverlay*: on light bg, "subtle layer" = dark overlay at same
//   opacity. Same visual role, different direction. Named keys preserved for compat.
// • overlay scrim: kept dark (rgba(0,0,0,0.55)) — modal scrims are dark in both modes.
// • playIconColor: kept white — it renders over colorful video thumbnails, not app bg.
// • gold: switched to Rich Gold #B68B3A — Legacy Gold #C8A96B lacks contrast on ivory.
// • successBg/warningBg/errorBg: opacity 0.12 (vs 0.15 dark) — semaphore bg chips
//   need slightly lower saturation to avoid over-punching on bright surfaces.
// • successBorder/errorBorder: base changed to Rich Gold (182,139,58), same opacities.
// • bgDisabled: ivory-hue equivalent at 0.5, matching dark's bg-hue color.
export const lightColors = {

  // ── Surfaces ─────────────────────────────────────────────────────────────────
  background:     '#F5F1E8',  // Soft Ivory – main screen bg (light equivalent of Legacy Black)
  surface:        '#FFFFFF',  // Pure white – cards, sheets, modals
  surfaceAlt:     '#F0EDE6',  // Warm off-white – alternate card bg (between bg and white)
  surfacePanel:   '#FFF8E8',  // Warm light beige – quiz option resting bg (preserving warm tint)
  surfaceDeep:    '#FFF3D6',  // Warmer beige – quiz explanation box bg (deeper warm)
  errorSurface:   '#FFF0F0',  // Very light pink – destructive action button bg

  // ── Brand gold ───────────────────────────────────────────────────────────────
  gold:           '#B68B3A',  // Rich Gold – CRITICAL: darker than Legacy Gold for contrast on ivory
  goldStrong:     'rgba(182,139,58,0.85)',  // Rich Gold – same base as dark (already Rich)
  goldMid:        'rgba(182,139,58,0.7)',   // Rich Gold – same as dark

  // ── Text ─────────────────────────────────────────────────────────────────────
  textPrimary:    '#1E1E1E',                    // Deep Charcoal – headings, main labels
  textSecondary:  'rgba(30,30,30,0.6)',          // Deep Charcoal – same opacity as dark
  textMuted:      'rgba(30,30,30,0.55)',         // Deep Charcoal – same opacity as dark
  textTertiary:   'rgba(30,30,30,0.4)',          // Deep Charcoal – same opacity as dark
  textFaint:      'rgba(30,30,30,0.3)',          // Deep Charcoal – same opacity as dark
  textPlaceholder: 'rgba(30,30,30,0.22)',        // Deep Charcoal – same opacity as dark

  // ── Dark overlays (flipped from white overlays in dark mode) ─────────────────
  // On a light bg, a "subtle layer" is a dark (black) overlay at the same opacity.
  // The token names are preserved so existing usages get the equivalent visual role.
  whiteOverlay20: 'rgba(0,0,0,0.2)',    // dark overlay – grab handle bg (same role, flipped)
  whiteOverlay10: 'rgba(0,0,0,0.1)',    // dark overlay – tab strips, tracks
  whiteOverlay4:  'rgba(0,0,0,0.04)',   // dark overlay – input field bg ghost tint
  playIconColor:  'rgba(255,255,255,0.9)',   // kept white – over video thumbnails (not app bg)

  // ── Gold borders ─────────────────────────────────────────────────────────────
  borderSubtle:   'rgba(182,139,58,0.12)',  // Rich Gold on light – same opacity as dark
  border:         'rgba(182,139,58,0.22)',  // Rich Gold on light – same opacity as dark
  borderStrong:   'rgba(182,139,58,0.4)',   // Rich Gold – same as dark

  // ── Scrim / overlay ──────────────────────────────────────────────────────────
  overlay:        'rgba(0,0,0,0.55)',       // dark scrim – works in both modes (kept same)
  bgDisabled:     'rgba(245,241,232,0.5)', // ivory-hue disabled – light-mode equivalent of dark's bg-hue

  // ── State ────────────────────────────────────────────────────────────────────
  error:          '#ef4444',  // universal semaphore – unchanged
  success:        '#10b981',  // universal semaphore – unchanged
  warning:        '#f59e0b',  // universal semaphore – unchanged
  successBg:      'rgba(16,185,129,0.12)',  // 0.12 vs 0.15: lighter on bright surfaces
  warningBg:      'rgba(245,158,11,0.12)',  // 0.12 vs 0.15: lighter on bright surfaces
  errorBg:        'rgba(239,68,68,0.12)',   // 0.12 vs 0.15: lighter on bright surfaces
  successBorder:  'rgba(182,139,58,0.4)',   // Rich Gold on light (was Legacy Gold in dark)
  errorBorder:    'rgba(182,139,58,0.35)',  // Rich Gold on light (was Legacy Gold in dark)

} as const;

// ─── Backwards-compat static export ──────────────────────────────────────────
// Screens not yet migrated to useColors() import Colors directly.
// It always returns the dark set — those screens won't react to theme changes
// until they replace `Colors` with `const colors = useColors()`.
export const Colors = darkColors;

export type ColorToken = keyof typeof darkColors;
