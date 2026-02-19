import { PageHeader } from '@/components/page-header';
import ReportingClient from './reporting-client';
import { useAuth } from '@/firebase';
import FinancialReportingClient from './financial-reporting-client';

export default function ReportingPage() {
  
  // Note: This is a simplified way to show different reports.
  // In a real app, you might use the user's role to decide which report to show,
  // or have different routes for different report types.
  
  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Relatórios Gerados por IA" />
      <main className="flex-1 overflow-auto p-4 md:p-6">
        <div className="space-y-8">
           <FinancialReportingClient />
           <ReportingClient />
        </div>
      </main>
    </div>
  );
}
