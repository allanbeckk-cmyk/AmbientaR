'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import type { Client } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Gift } from 'lucide-react';

export default function BirthdayWidget() {
  const { firestore, user } = useFirebase();

  const clientsQuery = useMemoFirebase(
    () => (firestore && user ? collection(firestore, 'clients') : null),
    [firestore, user]
  );
  const { data: clients, isLoading } = useCollection<Client>(clientsQuery);

  const birthdaysThisMonth = React.useMemo(() => {
    if (!clients) return [];
    const currentMonth = new Date().getMonth();
    return clients
      .filter(client => client.dataNascimento && new Date(client.dataNascimento).getMonth() === currentMonth)
      .sort((a, b) => new Date(a.dataNascimento!).getDate() - new Date(b.dataNascimento!).getDate());
  }, [clients]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gift className="w-5 h-5 text-primary" />
          Aniversariantes do Mês
        </CardTitle>
        <CardDescription>Clientes que fazem aniversário este mês.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-6 w-1/2" />
          </div>
        ) : birthdaysThisMonth.length > 0 ? (
          <ul className="space-y-3">
            {birthdaysThisMonth.map(client => (
              <li key={client.id} className="flex justify-between items-center text-sm">
                <span>{client.name}</span>
                <span className="font-medium text-muted-foreground">{formatDate(client.dataNascimento)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhum aniversariante este mês.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
