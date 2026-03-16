export const STATUS_COLOR: Record<string, string> = {
  aprovado: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  rascunho: 'bg-muted text-muted-foreground border-border',
  enviado: 'bg-primary/10 text-primary border-primary/20',
  rejeitado: 'bg-destructive/10 text-destructive border-destructive/20',
  expirado: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
};

export const STATUS_LABEL: Record<string, string> = {
  rascunho: 'Rascunho',
  enviado: 'Enviado',
  aprovado: 'Aprovado',
  rejeitado: 'Rejeitado',
  expirado: 'Expirado',
};
