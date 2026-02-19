
'use client';
import { useState, useMemo } from 'react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, PlusCircle } from 'lucide-react';
import { useCollection, useFirebase, useMemoFirebase, errorEmitter, useAuth } from '@/firebase';
import { collection, doc, deleteDoc } from 'firebase/firestore';
import type { ManualMonitoringLog, WaterPermit, Project, Client, AppUser } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { FirestorePermissionError } from '@/firebase/errors';
import { MonitoringForm } from './monitoring-form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const canPerformWriteActions = (user: AppUser | null): boolean => {
    if (!user) return false;
    return user.role === 'admin' || user.role === 'gestor';
}

export default function ManualMonitoringPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<ManualMonitoringLog | null>(null);
  const [selectedOutorga, setSelectedOutorga] = useState<string>('');
  const [selectedPonto, setSelectedPonto] = useState<string>('');

  const { firestore, user } = useAuth();
  const { toast } = useToast();
  
  const outorgasQuery = useMemoFirebase(() => firestore ? collection(firestore, 'outorgas') : null, [firestore]);
  const { data: outorgas, isLoading: isLoadingOutorgas } = useCollection<WaterPermit>(outorgasQuery);
  const outorga = useMemo(() => outorgas?.find(o => o.id === selectedOutorga), [outorgas, selectedOutorga]);

  const logsQuery = useMemoFirebase(() => {
    if (!firestore || !user || !selectedPonto) return null;
    return collection(firestore, 'manualMonitoringLogs'); // Simple query for now
  }, [firestore, user, selectedPonto]);

  const { data: logs, isLoading: isLoadingLogs } = useCollection<ManualMonitoringLog>(logsQuery);

  const filteredLogs = useMemo(() => {
    return logs?.filter(log => log.pontoId === selectedPonto && log.outorgaId === selectedOutorga) || [];
  }, [logs, selectedPonto, selectedOutorga]);


  const handleAddNew = () => {
    setEditingItem(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (item: ManualMonitoringLog) => {
    setEditingItem(item);
    setIsDialogOpen(true);
  };

  const openDeleteConfirm = (itemId: string) => {
    setItemToDelete(itemId);
    setIsAlertOpen(true);
  };

  const handleDelete = () => {
    if (!firestore || !itemToDelete) return;
    const docRef = doc(firestore, 'manualMonitoringLogs', itemToDelete);
    deleteDoc(docRef)
      .then(() => {
        toast({ title: 'Lançamento deletado', description: 'O registro foi removido com sucesso.' });
      })
      .catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({ path: docRef.path, operation: 'delete' });
        errorEmitter.emit('permission-error', permissionError);
      })
      .finally(() => {
        setIsAlertOpen(false);
        setItemToDelete(null);
      });
  };

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('pt-BR', { timeZone: 'UTC' });

  return (
    <>
      <div className="flex flex-col h-full">
        <PageHeader title="Monitoramento Manual de Outorgas" />
        <main className="flex-1 overflow-auto p-4 md:p-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Seleção do Ponto de Monitoramento</CardTitle>
              <CardDescription>Selecione a outorga e o ponto de monitoramento para ver ou adicionar registros.</CardDescription>
            </CardHeader>
             <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <Select value={selectedOutorga} onValueChange={setSelectedOutorga} disabled={isLoadingOutorgas}>
                    <SelectTrigger><SelectValue placeholder={isLoadingOutorgas ? "Carregando..." : "Selecione uma Outorga"} /></SelectTrigger>
                    <SelectContent>
                        {outorgas?.map(o => <SelectItem key={o.id} value={o.id}>{o.permitNumber} - {o.description}</SelectItem>)}
                    </SelectContent>
                 </Select>
                 <Select value={selectedPonto} onValueChange={setSelectedPonto} disabled={!outorga || outorga.pontosDeMonitoramento.length === 0}>
                    <SelectTrigger><SelectValue placeholder={!outorga ? "Selecione uma outorga primeiro" : "Selecione um Ponto"} /></SelectTrigger>
                    <SelectContent>
                        {outorga?.pontosDeMonitoramento.map(p => <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>)}
                    </SelectContent>
                 </Select>
            </CardContent>
          </Card>
          
          {selectedPonto && (
            <Card>
                <CardHeader>
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle>Lançamentos de Monitoramento</CardTitle>
                        <CardDescription>Visualize e gerencie os registros diários para o ponto selecionado.</CardDescription>
                    </div>
                    {canPerformWriteActions(user) && (
                        <Button size="sm" className="gap-1" onClick={handleAddNew}>
                            <PlusCircle className="h-4 w-4" />
                            Adicionar Lançamento
                        </Button>
                    )}
                </div>
                </CardHeader>
                <CardContent>
                <Table>
                    <TableHeader>
                    <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Horímetro Início</TableHead>
                        <TableHead>Horímetro Fim</TableHead>
                        <TableHead>Vazão (L/s)</TableHead>
                        <TableHead>Vazão (m³/h)</TableHead>
                        {canPerformWriteActions(user) && (
                            <TableHead><span className="sr-only">Ações</span></TableHead>
                        )}
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {isLoadingLogs && Array.from({ length: 3 }).map((_, i) => (
                        <TableRow key={i}><TableCell colSpan={6}><Skeleton className="h-5 w-full" /></TableCell></TableRow>
                    ))}
                    {!isLoadingLogs && filteredLogs.map((log) => (
                        <TableRow key={log.id}>
                        <TableCell>{formatDate(log.logDate)}</TableCell>
                        <TableCell>{log.horimeterStart}</TableCell>
                        <TableCell>{log.horimeterEnd}</TableCell>
                        <TableCell>{log.flowRateLps}</TableCell>
                        <TableCell>{log.flowRateM3h}</TableCell>
                        {canPerformWriteActions(user) && (
                            <TableCell>
                                <DropdownMenu>
                                <DropdownMenuTrigger asChild><Button aria-haspopup="true" size="icon" variant="ghost"><MoreHorizontal className="h-4 w-4" /><span className="sr-only">Ações</span></Button></DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                    <DropdownMenuItem onClick={() => handleEdit(log)}>Editar</DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem className="text-destructive" onClick={() => openDeleteConfirm(log.id)}>Deletar</DropdownMenuItem>
                                </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                        )}
                        </TableRow>
                    ))}
                    {!isLoadingLogs && filteredLogs.length === 0 && (
                        <TableRow><TableCell colSpan={6} className="h-24 text-center">Nenhum lançamento encontrado para este ponto.</TableCell></TableRow>
                    )}
                    </TableBody>
                </Table>
                </CardContent>
            </Card>
          )}
        </main>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md h-full max-h-[90dvh] flex flex-col">
          <MonitoringForm
            currentItem={editingItem}
            outorgaId={selectedOutorga}
            pontoId={selectedPonto}
            onSuccess={() => setIsDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
      
      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita e irá deletar o registro permanentemente.</AlertDialogDescription>
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
