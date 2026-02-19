'use client';

import { PageHeader } from '@/components/page-header';
import FinancialDashboard from './financial-dashboard';
import EnvironmentalDashboard from './environmental-dashboard';
import CrmDashboard from '../crm/crm-dashboard';
import BirthdayWidget from './birthday-widget';

export default function AdminDashboard() {

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Painel do Administrador" />
      <main className="flex-1 overflow-auto p-4 md:p-6 space-y-8">
        <div>
          <BirthdayWidget />
        </div>
        <div>
            <h2 className="text-2xl font-bold tracking-tight mb-4">Visão Geral Financeira</h2>
            <FinancialDashboard />
        </div>
        <div>
            <h2 className="text-2xl font-bold tracking-tight mb-4">Visão Geral de Vendas (CRM)</h2>
            <CrmDashboard />
        </div>
        <div>
            <h2 className="text-2xl font-bold tracking-tight mb-4">Visão Geral de Gestão Ambiental</h2>
            <EnvironmentalDashboard />
        </div>
      </main>
    </div>
  );
}
