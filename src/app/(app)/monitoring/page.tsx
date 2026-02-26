import { PageHeader } from '@/components/page-header';

export default function MonitoringPage() {
  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Monitoramento Usos Hídricos/Outorgas" />
      <main className="flex-1 overflow-auto p-4 md:p-6">
         <div className="flex items-center justify-center h-full border-2 border-dashed rounded-lg">
            <p className="text-muted-foreground">Página de Monitoramento Usos Hídricos/Outorgas em Construção</p>
        </div>
      </main>
    </div>
  );
}
