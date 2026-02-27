
'use client';

import { useMemo, useEffect, useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Leaf, FileCheck, AlertTriangle, Clock, FolderKanban, Gift, CalendarIcon } from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase, useAuth, useDoc } from '@/firebase';
import { collection, query, where, getDocs, doc } from 'firebase/firestore';
import type { Project, Condicionante, Empreendedor, Client, WaterPermit, EnvironmentalIntervention } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import EnvironmentalDashboard from '../environmental-dashboard';
import AgendaWidget from './agenda-widget';

export default function ClientDashboard() {
  const { user } = useAuth();
  const firestore = useFirestore();
  
  const [empreendedorIds, setEmpreendedorIds] = useState<string[] | undefined>(undefined);
  const [clientId, setClientId] = useState<string | null>(null);

  useEffect(() => {
    if (user && firestore) {
        setEmpreendedorIds(undefined);

        const isSelfRegistered = !!(user as any).package;

        if (isSelfRegistered) {
            const empreendedoresRef = collection(firestore, 'empreendedores');
            const qByUserId = query(empreendedoresRef, where('userId', '==', user.id));
            getDocs(qByUserId).then((snapshot) => {
                const ids = snapshot.docs.map(d => d.id);
                setEmpreendedorIds(ids.length > 0 ? ids : ['non-existent-placeholder']);
            }).catch(() => {
                setEmpreendedorIds(['non-existent-placeholder']);
            });

            const clientsRef = collection(firestore, 'clients');
            const qClientByUserId = query(clientsRef, where('userId', '==', user.id));
            getDocs(qClientByUserId).then((snapshot) => {
                if (!snapshot.empty) {
                    setClientId(snapshot.docs[0].id);
                }
            }).catch(() => {});

            return;
        }

        const userDocuments = [user.cpf, ...(user.cnpjs || [])].filter(Boolean) as string[];
        if (userDocuments.length > 0) {
            const clientsRef = collection(firestore, 'clients');
            const qClients = query(clientsRef, where('cpfCnpj', 'in', userDocuments));
            
            const empreendedoresRef = collection(firestore, 'empreendedores');
            const qEmpreendedores = query(empreendedoresRef, where('cpfCnpj', 'in', userDocuments));

            Promise.all([getDocs(qClients), getDocs(qEmpreendedores)]).then(([clientSnapshot, empreendedorSnapshot]) => {
                if (!clientSnapshot.empty) {
                    setClientId(clientSnapshot.docs[0].id);
                }
                const ids = empreendedorSnapshot.docs.map(doc => doc.id);
                setEmpreendedorIds(ids.length > 0 ? ids : ['non-existent-placeholder']);
            }).catch(err => {
                console.error("Error fetching initial client data:", err);
                setEmpreendedorIds(['non-existent-placeholder']);
            });
        } else {
            setEmpreendedorIds(['non-existent-placeholder']);
        }
    }
  }, [user, firestore]);
  
  const singleClientDocRef = useMemoFirebase(() => {
    if(!firestore || !clientId) return null;
    return doc(firestore, 'clients', clientId);
  }, [firestore, clientId]);
  
  const { data: clientData, isLoading: isLoadingClientData } = useDoc<Client>(singleClientDocRef);


  const projectsQuery = useMemoFirebase(() => {
    if (!firestore || !empreendedorIds || empreendedorIds.length === 0) return null;
    return query(collection(firestore, 'projects'), where('empreendedorId', 'in', empreendedorIds));
  }, [firestore, empreendedorIds]);
  const { data: projects, isLoading: isLoadingProjects } = useCollection<Project>(projectsQuery);

  const projectIds = useMemo(() => projects?.map(p => p.id) || [], [projects]);

  const condicionantesQuery = useMemoFirebase(() => {
    if (!firestore || projectIds.length === 0) return null;
    return query(collection(firestore, 'condicionantes'), where('referenceId', 'in', projectIds));
  }, [firestore, projectIds]);
  const { data: condicionantes, isLoading: isLoadingCondicionantes } = useCollection<Condicionante>(condicionantesQuery);

  const outorgasQuery = useMemoFirebase(() => {
    if (!firestore || !empreendedorIds || empreendedorIds.length === 0) return null;
    return query(collection(firestore, 'outorgas'), where('empreendedorId', 'in', empreendedorIds));
  }, [firestore, empreendedorIds]);
  const { data: outorgas, isLoading: isLoadingOutorgas } = useCollection<WaterPermit>(outorgasQuery);
  
  const intervencoesQuery = useMemoFirebase(() => {
    if (!firestore || !empreendedorIds || empreendedorIds.length === 0) return null;
    return query(collection(firestore, 'intervencoes'), where('empreendedorId', 'in', empreendedorIds));
  }, [firestore, empreendedorIds]);
  const { data: intervencoes, isLoading: isLoadingIntervencoes } = useCollection<EnvironmentalIntervention>(intervencoesQuery);

  const stats = useMemo(() => {
    if (!projects || !condicionantes) return { active: 0, total: 0, pending: 0, nextExpiration: null };

    const activeLicenses = projects.filter(p => p.status === 'Válida');
    const totalLicenses = projects.length;
    const pendingCondicionantes = condicionantes?.filter(c => c.status === 'Pendente' || c.status === 'Atrasada').length || 0;

    const nextExpiration = activeLicenses
      .map(p => ({ ...p, expirationDate: p.expirationDate ? new Date(p.expirationDate) : null }))
      .filter(p => p.expirationDate && p.expirationDate > new Date())
      .sort((a, b) => a.expirationDate!.getTime() - b.expirationDate!.getTime())[0];
      
    return {
      active: activeLicenses.length,
      total: totalLicenses,
      pending: pendingCondicionantes,
      nextExpiration: nextExpiration ? {
          date: nextExpiration.expirationDate!.toLocaleDateString('pt-BR'),
          permit: nextExpiration.processNumber || `Licença do projeto ${nextExpiration.propertyName}`
      } : null,
    };
  }, [projects, condicionantes]);

  const isLoading = isLoadingProjects || isLoadingCondicionantes || isLoadingClientData || isLoadingOutorgas || isLoadingIntervencoes || empreendedorIds === undefined;
  const birthDate = clientData?.dataNascimento ? new Date(clientData.dataNascimento).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : 'Não informado';

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Painel do Cliente" />
      <main className="flex-1 overflow-auto p-4 md:p-6 space-y-8">
         <AgendaWidget />
         <Card>
            <CardHeader>
                <CardTitle>Bem-vindo(a), {user?.name || 'Cliente'}!</CardTitle>
                <CardDescription>Aqui está um resumo rápido dos seus empreendimentos.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Licenças Ativas</CardTitle>
                            <FileCheck className="h-4 w-4 text-emerald-500" />
                        </CardHeader>
                        <CardContent>
                            {isLoading ? <Skeleton className="h-8 w-1/2" /> : <div className="text-2xl font-bold">{stats.active}</div>}
                            {isLoading ? <Skeleton className="h-4 w-3/4 mt-1" /> : <p className="text-xs text-muted-foreground">de {stats.total} licenças totais</p>}
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Condicionantes Pendentes</CardTitle>
                            <AlertTriangle className="h-4 w-4 text-yellow-500" />
                        </CardHeader>
                        <CardContent>
                            {isLoading ? <Skeleton className="h-8 w-1/2" /> : <div className="text-2xl font-bold">{stats.pending}</div>}
                            {isLoading ? <Skeleton className="h-4 w-3/4 mt-1" /> : <p className="text-xs text-muted-foreground">requerem sua atenção</p>}
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Próximo Vencimento</CardTitle>
                            <Clock className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            {isLoading ? <Skeleton className="h-8 w-1/2" /> : <div className="text-2xl font-bold">{stats.nextExpiration?.date || 'N/A'}</div>}
                            {isLoading ? <Skeleton className="h-4 w-3/4 mt-1" /> : <p className="text-xs text-muted-foreground">{stats.nextExpiration?.permit || 'Nenhuma licença com vencimento futuro'}</p>}
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Data de Nascimento</CardTitle>
                            <Gift className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            {isLoading ? <Skeleton className="h-8 w-1/2" /> : <div className="text-2xl font-bold">{birthDate}</div>}
                            {isLoading ? <Skeleton className="h-4 w-3/4 mt-1" /> : <p className="text-xs text-muted-foreground">Sua data de nascimento registrada.</p>}
                        </CardContent>
                    </Card>
                </div>
            </CardContent>
         </Card>
         
        <div className='mt-8'>
            <h2 className="text-2xl font-bold tracking-tight mb-4">Visão Geral de Gestão Ambiental</h2>
            <EnvironmentalDashboard 
                initialPermits={projects}
                initialCondicionantes={condicionantes}
                initialOutorgas={outorgas}
                initialIntervencoes={intervencoes}
                isLoading={isLoading}
            />
        </div>
      </main>
    </div>
  );
}
