
'use client';
import { useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, PlusCircle, RefreshCw, Share2, Download, Trash2, Folder } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { InventarioForm } from './inventario-form';
import { useCollection, useFirebase, useMemoFirebase, errorEmitter } from '@/firebase';
import { collection, doc, deleteDoc } from 'firebase/firestore';
import type { InventoryProject } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { FirestorePermissionError } from '@/firebase/errors';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { useRouter } from 'next/navigation';

export default function InventarioFlorestalPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryProject | null>(null);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const router = useRouter();
  const { firestore, user } = useFirebase();
  const { toast } = useToast();
  
  const inventoriesQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, 'inventories');
    // If you only want users to see their own, you would add:
    // return query(collection(firestore, 'inventories'), where('ownerId', '==', user.uid));
  }, [firestore, user]);

  const { data: projects, isLoading } = useCollection<InventoryProject>(inventoriesQuery);

  const handleAddNew = () => {
    setEditingItem(null);
    setIsDialogOpen(true);
  };
  
  const handleEdit = (item: InventoryProject) => {
    setEditingItem(item);
    setIsDialogOpen(true);
  }

  const openDeleteConfirm = (itemId: string) => {
    setItemToDelete(itemId);
    setIsAlertOpen(true);
  };

  const handleDelete = () => {
    if (!firestore || !itemToDelete) return;
    const docRef = doc(firestore, 'inventories', itemToDelete);
    deleteDoc(docRef)
      .then(() => {
        toast({
          title: 'Inventário deletado',
          description: 'O projeto foi removido com sucesso.',
        });
      })
      .catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
          path: docRef.path,
          operation: 'delete',
        });
        errorEmitter.emit('permission-error', permissionError);
      })
      .finally(() => {
        setIsAlertOpen(false);
        setItemToDelete(null);
      });
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
  };
  
  const handleOpenProject = (projectId: string) => {
    router.push(`/studies/inventario/${projectId}`);
  };

  return (
    <>
      <div className="flex flex-col h-full">
        <PageHeader title="Inventário Florestal - Projetos" />
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <Card>
            <CardHeader>
                <div className='flex justify-between items-start'>
                    <div>
                        <CardTitle>Gerenciamento de Inventários</CardTitle>
                        <CardDescription>Crie, edite e visualize todos os seus projetos de inventário florestal.</CardDescription>
                    </div>
                    <Button size="sm" className="gap-1" onClick={handleAddNew}>
                        <PlusCircle className="h-4 w-4" />
                        Novo Inventário
                    </Button>
                </div>
                 <div className="text-sm text-muted-foreground pt-4">
                    <p>
                        Cadastrados: <span className="font-semibold text-primary">{projects?.length || 0}</span> | 
                        Sincronizar com aplicativo: <span className="font-semibold text-primary">0</span> | 
                        Compartilhados por você: <span className="font-semibold text-primary">0</span> | 
                        Compartilhados com você: <span className="font-semibold text-primary">0</span>
                    </p>
                </div>
            </CardHeader>
            <CardContent>
              <TooltipProvider>
                <div className="space-y-4">
                  {isLoading && Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
                  
                  {!isLoading && projects?.map((project) => (
                    <Card key={project.id} className="flex items-center justify-between p-4">
                      <div>
                        <h3 className="font-semibold">{project.nome}</h3>
                        <p className="text-sm text-muted-foreground">
                          {project.tipoProjeto.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} - {formatDate(project.data)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                          <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" onClick={() => handleOpenProject(project.id)}><Folder className="w-4 h-4" /></Button></TooltipTrigger><TooltipContent><p>Abrir projeto</p></TooltipContent></Tooltip>
                          <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon"><RefreshCw className="w-4 h-4" /></Button></TooltipTrigger><TooltipContent><p>Sincronizar</p></TooltipContent></Tooltip>
                          <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon"><Share2 className="w-4 h-4" /></Button></TooltipTrigger><TooltipContent><p>Compartilhar</p></TooltipContent></Tooltip>
                          <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon"><Download className="w-4 h-4" /></Button></TooltipTrigger><TooltipContent><p>Baixar</p></TooltipContent></Tooltip>
                          <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" onClick={() => openDeleteConfirm(project.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button></TooltipTrigger><TooltipContent><p>Deletar</p></TooltipContent></Tooltip>
                      </div>
                    </Card>
                  ))}

                  {!isLoading && projects?.length === 0 && (
                    <div className="h-24 text-center flex items-center justify-center border-2 border-dashed rounded-md">
                      <p>Nenhum inventário encontrado.</p>
                    </div>
                  )}
                </div>
              </TooltipProvider>
            </CardContent>
          </Card>
        </main>
      </div>

       <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Editar Projeto' : 'Novo Projeto de Inventário'}</DialogTitle>
            <DialogDescription>
                {editingItem ? 'Edite as informações do seu projeto.' : 'Preencha as informações abaixo para criar um novo projeto.'}
            </DialogDescription>
          </DialogHeader>
          <InventarioForm
            currentItem={editingItem}
            onSuccess={() => setIsDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

       <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso irá deletar permanentemente o projeto de inventário.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Deletar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
