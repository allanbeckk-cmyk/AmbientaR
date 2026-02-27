
'use client';

import * as React from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { MaskedInput } from '@/components/ui/masked-input';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Textarea } from '@/components/ui/textarea';
import type { FaunaStudy, Empreendedor, EnvironmentalCompany } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';


// Schema baseado no Termo de Referência, agora com a maioria dos campos opcionais
const formSchema = z.object({
  studyType: z.literal('inventario_projeto'),
  empreendedorId: z.string().min(1, "Selecione um empreendedor."),
  consultoriaId: z.string().min(1, "Selecione uma consultoria."),
  empreendedor: z.object({
    name: z.string().optional(),
    cpfCnpj: z.string().optional(),
    address: z.string().optional(),
    numero: z.string().optional(),
    bairro: z.string().optional(),
    municipio: z.string().optional(),
    uf: z.string().optional(),
    cep: z.string().optional(),
    phone: z.string().optional(),
    fax: z.string().optional(),
    email: z.string().optional(),
  }),
  consultoria: z.object({
    name: z.string().optional(),
    cnpj: z.string().optional(),
    address: z.string().optional(),
    numero: z.string().optional(),
    bairro: z.string().optional(),
    municipio: z.string().optional(),
    uf: z.string().optional(),
    cep: z.string().optional(),
    phone: z.string().optional(),
    fax: z.string().optional(),
    email: z.string().optional(),
  }),
  caracterizacaoEmpreendimento: z.string().optional(),
  caracterizacaoAreaEstudo: z.object({
      area: z.string().optional(),
      clima: z.string().optional(),
  }).optional(),
  caracterizacaoAmbientalSecundaria: z.string().optional(),
  listaEspeciesSecundaria: z.string().optional(),
  impactosPotenciais: z.object({
      vetores: z.string().optional(),
      analiseInteracao: z.string().optional(),
  }).optional(),
  metodologiaInventariamento: z.object({
    materiaisMetodos: z.string().optional(),
    modulosAmostrais: z.string().optional(),
    esforcoAmostral: z.string().optional(),
    cronogramaExecucao: z.string().optional(),
    destinoMaterialBiologico: z.string().optional(),
  }).optional(),
  equipes: z.string().optional(),
  referencias: z.string().optional(),
}).passthrough();


type FormValues = z.infer<typeof formSchema>;

interface InventarioFaunaFormProps {
    currentItem?: FaunaStudy | null;
    onSave: (data: FormValues, status: 'draft' | 'completed') => Promise<void>;
}

export function InventarioFaunaForm({ currentItem, onSave }: InventarioFaunaFormProps) {
  const [loading, setLoading] = React.useState(false);
  const router = useRouter();
  const { firestore } = useFirebase();

  const empreendedoresQuery = useMemoFirebase(() => firestore ? collection(firestore, 'empreendedores') : null, [firestore]);
  const { data: empreendedores, isLoading: isLoadingEmpreendedores } = useCollection<Empreendedor>(empreendedoresQuery);
  const consultoriasQuery = useMemoFirebase(() => firestore ? collection(firestore, 'environmentalCompanies') : null, [firestore]);
  const { data: consultorias, isLoading: isLoadingConsultorias } = useCollection<EnvironmentalCompany>(consultoriasQuery);
  
  const empreendedoresMap = React.useMemo(() => new Map(empreendedores?.map(e => [e.id, e])), [empreendedores]);
  const consultoriasMap = React.useMemo(() => new Map(consultorias?.map(c => [c.id, c])), [consultorias]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    // @ts-ignore
    defaultValues: currentItem && currentItem.studyType === 'inventario_projeto' ? currentItem : {
      studyType: 'inventario_projeto',
      empreendedor: { name: '', cpfCnpj: '', address: '', phone: '', email: '' },
      consultoria: { name: '', cnpj: '', address: '', phone: '', email: '' },
      caracterizacaoEmpreendimento: '',
      caracterizacaoAreaEstudo: { area: '', clima: '' },
      caracterizacaoAmbientalSecundaria: '',
      listaEspeciesSecundaria: '',
      impactosPotenciais: { vetores: '', analiseInteracao: '' },
      metodologiaInventariamento: { materiaisMetodos: '', modulosAmostrais: '', esforcoAmostral: '', cronogramaExecucao: '', destinoMaterialBiologico: '' },
      equipes: '',
      referencias: '',
    },
  });

  const selectedEmpreendedorId = form.watch('empreendedorId');
  const selectedConsultoriaId = form.watch('consultoriaId');

  React.useEffect(() => {
    if (selectedEmpreendedorId) {
      const empreendedor = empreendedoresMap.get(selectedEmpreendedorId);
      if (empreendedor) {
        form.setValue('empreendedor.name', empreendedor.name);
        form.setValue('empreendedor.cpfCnpj', empreendedor.cpfCnpj || '');
        form.setValue('empreendedor.address', empreendedor.address || '');
        form.setValue('empreendedor.numero', empreendedor.numero || '');
        form.setValue('empreendedor.bairro', empreendedor.bairro || '');
        form.setValue('empreendedor.municipio', empreendedor.municipio || '');
        form.setValue('empreendedor.uf', empreendedor.uf || '');
        form.setValue('empreendedor.cep', empreendedor.cep || '');
        form.setValue('empreendedor.phone', empreendedor.phone || '');
        form.setValue('empreendedor.fax', empreendedor.fax || '');
        form.setValue('empreendedor.email', empreendedor.email || '');
      }
    }
  }, [selectedEmpreendedorId, empreendedoresMap, form]);
  
  React.useEffect(() => {
    if (selectedConsultoriaId) {
      const consultoria = consultoriasMap.get(selectedConsultoriaId);
      if (consultoria) {
        form.setValue('consultoria.name', consultoria.name);
        form.setValue('consultoria.cnpj', consultoria.cnpj || '');
        form.setValue('consultoria.address', consultoria.address || '');
        form.setValue('consultoria.numero', consultoria.numero || '');
        // @ts-ignore
        form.setValue('consultoria.bairro', consultoria.district || ''); // Mapeando district para bairro
        form.setValue('consultoria.municipio', consultoria.municipio || '');
        form.setValue('consultoria.uf', consultoria.uf || '');
        form.setValue('consultoria.cep', consultoria.cep || '');
        form.setValue('consultoria.phone', consultoria.phone || '');
        form.setValue('consultoria.fax', consultoria.fax || '');
        form.setValue('consultoria.email', consultoria.email || '');
      }
    }
  }, [selectedConsultoriaId, consultoriasMap, form]);

  const handleSave = async (status: 'draft' | 'completed') => {
      setLoading(true);
      const values = form.getValues();
      await onSave(values, status);
      setLoading(false);
  }

  return (
    <Form {...form}>
      <form onSubmit={(e) => e.preventDefault()} className="h-full flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto pr-4 -mr-6">
            <Accordion type="multiple" defaultValue={['item-1', 'item-2', 'item-3']} className="w-full">
            
            <AccordionItem value="item-1">
                <AccordionTrigger>1. Identificação</AccordionTrigger>
                <AccordionContent className="space-y-6 pt-4">
                <div className="space-y-4 p-4 border rounded-md">
                    <h3 className="font-semibold text-base">1.1. Empreendedor</h3>
                    <FormField
                    control={form.control}
                    name="empreendedorId"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Selecionar Empreendedor</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoadingEmpreendedores}>
                            <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder={isLoadingEmpreendedores ? "Carregando..." : "Selecione um empreendedor"} />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>{empreendedores?.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}</SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField control={form.control} name="empreendedor.name" render={({ field }) => (<FormItem><FormLabel>Razão Social</FormLabel><FormControl><Input {...field} disabled /></FormControl></FormItem>)} />
                    <FormField control={form.control} name="empreendedor.cpfCnpj" render={({ field }) => (<FormItem><FormLabel>CPF/CNPJ</FormLabel><FormControl><MaskedInput mask="cpfCnpj" {...field} disabled /></FormControl></FormItem>)} />
                    <FormField control={form.control} name="empreendedor.address" render={({ field }) => (<FormItem><FormLabel>Endereço</FormLabel><FormControl><Input {...field} disabled /></FormControl></FormItem>)} />
                    <FormField control={form.control} name="empreendedor.email" render={({ field }) => (<FormItem><FormLabel>Email</FormLabel><FormControl><Input {...field} disabled /></FormControl></FormItem>)} />
                    <FormField control={form.control} name="empreendedor.phone" render={({ field }) => (<FormItem><FormLabel>Telefone</FormLabel><FormControl><Input {...field} disabled /></FormControl></FormItem>)} />
                </div>
                <div className="space-y-4 p-4 border rounded-md">
                    <h3 className="font-semibold text-base">1.2. Consultoria ambiental</h3>
                    <FormField
                    control={form.control}
                    name="consultoriaId"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Selecionar Consultoria</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoadingConsultorias}>
                            <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder={isLoadingConsultorias ? "Carregando..." : "Selecione uma consultoria"} />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>{consultorias?.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField control={form.control} name="consultoria.name" render={({ field }) => (<FormItem><FormLabel>Razão Social</FormLabel><FormControl><Input {...field} disabled /></FormControl></FormItem>)} />
                    <FormField control={form.control} name="consultoria.cnpj" render={({ field }) => (<FormItem><FormLabel>CNPJ</FormLabel><FormControl><MaskedInput mask="cnpj" {...field} disabled /></FormControl></FormItem>)} />
                    <FormField control={form.control} name="consultoria.address" render={({ field }) => (<FormItem><FormLabel>Endereço</FormLabel><FormControl><Input {...field} disabled /></FormControl></FormItem>)} />
                    <FormField control={form.control} name="consultoria.email" render={({ field }) => (<FormItem><FormLabel>Email</FormLabel><FormControl><Input {...field} disabled /></FormControl></FormItem>)} />
                    <FormField control={form.control} name="consultoria.phone" render={({ field }) => (<FormItem><FormLabel>Telefone</FormLabel><FormControl><Input {...field} disabled /></FormControl></FormItem>)} />
                </div>
                </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2">
                <AccordionTrigger>2. Caracterização do Empreendimento</AccordionTrigger>
                <AccordionContent className="pt-4">
                <FormField
                    control={form.control}
                    name="caracterizacaoEmpreendimento"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Descrição do Empreendimento</FormLabel>
                        <FormControl>
                        <Textarea
                            className="min-h-[150px]"
                            placeholder="Descrição breve do empreendimento e suas características tipológicas, locacionais e de porte, que sejam ambientalmente relevantes."
                            {...field}
                        />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3">
                <AccordionTrigger>3. Caracterização da Área de Estudo</AccordionTrigger>
                <AccordionContent className="pt-4 space-y-6">
                <FormField
                    control={form.control}
                    name="caracterizacaoAreaEstudo.area"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>3.1. Área de Estudo</FormLabel>
                        <FormControl>
                        <Textarea
                            className="min-h-[150px]"
                            placeholder="Descrição das diferentes classes de ambientes presentes (fitofisionomias, estágios sucessionais, uso do solo, corpos d’água, etc.) e suas áreas (absolutas e percentuais). Inserir imagens e mapas."
                            {...field}
                        />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="caracterizacaoAreaEstudo.clima"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>3.2. Clima e Pluviometria</FormLabel>
                        <FormControl>
                        <Textarea
                            className="min-h-[100px]"
                            placeholder="Descrição do clima e da variação sazonal da região."
                            {...field}
                        />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4">
                <AccordionTrigger>4. Caracterização Ambiental (Dados Secundários)</AccordionTrigger>
                <AccordionContent className="pt-4">
                <FormField
                    control={form.control}
                    name="caracterizacaoAmbientalSecundaria"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Identificação de Bens Ambientais Relevantes</FormLabel>
                        <FormControl>
                        <Textarea
                            className="min-h-[150px]"
                            placeholder="Identificar, com base em dados secundários, espécies ameaçadas, endêmicas, raras, rotas migratórias, habitats importantes, etc."
                            {...field}
                        />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-5">
                <AccordionTrigger>5. Lista de Espécies (Dados Secundários)</AccordionTrigger>
                <AccordionContent className="pt-4">
                <FormField
                    control={form.control}
                    name="listaEspeciesSecundaria"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Lista de Espécies da Região</FormLabel>
                        <FormDescription>
                            Apresentar quadro com a lista de espécies, destacando indicadoras de qualidade, ameaçadas, endêmicas, migratórias, invasoras, etc.
                        </FormDescription>
                        <FormControl>
                        <Textarea
                            className="min-h-[150px]"
                            placeholder="Ex: Grupo: Mastofauna | Espécie: Lobo-guará (Chrysocyon brachyurus) | Status: Ameaçada | ... "
                            {...field}
                        />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-6">
                <AccordionTrigger>6. Impactos Ambientais Potenciais</AccordionTrigger>
                <AccordionContent className="pt-4 space-y-6">
                <FormField
                    control={form.control}
                    name="impactosPotenciais.vetores"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>a. Vetores de Impacto</FormLabel>
                        <FormControl>
                        <Textarea
                            className="min-h-[100px]"
                            placeholder="Identificar as consequências da instalação/operação: emissões (ruído, luz, poluentes), mortandade, supressão de habitat, etc."
                            {...field}
                        />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="impactosPotenciais.analiseInteracao"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>b. Análise Preliminar de Interações</FormLabel>
                        <FormControl>
                        <Textarea
                            className="min-h-[100px]"
                            placeholder="Analisar as possíveis interações entre os vetores de impacto e os bens ambientais, listando os prováveis impactos para cada grupo faunístico."
                            {...field}
                        />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-7">
                <AccordionTrigger>7. Metodologia de Inventariamento</AccordionTrigger>
                <AccordionContent className="pt-4 space-y-6">
                    <FormField
                        control={form.control}
                        name="metodologiaInventariamento.materiaisMetodos"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>7.1. Materiais e métodos</FormLabel>
                            <FormDescription>Descrever a metodologia de captura, manejo, marcação, e demais procedimentos, incluindo petrechos, materiais e EPIs.</FormDescription>
                            <FormControl><Textarea className="min-h-[150px]" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )}/>
                    <FormField
                        control={form.control}
                        name="metodologiaInventariamento.modulosAmostrais"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>7.2. Módulos amostrais</FormLabel>
                            <FormDescription>Apresentar os módulos amostrais e os pontos de amostragem por meio de texto descritivo e imagens.</FormDescription>
                            <FormControl><Textarea className="min-h-[150px]" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )}/>
                    <FormField
                        control={form.control}
                        name="metodologiaInventariamento.esforcoAmostral"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>7.3. Esforço amostral</FormLabel>
                            <FormDescription>Apresentar o esforço amostral empregado informando a quantidade de campanhas, duração, tempo de aplicação de cada metodologia, etc.</FormDescription>
                            <FormControl><Textarea className="min-h-[150px]" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )}/>
                    <FormField
                        control={form.control}
                        name="metodologiaInventariamento.cronogramaExecucao"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>7.4. Cronograma de execução</FormLabel>
                            <FormDescription>Apresentar quadro que demonstre o cronograma de execução do estudo.</FormDescription>
                            <FormControl><Textarea className="min-h-[150px]" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )}/>
                    <FormField
                        control={form.control}
                        name="metodologiaInventariamento.destinoMaterialBiologico"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>7.5. Destino do material biológico coletado</FormLabel>
                            <FormDescription>Informar a destinação do material biológico coletado, que deverá ser depositado em coleções científicas.</FormDescription>
                            <FormControl><Textarea className="min-h-[150px]" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )}/>
                </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-8">
                <AccordionTrigger>8. Equipes</AccordionTrigger>
                <AccordionContent className="pt-4">
                <FormField
                    control={form.control}
                    name="equipes"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Composição da Equipe</FormLabel>
                        <FormControl>
                        <Textarea
                            className="min-h-[100px]"
                            placeholder="Apresentar quadro com nome, formação, registro profissional e área de atuação de cada membro da equipe."
                            {...field}
                        />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-9">
                <AccordionTrigger>9. Referências Bibliográficas</AccordionTrigger>
                <AccordionContent className="pt-4">
                <FormField
                    control={form.control}
                    name="referencias"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Referências</FormLabel>
                        <FormControl>
                        <Textarea
                            className="min-h-[150px]"
                            placeholder="Listar, conforme diretrizes da ABNT, as bibliografias consultadas para elaboração do projeto técnico."
                            {...field}
                        />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                </AccordionContent>
            </AccordionItem>

            </Accordion>
        </div>
        <div className="flex justify-end gap-2 pt-6 border-t mt-4 p-4">
          <Button variant="outline" type="button" onClick={() => router.back()}>Voltar</Button>
          <Button variant="secondary" onClick={() => handleSave('draft')} disabled={loading}>
             {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...</> : 'Salvar Rascunho'}
          </Button>
           <Button onClick={() => form.trigger().then(valid => valid && handleSave('completed'))} disabled={loading}>
            {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Concluindo...</> : 'Concluir Projeto'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
