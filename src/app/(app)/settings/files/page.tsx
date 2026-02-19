
'use client';

import * as React from 'react';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Copy, FileIcon, Download, DownloadCloud } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

// This is a static list of files. In a real scenario, this would be generated dynamically.
const filePaths = [
  ".env",
  "README.md",
  "apphosting.yaml",
  "components.json",
  "docs/backend.json",
  "firestore.rules",
  "next.config.ts",
  "package.json",
  "src/ai/flows/analise-ambiental-flow.ts",
  "src/ai/flows/assistant-flow.ts",
  "src/ai/flows/generate-financial-report.ts",
  "src/ai/flows/generate-sustainability-report.ts",
  "src/ai/genkit.ts",
  "src/app/(app/invoices/invoice-form.tsx",
  "src/app/(app)/analise-ambiental/leaflet-map.tsx",
  "src/app/(app)/analise-ambiental/page.tsx",
  "src/app/(app)/audit-log/page.tsx",
  "src/app/(app)/bank-access/page.tsx",
  "src/app/(app)/calendar/page.tsx",
  "src/app/(app)/cash-flow/[id]/edit/page.tsx",
  "src/app/(app)/cash-flow/cash-flow-chart.tsx",
  "src/app/(app)/cash-flow/expense-table.tsx",
  "src/app/(app)/cash-flow/new/page.tsx",
  "src/app/(app)/cash-flow/page.tsx",
  "src/app/(app)/cash-flow/revenue-table.tsx",
  "src/app/(app)/cash-flow/transaction-form.tsx",
  "src/app/(app)/clients/[id]/edit/page.tsx",
  "src/app/(app)/clients/client-form.tsx",
  "src/app/(app)/clients/new/page.tsx",
  "src/app/(app)/clients/page.tsx",
  "src/app/(app)/compliance/compliance-form.tsx",
  "src/app/(app)/compliance/page.tsx",
  "src/app/(app)/contracts/[id]/edit/page.tsx",
  "src/app/(app)/contracts/contract-form.tsx",
  "src/app/(app)/contracts/new/page.tsx",
  "src/app/(app)/contracts/page.tsx",
  "src/app/(app)/crm/[id]/edit/page.tsx",
  "src/app/(app)/crm/crm-dashboard.tsx",
  "src/app/(app)/crm/new/page.tsx",
  "src/app/(app)/crm/opportunity-form.tsx",
  "src/app/(app)/crm/page.tsx",
  "src/app/(app)/dashboards/admin-dashboard.tsx",
  "src/app/(app)/dashboards/client-dashboard.tsx",
  "src/app/(app)/dashboards/environmental-dashboard.tsx",
  "src/app/(app)/dashboards/financial-dashboard.tsx",
  "src/app/(app)/empreendedores/[id]/edit/page.tsx",
  "src/app/(app)/empreendedores/client-import-dialog.tsx",
  "src/app/(app)/empreendedores/empreendedor-form.tsx",
  "src/app/(app)/empreendedores/new/page.tsx",
  "src/app/(app)/empreendedores/page.tsx",
  "src/app/(app)/environmental-company/company-form.tsx",
  "src/app/(app)/environmental-company/page.tsx",
  "src/app/(app)/external/page.tsx",
  "src/app/(app)/inspections/page.tsx",
  "src/app/(app)/inspections/reports/page.tsx",
  "src/app/(app)/intervencoes/intervencao-form.tsx",
  "src/app/(app)/intervencoes/page.tsx",
  "src/app/(app)/invoices/[id]/edit/page.tsx",
  "src/app/(app)/invoices/invoice-form.tsx",
  "src/app/(app)/invoices/new/page.tsx",
  "src/app/(app)/invoices/page.tsx",
  "src/app/(app)/las-ras/las-ras-form.tsx",
  "src/app/(app)/layout.tsx",
  "src/app/(app)/licenses/license-form.tsx",
  "src/app/(app)/licenses/page.tsx",
  "src/app/(app)/monitoring/manual/monitoring-form.tsx",
  "src/app/(app)/monitoring/manual/page.tsx",
  "src/app/(app)/monitoring/page.tsx",
  "src/app/(app)/monitoring/telemetric/page.tsx",
  "src/app/(app)/outorgas/outorga-form.tsx",
  "src/app/(app)/outorgas/page.tsx",
  "src/app/(app)/page.tsx",
  "src/app/(app)/projects/[id]/edit/page.tsx",
  "src/app/(app)/projects/form-default.tsx",
  "src/app/(app)/projects/new/page.tsx",
  "src/app/(app)/projects/page.tsx",
  "src/app/(app)/projects/project-form.tsx",
  "src/app/(app)/proposals/[id]/edit/page.tsx",
  "src/app/(app)/proposals/new/page.tsx",
  "src/app/(app)/proposals/page.tsx",
  "src/app/(app)/proposals/proposal-form.tsx",
  "src/app/(app)/reporting/actions.ts",
  "src/app/(app)/reporting/financial-reporting-client.tsx",
  "src/app/(app)/reporting/page.tsx",
  "src/app/(app)/reporting/reporting-client.tsx",
  "src/app/(app)/responsible-company/[id]/edit/page.tsx",
  "src/app/(app)/responsible-company/company-form.tsx",
  "src/app/(app)/responsible-company/new/page.tsx",
  "src/app/(app)/responsible-company/page.tsx",
  "src/app/(app)/settings/company-form.tsx",
  "src/app/(app)/settings/files/page.tsx",
  "src/app/(app)/settings/page.tsx",
  "src/app/(app)/social-media/page.tsx",
  "src/app/(app)/studies/assistant/actions.ts",
  "src/app/(app)/studies/assistant/page.tsx",
  "src/app/(app)/studies/barragem/page.tsx",
  "src/app/(app)/studies/cavidades/page.tsx",
  "src/app/(app)/studies/educacao-ambiental/page.tsx",
  "src/app/(app)/studies/eia-rima/page.tsx",
  "src/app/(app)/studies/fauna/inventario/inventario-form.tsx",
  "src/app/(app)/studies/fauna/inventario/page.tsx",
  "src/app/(app)/studies/fauna/inventario-relatorio/page.tsx",
  "src/app/(app)/studies/fauna/inventario-relatorio/relatorio-form.tsx",
  "src/app/(app)/studies/fauna/monitoramento/monitoramento-form.tsx",
  "src/app/(app)/studies/fauna/monitoramento/page.tsx",
  "src/app/(app)/studies/fauna/monitoramento-relatorio/page.tsx",
  "src/app/(app)/studies/fauna/monitoramento-relatorio/relatorio-form.tsx",
  "src/app/(app)/studies/fauna/page.tsx",
  "src/app/(app)/studies/fauna/resgate/page.tsx",
  "src/app/(app)/studies/fauna/resgate/resgate-form.tsx",
  "src/app/(app)/studies/fauna/resgate-relatorio/page.tsx",
  "src/app/(app)/studies/fauna/resgate-relatorio/relatorio-form.tsx",
  "src/app/(app)/studies/intervencao-ambiental/[id]/edit/page.tsx",
  "src/app/(app)/studies/intervencao-ambiental/new/page.tsx",
  "src/app/(app)/studies/intervencao-ambiental/page.tsx",
  "src/app/(app)/studies/intervencao-ambiental/pia-form-inventario.tsx",
  "src/app/(app)/studies/intervencao-ambiental/pia-form.tsx",
  "src/app/(app)/studies/inventario/[id]/arvores/page.tsx",
  "src/app/(app)/studies/inventario/[id]/calculadora/page.tsx",
  "src/app/(app)/studies/inventario/[id]/especies/atributos-dialog.tsx",
  "src/app/(app)/studies/inventario/[id]/especies/page.tsx",
  "src/app/(app)/studies/inventario/[id]/formulas/page.tsx",
  "src/app/(app)/studies/inventario/[id]/import-dialog.tsx",
  "src/app/(app)/studies/inventario/[id]/layout.tsx",
  "src/app/(app)/studies/inventario/[id]/page.tsx",
  "src/app/(app)/studies/inventario/inventario-form.tsx",
  "src/app/(app)/studies/inventario/page.tsx",
  "src/app/(app)/studies/las-ras/las-ras-form.tsx",
  "src/app/(app)/studies/outorgas/outorga-form.tsx",
  "src/app/(app)/studies/outorgas/page.tsx",
  "src/app/(app)/studies/page.tsx",
  "src/app/(app)/studies/pca/[id]/edit/page.tsx",
  "src/app/(app)/studies/pca/new/page.tsx",
  "src/app/(app)/studies/pca/page.tsx",
  "src/app/(app)/studies/pca/pca-form.tsx",
  "src/app/(app)/studies/prada/[id]/edit/page.tsx",
  "src/app/(app)/studies/prada/new/page.tsx",
  "src/app/(app)/studies/prada/page.tsx",
  "src/app/(app)/studies/prada/prada-form.tsx",
  "src/app/(app)/studies/ptrf/[id]/edit/page.tsx",
  "src/app/(app)/studies/ptrf/new/page.tsx",
  "src/app/(app)/studies/ptrf/page.tsx",
  "src/app/(app)/studies/ptrf/ptrf-form.tsx",
  "src/app/(app)/studies/rca/[id]/edit/page.tsx",
  "src/app/(app)/studies/rca/new/page.tsx",
  "src/app/(app)/studies/rca/page.tsx",
  "src/app/(app)/studies/rca/rca-form-abastecimento-agua.tsx",
  "src/app/(app)/studies/rca/rca-form-abatedouros.tsx",
  "src/app/(app)/studies/rca/rca-form-aguardente.tsx",
  "src/app/(app)/studies/rca/rca-form-areia-cascalho-argila.tsx",
  "src/app/(app)/studies/rca/rca-form-avicultura.tsx",
  "src/app/(app)/studies/rca/rca-form-barragem-rejeitos.tsx",
  "src/app/(app)/studies/rca/rca-form-barragem-saneamento.tsx",
  "src/app/(app)/studies/rca/rca-form-biogas-aterro.tsx",
  "src/app/(app)/studies/rca/rca-form-biometanizacao-rsu.tsx",
  "src/app/(app)/studies/rca/rca-form-borracha.tsx",
  "src/app/(app)/studies/rca/rca-form-bovinocultura.tsx",
  "src/app/(app)/studies/rca/rca-form-couros-peles.tsx",
  "src/app/(app)/studies/rca/rca-form-culturas.tsx",
  "src/app/(app)/studies/rca/rca-form-dragagem.tsx",
  "src/app/(app)/studies/rca/rca-form-esgotamento-sanitario.tsx",
  "src/app/(app)/studies/rca/rca-form-explosivos.tsx",
  "src/app/(app)/studies/rca/rca-form-farmaceutico.tsx",
  "src/app/(app)/studies/rca/rca-form-fundidos-ferro-aco.tsx",
  "src/app/(app)/studies/rca/rca-form-fundidos-nao-ferrosos.tsx",
  "src/app/(app)/studies/rca/rca-form-gasoduto.tsx",
  "src/app/(app)/studies/rca/rca-form-graos.tsx",
  "src/app/(app)/studies/rca/rca-form-irrigados.tsx",
  "src/app/(app)/studies/rca/rca-form-laticinios.tsx",
  "src/app/(app)/studies/rca/rca-form-lavra-subterranea.tsx",
  "src/app/(app)/studies/rca/rca-form-ligas-ferrosas.tsx",
  "src/app/(app)/studies/rca/rca-form-materiais-ceramicos.tsx",
  "src/app/(app)/studies/rca/rca-form-metalurgia-nao-ferrosos.tsx",
  "src/app/(app)/studies/rca/rca-form-moveis.tsx",
  "src/app/(app)/studies/rca/rca-form-oleos-gorduras.tsx",
  "src/app/(app)/studies/rca/rca-form-papel-papelao.tsx",
  "src/app/(app)/studies/rca/rca-form-plasticos.tsx",
  "src/app/(app)/studies/rca/rca-form-posto-combustivel.tsx",
  "src/app/(app)/studies/rca/rca-form-produtos-limpeza.tsx",
  "src/app/(app)/studies/rca/rca-form-racao-animal.tsx",
  "src/app/(app)/studies/rca/rca-form-recapacitacao-cgh-pch.tsx",
  "src/app/(app)/studies/rca/rca-form-rochas-ornamentais.tsx",
  "src/app/(app)/studies/rca/rca-form-rodovias.tsx",
  "src/app/(app)/studies/rca/rca-form-siderurgia.tsx",
  "src/app/(app)/studies/rca/rca-form-silvicultura.tsx",
  "src/app/(app)/studies/rca/rca-form-solo-urbano.tsx",
  "src/app/(app)/studies/rca/rca-form-subprodutos-animal.tsx",
  "src/app/(app)/studies/rca/rca-form-suinocultura.tsx",
  "src/app/(app)/studies/rca/rca-form-telhas-tijolos.tsx",
  "src/app/(app)/studies/rca/rca-form-tratamento-rsu.tsx",
  "src/app/(app)/studies/rca/rca-form-tratamento-termico-rsu.tsx",
  "src/app/(app)/studies/rca/rca-form.tsx",
  "src/app/(app)/studies/reserva-legal/page.tsx",
  "src/app/(app)/studies/seguranca-barragens/page.tsx",
  "src/app/(app)/technical-responsible/[id]/edit/page.tsx",
  "src/app/(app)/technical-responsible/new/page.tsx",
  "src/app/(app)/technical-responsible/page.tsx",
  "src/app/(app)/technical-responsible/responsible-form.tsx",
  "src/app/(app)/users/page.tsx",
  "src/app/(app)/users/user-form.tsx",
  "src/app/(app)/usos-insignificantes/page.tsx",
  "src/app/globals.css",
  "src/app/layout.tsx",
  "src/app/login/login-form.tsx",
  "src/app/login/page.tsx",
  "src/app/studies/rca/rca-form-culturas.tsx",
  "src/app/studies/rca/rca-form-lavra-subterranea.tsx",
  "src/components/FirebaseErrorListener.tsx",
  "src/components/ToastContainer.tsx",
  "src/components/chat-widget.tsx",
  "src/components/page-header.tsx",
  "src/components/theme-provider.tsx",
  "src/components/ui/accordion.tsx",
  "src/components/ui/alert-dialog.tsx",
  "src/components/ui/alert.tsx",
  "src/components/ui/avatar.tsx",
  "src/components/ui/badge.tsx",
  "src/components/ui/button.tsx",
  "src/components/ui/calendar.tsx",
  "src/components/ui/card.tsx",
  "src/components/ui/carousel.tsx",
  "src/components/ui/chart.tsx",
  "src/components/ui/checkbox.tsx",
  "src/components/ui/collapsible.tsx",
  "src/components/ui/command.tsx",
  "src/components/ui/dialog.tsx",
  "src/components/ui/dropdown-menu.tsx",
  "src/components/ui/form.tsx",
  "src/components/ui/input.tsx",
  "src/components/ui/label.tsx",
  "src/components/ui/menubar.tsx",
  "src/components/ui/popover.tsx",
  "src/components/ui/progress.tsx",
  "src/components/ui/radio-group.tsx",
  "src/components/ui/resizable.tsx",
  "src/components/ui/scroll-area.tsx",
  "src/components/ui/select.tsx",
  "src/components/ui/separator.tsx",
  "src/components/ui/sheet.tsx",
  "src/components/ui/sidebar.tsx",
  "src/components/ui/skeleton.tsx",
  "src/components/ui/slider.tsx",
  "src/components/ui/stepper.tsx",
  "src/components/ui/switch.tsx",
  "src/components/ui/table.tsx",
  "src/components/ui/tabs.tsx",
  "src/components/ui/textarea.tsx",
  "src/components/ui/toast.tsx",
  "src/components/ui/toaster.tsx",
  "src/components/ui/tooltip.tsx",
  "src/firebase/client-provider.tsx",
  "src/firebase/config.ts",
  "src/firebase/error-emitter.ts",
  "src/firebase/errors.ts",
  "src/firebase/firestore/use-collection.tsx",
  "src/firebase/firestore/use-doc.tsx",
  "src/firebase/index.ts",
  "src/firebase/non-blocking-login.tsx",
  "src/firebase/non-blocking-updates.tsx",
  "src/firebase/provider.tsx",
  "src/hooks/use-mobile.tsx",
  "src/hooks/use-toast.ts",
  "src/lib/audit-log.ts",
  "src/lib/brazilian-banks.ts",
  "src/lib/geo-utils.ts",
  "src/lib/ibge-data.ts",
  "src/lib/minas-gerais-outline.ts",
  "src/lib/placeholder-images.json",
  "src/lib/placeholder-images.ts",
  "src/lib/types/analise-ambiental.ts",
  "src/lib/types.ts",
  "src/lib/utils.ts",
  "storage.rules",
  "tailwind.config.ts",
  "tsconfig.json",
];

// NOTE: The content of the files is not available in this context.
// The download function will create empty files with the correct names.
// A real implementation would need access to the file system or a file content API.
const fileContents: Record<string, string> = {
  // This would be populated with the actual file contents if available.
  // For now, it will be empty.
};


export default function ProjectFilesPage() {
    const { toast } = useToast();
    const [selectedFiles, setSelectedFiles] = React.useState<string[]>([]);

    const handleCopy = (path: string) => {
        navigator.clipboard.writeText(path);
        toast({
            title: "Caminho Copiado!",
            description: `O caminho "${path}" foi copiado para a área de transferência.`,
        });
    };
    
    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedFiles(filePaths);
        } else {
            setSelectedFiles([]);
        }
    };

    const handleFileSelect = (path: string, checked: boolean) => {
        if (checked) {
            setSelectedFiles(prev => [...prev, path]);
        } else {
            setSelectedFiles(prev => prev.filter(p => p !== path));
        }
    };
    
    const handleDownloadSelected = () => {
        if (selectedFiles.length === 0) {
            toast({
                variant: 'destructive',
                title: 'Nenhum arquivo selecionado',
                description: 'Por favor, selecione pelo menos um arquivo para baixar.',
            });
            return;
        }

        selectedFiles.forEach(path => {
            const content = fileContents[path] || ''; // Fallback to empty content
            const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = path.split('/').pop() || 'file'; // Extract filename
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        });
        
        toast({
            title: 'Download Iniciado',
            description: `Baixando ${selectedFiles.length} arquivo(s).`
        })
    };


  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Explorador de Arquivos do Projeto" />
      <main className="flex-1 overflow-auto p-4 md:p-6">
        <Card>
          <CardHeader>
            <CardTitle>Estrutura de Arquivos</CardTitle>
            <CardDescription>
              Aqui está a lista de todos os arquivos do seu projeto. Use esta lista para me dizer exatamente em qual arquivo você gostaria de fazer alterações.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TooltipProvider>
                <div className="flex items-center justify-between py-2">
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="select-all"
                            checked={selectedFiles.length > 0 && selectedFiles.length === filePaths.length}
                            onCheckedChange={(checked) => handleSelectAll(checked as boolean)}
                        />
                        <Label htmlFor="select-all">Selecionar Todos</Label>
                    </div>
                     <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={handleDownloadSelected} disabled={selectedFiles.length === 0}>
                            <DownloadCloud className="mr-2 h-4 w-4" />
                            Baixar Selecionados ({selectedFiles.length})
                        </Button>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <span tabIndex={0}>
                                    <Button disabled>
                                        <Download className="mr-2 h-4 w-4" />
                                        Baixar Projeto (.zip)
                                    </Button>
                                </span>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Funcionalidade em desenvolvimento.</p>
                            </TooltipContent>
                        </Tooltip>
                    </div>
                </div>
                <ScrollArea className="h-[60vh] rounded-md border">
                <div className="p-4">
                    <ul>
                    {filePaths.sort().map((path) => (
                        <li key={path} className="flex items-center justify-between py-2 border-b last:border-b-0">
                        <div className="flex items-center gap-3">
                            <Checkbox 
                                id={path}
                                checked={selectedFiles.includes(path)}
                                onCheckedChange={(checked) => handleFileSelect(path, checked as boolean)}
                            />
                            <Label htmlFor={path} className="font-mono text-sm cursor-pointer">
                                <FileIcon className="h-4 w-4 text-muted-foreground inline-block mr-2" />
                                {path}
                            </Label>
                        </div>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" onClick={() => handleCopy(path)}>
                                    <Copy className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Copiar caminho</p>
                            </TooltipContent>
                        </Tooltip>
                        </li>
                    ))}
                    </ul>
                </div>
                </ScrollArea>
            </TooltipProvider>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
