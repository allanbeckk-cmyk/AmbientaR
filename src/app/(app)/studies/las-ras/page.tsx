
'use client';
import { useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LasRasForm } from './las-ras-form';

export default function LasRasPage() {
  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Licenciamento Ambiental Simplificado (LAS/RAS)" />
      <main className="flex-1 overflow-auto p-4 md:p-6">
        <Card>
          <CardHeader>
            <CardTitle>Relatório Ambiental Simplificado (RAS)</CardTitle>
            <CardDescription>Preencha os campos abaixo para gerar o relatório.</CardDescription>
          </CardHeader>
          <CardContent>
            <LasRasForm />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
