
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
  FormDescription
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Loader2, CalendarIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { PCA, Empreendedor as Client, Project } from '@/lib/types';
import { useFirebase, errorEmitter, useCollection, useMemoFirebase } from '@/firebase';
import { FirestorePermissionError } from '@/firebase/errors';
import { collection, doc, addDoc, updateDoc } from 'firebase/firestore';
import { DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const formSchema = z.object({
  status: z.enum(['Rascunho', 'Aprovado']).optional(),
  activity: z.string().min(1, "A seleção da atividade é obrigatória."),
  termoReferencia: z.object({
    titulo: z.string().min(1, "O título é obrigatório."),
    processo: z.string().min(1, "O processo é obrigatório."),
    dataEmissao: z.date({ required_error: 'A data de emissão é obrigatória.' }),
    versao: z.string().optional(),
  }),
  empreendedor: z.object({
    clientId: z.string().optional(),
    nome: z.string().min(1, "O nome do empreendedor é obrigatório."),
    cpfCnpj: z.string().min(1, "O CPF/CNPJ é obrigatório."),
    endereco: z.string().min(1, "O endereço é obrigatório."),
    contato: z.string().min(1, "O contato é obrigatório."),
  }),
  empreendimento: z.object({
    projectId: z.string().optional(),
    nome: z.string().min(1, "O nome do empreendimento é obrigatório."),
    municipio: z.string().min(1, "O município é obrigatório."),
    endereco: z.string().min(1, "O endereço é obrigatório."),
    coordenadas: z.string().min(1, "As coordenadas são obrigatórias."),
    atividade: z.string().min(1, "A atividade é obrigatória."),
    tipologia: z.string().min(1, "A tipologia/porte/classe é obrigatória."),
    faseLicenciamento: z.enum(['LP', 'LI', 'LO', 'AAF', 'Outra'], { required_error: 'Selecione a fase.' }),
  }),
  objetoEstudo: z.object({
    objeto: z.string().min(1, "O objeto do estudo é obrigatório."),
    fundamentacaoLegal: z.string().min(1, "A fundamentação legal é obrigatória."),
  }),
  conteudoEstudo: z.object({
    introducao: z.string().optional(),
    caracterizacaoEmpreendimento: z.string().optional(),
    diagnosticoMeioFisico: z.string().optional(),
    diagnosticoMeioBiotico: z.string().optional(),
    diagnosticoMeioSocioeconomico: z.string().optional(),
    analiseImpactos: z.string().optional(),
    medidasMitigadoras: z.string().optional(),
    programasAmbientais: z.string().optional(),
    conclusao: z.string().optional(),
    referencias: z.string().optional(),
    anexos: z.string().optional(),
  }),
  equipeTecnica: z.object({
    qualificacoes: z.string().optional(),
    arts: z.string().optional(),
  }),
});

type PcaFormValues = z.infer<typeof formSchema>;

interface PcaFormProps {
  currentItem?: PCA | null;
  onSuccess?: () => void;
}

const activities = [
    "LISTAGEM A – ATIVIDADES MINERÁRIAS",
    "LISTAGEM B – ATIVIDADES INDUSTRIAIS / INDÚSTRIA METALÚRGICA E OUTRAS",
    "LISTAGEM C – ATIVIDADES INDUSTRIAIS/INDÚSTRIA QUÍMICA E OUTRAS",
    "LISTAGEM D – ATIVIDADES INDUSTRIAIS / INDÚSTRIA ALIMENTÍCIA",
    "LISTAGEM E – ATIVIDADES DE INFRAESTRUTURA",
    "LISTAGEM F – GERENCIAMENTO DE RESÍDUOS E SERVIÇOS",
    "LISTAGEM G – ATIVIDADES AGROSSILVIPASTORIS",
    "LISTAGEM H – OUTRAS ATIVIDADES - H-01-01-1 Atividades e empreendimentos não listados ou não enquadrados em outros códigos, com supressão de vegetação primária ou secundária nativa pertencente ao bioma Mata Atlântica, em estágios médio e/ou avançado de regeneração, sujeita a EIA/Rima nos termos da Lei Federal nº 11.428, de 22 de dezembro de 2006, exceto árvores isoladas."
];

export function PcaForm({ currentItem, onSuccess }: PcaFormProps) {
  const [loading, setLoading] = React.useState(false);
  const { toast } = useToast();
  const { firestore } = useFirebase();

  const clientsQuery = useMemoFirebase(() => firestore ? collection(firestore, 'clients') : null, [firestore]);
  const { data: clients, isLoading: isLoadingClients } = useCollection<Client>(clientsQuery);
  const projectsQuery = useMemoFirebase(() => firestore ? collection(firestore, 'projects') : null, [firestore]);
  const { data: projects, isLoading: isLoadingProjects } = useCollection<Project>(projectsQuery);

  const form = useForm<PcaFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: currentItem ? {
        ...currentItem,
        activity: currentItem.empreendimento.atividade || '',
        termoReferencia: {
            ...currentItem.termoReferencia,
            dataEmissao: new Date(currentItem.termoReferencia.dataEmissao),
        }
    } : {
      activity: '',
      status: 'Rascunho',
      termoReferencia: { titulo: '', processo: '', dataEmissao: new Date(), versao: '' },
      empreendedor: { nome: '', cpfCnpj: '', endereco: '', contato: '' },
      empreendimento: { nome: '', municipio: '', endereco: '', coordenadas: '', atividade: '', tipologia: ''},
      objetoEstudo: { objeto: '', fundamentacaoLegal: '' },
      conteudoEstudo: { introducao: '', caracterizacaoEmpreendimento: '', diagnosticoMeioFisico: '', diagnosticoMeioBiotico: '', diagnosticoMeioSocioeconomico: '', analiseImpactos: '', medidasMitigadoras: '', programasAmbientais: '', conclusao: '', referencias: '', anexos: '' },
      equipeTecnica: { qualificacoes: '', arts: '' },
    },
  });

  const selectedClientId = form.watch('empreendedor.clientId');
  const selectedProjectId = form.watch('empreendimento.projectId');


  React.useEffect(() => {
    if (selectedClientId) {
      const client = clients?.find(c => c.id === selectedClientId);
      if (client) {
        form.setValue('empreendedor.nome', client.name);
        form.setValue('empreendedor.cpfCnpj', client.cpfCnpj || '');
        form.setValue('empreendedor.endereco', client.address || '');
        form.setValue('empreendedor.contato', `${client.phone} / ${client.email}`);
      }
    }
  }, [selectedClientId, clients, form]);

  React.useEffect(() => {
    if (selectedProjectId) {
      const project = projects?.find(p => p.id === selectedProjectId);
      if (project) {
        form.setValue('empreendimento.nome', project.fantasyName || project.propertyName);
        form.setValue('empreendimento.municipio', project.municipio || '');
        form.setValue('empreendimento.endereco', project.address || '');
        form.setValue('empreendimento.atividade', project.activity || '');
        // Coordenadas podem precisar de um tratamento especial
      }
    }
  }, [selectedProjectId, projects, form]);

  async function handleSave(status: 'Rascunho' | 'Aprovado') {
    setLoading(true);

    const isValid = await form.trigger();
    if (!isValid && status === 'Aprovado') {
        toast({
            variant: 'destructive',
            title: 'Formulário Inválido',
            description: 'Por favor, corrija os erros antes de concluir.',
        });
        setLoading(false);
        return;
    }

    const values = form.getValues();

    if (!firestore) {
      toast({ variant: 'destructive', title: 'Firebase não inicializado.' });
      setLoading(false);
      return;
    }

    const dataToSave = {
      ...values,
      status: status,
      termoReferencia: {
        ...values.termoReferencia,
        dataEmissao: values.termoReferencia.dataEmissao.toISOString(),
      }
    };

    if (currentItem) {
      const docRef = doc(firestore, 'pcas', currentItem.id);
      updateDoc(docRef, dataToSave)
        .then(() => {
          toast({ title: 'PCA atualizado!', description: `O relatório foi salvo como ${status.toLowerCase()}.` });
          if(status === 'Aprovado') onSuccess?.();
        })
        .catch(async (serverError) => {
          const permissionError = new FirestorePermissionError({ path: docRef.path, operation: 'update', requestResourceData: dataToSave });
          errorEmitter.emit('permission-error', permissionError);
        })
        .finally(() => setLoading(false));
    } else {
      const collectionRef = collection(firestore, 'pcas');
      addDoc(collectionRef, dataToSave)
        .then(() => {
          toast({ title: 'PCA criado!', description: `O relatório para ${values.empreendimento.nome} foi criado.` });
          form.reset();
          if(status === 'Aprovado') onSuccess?.();
        })
        .catch(async (serverError) => {
          const permissionError = new FirestorePermissionError({ path: collectionRef.path, operation: 'create', requestResourceData: dataToSave });
          errorEmitter.emit('permission-error', permissionError);
        })
        .finally(() => setLoading(false));
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={(e) => e.preventDefault()} className="h-full flex flex-col overflow-hidden">
        <div className="flex-1 pr-4 space-y-4 overflow-y-auto">
            <Accordion type="multiple" defaultValue={['item-1', 'item-2', 'item-3']} className="w-full">
            <AccordionItem value="item-1">
                <AccordionTrigger>1. & 2. Identificação e Dados do Empreendedor</AccordionTrigger>
                <AccordionContent className="space-y-4">
                <FormField control={form.control} name="termoReferencia.titulo" render={({ field }) => (<FormItem><FormLabel>Título/Assunto do Termo de Referência</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField control={form.control} name="termoReferencia.processo" render={({ field }) => (<FormItem><FormLabel>Nº Processo</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="termoReferencia.dataEmissao" render={({ field }) => (
                        <FormItem className="flex flex-col"><FormLabel>Data de Emissão</FormLabel>
                            <Popover><PopoverTrigger asChild><FormControl>
                                <Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                {field.value ? format(field.value, "PPP", { locale: ptBR }) : <span>Escolha uma data</span>}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                            </FormControl></PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent>
                            </Popover><FormMessage />
                        </FormItem>)} />
                    <FormField control={form.control} name="termoReferencia.versao" render={({ field }) => (<FormItem><FormLabel>Versão</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                </div>
                <FormField control={form.control} name="empreendedor.clientId" render={({ field }) => (
                    <FormItem><FormLabel>Buscar Empreendedor Cadastrado</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoadingClients}><FormControl><SelectTrigger>
                        <SelectValue placeholder={isLoadingClients ? "Carregando..." : "Selecione um cliente para preencher"} />
                    </SelectTrigger></FormControl><SelectContent>{clients?.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="empreendedor.nome" render={({ field }) => (<FormItem><FormLabel>Nome/Razão Social</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="empreendedor.cpfCnpj" render={({ field }) => (<FormItem><FormLabel>CPF/CNPJ</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="empreendedor.endereco" render={({ field }) => (<FormItem><FormLabel>Endereço</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="empreendedor.contato" render={({ field }) => (<FormItem><FormLabel>Contato (Telefone/Email)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-2">
                <AccordionTrigger>3. Dados do Empreendimento</AccordionTrigger>
                <AccordionContent className="space-y-4">
                    <FormField control={form.control} name="empreendimento.projectId" render={({ field }) => (
                    <FormItem><FormLabel>Buscar Empreendimento Cadastrado</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoadingProjects}><FormControl><SelectTrigger>
                        <SelectValue placeholder={isLoadingProjects ? "Carregando..." : "Selecione para preencher"} />
                    </SelectTrigger></FormControl><SelectContent>{projects?.map(p => <SelectItem key={p.id} value={p.id}>{p.propertyName}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="empreendimento.nome" render={({ field }) => (<FormItem><FormLabel>Nome do Empreendimento</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="empreendimento.municipio" render={({ field }) => (<FormItem><FormLabel>Município</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="empreendimento.endereco" render={({ field }) => (<FormItem><FormLabel>Endereço</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="empreendimento.coordenadas" render={({ field }) => (<FormItem><FormLabel>Coordenadas Geográficas (UTM, SIRGAS 2000)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="empreendimento.atividade" render={({ field }) => (<FormItem><FormLabel>Atividade/Finalidade</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="empreendimento.tipologia" render={({ field }) => (<FormItem><FormLabel>Tipologia/Porte/Classe</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="empreendimento.faseLicenciamento" render={({ field }) => (
                        <FormItem><FormLabel>Fase do Licenciamento</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger>
                            <SelectValue placeholder="Selecione a fase" />
                        </SelectTrigger></FormControl><SelectContent>{['LP', 'LI', 'LO', 'AAF', 'Outra'].map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
                    )}/>
                </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3">
                <AccordionTrigger>4. & 5. Objeto e Conteúdo do Estudo</AccordionTrigger>
                <AccordionContent className="space-y-4">
                    <FormField control={form.control} name="objetoEstudo.objeto" render={({ field }) => (<FormItem><FormLabel>Objeto do Estudo</FormLabel><FormControl><Input placeholder="EIA/RIMA, PCA, PRAD..." {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="objetoEstudo.fundamentacaoLegal" render={({ field }) => (<FormItem><FormLabel>Fundamentação Legal</FormLabel><FormControl><Textarea placeholder="Resoluções CONAMA, Deliberações COPAM..." {...field} /></FormControl><FormMessage /></FormItem>)} />
                    
                    <h4 className="font-semibold pt-4 border-t">Conteúdo Mínimo do Estudo</h4>
                    <FormField control={form.control} name="conteudoEstudo.introducao" render={({ field }) => (<FormItem><FormLabel>Introdução/Contexto</FormLabel><FormControl><Textarea {...field} /></FormControl></FormItem>)} />
                    <FormField control={form.control} name="conteudoEstudo.caracterizacaoEmpreendimento" render={({ field }) => (<FormItem><FormLabel>Caracterização do Empreendimento</FormLabel><FormControl><Textarea {...field} /></FormControl></FormItem>)} />
                    <FormField control={form.control} name="conteudoEstudo.diagnosticoMeioFisico" render={({ field }) => (<FormItem><FormLabel>Diagnóstico Ambiental - Meio Físico</FormLabel><FormControl><Textarea {...field} /></FormControl></FormItem>)} />
                    <FormField control={form.control} name="conteudoEstudo.diagnosticoMeioBiotico" render={({ field }) => (<FormItem><FormLabel>Diagnóstico Ambiental - Meio Biótico</FormLabel><FormControl><Textarea {...field} /></FormControl></FormItem>)} />
                    <FormField control={form.control} name="conteudoEstudo.diagnosticoMeioSocioeconomico" render={({ field }) => (<FormItem><FormLabel>Diagnóstico Ambiental - Meio Socioeconômico</FormLabel><FormControl><Textarea {...field} /></FormControl></FormItem>)} />
                    <FormField control={form.control} name="conteudoEstudo.analiseImpactos" render={({ field }) => (<FormItem><FormLabel>Análise de Impactos Ambientais</FormLabel><FormControl><Textarea {...field} /></FormControl></FormItem>)} />
                    <FormField control={form.control} name="conteudoEstudo.medidasMitigadoras" render={({ field }) => (<FormItem><FormLabel>Medidas Mitigadoras/Compensatórias</FormLabel><FormControl><Textarea {...field} /></FormControl></FormItem>)} />
                    <FormField control={form.control} name="conteudoEstudo.programasAmbientais" render={({ field }) => (<FormItem><FormLabel>Programas Ambientais</FormLabel><FormControl><Textarea {...field} /></FormControl></FormItem>)} />
                    <FormField control={form.control} name="conteudoEstudo.conclusao" render={({ field }) => (<FormItem><FormLabel>Conclusão/Recomendações</FormLabel><FormControl><Textarea {...field} /></FormControl></FormItem>)} />
                    <FormField control={form.control} name="conteudoEstudo.referencias" render={({ field }) => (<FormItem><FormLabel>Referências Bibliográficas</FormLabel><FormControl><Textarea {...field} /></FormControl></FormItem>)} />
                    <FormField control={form.control} name="conteudoEstudo.anexos" render={({ field }) => (<FormItem><FormLabel>Anexos</FormLabel><FormControl><Textarea placeholder="Descreva os anexos (mapas, fotos, laudos, ARTs...)" {...field} /></FormControl></FormItem>)} />
                </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4">
                <AccordionTrigger>6. Equipe Técnica e Responsabilidades</AccordionTrigger>
                <AccordionContent className="space-y-4">
                    <FormField control={form.control} name="equipeTecnica.qualificacoes" render={({ field }) => (<FormItem><FormLabel>Requisitos de Qualificação</FormLabel><FormDescription>Descreva os profissionais habilitados para o estudo (engenheiros, biólogos, etc.).</FormDescription><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="equipeTecnica.arts" render={({ field }) => (<FormItem><FormLabel>ARTs/RRTs</FormLabel><FormDescription>Liste os números de Anotação/Registro de Responsabilidade Técnica.</FormDescription><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>)} />
                </AccordionContent>
            </AccordionItem>
            </Accordion>
        </div>
        
        <DialogFooter>
            <Button variant="secondary" onClick={() => handleSave('Rascunho')} disabled={loading}>
                {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...</> : 'Salvar Rascunho'}
            </Button>
            <Button onClick={() => handleSave('Aprovado')} disabled={loading}>
                {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Concluindo...</> : 'Concluir e Aprovar'}
            </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
