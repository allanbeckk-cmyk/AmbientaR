
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

interface RcaFormCulturasProps {
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

const dn130Commitments = [
    { id: "rl_fogo", label: "Proteger Reserva Legal contra fogo" },
    { id: "rl_pisoteio", label: "Proteger Reserva Legal contra pisoteio de animais domésticos" },
    { id: "app_fogo", label: "Proteger e preservar a APP contra fogo" },
    { id: "app_pisoteio", label: "Proteger e preservar a APP contra pisoteio de animais domésticos" }
];

const dn130Practices = [
    { id: "agrotoxicos", label: "Utiliza corretamente agrotóxicos" },
    { id: "embalagens_agrotoxico", label: "Destina adequadamente as embalagens de agrotóxico" },
    { id: "residuos_domesticos", label: "Destina adequadamente os resíduos domésticos" },
    { id: "controle_sanitario", label: "Possui controle sanitário efetivo" },
    { id: "conservacao_solo_agua_biota", label: "Utiliza práticas de conservação do solo, água e biota; inclusive adoção de sistema de produção integração lavoura-pecuária-floresta e suas variações, cultivos orgânicos ou atividades classificadas no Programa de Manejo Integrado de Pragas do MAPA" },
    { id: "outros_agroecologicos", label: "Utiliza outros sistemas agroecológicos" },
    { id: "biodigestores", label: "Utiliza biodigestores ou outras tecnologias apropriadas no sistema de tratamento de todos efluentes" },
    { id: "reserva_legal_preservada", label: "Possui reserva legal preservada com vegetação primária ou em qualquer estágio de regeneração acima do percentual legal" }
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
    { id: 'anexo1', label: 'Anexo I – Cópia autenticada do certificado de outorga(s), caso possua, e/ou protocolo de formalização de processo(s) de outorga em analise no órgão ambiental.' },
    { id: 'anexo2', label: 'Anexo II – Relatório gerado do zoneamento ecológico econômico (zee) de cada tipologia citada para o empreendimento.' },
    { id: 'anexo3', label: 'Anexo III – Cópia autenticada da certidão de registro de imóveis com averbação da reserva legal.' },
    { id: 'anexo4', label: 'Anexo IV – Cópia autenticada do documento de autorização para intervenção ambiental, caso haja intervenção em área de reserva legal e/ou área de preservação permanente (APP).' },
    { id: 'anexo5', label: 'Anexo V – Mapa(s) georeferenciado em escala adequada (entende-se por escala adequada aquela capaz de apresentar todas informações contidas no mapa sem gerar distorções desta).' },
    { id: 'anexo6', label: 'Anexo VI – Fluxograma de todas etapas do processo produtivo do empreendimento.' },
    { id: 'anexo7', label: 'Anexo VII – Laudo de analise físico-química do efluente líquido industrial bruto/tratado.' },
    { id: 'anexo8', label: 'Anexo VIII – Cópia das ART’s e comprovante de pagamento de taxa.' },
    { id: 'anexo9', label: 'Anexo IX – Croqui de acesso ao empreendimento.' },
    { id: 'anexo10', label: 'Anexo X – Relatório fotográfico do local do empreendimento.' },
    { id: 'anexo11', label: 'Anexo XI – Anuência do órgão gestor.' },
    { id: 'outros', label: 'Outros' },
];


export function RcaFormCulturas({ form, clients, isLoadingClients, projects, isLoadingProjects }: RcaFormCulturasProps) {
    
    const selectedClientId = form.watch('empreendedor.clientId');
    const selectedProjectId = form.watch('empreendimento.projectId');
    const correspondenceIsSame = form.watch('empreendimento.correspondenceIsSame');
    const fazUsoAgendaVerde = form.watch('agendaVerde.fazUso');
    const fazUsoAgendaAzul = form.watch('agendaAzul.fazUsoAutorizacao');
    const inApp = form.watch('restricoesLocacionais.localizadoEmApp');
    const propertyHasApp = form.watch('restricoesLocacionais.propriedadePossuiApp');

    const { fields: outrosProfissionaisFields, append: appendOutroProfissional, remove: removeOutroProfissional } = useFieldArray({ control: form.control, name: 'responsaveisEstudo.outrosProfissionais' });
    const { fields: analiseSoloFields, append: appendAnaliseSolo, remove: removeAnaliseSolo } = useFieldArray({ control: form.control, name: 'analiseSolo' });
    const { fields: olericulturaFields, append: appendOlericultura, remove: removeOlericultura } = useFieldArray({ control: form.control, name: 'atividadesAgricolas.olericultura' });
    const { fields: culturasAnuaisFields, append: appendCulturasAnuais, remove: removeCulturasAnuais } = useFieldArray({ control: form.control, name: 'atividadesAgricolas.culturasAnuais' });
    const { fields: culturasPerenesFields, append: appendCulturasPerenes, remove: removeCulturasPerenes } = useFieldArray({ control: form.control, name: 'atividadesAgricolas.culturasPerenes' });
    const { fields: irrigacaoFields, append: appendIrrigacao, remove: removeIrrigacao } = useFieldArray({ control: form.control, name: 'irrigacao' });
    const { fields: silviculturaFields, append: appendSilvicultura, remove: removeSilvicultura } = useFieldArray({ control: form.control, name: 'atividadesFlorestais.silvicultura' });
    const { fields: carvoejamentoFields, append: appendCarvoejamento, remove: removeCarvoejamento } = useFieldArray({ control: form.control, name: 'atividadesFlorestais.carvoejamento' });
    const { fields: agropecuariaFields, append: appendAgropecuaria, remove: removeAgropecuaria } = useFieldArray({ control: form.control, name: 'atividadesAgropecuarias' });
    const { fields: outrasAtividadesFields, append: appendOutraAtividade, remove: removeOutraAtividade } = useFieldArray({ control: form.control, name: 'outrasAtividades' });
    const { fields: infraestruturaFields, append: appendInfra, remove: removeInfra } = useFieldArray({ control: form.control, name: 'infraestrutura' });
    const { fields: equipamentoFields, append: appendEquipamento, remove: removeEquipamento } = useFieldArray({ control: form.control, name: 'equipamentos' });
    const { fields: insumoFields, append: appendInsumo, remove: removeInsumo } = useFieldArray({ control: form.control, name: 'insumos' });
    const { fields: residuoFields, append: appendResiduo, remove: removeResiduo } = useFieldArray({ control: form.control, name: 'residuosSolidos' });
    const { fields: efluentesDomesticosFields, append: appendEfluenteDomestico, remove: removeEfluenteDomestico } = useFieldArray({ control: form.control, name: "efluentesDomesticos" });
    const { fields: residuosDomesticosFields, append: appendResiduoDomestico, remove: removeResiduoDomestico } = useFieldArray({ control: form.control, name: "residuosDomesticos" });
    const { fields: impactosAmbientaisFields, append: appendImpactoAmbiental, remove: removeImpactoAmbiental } = useFieldArray({ control: form.control, name: "impactosAmbientais" });
    const { fields: analiseViabilidadeFields, append: appendAnaliseViabilidade, remove: removeAnaliseViabilidade } = useFieldArray({ control: form.control, name: "analiseViabilidadeLocacional" });
    const { fields: zeeSocioeconomicoFields, append: appendZeeSocio, remove: removeZeeSocio } = useFieldArray({ control: form.control, name: 'zeeSocioeconomico' });
    
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
                    <div className="space-y-4 p-4 border rounded-md">
                        <h3 className="font-semibold">1. IDENTIFICAÇÃO DO EMPREENDEDOR</h3>
                        <FormField control={form.control} name="empreendedor.clientId" render={({ field }: any) => (
                            <FormItem><FormLabel>Buscar Empreendedor Cadastrado</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoadingClients}><FormControl><SelectTrigger>
                                <SelectValue placeholder={isLoadingClients ? "Carregando..." : "Selecione um cliente"} />
                            </SelectTrigger></FormControl><SelectContent>{clients?.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="empreendedor.nome" render={({ field }) => (<FormItem><FormLabel>Nome</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <FormField control={form.control} name="empreendedor.cpfCnpj" render={({ field }) => (<FormItem><FormLabel>CPF/CNPJ</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                            <FormField control={form.control} name="empreendedor.identidade" render={({ field }) => (<FormItem><FormLabel>Identidade</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                            <FormField control={form.control} name="empreendedor.orgaoExpedidor" render={({ field }) => (<FormItem><FormLabel>Órgão Expedidor</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField control={form.control} name="empreendedor.endereco" render={({ field }) => (<FormItem><FormLabel>Endereço</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                            <FormField control={form.control} name="empreendedor.caixaPostal" render={({ field }) => (<FormItem><FormLabel>Caixa Postal</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <FormField control={form.control} name="empreendedor.municipio" render={({ field }) => (<FormItem><FormLabel>Município</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                            <FormField control={form.control} name="empreendedor.distrito" render={({ field }) => (<FormItem><FormLabel>Distrito</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                            <FormField control={form.control} name="empreendedor.uf" render={({ field }) => (<FormItem><FormLabel>UF</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                            <FormField control={form.control} name="empreendedor.cep" render={({ field }) => (<FormItem><FormLabel>CEP</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                        </div>
                        <FormField control={form.control} name="empreendedor.email" render={({ field }) => (<FormItem><FormLabel>E-mail</FormLabel><FormControl><Input type="email" {...field} /></FormControl></FormItem>)} />
                         <FormField
                            control={form.control}
                            name="empreendedor.tipoPessoa"
                            render={({ field }) => (
                                <FormItem className="space-y-3">
                                <FormLabel>Tipo de Pessoa</FormLabel>
                                <FormControl>
                                    <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex flex-col space-y-1 md:flex-row md:space-y-0 md:space-x-4">
                                        <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="Pessoa Física" /></FormControl><FormLabel className="font-normal">Pessoa Física</FormLabel></FormItem>
                                        <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="Pessoa Jurídica" /></FormControl><FormLabel className="font-normal">Pessoa Jurídica</FormLabel></FormItem>
                                    </RadioGroup>
                                </FormControl><FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField control={form.control} name="empreendedor.cadastroProdutorRural" render={({ field }) => (<FormItem><FormLabel>Cadastro de Produtor Rural – PR</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                        <FormField
                            control={form.control}
                            name="empreendedor.condicao"
                            render={({ field }) => (
                                <FormItem className="space-y-3">
                                <FormLabel>Condição do Empreendedor</FormLabel>
                                <FormControl>
                                    <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex flex-wrap gap-x-4 gap-y-2">
                                        {ownerConditions.map(c => <FormItem key={c.value} className="flex items-center space-x-2"><FormControl><RadioGroupItem value={c.value} /></FormControl><FormLabel className="font-normal">{c.label}</FormLabel></FormItem>)}
                                    </RadioGroup>
                                </FormControl><FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField control={form.control} name="empreendedor.cargo" render={({ field }) => (<FormItem><FormLabel>Cargo / Função</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                    </div>

                    {/* 2. IDENTIFICAÇÃO DO EMPREENDIMENTO */}
                    <div className="space-y-4 p-4 border rounded-md">
                         <h3 className="font-semibold">2. IDENTIFICAÇÃO DO EMPREENDIMENTO</h3>
                        <FormField control={form.control} name="empreendimento.projectId" render={({ field }) => (
                            <FormItem><FormLabel>Buscar Empreendimento Cadastrado</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoadingProjects}><FormControl><SelectTrigger>
                                <SelectValue placeholder={isLoadingProjects ? "Carregando..." : "Selecione um empreendimento"} />
                            </SelectTrigger></FormControl><SelectContent>{projects?.map(p => <SelectItem key={p.id} value={p.id}>{p.propertyName}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
                        )} />
                         <FormField control={form.control} name="empreendimento.nome" render={({ field }) => (<FormItem><FormLabel>Nome / Razão Social</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                        <div className="grid grid-cols-2 gap-4">
                            <FormField control={form.control} name="empreendimento.nomeFantasia" render={({ field }) => (<FormItem><FormLabel>Nome Fantasia</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                            <FormField control={form.control} name="empreendimento.cnpj" render={({ field }) => (<FormItem><FormLabel>CNPJ</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                        </div>
                        <FormField control={form.control} name="empreendimento.zonaRural" render={({ field }) => (<FormItem>
                            <FormLabel>Zona Rural?</FormLabel>
                            <FormControl><RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex items-center space-x-4">
                                <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="Sim" /></FormControl><FormLabel className="font-normal">Sim</FormLabel></FormItem>
                                <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="Não" /></FormControl><FormLabel className="font-normal">Não</FormLabel></FormItem>
                                <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="Residencial" /></FormControl><FormLabel className="font-normal">Residencial</FormLabel></FormItem>
                                <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="Comercial" /></FormControl><FormLabel className="font-normal">Comercial</FormLabel></FormItem>
                            </RadioGroup></FormControl>
                        </FormItem>)} />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField control={form.control} name="empreendimento.endereco" render={({ field }) => (<FormItem><FormLabel>Endereço</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                            <FormField control={form.control} name="empreendimento.caixaPostal" render={({ field }) => (<FormItem><FormLabel>Caixa Postal</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <FormField control={form.control} name="empreendimento.municipio" render={({ field }) => (<FormItem><FormLabel>Município</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                            <FormField control={form.control} name="empreendimento.distrito" render={({ field }) => (<FormItem><FormLabel>Distrito</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                            <FormField control={form.control} name="empreendimento.uf" render={({ field }) => (<FormItem><FormLabel>UF</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                            <FormField control={form.control} name="empreendimento.cep" render={({ field }) => (<FormItem><FormLabel>CEP</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                        </div>
                        <FormField control={form.control} name="empreendimento.email" render={({ field }) => (<FormItem><FormLabel>E-mail</FormLabel><FormControl><Input type="email" {...field} /></FormControl></FormItem>)} />
                        
                        <FormField
                            control={form.control}
                            name="empreendimento.correspondenceIsSame"
                            render={({ field }) => (
                                <FormItem className="space-y-2">
                                    <FormLabel>Os dados de correspondência são os mesmos do empreendimento?</FormLabel>
                                    <FormControl>
                                        <RadioGroup onValueChange={(val) => field.onChange(val === 'true')} defaultValue={String(field.value)} className="flex items-center space-x-4">
                                            <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="true" /></FormControl><FormLabel className="font-normal">Sim</FormLabel></FormItem>
                                            <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="false" /></FormControl><FormLabel className="font-normal">Não</FormLabel></FormItem>
                                        </RadioGroup>
                                    </FormControl>
                                </FormItem>
                            )}
                        />
                        {!correspondenceIsSame && (
                            <div className="space-y-4 pt-4 border-t">
                                <h4 className="font-medium">Endereço para Correspondência</h4>
                                 <FormField control={form.control} name="empreendimento.correspondenceAddress" render={({ field }) => ( <FormItem><FormLabel>Endereço</FormLabel><FormControl><Input {...field} /></FormControl></FormItem> )} />
                                {/* ... more correspondence fields */}
                            </div>
                        )}
                    </div>
                    
                     <div className="space-y-4 p-4 border rounded-md">
                        <h3 className="font-semibold">3. IDENTIFICAÇÃO DO RESPONSÁVEL PELA ÁREA AMBIENTAL</h3>
                         <FormField control={form.control} name="responsavelAmbiental.nome" render={({ field }) => (<FormItem><FormLabel>Nome</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                        <div className="grid grid-cols-2 gap-4">
                           <FormField control={form.control} name="responsavelAmbiental.cpf" render={({ field }) => (<FormItem><FormLabel>CPF</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                           <FormField control={form.control} name="responsavelAmbiental.registroConselho" render={({ field }) => (<FormItem><FormLabel>Registro no Conselho de Classe</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                        </div>
                        <FormField control={form.control} name="responsavelAmbiental.art" render={({ field }) => (<FormItem><FormLabel>ART/outro</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                        <FormField control={form.control} name="responsavelAmbiental.endereco" render={({ field }) => (<FormItem><FormLabel>Endereço</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                        <FormField control={form.control} name="responsavelAmbiental.email" render={({ field }) => (<FormItem><FormLabel>E-mail</FormLabel><FormControl><Input type="email" {...field} /></FormControl></FormItem>)} />
                    </div>

                    <div className="space-y-4 p-4 border rounded-md">
                        <h3 className="font-semibold">4. IDENTIFICAÇÃO DOS RESPONSÁVEIS PELO ESTUDO AMBIENTAL</h3>
                        <div className="space-y-4 p-4 border rounded-md">
                            <h4 className="font-semibold">EMPRESA</h4>
                            <FormField control={form.control} name="responsaveisEstudo.empresa.name" render={({ field }) => (<FormItem><FormLabel>Razão Social</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                            <FormField control={form.control} name="responsaveisEstudo.empresa.fantasyName" render={({ field }) => (<FormItem><FormLabel>Nome Fantasia</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                            <FormField control={form.control} name="responsaveisEstudo.empresa.cnpj" render={({ field }) => (<FormItem><FormLabel>CNPJ</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                        </div>
                         <div className="space-y-4 p-4 border rounded-md">
                            <h4 className="font-semibold">TÉCNICO</h4>
                            <FormField control={form.control} name="responsaveisEstudo.tecnicos.0.name" render={({ field }) => (<FormItem><FormLabel>Nome</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                            <FormField control={form.control} name="responsaveisEstudo.tecnicos.0.cpf" render={({ field }) => (<FormItem><FormLabel>CPF</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                        </div>
                         <div className="space-y-4 p-4 border rounded-md">
                            <div className='flex justify-between items-center'>
                                <h4 className="font-semibold">OUTROS PROFISSIONAIS QUE PARTICIPARAM DOS ESTUDOS</h4>
                                <Button size="sm" type="button" onClick={() => appendOutroProfissional({ estudo: '', nome: '', art: '' })}><PlusCircle className="mr-2 h-4 w-4" /> Adicionar</Button>
                            </div>
                            {outrosProfissionaisFields.map((item, index) => (
                                <div key={item.id} className="flex items-end gap-2 border p-2 rounded-md">
                                    <FormField control={form.control} name={`responsaveisEstudo.outrosProfissionais.${index}.estudo`} render={({ field }) => (<FormItem className='flex-1'><FormLabel>Estudo</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                                    <FormField control={form.control} name={`responsaveisEstudo.outrosProfissionais.${index}.nome`} render={({ field }) => (<FormItem className='flex-1'><FormLabel>Nome</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                                    <FormField control={form.control} name={`responsaveisEstudo.outrosProfissionais.${index}.art`} render={({ field }) => (<FormItem className='flex-1'><FormLabel>ART/outro</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                                    <Button type="button" variant="destructive" size="icon" onClick={() => removeOutroProfissional(index)}><Trash2 className="h-4 w-4" /></Button>
                                </div>
                            ))}
                        </div>
                    </div>


                    {/* 5. LOCALIZAÇÃO GEOGRÁFICA */}
                    <div className="space-y-4 p-4 border rounded-md">
                        <h3 className="font-semibold">5. LOCALIZAÇÃO GEOGRÁFICA</h3>
                        <FormField control={form.control} name="geographicLocation.datum" render={({ field }) => (
                            <FormItem className="space-y-2"><FormLabel>Assinalar Datum (Obrigatório)</FormLabel><FormControl>
                                <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex space-x-4">
                                    {datums.map(d => (<FormItem key={d.value} className="flex items-center space-x-2"><FormControl><RadioGroupItem value={d.value} /></FormControl><FormLabel className="font-normal">{d.label}</FormLabel></FormItem>))}
                                </RadioGroup>
                            </FormControl><FormMessage /></FormItem>
                        )} />
                        <p className="text-sm text-muted-foreground">Preencha a coordenada desejada em um dos formatos abaixo</p>
                        <div className="p-4 border rounded-md">
                            <h4 className="font-medium">Formato Lat/Long</h4>
                            <div className="grid grid-cols-2 gap-4 mt-2">
                                <div>
                                    <FormLabel>Latitude</FormLabel>
                                    <div className="grid grid-cols-3 gap-2 mt-1">
                                        <FormField control={form.control} name="geographicLocation.latLong.lat.grau" render={({ field }) => ( <FormItem><FormControl><Input placeholder="Grau" {...field}/></FormControl></FormItem> )} />
                                        <FormField control={form.control} name="geographicLocation.latLong.lat.min" render={({ field }) => ( <FormItem><FormControl><Input placeholder="Min" {...field}/></FormControl></FormItem> )} />
                                        <FormField control={form.control} name="geographicLocation.latLong.lat.seg" render={({ field }) => ( <FormItem><FormControl><Input placeholder="Seg" {...field}/></FormControl></FormItem> )} />
                                    </div>
                                </div>
                                <div>
                                    <FormLabel>Longitude</FormLabel>
                                    <div className="grid grid-cols-3 gap-2 mt-1">
                                        <FormField control={form.control} name="geographicLocation.latLong.long.grau" render={({ field }) => ( <FormItem><FormControl><Input placeholder="Grau" {...field}/></FormControl></FormItem> )} />
                                        <FormField control={form.control} name="geographicLocation.latLong.long.min" render={({ field }) => ( <FormItem><FormControl><Input placeholder="Min" {...field}/></FormControl></FormItem> )} />
                                        <FormField control={form.control} name="geographicLocation.latLong.long.seg" render={({ field }) => ( <FormItem><FormControl><Input placeholder="Seg" {...field}/></FormControl></FormItem> )} />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="p-4 border rounded-md">
                            <h4 className="font-medium">Formato UTM (X, Y)</h4>
                            <div className="grid grid-cols-2 gap-4 mt-2">
                                <FormField control={form.control} name="geographicLocation.utm.x" render={({ field }) => ( <FormItem><FormLabel>X (6 dígitos)</FormLabel><FormControl><Input {...field}/></FormControl><FormDescription>Não considerar casas decimais</FormDescription></FormItem> )} />
                                <FormField control={form.control} name="geographicLocation.utm.y" render={({ field }) => ( <FormItem><FormLabel>Y (7 dígitos)</FormLabel><FormControl><Input {...field}/></FormControl><FormDescription>Não considerar casas decimais</FormDescription></FormItem> )} />
                            </div>
                             <FormField
                                control={form.control}
                                name="geographicLocation.utm.fuso"
                                render={({ field }) => (
                                    <FormItem className="space-y-3 mt-4">
                                        <FormLabel>Fuso</FormLabel>
                                        <FormControl>
                                            <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex space-x-4">
                                                {fusos.map(f => (
                                                    <FormItem key={f.value} className="flex items-center space-x-2">
                                                        <FormControl><RadioGroupItem value={f.value} /></FormControl>
                                                        <FormLabel className="font-normal">{f.label}</FormLabel>
                                                    </FormItem>
                                                ))}
                                            </RadioGroup>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                         <FormField control={form.control} name="geographicLocation.local" render={({ field }) => (<FormItem><FormLabel>Local (fazenda, sítio, etc.)</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                         <FormField control={form.control} name="geographicLocation.hydrographicBasin" render={({ field }) => (<FormItem><FormLabel>Bacia Hidrográfica</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                         <FormField control={form.control} name="geographicLocation.upgrh" render={({ field }) => (<FormItem><FormLabel>UPGRH</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                         <FormField control={form.control} name="geographicLocation.nearestWaterCourse" render={({ field }) => (<FormItem><FormLabel>Curso d'água mais próximo</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />

                    </div>
                </AccordionContent>
            </AccordionItem>
             <AccordionItem value="item-2">
                <AccordionTrigger>MÓDULO 2 - REGULARIZAÇÃO AMBIENTAL</AccordionTrigger>
                <AccordionContent className="space-y-6">
                    <div className="space-y-4 p-4 border rounded-md">
                        <h3 className="font-semibold">6. ATIVIDADES DO EMPREENDIMENTO CONFORME DN 74/04</h3>
                        <div className="grid grid-cols-5 gap-4">
                            <FormField control={form.control} name="atividades.0.principal" render={({ field }) => (<FormItem className='col-span-2'><FormLabel>Atividade Principal</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                            <FormField control={form.control} name="atividades.0.codigo" render={({ field }) => (<FormItem><FormLabel>Código</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                            <FormField control={form.control} name="atividades.0.unidade" render={({ field }) => (<FormItem><FormLabel>Unidade</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                            <FormField control={form.control} name="atividades.0.quantidade" render={({ field }) => (<FormItem><FormLabel>Quantidade</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                        </div>
                    </div>
                    <div className="space-y-4 p-4 border rounded-md">
                        <h3 className="font-semibold">7. FASE DA REGULARIZAÇÃO AMBIENTAL</h3>
                        <FormField control={form.control} name="faseRegularizacao.isAmpliacao" render={({ field }) => (
                             <FormItem><FormLabel>A licença requerida é para ampliação ou modificação de empreendimento já licenciado?</FormLabel>
                                <FormControl><RadioGroup onValueChange={(v) => field.onChange(v === 'true')} defaultValue={String(field.value)} className="flex space-x-4">
                                    <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="false" /></FormControl><FormLabel className="font-normal">Não</FormLabel></FormItem>
                                    <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="true" /></FormControl><FormLabel className="font-normal">Sim</FormLabel></FormItem>
                                </RadioGroup></FormControl>
                             </FormItem>
                        )}/>
                        {form.watch('faseRegularizacao.isAmpliacao') && (
                            <FormField control={form.control} name="faseRegularizacao.processoAnterior" render={({ field }) => (<FormItem><FormLabel>Nº do processo</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                        )}
                        <FormField control={form.control} name="faseRegularizacao.fase" render={({ field }) => (
                             <FormItem><FormLabel>Fase</FormLabel>
                                <FormControl><RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex flex-col space-y-1">
                                    <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="LI" /></FormControl><FormLabel className="font-normal">Licença de Instalação (LI)</FormLabel></FormItem>
                                    <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="LIC" /></FormControl><FormLabel className="font-normal">Licença de Instalação Corretiva (LIC)</FormLabel></FormItem>
                                    <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="LP+LI" /></FormControl><FormLabel className="font-normal">Licença Prévia + Licença de Instalação (LP+LI)</FormLabel></FormItem>
                                    <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="LOC" /></FormControl><FormLabel className="font-normal">Licença de Operação Corretiva (LOC)</FormLabel></FormItem>
                                </RadioGroup></FormControl>
                             </FormItem>
                        )}/>
                        <FormField control={form.control} name="faseRegularizacao.classe" render={({ field }) => (<FormItem><FormLabel>Classe</FormLabel><FormControl><Input {...field} /></FormControl><FormDescription>Informação presente no FOB – Formulário de Orientação Básica.</FormDescription></FormItem>)} />
                    </div>
                    <div className="space-y-4 p-4 border rounded-md">
                        <h3 className="font-semibold">8. INTERVENÇÃO/ REGULARIZAÇÃO AMBIENTAL - AGENDA VERDE</h3>
                        <FormField control={form.control} name="agendaVerde.fazUso" render={({ field }) => (
                            <FormItem><FormLabel>Faz uso de Autorização / Regularização para Intervenção Ambiental?</FormLabel><FormControl>
                               <RadioGroup onValueChange={(v) => field.onChange(v === 'true')} defaultValue={String(field.value)} className="flex space-x-4">
                                    <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="true" /></FormControl><FormLabel className="font-normal">Sim</FormLabel></FormItem>
                                    <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="false" /></FormControl><FormLabel className="font-normal">Não</FormLabel></FormItem>
                                </RadioGroup>
                            </FormControl></FormItem>
                        )}/>
                        
                        {fazUsoAgendaVerde && (
                            <div className='space-y-2'>
                                <div className='grid grid-cols-2 gap-4 items-center'><FormLabel className='font-semibold'>Intervenção</FormLabel><FormLabel className='font-semibold'>Situação</FormLabel></div>
                                 <FormField control={form.control} name="agendaVerde.reservaLegal" render={({ field }) => (
                                    <div className='grid grid-cols-2 gap-4 items-center'><FormLabel>Regularização de Reserva Legal</FormLabel><FormControl><RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex space-x-2">
                                        {regularizacaoSituacoes.map(s => <FormItem key={s} className="flex items-center space-x-1"><FormControl><RadioGroupItem value={s} /></FormControl><FormLabel className="font-normal text-xs">{s}</FormLabel></FormItem>)}
                                    </RadioGroup></FormControl></div>
                                )}/>
                                 <FormField control={form.control} name="agendaVerde.ocupacaoApp" render={({ field }) => (
                                    <div className='grid grid-cols-2 gap-4 items-center'><FormLabel>Regularização de Ocupação Antrópica Consolidada ou Não Consolidada em APP</FormLabel><FormControl><RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex space-x-2">
                                        {regularizacaoSituacoes.map(s => <FormItem key={s} className="flex items-center space-x-1"><FormControl><RadioGroupItem value={s} /></FormControl><FormLabel className="font-normal text-xs">{s}</FormLabel></FormItem>)}
                                    </RadioGroup></FormControl></div>
                                )}/>
                                 {/* Add other fields similarly */}
                            </div>
                        )}
                    </div>
                     <div className="space-y-4 p-4 border rounded-md">
                        <h3 className="font-semibold">9. INTERVENÇÃO EM RECURSO HÍDRICO - AGENDA AZUL</h3>
                        <FormField control={form.control} name="agendaAzul.usaConcessionaria" render={({ field }) => (
                            <FormItem><FormLabel>Faz uso de Recurso Hídrico da Concessionária Local?</FormLabel><FormControl>
                               <RadioGroup onValueChange={(v) => field.onChange(v === 'true')} defaultValue={String(field.value)} className="flex space-x-4">
                                    <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="true" /></FormControl><FormLabel className="font-normal">Sim</FormLabel></FormItem>
                                    <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="false" /></FormControl><FormLabel className="font-normal">Não</FormLabel></FormItem>
                                </RadioGroup>
                            </FormControl></FormItem>
                        )}/>
                        {form.watch('agendaAzul.usaConcessionaria') && (
                            <FormField control={form.control} name="agendaAzul.concessionaria" render={({ field }) => (<FormItem><FormLabel>Qual?</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                        )}

                        <FormField control={form.control} name="agendaAzul.fazUsoAutorizacao" render={({ field }) => (
                            <FormItem><FormLabel>Faz uso de Autorização/ Regularização para Intervenção em Recurso Hídrico?</FormLabel><FormControl>
                               <RadioGroup onValueChange={(v) => field.onChange(v === 'true')} defaultValue={String(field.value)} className="flex space-x-4">
                                    <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="true" /></FormControl><FormLabel className="font-normal">Sim</FormLabel></FormItem>
                                    <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="false" /></FormControl><FormLabel className="font-normal">Não</FormLabel></FormItem>
                                </RadioGroup>
                            </FormControl></FormItem>
                        )}/>
                        {fazUsoAgendaAzul && (
                             <div className='space-y-2'>
                                <div className='grid grid-cols-2 gap-4 items-center'><FormLabel className='font-semibold'>Intervenção</FormLabel><FormLabel className='font-semibold'>Situação</FormLabel></div>
                                <FormField control={form.control} name="agendaAzul.captacaoCursoAgua" render={({ field }) => (
                                    <div className='grid grid-cols-2 gap-4 items-center'><FormLabel>Captação em curso de água</FormLabel><FormControl><RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex space-x-2">
                                        {regularizacaoSituacoes.map(s => <FormItem key={s} className="flex items-center space-x-1"><FormControl><RadioGroupItem value={s} /></FormControl><FormLabel className="font-normal text-xs">{s}</FormLabel></FormItem>)}
                                    </RadioGroup></FormControl></div>
                                )}/>
                                 <FormField control={form.control} name="agendaAzul.pocoTubular" render={({ field }) => (
                                    <div className='grid grid-cols-2 gap-4 items-center'><FormLabel>Poço tubular</FormLabel><FormControl><RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex space-x-2">
                                        {regularizacaoSituacoes.map(s => <FormItem key={s} className="flex items-center space-x-1"><FormControl><RadioGroupItem value={s} /></FormControl><FormLabel className="font-normal text-xs">{s}</FormLabel></FormItem>)}
                                    </RadioGroup></FormControl></div>
                                )}/>
                            </div>
                        )}
                     </div>
                </AccordionContent>
             </AccordionItem>
            <AccordionItem value="item-3">
                <AccordionTrigger>MÓDULO 3 - RESTRIÇÕES AMBIENTAIS</AccordionTrigger>
                 <AccordionContent className="space-y-6">
                    <div className="space-y-4 p-4 border rounded-md">
                        <h3 className="font-semibold">10. RESTRIÇÕES LOCACIONAIS</h3>
                        <FormField
                            control={form.control}
                            name="restricoesLocacionais.biome"
                            render={({ field }) => (
                                <FormItem className="space-y-3">
                                    <FormLabel>Qual Bioma o empreendimento está localizado?</FormLabel>
                                    <FormControl>
                                        <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex space-x-4">
                                            {biomas.map(b => (
                                                <FormItem key={b.value} className="flex items-center space-x-2">
                                                    <FormControl><RadioGroupItem value={b.value} /></FormControl>
                                                    <FormLabel className="font-normal">{b.label}</FormLabel>
                                                </FormItem>
                                            ))}
                                        </RadioGroup>
                                    </FormControl>
                                    {form.watch('restricoesLocacionais.biome') === 'Outro' && (
                                        <FormField control={form.control} name="restricoesLocacionais.biomeOutro" render={({ field }) => (<FormItem className='pt-2'><FormLabel>Qual?</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                                    )}
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="restricoesLocacionais.vegetacaoNativa"
                            render={() => (
                                <FormItem className='pt-4 border-t'>
                                    <FormLabel>O empreendimento está localizado em área com remanescente de formações vegetais nativas?</FormLabel>
                                    <FormDescription>Consulte o Inventário Florestal de Minas Gerais.</FormDescription>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                        {nativeVegetationTypes.map((item) => (
                                            <FormField key={item} control={form.control} name="restricoesLocacionais.vegetacaoNativa"
                                                render={({ field }) => {
                                                    return (
                                                        <FormItem className="flex flex-row items-start space-x-2 space-y-0">
                                                            <FormControl><Checkbox
                                                                checked={field.value?.includes(item)}
                                                                onCheckedChange={(checked) => {
                                                                    return checked
                                                                        ? field.onChange([...(field.value || []), item])
                                                                        : field.onChange(field.value?.filter((value) => value !== item));
                                                                }}
                                                            /></FormControl>
                                                            <FormLabel className="text-sm font-normal">{item}</FormLabel>
                                                        </FormItem>
                                                    )
                                                }}
                                            />
                                        ))}
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField control={form.control} name="restricoesLocacionais.localizadoEmApp" render={({ field }) => (
                            <FormItem className="space-y-2 rounded-md border p-3">
                                <FormLabel>O empreendimento está localizado em Área de Preservação Permanente – APP?</FormLabel>
                                <FormControl><RadioGroup onValueChange={(v) => field.onChange(v === 'true')} defaultValue={String(field.value)} className="flex space-x-4">
                                    <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="true" /></FormControl><FormLabel className="font-normal">Sim</FormLabel></FormItem>
                                    <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="false" /></FormControl><FormLabel className="font-normal">Não</FormLabel></FormItem>
                                </RadioGroup></FormControl>
                            </FormItem>
                        )}/>
                        <FormField control={form.control} name="restricoesLocacionais.propriedadePossuiApp" render={({ field }) => (
                            <FormItem className="space-y-2 rounded-md border p-3">
                                <FormLabel>O empreendimento se localiza em propriedade que possui Área de Preservação Permanente – APP?</FormLabel>
                                <FormControl><RadioGroup onValueChange={(v) => field.onChange(v === 'true')} defaultValue={String(field.value)} className="flex space-x-4">
                                    <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="true" /></FormControl><FormLabel className="font-normal">Sim</FormLabel></FormItem>
                                    <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="false" /></FormControl><FormLabel className="font-normal">Não</FormLabel></FormItem>
                                </RadioGroup></FormControl>
                            </FormItem>
                        )}/>
                        {(inApp || propertyHasApp) && (
                            <div className="pl-4 border-l-2 space-y-4">
                                <FormField control={form.control} name="restricoesLocacionais.appPreservada" render={({ field }) => (
                                    <FormItem className="space-y-2"><FormLabel>A APP se encontra comprovadamente preservada?</FormLabel><FormControl>
                                        <RadioGroup onValueChange={(v) => field.onChange(v === 'true')} defaultValue={String(field.value)} className="flex space-x-4">
                                            <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="true" /></FormControl><FormLabel className="font-normal">Sim</FormLabel></FormItem>
                                            <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="false" /></FormControl><FormLabel className="font-normal">Não</FormLabel></FormItem>
                                        </RadioGroup>
                                    </FormControl></FormItem>
                                )}/>
                                <FormField control={form.control} name="restricoesLocacionais.appProtegida" render={({ field }) => (
                                    <FormItem className="space-y-2"><FormLabel>A APP está protegida?</FormLabel><FormControl>
                                        <RadioGroup onValueChange={(v) => field.onChange(v === 'true')} defaultValue={String(field.value)} className="flex space-x-4">
                                            <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="true" /></FormControl><FormLabel className="font-normal">Sim</FormLabel></FormItem>
                                            <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="false" /></FormControl><FormLabel className="font-normal">Não</FormLabel></FormItem>
                                        </RadioGroup>
                                    </FormControl></FormItem>
                                )}/>
                            </div>
                        )}
                        <FormField control={form.control} name="restricoesLocacionais.areaCarstica" render={({ field }) => (
                            <FormItem className="space-y-2 rounded-md border p-3"><FormLabel>O empreendimento localiza-se totalmente ou em parte em área cárstica?</FormLabel><FormControl>
                                <RadioGroup onValueChange={(v) => field.onChange(v === 'true')} defaultValue={String(field.value)} className="flex space-x-4">
                                    <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="true" /></FormControl><FormLabel className="font-normal">Sim</FormLabel></FormItem>
                                    <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="false" /></FormControl><FormLabel className="font-normal">Não</FormLabel></FormItem>
                                </RadioGroup>
                            </FormControl></FormItem>
                        )}/>
                        <FormField control={form.control} name="restricoesLocacionais.areaFluvialLacustre" render={({ field }) => (
                             <FormItem className="space-y-2 rounded-md border p-3"><FormLabel>O empreendimento localiza-se totalmente ou em parte em área fluvial/lacustre?</FormLabel><FormControl>
                                <RadioGroup onValueChange={(v) => field.onChange(v === 'true')} defaultValue={String(field.value)} className="flex space-x-4">
                                    <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="true" /></FormControl><FormLabel className="font-normal">Sim</FormLabel></FormItem>
                                    <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="false" /></FormControl><FormLabel className="font-normal">Não</FormLabel></FormItem>
                                </RadioGroup>
                            </FormControl></FormItem>
                        )}/>
                    </div>
                    <div className="space-y-4 p-4 border rounded-md">
                        <h3 className="font-semibold">11. UNIDADES DE CONSERVAÇÃO</h3>
                        <FormField control={form.control} name="unidadesConservacao.dentroOuRaio10km" render={({ field }) => (
                            <FormItem className="space-y-2"><FormLabel>O empreendimento está situado dentro de unidade de conservação ou dentro de zona de amortecimento de unidade de conservação?</FormLabel><FormControl>
                                <RadioGroup onValueChange={(v) => field.onChange(v === 'true')} defaultValue={String(field.value)} className="flex space-x-4">
                                    <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="true" /></FormControl><FormLabel className="font-normal">Sim</FormLabel></FormItem>
                                    <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="false" /></FormControl><FormLabel className="font-normal">Não</FormLabel></FormItem>
                                </RadioGroup>
                            </FormControl><FormDescription>Se sim, é necessário anuência do órgão gestor.</FormDescription></FormItem>
                        )}/>
                        {form.watch('unidadesConservacao.dentroOuRaio10km') && (
                            <div className="space-y-4 pt-4 border-t">
                                <FormField control={form.control} name="unidadesConservacao.distancia" render={({ field }) => (<FormItem><FormLabel>Distância</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                                <FormField control={form.control} name="unidadesConservacao.nomeUC" render={({ field }) => (<FormItem><FormLabel>Nome da UC</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                                <FormField control={form.control} name="unidadesConservacao.categoriaManejo" render={({ field }) => (
                                    <FormItem><FormLabel>Categoria de Manejo</FormLabel><FormControl><RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex space-x-4">
                                        {managementCategories.map(cat => <FormItem key={cat.value} className="flex items-center space-x-2"><FormControl><RadioGroupItem value={cat.value} /></FormControl><FormLabel className="font-normal">{cat.label}</FormLabel></FormItem>)}
                                    </RadioGroup></FormControl></FormItem>
                                )} />
                                <FormField control={form.control} name="unidadesConservacao.jurisdicao" render={({ field }) => (
                                    <FormItem><FormLabel>Jurisdição</FormLabel><FormControl><RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex space-x-4">
                                        {jurisdictions.map(j => <FormItem key={j.value} className="flex items-center space-x-2"><FormControl><RadioGroupItem value={j.value} /></FormControl><FormLabel className="font-normal">{j.label}</FormLabel></FormItem>)}
                                    </RadioGroup></FormControl></FormItem>
                                )} />
                                <FormField control={form.control} name="unidadesConservacao.orgaoGestor" render={({ field }) => (<FormItem><FormLabel>Órgão Gestor</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                            </div>
                        )}
                    </div>
                     <div className="space-y-4 p-4 border rounded-md">
                        <h3 className="font-semibold">12. CRITÉRIOS ADICIONAIS PARA ENQUADRAMENTO DE CLASSE, CONFORME DN 130/2008</h3>
                        <FormField control={form.control} name="criteriosDN130.possuiRPPN" render={({ field }) => (
                            <FormItem><FormLabel>Possui RPPN na propriedade?</FormLabel><FormControl><RadioGroup onValueChange={(v) => field.onChange(v === 'true')} defaultValue={String(field.value)} className="flex space-x-4">
                                <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="true" /></FormControl><FormLabel className="font-normal">Sim</FormLabel></FormItem>
                                <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="false" /></FormControl><FormLabel className="font-normal">Não</FormLabel></FormItem>
                            </RadioGroup></FormControl></FormItem>
                        )}/>
                        <FormField control={form.control} name="criteriosDN130.areaAntropizadaConsolidada" render={({ field }) => (
                            <FormItem><FormLabel>Localizado em área antropizada com ocupação consolidada?</FormLabel><FormControl><RadioGroup onValueChange={(v) => field.onChange(v === 'true')} defaultValue={String(field.value)} className="flex space-x-4">
                               <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="true" /></FormControl><FormLabel className="font-normal">Sim</FormLabel></FormItem>
                                <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="false" /></FormControl><FormLabel className="font-normal">Não</FormLabel></FormItem>
                            </RadioGroup></FormControl></FormItem>
                        )}/>
                         <FormField control={form.control} name="criteriosDN130.compromissos" render={() => (
                            <FormItem><FormLabel>Tem compromisso formal com Órgão competente?</FormLabel>
                                {dn130Commitments.map(item => (<FormField key={item.id} control={form.control} name="criteriosDN130.compromissos"
                                    render={({ field }) => (
                                    <FormItem className="flex flex-row items-center space-x-3 space-y-0"><FormControl>
                                        <Checkbox checked={field.value?.includes(item.id)} onCheckedChange={checked => checked ? field.onChange([...(field.value || []), item.id]) : field.onChange(field.value?.filter(v => v !== item.id))} />
                                    </FormControl><FormLabel className="font-normal">{item.label}</FormLabel></FormItem>
                                    )}
                                />))}
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="criteriosDN130.adotaSistemasReducaoVulnerabilidade" render={({ field }) => (
                            <FormItem><FormLabel>Adota Sistemas de produção e controle para redução da vulnerabilidade ambiental?</FormLabel><FormControl><RadioGroup onValueChange={(v) => field.onChange(v === 'true')} defaultValue={String(field.value)} className="flex space-x-4">
                               <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="true" /></FormControl><FormLabel className="font-normal">Sim</FormLabel></FormItem>
                                <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="false" /></FormControl><FormLabel className="font-normal">Não</FormLabel></FormItem>
                            </RadioGroup></FormControl></FormItem>
                        )}/>
                        {form.watch('criteriosDN130.adotaSistemasReducaoVulnerabilidade') && (
                             <FormField control={form.control} name="criteriosDN130.sistemasReducaoDescricao" render={({ field }) => (<FormItem><FormLabel>Descreva o sistema</FormLabel><FormControl><Textarea {...field} /></FormControl></FormItem>)} />
                        )}
                        <FormField control={form.control} name="criteriosDN130.praticasDesenvolvidas" render={() => (
                            <FormItem><FormLabel>Quais as práticas a seguir são desenvolvidas pelo empreendimento?</FormLabel><FormDescription>Apresentar em anexo o(s) atestado(s).</FormDescription>
                                {dn130Practices.map(item => (<FormField key={item.id} control={form.control} name="criteriosDN130.praticasDesenvolvidas"
                                    render={({ field }) => (
                                    <FormItem className="flex flex-row items-start space-x-3 space-y-0"><FormControl>
                                        <Checkbox checked={field.value?.includes(item.id)} onCheckedChange={checked => checked ? field.onChange([...(field.value || []), item.id]) : field.onChange(field.value?.filter(v => v !== item.id))} />
                                    </FormControl><FormLabel className="font-normal">{item.label}</FormLabel></FormItem>
                                    )}
                                />))}
                            </FormItem>
                        )} />
                    </div>
                </AccordionContent>
             </AccordionItem>
             {/* Outros módulos aqui */}
        </Accordion>
    );
}

    