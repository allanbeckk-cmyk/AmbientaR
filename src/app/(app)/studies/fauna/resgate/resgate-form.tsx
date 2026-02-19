
'use client';

import * as React from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Textarea } from '@/components/ui/textarea';
import { useRouter } from 'next/navigation';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import type { Empreendedor, EnvironmentalCompany } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const formSchema = z.object({
  empreendedorId: z.string().min(1, "Selecione um empreendedor."),
  consultoriaId: z.string().min(1, "Selecione uma consultoria."),
  empreendedor: z.object({
    name: z.string().min(1, "Razão Social é obrigatória."),
    cpfCnpj: z.string().min(1, "CNPJ é obrigatório."),
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
    name: z.string().min(1, "Razão Social é obrigatória."),
    cnpj: z.string().min(1, "CNPJ é obrigatório."),
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
  caracterizacaoEmpreendimento: z.string().min(1, "A caracterização é obrigatória."),
  areaDiretamenteAfetada: z.string().min(1, "A delimitação da área é obrigatória."),
  caracterizacaoAmbientalSecundaria: z.string().min(1, "A caracterização ambiental é obrigatória."),
  listaEspeciesSecundaria: z.string().min(1, "A lista de espécies é obrigatória."),
  impactosPotenciais: z.object({
      vetores: z.string().min(1, "Os vetores de impacto são obrigatórios."),
      analiseInteracao: z.string().min(1, "A análise de interação é obrigatória."),
  }),
  areasIntervencao: z.string().min(1, "A delimitação das áreas de intervenção é obrigatória."),
  areasSoltura: z.string().min(1, "A delimitação das áreas de soltura é obrigatória."),
  programaResgate: z.object({
      metodologias: z.string().min(1, "As metodologias são obrigatórias."),
      baseSalvamento: z.string().min(1, "A descrição da base é obrigatória."),
  }),
  cursoCapacitacao: z.string().min(1, "O programa do curso é obrigatório."),
  planoSupressao: z.string().min(1, "O plano de supressão é obrigatório."),
  cronogramaExecucao: z.string().min(1, "O cronograma é obrigatório."),
  equipes: z.string().min(1, "A equipe é obrigatória."),
  referencias: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function ResgateForm() {
  const [loading, setLoading] = React.useState(false);
  const { toast } = useToast();
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
    defaultValues: {
        empreendedor: { name: '', cpfCnpj: '', address: '', phone: '', email: '' },
        consultoria: { name: '', cnpj: '', address: '', phone: '', email: '' },
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

  async function onSubmit(values: FormValues) {
    setLoading(true);
    console.log(values);
    await new Promise(resolve => setTimeout(resolve, 1000));
    toast({
      title: 'Projeto Salvo!',
      description: 'O projeto de resgate de fauna foi salvo como rascunho.',
    });
    setLoading(false);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="h-full flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto pr-4 -mr-6">
            <Accordion type="multiple" defaultValue={['item-1', 'item-7']} className="w-full">
            <AccordionItem value="item-1">
                <AccordionTrigger>1. & 2. Identificação e Caracterização</AccordionTrigger>
                <AccordionContent className="space-y-6 pt-4">
                    <div className="space-y-4 p-4 border rounded-md">
                        <h3 className="font-semibold text-base">1.1. Empreendedor</h3>
                        <FormField control={form.control} name="empreendedorId" render={({ field }) => ( <FormItem><FormLabel>Selecionar Empreendedor</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoadingEmpreendedores}><FormControl><SelectTrigger><SelectValue placeholder={isLoadingEmpreendedores ? "Carregando..." : "Selecione"} /></SelectTrigger></FormControl><SelectContent>{empreendedores?.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)}/>
                        <FormField control={form.control} name="empreendedor.name" render={({ field }) => (<FormItem><FormLabel>Razão Social</FormLabel><FormControl><Input {...field} disabled /></FormControl></FormItem>)} />
                        <FormField control={form.control} name="empreendedor.cpfCnpj" render={({ field }) => (<FormItem><FormLabel>CPF/CNPJ</FormLabel><FormControl><Input {...field} disabled /></FormControl></FormItem>)} />
                    </div>
                     <div className="space-y-4 p-4 border rounded-md">
                        <h3 className="font-semibold text-base">1.2. Consultoria</h3>
                        <FormField control={form.control} name="consultoriaId" render={({ field }) => ( <FormItem><FormLabel>Selecionar Consultoria</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoadingConsultorias}><FormControl><SelectTrigger><SelectValue placeholder={isLoadingConsultorias ? "Carregando..." : "Selecione"} /></SelectTrigger></FormControl><SelectContent>{consultorias?.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)}/>
                        <FormField control={form.control} name="consultoria.name" render={({ field }) => (<FormItem><FormLabel>Razão Social</FormLabel><FormControl><Input {...field} disabled /></FormControl></FormItem>)} />
                        <FormField control={form.control} name="consultoria.cnpj" render={({ field }) => (<FormItem><FormLabel>CNPJ</FormLabel><FormControl><Input {...field} disabled /></FormControl></FormItem>)} />
                    </div>
                <FormField name="caracterizacaoEmpreendimento" control={form.control} render={({ field }) => (<FormItem><FormLabel>2. Caracterização do Empreendimento</FormLabel><FormControl><Textarea placeholder="Descrição breve..." {...field} /></FormControl><FormMessage /></FormItem>)} />
                </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2">
                <AccordionTrigger>3. Caracterização da Área</AccordionTrigger>
                <AccordionContent className="pt-4 space-y-6">
                <FormField name="areaDiretamenteAfetada" control={form.control} render={({ field }) => (<FormItem><FormLabel>3.1 Área Diretamente Afetada e Áreas de Influência</FormLabel><FormControl><Textarea placeholder="ADA, AID, AII..." {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField name="areasIntervencao" control={form.control} render={({ field }) => (<FormItem><FormLabel>3.2 Áreas de Intervenção</FormLabel><FormControl><Textarea placeholder="Delimitar e apresentar as áreas de intervenção..." {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField name="areasSoltura" control={form.control} render={({ field }) => (<FormItem><FormLabel>3.3 Áreas de Soltura</FormLabel><FormControl><Textarea placeholder="Delimitar e apresentar as áreas de soltura..." {...field} /></FormControl><FormMessage /></FormItem>)} />
                </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3">
                <AccordionTrigger>4. & 5. & 6. Caracterização Ambiental, Espécies e Impactos</AccordionTrigger>
                <AccordionContent className="space-y-6 pt-4">
                <FormField name="caracterizacaoAmbientalSecundaria" control={form.control} render={({ field }) => (<FormItem><FormLabel>4. Caracterização Ambiental</FormLabel><FormControl><Textarea placeholder="Identificação de bens ambientais..." {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField name="listaEspeciesSecundaria" control={form.control} render={({ field }) => (<FormItem><FormLabel>5. Lista de Espécies</FormLabel><FormControl><Textarea placeholder="Apresentar quadro com a lista..." {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField name="impactosPotenciais.vetores" control={form.control} render={({ field }) => (<FormItem><FormLabel>6. Impactos Ambientais</FormLabel><FormControl><Textarea placeholder="Vetores de impacto..." {...field} /></FormControl><FormMessage /></FormItem>)} />
                </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-4">
                <AccordionTrigger>7. Programa de Resgate e Destinação de Fauna</AccordionTrigger>
                <AccordionContent className="pt-4 space-y-6">
                    <FormField name="programaResgate.metodologias" control={form.control} render={({ field }) => (<FormItem><FormLabel>7.1 Metodologias</FormLabel><FormControl><Textarea placeholder="Metodologia de afugentamento, captura, etc." {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField name="programaResgate.baseSalvamento" control={form.control} render={({ field }) => (<FormItem><FormLabel>7.2 Base provisória de salvamento</FormLabel><FormControl><Textarea placeholder="Descrição da base e suas estruturas..." {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField name="destinoMaterialBiologico" control={form.control} render={({ field }) => (<FormItem><FormLabel>7.3 Destino do material biológico</FormLabel><FormControl><Textarea placeholder="Informar destinação..." {...field} /></FormControl><FormMessage /></FormItem>)} />
                </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-5">
                <AccordionTrigger>8. Curso de Capacitação</AccordionTrigger>
                <AccordionContent className="pt-4">
                <FormField name="cursoCapacitacao" control={form.control} render={({ field }) => (<FormItem><FormLabel>Programa do Curso</FormLabel><FormControl><Textarea placeholder="Apresentar o programa do curso teórico e prático..." {...field} /></FormControl><FormMessage /></FormItem>)} />
                </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-6">
                <AccordionTrigger>9. Plano de Supressão</AccordionTrigger>
                <AccordionContent className="pt-4">
                <FormField name="planoSupressao" control={form.control} render={({ field }) => (<FormItem><FormLabel>Plano específico de supressão</FormLabel><FormControl><Textarea placeholder="Apresentar o plano que deverá direcionar o deslocamento da fauna..." {...field} /></FormControl><FormMessage /></FormItem>)} />
                </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-7">
                <AccordionTrigger>10. Cronograma de Execução</AccordionTrigger>
                <AccordionContent className="pt-4">
                <FormField name="cronogramaExecucao" control={form.control} render={({ field }) => (<FormItem><FormLabel>Cronograma</FormLabel><FormControl><Textarea placeholder="Apresentar quadro com cronograma de execução..." {...field} /></FormControl><FormMessage /></FormItem>)} />
                </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-8">
                <AccordionTrigger>11. & 12. Equipes e Referências</AccordionTrigger>
                <AccordionContent className="space-y-6 pt-4">
                <FormField name="equipes" control={form.control} render={({ field }) => (<FormItem><FormLabel>11. Equipes</FormLabel><FormControl><Textarea placeholder="Apresentar quadro com a composição das equipes..." {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField name="referencias" control={form.control} render={({ field }) => (<FormItem><FormLabel>12. Referências Bibliográficas</FormLabel><FormControl><Textarea placeholder="Listar bibliografias..." {...field} /></FormControl><FormMessage /></FormItem>)} />
                </AccordionContent>
            </AccordionItem>
            </Accordion>
        </div>
        <div className="flex justify-end gap-2 pt-6 mt-4 p-4 border-t">
          <Button variant="outline" type="button" onClick={() => router.back()}>Voltar</Button>
          <Button type="submit" disabled={loading}>
            {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...</> : 'Salvar Projeto'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
