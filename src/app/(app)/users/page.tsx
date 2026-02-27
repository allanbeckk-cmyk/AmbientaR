
'use client';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, PlusCircle, History, Pencil, Trash2, Eye, ArrowUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AppUser, AuditLog, CompanySettings } from '@/lib/types';
import { useCollection, useMemoFirebase, errorEmitter, useFirebase, useDoc } from '@/firebase';
import { FirestorePermissionError } from '@/firebase/errors';
import { collection, deleteDoc, doc, query, where, getDocs, orderBy } from 'firebase/firestore';
import { fetchBrandingImageAsBase64 } from '@/lib/branding-pdf';
import { useLocalBranding } from '@/hooks/use-local-branding';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { UserForm } from './user-form';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/firebase';
import jsPDF from 'jspdf';
import { logUserAction } from '@/lib/audit-log';
import { UpgradeDialog } from '@/components/upgrade-dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';


const DetailItem = ({ label, value }: { label: string, value?: string | null | string[] }) => (
    <div className="space-y-1">
        <Label className="text-sm font-medium">{label}</Label>
        <p className="text-sm text-muted-foreground">{Array.isArray(value) ? value.join(', ') : (value || 'Não informado')}</p>
    </div>
);


export default function UsersPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<AppUser | null>(null);
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);
  const [viewingUser, setViewingUser] = useState<AppUser | null>(null);
  const router = useRouter();
  
  const { firestore, auth, user } = useFirebase();
  const { toast } = useToast();

  const usersQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    
    if (user.role === 'admin' || user.role === 'supervisor' || user.role === 'diretor_fauna') {
      return collection(firestore, 'users');
    }
    
    if (user.role === 'financial') {
        return query(collection(firestore, 'users'), where('role', '==', 'financial'));
    }
    
    if (['sales', 'technical', 'gestor', 'client'].includes(user.role)) {
        return query(collection(firestore, 'users'), where('uid', '==', user.uid));
    }
    
    return query(collection(firestore, 'users'), where('uid', '==', 'invalid-uid-for-non-admins'));
  }, [firestore, user]);

  const { data: appUsers, isLoading } = useCollection<AppUser>(usersQuery);

  const { data: brandingData } = useLocalBranding();

  const getRoleText = (role: AppUser['role']) => {
    switch (role) {
      case 'admin':
        return 'Admin';
      case 'client':
        return 'Cliente';
      case 'technical':
        return 'Técnico';
      case 'sales':
        return 'Vendas';
      case 'financial':
        return 'Financeiro';
      case 'gestor':
        return 'Gestor Ambiental';
      case 'supervisor':
          return 'Supervisor';
      case 'diretor_fauna':
        return 'Diretor de Fauna';
    }
  };

  const handleEdit = (userToEdit: AppUser) => {
    setEditingUser(userToEdit);
    setIsDialogOpen(true);
  };
  
  const handleView = (userToView: AppUser) => {
    setViewingUser(userToView);
    setIsViewOpen(true);
  }

  const handleAddNew = () => {
    setEditingUser(null);
    setIsDialogOpen(true);
  };
  
  const openDeleteConfirm = (user: AppUser) => {
    setUserToDelete(user);
    setIsAlertOpen(true);
  };

  const handleDelete = () => {
    if (!firestore || !userToDelete || !auth) return;
    if (user?.role !== 'admin') {
      toast({ variant: 'destructive', title: 'Sem permissão', description: 'Apenas o perfil administrador pode excluir usuários.' });
      setIsAlertOpen(false);
      setUserToDelete(null);
      return;
    }
    const userDocRef = doc(firestore, 'users', userToDelete.id);
    deleteDoc(userDocRef)
      .then(() => {
        toast({
            title: 'Usuário deletado',
            description: `O usuário ${userToDelete.name} foi removido com sucesso.`,
        });
        logUserAction(firestore, auth, 'delete_user', { deletedUserId: userToDelete.uid, deletedUserName: userToDelete.name });
      })
      .catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
          path: userDocRef.path,
          operation: 'delete',
        });
        errorEmitter.emit('permission-error', permissionError);
      })
      .finally(() => {
          setIsAlertOpen(false);
          setUserToDelete(null);
      });
  };

  const handleGenerateLog = async (logUser: AppUser, format: 'txt' | 'pdf') => {
    if (!firestore) return;

    toast({ title: "Gerando log...", description: `Buscando registros para ${logUser.name}.`});
    
    const logsQuery = query(
        collection(firestore, 'auditLogs'),
        where('userId', '==', logUser.uid),
        orderBy('timestamp', 'desc')
    );

    try {
        const querySnapshot = await getDocs(logsQuery);
        const logs = querySnapshot.docs.map(doc => doc.data() as AuditLog);

        if (format === 'txt') {
            let logContent = `HISTÓRICO DE AUDITORIA\n`;
            logContent += `==================================================\n`;
            logContent += `Usuário: ${logUser.name} (${logUser.email})\n`;
            logContent += `ID do Usuário: ${logUser.uid}\n`;
            logContent += `Gerado em: ${new Date().toLocaleString('pt-BR')}\n`;
            logContent += `==================================================\n\n`;

            if (logs.length === 0) {
                logContent += "Nenhum registro de atividade encontrado para este usuário.";
            } else {
                logs.forEach(log => {
                    logContent += `Data:       ${log.timestamp ? new Date(log.timestamp.seconds * 1000).toLocaleString('pt-BR') : 'N/A'}\n`;
                    logContent += `Ação:       ${log.action}\n`;
                    logContent += `Detalhes:   ${JSON.stringify(log.details, null, 2)}\n`;
                    logContent += `--------------------------------------------------\n`;
                });
            }

            const blob = new Blob([logContent], { type: 'text/plain;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `log_${logUser.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.txt`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } else if (format === 'pdf') {
            const { default: jsPDF } = await import('jspdf');
            const doc = new jsPDF({ unit: 'mm', format: 'a4' });
            
            const headerBase64 = await fetchBrandingImageAsBase64(brandingData?.headerImageUrl);
            const footerBase64 = await fetchBrandingImageAsBase64(brandingData?.footerImageUrl);
            const watermarkBase64 = await fetchBrandingImageAsBase64(brandingData?.watermarkImageUrl);
            
            const pageHeight = doc.internal.pageSize.getHeight();
            const pageWidth = doc.internal.pageSize.getWidth();
            let yPos = 15;

            if (headerBase64) {
                doc.addImage(headerBase64, 'PNG', 10, 10, pageWidth - 20, 30);
                yPos = 45;
            }

            if (watermarkBase64) {
                const imgProps = doc.getImageProperties(watermarkBase64);
                const aspectRatio = imgProps.width / imgProps.height;
                const watermarkWidth = 100;
                const watermarkHeight = watermarkWidth / aspectRatio;
                doc.addImage(watermarkBase64, 'PNG', (pageWidth - watermarkWidth) / 2, (pageHeight - watermarkHeight) / 2, watermarkWidth, watermarkHeight, undefined, 'FAST');
            }
            
            doc.setFont('Helvetica', 'bold');
            doc.setFontSize(14);
            doc.text("Histórico de Auditoria do Usuário", pageWidth / 2, yPos, { align: 'center' });
            yPos += 10;

            doc.setFontSize(10);
            doc.setFont('Helvetica', 'normal');
            doc.text(`Usuário: ${logUser.name} (${logUser.email})`, 15, yPos);
            yPos += 5;
            doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 15, yPos);
            yPos += 10;
            doc.setLineWidth(0.5);
            doc.line(15, yPos - 5, pageWidth - 15, yPos - 5);


            if (logs.length === 0) {
                doc.text("Nenhum registro de atividade encontrado.", 15, yPos);
            } else {
                logs.forEach(log => {
                    const logString = `Data: ${log.timestamp ? new Date(log.timestamp.seconds * 1000).toLocaleString('pt-BR') : 'N/A'}\nAção: ${log.action}\nDetalhes: ${JSON.stringify(log.details, null, 2)}`;
                    const splitText = doc.splitTextToSize(logString, pageWidth - 30);
                    
                    if(yPos + (splitText.length * 5) > pageHeight - 30) {
                        doc.addPage();
                        yPos = 15;
                    }

                    doc.text(splitText, 15, yPos);
                    yPos += (splitText.length * 5) + 5;
                    doc.setDrawColor(230,230,230);
                    doc.line(15, yPos - 2.5, pageWidth - 15, yPos - 2.5);
                    yPos += 5;
                });
            }

            if (footerBase64) {
                const totalPages = doc.getNumberOfPages();
                for (let i = 1; i <= totalPages; i++) {
                    doc.setPage(i);
                    doc.addImage(footerBase64, 'PNG', 10, pageHeight - 25, pageWidth - 20, 20);
                }
            }
            
            const fileName = `log_${logUser.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
            doc.save(fileName);
        }

        toast({
            title: 'Log Gerado',
            description: `O arquivo foi baixado com sucesso.`,
        });

    } catch (error) {
        console.error("Error exporting user log:", error);
        toast({ variant: 'destructive', title: "Erro na Exportação", description: "Não foi possível gerar o arquivo de log."});
    }
  };
  
  const [isDeleteAccountOpen, setIsDeleteAccountOpen] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);

  const getPackageLabel = (pkg?: string) => {
    const labels: Record<string, string> = {
      gratuito: 'Gratuito',
      basico: 'Básico',
      intermediario: 'Intermediário',
      avancado: 'Avançado',
      completo: 'Completo',
      sob_consulta: 'Sob Consulta',
    };
    return pkg ? labels[pkg] || pkg : 'Não informado';
  };

  const handleDeleteAccount = async () => {
    if (!firestore || !auth || !user) return;
    setIsDeletingAccount(true);
    try {
      const userDocRef = doc(firestore, 'users', user.id);
      await deleteDoc(userDocRef);
      if (auth.currentUser) {
        await auth.currentUser.delete();
      }
      toast({
        title: 'Conta excluída',
        description: 'Sua conta e todos os seus dados foram removidos com sucesso.',
      });
      router.push('/login');
    } catch (error: any) {
      if (error.code === 'auth/requires-recent-login') {
        toast({
          variant: 'destructive',
          title: 'Reautenticação necessária',
          description: 'Por segurança, faça logout e login novamente antes de excluir sua conta.',
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Erro ao excluir conta',
          description: 'Não foi possível excluir sua conta. Tente novamente ou entre em contato com o suporte.',
        });
      }
    } finally {
      setIsDeletingAccount(false);
      setIsDeleteAccountOpen(false);
    }
  };

  const clientProfileDocRef = useMemoFirebase(() => {
    if (!firestore || !user || user.role !== 'client') return null;
    return doc(firestore, 'users', user.id);
  }, [firestore, user]);
  const { data: clientProfile, isLoading: isLoadingProfile } = useDoc<AppUser>(clientProfileDocRef);

  if (user?.role === 'client') {
      const clientUser = clientProfile || user;

      return (
        <>
           <div className="flex flex-col h-full">
            <PageHeader title="Meu Perfil" />
            <main className="flex-1 overflow-auto p-4 md:p-6 space-y-6 max-w-3xl mx-auto w-full">
                 {isLoadingProfile && (
                    <Card><CardHeader><CardTitle>Carregando Perfil...</CardTitle></CardHeader>
                    <CardContent><Skeleton className="h-64 w-full" /></CardContent></Card>
                 )}
                 {clientUser && !isLoadingProfile && (
                   <>
                     <Card>
                        <CardHeader>
                            <CardTitle>{clientUser.name}</CardTitle>
                            <CardDescription>Suas informações de perfil e de acesso.</CardDescription>
                        </CardHeader>
                         <CardContent className="space-y-4">
                            <h4 className="font-semibold text-foreground">Informações Pessoais</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <DetailItem label="Email" value={clientUser.email} />
                              <DetailItem label="Telefone" value={(clientUser as any).phone} />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <DetailItem label="CPF" value={clientUser.cpf} />
                              <DetailItem label="Data de Nascimento" value={clientUser.dataNascimento ? new Date(clientUser.dataNascimento).toLocaleDateString('pt-BR') : ''} />
                            </div>
                            <DetailItem label="CNPJs Vinculados" value={clientUser.cnpjs} />
                            <Separator />
                            <div className="flex items-center justify-between">
                              <h4 className="font-semibold text-foreground">Plano e Acesso</h4>
                              <Button
                                size="sm"
                                onClick={() => setIsUpgradeOpen(true)}
                                className="gap-1.5 bg-gradient-to-r from-primary to-emerald-500 hover:from-primary/90 hover:to-emerald-500/90 text-white"
                              >
                                <ArrowUp className="h-3.5 w-3.5" />
                                Alterar Plano
                              </Button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                               <DetailItem label="Pacote Contratado" value={getPackageLabel((clientUser as any).package)} />
                               <DetailItem label="Nível de Acesso" value={getRoleText(clientUser.role)} />
                               <DetailItem label="Status da Conta" value={clientUser.status === 'active' ? 'Ativo' : 'Inativo'} />
                            </div>
                         </CardContent>
                    </Card>

                    <Card className="border-destructive/30">
                        <CardHeader>
                            <CardTitle className="text-destructive flex items-center gap-2">
                              <Trash2 className="h-5 w-5" />
                              Exclusão de Dados
                            </CardTitle>
                            <CardDescription>
                              Solicite a exclusão da sua conta e de todos os seus dados pessoais da plataforma. Esta ação é irreversível.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button
                              variant="destructive"
                              onClick={() => setIsDeleteAccountOpen(true)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Excluir minha conta e dados
                            </Button>
                        </CardContent>
                    </Card>
                   </>
                 )}
            </main>
        </div>

        <UpgradeDialog open={isUpgradeOpen} onOpenChange={setIsUpgradeOpen} />

        <AlertDialog open={isDeleteAccountOpen} onOpenChange={setIsDeleteAccountOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir sua conta permanentemente?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação <span className="font-semibold">não pode ser desfeita</span>. Ao confirmar, todos os seus dados pessoais,
                incluindo nome, e-mail, telefone, CPF e histórico de uso serão removidos permanentemente da plataforma AmbientaR.
                Você perderá acesso ao sistema e não poderá recuperar sua conta.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeletingAccount}>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteAccount}
                disabled={isDeletingAccount}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isDeletingAccount ? 'Excluindo...' : 'Sim, excluir minha conta'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        </>
      )
  }


  return (
    <>
      <div className="flex flex-col h-full">
        <PageHeader title="Usuários">
          {user?.role === 'admin' && (
            <Button size="sm" className="gap-1" onClick={handleAddNew}>
                <PlusCircle className="h-4 w-4" />
                Adicionar Usuário
            </Button>
          )}
        </PageHeader>
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <Card>
            <CardHeader>
              <CardTitle>Gerenciamento de Usuários</CardTitle>
            </CardHeader>
            <CardContent>
              <TooltipProvider>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Status Online</TableHead>
                      <TableHead className="hidden md:table-cell">Email</TableHead>
                      <TableHead className="hidden lg:table-cell">CPF/CNPJ</TableHead>
                      <TableHead>Nível</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right min-w-[152px] w-[152px]">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading && Array.from({length: user?.role === 'admin' || user?.role === 'supervisor' ? 5 : 1}).map((_, i) => (
                        <TableRow key={i}>
                            <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                            <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-48" /></TableCell>
                            <TableCell className="hidden lg:table-cell"><Skeleton className="h-5 w-32" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                            <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                            <TableCell className="text-right min-w-[152px] w-[152px]"><Skeleton className="h-8 w-32" /></TableCell>
                        </TableRow>
                    ))}
                    {appUsers?.map((appUser) => (
                      <TableRow key={appUser.id}>
                        <TableCell className="font-medium">{appUser.name}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className={cn("h-3 w-3 rounded-full", appUser.isOnline ? 'bg-green-500' : 'bg-red-500')} />
                            {appUser.isOnline ? 'Online' : 'Offline'}
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground">{appUser.email}</TableCell>
                        <TableCell className="hidden lg:table-cell text-muted-foreground">{appUser.cpf || (appUser.cnpjs && appUser.cnpjs[0]) || 'N/A'}</TableCell>
                        <TableCell>{getRoleText(appUser.role)}</TableCell>
                        <TableCell>
                          <Badge variant={appUser.status === 'active' ? 'default' : 'secondary'}
                                className={cn(
                                  appUser.status === 'active' && 'bg-emerald-500/20 text-emerald-700 border-emerald-500/30 hover:bg-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20',
                                  appUser.status === 'inactive' && 'bg-slate-500/20 text-slate-700 border-slate-500/30 hover:bg-slate-500/30 dark:bg-slate-500/10 dark:text-slate-400 dark:border-slate-500/20',
                                )}
                          >
                            {appUser.status === 'active' ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right min-w-[152px] w-[152px]">
                            <div className="flex items-center justify-end gap-1 flex-nowrap">
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button variant="ghost" size="icon" onClick={() => handleView(appUser)}>
                                            <Eye className="h-4 w-4" />
                                            <span className="sr-only">Visualizar</span>
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent><p>Visualizar detalhes</p></TooltipContent>
                                </Tooltip>
                                {user?.role === 'admin' && (
                                  <Tooltip>
                                      <TooltipTrigger asChild>
                                          <Button variant="ghost" size="icon" onClick={() => handleEdit(appUser)}>
                                              <Pencil className="h-4 w-4" />
                                              <span className="sr-only">Editar</span>
                                          </Button>
                                      </TooltipTrigger>
                                      <TooltipContent><p>Editar usuário</p></TooltipContent>
                                  </Tooltip>
                                )}
                                {user?.role === 'admin' && (
                                  <Tooltip>
                                      <TooltipTrigger asChild>
                                          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => openDeleteConfirm(appUser)}>
                                              <Trash2 className="h-4 w-4" />
                                              <span className="sr-only">Excluir</span>
                                          </Button>
                                      </TooltipTrigger>
                                      <TooltipContent><p>Excluir usuário (somente administrador)</p></TooltipContent>
                                  </Tooltip>
                                )}
                                {(user?.role === 'admin' || user?.role === 'supervisor') && (
                                  <DropdownMenu>
                                      <Tooltip>
                                          <TooltipTrigger asChild>
                                              <DropdownMenuTrigger asChild>
                                                  <Button variant="ghost" size="icon">
                                                      <History className="h-4 w-4" />
                                                      <span className="sr-only">Gerar Log</span>
                                                  </Button>
                                              </DropdownMenuTrigger>
                                          </TooltipTrigger>
                                          <TooltipContent><p>Gerar log de atividades</p></TooltipContent>
                                      </Tooltip>
                                      <DropdownMenuContent>
                                          <DropdownMenuLabel>Formato do Log</DropdownMenuLabel>
                                          <DropdownMenuSeparator />
                                          <DropdownMenuItem onClick={() => handleGenerateLog(appUser, 'txt')}>Exportar como .txt</DropdownMenuItem>
                                          <DropdownMenuItem onClick={() => handleGenerateLog(appUser, 'pdf')}>Exportar como .pdf</DropdownMenuItem>
                                      </DropdownMenuContent>
                                  </DropdownMenu>
                                )}
                            </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {!isLoading && (!appUsers || appUsers.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={7} className="h-24 text-center">
                          Nenhum usuário encontrado.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TooltipProvider>
            </CardContent>
          </Card>
        </main>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-xl h-full max-h-[90dvh] flex flex-col">
              <DialogHeader>
                <DialogTitle>{editingUser ? 'Editar usuário' : 'Adicionar usuário'}</DialogTitle>
                <DialogDescription>Preencha os dados do usuário abaixo.</DialogDescription>
              </DialogHeader>
              <UserForm currentUser={editingUser} onSuccess={() => setIsDialogOpen(false)} />
          </DialogContent>
      </Dialog>
      
       <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
            <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>{viewingUser?.name}</DialogTitle>
                    <DialogDescription>
                        Detalhes do usuário cadastrado no sistema.
                    </DialogDescription>
                </DialogHeader>
                {viewingUser && (
                    <div className="max-h-[60vh] overflow-y-auto pr-4 space-y-4">
                        <DetailItem label="Nome Completo" value={viewingUser.name} />
                        <DetailItem label="Email" value={viewingUser.email} />
                        <Separator />
                        <div className="grid grid-cols-2 gap-4">
                           <DetailItem label="Nível de Acesso" value={getRoleText(viewingUser.role)} />
                           <DetailItem label="Status da Conta" value={viewingUser.status === 'active' ? 'Ativo' : 'Inativo'} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                           <DetailItem label="Status Online" value={viewingUser.isOnline ? 'Online' : 'Offline'} />
                           <DetailItem label="Último Login" value={viewingUser.lastLogin ? new Date(viewingUser.lastLogin.seconds * 1000).toLocaleString('pt-BR') : 'Nunca'} />
                        </div>
                        <Separator />
                         <h4 className="font-semibold text-foreground">Documentos</h4>
                         <DetailItem label="CPF" value={viewingUser.cpf} />
                         <DetailItem label="CNPJs Vinculados" value={viewingUser.cnpjs} />
                         <DetailItem label="Data de Nascimento" value={viewingUser.dataNascimento ? new Date(viewingUser.dataNascimento).toLocaleDateString('pt-BR') : ''} />
                    </div>
                )}
                 <DialogFooter>
                    <DialogClose asChild>
                        <Button type="button" variant="outline">
                        Fechar
                        </Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
      
       <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso irá deletar permanentemente o usuário{' '}
              <span className="font-semibold">{userToDelete?.name}</span>. A conta de autenticação precisará ser removida manualmente se necessário.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setUserToDelete(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Deletar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
