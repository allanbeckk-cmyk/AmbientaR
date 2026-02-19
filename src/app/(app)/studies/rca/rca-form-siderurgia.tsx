
'use client';
import * as React from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import type { Empreendedor as Client, Project, OwnerCondition, Datum, CoordinateFormat, Fuso, RegularizacaoSituacao, ManagementCategory, Jurisdiction, Biome, AtividadeAgricola, ZeeGeofisicoItem, ZeeSocioeconomicoItem } from '@/lib/types';
import { Textarea } from '@/components/ui/textarea';
import { PlusCircle, Trash2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface RcaFormSiderurgiaProps {
    form: any;
    clients: Client[];
    isLoadingClients: boolean;
    projects: Project[];
    isLoadingProjects: boolean;
}

const ownerConditions: { value: OwnerCondition, label: string }[] = [
    { value: 'Proprietário', label: 'Proprietário' },
    { value: 'Arrendatário', label: 'Arrendatário' },
    { value: 'Parceiro', label: 'Parceiro' },
    { value: 'Posseiro', label: 'Posseiro' },
    { value: 'Outros', label: 'Outros' },
];

const datums: { value: Datum, label: string }[] = [
    { value: 'SAD-69', label: 'SAD 69' },
    { value: 'WGS-84', label: 'WGS 84' },
    { value: 'Córrego Alegre', label: 'Córrego Alegre' },
];

const fusos: { value: Fuso, label: string }[] = [
    { value: '22', label: '22' },
    { value: '23', label: '23' },
    { value: '24', label: '24' },
];

const regularizacaoSituacoes: RegularizacaoSituacao[] = ['Regularizada', 'Em Análise', 'Não Regularizada'];

const biomas: { value: Biome; label: string }[] = [
    { value: 'Cerrado', label: 'Cerrado' },
    { value: 'Mata Atlântica', label: 'Mata Atlântica' },
    { value: 'Outro', label: 'Outro' },
];

const nativeVegetationTypes = [
    'Floresta Ombrófila Sub Montana', 'Floresta Ombrófila Montana', 'Floresta Ombrófila Alto Montana',
    'Floresta Estacional Semidecidual Sub Montana', 'Floresta Estacional Semidecidual Montana',
    'Floresta Estacional Decidual Sub Montana', 'Floresta Estacional Decidual Montana', 'Campo',
    'Campo Rupestre', 'Campo Cerrado', 'Cerrado', 'Cerradão', 'Vereda', 'Outro'
];

const managementCategories: { value: ManagementCategory, label: string }[] = [
    { value: 'Uso Sustentável', label: 'Uso Sustentável' },
    { value: 'Proteção Integral', label: 'Proteção Integral' },
];

const jurisdictions: { value: Jurisdiction, label: string }[] = [
    { value: 'Federal', label: 'Federal' },
    { value: 'Estadual', label: 'Estadual' },
    { value: 'Municipal', label: 'Municipal' },
    { value: 'Privada', label: 'Privada' },
];

const zeeGeofisicoOptions = [
    { id: 'potencialidadeSocial', label: 'Potencialidade Social', options: ['Muito precário', 'Precário', 'Pouco favorável', 'Favorável', 'Muito favorável'] },
    { id: 'vulnerabilidadeNatural', label: 'Vulnerabilidade natural', options: ['Muito baixa', 'Baixa', 'Média', 'Alta', 'Muito Alta'] },
    { id: 'suscetibilidadeErosao', label: 'Suscetibilidade à erosão', options: ['Muito baixa', 'Baixa', 'Média', 'Alta', 'Muito Alta'] },
    { id: 'riscoAmbiental', label: 'Risco ambiental', options: ['Muito baixa', 'Baixa', 'Média', 'Alta', 'Muito Alta'] },
    { id: 'qualidadeAguaSuperficial', label: 'Qualidade da água superficial', options: ['Muito baixa', 'Baixa', 'Média', 'Alta', 'Muito Alta', 'Total Comprometido'] },
    { id: 'indiceHidrico', label: 'Índice Hídrico', options: ['A – Superúmido', 'C1 – Subúmido', 'C2 – Subúmido', 'D – Semi-ardido', 'B2 – Úmido', 'B3 – Úmido', 'B4 – Úmido'] },
    { id: 'vulnerabilidadeContaminacaoSolo', label: 'Vulnerabilidade de contaminação do solo', options: ['Muito baixa', 'Baixa', 'Média', 'Alta', 'Muito Alta'] },
    { id: 'vulnerabilidadeAguaSuperficial', label: 'Vulnerabilidade natural associada à disponibilidade Natural de Água Superficial', options: ['Muito baixa', 'Baixa', 'Média', 'Alta', 'Muito Alta'] },
    { id: 'taxaMateriaOrganicaSolo', label: 'Taxa de matéria orgânica do solo', options: ['Muito baixa', 'Baixa', 'Média', 'Alta', 'Muito Alta', 'Total Comprometido'] },
    { id: 'integridadeFauna', label: 'Integridade da Fauna', options: ['Muito baixa', 'Baixa', 'Média', 'Alta', 'Muito Alta'] },
    { id: 'integridadeFlora', label: 'Integridade da Flora', options: ['Muito baixa', 'Baixa', 'Média', 'Alta', 'Muito Alta'] },
    { id: 'exposicaoSolo', label: 'Exposição do Solo', options: ['Muito baixa', 'Baixa', 'Média', 'Alta', 'Muito Alta'] },
    { id: 'vulnerabilidadeCompactacaoSolo', label: 'Vulnerabilidade de Compactação do Solo', options: ['Muito baixa', 'Baixa', 'Média', 'Alta', 'Muito Alta', 'Total Comprometido'] },
];

const anexoOptions = [
    { id: 'anexo1', label: 'Anexo I – Uso do Solo' },
    { id: 'anexo2', label: 'Anexo II – Processo de Licenciamento para empreendimento.' },
    { id: 'anexo3', label: 'Anexo III – Relatório Fotográfico' },
    { id: 'anexo4', label: 'Anexo IV – Cópia das ART’s e comprovante de pagamento de taxa.' },
    { id: 'anexo5', label: 'Anexo V – Planta de situação do Sistema de tratamento de efluentes sanitários, contendo o direcionamento dos fluxos e localização das unidades de tratamento.' },
    { id: 'anexo6', label: 'Anexo VI – Identificação das partes reclamantes.' },
    { id: 'anexo7', label: 'Anexo VII – Cópia do programa de educação ambiental desenvolvido pela empresa.' },
    { id: 'anexo8', label: 'Anexo VIII – Anuência do órgão gestor.' },
    { id: 'outros', label: 'Outros' },
];


export function RcaFormSiderurgia({ form, clients, isLoadingClients, projects, isLoadingProjects }: RcaFormSiderurgiaProps) {
    
    const selectedClientId = form.watch('empreendedor.clientId');
    const selectedProjectId = form.watch('empreendimento.projectId');
    const correspondenceIsSame = form.watch('empreendimento.correspondenceIsSame');
    const fazUsoAgendaVerde = form.watch('agendaVerde.fazUso');
    const fazUsoAgendaAzul = form.watch('agendaAzul.fazUsoAutorizacao');
    const inApp = form.watch('restricoesLocacionais.localizadoEmApp');
    const propertyHasApp = form.watch('restricoesLocacionais.propriedadePossuiApp');

    const { fields: outrosProfissionaisFields, append: appendOutroProfissional, remove: removeOutroProfissional } = useFieldArray({ control: form.control, name: 'responsaveisEstudo.outrosProfissionais' });
    const { fields: reatoresFields, append: appendReator, remove: removeReator } = useFieldArray({ control: form.control, name: 'reatores' });
    const { fields: efluentesHibridosReatorFields, append: appendEfluenteReator, remove: removeEfluenteReator } = useFieldArray({ control: form.control, name: 'efluentesHidricosReatores' });
    const { fields: emissoesResiduosReatorFields, append: appendEmissaoResiduoReator, remove: removeEmissaoResiduoReator } = useFieldArray({ control: form.control, name: 'emissoesResiduosReatores' });


    
    React.useEffect(() => {
        if (selectedClientId) {
          const client = clients?.find(c => c.id === selectedClientId);
          if (client) {
            form.setValue('empreendedor.nome', client.name || '');
            form.setValue('empreendedor.cpfCnpj', client.cpfCnpj || '');
            form.setValue('empreendedor.endereco', client.address || '');
            form.setValue('empreendedor.municipio', client.municipio || '');
            form.setValue('empreendedor.uf', client.uf || '');
            form.setValue('empreendedor.cep', client.cep || '');
            form.setValue('empreendedor.fone', client.phone || '');
            form.setValue('empreendedor.fax', client.fax || '');
            form.setValue('empreendedor.email', client.email || '');
            form.setValue('empreendedor.tipoPessoa', client.entityType === 'Pessoa Física' || client.entityType === 'Produtor Rural' ? 'Pessoa Física' : 'Pessoa Jurídica');
          }
        }
      }, [selectedClientId, clients, form]);
    
      React.useEffect(() => {
        if (selectedProjectId) {
          const project = projects?.find(p => p.id === selectedProjectId);
          if (project) {
            form.setValue('empreendimento.nome', project.propertyName || '');
            form.setValue('empreendimento.nomeFantasia', project.fantasyName || '');
            form.setValue('empreendimento.inscricaoIncra', project.incraCode || '');
            form.setValue('empreendimento.cnpj', project.cnpj || '');
            form.setValue('empreendimento.zonaRural', project.zoneType || 'Não');
            form.setValue('empreendimento.endereco', project.address || '');
            form.setValue('empreendimento.caixaPostal', project.caixaPostal || '');
            form.setValue('empreendimento.municipio', project.municipio || '');
            form.setValue('empreendimento.distrito', project.district || '');
            form.setValue('empreendimento.uf', project.uf || '');
            form.setValue('empreendimento.cep', project.cep || '');
            form.setValue('empreendimento.fone', project.clientId && clients ? clients.find(c => c.id === project.clientId)?.phone || '' : '');
            form.setValue('empreendimento.fax', project.clientId && clients ? clients.find(c => c.id === project.clientId)?.fax || '' : '');
            form.setValue('empreendimento.email', project.clientId && clients ? clients.find(c => c.id === project.clientId)?.email || '' : '');
            form.setValue('empreendimento.inscricaoEstadual', project.inscricaoEstadual || '');
            form.setValue('empreendimento.inscricaoMunicipal', project.inscricaoMunicipal || '');
          }
        }
      }, [selectedProjectId, projects, clients, form]);
    
    return (
        <Accordion type="multiple" defaultValue={['item-1']} className="w-full">
            <AccordionItem value="item-1">
                <AccordionTrigger>MÓDULO 1 - IDENTIFICAÇÃO</AccordionTrigger>
                 <AccordionContent className="space-y-6 p-1">
                    {/* Conteúdo do Módulo 1 (geral) */}
                </AccordionContent>
            </AccordionItem>
             <AccordionItem value="item-2">
                <AccordionTrigger>MÓDULO 2 - REGULARIZAÇÃO AMBIENTAL</AccordionTrigger>
                 <AccordionContent className="space-y-6">
                    {/* Conteúdo do Módulo 2 (geral) */}
                </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3">
                <AccordionTrigger>MÓDULO 3 - RESTRIÇÕES AMBIENTAIS</AccordionTrigger>
                 <AccordionContent className="space-y-6">
                    {/* Conteúdo do Módulo 3 (geral) */}
                </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-4">
                <AccordionTrigger>MÓDULO 4 - CARACTERIZAÇÃO DO EMPREENDIMENTO E ENTORNO</AccordionTrigger>
                <AccordionContent className="space-y-6 p-1">
                    <div className="space-y-4 p-4 border rounded-md">
                        <h3 className="font-semibold">30. CARACTERÍSTICAS DOS REATORES (ALTOS FORNOS)</h3>
                         <div className="flex justify-end">
                            <Button size="sm" type="button" onClick={() => appendReator({})}><PlusCircle className="mr-2 h-4 w-4" /> Adicionar Reator</Button>
                        </div>
                        {reatoresFields.map((item, index) => (
                             <div key={item.id} className="p-4 border rounded-md space-y-4 relative">
                                <Button type="button" variant="destructive" size="icon" className="absolute top-2 right-2 h-6 w-6" onClick={() => removeReator(index)}><Trash2 className="h-4 w-4" /></Button>
                                <h4 className="font-medium">Reator Alto Forno {index + 1}</h4>
                                <FormField control={form.control} name={`reatores.${index}.dataInstalacao`} render={({ field }) => (<FormItem><FormLabel>Data da Instalação</FormLabel><FormControl><Input type="date" {...field} /></FormControl></FormItem>)} />
                                 <FormField control={form.control} name={`reatores.${index}.principalCombustivel`} render={({ field }) => (<FormItem>
                                     <FormLabel>Principal Combustível</FormLabel><FormControl>
                                        <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex space-x-4">
                                            <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="Carvão Vegetal" /></FormControl><FormLabel className="font-normal">Carvão Vegetal</FormLabel></FormItem>
                                            <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="Coque" /></FormControl><FormLabel className="font-normal">Coque</FormLabel></FormItem>
                                        </RadioGroup>
                                    </FormControl>
                                 </FormItem>)} />
                                <FormField control={form.control} name={`reatores.${index}.volumeUtil`} render={({ field }) => (<FormItem><FormLabel>Volume útil (m³)</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>)} />
                                <FormField control={form.control} name={`reatores.${index}.capacidadeInstalada`} render={({ field }) => (<FormItem><FormLabel>Capacidade Instalada (T/dia)</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>)} />
                                {/* ... mais campos do reator ... */}
                             </div>
                        ))}
                    </div>
                </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-5">
                <AccordionTrigger>MÓDULO 5 – QUADRO RESUMO DOS POSSÍVEIS IMPACTOS AMBIENTAIS</AccordionTrigger>
                 <AccordionContent className="space-y-6">
                    {/* Conteúdo do Módulo 5 */}
                </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-6">
                <AccordionTrigger>MÓDULO 6 – ZONEAMENTO ECOLÓGICO ECONÔMICO</AccordionTrigger>
                 <AccordionContent className="space-y-6">
                    {/* Conteúdo do Módulo 6 */}
                </AccordionContent>
            </AccordionItem>
             <AccordionItem value="item-7">
                <AccordionTrigger>MÓDULO 7 ANEXOS QUE ACOMPANHAM O PRESENTE RELATÓRIO</AccordionTrigger>
                 <AccordionContent className="space-y-6">
                    {/* Conteúdo do Módulo 7 */}
                </AccordionContent>
            </AccordionItem>
        </Accordion>
    );
}
