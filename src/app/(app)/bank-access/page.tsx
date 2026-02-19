
'use client';

import * as React from 'react';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Landmark, Link, PlusCircle, Trash2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { banks } from '@/lib/brazilian-banks';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

type Bank = typeof banks[0];

interface ConnectedAccount {
    id: string;
    bank: Bank;
    lastSync: string;
}

const mockConnectedAccounts: ConnectedAccount[] = [];

export default function BankAccessPage() {
  const [selectedBank, setSelectedBank] = React.useState<Bank | null>(null);
  
  const handleBankSelect = (bankCode: string) => {
    const bank = banks.find(b => b.code === bankCode);
    setSelectedBank(bank || null);
  };

  const NewConnectionForm = () => (
    <div className="p-6 border rounded-lg space-y-4 animate-fade-in-up">
        <h3 className="font-semibold flex items-center gap-2 text-lg">
            <Landmark className="h-5 w-5" /> Conectar {selectedBank?.name}
        </h3>
        <p className="text-sm text-muted-foreground">
            Insira suas credenciais de API para o {selectedBank?.name}. Você pode obter essas credenciais no painel de desenvolvedor do seu banco.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
            <div className="space-y-2">
                <Label htmlFor="client-id">Client ID</Label>
                <Input id="client-id" placeholder="Cole seu Client ID aqui" />
            </div>
            <div className="space-y-2">
                <Label htmlFor="client-secret">Client Secret</Label>
                <Input id="client-secret" type="password" placeholder="Cole seu Client Secret aqui" />
            </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setSelectedBank(null)}>Cancelar</Button>
            <Button>
              <Link className="mr-2 h-4 w-4" />
              Salvar e Conectar
            </Button>
        </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Acesso Bancário e Conciliação" />
      <main className="flex-1 overflow-auto p-4 md:p-6 grid gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Conectar Nova Conta Bancária</CardTitle>
            <CardDescription>
              Selecione seu banco para iniciar o processo de conexão e automatizar a conciliação financeira.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            {selectedBank ? (
                <NewConnectionForm />
            ) : (
                <div className="flex items-center gap-4 p-6 border-2 border-dashed rounded-lg">
                    <Select onValueChange={handleBankSelect}>
                        <SelectTrigger className="flex-1">
                            <SelectValue placeholder="Selecione um banco da lista..." />
                        </SelectTrigger>
                        <SelectContent>
                            {banks.map(bank => (
                                <SelectItem key={bank.code} value={bank.code}>
                                    {bank.code} - {bank.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Button disabled>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Conectar
                    </Button>
                </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contas Conectadas</CardTitle>
            <CardDescription>
              Gerencie as contas bancárias que já estão conectadas ao sistema.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {mockConnectedAccounts.length > 0 ? (
                mockConnectedAccounts.map(account => (
                    <div key={account.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-4">
                            <Landmark className="h-6 w-6 text-muted-foreground" />
                            <div>
                                <p className="font-semibold">{account.bank.name}</p>
                                <p className="text-sm text-muted-foreground">Última sincronização: {account.lastSync}</p>
                            </div>
                        </div>
                        <Button variant="ghost" size="icon" className="text-destructive">
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                ))
            ) : (
                 <Alert>
                    <Landmark className="h-4 w-4" />
                    <AlertTitle>Nenhuma conta conectada</AlertTitle>
                    <AlertDescription>
                        Comece selecionando um banco acima para sincronizar suas transações automaticamente.
                    </AlertDescription>
                </Alert>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
