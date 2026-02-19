
'use client';
import { Suspense, useMemo, useState, useEffect } from 'react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Download, Calendar as CalendarIcon, ShieldAlert, MessageSquare } from 'lucide-react';
import { useCollection, useFirebase, useMemoFirebase, useAuth } from '@/firebase';
import { collection, query, getDocs, orderBy, where } from 'firebase/firestore';
import type { AppUser, AuditLog, ChatMessage, Chat } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { logUserAction } from '@/lib/audit-log';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Label } from '@/components/ui/label';

// Merged AuthorizedAuditLogPage directly into the main component flow
export default function AuditLogPage() {
  const { user, isInitialized } = useAuth();
  const { firestore, auth } = useFirebase();
  const { toast } = useToast();
  
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);

  const hasPermission = useMemo(() => user && (user.role === 'admin' || user.role === 'supervisor'), [user]);

  const usersQuery = useMemoFirebase(() => {
    if (!firestore || !hasPermission) return null;
    return collection(firestore, 'users');
  }, [firestore, hasPermission]);
  
  const { data: users, isLoading: isLoadingUsers } = useCollection<AppUser>(usersQuery);
  const usersMap = useMemo(() => new Map(users?.map(u => [u.uid, u.name])), [users]);
  
  const auditLogsQuery = useMemoFirebase(() => {
    if (!firestore || !hasPermission) return null; // <-- This is the key fix
    return query(collection(firestore, 'auditLogs'), orderBy('timestamp', 'desc'));
  }, [firestore, hasPermission]);

  const { data: auditLogs, isLoading: isLoadingLogs } = useCollection<AuditLog>(auditLogsQuery);
  
  // Loading state considers initialization and data fetching if permission is granted
  const isLoading = !isInitialized || (hasPermission && (isLoadingUsers || isLoadingLogs));

  const formatTimestamp = (timestamp: any): string => {
    if (!timestamp) return 'N/A';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp.seconds * 1000);
      if (!isNaN(date.getTime())) return date.toLocaleString('pt-BR');
    } catch (e) {
      console.error('Error formatting timestamp:', e);
    }
    return 'Data inválida';
  };

  const getRoleText = (role: AppUser['role']) => {
    const roles = {
      admin: 'Admin',
      client: 'Cliente',
      technical: 'Técnico',
      sales: 'Vendas',
      financial: 'Financeiro',
      gestor: 'Gestor Ambiental',
      supervisor: 'Supervisor',
      diretor_fauna: 'Diretor de Fauna',
    };
    return roles[role] || role;
  };
  
    const handleExportLog = async (targetUser: AppUser) => {
    if (!firestore || !auth?.currentUser) return;
    toast({
      title: 'Gerando log de ações...',
      description: `Buscando registros para ${targetUser.name}.`,
    });

    let logsQuery = query(
      collection(firestore, 'auditLogs'),
      where('userId', '==', targetUser.uid)
    );

    try {
      const querySnapshot = await getDocs(logsQuery);
      let logsData: AuditLog[] = querySnapshot.docs.map(
        (doc) => ({ ...doc.data(), id: doc.id } as AuditLog)
      );
      
      logsData.sort((a, b) => {
          const dateA = a.timestamp?.toDate ? a.timestamp.toDate() : new Date(0);
          const dateB = b.timestamp?.toDate ? b.timestamp.toDate() : new Date(0);
          return dateB.getTime() - dateA.getTime();
      });

      if (startDate || endDate) {
        logsData = logsData.filter((log) => {
          if (!log.timestamp || !log.timestamp.toDate) return false;
          const logDate = log.timestamp.toDate();
          const start = startDate ? new Date(startDate.setHours(0, 0, 0, 0)) : null;
          const end = endDate ? new Date(endDate.setHours(23, 59, 59, 999)) : null;
          if (start && end) return logDate >= start && logDate <= end;
          if (start) return logDate >= start;
          if (end) return logDate <= end;
          return true;
        });
      }

      const pageNames: { [path: string]: string } = {
        '/': 'Painel',
        '/clients': 'Clientes',
        '/invoices': 'Faturas',
        '/audit-log': 'Log de Auditoria',
        '/users': 'Usuários',
      };

      const getActionDescription = (log: AuditLog): string => {
        const details = log.details || {};
        switch (log.action) {
          case 'login':
            return 'Entrou no sistema';
          case 'logout':
            return 'Saiu do sistema';
          case 'view_page':
            return `Visualizou a página: ${
              pageNames[details.path] || details.path || 'N/A'
            }`;
          case 'create_client':
            return `Criou o cliente: ${details.clientName || 'N/A'}`;
          case 'create_user':
            return `Criou o usuário: ${details.newUserName || 'N/A'}`;
          case 'export_audit_log':
            return `Exportou o log do usuário: ${details.exportedUserId || 'N/A'}`;
          default:
            return `${log.action} - Detalhes: ${JSON.stringify(details)}`;
        }
      };

      let userDocs =
        targetUser.cpf ||
        (targetUser.cnpjs && targetUser.cnpjs.length > 0
          ? targetUser.cnpjs.join(', ')
          : 'N/A');

      let logContent = `Log de Ações do Usuário - Gerado em: ${new Date().toLocaleString(
        'pt-BR'
      )}\n\n`;
      logContent += `--- DADOS DO USUÁRIO ---\n`;
      logContent += `ID: ${targetUser.uid}\nNome: ${targetUser.name}\nEmail: ${targetUser.email}\nNível: ${getRoleText(targetUser.role)}\nStatus: ${targetUser.status === 'active' ? 'Ativo' : 'Inativo'}\nCPF/CNPJ: ${userDocs}\n\n`;
      logContent += `--- HISTÓRICO DE AÇÕES ---\n`;

      if (logsData.length === 0) {
        logContent +=
          'Nenhum registro de atividade encontrado para este usuário no período selecionado.\n';
      } else {
        logsData.forEach((log) => {
          const timestampStr = formatTimestamp(log.timestamp);
          const actionDescription = getActionDescription(log);
          logContent += `- ${timestampStr} - ${actionDescription}\n`;
        });
      }

      const blob = new Blob([logContent], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = `log_de_acoes_${targetUser.name.replace(
        /\s+/g,
        '_'
      )}.txt`;
      link.href = url;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: 'Exportação Concluída',
        description: 'O arquivo de log de ações foi baixado.',
      });
      if (auth.currentUser) {
        await logUserAction(firestore, auth, 'export_audit_log', {
          exportedUserId: targetUser.uid,
        });
      }
    } catch (error) {
      console.error('Error exporting user log:', error);
      toast({
        variant: 'destructive',
        title: 'Erro na Exportação',
        description: 'Não foi possível gerar o arquivo de log.',
      });
    }
  };

  const handleExportChatLog = async (targetUser: AppUser) => {
    if (!firestore || !auth?.currentUser) return;

    toast({
      title: 'Gerando log de chat...',
      description: `Buscando conversas para ${targetUser.name}.`,
    });

    try {
        const chatsQuery = query(collection(firestore, 'chats'), where('participants', 'array-contains', targetUser.uid));
        const chatsSnapshot = await getDocs(chatsQuery);

        if (chatsSnapshot.empty) {
            toast({ description: "Nenhuma conversa encontrada para este usuário." });
            return;
        }

        let logContent = `Log de Conversas do Usuário - Gerado em: ${new Date().toLocaleString('pt-BR')}\n\n`;
        logContent += `--- DADOS DO USUÁRIO ---\n`;
        logContent += `ID: ${targetUser.uid}\nNome: ${targetUser.name}\nEmail: ${targetUser.email}\n\n`;
        logContent += `--- HISTÓRICO DE CONVERSAS ---\n`;

        for (const chatDoc of chatsSnapshot.docs) {
            const chatData = chatDoc.data() as Chat;
            const otherParticipantId = chatData.participants.find(p => p !== targetUser.uid);
            const otherParticipantName = otherParticipantId ? (usersMap.get(otherParticipantId) || 'Usuário Desconhecido') : 'Desconhecido';
            
            logContent += `\n==================================================\n`;
            logContent += `CONVERSA COM: ${otherParticipantName} (ID: ${otherParticipantId})\n`;
            logContent += `==================================================\n`;

            const messagesQuery = query(collection(firestore, `chats/${chatDoc.id}/messages`), orderBy('timestamp', 'asc'));
            const messagesSnapshot = await getDocs(messagesQuery);

            if (messagesSnapshot.empty) {
                 logContent += `Nenhuma mensagem nesta conversa.\n`;
            } else {
                messagesSnapshot.forEach(messageDoc => {
                    const msg = messageDoc.data() as ChatMessage;
                    const senderName = msg.senderId === targetUser.uid ? targetUser.name : otherParticipantName;
                    const timestamp = formatTimestamp(msg.timestamp);
                    logContent += `[${timestamp}] ${senderName}: ${msg.text}\n`;
                    if (msg.deletedFor && msg.deletedFor.length > 0) {
                        const deletedByNames = msg.deletedFor.map(uid => usersMap.get(uid) || 'Usuário Desconhecido').join(', ');
                        logContent += `  (Mensagem apagada para: ${deletedByNames})\n`;
                    }
                });
            }
        }

        const blob = new Blob([logContent], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = `log_de_chat_${targetUser.name.replace(/\s+/g, '_')}.txt`;
        link.href = url;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast({ title: 'Exportação de Chat Concluída', description: 'O arquivo de log de conversas foi baixado.' });

    } catch (error) {
        console.error("Error exporting chat log:", error);
        toast({
            variant: 'destructive',
            title: 'Erro na Exportação do Chat',
            description: 'Não foi possível gerar o arquivo de conversas.',
        });
    }
  };


  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Log de Auditoria" />
      <main className="flex-1 overflow-auto p-4 md:p-6">
        <Suspense fallback={<Skeleton className="h-96 w-full" />}>
          {isLoading && (
              <Card>
                  <CardHeader>
                       <Skeleton className="h-8 w-1/2" />
                       <Skeleton className="h-4 w-3/4" />
                  </CardHeader>
                  <CardContent>
                      <Skeleton className="h-[200px] w-full" />
                  </CardContent>
              </Card>
          )}
          {!isLoading && hasPermission && (
            <Card>
              <CardHeader>
                <CardTitle>Registros de Atividade por Usuário</CardTitle>
                <CardDescription>
                  Selecione um período e visualize o último acesso de cada usuário. Exporte seu histórico completo de atividades.
                </CardDescription>
                <div className="flex flex-col md:flex-row gap-4 pt-4">
                  <div className="grid gap-2">
                    <Label>Data de Início</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={'outline'}
                          className={cn(
                            'w-[240px] justify-start text-left font-normal',
                            !startDate && 'text-muted-foreground'
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {startDate ? (
                            format(startDate, 'PPP', { locale: ptBR })
                          ) : (
                            <span>Escolha uma data</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={startDate}
                          onSelect={setStartDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="grid gap-2">
                    <Label>Data de Fim</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={'outline'}
                          className={cn(
                            'w-[240px] justify-start text-left font-normal',
                            !endDate && 'text-muted-foreground'
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {endDate ? (
                            format(endDate, 'PPP', { locale: ptBR })
                          ) : (
                            <span>Escolha uma data</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={endDate}
                          onSelect={setEndDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Usuário</TableHead>
                      <TableHead>Último Acesso</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingUsers &&
                      Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i}>
                          <TableCell>
                            <Skeleton className="h-5 w-48" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-5 w-36" />
                          </TableCell>
                          <TableCell className="text-right">
                             <div className="flex gap-2 justify-end">
                                <Skeleton className="h-9 w-28" />
                                <Skeleton className="h-9 w-28" />
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    {!isLoadingUsers &&
                      users?.map((u) => (
                        <TableRow key={u.id}>
                          <TableCell>
                            <div className="font-medium">{u.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {u.email}
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {formatTimestamp(u.lastLogin)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-2 justify-end">
                                <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleExportLog(u)}
                                >
                                <Download className="mr-2 h-4 w-4" />
                                Exportar Log
                                </Button>
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => handleExportChatLog(u)}
                                >
                                    <MessageSquare className="mr-2 h-4 w-4" />
                                    Exportar Chat
                                </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    {!isLoadingUsers && (!users || users.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={3} className="h-24 text-center">
                          Nenhum usuário encontrado.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
          {!isLoading && !hasPermission && (
            <Alert variant="destructive">
              <ShieldAlert className="h-4 w-4" />
              <AlertTitle>Acesso Negado</AlertTitle>
              <AlertDescription>
                Você não tem permissão para visualizar esta página. Acesso restrito a administradores e supervisores.
              </AlertDescription>
            </Alert>
          )}
        </Suspense>
      </main>
    </div>
  );
}

    