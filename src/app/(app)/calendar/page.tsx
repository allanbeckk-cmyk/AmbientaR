
'use client';

import * as React from 'react';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import type { Appointment as CalendarEvent } from '@/lib/types';
import { cn } from '@/lib/utils';
import { FileText, ClipboardCheck, Briefcase, PlusCircle, Pencil, Trash2, CalendarClock } from 'lucide-react';
import { useCollection, useFirebase, useMemoFirebase, errorEmitter } from '@/firebase';
import { collection, deleteDoc, doc, query, where, getDocs } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { AppointmentForm } from './appointment-form';
import { FirestorePermissionError } from '@/firebase/errors';
import { format, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const eventIcons: Record<string, React.ReactNode> = {
  appointment: <Briefcase className="w-4 h-4" />,
  deadline: <FileText className="w-4 h-4" />,
  audit: <ClipboardCheck className="w-4 h-4" />,
};

const eventColors: Record<string, string> = {
    appointment: 'bg-blue-500/20 text-blue-700 border-blue-500/30 hover:bg-blue-500/30 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20',
    deadline: 'bg-red-500/20 text-red-700 border-red-500/30 hover:bg-red-500/30 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20',
    audit: 'bg-yellow-500/20 text-yellow-700 border-yellow-500/30 hover:bg-yellow-500/30 dark:bg-yellow-500/10 dark:text-yellow-400 dark:border-yellow-500/20',
};

const getEventTypeLabel = (type: CalendarEvent['type']) => {
    switch (type) {
        case 'appointment': return 'Reunião';
        case 'deadline': return 'Prazo';
        case 'audit': return 'Auditoria';
        default: return 'Evento';
    }
}


export default function CalendarPage() {
  const [date, setDate] = React.useState<Date | undefined>(new Date());
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [isAlertOpen, setIsAlertOpen] = React.useState(false);
  const [editingItem, setEditingItem] = React.useState<CalendarEvent | null>(null);
  const [itemToDelete, setItemToDelete] = React.useState<string | null>(null);
  
  const [events, setEvents] = React.useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);

  const { firestore, user } = useFirebase();
  const { toast } = useToast();

  React.useEffect(() => {
    if (!firestore || !user) return;

    setIsLoading(true);
    
    const fetchEvents = async () => {
        try {
            const baseQuery = collection(firestore, 'appointments');
            let queriesToRun = [];

            if (user.role === 'admin' || user.role === 'supervisor' || user.role === 'financial') {
                queriesToRun.push(getDocs(baseQuery));
            } else {
                // Fetch non-financial (public) events
                const publicQuery = query(baseQuery, where('ownerRole', '!=', 'financial'));
                queriesToRun.push(getDocs(publicQuery));

                // Fetch user's own private events
                const privateQuery = query(baseQuery, where('ownerId', '==', user.uid));
                queriesToRun.push(getDocs(privateQuery));
            }

            const querySnapshots = await Promise.all(queriesToRun);
            const allDocs: Record<string, CalendarEvent> = {};
            
            querySnapshots.forEach(snapshot => {
                snapshot.forEach(doc => {
                    if (!allDocs[doc.id]) {
                        allDocs[doc.id] = { ...doc.data(), id: doc.id } as CalendarEvent;
                    }
                });
            });

            setEvents(Object.values(allDocs));
            setError(null);
        } catch (e: any) {
            console.error("Firestore error fetching appointments:", e);
            setError(e);
            // Assuming a more specific error handling would be here if needed
        } finally {
            setIsLoading(false);
        }
    }

    fetchEvents();

  }, [firestore, user]);
  
  const eventsOnSelectedDate = React.useMemo(() => {
    if (!date || !events) return [];
    const selectedDayStart = new Date(date.setHours(0, 0, 0, 0));
    const selectedDayEnd = new Date(date.setHours(23, 59, 59, 999));
    
    return events.filter(event => {
        const eventStart = new Date(event.startTime);
        return eventStart >= selectedDayStart && eventStart <= selectedDayEnd;
    }).sort((a,b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  }, [date, events]);
  
  const upcomingEvents = React.useMemo(() => {
    if (!events) return [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const fifteenDaysFromNow = addDays(today, 15);

    return events.filter(event => {
      const eventStart = new Date(event.startTime);
      return eventStart >= today && eventStart <= fifteenDaysFromNow;
    }).sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  }, [events]);

  const eventDays = React.useMemo(() => 
    events?.map(event => new Date(event.startTime).toDateString()) || [], 
  [events]);

  const handleAddNew = () => {
    setEditingItem(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (item: CalendarEvent) => {
    setEditingItem(item);
    setIsDialogOpen(true);
  };

  const openDeleteConfirm = (itemId: string) => {
    setItemToDelete(itemId);
    setIsAlertOpen(true);
  };

  const handleDelete = () => {
    if (!firestore || !itemToDelete) return;
    const docRef = doc(firestore, 'appointments', itemToDelete);
    deleteDoc(docRef)
      .then(() => {
        toast({
          title: 'Compromisso deletado',
          description: 'O compromisso foi removido da agenda.',
        });
        setEvents(prev => prev.filter(e => e.id !== itemToDelete));
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

  return (
    <>
      <div className="flex flex-col h-full">
        <PageHeader title="Agenda">
          <Button size="sm" className="gap-1" onClick={handleAddNew}>
            <PlusCircle className="h-4 w-4" />
            Novo Compromisso
          </Button>
        </PageHeader>
        <main className="flex-1 overflow-auto p-4 md:p-6 space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
             <Card>
              <CardHeader>
                <CardTitle>
                  Eventos para {date ? format(date, "PPP", { locale: ptBR }) : 'hoje'}
                </CardTitle>
                <CardDescription>
                  Compromissos agendados para a data selecionada.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isLoading && (
                  <div className="space-y-4">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                )}
                {!isLoading && eventsOnSelectedDate.length > 0 ? (
                  eventsOnSelectedDate.map((event) => (
                    <div key={event.id} className="flex items-start gap-4 p-2 rounded-md hover:bg-muted/50">
                      <div className="mt-1">{eventIcons[event.type]}</div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{event.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(event.startTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} - {new Date(event.endTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        <Badge variant="outline" className={cn('capitalize text-xs mt-1', eventColors[event.type])}>
                          {getEventTypeLabel(event.type)}
                        </Badge>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit(event)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => openDeleteConfirm(event.id)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </div>
                  ))
                ) : !isLoading ? (
                  <p className="text-sm text-muted-foreground text-center py-4">Nenhum evento para esta data.</p>
                ) : null}
              </CardContent>
            </Card>
             <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarClock className="h-5 w-5" />
                  Próximos Compromissos (15 dias)
                </CardTitle>
                <CardDescription>
                  Uma visão geral dos seus próximos eventos.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isLoading && (
                  <div className="space-y-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                )}
                {!isLoading && upcomingEvents.length > 0 ? (
                  upcomingEvents.map((event) => (
                    <div key={event.id} className="flex items-center gap-4 p-2 rounded-md">
                      <div className={cn("flex flex-col items-center justify-center p-2 rounded-md", eventColors[event.type])}>
                        <span className="text-xs font-bold uppercase">{format(new Date(event.startTime), 'MMM', { locale: ptBR })}</span>
                        <span className="text-lg font-bold">{format(new Date(event.startTime), 'dd')}</span>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm truncate">{event.description}</p>
                         <p className="text-xs text-muted-foreground">
                          {new Date(event.startTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      {eventIcons[event.type]}
                    </div>
                  ))
                ) : !isLoading ? (
                  <p className="text-sm text-muted-foreground text-center py-4">Nenhum compromisso nos próximos 15 dias.</p>
                ) : null}
              </CardContent>
            </Card>
          </div>
          <Card>
              <CardContent className="p-0 md:p-2 flex justify-center">
                  <Calendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      className="p-0"
                      classNames={{
                          months: 'flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0',
                          month: 'space-y-4',
                          caption_label: 'text-lg font-medium',
                          head_row: 'flex w-full mt-2',
                          head_cell: 'text-muted-foreground rounded-md w-16 font-normal text-[0.8rem]',
                          row: 'flex w-full mt-2',
                          cell: 'h-16 w-16 text-center text-sm p-0 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20',
                          day: 'h-16 w-16 p-0 font-normal aria-selected:opacity-100',
                      }}
                      components={{
                        Day: ({ date }) => {
                            const hasEvent = eventDays.includes(date.toDateString());
                            return (
                              <div className="relative w-full h-full flex items-center justify-center">
                                  <span>{date.getDate()}</span>
                                  {hasEvent && <div className="absolute bottom-1 left-1/2 -translate-x-1/2 h-1.5 w-1.5 rounded-full bg-primary"></div>}
                              </div>
                            );
                        }
                      }}
                  />
              </CardContent>
            </Card>
        </main>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-xl">
              <AppointmentForm currentItem={editingItem} onSuccess={() => setIsDialogOpen(false)} />
          </DialogContent>
      </Dialog>
      
       <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita e irá deletar o compromisso permanentemente.
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

