# DermiAI design handoff

`screens/` holds the source of every artboard (HTML with inline styles + a small logic class).
Treat them as the visual spec — copy exact colours, sizes, spacing and copy from them.

## Screen map
| File | Screen |
|---|---|
| Main | Landing |
| Onboarding | Skin profile, 5 steps |
| Dashboard / DashboardEmpty / DashboardMobile | Dashboard, empty state, mobile |
| Consultation | Core consultation — `variant`: default, camera, analyzing, closing, redflag |
| ConsultMobile | Consultation, mobile |
| CaseDetail | Timeline + printable report |
| Reminders | List + create form |
| IngredientCheck | Label scan result |
| Dermi | Mascot SVG — props `size`, `mood` (happy/thinking/concerned), `body` |
| Sidebar | App nav — prop `active` |
| Components | Tokens & building blocks |
| Consult*.dc.html (Camera, Analyzing, Closing, RedFlag) | Thin wrappers that just set the Consultation variant |

## Tokens (Tailwind `theme.extend`)
```js
colors: {
  merino: '#F5EEDD',   // page ground
  paper:  '#FBF7EC',   // cards, sidebar
  line:   '#D8D2C0',   // hairlines
  rock:   { DEFAULT: '#84B3CE', tint: '#D5E5EE' }, // fills, Dermi — never text
  venice: '#16587B',   // headings, primary buttons, strong rules
  ink:    '#0F3D56',   // body text
  muted:  '#4D6878',   // secondary text
  hatch:  { line: '#D9CFB6', bg: '#EFE6D1' }, // photo placeholders
  alert:  { DEFAULT: '#A8492F', tint: '#F3DDD2', border: '#E3B9A7', text: '#8C3A24', deep: '#6E2B19' }, // red flags only
},
fontFamily: {
  display: ['Ortica', 'Newsreader', 'Georgia', 'serif'], // weight 300, tracking -0.02 to -0.035em
  label:   ['Fustat', 'system-ui', 'sans-serif'],        // 500, uppercase, tracking 0.1em, 11–14px
  body:    ['Poppins', 'system-ui', 'sans-serif'],       // 300 (400 for small/emphasis)
},
borderRadius: { tag: '4px', btn: '8px', card: '10px' },
```
No drop shadows. Bubbles: Dermi `4px 14px 14px 14px` on merino/paper; user `14px 4px 14px 14px` on rock-tint.
Photo placeholder: `repeating-linear-gradient(-45deg, #D9CFB6 0 1px, #EFE6D1 1px 7px)`.
Highlighter mark (ingredient clash): `background:#EFC3B1; border-radius:255px 15px 225px 15px / 15px 225px 15px 255px; rotate ±1deg`.

## Fonts
Fustat, Poppins and Newsreader are on Google Fonts. Ortica (Collletttivo) must be self-hosted — add an `@font-face` for `Ortica` weight 300 and it overrides Newsreader automatically.

## Rules
- No generic icon sets. Use words + arrows (→ ↓ + ×), numbered labels (01, 02…), the hand-drawn tick and wobbly face paths in the source.
- Coral/alert colours only for red flags and clashing ingredients.
- Dermi never ends a consultation — closing state always asks "Are you satisfied with your care?" (Yes / Not yet).
- Touch targets ≥ 44px; text contrast ≥ 4.5:1 (Rock Blue is never a text colour).
