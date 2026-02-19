'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import type { AnaliseSocioambiental } from '@/lib/types/analise-socioambiental';
import type { Client } from '@/lib/types';
import { useFirebase, errorEmitter } from '@/firebase';
import { FirestorePermissionError } from '@/firebase/errors';
import { doc, updateDoc } from 'firebase/firestore';
import { Loader2, UserPlus } from 'lucide-react';

interface PreencherClienteDialogProps {
  analise: AnaliseSocioambiental | null;
  open: boolean;
  onClose: () => void;
  clients: Client[];
}

export function PreencherClienteDialog({ analise, open, onClose, clients }: PreencherClienteDialogProps) {
  const [selectedClientId, setSelectedClientId] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const { toast } = useToast();
  const { firestore, auth } = useFirebase();
  const router = useRouter();

  const agente0 = analise?.agentes?.[0];
  const ip = analise?.informacoesPropriedade;
  const suggestedName = agente0?.nome ?? analise?.titulo ?? '';
  const suggestedCpfCnpj = agente0?.documento ?? '';
  const suggestedMunicipio = ip?.municipio ?? '';
  const suggestedUf = ip?.uf ?? '';

  const handlePreencherExistente = async () => {
    if (!firestore || !analise || !selectedClientId) return;
    setLoading(true);
    const clientRef = doc(firestore, 'clients', selectedClientId);
    const analiseRef = doc(firestore, 'analisesSocioambientais', analise.id);
    const updates: Partial<Client> = {
      analiseSocioambientalId: analise.id,
    };
    if (suggestedName) updates.name = suggestedName;
    if (suggestedCpfCnpj) updates.cpfCnpj = suggestedCpfCnpj;
    if (suggestedMunicipio) updates.municipio = suggestedMunicipio;
    if (suggestedUf) updates.uf = suggestedUf;
    try {
      await updateDoc(clientRef, updates);
      await updateDoc(analiseRef, { clientId: selectedClientId });
      toast({ title: 'Cliente atualizado', description: 'Os dados da análise foram aplicados ao cadastro do cliente.' });
      onClose();
      router.push(`/clients/${selectedClientId}/edit`);
    } catch (e) {
      toast({ variant: 'destructive', title: 'Erro ao atualizar', description: e instanceof Error ? e.message : 'Erro desconhecido.' });
      errorEmitter.emit('permission-error', new FirestorePermissionError({ path: clientRef.path, operation: 'update' }));
    } finally {
      setLoading(false);
    }
  };

  const handleCriarNovo = () => {
    onClose();
    const params = new URLSearchParams();
    if (suggestedName) params.set('name', suggestedName);
    if (suggestedCpfCnpj) params.set('cpfCnpj', suggestedCpfCnpj);
    if (suggestedMunicipio) params.set('municipio', suggestedMunicipio);
    if (suggestedUf) params.set('uf', suggestedUf);
    if (analise?.id) params.set('fromAnalise', analise.id);
    router.push(`/clients/new?${params.toString()}`);
  };

  if (!analise) return null;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Preencher cadastro do cliente</DialogTitle>
          <DialogDescription>
            Use os dados do extrato &quot;{analise.titulo}&quot; para preencher ou criar um cliente. Nome, CPF/CNPJ, município e UF serão preenchidos automaticamente.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="rounded-md bg-muted/50 p-3 text-sm">
            <p><strong>Dados que serão aplicados:</strong></p>
            <p>Nome: {suggestedName || '—'}</p>
            <p>CPF/CNPJ: {suggestedCpfCnpj || '—'}</p>
            <p>Município: {suggestedMunicipio || '—'}</p>
            <p>UF: {suggestedUf || '—'}</p>
          </div>
          <div className="space-y-2">
            <Label>Atualizar cliente existente</Label>
            <Select value={selectedClientId} onValueChange={setSelectedClientId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um cliente" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name} ({c.cpfCnpj})</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              type="button"
              variant="secondary"
              className="w-full"
              disabled={!selectedClientId || loading}
              onClick={handlePreencherExistente}
            >
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Aplicar e abrir cadastro do cliente
            </Button>
          </div>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">ou</span>
            </div>
          </div>
          <Button type="button" variant="outline" className="w-full" onClick={handleCriarNovo}>
            <UserPlus className="mr-2 h-4 w-4" />
            Criar novo cliente com estes dados
          </Button>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="ghost">Cancelar</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
