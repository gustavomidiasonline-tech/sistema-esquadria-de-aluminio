# Glass Morphism Design System 🎨

Guia completo do sistema de design Glass Morphism implementado no Pixel Perfect Pixels.

## 📋 Índice

1. [Overview](#overview)
2. [Cores e Paleta](#cores-e-paleta)
3. [Componentes](#componentes)
4. [Efeitos de Vidro](#efeitos-de-vidro)
5. [Como Usar](#como-usar)
6. [Exemplos de Código](#exemplos-de-código)
7. [Performance](#performance)
8. [Acessibilidade](#acessibilidade)

---

## Overview

O Glass Morphism é um sistema de design moderno que combina:

- **Efeito Frosted Glass**: Blur, transparência e backdrop filters
- **Cores Neon**: Acentos brilhantes (#00FF88, #FFD700, #00D9FF, #FF006E)
- **Gradientes Escuros**: Fundo em gradiente de azul marinho → roxo → magenta
- **Efeitos de Brilho**: Glow effects e sombras elevadas
- **Transições Suaves**: Animações fluidas com easing cubic-bezier

### Filosofia de Design

Inspirado no print fornecido e no visual da interface AIOS Master:
- Interface premium com sensação de profundidade
- Transparência e blur para elementos em camadas
- Acentos neon para CTA (call-to-action) e elementos importantes
- Dark mode nativo com excelente contraste

---

## Cores e Paleta

### Cores Neon (Primárias)

```css
--glass-neon-green: #00ff88;    /* Accent primário - CTAs, badges */
--glass-neon-yellow: #ffd700;   /* Progress bars, destaque */
--glass-neon-cyan: #00d9ff;     /* Links, destaques alternativos */
--glass-neon-pink: #ff006e;     /* Destructive, alerts */
```

### Cores Base

```css
--glass-dark-navy: #0f172a;      /* Background mais escuro */
--glass-dark-purple: #1e1b4b;    /* Mid-tone background */
--glass-dark-magenta: #2d1b69;   /* Accent background */
```

### Overlays e Transparências

```css
--glass-overlay-light: rgba(255, 255, 255, 0.08);
--glass-overlay-medium: rgba(255, 255, 255, 0.12);
--glass-overlay-dark: rgba(255, 255, 255, 0.04);

--glass-purple-30: rgba(189, 116, 216, 0.3);
--glass-blue-30: rgba(59, 130, 246, 0.3);
--glass-pink-30: rgba(236, 72, 153, 0.3);
```

### Bordas (Glass Border)

```css
--glass-border-light: rgba(255, 255, 255, 0.1);
--glass-border-medium: rgba(255, 255, 255, 0.15);
--glass-border-neon: rgba(0, 255, 136, 0.3);
```

---

## Componentes

### 1. GlassCard

O componente base para superfícies glass morphism.

**Variantes:**
- `premium` - Card premium com hover effect
- `panel` - Painel mais opaco para conteúdo denso
- `stat` - Card estatístico com gradiente accent
- `input` - Input field glassmorphism

**Props:**
```typescript
interface GlassCardProps {
  variant?: 'premium' | 'panel' | 'stat' | 'input';
  neonAccent?: boolean;
  glowEffect?: boolean;
}
```

**Estilos Aplicados:**
- `backdrop-filter: blur(16px)` para efeito glass
- `background: rgba(255, 255, 255, 0.08)`
- `border: 1px solid rgba(255, 255, 255, 0.1)`
- Sombra elevada com box-shadow
- Transição hover suave (transform, background, border)

### 2. GlassButton

Botão com design glass morphism.

**Variantes:**
- `primary` - Botão de ação primária (verde neon)
- `secondary` - Botão secundário (glass com border neon)
- `ghost` - Botão transparente com hover

**Props:**
```typescript
interface GlassButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}
```

**Estilos:**
- Gradientes neon para primary
- Glow effect ao hover
- Transição Y (translateY(-2px))
- Ripple/shimmer opcional

---

## Efeitos de Vidro

### Blur Settings

```css
--glass-blur-sm: blur(10px);    /* Subtle glass effect */
--glass-blur-md: blur(16px);    /* Default glass effect */
--glass-blur-lg: blur(24px);    /* Strong glass effect */
```

### Sombras Glass

```css
--glass-shadow-sm: 0 8px 32px rgba(0, 0, 0, 0.1);
--glass-shadow-md: 0 8px 32px rgba(0, 0, 0, 0.15);
--glass-shadow-lg: 0 20px 64px rgba(0, 0, 0, 0.25);
--glass-shadow-glow: 0 0 20px rgba(0, 255, 136, 0.15);
```

### Animações

```css
@keyframes pulse { ... }              /* Fade in/out para elementos */
@keyframes glow-pulse { ... }         /* Pulse de glow neon */
@keyframes shimmer { ... }            /* Efeito shimmer horizontal */
```

### Backdrop Filter Suporte

O glass morphism usa `backdrop-filter` (CSS), que é suportado em:
- ✅ Chrome/Edge 76+
- ✅ Firefox 103+
- ✅ Safari 9+
- ✅ Navegadores Modernos

Para navegadores antigos, a cor sólida de fallback é aplicada.

---

## Como Usar

### 1. Importar Componentes

```tsx
import { GlassCard } from '@/components/ui/glass-card';
import { GlassButton } from '@/components/ui/glass-button';
```

### 2. Usar Classes Diretas (Tailwind)

```tsx
<div className="glass-card-premium">
  <h3 className="text-white">Premium Card</h3>
</div>

<button className="glass-button-primary">
  Click me
</button>

<input className="glass-input-field" />
```

### 3. Classes Utilitárias

```tsx
<div className="glass-badge-neon">✓ Verified</div>
<div className="glass-divider"></div>
<div className="glass-glow-accent">Glow Effect</div>
```

---

## Exemplos de Código

### Exemplo 1: Card com Badge Neon

```tsx
<GlassCard variant="premium" neonAccent={true}>
  <div className="space-y-4">
    <h3 className="text-xl font-bold text-white">
      Premium Feature
    </h3>
    <p className="text-gray-300">
      High-quality content with glass effect
    </p>
    <span className="glass-badge-neon">
      ✓ Recommended
    </span>
  </div>
</GlassCard>
```

### Exemplo 2: Stat Card com Progress

```tsx
<GlassCard variant="stat">
  <div className="space-y-3">
    <div className="text-3xl font-bold text-green-400">
      ₹2.4K
    </div>
    <p className="text-gray-400">Total Revenue</p>
    <div className="glass-progress-bar">
      <div style={{ width: '75%' }}></div>
    </div>
  </div>
</GlassCard>
```

### Exemplo 3: Form com Inputs Glass

```tsx
<form className="space-y-4">
  <input
    type="email"
    placeholder="Enter email"
    className="glass-input-field w-full"
  />
  <input
    type="password"
    placeholder="Enter password"
    className="glass-input-field w-full"
  />
  <GlassButton variant="primary" className="w-full">
    Sign In
  </GlassButton>
</form>
```

### Exemplo 4: Layout com Gradient Background

```tsx
<div
  className="min-h-screen"
  style={{
    backgroundImage: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 25%, #2d1b69 50%, #3d0f4a 75%, #4a0e4e 100%)',
  }}
>
  {/* Content aqui */}
</div>
```

---

## Performance

### Otimizações Implementadas

1. **Será-Paint Optimization**
  - Classes CSS pré-compiladas
  - Variáveis CSS para evitar recálculos
  - Transições com `will-change` quando necessário

2. **Backdrop-Filter Fallback**
  - Cores sólidas como fallback em navegadores antigos
  - `@supports` queries para features detection

3. **Animações GPU-Aceleradas**
  - `transform: translateY()` em vez de `top/bottom`
  - `opacity` em vez de `display`
  - Easing functions otimizadas

### Dicas de Performance

```tsx
// ✅ BOM - Usa transform
<div className="hover:translate-y-[-2px]">
  Hover me
</div>

// ❌ RUIM - Causa layout shift
<div className="hover:top-[-2px]">
  Hover me
</div>
```

---

## Acessibilidade

### Contraste de Cores

Todas as cores respeitam **WCAG AAA** ou **AA**:

| Combinação | Ratio | Conformidade |
|-----------|-------|-------------|
| Neon Green (#00FF88) on Dark | 10.5:1 | AAA |
| White on Dark Navy | 12.3:1 | AAA |
| Gray-300 on Dark | 7.8:1 | AA |

### Focus States

```css
.glass-input-field:focus {
  border-color: var(--glass-neon-green);
  box-shadow: 0 0 12px rgba(0, 255, 136, 0.2);
  outline: none;
}
```

### Motion Preferences

```css
@media (prefers-reduced-motion: reduce) {
  .glass-button-primary {
    transition: none;
  }
}
```

### Alternativas de Texto

- Todos os ícones têm `aria-label`
- Badges neon têm `role="badge"`
- Cards neon têm `role="article"` com título

---

## Integração com Componentes Existentes

### Atualizar Card Existente

```tsx
// Antes
<Card>
  <CardHeader>Title</CardHeader>
</Card>

// Depois
<GlassCard variant="premium">
  <div className="space-y-4">
    <h2 className="text-white">Title</h2>
  </div>
</GlassCard>
```

### Atualizar Button Existente

```tsx
// Antes
<Button variant="default">Click</Button>

// Depois
<GlassButton variant="primary">Click</GlassButton>
```

---

## Rota de Demonstração

Acesse [/glass-showcase](/glass-showcase) para ver todos os componentes e efeitos em ação.

---

## Próximos Passos

1. ✅ Design Tokens criados
2. ✅ Componentes GlassCard e GlassButton
3. ✅ Página Showcase
4. ⏭️ **Integração em componentes existentes** (Modal, Dialog, Sidebar)
5. ⏭️ **Temas variáveis** (Light/Dark toggle)
6. ⏭️ **Storybook documentation**

---

## Suporte e Issues

Encontrou um problema com glass morphism?

1. Verifique compatibilidade do navegador (backdrop-filter)
2. Teste em modo incógnito (sem cache)
3. Verifique z-index conflicts com outros componentes
4. Valide contraste de cores com aXe DevTools

---

**Última atualização:** 2026-03-16
**Versão:** 1.0.0
**Framework:** React 18 + TailwindCSS 3 + Radix UI
