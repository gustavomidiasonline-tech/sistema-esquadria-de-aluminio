# Glass Morphism - Guia de Integração no Sistema

## Como Integrar nos Componentes Existentes

### 1. Update Input Search (AppHeader.tsx - linha 79-83)

**Antes:**
```tsx
<input className="pl-10 pr-4 py-2 text-sm bg-muted rounded-lg border-none outline-none focus:ring-2 focus:ring-primary/30 w-64 text-foreground placeholder:text-muted-foreground" />
```

**Depois:**
```tsx
<input className="glass-input-field pl-10 pr-4 py-2 text-sm w-64" />
```

---

### 2. Update "Novo produto" Button (Produtos.tsx)

**Antes:**
```tsx
import { Button } from "@/components/ui/button";
<Button>Novo produto</Button>
```

**Depois:**
```tsx
import { GlassButton } from "@/components/ui/glass-button";
<GlassButton variant="primary">Novo produto</GlassButton>
```

---

### 3. Update Product Cards (Produtos.tsx - Grid)

**Antes:**
```tsx
import { Card } from "@/components/ui/card";
<Card className="p-4">
  {/* product card */}
</Card>
```

**Depois:**
```tsx
import { GlassCard } from "@/components/ui/glass-card";
<GlassCard variant="premium" neonAccent={true}>
  {/* product card */}
</GlassCard>
```

---

### 4. Global Class Updates

Aplicar em páginas inteiras usando classes Tailwind diretas:

```html
<!-- Header -->
<header className="glass-header">...</header>

<!-- Sidebar -->
<aside className="glass-sidebar">...</aside>

<!-- Cards -->
<div className="glass-card-premium">...</div>

<!-- Buttons -->
<button className="glass-button-primary">Click</button>

<!-- Inputs -->
<input className="glass-input-field" />

<!-- Badges -->
<span className="glass-badge-neon">Label</span>
```

---

## Passo a Passo Rápido

1. **Search Input do Header**
   - Arquivo: `src/components/AppHeader.tsx`
   - Linha: ~82
   - Mudar: className para `glass-input-field pl-10 pr-4 py-2 text-sm w-64`

2. **Botão "Novo Produto"**
   - Arquivo: `src/pages/Produtos.tsx`
   - Procure por: `<Button ... >Novo produto</Button>`
   - Substitua por: `<GlassButton variant="primary">Novo produto</GlassButton>`
   - Importe: `import { GlassButton } from '@/components/ui/glass-button';`

3. **Cards de Produtos**
   - Arquivo: `src/pages/Produtos.tsx`
   - Procure pelo grid de produtos
   - Substitua `<Card>` por `<GlassCard variant="premium">`
   - Importe: `import { GlassCard } from '@/components/ui/glass-card';`

---

## Próximas Mudanças (Opcionais)

### Update Modal (Modals existentes)
```tsx
// Em qualquer Modal/Dialog, substitua:
// <DialogContent> por <GlassModalContent>
import { GlassModalContent } from '@/components/ui/glass-modal';
```

### Update Badges
```tsx
// Substitute Badge padrão por GlassBadge
import { GlassBadge } from '@/components/ui/glass-badge';
<GlassBadge variant="neon">Badge</GlassBadge>
```

### Update Progress Bars
```tsx
// Substitua Progress padrão por GlassProgress
import { GlassProgress } from '@/components/ui/glass-progress';
<GlassProgress value={75} color="green" />
```

---

## Verificar as Mudanças

Após fazer as edições:

```bash
npm run build
```

Deve mostrar: `✓ built in 13-16s`

---

## CSS Classes Disponíveis (sem componentes)

```html
<!-- Use direto no className -->
<div class="glass-card-premium">Card Premium</div>
<div class="glass-panel">Panel</div>
<div class="glass-stat-card">Stat</div>
<button class="glass-button-primary">Botão</button>
<input class="glass-input-field" />
<span class="glass-badge-neon">Badge</span>
<div class="glass-progress-bar"></div>
```

---

## Exemplos Completos

### Exemplo 1: Página com Glass Components
```tsx
import { GlassCard } from '@/components/ui/glass-card';
import { GlassButton } from '@/components/ui/glass-button';

export default function Produtos() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Produtos</h1>
        <GlassButton variant="primary">Novo Produto</GlassButton>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-3 gap-4">
        {products.map(product => (
          <GlassCard key={product.id} variant="premium" neonAccent={true}>
            <h3>{product.name}</h3>
            <p className="text-gray-400">{product.price}</p>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
```

### Exemplo 2: Modal com Glass
```tsx
import {
  GlassModal,
  GlassModalTrigger,
  GlassModalContent,
  GlassModalHeader,
  GlassModalTitle,
  GlassModalFooter,
} from '@/components/ui/glass-modal';
import { GlassButton } from '@/components/ui/glass-button';

<GlassModal>
  <GlassModalTrigger asChild>
    <GlassButton variant="secondary">Abrir Modal</GlassButton>
  </GlassModalTrigger>
  <GlassModalContent>
    <GlassModalHeader>
      <GlassModalTitle>Título</GlassModalTitle>
    </GlassModalHeader>
    <div className="p-4">Conteúdo</div>
    <GlassModalFooter>
      <GlassButton variant="primary">Salvar</GlassButton>
    </GlassModalFooter>
  </GlassModalContent>
</GlassModal>
```

---

## Checklist de Integração

- [ ] Update AppHeader search input (glass-input-field)
- [ ] Update Produtos page CTA (GlassButton primary)
- [ ] Update Product cards (GlassCard variant="premium")
- [ ] Update Modal/Dialog components (GlassModal)
- [ ] Update badges (GlassBadge)
- [ ] Test build (npm run build)
- [ ] Visualizar em http://localhost:5173

---

## Dúvidas?

- **Componentes:** Veja `GLASS_COMPONENTS_INDEX.md`
- **Quick Ref:** Veja `GLASS_QUICK_START.md`
- **Documentação:** Veja `docs/GLASS_MORPHISM_GUIDE.md`

---

**Happy integrating! 🎨**
