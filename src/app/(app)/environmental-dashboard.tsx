
'use client';
import { useMemo, useState, useEffect } from 'react';
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
import { AlertTriangle, CheckCircle2, Clock, FolderKanban, ClipboardCheck, Droplets, Trees, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import type { Project as EnvironmentalPermit, Condicionante, WaterPermit, EnvironmentalIntervention, Project, Empreendedor } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

type LicenseGroup = 'expiringIn30' | 'expiringIn60' | 'expiringIn180' | 'expiringIn360' | 'expired';

interface EnvironmentalDashboardProps {
  initialPermits?: EnvironmentalPermit[] | null;
  initialCondicionantes?: Condicionante[] | null;
  initialOutorgas?: WaterPermit[] | null;
  initialIntervencoes?: EnvironmentalIntervention[] | null;
  isLoading?: boolean;
}

export default function EnvironmentalDashboard({ initialPermits, initialCondicionantes, initialOutorgas, initialIntervencoes, isLoading: initialIsLoading }: EnvironmentalDashboardProps) {
  const firestore = useFirestore();
  const { user } = useUser();
  const [isLicenseDialogOpen, setIsLicenseDialogOpen] = useState(false);
  const [isCondicionanteDialogOpen, setIsCondicionanteDialogOpen] = useState(false);
  const [dialogContent, setDialogContent] = useState<EnvironmentalPermit[]>([]);
  const [dialogCondicionantes, setDialogCondicionantes] = useState<Condicionante[]>([]);
  const [dialogTitle, setDialogTitle] = useState('');
  
  const isClientView = user?.role === 'client';

  // Use initial data if provided (for client dashboard), otherwise fetch all data for manager roles
  const { data: permits, isLoading: isLoadingPermits } = useCollection<EnvironmentalPermit>(useMemoFirebase(() => {
    if (initialPermits !== undefined || !firestore || isClientView) return null;
    return collection(firestore, 'projects');
  }, [firestore, initialPermits, isClientView]), { skip: initialPermits !== undefined });

  const { data: condicionantes, isLoading: isLoadingCondicionantes } = useCollection<Condicionante>(useMemoFirebase(() => {
    if (initialCondicionantes !== undefined || !firestore) return null;
    // For client view, we rely on the pre-filtered initialCondicionantes passed as props
    if (isClientView) return null; 
    return collection(firestore, 'condicionantes');
  }, [firestore, initialCondicionantes, isClientView]), { skip: initialCondicionantes !== undefined });
  
  const { data: outorgas, isLoading: isLoadingOutorgas } = useCollection<WaterPermit>(useMemoFirebase(() => {
    if (initialOutorgas !== undefined || !firestore || isClientView) return null;
    return collection(firestore, 'outorgas');
  }, [firestore, initialOutorgas, isClientView]), { skip: initialOutorgas !== undefined });

  const { data: intervencoes, isLoading: isLoadingIntervencoes } = useCollection<EnvironmentalIntervention>(useMemoFirebase(() => {
    if (initialIntervencoes !== undefined || !firestore || isClientView) return null;
    return collection(firestore, 'intervencoes');
  }, [firestore, initialIntervencoes, isClientView]), { skip: initialIntervencoes !== undefined });
  
  const finalPermits = initialPermits !== undefined ? initialPermits : permits;
  const finalCondicionantes = initialCondicionantes !== undefined ? initialCondicionantes : condicionantes;
  const finalOutorgas = initialOutorgas !== undefined ? initialOutorgas : outorgas;
  const finalIntervencoes = initialIntervencoes !== undefined ? initialIntervencoes : intervencoes;


  const projectsQuery = useMemoFirebase(() => firestore ? collection(firestore, 'projects') : null, [firestore]);
  const { data: allProjects, isLoading: isLoadingProjects } = useCollection<Project>(projectsQuery);
  const projectsMap = useMemo(() => new Map(allProjects?.map(p => [p.id, p.propertyName])), [allProjects]);

  const empreendedoresQuery = useMemoFirebase(() => firestore ? collection(firestore, 'empreendedores') : null, [firestore]);
  const { data: allEmpreendedores, isLoading: isLoadingEmpreendedores } = useCollection<Empreendedor>(empreendedoresQuery);
  const empreendedoresMap = useMemo(() => new Map(allEmpreendedores?.map(e => [e.id, e.name])), [allEmpreendedores]);


  const { permitStats, complianceStats, outorgaStats, intervencaoStats } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); 
    
    const stats = {
      valid: 0,
      expired: [] as EnvironmentalPermit[],
      expiringIn30: [] as EnvironmentalPermit[],
      expiringIn60: [] as EnvironmentalPermit[],
      expiringIn180: [] as EnvironmentalPermit[],
      expiringIn360: [] as EnvironmentalPermit[],
    };
    
    (finalPermits || []).forEach(permit => {
      if (!permit.expirationDate) {
        if (permit.status === 'Válida' || permit.status === 'Em Renovação' || permit.status === 'Em Andamento') stats.valid++;
        return;
      }
      
      const expirationDate = new Date(permit.expirationDate);
      const daysUntilExpiration = Math.ceil((expirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      if (daysUntilExpiration < 0) {
        stats.expired.push(permit);
      } else {
        stats.valid++;
        if (daysUntilExpiration <= 30) {
          stats.expiringIn30.push(permit);
        } else if (daysUntilExpiration <= 60) {
          stats.expiringIn60.push(permit);
        } else if (daysUntilExpiration <= 180) {
          stats.expiringIn180.push(permit);
        } else if (daysUntilExpiration <= 360) {
          stats.expiringIn360.push(permit);
        }
      }
    });

    const recentPermits = [...(finalPermits || [])]
        .sort((a,b) => new Date(b.issueDate || 0).getTime() - new Date(a.issueDate || 0).getTime())
        .slice(0, 5);
        
    let pending = 0;
    let overdue = 0;
    (finalCondicionantes || []).forEach(c => {
        if (c.status === 'Pendente') pending++;
        if (c.status === 'Atrasada') overdue++;
    });
    
    const activeOutorgas = (finalOutorgas || []).filter(o => o.status === 'Válida').length;
    const totalIntervencoes = (finalIntervencoes || []).length;

    return {
      permitStats: {
        ...stats,
        total: finalPermits?.length || 0,
        recent: recentPermits,
      },
      complianceStats: {
        pending,
        overdue,
        total: finalCondicionantes?.length || 0,
      },
      outorgaStats: {
        active: activeOutorgas,
        total: finalOutorgas?.length || 0,
      },
      intervencaoStats: {
        total: totalIntervencoes,
      }
    };
  }, [finalPermits, finalCondicionantes, finalOutorgas, finalIntervencoes]);


  const handleCardClick = (group: LicenseGroup, title: string) => {
    let licensesToShow: EnvironmentalPermit[] = [];
    switch (group) {
        case 'expiringIn30': licensesToShow = permitStats.expiringIn30; break;
        case 'expiringIn60': licensesToShow = permitStats.expiringIn60; break;
        case 'expiringIn180': licensesToShow = permitStats.expiringIn180; break;
        case 'expiringIn360': licensesToShow = permitStats.expiringIn360; break;
        case 'expired': licensesToShow = permitStats.expired; break;
    }
    setDialogContent(licensesToShow);
    setDialogTitle(title);
    setIsLicenseDialogOpen(true);
  };
  
  const handleComplianceCardClick = () => {
    const pendingAndOverdue = (finalCondicionantes || []).filter(
      c => c.status === 'Pendente' || c.status === 'Atrasada'
    );
    setDialogCondicionantes(pendingAndOverdue);
    setIsCondicionanteDialogOpen(true);
  };

  const getStatusVariant = (status?: EnvironmentalPermit['status'] | Condicionante['status']) => {
    switch (status) {
      case 'Válida':
      case 'Cumprida':
        return 'bg-emerald-500/20 text-emerald-700 border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20';
      case 'Em Renovação':
        return 'bg-blue-500/20 text-blue-700 border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20';
      case 'Vencida':
      case 'Atrasada':
        return 'bg-red-500/20 text-red-700 border-red-500/30 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20';
      case 'Suspensa':
      case 'Cancelada':
      case 'Em Andamento':
      case 'Pendente':
         return 'bg-yellow-500/20 text-yellow-700 border-yellow-500/30 dark:bg-yellow-500/10 dark:text-yellow-400 dark:border-yellow-500/20';
      default:
        return 'bg-slate-500/20 text-slate-700 border-slate-500/30 dark:bg-slate-500/10 dark:text-slate-400 dark:border-slate-500/20';
    }
  };
  
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
  };
  
  const isLoading = initialIsLoading === undefined ? (isLoadingPermits || isLoadingCondicionantes || isLoadingOutorgas || isLoadingIntervencoes || isLoadingProjects || isLoadingEmpreendedores) : initialIsLoading;

  return (
    <>
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Licenças Válidas</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-1/2" /> : <div className="text-2xl font-bold">{permitStats.valid}</div>}
             {isLoading ? <Skeleton className="h-4 w-3/4 mt-1" /> : <p className="text-xs text-muted-foreground">de {permitStats.total} licenças totais</p>}
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:bg-muted/50" onClick={handleComplianceCardClick}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Condicionantes Pendentes</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-1/2" /> : <div className="text-2xl font-bold">{complianceStats.pending}</div>}
             {isLoading ? <Skeleton className="h-4 w-3/4 mt-1" /> : <p className="text-xs text-muted-foreground">{complianceStats.overdue} atrasadas</p>}
          </CardContent>
        </Card>
         <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outorgas Ativas</CardTitle>
            <Droplets className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-1/2" /> : <div className="text-2xl font-bold">{outorgaStats.active}</div>}
             {isLoading ? <Skeleton className="h-4 w-3/4 mt-1" /> : <p className="text-xs text-muted-foreground">de {outorgaStats.total} outorgas</p>}
          </CardContent>
        </Card>
         <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Intervenções Ambientais</CardTitle>
            <Trees className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-1/2" /> : <div className="text-2xl font-bold">{intervencaoStats.total}</div>}
            <p className="text-xs text-muted-foreground">autorizações cadastradas</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card className="border-red-500/50 bg-red-500/10 dark:bg-red-500/10 cursor-pointer hover:bg-red-500/20" onClick={() => handleCardClick('expiringIn30', 'Vencem em 30 Dias')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-800 dark:text-red-300">Vencem em 30 Dias</CardTitle>
            <Clock className="h-4 w-4 text-red-700 dark:text-red-400" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-1/2 bg-red-200" /> : <div className="text-2xl font-bold text-red-900 dark:text-red-200">{permitStats.expiringIn30.length}</div>}
            <p className="text-xs text-red-700 dark:text-red-400">Ação imediata necessária.</p>
          </CardContent>
        </Card>
        <Card className="border-orange-500/50 bg-orange-500/10 dark:bg-orange-500/10 cursor-pointer hover:bg-orange-500/20" onClick={() => handleCardClick('expiringIn60', 'Vencem em 60 Dias')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-800 dark:text-orange-300">Vencem em 60 Dias</CardTitle>
            <Clock className="h-4 w-4 text-orange-700 dark:text-orange-400" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-1/2 bg-orange-200" /> : <div className="text-2xl font-bold text-orange-900 dark:text-orange-200">{permitStats.expiringIn60.length}</div>}
            <p className="text-xs text-orange-700 dark:text-orange-400">Planejar renovação.</p>
          </CardContent>
        </Card>
        <Card className="border-yellow-500/50 bg-yellow-500/10 dark:bg-yellow-500/10 cursor-pointer hover:bg-yellow-500/20" onClick={() => handleCardClick('expiringIn180', 'Vencem em 180 Dias')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-yellow-800 dark:text-yellow-300">Vencem em 180 Dias</CardTitle>
            <Clock className="h-4 w-4 text-yellow-700 dark:text-yellow-400" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-1/2 bg-yellow-200" /> : <div className="text-2xl font-bold text-yellow-900 dark:text-yellow-200">{permitStats.expiringIn180.length}</div>}
            <p className="text-xs text-yellow-700 dark:text-yellow-400">Requerem atenção em breve.</p>
          </CardContent>
        </Card>
        <Card className="border-blue-500/40 bg-blue-500/10 dark:bg-blue-500/10 cursor-pointer hover:bg-blue-500/20" onClick={() => handleCardClick('expiringIn360', 'Vencem em 360 Dias')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-800 dark:text-blue-300">Vencem em 360 Dias</CardTitle>
            <Clock className="h-4 w-4 text-blue-700 dark:text-blue-400" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-1/2 bg-blue-200" /> : <div className="text-2xl font-bold text-blue-900 dark:text-blue-200">{permitStats.expiringIn360.length}</div>}
            <p className="text-xs text-blue-700 dark:text-blue-400">No radar para o próximo ano.</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:bg-muted/50" onClick={() => handleCardClick('expired', 'Licenças Vencidas')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vencidas</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-1/2" /> : <div className="text-2xl font-bold">{permitStats.expired.length}</div>}
            <p className="text-xs text-muted-foreground">Licenças que expiraram.</p>
          </CardContent>
        </Card>
      </div>

       <Card>
            <CardHeader>
              <CardTitle>Licenças e Projetos Recentes</CardTitle>
              <CardDescription>As últimas licenças e projetos adicionados ao sistema.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nº do Processo</TableHead>
                    <TableHead className="hidden md:table-cell">Emissão</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading && Array.from({length: 5}).map((_, i) => (
                    <TableRow key={i}>
                        <TableCell><Skeleton className="h-5 w-32 mb-2" />
                            <Skeleton className="h-4 w-48" />
                        </TableCell>
                        <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-24 rounded-full" /></TableCell>
                    </TableRow>
                  ))}
                  {!isLoading && permitStats.recent.map((permit) => (
                    <TableRow key={permit.id}>
                      <TableCell>
                        <div className="font-medium">{permit.processNumber || permit.propertyName}</div>
                        <div className="text-sm text-muted-foreground hidden sm:block">{permit.description?.substring(0,40)}...</div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">{permit.issueDate ? new Date(permit.issueDate).toLocaleDateString('pt-BR') : 'N/A'}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn(getStatusVariant(permit.status))}>
                            {permit.status || 'Não definido'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                   {!isLoading && permitStats.recent.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={3} className="h-24 text-center">
                                Nenhuma licença ou projeto encontrado.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
    </div>
    
     <Dialog open={isLicenseDialogOpen} onOpenChange={setIsLicenseDialogOpen}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{dialogTitle}</DialogTitle>
            <DialogDescription>
              Lista de licenças correspondentes ao período selecionado.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Empreendimento</TableHead>
                        <TableHead>Nº Processo</TableHead>
                        <TableHead>Vencimento</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {dialogContent.length > 0 ? (
                        dialogContent.map((license) => (
                        <TableRow key={license.id}>
                            <TableCell>{projectsMap.get(license.id) || 'Não encontrado'}</TableCell>
                            <TableCell>{license.processNumber}</TableCell>
                            <TableCell>{formatDate(license.expirationDate)}</TableCell>
                        </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={3} className="text-center h-24">
                                Nenhuma licença encontrada neste grupo.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
          </div>
          <DialogFooter>
            <DialogClose asChild>
                <Button variant="outline">Fechar</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isCondicionanteDialogOpen} onOpenChange={setIsCondicionanteDialogOpen}>
        <DialogContent className="sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>Condicionantes Pendentes e Atrasadas</DialogTitle>
            <DialogDescription>
              Lista de todas as condicionantes que requerem atenção.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Descrição</TableHead>
                        <TableHead>Empreendimento</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Vencimento</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {dialogCondicionantes.length > 0 ? (
                        dialogCondicionantes.map((item) => (
                        <TableRow key={item.id}>
                            <TableCell className="max-w-xs truncate">{item.description}</TableCell>
                            <TableCell>{projectsMap.get(item.referenceId) || 'N/A'}</TableCell>
                            <TableCell>
                                <Badge variant={'outline'} className={cn(getStatusVariant(item.status))}>
                                    {item.status}
                                </Badge>
                            </TableCell>
                            <TableCell>{formatDate(item.dueDate)}</TableCell>
                        </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={4} className="text-center h-24">
                                Nenhuma condicionante pendente ou atrasada.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
          </div>
          <DialogFooter>
            <DialogClose asChild>
                <Button variant="outline">Fechar</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
