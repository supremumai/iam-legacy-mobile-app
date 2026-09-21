// ─── Color Tokens ─────────────────────────────────────────────────────────────
// Names describe semantic ROLE, not raw values.
// Current palette values are noted in comments — change here to repaint the app.
// This file is the foundation; inline replacements happen in subsequent batches.
// ──────────────────────────────────────────────────────────────────────────────

export const Colors = {

  // ── Surfaces ────────────────────────────────────────────────────────────────
  // Screen backgrounds and card/sheet elevations.
  background:     '#0a0900',  // deepest black — main screen bg              (99×)
  surface:        '#1c1a14',  // charcoal — cards, bottom sheets, modals     (54×)
  surfaceAlt:     '#111008',  // mid-dark — alternate card bg                ( 9×)
  surfaceDeep:    '#181510',  // between background and surface              ( 1×)
  surfaceDark:    '#110f09',  // near-background dark variant                ( 1×)

  // ── Brand / Gold ────────────────────────────────────────────────────────────
  // Primary brand accent. All gold shades live here.
  gold:           '#c9a84c',  // primary gold — icons, CTAs, highlights     (157×)
  goldAlt:        '#c5a454',  // alternate gold — slight hue shift            ( 6×)
  goldWarm:       '#c98a4c',  // warmer-toned gold variant                    ( 1×)
  goldBright:     '#e8c060',  // brighter gold — elevated highlights          ( 2×)
  goldLight:      '#f5d070',  // lightest gold — subtle accents               ( 1×)

  // ── Text ────────────────────────────────────────────────────────────────────
  // All foreground text colors, from full-white down to near-invisible.
  textPrimary:    '#ffffff',                 // white — headings, main labels (114×)
  textMuted:      'rgba(255,255,255,0.55)',  // muted — body / secondary text  (64×)
  textSecondary:  'rgba(255,255,255,0.6)',   // secondary labels               (10×)
  textHalf:       'rgba(255,255,255,0.5)',   // half-opacity labels             ( 7×)
  textTertiary:   'rgba(255,255,255,0.4)',   // tertiary / placeholder text    (16×)
  textTertiary45: 'rgba(255,255,255,0.45)', // tertiary variant                (12×)
  textSubtle:     'rgba(255,255,255,0.35)',  // subtle — captions, metadata    (12×)
  textFaint:      'rgba(255,255,255,0.3)',   // faint — timestamps, disabled    ( 9×)
  textFaint65:    'rgba(255,255,255,0.65)', // near-secondary                   ( 2×)
  textFaint25:    'rgba(255,255,255,0.25)', // very faint                       ( 1×)
  textFaint20:    'rgba(255,255,255,0.2)',   // barely visible                  ( 2×)
  textFaint15:    'rgba(255,255,255,0.15)', // barely visible                   ( 2×)
  textFaint70:    'rgba(255,255,255,0.7)',   // near-primary dimmed             ( 1×)
  textFaint75:    'rgba(255,255,255,0.75)', // near-primary                     ( 1×)
  textFaint80:    'rgba(255,255,255,0.8)',   // near-white                      ( 1×)
  textFaint90:    'rgba(255,255,255,0.9)',   // almost white                    ( 1×)

  // ── White overlays (ultra-low opacity — fills and tint backgrounds) ─────────
  whiteOverlay10: 'rgba(255,255,255,0.1)',   // very subtle tint               ( 6×)
  whiteOverlay8:  'rgba(255,255,255,0.08)',  // near-transparent tint          ( 1×)
  whiteOverlay6:  'rgba(255,255,255,0.06)',  // hairline tint                  ( 1×)
  whiteOverlay4:  'rgba(255,255,255,0.04)',  // ghost tint                     ( 4×)

  // ── Borders (gold-based) ────────────────────────────────────────────────────
  // Dividers, card outlines, and focus rings keyed to the gold palette.
  border:         'rgba(201,168,76,0.22)',   // main border — cards, inputs    (62×)
  borderFaint8:   'rgba(201,168,76,0.08)',   // barely-there divider           ( 8×)
  borderFaint12:  'rgba(201,168,76,0.12)',   // subtle divider                 (11×)
  borderFaint18:  'rgba(201,168,76,0.18)',   // light border                   ( 2×)
  borderMedium:   'rgba(201,168,76,0.3)',    // medium border                  ( 8×)
  borderMedium35: 'rgba(201,168,76,0.35)',   // medium+ border                 ( 6×)
  borderStrong:   'rgba(201,168,76,0.4)',    // strong border                  ( 4×)
  borderStrong45: 'rgba(201,168,76,0.45)',   // stronger border                ( 2×)
  borderStrong50: 'rgba(201,168,76,0.5)',    // half-opacity border            ( 2×)
  borderStrong60: 'rgba(201,168,76,0.6)',    // prominent border               ( 1×)

  // ── Borders (goldAlt-based — rgba of #c5a454) ───────────────────────────────
  borderAlt12:    'rgba(197,164,84,0.12)',   // alternate gold, faint          ( 1×)
  borderAlt22:    'rgba(197,164,84,0.22)',   // alternate gold border          ( 1×)
  borderAlt25:    'rgba(197,164,84,0.25)',   // alternate gold border          ( 1×)
  borderAlt40:    'rgba(197,164,84,0.4)',    // alternate gold, strong         ( 2×)

  // ── Overlays (background-based — rgba of background or pure black) ──────────
  overlay:        'rgba(10,9,0,0.5)',        // scrim over content             ( 5×)
  overlayLight:   'rgba(10,9,0,0.45)',       // lighter scrim                  ( 1×)
  overlayBlack50: 'rgba(0,0,0,0.5)',         // pure-black overlay             ( 2×)
  overlayBlack52: 'rgba(0,0,0,0.52)',        // pure-black overlay variant     ( 1×)
  overlayBlack55: 'rgba(0,0,0,0.55)',        // dark overlay                   ( 3×)
  overlayBlack60: 'rgba(0,0,0,0.6)',         // darker overlay                 ( 1×)

  // ── State ───────────────────────────────────────────────────────────────────
  error:          '#ef4444',  // red — validation errors, destructive actions (17×)
  errorSoft:      '#e05c5c',  // softer red — mild error states               ( 2×)
  success:        '#10b981',  // emerald — success, completed states           ( 6×)
  successAlt:     '#16a34a',  // darker green — alternate success              ( 2×)
  successSoft:    '#5fa564',  // muted green — soft success                   ( 1×)
  warning:        '#f59e0b',  // amber — warnings, pending states              ( 5×)
  accent:         '#6366f1',  // indigo — accent, special highlights           ( 2×)
  info:           '#1d4ed8',  // blue — informational                          ( 1×)

  // ── State tint backgrounds (rgba of state colors) ───────────────────────────
  successBg12:    'rgba(16,185,129,0.12)',   // success tinted background      ( 1×)
  successBg15:    'rgba(16,185,129,0.15)',   // success tinted background      ( 2×)
  warningBg15:    'rgba(245,158,11,0.15)',   // warning tinted background      ( 2×)
  accentBg15:     'rgba(99,102,241,0.15)',   // accent tinted background       ( 1×)

  // ── Misc ────────────────────────────────────────────────────────────────────
  cream:          '#e8e0cc',  // warm cream — special decorative elements      ( 2×)
  successLight:   '#dcfce7',  // light green — badge/chip backgrounds          ( 1×)
  blueLight:      '#dbeafe',  // light blue — badge/chip backgrounds           ( 1×)

} as const;

export type ColorToken = keyof typeof Colors;
