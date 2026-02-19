
'use client';
import * as React from 'react';
import { z } from 'zod';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useFirebase, errorEmitter } from '@/firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { FirestorePermissionError } from '@/firebase/errors';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, PlusCircle, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';

const formSchema = z.object({
  numeroDocumento: z.string().optional(),
  data: z.date({ required_error: "A data do relatório é obrigatória." }),
  mesReferencia: z.string().min(1, "O mês de referência é obrigatório."),
  proprietario: z.object({
    nome: z.string().min(1, "O nome do proprietário é obrigatório."),
    endereco: z.string().min(1, "O endereço é obrigatório."),
    municipio: z.string().min(1, "O município é obrigatório."),
    cep: z.string().min(1, "O CEP é obrigatório."),
    telefone: z.string().min(1, "O telefone é obrigatório."),
  }),
  empreendimento: z.object({
    denominacao: z.string().min(1, "A denominação do empreendimento é obrigatória."),
    areaTotal: z.coerce.number().positive("A área total deve ser positiva."),
    endereco: z.string().min(1, "O endereço é obrigatório."),
    paCopam: z.string().min(1, "O PA/COPAM é obrigatório."),
    municipioDistrito: z.string().min(1, "O município/distrito é obrigatório."),
    cep: z.string().min(1, "O CEP é obrigatório."),
  }),
  dadosMadeira: z.object({
    dataColheita: z.date({ required_error: "A data da colheita é obrigatória." }),
    periodo: z.enum(['chuvoso', 'seca'], { required_error: "Selecione o período." }),
    residuos: z.boolean().default(false),
    umidadeEstimada: z.coerce.number().min(0, "A umidade deve ser um valor positivo."),
    tempoMedioSecagem: z.coerce.number().min(0, "O tempo deve ser um valor positivo."),
  }),
  carbonizacao: z.object({
    bateladasMes: z.coerce.number().int().positive("Deve ser um número inteiro positivo."),
    volumeMadeiraEnfornada: z.coerce.number().positive("O volume deve ser positivo."),
    volumeCarvaoProduzido: z.coerce.number().positive("O volume deve ser positivo."),
  }),
  temperaturaMedia: z.object({
    fornosAmostrados: z.coerce.number().int().optional(),
    medicoesTotais: z.coerce.number().int().optional(),
    temperatura: z.coerce.number().optional(),
    realizadaPor: z.array(z.string()).optional(),
    outro: z.string().optional(),
  }).optional(),
  integridadeFornos: z.object({
    manutencaoEstrutura: z.array(z.object({ data: z.date(), duracao: z.string(), operacao: z.string() })).optional(),
    limpezaPiso: z.array(z.object({ data: z.date(), duracao: z.string() })).optional(),
    limpezaConexoes: z.array(z.object({ data: z.date(), duracao: z.string(), operacao: z.string() })).optional(),
  }).optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface CharcoalFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

const realizadaPorOptions = [
    { id: 'Pirômetro', label: 'Pirômetro' },
    { id: 'Termopares', label: 'Termopares' },
    { id: 'Outro', label: 'Outro' },
];

export function CharcoalProductionForm({ onSuccess, onCancel }: CharcoalFormProps) {
  const [loading, setLoading] = React.useState(false);
  const { toast } = useToast();
  const { firestore } = useFirebase();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      numeroDocumento: '',
      data: new Date(),
      mesReferencia: '',
      proprietario: { nome: '', endereco: '', municipio: '', cep: '', telefone: '' },
      empreendimento: { denominacao: '', areaTotal: 0, endereco: '', paCopam: '', municipioDistrito: '', cep: '' },
      dadosMadeira: { dataColheita: new Date(), periodo: undefined, residuos: false, umidadeEstimada: 0, tempoMedioSecagem: 0 },
      carbonizacao: { bateladasMes: 0, volumeMadeiraEnfornada: 0, volumeCarvaoProduzido: 0 },
      temperaturaMedia: { fornosAmostrados: 0, medicoesTotais: 0, temperatura: 0, realizadaPor: [], outro: '' },
      integridadeFornos: { manutencaoEstrutura: [], limpezaPiso: [], limpezaConexoes: [] },
    },
  });

  const { fields: manutencaoFields, append: appendManutencao, remove: removeManutencao } = useFieldArray({ control: form.control, name: 'integridadeFornos.manutencaoEstrutura' });
  const { fields: limpezaPisoFields, append: appendLimpezaPiso, remove: removeLimpezaPiso } = useFieldArray({ control: form.control, name: 'integridadeFornos.limpezaPiso' });
  const { fields: limpezaConexoesFields, append: appendLimpezaConexoes, remove: removeLimpezaConexoes } = useFieldArray({ control: form.control, name: 'integridadeFornos.limpezaConexoes' });


  const carbonizacaoValues = form.watch('carbonizacao');

  async function onSubmit(values: FormValues) {
    setLoading(true);

    if (!firestore) {
      toast({ variant: 'destructive', title: 'Firebase não inicializado.' });
      setLoading(false);
      return;
    }
    
    const rendimentoVolumetrico = values.carbonizacao.volumeMadeiraEnfornada > 0 
        ? (values.carbonizacao.volumeCarvaoProduzido / values.carbonizacao.volumeMadeiraEnfornada) 
        : 0;

    const rendimentoGravimetrico = 0;

    const dataToSave = {
        ...values,
        data: values.data.toISOString(),
        dadosMadeira: {
            ...values.dadosMadeira,
            dataColheita: values.dadosMadeira.dataColheita.toISOString(),
        },
        carbonizacao: {
            ...values.carbonizacao,
            rendimentoVolumetrico,
            rendimentoGravimetrico,
        },
        createdAt: serverTimestamp(),
    };
    
    try {
        await addDoc(collection(firestore, 'charcoalReports'), dataToSave);
        toast({ title: 'Relatório Salvo!', description: 'O relatório de performance foi salvo com sucesso.' });
        onSuccess();
    } catch(error) {
        console.error("Error saving report: ", error);
        const permissionError = new FirestorePermissionError({
            path: 'charcoalReports',
            operation: 'create',
            requestResourceData: dataToSave,
        });
        errorEmitter.emit('permission-error', permissionError);
    } finally {
        setLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="space-y-4">
            <h3 className="text-lg font-medium">Dados Gerais do Relatório</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 <FormField control={form.control} name="numeroDocumento" render={({ field }) => ( <FormItem><FormLabel>Número do Documento</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                 <FormField control={form.control} name="data" render={({ field }) => ( <FormItem><FormLabel>Data</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className="w-full justify-start text-left font-normal">{field.value ? format(field.value, "PPP", { locale: ptBR }) : <span>Escolha uma data</span>}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value} onSelect={field.onChange} /></PopoverContent></Popover><FormMessage /></FormItem> )} />
                 <FormField control={form.control} name="mesReferencia" render={({ field }) => ( <FormItem><FormLabel>Mês de Referência</FormLabel><FormControl><Input type="month" {...field} /></FormControl><FormMessage /></FormItem> )} />
            </div>
        </div>

        <Card>
            <CardHeader><CardTitle>1. Dados do Proprietário/Explorador</CardTitle></CardHeader>
            <CardContent className="space-y-4">
                <FormField control={form.control} name="proprietario.nome" render={({ field }) => ( <FormItem><FormLabel>Nome</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                <FormField control={form.control} name="proprietario.endereco" render={({ field }) => ( <FormItem><FormLabel>Endereço</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField control={form.control} name="proprietario.municipio" render={({ field }) => ( <FormItem><FormLabel>Município</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                    <FormField control={form.control} name="proprietario.cep" render={({ field }) => ( <FormItem><FormLabel>CEP</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                    <FormField control={form.control} name="proprietario.telefone" render={({ field }) => ( <FormItem><FormLabel>Telefone</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                </div>
            </CardContent>
        </Card>
        
        <Card>
            <CardHeader><CardTitle>2. Dados do Empreendimento</CardTitle></CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="empreendimento.denominacao" render={({ field }) => ( <FormItem><FormLabel>Denominação</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                    <FormField control={form.control} name="empreendimento.areaTotal" render={({ field }) => ( <FormItem><FormLabel>Área Total (ha)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem> )} />
                </div>
                <FormField control={form.control} name="empreendimento.endereco" render={({ field }) => ( <FormItem><FormLabel>Endereço</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                <FormField control={form.control} name="empreendimento.paCopam" render={({ field }) => ( <FormItem><FormLabel>PA/COPAM nº</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="empreendimento.municipioDistrito" render={({ field }) => ( <FormItem><FormLabel>Município/Distrito</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                    <FormField control={form.control} name="empreendimento.cep" render={({ field }) => ( <FormItem><FormLabel>CEP</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                </div>
            </CardContent>
        </Card>

        <Card>
             <CardHeader><CardTitle>3. Dados de Produção</CardTitle></CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-4 rounded-md border p-4">
                    <h3 className="text-lg font-medium">3.1 Dados da Madeira</h3>
                     <FormField control={form.control} name="dadosMadeira.dataColheita" render={({ field }) => ( <FormItem><FormLabel>Data da Colheita</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className="w-full justify-start text-left font-normal">{field.value ? format(field.value, "PPP", { locale: ptBR }) : <span>Escolha uma data</span>}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value} onSelect={field.onChange} /></PopoverContent></Popover><FormMessage /></FormItem> )} />
                    <FormField control={form.control} name="dadosMadeira.periodo" render={({ field }) => (
                        <FormItem><FormLabel>Período</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Selecione o período da colheita" /></SelectTrigger></FormControl>
                            <SelectContent>
                                <SelectItem value="chuvoso">Chuvoso (out-mar)</SelectItem>
                                <SelectItem value="seca">Seca (abr-set)</SelectItem>
                            </SelectContent>
                            </Select><FormMessage />
                        </FormItem>
                    )} />
                    <FormField control={form.control} name="dadosMadeira.residuos" render={({ field }) => ( <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm"><div className="space-y-0.5"><FormLabel>Presença de resíduos na madeira?</FormLabel></div><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem> )} />
                
                    <div className="mt-4"><h4 className="font-semibold text-sm mb-2">Umidade da madeira estimada *</h4>
                        <Table>
                            <TableHeader><TableRow><TableHead>Umidade (%)</TableHead><TableHead>Diâmetro 1 (nº dias)</TableHead><TableHead>Diâmetro 2 (nº dias)</TableHead></TableRow></TableHeader>
                            <TableBody>
                                <TableRow><TableCell>35-40</TableCell><TableCell>50</TableCell><TableCell>180</TableCell></TableRow>
                                <TableRow><TableCell>30-35</TableCell><TableCell>75</TableCell><TableCell>250</TableCell></TableRow>
                                <TableRow><TableCell>25-30</TableCell><TableCell>90</TableCell><TableCell>300</TableCell></TableRow>
                            </TableBody>
                        </Table>
                         <p className="text-xs text-muted-foreground mt-2">* Para o período chuvoso acrescentar no mínimo 30% aos dias de secagem. Madeiras com comprimento inferiores a 2m o tempo de secagem em média deve ser reduzido em 25%. Diâmetro 1: 7 a 13 cm — Diâmetro 2: 14 a 20 cm</p>
                    </div>

                    <FormField control={form.control} name="dadosMadeira.umidadeEstimada" render={({ field }) => ( <FormItem><FormLabel>Umidade Estimada (%)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem> )} />
                    <FormField control={form.control} name="dadosMadeira.tempoMedioSecagem" render={({ field }) => ( <FormItem><FormLabel>Tempo Médio de Secagem em campo (dias)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem> )} />
                </div>
                 <div className="space-y-4 rounded-md border p-4">
                    <h3 className="text-lg font-medium">3.2 Carbonização</h3>
                     <FormField control={form.control} name="carbonizacao.bateladasMes" render={({ field }) => ( <FormItem><FormLabel>Nº Bateladas/mês</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem> )} />
                    <FormField control={form.control} name="carbonizacao.volumeMadeiraEnfornada" render={({ field }) => ( <FormItem><FormLabel>Volume médio de madeira enfornada (mst)</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem> )} />
                    <FormField control={form.control} name="carbonizacao.volumeCarvaoProduzido" render={({ field }) => ( <FormItem><FormLabel>Volume médio de carvão produzido (mdc)</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem> )} />
                     <div className="grid grid-cols-2 gap-4">
                        <FormItem>
                            <FormLabel>Rendimento Volumétrico (%)</FormLabel>
                            <Input readOnly value={
                                carbonizacaoValues.volumeMadeiraEnfornada > 0 
                                ? ((carbonizacaoValues.volumeCarvaoProduzido || 0) / carbonizacaoValues.volumeMadeiraEnfornada * 100).toFixed(2) + '%'
                                : '0.00%'
                            } />
                        </FormItem>
                        <FormItem>
                            <FormLabel>Rendimento Gravimétrico (%)</FormLabel>
                            <Input readOnly value="0.00%" />
                            <FormDescription className="text-xs">Depende da densidade (não incluída no formulário).</FormDescription>
                        </FormItem>
                    </div>
                </div>
                <div className="space-y-4 rounded-md border p-4">
                    <h3 className="text-lg font-medium">Temperatura Média da Etapa Final da Carbonização</h3>
                    <p className="text-sm text-muted-foreground">(Medida na Fase Exotérmica - Copa do Forno)</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FormField control={form.control} name="temperaturaMedia.fornosAmostrados" render={({ field }) => (<FormItem><FormLabel>Nº de fornos amostrados/batelada</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>)} />
                        <FormField control={form.control} name="temperaturaMedia.medicoesTotais" render={({ field }) => (<FormItem><FormLabel>Nº de medições totais/mês</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>)} />
                        <FormField control={form.control} name="temperaturaMedia.temperatura" render={({ field }) => (<FormItem><FormLabel>Temperatura média (°C)</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>)} />
                    </div>
                    <FormField control={form.control} name="temperaturaMedia.realizadaPor" render={() => (
                        <FormItem>
                        <FormLabel>Realizada por:</FormLabel>
                        <div className="flex flex-row items-center gap-4 pt-2">
                        {realizadaPorOptions.map((item) => (
                            <FormField key={item.id} control={form.control} name="temperaturaMedia.realizadaPor" render={({ field }) => (
                            <FormItem key={item.id} className="flex flex-row items-center space-x-2 space-y-0">
                                <FormControl><Checkbox checked={field.value?.includes(item.id)} onCheckedChange={(checked) => checked ? field.onChange([...(field.value || []), item.id]) : field.onChange(field.value?.filter(v => v !== item.id))} /></FormControl>
                                <FormLabel className="font-normal">{item.label}</FormLabel>
                            </FormItem>
                            )} />
                        ))}
                        </div>
                        {form.watch('temperaturaMedia.realizadaPor')?.includes('Outro') && (
                            <FormField control={form.control} name="temperaturaMedia.outro" render={({ field }) => (
                                <FormItem className="mt-2"><FormLabel>Qual?</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                            )} />
                        )}
                        <FormMessage />
                        </FormItem>
                    )} />
                </div>
            </CardContent>
        </Card>
        
        <Card>
            <CardHeader><CardTitle>4. Integridade dos fornos de carbonização</CardTitle></CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-4 rounded-md border p-4">
                    <div className="flex justify-between items-center"><h3 className="text-lg font-medium">4.1 Manutenção na estrutura dos fornos</h3><Button size="sm" type="button" onClick={() => appendManutencao({data: new Date(), duracao: '', operacao: ''})}><PlusCircle className="mr-2 h-4 w-4" /> Add</Button></div>
                    {manutencaoFields.map((field, index) => (
                        <div key={field.id} className="p-4 border rounded-md relative space-y-4">
                            <Button type="button" variant="destructive" size="icon" className="absolute top-2 right-2 h-6 w-6" onClick={() => removeManutencao(index)}><Trash2 className="h-4 w-4" /></Button>
                            <FormField control={form.control} name={`integridadeFornos.manutencaoEstrutura.${index}.data`} render={({ field }) => ( <FormItem><FormLabel>Data da manutenção</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className="w-full justify-start text-left font-normal">{field.value ? format(new Date(field.value), "PPP", { locale: ptBR }) : <span>Escolha uma data</span>}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={new Date(field.value)} onSelect={field.onChange} /></PopoverContent></Popover></FormItem> )} />
                            <FormField control={form.control} name={`integridadeFornos.manutencaoEstrutura.${index}.duracao`} render={({ field }) => ( <FormItem><FormLabel>Tempo de duração</FormLabel><FormControl><Input {...field} /></FormControl></FormItem> )} />
                            <FormField control={form.control} name={`integridadeFornos.manutencaoEstrutura.${index}.operacao`} render={({ field }) => ( <FormItem><FormLabel>Operação realizada</FormLabel><FormControl><Textarea {...field} /></FormControl></FormItem> )} />
                        </div>
                    ))}
                </div>
                <div className="space-y-4 rounded-md border p-4">
                    <div className="flex justify-between items-center"><h3 className="text-lg font-medium">4.2 Limpeza do piso</h3><Button size="sm" type="button" onClick={() => appendLimpezaPiso({data: new Date(), duracao: ''})}><PlusCircle className="mr-2 h-4 w-4" /> Add</Button></div>
                     {limpezaPisoFields.map((field, index) => (
                        <div key={field.id} className="p-4 border rounded-md relative grid grid-cols-2 gap-4">
                             <Button type="button" variant="destructive" size="icon" className="absolute top-2 right-2 h-6 w-6" onClick={() => removeLimpezaPiso(index)}><Trash2 className="h-4 w-4" /></Button>
                            <FormField control={form.control} name={`integridadeFornos.limpezaPiso.${index}.data`} render={({ field }) => ( <FormItem><FormLabel>Data da limpeza</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className="w-full justify-start text-left font-normal">{field.value ? format(new Date(field.value), "PPP", { locale: ptBR }) : <span>Escolha uma data</span>}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={new Date(field.value)} onSelect={field.onChange} /></PopoverContent></Popover></FormItem> )} />
                            <FormField control={form.control} name={`integridadeFornos.limpezaPiso.${index}.duracao`} render={({ field }) => ( <FormItem><FormLabel>Tempo de duração</FormLabel><FormControl><Input {...field} /></FormControl></FormItem> )} />
                        </div>
                    ))}
                </div>
                <div className="space-y-4 rounded-md border p-4">
                    <div className="flex justify-between items-center"><h3 className="text-lg font-medium">4.3 Limpeza das conexões e aberturas</h3><Button size="sm" type="button" onClick={() => appendLimpezaConexoes({data: new Date(), duracao: '', operacao: ''})}><PlusCircle className="mr-2 h-4 w-4" /> Add</Button></div>
                     {limpezaConexoesFields.map((field, index) => (
                        <div key={field.id} className="p-4 border rounded-md relative space-y-4">
                             <Button type="button" variant="destructive" size="icon" className="absolute top-2 right-2 h-6 w-6" onClick={() => removeLimpezaConexoes(index)}><Trash2 className="h-4 w-4" /></Button>
                            <FormField control={form.control} name={`integridadeFornos.limpezaConexoes.${index}.data`} render={({ field }) => ( <FormItem><FormLabel>Data de realização</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className="w-full justify-start text-left font-normal">{field.value ? format(new Date(field.value), "PPP", { locale: ptBR }) : <span>Escolha uma data</span>}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={new Date(field.value)} onSelect={field.onChange} /></PopoverContent></Popover></FormItem> )} />
                            <FormField control={form.control} name={`integridadeFornos.limpezaConexoes.${index}.duracao`} render={({ field }) => ( <FormItem><FormLabel>Tempo de duração</FormLabel><FormControl><Input {...field} /></FormControl></FormItem> )} />
                            <FormField control={form.control} name={`integridadeFornos.limpezaConexoes.${index}.operacao`} render={({ field }) => ( <FormItem><FormLabel>Operação realizada</FormLabel><FormControl><Textarea {...field} /></FormControl></FormItem> )} />
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
            Cancelar
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...
              </>
            ) : (
              'Salvar Relatório'
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}

  