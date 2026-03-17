# Responsive Validation Checklist

## Device Breakpoint Matrix

| Breakpoint | Width | Target Device | Columns | Sidebar |
|------------|-------|---------------|---------|---------|
| xs | < 475px | Small phones | 1 | Hidden (slide-in) |
| sm | 475-639px | iPhone SE, large phones | 1-2 | Hidden (slide-in) |
| md | 640-767px | Small tablets | 2 | Hidden (slide-in) |
| lg | 768-1023px | iPad, tablets | 2-3 | Collapsible |
| xl | 1024-1279px | Small desktop | 3-4 | Visible |
| 2xl | 1280px+ | Desktop, wide monitors | 4+ | Visible |

---

## Mobile (375px - iPhone SE)

### Layout
- [ ] No horizontal scroll on any page
- [ ] Body `overflow-x: hidden` active
- [ ] Content respects safe area insets (`env(safe-area-inset-*)`)
- [ ] Dynamic viewport height (`100dvh`) used for full-height layouts

### Touch Targets
- [ ] All buttons minimum 44x44px (`min-touch-target` class)
- [ ] Pagination buttons 40x40px minimum
- [ ] Sidebar navigation items have adequate tap area (py-2.5)
- [ ] Close buttons on dialogs are 32x32px minimum
- [ ] Notification items have adequate tap area

### Typography
- [ ] Base font size 16px (prevents iOS zoom on input focus)
- [ ] Body line-height 1.6 for comfortable reading
- [ ] Minimum text size 12px (xs Tailwind class = 0.75rem)
- [ ] Search input text: 12px mobile, 14px desktop

### Components
- [ ] AppHeader: search input full-width with proper padding
- [ ] AppHeader: height 56px (h-14) on mobile
- [ ] AppSidebar: slides in from left, max-width `min(80vw, 280px)`
- [ ] AppSidebar: overlay with backdrop when open
- [ ] KPI cards: 2-column grid, readable values
- [ ] DataTable: horizontal scroll with smooth momentum (`-webkit-overflow-scrolling: touch`)
- [ ] Dialog: width `min(90vw, 512px)`, max-height `min(90dvh, 90vh)`

### Performance
- [ ] Backdrop-filter reduced to `blur(12px)` on mobile
- [ ] `scroll-behavior: auto` (no smooth scroll on mobile)
- [ ] `will-change: transform` on animated touch targets
- [ ] `-webkit-tap-highlight-color: transparent` on body

---

## Tablet (768px - iPad)

### Layout
- [ ] Sidebar collapses to icon-only mode (w-16)
- [ ] Content area takes remaining width
- [ ] Grids display 2-3 columns

### Components
- [ ] AppHeader: height 64px (h-16)
- [ ] AppHeader: search width 224px (w-56)
- [ ] DataTable: full-width tables within card containers
- [ ] Dialog: proper centering with scroll for long content

### Spacing
- [ ] Card padding transitions from p-3 to p-4/p-6
- [ ] Gap sizes appropriate (gap-3 to gap-4)
- [ ] Body line-height transitions to 1.5

---

## Desktop (1920px)

### Layout
- [ ] Full-width layouts with sidebar visible (w-60)
- [ ] Content uses available width without excessive whitespace
- [ ] Background gradient visible through glass panels

### Visual
- [ ] Decorative orbs visible and properly positioned
- [ ] Glass blur effects at full intensity (blur-28px sidebar, blur-24px header)
- [ ] Neon accent glows visible on interactive elements
- [ ] Hover states active (`hover: hover` media query)

### Spacing
- [ ] Spacing proportional, not excessive
- [ ] Search input width 320px (w-80)
- [ ] Card padding at full values (p-6)

---

## Accessibility Verification

### Focus Indicators
- [ ] `focus-visible` outline: 2px solid ring color with 2px offset
- [ ] Mouse/touch focus does NOT show outline (`:focus:not(:focus-visible)`)
- [ ] All interactive elements reachable via Tab key

### ARIA Labels
- [ ] Search input: `aria-label="Buscar no sistema"`
- [ ] Sidebar toggle: `aria-label="Abrir menu"`
- [ ] Notifications bell: `aria-label="Notificações (N alertas)"`
- [ ] User menu: `aria-label="Menu do usuário"`
- [ ] Sidebar collapse: `aria-label="Expandir/Recolher menu lateral"`
- [ ] Collapsible sections: `aria-expanded` attribute present
- [ ] Pagination: `aria-label="Página anterior"` / `"Próxima página"`
- [ ] Sort columns: `aria-sort="ascending"` / `"descending"`
- [ ] Page counter: `aria-live="polite"` for screen reader updates

### Keyboard Navigation
- [ ] Tab order follows visual layout
- [ ] Dialog close button has `sr-only` text "Fechar"
- [ ] Escape key closes dialogs (Radix built-in)
- [ ] Focus trapped inside open dialogs (Radix built-in)

### Reduced Motion
- [ ] `prefers-reduced-motion: reduce` disables animations
- [ ] Transition durations set to 0.01ms when reduced motion preferred
- [ ] Scroll behavior set to auto when reduced motion preferred

---

## Color Contrast Validation

| Element | Foreground | Background | Target Ratio |
|---------|-----------|------------|-------------|
| Body text | hsl(210 10% 93%) | Dark gradient | >= 4.5:1 |
| Muted text | hsl(210 15% 58%) | Dark gradient | >= 3:1 (large text) |
| Primary accent | #00ff88 | Dark gradient | >= 4.5:1 |
| Destructive | hsl(340 100% 45%) | Dark gradient | >= 3:1 |
| Warning | #ffd700 | Dark gradient | >= 3:1 |

---

## Performance Metrics Targets

| Metric | Target | Notes |
|--------|--------|-------|
| FCP (First Contentful Paint) | < 1.5s | Font preload via display=swap |
| LCP (Largest Contentful Paint) | < 2.5s | Glass panels render quickly |
| CLS (Cumulative Layout Shift) | < 0.1 | Sticky header, fixed sidebar |
| TBT (Total Blocking Time) | < 200ms | Minimal JS on critical path |
| Backdrop-filter FPS (mobile) | >= 30fps | Reduced blur on mobile |

---

## Safe Area Verification (Notch Devices)

- [ ] `viewport-fit=cover` in meta tag
- [ ] `--safe-area-inset-top` applied to header (`pt-safe`)
- [ ] `--safe-area-inset-bottom` applied to sidebar/footer (`pb-safe`)
- [ ] Content does not overlap with device notch or home indicator

---

## Print Styles

- [ ] Body background changes to white
- [ ] Sidebar and header hidden
- [ ] Glass cards get white background with 1px border
- [ ] Links show href in parentheses
- [ ] Cards use `break-inside: avoid`
