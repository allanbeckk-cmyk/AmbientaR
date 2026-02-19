
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, CalendarIcon, PlusCircle, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import type { Empreendedor, Project } from '@/lib/types';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CardFooter } from '@/components/ui/card';
import { SignaturePad } from '@/components/ui/signature-pad';


const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const inconformidadeSchema = z.object({
  description: z.string().min(10, 'A descrição da inconformidade é obrigatória.'),
  criticality: z.enum(['Baixa', 'Média', 'Alta', 'Urgente']),
  imageUrls: z.array(z.string()).optional(),
});

const inspectionSchema = z.object({
  empreendedorId: z.string().min(1, 'Selecione um empreendedor.'),
  projectId: z.string().min(1, 'Selecione um empreendimento.'),
  inspectionDate: z.date({ required_error: 'A data da vistoria é obrigatória.' }),
  inconformidades: z.array(inconformidadeSchema).min(1, "Adicione pelo menos uma inconformidade ou observação."),
  accompaniedBy: z.string().optional(),
  signatureUrl: z.string().optional(),
});

type InspectionFormValues = z.infer<typeof inspectionSchema>;

interface InspectionFormProps {
    onSuccess: () => void;
}

export function InspectionForm({ onSuccess }: InspectionFormProps) {
  const [loading, setLoading] = React.useState(false);

  const { toast } = useToast();
  const { firestore, user } = useFirebase();

  const empreendedoresQuery = useMemoFirebase(() => firestore ? collection(firestore, 'empreendedores') : null, [firestore]);
  const { data: empreendedores, isLoading: isLoadingEmpreendedores } = useCollection<Empreendedor>(empreendedoresQuery);

  const projectsQuery = useMemoFirebase(() => firestore ? collection(firestore, 'projects') : null, [firestore]);
  const { data: allProjects, isLoading: isLoadingProjects } = useCollection<Project>(projectsQuery);

  const form = useForm<InspectionFormValues>({
    resolver: zodResolver(inspectionSchema),
    defaultValues: {
      empreendedorId: '',
      projectId: '',
      inspectionDate: new Date(),
      inconformidades: [],
      accompaniedBy: '',
      signatureUrl: '',
    },
  });
  
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'inconformidades'
  });

  const selectedEmpreendedorId = form.watch('empreendedorId');

  const filteredProjects = React.useMemo(() => {
    if (!allProjects || !selectedEmpreendedorId) return [];
    return allProjects.filter(p => p.empreendedorId === selectedEmpreendedorId);
  }, [allProjects, selectedEmpreendedorId]);
  
  React.useEffect(() => {
    form.resetField('projectId');
  }, [selectedEmpreendedorId, form]);

  async function onSubmit(values: InspectionFormValues) {
    if (!firestore || !user) {
      toast({ variant: 'destructive', title: 'Erro de Autenticação' });
      return;
    }
    setLoading(true);
    
    const dataToSave = {
        ...values,
        inspectionDate: values.inspectionDate.toISOString(),
        inspectorId: user.uid,
        inspectorName: user.name || user.email,
        createdAt: serverTimestamp(),
        status: 'Em Aberto',
    };

    try {
      await addDoc(collection(firestore, 'inspections'), dataToSave);

      toast({
        title: 'Vistoria Registrada!',
        description: 'O registro da vistoria foi salvo com sucesso.',
      });
      form.reset();
      onSuccess();
    } catch (error) {
      console.error('Error creating inspection:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao Salvar',
        description: 'Não foi possível registrar a vistoria.',
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
            control={form.control}
            name="empreendedorId"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Empreendedor</FormLabel>
                <Select onValueChange={field.onChange} value={field.value} disabled={isLoadingEmpreendedores}>
                    <FormControl>
                    <SelectTrigger>
                        <SelectValue placeholder={isLoadingEmpreendedores ? 'Carregando...' : 'Selecione o empreendedor'} />
                    </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                    {empreendedores?.map(e => (
                        <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                    ))}
                    </SelectContent>
                </Select>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
            control={form.control}
            name="projectId"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Empreendimento</FormLabel>
                <Select onValueChange={field.onChange} value={field.value} disabled={!selectedEmpreendedorId || isLoadingProjects}>
                    <FormControl>
                    <SelectTrigger>
                        <SelectValue placeholder={!selectedEmpreendedorId ? 'Selecione um empreendedor primeiro' : 'Selecione o empreendimento'} />
                    </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                    {filteredProjects.map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.propertyName}</SelectItem>
                    ))}
                    </SelectContent>
                </Select>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
            control={form.control}
            name="inspectionDate"
            render={({ field }) => (
                <FormItem className="flex flex-col">
                <FormLabel>Data da Vistoria</FormLabel>
                <Popover>
                    <PopoverTrigger asChild>
                    <FormControl>
                        <Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                        {field.value ? format(field.value, "PPP", { locale: ptBR }) : <span>Escolha uma data</span>}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                    </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(date) => date > new Date()} initialFocus />
                    </PopoverContent>
                </Popover>
                <FormMessage />
                </FormItem>
            )}
            />

            <div className="space-y-4 rounded-md border p-4">
                <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">Inconformidades</h3>
                    <Button type="button" size="sm" onClick={() => append({ description: '', criticality: 'Baixa', imageUrls: [] })}>
                        <PlusCircle className="h-4 w-4 mr-2" />
                        Adicionar Inconformidade
                    </Button>
                </div>
                {fields.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">Nenhuma inconformidade adicionada.</p>
                )}
                <div className="space-y-4">
                    {fields.map((field, index) => {
                        return (
                            <div key={field.id} className="p-4 border rounded-md relative space-y-4">
                                <Button type="button" variant="destructive" size="icon" className="absolute top-2 right-2 h-6 w-6" onClick={() => remove(index)}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                                <FormField
                                    control={form.control}
                                    name={`inconformidades.${index}.description`}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Descrição da Inconformidade</FormLabel>
                                            <FormControl>
                                                <Textarea placeholder="Descreva a não conformidade, ponto de atenção ou observação geral." {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name={`inconformidades.${index}.criticality`}
                                        render={({ field }) => (
                                            <FormItem>
                                            <FormLabel>Criticidade</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Selecione o nível" />
                                                </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                {['Baixa', 'Média', 'Alta', 'Urgente'].map(level => (
                                                    <SelectItem key={level} value={level}>{level}</SelectItem>
                                                ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>
                        )
                    })}
                </div>
                 <FormMessage>{form.formState.errors.inconformidades?.message}</FormMessage>
            </div>
            
             <div className="space-y-4 rounded-md border p-4">
                <h3 className="text-lg font-medium">Finalização</h3>
                 <FormField
                    control={form.control}
                    name="accompaniedBy"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Nome de quem acompanhou a vistoria</FormLabel>
                        <FormControl>
                            <Input placeholder="Nome completo" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="signatureUrl"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Assinatura Digital (Opcional)</FormLabel>
                            <FormControl>
                                <SignaturePad onSignatureEnd={(dataUrl) => field.onChange(dataUrl)} />
                            </FormControl>
                            <FormDescription>
                                Peça para a pessoa que acompanhou assinar no quadro acima.
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
            
            <CardFooter className="p-0 pt-6">
                <Button type="submit" disabled={loading} className="w-full">
                {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...</> : 
                'Salvar Registro de Vistoria'}
                </Button>
            </CardFooter>
        </form>
    </Form>
  );
}
