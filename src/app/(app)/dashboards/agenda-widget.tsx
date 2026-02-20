'use client';

import * as React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useFirebase } from '@/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import type { Appointment } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { CalendarClock, Briefcase, FileText, ClipboardCheck, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const eventIcons: Record<string, React.ReactNode> = {
  appointment: <Briefcase className="w-4 h-4" />,
  deadline: <FileText className="w-4 h-4" />,
  audit: <ClipboardCheck className="w-4 h-4" />,
};

const eventColors: Record<string, string> = {
  appointment: 'bg-blue-500/20 text-blue-700 border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20',
  deadline: 'bg-red-500/20 text-red-700 border-red-500/30 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20',
  audit: 'bg-yellow-500/20 text-yellow-700 border-yellow-500/30 dark:bg-yellow-500/10 dark:text-yellow-400 dark:border-yellow-500/20',
};

const getEventTypeLabel = (type: Appointment['type']) => {
  switch (type) {
    case 'appointment': return 'Reunião';
    case 'deadline': return 'Prazo';
    case 'audit': return 'Auditoria';
    default: return 'Evento';
  }
};

const LIMIT_DAYS = 30;
const MAX_ITEMS = 10;

export default function AgendaWidget() {
  const { firestore, user } = useFirebase();
  const [events, setEvents] = React.useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    if (!firestore || !user) return;

    setIsLoading(true);
    const fetchEvents = async () => {
      try {
        const baseQuery = collection(firestore, 'appointments');
        const queriesToRun: Promise<FirebaseFirestore.QuerySnapshot>[] = [];

        if (user.role === 'admin' || user.role === 'supervisor' || user.role === 'financial') {
          queriesToRun.push(getDocs(baseQuery));
        } else {
          const publicQuery = query(baseQuery, where('ownerRole', '!=', 'financial'));
          queriesToRun.push(getDocs(publicQuery));
          const privateQuery = query(baseQuery, where('ownerId', '==', user.uid));
          queriesToRun.push(getDocs(privateQuery));
        }

        const querySnapshots = await Promise.all(queriesToRun);
        const allDocs: Record<string, Appointment> = {};

        querySnapshots.forEach((snapshot) => {
          snapshot.forEach((docSnap) => {
            if (!allDocs[docSnap.id]) {
              allDocs[docSnap.id] = { ...docSnap.data(), id: docSnap.id } as Appointment;
            }
          });
        });

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const limitDate = addDays(today, LIMIT_DAYS);

        const upcoming = Object.values(allDocs)
          .filter((event) => {
            const eventStart = new Date(event.startTime);
            return eventStart >= today && eventStart <= limitDate;
          })
          .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
          .slice(0, MAX_ITEMS);

        setEvents(upcoming);
      } catch (e) {
        console.error('Erro ao carregar eventos da agenda:', e);
        setEvents([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvents();
  }, [firestore, user]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="flex items-center gap-2">
            <CalendarClock className="w-5 h-5 text-primary" />
            Agenda
          </CardTitle>
          <CardDescription>
            Eventos que vão acontecer ou vencer — lembrete para os próximos {LIMIT_DAYS} dias.
          </CardDescription>
        </div>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/calendar" className="gap-1">
            Ver agenda
            <ChevronRight className="w-4 h-4" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : events.length > 0 ? (
          <ul className="space-y-3">
            {events.map((event) => {
              const start = new Date(event.startTime);
              const isToday = format(start, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
              return (
                <li key={event.id}>
                  <Link
                    href="/calendar"
                    className={cn(
                      'flex items-start gap-3 p-2 rounded-md hover:bg-muted/50 transition-colors',
                      isToday && 'bg-primary/5 border border-primary/20'
                    )}
                  >
                    <div className="mt-0.5 shrink-0">{eventIcons[event.type]}</div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm truncate">{event.description}</p>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground">
                          {format(start, "EEEE, d 'de' MMM", { locale: ptBR })}
                          {' · '}
                          {format(start, 'HH:mm', { locale: ptBR })}
                          {event.endTime && ` - ${format(new Date(event.endTime), 'HH:mm', { locale: ptBR })}`}
                        </span>
                        <Badge variant="outline" className={cn('text-xs capitalize', eventColors[event.type])}>
                          {getEventTypeLabel(event.type)}
                        </Badge>
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-6">
            Nenhum evento agendado para os próximos {LIMIT_DAYS} dias.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
