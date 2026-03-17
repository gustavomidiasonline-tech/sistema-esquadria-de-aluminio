import { AppLayout } from '@/components/AppLayout';
import { PDFRawTextDebug } from '@/components/debug/PDFRawTextDebug';

export default function Debug() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">🔧 Ferramentas de Debug</h1>
          <p className="text-sm text-muted-foreground">
            Análise detalhada do PDF e extração de dados
          </p>
        </div>

        <PDFRawTextDebug />
      </div>
    </AppLayout>
  );
}
