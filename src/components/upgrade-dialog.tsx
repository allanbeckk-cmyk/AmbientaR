
'use client';

import * as React from 'react';
import { useFirebase } from '@/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Check, Crown, Star, Zap, Rocket, Gift, MessageSquareMore, ArrowUp, Loader2 } from 'lucide-react';
import type { ClientPackage, ClientPackageInfo } from '@/lib/types';

const PACKAGES: ClientPackageInfo[] = [
  {
    id: 'gratuito',
    name: 'Gratuito',
    description: 'Acesso básico para conhecer a plataforma.',
    price: 'R$ 0',
    features: ['Acesso ao dashboard básico', 'Visualização de licenças', 'Suporte por email'],
  },
  {
    id: 'basico',
    name: 'Básico',
    description: 'Ideal para quem está começando na gestão ambiental.',
    price: 'R$ 49,90/mês',
    features: ['Tudo do plano Gratuito', 'Gestão de licenças ambientais', 'Calendário de prazos', 'Relatórios básicos'],
  },
  {
    id: 'intermediario',
    name: 'Intermediário',
    description: 'Para empresas que precisam de mais recursos.',
    price: 'R$ 99,90/mês',
    highlighted: true,
    features: ['Tudo do plano Básico', 'Gestão de condicionantes', 'Monitoramento ambiental', 'Relatórios avançados', 'Suporte prioritário'],
  },
  {
    id: 'avancado',
    name: 'Avançado',
    description: 'Recursos completos para gestão ambiental profissional.',
    price: 'R$ 199,90/mês',
    features: ['Tudo do plano Intermediário', 'Elaboração de estudos ambientais', 'Análise com Inteligência Artificial', 'Gestão financeira integrada', 'Suporte dedicado'],
  },
  {
    id: 'completo',
    name: 'Completo',
    description: 'A solução definitiva para gestão ambiental.',
    price: 'R$ 349,90/mês',
    features: ['Acesso a todos os módulos', 'Análises com IA ilimitadas', 'CRM e gestão comercial', 'Geração de PDFs e relatórios', 'Suporte VIP 24h'],
  },
  {
    id: 'sob_consulta',
    name: 'Sob Consulta',
    description: 'Soluções personalizadas que vão além da plataforma.',
    price: 'Personalizado',
    features: ['Consultoria ambiental dedicada', 'Assessoria técnica especializada', 'Projetos sob demanda', 'Atendimento presencial', 'Orçamento personalizado'],
  },
];

const PACKAGE_ICONS: Record<ClientPackage, React.ReactNode> = {
  gratuito: <Gift className="h-5 w-5" />,
  basico: <Star className="h-5 w-5" />,
  intermediario: <Zap className="h-5 w-5" />,
  avancado: <Rocket className="h-5 w-5" />,
  completo: <Crown className="h-5 w-5" />,
  sob_consulta: <MessageSquareMore className="h-5 w-5" />,
};

const PACKAGE_ORDER: ClientPackage[] = ['gratuito', 'basico', 'intermediario', 'avancado', 'completo', 'sob_consulta'];

interface UpgradeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UpgradeDialog({ open, onOpenChange }: UpgradeDialogProps) {
  const { firestore, user } = useFirebase();
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(false);
  const [selectedPackage, setSelectedPackage] = React.useState<ClientPackage | null>(null);

  const currentPackage = (user as any)?.package as ClientPackage | undefined;
  const currentIndex = currentPackage ? PACKAGE_ORDER.indexOf(currentPackage) : -1;

  const handleUpgrade = async () => {
    if (!firestore || !user || !selectedPackage) return;

    setLoading(true);
    try {
      const userDocRef = doc(firestore, 'users', user.id);
      await updateDoc(userDocRef, {
        package: selectedPackage,
        packageUpdatedAt: serverTimestamp(),
      });

      toast({
        title: 'Plano atualizado!',
        description: `Seu plano foi alterado para ${PACKAGES.find(p => p.id === selectedPackage)?.name}.`,
      });
      onOpenChange(false);
      setSelectedPackage(null);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao atualizar plano',
        description: 'Não foi possível alterar seu plano. Tente novamente.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowUp className="h-5 w-5 text-primary" />
            Upgrade de Plano
          </DialogTitle>
          <DialogDescription>
            {currentPackage
              ? `Seu plano atual: ${PACKAGES.find(p => p.id === currentPackage)?.name}. Escolha um novo plano abaixo.`
              : 'Escolha o plano ideal para suas necessidades.'}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
          {PACKAGES.map((pkg, index) => {
            const isCurrent = pkg.id === currentPackage;
            const isDowngrade = index < currentIndex && currentPackage !== 'sob_consulta';
            const isSelected = selectedPackage === pkg.id;

            return (
              <div
                key={pkg.id}
                onClick={() => {
                  if (!isCurrent) {
                    setSelectedPackage(pkg.id);
                  }
                }}
                className={cn(
                  'relative rounded-lg border-2 p-4 transition-all',
                  isCurrent
                    ? 'border-primary/50 bg-primary/5 opacity-70 cursor-default'
                    : 'cursor-pointer hover:shadow-md',
                  isSelected && !isCurrent
                    ? 'border-primary bg-primary/5 shadow-md'
                    : !isCurrent && 'border-border hover:border-primary/50',
                  pkg.highlighted && !isCurrent && !isSelected && 'border-emerald-300 bg-emerald-50/50 dark:bg-emerald-950/20'
                )}
              >
                {isCurrent && (
                  <span className="absolute -top-2.5 left-4 rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-white">
                    Plano Atual
                  </span>
                )}
                {pkg.highlighted && !isCurrent && (
                  <span className="absolute -top-2.5 right-4 rounded-full bg-emerald-500 px-2 py-0.5 text-xs font-semibold text-white">
                    Mais Popular
                  </span>
                )}
                <div className="flex items-start gap-3">
                  <div className={cn(
                    'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
                    isSelected || isCurrent
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  )}>
                    {PACKAGE_ICONS[pkg.id]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-semibold text-sm">{pkg.name}</h3>
                      <span className="text-xs font-bold text-primary whitespace-nowrap">{pkg.price}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{pkg.description}</p>
                    <ul className="mt-2 space-y-0.5">
                      {pkg.features.slice(0, 3).map((f, i) => (
                        <li key={i} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Check className="h-3 w-3 text-emerald-500 shrink-0" />
                          {f}
                        </li>
                      ))}
                      {pkg.features.length > 3 && (
                        <li className="text-xs text-muted-foreground/70">
                          +{pkg.features.length - 3} mais...
                        </li>
                      )}
                    </ul>
                  </div>
                </div>
                {isSelected && !isCurrent && (
                  <div className="absolute top-3 right-3">
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <Check className="h-3 w-3" />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex justify-end gap-3 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleUpgrade}
            disabled={!selectedPackage || selectedPackage === currentPackage || loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Alterando...
              </>
            ) : (
              <>
                <ArrowUp className="mr-2 h-4 w-4" />
                {selectedPackage ? `Mudar para ${PACKAGES.find(p => p.id === selectedPackage)?.name}` : 'Selecione um plano'}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function UpgradeButton() {
  const [open, setOpen] = React.useState(false);
  const { user } = useFirebase();

  if (!user || user.role !== 'client') return null;

  const currentPackage = (user as any)?.package as ClientPackage | undefined;
  const isComplete = currentPackage === 'completo' || currentPackage === 'sob_consulta';

  return (
    <>
      <Button
        variant={isComplete ? 'ghost' : 'default'}
        size="sm"
        onClick={() => setOpen(true)}
        className={cn(
          'gap-1.5 h-8',
          !isComplete && 'bg-gradient-to-r from-primary to-emerald-500 hover:from-primary/90 hover:to-emerald-500/90 text-white shadow-sm'
        )}
      >
        <ArrowUp className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Alterar Plano</span>
      </Button>
      <UpgradeDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
