'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useDoc, useFirebase, errorEmitter } from '@/firebase';
import { doc, addDoc, collection, serverTimestamp, updateDoc } from 'firebase/firestore';
import type { InventoryProject } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Import,
  Copy,
  Camera,
  Pencil,
  Ban,
  Save,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import Image from 'next/image';
import { ImportDialog } from './import-dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { FirestorePermissionError } from '@/firebase/errors';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';


const formSchema = z.object({
  nome: z.string().min(1, "O nome do projeto é obrigatório."),
  descricao: z.string().optional(),
  data: z.date(),
  // Add other fields as they become editable
});

type FormValues = z.infer<typeof formSchema>;


const DetailItem = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="flex flex-col gap-1">
    <p className="text-sm font-medium text-muted-foreground">{label}</p>
    <div className="text-base">{value || 'Não informado'}</div>
  </div>
);

export default function InventarioProjectPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const [isImporting, setIsImporting] = React.useState(false);
  const [isDuplicateAlertOpen, setIsDuplicateAlertOpen] = React.useState(false);
  const [isDuplicating, setIsDuplicating] = React.useState(false);
  const [isEditing, setIsEditing] = React.useState(false);
  const { toast } = useToast();

  const { firestore, user } = useFirebase();

  const projectDocRef = React.useMemo(() => {
    if (!firestore || !projectId) return null;
    return doc(firestore, 'inventories', projectId);
  }, [firestore, projectId]);

  const { data: project, isLoading } = useDoc<InventoryProject>(projectDocRef);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: project ? {
        nome: project.nome,
        descricao: project.descricao,
        data: new Date(project.data)
    } : undefined
  });

  React.useEffect(() => {
    if (project) {
      form.reset({
        nome: project.nome,
        descricao: project.descricao,
        data: new Date(project.data),
      });
    }
  }, [project, form]);


  const formatDate = (date: Date | string) => {
    if (!date) return 'N/A';
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
  };
  
  const handleDuplicateProject = async () => {
    if (!project || !firestore || !user) {
        toast({
            variant: 'destructive',
            title: 'Erro',
            description: 'Não foi possível duplicar o projeto. Dados do projeto ou do usuário não encontrados.',
        });
        return;
    }
    setIsDuplicating(true);

    const { id, nome, ...restOfProject } = project;
    
    const newProjectData = {
        ...restOfProject,
        nome: `Cópia de ${nome}`,
        data: new Date().toISOString(), // Set to current date
        ownerId: user.uid,
        createdAt: serverTimestamp(),
    };

    try {
        await addDoc(collection(firestore, 'inventories'), newProjectData);
        toast({
            title: 'Projeto Duplicado!',
            description: `O projeto "${newProjectData.nome}" foi criado com sucesso.`
        });
        setIsDuplicateAlertOpen(false);
    } catch (error) {
        console.error("Error duplicating project:", error);
         const permissionError = new FirestorePermissionError({
          path: 'inventories',
          operation: 'create',
          requestResourceData: newProjectData,
        });
        errorEmitter.emit('permission-error', permissionError);
    } finally {
        setIsDuplicating(false);
    }
  };

  const handleSaveChanges = async (values: FormValues) => {
    if (!projectDocRef) return;
    form.formState.isSubmitting;
    
    const dataToUpdate = {
        ...values,
        data: values.data.toISOString()
    }
    
    try {
        await updateDoc(projectDocRef, dataToUpdate);
        toast({ title: "Projeto Atualizado", description: "As alterações foram salvas com sucesso." });
        setIsEditing(false);
    } catch (error) {
         console.error("Error updating project:", error);
         const permissionError = new FirestorePermissionError({
            path: projectDocRef.path,
            operation: 'update',
            requestResourceData: dataToUpdate,
        });
        errorEmitter.emit('permission-error', permissionError);
    } finally {
        // Here we keep editing mode, but disable loading state. You might want to set isEditing to false.
        // For now, let's just stop the loading indicator on the button. Let's assume you want to keep editing.
    }
  }
  
  const handleDiscardChanges = () => {
    if (project) {
        form.reset({
            nome: project.nome,
            descricao: project.descricao,
            data: new Date(project.data),
        });
    }
    setIsEditing(false);
  }

  if (isLoading) {
    return (
        <main className="flex-1 p-6">
            <Skeleton className="h-10 w-1/4 mb-4" />
            <Skeleton className="h-96 w-full" />
        </main>
    );
  }

  if (!project) {
    return (
       <main className="flex-1 p-6">
        <h1 className="text-2xl font-bold">Projeto não encontrado</h1>
        <p>O projeto que você está procurando não existe ou foi movido.</p>
        <Button onClick={() => router.back()} className="mt-4">Voltar</Button>
      </main>
    );
  }

  return (
    <>
        <header className="flex h-16 items-center justify-between border-b bg-background px-6">
          <h1 className="text-xl font-semibold">{project.nome}</h1>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsImporting(true)}><Import className="mr-2 h-4 w-4"/>Importar Planilha</Button>
             <AlertDialog open={isDuplicateAlertOpen} onOpenChange={setIsDuplicateAlertOpen}>
                <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm"><Copy className="mr-2 h-4 w-4"/>Duplicar Projeto</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                    <AlertDialogTitle>Duplicar Projeto</AlertDialogTitle>
                     <AlertDialogDescription asChild>
                      <div>
                        <div className="p-4 rounded-md bg-yellow-50 border border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800 flex items-start gap-4">
                            <AlertTriangle className="h-5 w-5 text-yellow-500 mt-1" />
                            <div className="text-sm text-yellow-800 dark:text-yellow-300">
                                <div className="font-bold">Atenção!</div>
                                <div className="mt-1">Ao duplicar este projeto, um novo será criado com os mesmos recursos, exceto pelas fotos da árvore e o histórico de cálculos existentes.</div>
                                <div className="mt-2">Apenas o proprietário atual do projeto poderá executar esta ação, e somente ele poderá acessar o novo projeto inicialmente. Podendo compartilhar com outros usuários após sua criação.</div>
                            </div>
                        </div>
                      </div>
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                    <AlertDialogCancel disabled={isDuplicating}>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDuplicateProject} disabled={isDuplicating}>
                        {isDuplicating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Duplicar
                    </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            <Button variant="outline" size="sm"><Camera className="mr-2 h-4 w-4"/>Fotos do Projeto</Button>
            <Separator orientation="vertical" className="h-6" />
            
            {isEditing ? (
                 <>
                    <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={handleDiscardChanges}><Ban className="mr-2 h-4 w-4"/>Descartar Alterações</Button>
                    <Button size="sm" onClick={form.handleSubmit(handleSaveChanges)} disabled={form.formState.isSubmitting}>
                        {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        <Save className="mr-2 h-4 w-4"/>Salvar Alterações
                    </Button>
                 </>
            ) : (
                 <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}><Pencil className="mr-2 h-4 w-4"/>Habilitar Edição</Button>
            )}
          </div>
        </header>
        
        <main className="flex-1 p-6">
          <Card>
            <CardHeader>
              <CardTitle>Informações do Projeto</CardTitle>
            </CardHeader>
            <CardContent>
             <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSaveChanges)}>
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                  <div className="md:col-span-3 flex flex-col items-center justify-center">
                      <Image src="/images/tree-logo.svg" alt="Tree Logo" width={150} height={150} />
                      {isEditing && (
                          <div className="flex gap-2 mt-4">
                              <Button size="sm" variant="destructive">Remover Imagem</Button>
                              <Button size="sm" variant="outline">Mudar Imagem</Button>
                          </div>
                      )}
                  </div>
                  <div className="md:col-span-9 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {isEditing ? (
                        <>
                            <FormField control={form.control} name="nome" render={({ field }) => (<FormItem><FormLabel>Nome</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormItem><FormLabel>Tipo</FormLabel><p className="pt-2 text-base">{project.tipoProjeto.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</p></FormItem>
                            <FormItem><FormLabel>Nome da Empresa</FormLabel><FormControl><Input placeholder="Não informado"/></FormControl></FormItem>
                             <FormField control={form.control} name="data" render={({ field }) => (<FormItem><FormLabel>Data</FormLabel><FormControl><Input type="date" value={format(field.value, 'yyyy-MM-dd')} onChange={(e) => field.onChange(new Date(e.target.value))}/></FormControl><FormMessage /></FormItem>)} />
                            <FormItem><FormLabel>Área do Projeto (ha)</FormLabel><FormControl><Input type="number" placeholder="Não informado"/></FormControl></FormItem>
                            <FormField control={form.control} name="descricao" render={({ field }) => (<FormItem className="sm:col-span-2 lg:col-span-3"><FormLabel>Descrição</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>)} />
                        </>
                    ) : (
                        <>
                          <DetailItem label="Nome" value={project.nome} />
                          <DetailItem label="Tipo" value={project.tipoProjeto.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} />
                          <DetailItem label="Nome da Empresa" value="Não informado" />
                          <DetailItem label="Data" value={formatDate(project.data)} />
                           <DetailItem label="Área do Projeto (ha)" value="Não informado" />
                          <DetailItem label="Descrição" value={project.descricao} />
                        </>
                    )}
                    <DetailItem label="Casas Decimais" value={5} />
                    <DetailItem label="Identificação dos Fustes da Árvore" value="Número da Árvore Igual" />
                    <DetailItem label="Forma da Parcela" value="Retangular" />
                     {isEditing ? (
                        <FormItem className="sm:col-span-2 lg:col-span-3"><FormLabel>Observações</FormLabel><FormControl><Textarea placeholder="Não informado"/></FormControl></FormItem>
                    ) : (
                         <DetailItem label="Observações" value={project.descricao || 'Não informado'} />
                    )}
                  </div>
                </div>
              </form>
             </Form>
            </CardContent>
          </Card>
        </main>
        <ImportDialog isOpen={isImporting} onOpenChange={setIsImporting} />
    </>
  );
}
