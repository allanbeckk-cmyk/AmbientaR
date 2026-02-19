
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
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { DialogFooter } from '@/components/ui/dialog';
import { Loader2, HelpCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useFirebase, errorEmitter } from '@/firebase';
import { FirestorePermissionError } from '@/firebase/errors';
import { collection, doc, addDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import type { InventoryProject } from '@/lib/types';


const projectTypes = [
    {
        id: 'simples_casuais',
        name: 'Simples e casuais',
        title: 'Projeto Amostragem Casual Simples',
        characteristics: [
            'Projeto de parcela de área fixa.',
            'Amostragem Casual Simples.',
            'Permite cadastrar Espécies, Parcelas, Árvores, Atributos de Espécie, Atributos de Parcela, Atributos de Árvore, Nível de Inclusão, Unidade Primária, Classes de regeneração, Classes de Qualidade de Fuste, e concentrações para árvores.'
        ],
        application: 'Este projeto atende a inventários nos quais as unidades de amostra são selecionadas aleatoriamente e a área florestal a ser inventariada é tratada como uma população única.'
    },
    {
        id: 'estrategia_casual',
        name: 'Estratégia Casual',
        title: 'Projeto Amostragem Estratificada',
        characteristics: [
            'Permite a divisão da população em subpopulações (estratos).',
            'Amostragem Casual Simples dentro de cada estrato.',
            'Cálculos realizados separadamente por estrato e depois combinados para a população total.'
        ],
        application: 'Ideal para florestas heterogêneas onde a variabilidade dentro dos estratos é menor que a variabilidade total da floresta.'
    },
    {
        id: 'dois_estagios',
        name: 'Amostragem em Dois Estágios',
        title: 'Projeto Amostragem em Dois Estágios',
        characteristics: [
            'Projeto de parcela de área fixa.',
            'Amostragem Casual Estratificada ou Casual Simples.',
            'Permite cadastrar Espécies, Parcelas, Árvores, Atributos de Espécie, Atributos de Parcela, Atributos de Árvore, Nível de Inclusão, Unidade Primária, Classes de regeneração, Classes de Qualidade de Fuste, Estrato de área, e coordenadas para árvores.'
        ],
        application: 'Este projeto atende a inventários nos quais as unidades amostrais são selecionadas aleatoriamente em cada estrato da floresta.'
    },
    {
        id: 'conglomerado',
        name: 'Conglomerado',
        title: 'Projeto Amostragem por Conglomerados',
        characteristics: [
          'A população é dividida em grupos (conglomerados).',
          'Uma amostra aleatória de conglomerados é selecionada e todos os indivíduos dentro dos conglomerados selecionados são medidos.',
        ],
        application: 'Útil quando é mais fácil amostrar grupos de indivíduos do que indivíduos espalhados por toda a área.'
    },
    {
        id: 'sistematica_um_estagio',
        name: 'Sistemática em Um Estágio',
        title: 'Projeto Amostragem Sistemática em Um Estágio',
        characteristics: [
          'As unidades amostrais são selecionadas a partir de um ponto inicial aleatório e depois em intervalos fixos.',
          'Garante uma cobertura uniforme da área florestal.',
        ],
        application: 'Muito utilizado na prática florestal pela sua simplicidade e por garantir que toda a área seja coberta pela amostragem.'
    },
    {
        id: 'sistematica_dois_estagios',
        name: 'Sistemática em Dois Estágios',
        title: 'Projeto Amostragem Sistemática em Dois Estágios',
        characteristics: [
          'Combina amostragem sistemática com amostragem em estágios.',
          'Primeiro estágio pode selecionar unidades primárias de forma sistemática, e o segundo estágio amostra dentro dessas unidades.',
        ],
        application: 'Aplicável em grandes áreas onde uma amostragem sistemática pura seria logisticamente inviável.'
    },
    {
        id: 'inventario_100',
        name: 'Inventário 100%',
        title: 'Projeto Inventário 100% (Censo Florestal)',
        characteristics: [
          'Todos os indivíduos da população de interesse são medidos.',
          'Não envolve amostragem, mas sim um censo completo da área.',
        ],
        application: 'Geralmente aplicado em áreas pequenas ou para fins específicos que exigem o conhecimento de cada árvore, como em planos de manejo de corte seletivo.'
    },
];

const formSchema = z.object({
  nome: z.string().min(1, "O nome do projeto é obrigatório."),
  descricao: z.string().optional(),
  data: z.date({ required_error: 'A data é obrigatória.' }),
  tipoProjeto: z.string({ required_error: 'Selecione um tipo de projeto.' }),
});

type FormValues = z.infer<typeof formSchema>;

interface InventarioFormProps {
  currentItem?: InventoryProject | null;
  onSuccess?: () => void;
}


export function InventarioForm({ currentItem, onSuccess }: InventarioFormProps) {
  const [loading, setLoading] = React.useState(false);
  const [selectedProjectType, setSelectedProjectType] = React.useState(projectTypes[0]);
  const [tourStep, setTourStep] = React.useState(0);
  const { toast } = useToast();
  const { firestore, user } = useFirebase();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: currentItem ? {
      nome: currentItem.nome,
      descricao: currentItem.descricao,
      data: new Date(currentItem.data),
      tipoProjeto: currentItem.tipoProjeto,
    } : {
      nome: '',
      descricao: '',
      data: new Date(),
      tipoProjeto: projectTypes[0].id,
    },
  });
  
  const watchedProjectType = form.watch('tipoProjeto');

  React.useEffect(() => {
    const newSelectedType = projectTypes.find(p => p.id === watchedProjectType);
    if (newSelectedType) {
        setSelectedProjectType(newSelectedType);
    }
  }, [watchedProjectType]);

  async function onSubmit(values: FormValues) {
    setLoading(true);

    if (!firestore || !user) {
      toast({ variant: 'destructive', title: 'Erro de Autenticação', description: 'Você precisa estar logado para criar um projeto.' });
      setLoading(false);
      return;
    }
    
    const dataToSave = {
        ...values,
        data: values.data.toISOString(),
        ownerId: user.uid,
        createdAt: serverTimestamp(),
    };

    try {
        if (currentItem) {
            const docRef = doc(firestore, 'inventories', currentItem.id);
            await updateDoc(docRef, dataToSave);
            toast({
                title: "Projeto Atualizado!",
                description: `O projeto de inventário "${values.nome}" foi atualizado com sucesso.`
            });
        } else {
            await addDoc(collection(firestore, 'inventories'), dataToSave);
            toast({
                title: "Projeto Criado!",
                description: `O projeto de inventário "${values.nome}" foi criado com sucesso.`
            });
        }
        form.reset();
        onSuccess?.();
    } catch (e: any) {
        console.error("Error saving inventory project:", e);
        const collectionName = 'inventories';
        const docRef = currentItem ? doc(firestore, collectionName, currentItem.id) : collection(firestore, collectionName);
        const permissionError = new FirestorePermissionError({
            path: currentItem ? docRef.path : collectionName,
            operation: currentItem ? 'update' : 'create',
            requestResourceData: dataToSave,
          });
        errorEmitter.emit('permission-error', permissionError);
    } finally {
        setLoading(false);
    }
  }
  
  const startTour = () => setTourStep(1);
  const nextStep = () => setTourStep(s => s + 1);
  const prevStep = () => setTourStep(s => s - 1);
  const finishTour = () => setTourStep(0);


  return (
      <>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                     <FormItem data-tour-id="project-name-input">
                        <FormField
                            control={form.control}
                            name="nome"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Nome do Projeto: *</FormLabel>
                                <FormControl>
                                    <Input placeholder="Nome do Projeto" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                    </FormItem>
                    <FormField
                    control={form.control}
                    name="data"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Data de:</FormLabel>
                        <FormControl>
                            <Input type="date" {...field} value={form.getValues('data')?.toISOString().split('T')[0]} onChange={(e) => field.onChange(new Date(e.target.value))} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                </div>
                 <FormItem data-tour-id="project-description-input">
                    <FormField
                        control={form.control}
                        name="descricao"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Descrição:</FormLabel>
                            <FormControl>
                            <Textarea placeholder="Descreva seu projeto aqui." {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                </FormItem>
                
                <FormField
                    control={form.control}
                    name="tipoProjeto"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Selecione o tipo de projeto: *</FormLabel>
                        <div className="flex gap-6">
                            <div className="flex-shrink-0" data-tour-id="project-type-list">
                                <RadioGroup
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                    className="flex flex-col space-y-1"
                                >
                                    {projectTypes.map(type => (
                                        <FormItem key={type.id} className="flex-1">
                                            <FormControl>
                                                <RadioGroupItem value={type.id} className="sr-only" />
                                            </FormControl>
                                            <FormLabel className={`font-normal w-full block p-2 rounded-md cursor-pointer text-center ${field.value === type.id ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}>
                                                {type.name}
                                            </FormLabel>
                                        </FormItem>
                                    ))}
                                </RadioGroup>
                            </div>
                            <div className="flex-1 p-4 bg-muted/50 rounded-md" data-tour-id="project-type-details">
                                <h4 className="font-semibold">{selectedProjectType.title}</h4>
                                <p className="text-sm text-muted-foreground mb-4">{selectedProjectType.name}</p>
                                <h5 className="font-semibold text-sm">CARACTERÍSTICAS:</h5>
                                <ul className="list-disc pl-5 text-sm text-muted-foreground mb-4">
                                    {selectedProjectType.characteristics.map((char, i) => <li key={i}>{char}</li>)}
                                </ul>
                                <h5 className="font-semibold text-sm">APLICAÇÃO:</h5>
                                <p className="text-sm text-muted-foreground">{selectedProjectType.application}</p>
                            </div>
                        </div>
                        <FormMessage />
                    </FormItem>
                    )}
                />

                <DialogFooter className="justify-between pt-4">
                    <div>
                        <Button type="button" variant="outline" onClick={startTour}>
                            <HelpCircle className="mr-2 h-4 w-4" />
                            Ajuda
                        </Button>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" type="button" onClick={onSuccess}>Cancelar</Button>
                        <Button type="submit" disabled={loading}>
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Criar projeto
                        </Button>
                    </div>
                </DialogFooter>
            </form>
        </Form>
        
        {Array.from({ length: 4 }).map((_, i) => (
             <AlertDialog key={i} open={tourStep === i + 1} onOpenChange={(open) => !open && finishTour()}>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                        {
                            [
                                "Nome do Projeto",
                                "Descrição do Projeto",
                                "Tipo de Inventário",
                                "Detalhes do Tipo de Projeto"
                            ][i]
                        }
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                         {
                            [
                                "Você deve preencher, obrigatoriamente, o nome do projeto.",
                                "A descrição é opcional, mas ajudará você a identificar o projeto.",
                                "Selecione o tipo de inventário florestal que deseja realizar.",
                                "Aqui você verá as características e a aplicação do tipo de projeto selecionado."
                            ][i]
                        }
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel onClick={finishTour}>Fechar</AlertDialogCancel>
                    {i > 0 && <Button variant="outline" onClick={prevStep}>Anterior</Button>}
                    {i < 3 ? <AlertDialogAction onClick={nextStep}>Próximo</AlertDialogAction> : <AlertDialogAction onClick={finishTour}>Finalizar</AlertDialogAction>}
                  </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        ))}
      </>
  );
}
