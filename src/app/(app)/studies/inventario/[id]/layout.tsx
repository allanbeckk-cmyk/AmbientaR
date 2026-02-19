'use client';

import * as React from 'react';
import { useParams, useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  FileText,
  Trees,
  TreeDeciduous,
  Sigma,
  Calculator,
  ChevronLeft,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export default function InventoryProjectLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const projectId = params.id as string;

  const menuItems = [
    { label: 'Projeto', icon: FileText, href: `/studies/inventario/${projectId}` },
    { label: 'Espécies', icon: TreeDeciduous, href: `/studies/inventario/${projectId}/especies` },
    { label: 'Parcelas', icon: Trees, href: `/studies/inventario/${projectId}/parcelas` },
    { label: 'Árvores', icon: TreeDeciduous, href: `/studies/inventario/${projectId}/arvores` },
    { label: 'Fórmulas', icon: Sigma, href: `/studies/inventario/${projectId}/formulas` },
    { label: 'Calculadora', icon: Calculator, href: `/studies/inventario/${projectId}/calculadora` },
  ];

  return (
    <div className="flex h-screen bg-muted/40">
      {/* Sidebar */}
      <div className="hidden md:flex w-64 flex-col border-r bg-background">
        <div className="p-4 border-b">
          <Button variant="outline" className="w-full justify-start" onClick={() => router.push('/studies/inventario')}>
            <ChevronLeft className="mr-2 h-4 w-4" />
            Fechar Projeto
          </Button>
        </div>
        <nav className="flex flex-col p-4 space-y-2">
          {menuItems.map((item) => (
            <Link key={item.label} href={item.href} passHref>
                 <Button
                    variant={pathname === item.href ? 'secondary' : 'ghost'}
                    className="w-full justify-start"
                    >
                    <item.icon className="mr-2 h-4 w-4" />
                    {item.label}
                </Button>
            </Link>
          ))}
        </nav>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-auto">
        {children}
      </div>
    </div>
  );
}
