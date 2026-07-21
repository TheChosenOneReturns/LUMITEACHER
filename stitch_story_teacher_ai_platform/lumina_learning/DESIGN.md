---
name: Lumina Learning
colors:
  surface: '#f6fafe'
  surface-dim: '#d7dadf'
  surface-bright: '#f6fafe'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f1f4f8'
  surface-container: '#ebeef3'
  surface-container-high: '#e5e8ed'
  surface-container-highest: '#dfe3e7'
  on-surface: '#181c1f'
  on-surface-variant: '#3f484f'
  inverse-surface: '#2d3134'
  inverse-on-surface: '#eef1f5'
  outline: '#6f7880'
  outline-variant: '#bec8d0'
  surface-tint: '#00658e'
  primary: '#00658e'
  on-primary: '#ffffff'
  primary-container: '#6cc8ff'
  on-primary-container: '#005375'
  inverse-primary: '#84cfff'
  secondary: '#705d00'
  on-secondary: '#ffffff'
  secondary-container: '#fdd73b'
  on-secondary-container: '#715d00'
  tertiary: '#246d00'
  on-tertiary: '#ffffff'
  tertiary-container: '#79d453'
  on-tertiary-container: '#1c5900'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#c7e7ff'
  primary-fixed-dim: '#84cfff'
  on-primary-fixed: '#001e2e'
  on-primary-fixed-variant: '#004c6c'
  secondary-fixed: '#ffe173'
  secondary-fixed-dim: '#e8c426'
  on-secondary-fixed: '#221b00'
  on-secondary-fixed-variant: '#554500'
  tertiary-fixed: '#9cf973'
  tertiary-fixed-dim: '#81dc5a'
  on-tertiary-fixed: '#062100'
  on-tertiary-fixed-variant: '#195200'
  background: '#f6fafe'
  on-background: '#181c1f'
  surface-variant: '#dfe3e7'
typography:
  display-lg:
    fontFamily: Nunito Sans
    fontSize: 48px
    fontWeight: '900'
    lineHeight: 56px
    letterSpacing: -0.02em
  display-mobile:
    fontFamily: Nunito Sans
    fontSize: 32px
    fontWeight: '900'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg:
    fontFamily: Nunito Sans
    fontSize: 32px
    fontWeight: '800'
    lineHeight: 40px
  headline-md:
    fontFamily: Nunito Sans
    fontSize: 24px
    fontWeight: '800'
    lineHeight: 32px
  body-lg:
    fontFamily: Nunito Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 30px
  body-md:
    fontFamily: Nunito Sans
    fontSize: 18px
    fontWeight: '500'
    lineHeight: 28px
  label-bold:
    fontFamily: Nunito Sans
    fontSize: 16px
    fontWeight: '800'
    lineHeight: 20px
  caption:
    fontFamily: Nunito Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 12px
  md: 24px
  lg: 40px
  xl: 64px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 48px
---

## Brand & Style

The design system is engineered to evoke a sense of wonder, safety, and boundless curiosity for learners aged 6-12. The brand personality is "The Encouraging Mentor"—vibrant and energetic like a Saturday morning cartoon, yet structured and reliable like a premium educational institution.

The design style is **Modern Playful Tactility**. It blends the clean, functional layouts of modern SaaS with the expressive, bouncy energy of gamified learning platforms. We utilize high-contrast accents, "squishy" physical metaphors, and friendly, oversized geometry to create a UI that feels less like a textbook and more like a digital playground. Every interaction should feel rewarding, tactile, and intentionally designed for smaller hands and developing motor skills.

## Colors

The palette is rooted in high-chroma, optimistic hues that signify different learning "zones" or content types. 

- **Sky Blue (Primary):** Used for main navigation, core actions, and the overall "brand" presence.
- **Yellow & Green (Secondary/Tertiary):** Reserved for rewards, success states, and high-energy callouts.
- **Support Accents (Orange, Pink, Violet):** Used to categorize subjects (e.g., Pink for Reading, Violet for Logic) to aid in non-textual navigation.
- **Background:** A very light, crisp blue (#F8FCFF). It should be layered with subtle, low-opacity SVG patterns of clouds, stars, or geometric doodles (opacity 3-5%) to prevent the screen from feeling clinical.
- **Neutral Dark:** We avoid pure black (#000) to keep the contrast friendly. Use #2D3436 for all text and thick borders to maintain high legibility.

## Typography

This design system uses **Nunito Sans** for its exceptional legibility and friendly, rounded terminals. The font choice mirrors the handwriting taught in schools while maintaining a professional digital feel.

- **Weight Strategy:** Headlines use ExtraBold (800) or Black (900) to create a clear hierarchy and a "bouncy" feel. Body text stays at SemiBold (600) to ensure readability against colorful backgrounds.
- **Accessibility:** Minimum font size for core content is 18px. For young readers, line height is kept generous (1.5x) to prevent tracking errors.
- **Case:** Use Sentence case for instructions and UPPERCASE for short, impactful labels or buttons to emphasize "action."

## Layout & Spacing

The layout follows a **Fluid-Responsive Grid** with significantly larger margins and gutters than standard enterprise apps. This "breathing room" reduces cognitive load for children.

- **Desktop:** 12-column grid, max-width 1280px. Use large 40px - 64px vertical spacing between sections to clearly separate learning activities.
- **Mobile:** 4-column grid. Full-width cards are preferred to provide a large "tap target" area.
- **Rhythm:** All spacing must be multiples of 8px. Use `lg` (40px) for container padding to ensure elements don't feel cramped.

## Elevation & Depth

This design system eschews flat design in favor of **Layered Tactility**. Depth is used to communicate "press-ability."

- **The "Lift" Shadow:** Cards and buttons use large, slightly offset shadows with low blur and high spread. The shadow color is not gray, but a darker, more saturated version of the background or element color (e.g., a Blue button gets a Dark Blue shadow).
- **Thick Borders:** Every primary container uses a 2px or 3px solid border (Neutral Dark or a darker shade of the element’s color). This creates a "sticker" or "comic book" aesthetic.
- **Active States:** When pressed, elements should shift 4px down (and their shadow should shrink), simulating a physical button being pushed into the screen.

## Shapes

The shape language is dominated by **Hyper-Rounded Geometry**. There are no sharp corners in this design system.

- **Standard Elements:** Use `rounded-lg` (16px) for cards and smaller containers.
- **Interactive Elements:** Buttons and Input fields use `rounded-xl` (24px) or full pill-shaping to emphasize comfort and safety.
- **Softness:** The goal is to make the UI feel "squishy." Even progress bars and selection indicators should have fully rounded caps.

## Components

### Buttons
Buttons are oversized (min-height 56px). They feature a "3D" effect: a solid bottom-border (4px) that acts as a physical base. On hover, the button jitters slightly; on press, it sinks to hide the bottom border.

### Cards
Cards are the primary content vessel. They use white backgrounds with a 2px border in a "Theme Color" (e.g., Sky Blue). They feature a large, soft shadow (0px 8px 0px) of the same color but at 20% opacity.

### Progress Bars
Oversized and "juicy." The track is a soft version of the color, and the fill is a vibrant gradient (e.g., Light Green to Dark Green) with a glossy white "shine" highlight on top to make it look like liquid or candy.

### Input Fields
Inputs use a thick 2px border. When focused, the border color changes to Primary Blue and the entire field scales up by 2% to indicate it's ready for text.

### Badges & Stars
Gamified elements should use the "Yellow" tertiary color with a slight outer glow. Stars should be chunky with rounded points, appearing as if they are physical tokens the student can collect.

### Selection States
Radio buttons and checkboxes are replaced by "Big Tiles." Selecting an option adds a thick 4px inner border and a "Checkmark" badge in the top-right corner.