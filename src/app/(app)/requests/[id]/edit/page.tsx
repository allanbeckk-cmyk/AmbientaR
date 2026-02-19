
'use client';
import { Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCollection, useFirebase, useMemoFirebase, useDoc } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import type { Empreendedor, Project, Request } from '@/lib/types';
import * as React from 'react';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const services = [
  "Licenciamento ambiental",
  "Outorga",
  "Autorização para Intervenção Ambiental",
  "Reserva legal (Averbação, Compensação e/ou Relocação)",
  "Uso Insignificante"
];

// Placeholder components for each service card
const LicenciamentoCard = () => (
  <Card>
    <CardHeader>
      <CardTitle>Detalhes do Licenciamento Ambiental</CardTitle>
      <CardDescription>Preencha as informações específicas para o licenciamento.</CardDescription>
    </CardHeader>
    <CardContent>
        <Accordion type="multiple" className="w-full">
            <AccordionItem value="item-1">
                <AccordionTrigger>Fase 1 - Reunir Documentos</AccordionTrigger>
                <AccordionContent>
                    <div className="flex items-center justify-center h-24 border-2 border-dashed rounded-lg">
                        <p className="text-muted-foreground text-sm">Campos para documentos aqui.</p>
                    </div>
                </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2">
                <AccordionTrigger>Fase 2 - Gradar Licenciamento</AccordionTrigger>
                <AccordionContent>
                    <div className="flex items-center justify-center h-24 border-2 border-dashed rounded-lg">
                        <p className="text-muted-foreground text-sm">Campos para gradar o licenciamento aqui.</p>
                    </div>
                </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3">
                <AccordionTrigger>Fase 3 - Estudos Ambientais</AccordionTrigger>
                <AccordionContent>
                    <div className="flex items-center justify-center h-24 border-2 border-dashed rounded-lg">
                        <p className="text-muted-foreground text-sm">Campos para estudos ambientais aqui.</p>
                    </div>
                </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-4">
                <AccordionTrigger>Fase 4 - Outros</AccordionTrigger>
                <AccordionContent>
                    <div className="flex items-center justify-center h-24 border-2 border-dashed rounded-lg">
                        <p className="text-muted-foreground text-sm">Outros campos e observações here.</p>
                    </div>
                </AccordionContent>
            </AccordionItem>
        </Accordion>
    </CardContent>
  </Card>
);

const OutorgaCard = () => (
  <Card>
    <CardHeader>
      <CardTitle>Detalhes da Outorga</CardTitle>
      <CardDescription>Preencha as informações específicas para a outorga de uso de água.</CardDescription>
    </CardHeader>
    <CardContent>
       <div className="flex items-center justify-center h-32 border-2 border-dashed rounded-lg">
        <p className="text-muted-foreground">Campos do formulário de outorga aqui.</p>
      </div>
    </CardContent>
  </Card>
);

const IntervencaoCard = () => {
    const renderCheckboxList = (items: { id: string; label: string; obs?: string }[]) => (
        <div className="space-y-2">
            {items.map(item => (
                <div key={item.id} className="flex items-start space-x-2">
                    <Checkbox id={item.id} />
                    <div className="grid gap-1.5 leading-none">
                        <label htmlFor={item.id} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            {item.label}
                        </label>
                        {item.obs && <p className="text-xs text-muted-foreground">{item.obs}</p>}
                    </div>
                </div>
            ))}
        </div>
    );

    return (
        <Card>
            <CardHeader>
                <CardTitle>Detalhes da Intervenção Ambiental (AIA)</CardTitle>
                <CardDescription>Checklist de fases e documentos para o processo de AIA.</CardDescription>
            </CardHeader>
            <CardContent>
                <Accordion type="multiple" className="w-full" defaultValue={['fase1']}>
                    <AccordionItem value="fase1">
                        <AccordionTrigger>Fase 1: Reunir Documentos</AccordionTrigger>
                        <AccordionContent>
                            {renderCheckboxList([
                                { id: 'f1_multa', label: 'Comp. de pagamento (1ª parcela da multa)' },
                                { id: 'f1_liminar', label: 'Liminar' },
                                { id: 'f1_auto', label: 'Auto de infração' },
                                { id: 'f1_art', label: "ART's" },
                                { id: 'f1_doc_emp', label: 'Doc. pessoais do empreendedor' },
                                { id: 'f1_doc_proc', label: 'Doc. pessoais do procurador' },
                                { id: 'f1_end_emp', label: 'Comp. de endereço do empreendedor' },
                                { id: 'f1_end_proc', label: 'Comp. de endereço do procurador' },
                                { id: 'f1_procuracao', label: 'Procuração' },
                                { id: 'f1_anuencia', label: 'Carta de anuência', obs: 'Caso o empreendimento tenha mais de um proprietário' },
                                { id: 'f1_matriculas', label: 'Matrículas' },
                                { id: 'f1_termo_rl', label: 'Termo de averbação da RL + Croqui da Reserva Legal' },
                                { id: 'f1_car', label: 'Cadastro Ambiental Rural (CAR)' },
                            ])}
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="fase2">
                        <AccordionTrigger>Fase 2: Mapa de Uso e Ocupação do Solo</AccordionTrigger>
                        <AccordionContent>
                             {renderCheckboxList([
                                { id: 'f2_perimetro', label: 'Definir o perímetro' },
                                { id: 'f2_feicoes', label: 'Desenhar as feições', obs: 'Verificar se será feita realocação de Reserva Legal' },
                                { id: 'f2_hachuras', label: 'Colocar as hachuras' },
                                { id: 'f2_areas', label: 'Colocar as áreas (POL_PROP, POL_APP, POL_RL, POL_IA, POL_HIDRO, etc.)', obs: 'Para áreas acima de 100 hectares, incluir POL_COMP (2%)' },
                                { id: 'f2_ptosede', label: 'PTO_SEDE' },
                                { id: 'f2_confrontantes', label: 'Confrontantes' },
                                { id: 'f2_escala', label: 'Escala e rosa dos ventos' },
                                { id: 'f2_info', label: 'Informações do empreendedor e do empreendimento' },
                                { id: 'f2_quadro_areas', label: 'Quadro de áreas' },
                                { id: 'f2_legendas', label: 'Legendas' },
                                { id: 'f2_quadro_reservas', label: 'Quadro de reservas' },
                            ])}
                        </AccordionContent>
                    </AccordionItem>
                     <AccordionItem value="fase3">
                        <AccordionTrigger>Fase 3: Inventário Florestal</AccordionTrigger>
                        <AccordionContent>
                            {renderCheckboxList([
                                { id: 'f3_campo', label: 'Ir a campo' },
                                { id: 'f3_resultados', label: 'Pegar os resultados do inventário' },
                                { id: 'f3_projeto_mapa', label: 'Gerar o projeto no mapa nativa' },
                                { id: 'f3_erro_amostragem', label: 'Verificar o erro de amostragem' },
                                { id: 'f3_planilhas_pia', label: 'Gerar as planilhas para o PIA' },
                                { id: 'f3_volumes_taxas', label: 'Calcular os volumes para as taxas' },
                                { id: 'f3_gerar_taxas', label: 'Gerar as taxas' },
                            ])}
                        </AccordionContent>
                    </AccordionItem>
                     <AccordionItem value="fase4">
                        <AccordionTrigger>Fase 4: Mapas do QGis</AccordionTrigger>
                        <AccordionContent>
                             {renderCheckboxList([
                                { id: 'f4_bioma', label: 'Mapa de bioma' },
                                { id: 'f4_declividade', label: 'Mapa de declividade' },
                                { id: 'f4_hidrografico', label: 'Mapa de hidrográfico' },
                                { id: 'f4_hipsometrico', label: 'Mapa de hipsométrico' },
                                { id: 'f4_solos', label: 'Mapa de solos' },
                                { id: 'f4_roteiro', label: 'Roteiro de acesso' },
                                { id: 'f4_ada', label: 'Mapa da ADA' },
                            ])}
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="fase5">
                        <AccordionTrigger>Fase 5: Estudos</AccordionTrigger>
                        <AccordionContent>
                            {renderCheckboxList([
                                { id: 'f5_pia', label: 'Projeto de Intervenção Ambiental (PIA)', obs: '2% em áreas acima de 100 hectares' },
                                { id: 'f5_preservacao', label: 'Projeto de preservação da vegetação nativa' },
                                { id: 'f5_plantio', label: 'Projeto de plantio para reposição florestal' },
                                { id: 'f5_alternativa', label: 'Alternativa locacional para corte de espécies ameaçadas de extinção' },
                                { id: 'f5_ptrf', label: 'Proposta de compensação por intervenção ambiental (PTRF)' },
                                { id: 'f5_prada', label: 'Projeto de Reposição de Áreas Degradadas e Alteradas (PRADA)' },
                                { id: 'f5_compensacao_especies', label: 'Projeto de compensação de espécies protegidas/ameaçadas' },
                                { id: 'f5_relatorio_fauna', label: 'Relatório de fauna' },
                                { id: 'f5_monitoramento_fauna', label: 'Programa de monitoramento e afugentamento de fauna' },
                            ])}
                        </AccordionContent>
                    </AccordionItem>
                     <AccordionItem value="fase6">
                        <AccordionTrigger>Fase 6: Outros</AccordionTrigger>
                        <AccordionContent>
                            {renderCheckboxList([
                                { id: 'f6_sinaflor', label: 'SINAFLOR' },
                                { id: 'f6_comp_taxas', label: 'Comp. de pagamento das taxas' },
                                { id: 'f6_requerimento', label: 'Requerimento' },
                            ])}
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="fase7">
                        <AccordionTrigger>Fase 7: Protocolo</AccordionTrigger>
                         <AccordionContent>
                             <div className="flex items-center justify-center h-24 border-2 border-dashed rounded-lg">
                                <p className="text-muted-foreground text-sm">Ações de protocolo aqui.</p>
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            </CardContent>
        </Card>
    )
};

const ReservaLegalCard = () => (
    <Card>
        <CardHeader>
        <CardTitle>Detalhes da Reserva Legal</CardTitle>
        <CardDescription>Preencha as informações para o processo de reserva legal.</CardDescription>
        </CardHeader>
        <CardContent>
        <div className="flex items-center justify-center h-32 border-2 border-dashed rounded-lg">
            <p className="text-muted-foreground">Campos do formulário de reserva legal aqui.</p>
        </div>
        </CardContent>
    </Card>
);

const UsoInsignificanteCard = () => (
    <Card>
        <CardHeader>
        <CardTitle>Detalhes do Uso Insignificante</CardTitle>
        <CardDescription>Preencha as informações para o cadastro de uso insignificante.</CardDescription>
        </CardHeader>
        <CardContent>
        <div className="flex items-center justify-center h-32 border-2 border-dashed rounded-lg">
            <p className="text-muted-foreground">Campos do formulário de uso insignificante aqui.</p>
        </div>
        </CardContent>
    </Card>
);


function EditRequestPageContent() {
    const router = useRouter();
    const params = useParams();
    const { firestore } = useFirebase();
    const { toast } = useToast();

    const requestId = params.id as string;

    const requestDocRef = useMemoFirebase(() => (firestore && requestId ? doc(firestore, 'requests', requestId) : null), [firestore, requestId]);
    const { data: request, isLoading: isLoadingRequest } = useDoc<Request>(requestDocRef);

    const [selectedEmpreendedor, setSelectedEmpreendedor] = React.useState('');
    const [selectedEmpreendimento, setSelectedEmpreendimento] = React.useState('');
    const [selectedServices, setSelectedServices] = React.useState<string[]>([]);
    const [loading, setLoading] = React.useState(false);

    const empreendedoresQuery = useMemoFirebase(() => firestore ? collection(firestore, 'empreendedores') : null, [firestore]);
    const { data: empreendedores, isLoading: isLoadingEmpreendedores } = useCollection<Empreendedor>(empreendedoresQuery);

    const projectsQuery = useMemoFirebase(() => firestore ? collection(firestore, 'projects') : null, [firestore]);
    const { data: allProjects, isLoading: isLoadingProjects } = useCollection<Project>(projectsQuery);
    
    React.useEffect(() => {
        if (request) {
            setSelectedEmpreendedor(request.empreendedorId);
            setSelectedEmpreendimento(request.projectId);
            setSelectedServices(request.services);
        }
    }, [request]);

    const filteredProjects = React.useMemo(() => {
        if (!selectedEmpreendedor || !allProjects) return [];
        return allProjects.filter(p => p.empreendedorId === selectedEmpreendedor);
    }, [selectedEmpreendedor, allProjects]);

    const handleServiceChange = (service: string) => {
        setSelectedServices(prev => 
            prev.includes(service) 
            ? prev.filter(s => s !== service) 
            : [...prev, service]
        );
    };

    const isFormValid = selectedEmpreendedor && selectedEmpreendimento && selectedServices.length > 0;

    const handleUpdateProcess = async () => {
        if (!isFormValid || !firestore || !request) return;
        setLoading(true);
        // Lógica para atualizar o processo no banco
        await new Promise(resolve => setTimeout(resolve, 1000));
        toast({ title: "Processo Atualizado", description: "As alterações foram salvas."});
        setLoading(false);
        router.push('/requests');
    };
    
    const serviceCardMap: Record<string, React.ComponentType> = {
        "Licenciamento ambiental": LicenciamentoCard,
        "Outorga": OutorgaCard,
        "Autorização para Intervenção Ambiental": IntervencaoCard,
        "Reserva legal (Averbação, Compensação e/ou Relocação)": ReservaLegalCard,
        "Uso Insignificante": UsoInsignificanteCard
    };

    const isLoading = isLoadingRequest || isLoadingEmpreendedores || isLoadingProjects;
    
    if (isLoading) {
        return (
             <div className="flex flex-col h-full">
                <PageHeader title="Carregando Processo..." />
                <main className="flex-1 overflow-auto p-4 md:p-6"><Skeleton className="h-[500px] w-full" /></main>
            </div>
        );
    }
    
    if (!request && !isLoading) {
        return (
            <div className="flex flex-col h-full">
               <PageHeader title="Erro" />
               <main className="flex-1 overflow-auto p-4 md:p-6">
                    <Card><CardHeader><CardTitle>Processo não encontrado</CardTitle></CardHeader></Card>
               </main>
           </div>
        )
    }

    return (
        <div className="flex flex-col h-full">
            <PageHeader title={`Editando Processo #${request?.solicitationNumber || request?.id.substring(0,8).toUpperCase()}`} />
            <main className="flex-1 overflow-auto p-4 md:p-6">
                <div className="max-w-4xl mx-auto space-y-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>Editar Processo</CardTitle>
                            <CardDescription>Altere as informações do processo conforme necessário.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="empreendedor">Empreendedor</Label>
                                    <Select value={selectedEmpreendedor} onValueChange={setSelectedEmpreendedor} disabled={isLoadingEmpreendedores}>
                                        <SelectTrigger id="empreendedor">
                                            <SelectValue placeholder={isLoadingEmpreendedores ? "Carregando..." : "Selecione o empreendedor"} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {empreendedores?.map(emp => (
                                                <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="empreendimento">Empreendimento</Label>
                                    <Select value={selectedEmpreendimento} onValueChange={setSelectedEmpreendimento} disabled={!selectedEmpreendedor || isLoadingProjects}>
                                        <SelectTrigger id="empreendimento">
                                            <SelectValue placeholder={!selectedEmpreendedor ? "Selecione um empreendedor primeiro" : "Selecione o empreendimento"} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {filteredProjects.map(proj => (
                                                <SelectItem key={proj.id} value={proj.id}>{proj.propertyName}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="space-y-2 pt-4">
                                <Label>Serviços Requeridos</Label>
                                <div className="space-y-2 rounded-md border p-4 grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
                                    {services.map(service => (
                                        <div key={service} className="flex items-center space-x-2">
                                            <Checkbox 
                                                id={service} 
                                                checked={selectedServices.includes(service)}
                                                onCheckedChange={() => handleServiceChange(service)}
                                            />
                                            <Label htmlFor={service} className="font-normal cursor-pointer">{service}</Label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {selectedServices.length > 0 && (
                        <div className="space-y-6">
                            <Separator />
                            <h2 className="text-2xl font-semibold tracking-tight">Detalhes dos Serviços</h2>
                            {selectedServices.map(service => {
                                const ServiceCard = serviceCardMap[service];
                                return ServiceCard ? <ServiceCard key={service} /> : null;
                            })}
                        </div>
                    )}
                    
                    <div className="flex justify-end gap-4 mt-6">
                        <Button variant="outline" onClick={() => router.push('/requests')}>Cancelar</Button>
                        <Button onClick={handleUpdateProcess} disabled={!isFormValid || loading}>
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Salvar Alterações
                        </Button>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default function EditRequestPage() {
    return (
        <Suspense fallback={
             <div className="flex flex-col h-full">
                <PageHeader title="Carregando Processo..." />
                <main className="flex-1 overflow-auto p-4 md:p-6"><Skeleton className="h-96 w-full" /></main>
            </div>
        }>
            <EditRequestPageContent />
        </Suspense>
    );
}
