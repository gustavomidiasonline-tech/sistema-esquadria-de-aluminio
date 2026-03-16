/**
 * PipelineInitializer — Inicializa os listeners do pipeline event-driven.
 * Componente headless (sem renderização) colocado dentro de AuthProvider.
 */

import { useEffect } from 'react';
import { PipelineService } from '@/services/pipeline.service';

export function PipelineInitializer() {
  useEffect(() => {
    const unsubscribe = PipelineService.initialize();
    return unsubscribe;
  }, []);

  return null;
}
