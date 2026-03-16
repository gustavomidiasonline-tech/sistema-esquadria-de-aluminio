# Glass Morphism - Quick Start 🚀

Guia rápido para usar glass morphism no seu projeto.

## 📦 Componentes Disponíveis

### GlassCard

```tsx
import { GlassCard } from '@/components/ui/glass-card';

// Premium card (padrão)
<GlassCard>Content</GlassCard>

// Com accent neon
<GlassCard variant="premium" neonAccent={true}>
  Bordered com verde neon
</GlassCard>

// Stat card
<GlassCard variant="stat">
  Métrica com background gradiente
</GlassCard>

// Panel (mais opaco)
<GlassCard variant="panel">
  Sidebar ou overlay
</GlassCard>

// Input field
<GlassCard variant="input">
  <input type="text" placeholder="..." />
</GlassCard>
```

### GlassButton

```tsx
import { GlassButton } from '@/components/ui/glass-button';

// Primary (verde neon com glow)
<GlassButton variant="primary">Click</GlassButton>

// Secondary (glass com border neon)
<GlassButton variant="secondary">Secondary</GlassButton>

// Ghost (transparente)
<GlassButton variant="ghost">Ghost</GlassButton>

// Com tamanho
<GlassButton variant="primary" size="lg">Large</GlassButton>
<GlassButton variant="primary" size="sm">Small</GlassButton>
```

## 🎨 Classes Tailwind Diretas

```tsx
// Cards
<div className="glass-card-premium">Card Premium</div>
<div className="glass-panel">Panel</div>
<div className="glass-stat-card">Stat Card</div>

// Buttons
<button className="glass-button-primary">Primary</button>
<button className="glass-button-secondary">Secondary</button>

// Inputs
<input className="glass-input-field" />

// Badges
<span className="glass-badge-neon">✓ Badge</span>

// Dividers
<div className="glass-divider"></div>

// Progress
<div className="glass-progress-bar">
  <div style={{ width: '75%' }}></div>
</div>

// Glow
<div className="glass-glow-accent">Glow</div>
```

## 🌈 Cores Neon

```tsx
// Direto em Tailwind
<div className="text-green-400">Neon Green (#00FF88)</div>
<div className="text-yellow-300">Neon Yellow (#FFD700)</div>
<div className="text-cyan-400">Neon Cyan (#00D9FF)</div>
<div className="text-pink-600">Neon Pink (#FF006E)</div>

// Com CSS variables
<div style={{
  color: 'var(--glass-neon-green)',
  boxShadow: '0 0 12px rgba(0, 255, 136, 0.4)'
}}>
  Neon text com glow
</div>
```

## 🎬 Animações

```tsx
// Pulse (fade in/out)
<div className="animate-pulse">Pulsing element</div>

// Glow pulse (custom - em glass-morphism-tokens.css)
<div style={{
  animation: 'glow-pulse 2s ease-in-out infinite'
}}>
  Glow pulsing
</div>

// Shimmer
<div style={{
  animation: 'shimmer 2s infinite'
}}>
  Shimmer effect
</div>
```

## 🎯 Layout Patterns

### Hero com Gradient Background

```tsx
<div
  className="min-h-screen flex items-center justify-center"
  style={{
    backgroundImage: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 25%, #2d1b69 50%, #3d0f4a 75%, #4a0e4e 100%)',
  }}
>
  <div className="text-center">
    <h1 className="text-4xl font-bold text-white">
      Glass Morphism
    </h1>
  </div>
</div>
```

### Card Grid

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  <GlassCard variant="premium">Card 1</GlassCard>
  <GlassCard variant="premium">Card 2</GlassCard>
  <GlassCard variant="premium">Card 3</GlassCard>
</div>
```

### Form Glass

```tsx
<form className="space-y-4 max-w-md">
  <input
    type="email"
    placeholder="Email"
    className="glass-input-field w-full"
  />
  <input
    type="password"
    placeholder="Password"
    className="glass-input-field w-full"
  />
  <GlassButton variant="primary" className="w-full">
    Sign In
  </GlassButton>
</form>
```

## 🌙 Dark Mode

Glass morphism já é otimizado para dark mode:

```tsx
// Automático com next-themes
<html className="dark">
  {/* Glass effects automatically adjust */}
</html>
```

## 📱 Responsivo

Classes glass já têm media queries:

```css
@media (max-width: 768px) {
  .glass-card-premium {
    @apply p-3; /* Reduz padding em mobile */
  }
}
```

## ⚡ Performance Tips

```tsx
// ✅ BOM - GPU accelerated
<div className="hover:translate-y-[-2px] transition-all">
  Hover me
</div>

// ❌ RUIM - Causes layout shift
<div className="hover:top-[-2px]">
  Don't hover
</div>

// ✅ BOM - Will-change
<div style={{ willChange: 'transform' }}>
  High-performance
</div>

// ❌ RUIM - Overused will-change
<div className="will-change-all">
  Don't overuse
</div>
```

## 🎨 Customizar Cores

Edite `src/styles/glass-morphism-tokens.css`:

```css
/* Mudar neon green */
--glass-neon-green: #00ff88; /* Mude para outra cor */

/* Mudar blur strength */
--glass-blur-md: blur(16px); /* Aumente/diminua */

/* Mudar shadow intensity */
--glass-shadow-md: 0 8px 32px rgba(0, 0, 0, 0.15);
```

Depois atualize `src/index.css` `:root`:

```css
--glass-neon-green: #00ff88;
```

## 🧪 Ver em Ação

Acesse a página de showcase:

```
http://localhost:5173/glass-showcase
```

## 📚 Documentação Completa

Para mais detalhes, veja:
- `docs/GLASS_MORPHISM_GUIDE.md` - Documentação completa
- `src/styles/glass-morphism-tokens.css` - Todas as classes
- `src/pages/GlassDesignShowcase.tsx` - Exemplos de código

## 🚀 Integrar em Componente Existente

### Antes (Card padrão)

```tsx
import { Card, CardHeader } from '@/components/ui/card';

<Card>
  <CardHeader>Title</CardHeader>
</Card>
```

### Depois (Glass Card)

```tsx
import { GlassCard } from '@/components/ui/glass-card';

<GlassCard variant="premium">
  <h2 className="text-white">Title</h2>
</GlassCard>
```

## ❓ Troubleshoot

| Problema | Solução |
|----------|---------|
| Blur não funciona | Verifique browser (Chrome 76+) |
| Cor neon fraca | Aumente saturação em `glass-morphism-tokens.css` |
| Performance lenta | Reduza número de glass elements com backdrop-filter |
| Mobile ruim | Verifique media queries em `glass-morphism-tokens.css` |

---

**Happy designing! 🎨✨**
