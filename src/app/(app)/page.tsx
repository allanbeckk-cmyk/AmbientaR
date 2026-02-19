
'use client';
import { useAuth } from '@/firebase';
import AdminDashboard from './dashboards/admin-dashboard';
import FinancialDashboard from './dashboards/financial-dashboard';
import EnvironmentalDashboard from './dashboards/environmental-dashboard';
import ClientDashboard from './dashboards/client-dashboard';
import CrmDashboard from './crm/crm-dashboard';
import { Leaf } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import BirthdayWidget from './dashboards/birthday-widget';
import FaunaDashboard from './dashboards/fauna-dashboard';

export default function DashboardRouterPage() {
  const { user, isInitialized } = useAuth();

  if (!isInitialized || !user) {
    return (
        <div className="flex h-full w-full items-center justify-center bg-background">
            <div className="flex flex-col items-center gap-4">
                <Leaf className="w-12 h-12 animate-pulse text-primary" />
                <p className="text-muted-foreground">Carregando painel...</p>
            </div>
        </div>
    );
  }

  const renderDashboard = () => {
    switch (user.role) {
      case 'admin':
      case 'supervisor':
        return <AdminDashboard />;
      case 'financial':
        return (
          <div className="flex flex-col h-full">
            <PageHeader title="Painel Financeiro" />
            <main className="flex-1 overflow-auto p-4 md:p-6 space-y-8">
                <BirthdayWidget />
                <FinancialDashboard />
                 <div className='mt-8'>
                    <h2 className="text-2xl font-bold tracking-tight mb-4">Visão Geral de Vendas (CRM)</h2>
                    <CrmDashboard />
                </div>
            </main>
          </div>
        );
      case 'sales':
        return (
            <div className="flex flex-col h-full">
                <PageHeader title="Painel de Vendas" />
                <main className="flex-1 overflow-auto p-4 md:p-6 space-y-8">
                    <BirthdayWidget />
                    <div className='mt-8'>
                      <CrmDashboard />
                    </div>
                     <div className='mt-8'>
                        <h2 className="text-2xl font-bold tracking-tight mb-4">Visão Geral de Gestão Ambiental</h2>
                        <EnvironmentalDashboard />
                    </div>
                </main>
            </div>
        );
      case 'client':
        return <ClientDashboard />;
      case 'diretor_fauna':
        return <FaunaDashboard />;
      case 'gestor':
      case 'technical':
        return (
            <div className="flex flex-col h-full">
                <PageHeader title="Painel de Gestão Ambiental" />
                <main className="flex-1 overflow-auto p-4 md:p-6 space-y-8">
                    <BirthdayWidget />
                    <div className='mt-8'>
                      <EnvironmentalDashboard />
                    </div>
                </main>
            </div>
        );
      default:
        console.warn(`No dashboard configured for user role: ${user.role}`);
        return <div className="p-6"><p>Nenhum painel foi configurado para este perfil de usuário.</p></div>;
    }
  };

  return <>{renderDashboard()}</>;
}
