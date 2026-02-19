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
import type { Empreendedor as Client, Project, OwnerCondition, Datum, CoordinateFormat, Fuso, RegularizacaoSituacao, ManagementCategory, Jurisdiction, Biome, ZeeGeofisicoItem, ZeeSocioeconomicoItem } from '@/lib/types';
import { Textarea } from '@/components/ui/textarea';
import { PlusCircle, Trash2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface RcaFormLavraSubterraneaProps {
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
    { id: 'anexo1', label: 'Anexo I – Cópias das ART’s e dos comprovantes de pagamento das taxas pertinentes.' },
    { id: 'anexo2', label: 'Anexo II - Anuência do IBAMA ou órgão competente para a intervenção/ supressão em área cárstica.' },
    { id: 'anexo3', label: 'Anexo III - Anuência do órgão gestor da UC e suas recomendações.' },
    { id: 'anexo4', label: 'Anexo IV - Comprovação de localização do empreendimento fora da zona rural. Ex: Guia de IPTU.' },
    { id: 'anexo5', label: 'Anexo V - Cópia do Termo de Compromisso de regularização de Reserva Legal assinado com o IEF.' },
    { id: 'anexo6', label: 'Anexo VI - Documento de averbação da reserva legal.' },
    { id: 'anexo7', label: 'Anexo VII - Comprovação da data de intervenção em APP dentro ou fora do terreno do empreendimento.' },
    { id: 'anexo8', label: 'Anexo VIII - Protocolo de solicitação de manifestação prévia do IBAMA.' },
    { id: 'anexo9', label: 'Anexo IX - Cópia manifestação prévia do IBAMA.' },
    { id: 'anexo10', label: 'Anexo X - Protocolo de solicitação de autorização do CODEMA.' },
    { id: 'anexo11', label: 'Anexo XI - Autorização do CODEMA.' },
    { id: 'anexo12', label: 'Anexo XII - Estudo de opções locacionais que justifique a escolha da área.' },
    { id: 'anexo13', label: 'Anexo XIII - Listagem das espécies endêmicas da fauna.' },
    { id: 'anexo14', label: 'Anexo XIV - Listagem das espécies endêmicas flora.' },
    { id: 'anexo15', label: 'Anexo XV - Listagem das espécies ameaçadas de extinção da fauna.' },
    { id: 'anexo16', label: 'Anexo XVI - Listagem das espécies ameaçadas de extinção da flora.' },
    { id: 'anexo17', label: 'Anexo XVII - Cópia da outorga de captação de água.' },
    { id: 'anexo18', label: 'Anexo XVIII - Cópia do protocolo do processo de outorga de captação de água.' },
    { id: 'anexo19', label: "Anexo XIX – Mapa georreferenciado recente da área do empreendimento, de acordo com ABNT/NBR 6492/1994, contendo a área do empreendimento como um todo; A delimitação do local onde a barragem será construída; Para o caso de alteamento, indicar na imagem, além da delimitação da área da barragem existente, a delimitação da nova área atingida após o alteamento; A delimitação das demais operações do empreendimento; Delimitação dos acessos existente e novos; Sub-bacia hidrográfica que contribuirá com aporte de águas pluviais para a barragem; Rede hidrográfica de toda a área do empreendimento e seu entorno; Mapa de uso e ocupação do solo, com a plotagem do uso e da ocupação; Trajeto, em superfície, do desenvolvimento da mina subterrânea; Área de reserva legal em empreendimento averbada; Áreas de APP; UC’s de uso sustentável e proteção integral (se houver). " },
    { id: 'anexo20', label: "Anexo XX - Mapa em detalhe do Uso e Ocupação do Solo contendo especificação do tipo de uso, localização do empreendimento, recursos hídricos e outros." },
    { id: 'anexo21', label: 'Anexo XXI - Cópia da anuência prévia do Departamento Nacional de Infraestrutura de Transporte – DNIT ou Departamento Estadual de Estradas de Rodagem – DER/MG.' },
    { id: 'anexo22', label: 'Anexo XXII - Cópia do cadastro destes dispositivos ou redes.' },
    { id: 'anexo23', label: 'Anexo XXIII - Croqui indicando as vias de acesso ao empreendimento, a partir de um ponto de fácil localização, devidamente discriminado, localizado na área urbana do município.' },
    { id: 'anexo24', label: 'Anexo XXIV - Justificativas tecnológicas que explicam a opção pelo empreendimento.' },
    { id: 'anexo25', label: 'Anexo XXV - Justificativas técnicas e socioeconômicas que explicam a opção pelo empreendimento.' },
    { id: 'anexo26', label: 'Anexo XXVI - Justificativas ambientais que explicam a opção pelo empreendimento.' },
    { id: 'anexo27', label: 'Anexo XXVII - Justificativas que explicam a opção pelo local do empreendimento.' },
    { id: 'anexo28', label: 'Anexo XXVIII - Contrato de arrendamento dos direitos minerados do processo de licenciamento mineral – DNPM.' },
    { id: 'anexo29', label: 'Anexo XXIX - Documento do DNPM que comprove a Atual fase dos direitos minerários.' },
    { id: 'anexo30', label: 'Anexo XXX - Planta de Detalhe Georreferenciada de acordo com a ABNT NBR 6492/1994, da poligonal do direito mineral; Áreas de servidão; Infra-estrutura; Ponto de embocação da mina; Pilhas de estéril e rejeitos; Áreas degradadas; Limites das propriedades dos superficiários e confrontantes; Delimitação do trajeto em superfície da mina subterrânea; Área de exploração; Toda rede hidrográfica; Delimitação das áreas propostas para intervenção em APP e/ou supressão de plotada em mapa de vegetação; Delimitação da reserva legal e delimitação das áreas de preservação permanente conforme Resolução CONAMA 369/2006, sobre base planialtimétrica – escala 1:10.000 ou em escala que permita a correta visualização do empreendimento. Poderá ser apresentado mais de uma planta, caso necessário.' },
    { id: 'anexo31', label: 'Anexo XXXI - Projeto de drenagem pluvial para cada acesso.' },
    { id: 'anexo32', label: 'Anexo XXXII - Programa de manutenção das estradas, contemplando ações e periodicidade.' },
    { id: 'anexo33', label: 'Anexo XXXIII - Planta indicando a localização de todos os acessos.' },
    { id: 'anexo34', label: 'Anexo XXXIV - Layout, projeto ou medidas de Controle contra descargas elétricas.' },
    { id: 'anexo35', label: 'Anexo XXXV - Mapa geológico e geomorfológico das áreas de influência do empreendimento.' },
    { id: 'anexo36', label: 'Anexo XXXVI - Projeto com medidas de controle para a disposição do material em pilhas, enchimento ou outros.' },
    { id: 'anexo37', label: 'Anexo XXXVII - Resultados dos ensaios estáticos e cinéticos de Potencial de Geração de Água Acida.' },
    { id: 'anexo38', label: 'Anexo XXXVIII - Projeto com locação, área, perfis topográficos dos locais de disposição do estéril, explicitando vias de acesso, sistemas de drenagem pluvial e rede hídrica.' },
    { id: 'anexo39', label: 'Anexo XXXIX - Plano de fechamento de Mina, nos termos da Portaria Nº 237, de 18 de outubro de 2001 do DNPM, NRM 20.' },
    { id: 'anexo40', label: 'Anexo XL - Tipos de explosivo e plano de fogo elaborado por profissional habilitado - Engenheiro de Minas.' },
    { id: 'anexo41', label: 'Anexo XLI - Protocolo com a solicitação do pedido de licença do exército.' },
    { id: 'anexo42', label: 'Anexo XLII - Projeto do paiol de explosivos, incluindo avaliação da incompatibilidade de materiais e projeto de combate a incêndio aprovado pelo corpo de bombeiros.' },
    { id: 'anexo43', label: 'Anexo XLIII - Projeto da ventilação.' },
    { id: 'anexo44', label: 'Anexo XLIV - Medidas para controle da qualidade do ar dentro da mina.' },
    { id: 'anexo45', label: 'Anexo XLV - Plano de monitoramento do nível do lençol no entorno da mina.' },
    { id: 'anexo46', label: 'Anexo XLVI - Comprovação através de estudo hidrogeológico.' },
    { id: 'anexo47', label: 'Anexo XLVII - Projeto do sistema de desaguamento da mina.' },
    { id: 'anexo48', label: 'Anexo XLVIII - Fluxograma do processo indicando a entrada das matérias primas, reagentes, insumos, água e saída de efluentes líquidos, emissões atmosféricas e resíduos. Ressaltar as atividades que ocorrem dentro da mina e as atividades que ocorrem fora da mina. Podem ser apresentados mais de um desenho, desde que sejam complementares.' },
    { id: 'anexo49', label: 'Anexo XLIX - Projeto do refeitório aprovado pela ANVISA, de acordo com a Resolução RDC 216/2004 da ANVISA.' },
    { id: 'anexo50', label: 'Anexo L - Aprovação do Projeto de Combate a Incêndio aprovado pelo corpo de bombeiros ou o protocolo do projeto no corpo de bombeiros.' },
    { id: 'anexo51', label: 'Anexo LI - Anuência da concessionária receptora de esgotos.' },
    { id: 'anexo52', label: 'Anexo LII – Anuência da concessionária receptora de esgotos sanitários.' },
    { id: 'anexo53', label: 'Anexo LIII - Figura com a localização dos pontos de monitoramento hídrico.' },
    { id: 'anexo54', label: 'Anexo LIV - Resultados do monitoramento de “background” das águas subterrâneas.' },
    { id: 'anexo55', label: 'Anexo LV - Resultados do monitoramento de “background” das águas superficiais.' },
    { id: 'anexo56', label: 'Anexo LVI - Identificação e avaliação dos prováveis impactos ambientais sobre os aspectos físicos, os bióticos e os socioeconômicos decorrentes da instalação do empreendimento.' },
    { id: 'anexo57', label: 'Anexo LVII - Medidas mitigadoras propostas e as ações de controle ambiental.' },
    { id: 'anexo58', label: 'Anexo LVIII - Justificativas técnicas e ambientais que viabilizam a implantação ou manutenção da operação do empreendimento no local pretendido.' },
    { id: 'anexo59', label: 'Anexo LIX - Outros anexos, se pertinente.' },
];


export function RcaFormLavraSubterranea({ form, clients, isLoadingClients, projects, isLoadingProjects }: RcaFormLavraSubterraneaProps) {
    
    const selectedClientId = form.watch('empreendedor.clientId');
    const selectedProjectId = form.watch('empreendimento.projectId');
    const correspondenceIsSame = form.watch('empreendimento.correspondenceIsSame');
    const fazUsoAgendaVerde = form.watch('agendaVerde.fazUso');
    const fazUsoAgendaAzul = form.watch('agendaAzul.fazUsoAutorizacao');
    const inApp = form.watch('restricoesLocacionais.inPermanentPreservationArea');
    const propertyHasApp = form.watch('restricoesLocacionais.propertyHasPermanentPreservationArea');

    const { fields: outrosProfissionaisFields, append: appendOutroProfissional, remove: removeOutroProfissional } = useFieldArray({ control: form.control, name: 'responsaveisEstudo.outrosProfissionais' });
    const { fields: analiseViabilidadeFields, append: appendAnaliseViabilidade, remove: removeAnaliseViabilidade } = useFieldArray({ control: form.control, name: "analiseViabilidadeLocacional" });
    const { fields: zeeSocioeconomicoFields, append: appendZeeSocio, remove: removeZeeSocio } = useFieldArray({ control: form.control, name: 'zeeSocioeconomico' });
    const { fields: efluentesIndustriaisFields, append: appendEfluente, remove: removeEfluente } = useFieldArray({ control: form.control, name: 'efluentesIndustriais' });
    const { fields: residuosSolidosGeradosFields, append: appendResiduoGerado, remove: removeResiduoGerado } = useFieldArray({ control: form.control, name: 'residuosSolidosGerados' });
    
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
            form.setValue('empreendedor.tipoPessoa', client.entityType?.includes('Pessoa Física') || client.entityType?.includes('Produtor Rural') ? 'Pessoa Física' : 'Pessoa Jurídica');
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
            form.setValue('empreendimento.fone', project.empreendedorId && clients ? clients.find(c => c.id === project.empreendedorId)?.phone || '' : '');
            form.setValue('empreendimento.fax', project.empreendedorId && clients ? clients.find(c => c.id === project.empreendedorId)?.fax || '' : '');
            form.setValue('empreendimento.email', project.empreendedorId && clients ? clients.find(c => c.id === project.empreendedorId)?.email || '' : '');
            form.setValue('empreendimento.inscricaoEstadual', project.inscricaoEstadual || '');
            form.setValue('empreendimento.inscricaoMunicipal', project.inscricaoMunicipal || '');
          }
        }
      }, [selectedProjectId, projects, clients, form]);
    
    return (
        <Accordion type="multiple" defaultValue={['item-1', 'item-2', 'item-3', 'item-4', 'item-5', 'item-6', 'item-7']} className="w-full">
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
                        <FormField control={form.control} name="empreendedor.nome" render={({ field }: any) => (<FormItem><FormLabel>Nome</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <FormField control={form.control} name="empreendedor.cpfCnpj" render={({ field }: any) => (<FormItem><FormLabel>CPF/CNPJ</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                            <FormField control={form.control} name="empreendedor.identidade" render={({ field }: any) => (<FormItem><FormLabel>Identidade</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                            <FormField control={form.control} name="empreendedor.orgaoExpedidor" render={({ field }: any) => (<FormItem><FormLabel>Órgão Expedidor</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                        </div>
                    </div>

                    {/* 2. IDENTIFICAÇÃO DO EMPREENDIMENTO */}
                    <div className="space-y-4 p-4 border rounded-md">
                         <h3 className="font-semibold">2. IDENTIFICAÇÃO DO EMPREENDIMENTO</h3>
                        <FormField control={form.control} name="empreendimento.projectId" render={({ field }: any) => (
                            <FormItem><FormLabel>Buscar Empreendimento Cadastrado</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoadingProjects}><FormControl><SelectTrigger>
                                <SelectValue placeholder={isLoadingProjects ? "Carregando..." : "Selecione um empreendimento"} />
                            </SelectTrigger></FormControl><SelectContent>{projects?.map(p => <SelectItem key={p.id} value={p.id}>{p.propertyName}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
                        )} />
                         <FormField control={form.control} name="empreendimento.nome" render={({ field }: any) => (<FormItem><FormLabel>Nome / Razão Social</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                    </div>
                    
                     <div className="space-y-4 p-4 border rounded-md">
                        <h3 className="font-semibold">3. IDENTIFICAÇÃO DO RESPONSÁVEL PELA ÁREA AMBIENTAL</h3>
                         <FormField control={form.control} name="responsavelAmbiental.nome" render={({ field }: any) => (<FormItem><FormLabel>Nome</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                    </div>

                    <div className="space-y-4 p-4 border rounded-md">
                        <h3 className="font-semibold">4. IDENTIFICAÇÃO DOS RESPONSÁVEIS PELO ESTUDO AMBIENTAL</h3>
                        <div className="space-y-4 p-4 border rounded-md">
                            <h4 className="font-semibold">EMPRESA</h4>
                            <FormField control={form.control} name="responsaveisEstudo.empresa.name" render={({ field }: any) => (<FormItem><FormLabel>Razão Social</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                        </div>
                         <div className="space-y-4 p-4 border rounded-md">
                            <h4 className="font-semibold">TÉCNICO</h4>
                            <FormField control={form.control} name="responsaveisEstudo.tecnicos.0.name" render={({ field }: any) => (<FormItem><FormLabel>Nome</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                        </div>
                    </div>


                    {/* 5. LOCALIZAÇÃO GEOGRÁFICA */}
                    <div className="space-y-4 p-4 border rounded-md">
                        <h3 className="font-semibold">5. LOCALIZAÇÃO GEOGRÁFICA</h3>
                         <FormField control={form.control} name="geographicLocation.local" render={({ field }: any) => (<FormItem><FormLabel>Local (fazenda, sítio, etc.)</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                    </div>
                </AccordionContent>
            </AccordionItem>
            {/* Omit other modules for brevity */}
        </Accordion>
    );
}
