
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
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Empreendedor as Client, Project } from '@/lib/types';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useRouter } from 'next/navigation';

// Simplified schema for LAS-RAS
const formSchema = z.object({
    empreendedorId: z.string().min(1, 'Selecione um empreendedor.'),
    projectId: z.string().min(1, 'Selecione um empreendimento.'),
    caracterizacaoEmpreendimento: z.string().min(1, 'A caracterização é obrigatória.'),
    caracterizacaoArea: z.string().min(1, 'A caracterização da área é obrigatória.'),
    diagnosticoAmbiental: z.string().min(1, 'O diagnóstico ambiental é obrigatório.'),
    impactosAmbientais: z.string().min(1, 'A descrição dos impactos é obrigatória.'),
    medidasControle: z.string().min(1, 'As medidas de controle são obrigatórias.'),
});

type FormValues = z.infer<typeof formSchema>;

export function LasRasForm() {
  const [loading, setLoading] = React.useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const { firestore } = useFirebase();

  const clientsQuery = useMemoFirebase(() => firestore ? collection(firestore, 'empreendedores') : null, [firestore]);
  const { data: clients, isLoading: isLoadingClients } = useCollection<Client>(clientsQuery);
  const projectsQuery = useMemoFirebase(() => firestore ? collection(firestore, 'projects') : null, [firestore]);
  const { data: projects, isLoading: isLoadingProjects } = useCollection<Project>(projectsQuery);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
        empreendedorId: '',
        projectId: '',
        caracterizacaoEmpreendimento: '',
        caracterizacaoArea: '',
        diagnosticoAmbiental: '',
        impactosAmbientais: '',
        medidasControle: '',
    },
  });

  const selectedClientId = form.watch('empreendedorId');
  
  const filteredProjects = React.useMemo(() => {
    if (!projects) return [];
    return projects.filter(p => p.empreendedorId === selectedClientId);
  }, [projects, selectedClientId]);

  async function onSubmit(values: FormValues) {
    setLoading(true);
    console.log("LAS-RAS Form Data:", values);
    await new Promise(resolve => setTimeout(resolve, 1000));
    toast({
      title: 'RAS Salvo com Sucesso!',
      description: 'Seu Relatório Ambiental Simplificado foi salvo.',
    });
    setLoading(false);
    // Optionally redirect or clear form
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="h-full flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto pr-4 -mr-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
                control={form.control}
                name="empreendedorId"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Empreendedor</FormLabel>
                    <Select onValueChange={(value) => { field.onChange(value); form.resetField('projectId'); }} defaultValue={field.value} disabled={isLoadingClients}>
                    <FormControl>
                        <SelectTrigger>
                        <SelectValue placeholder={isLoadingClients ? "Carregando..." : "Selecione o empreendedor"} />
                        </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                        {clients?.map(client => (
                        <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
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
                    <Select onValueChange={field.onChange} value={field.value || ''} disabled={!selectedClientId || isLoadingProjects}>
                    <FormControl>
                        <SelectTrigger>
                        <SelectValue placeholder={!selectedClientId ? "Selecione um empreendedor primeiro" : "Selecione o empreendimento"} />
                        </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                        {filteredProjects.map(project => (
                        <SelectItem key={project.id} value={project.id}>{project.propertyName}</SelectItem>
                        ))}
                    </SelectContent>
                    </Select>
                    <FormMessage />
                </FormItem>
                )}
            />
            </div>
            
            <FormField
            control={form.control}
            name="caracterizacaoEmpreendimento"
            render={({ field }) => (
                <FormItem>
                <FormLabel>1. Caracterização do Empreendimento</FormLabel>
                <FormControl>
                    <Textarea className="min-h-24" placeholder="Descrição do empreendimento, atividade, porte, etc." {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
            control={form.control}
            name="caracterizacaoArea"
            render={({ field }) => (
                <FormItem>
                <FormLabel>2. Caracterização da Área de Implantação</FormLabel>
                <FormControl>
                    <Textarea className="min-h-24" placeholder="Localização, uso do solo no entorno, características físicas da área..." {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
            control={form.control}
            name="diagnosticoAmbiental"
            render={({ field }) => (
                <FormItem>
                <FormLabel>3. Diagnóstico Ambiental Simplificado</FormLabel>
                <FormControl>
                    <Textarea className="min-h-24" placeholder="Descrição dos meios físico, biótico e socioeconômico." {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
            control={form.control}
            name="impactosAmbientais"
            render={({ field }) => (
                <FormItem>
                <FormLabel>4. Análise dos Impactos Ambientais</FormLabel>
                <FormControl>
                    <Textarea className="min-h-24" placeholder="Identificação e avaliação dos principais impactos positivos e negativos." {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
            control={form.control}
            name="medidasControle"
            render={({ field }) => (
                <FormItem>
                <FormLabel>5. Medidas de Controle Ambiental</FormLabel>
                <FormControl>
                    <Textarea className="min-h-24" placeholder="Proposição das medidas mitigadoras, de controle e compensatórias." {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>
        <div className="flex justify-end gap-2 pt-4 mt-4 border-t">
            <Button variant="outline" type="button" onClick={() => router.back()}>
                Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
            {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...</> : 'Salvar RAS'}
            </Button>
        </div>
      </form>
    </Form>
  );
}
