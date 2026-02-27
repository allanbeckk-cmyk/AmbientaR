'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { MaskedInput } from '@/components/ui/masked-input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import type { AnaliseSocioambiental, InformacoesPropriedade, AgenteTerritorio } from '@/lib/types/analise-socioambiental';
import type { Client } from '@/lib/types';
import { useFirebase, errorEmitter } from '@/firebase';
import { FirestorePermissionError } from '@/firebase/errors';
import { collection, doc, addDoc, updateDoc } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';

const formSchema = z.object({
  titulo: z.string().min(1, 'Título obrigatório'),
  clientId: z.string().optional(),
  dataEmissao: z.string().optional(),
  serial: z.string().optional(),
  // Propriedade
  municipio: z.string().optional(),
  uf: z.string().optional(),
  areaInformadaHa: z.union([z.number(), z.nan]).optional(),
  statusCAR: z.string().optional(),
  bioma: z.string().optional(),
  baciaHidrografica: z.string().optional(),
  appInformadaCarHa: z.union([z.number(), z.nan]).optional(),
  rlInformadaCarHa: z.union([z.number(), z.nan]).optional(),
  cardoc: z.string().optional(),
  nomePropriedade: z.string().optional(),
  // Agente principal
  agenteNome: z.string().optional(),
  agenteDocumento: z.string().optional(),
  agenteTipo: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

function toInformacoesPropriedade(v: FormValues): InformacoesPropriedade {
  return {
    nome: v.nomePropriedade,
    municipio: v.municipio,
    uf: v.uf,
    areaInformadaHa: v.areaInformadaHa != null && !Number.isNaN(v.areaInformadaHa) ? v.areaInformadaHa : undefined,
    statusCAR: v.statusCAR,
    bioma: v.bioma,
    baciaHidrografica: v.baciaHidrografica,
    appInformadaCarHa: v.appInformadaCarHa != null && !Number.isNaN(v.appInformadaCarHa) ? v.appInformadaCarHa : undefined,
    rlInformadaCarHa: v.rlInformadaCarHa != null && !Number.isNaN(v.rlInformadaCarHa) ? v.rlInformadaCarHa : undefined,
    cardoc: v.cardoc,
  };
}

function toAgentes(v: FormValues): AgenteTerritorio[] {
  if (!v.agenteNome?.trim() && !v.agenteDocumento?.trim()) return [];
  return [{ nome: v.agenteNome || '', documento: (v.agenteDocumento || '').replace(/\D/g, ''), tipoAgente: v.agenteTipo }];
}

interface AnaliseSocioambientalFormProps {
  currentItem?: AnaliseSocioambiental | null;
  clients: Client[];
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function AnaliseSocioambientalForm({ currentItem, clients, onSuccess, onCancel }: AnaliseSocioambientalFormProps) {
  const [loading, setLoading] = React.useState(false);
  const { toast } = useToast();
  const { firestore, auth } = useFirebase();

  const ip = currentItem?.informacoesPropriedade ?? {};
  const agente0 = currentItem?.agentes?.[0];

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      titulo: currentItem?.titulo ?? '',
      clientId: currentItem?.clientId ?? '',
      dataEmissao: currentItem?.dataEmissao ? currentItem.dataEmissao.slice(0, 10) : '',
      serial: currentItem?.serial ?? '',
      municipio: ip?.municipio ?? '',
      uf: ip?.uf ?? '',
      areaInformadaHa: ip?.areaInformadaHa ?? undefined,
      statusCAR: ip?.statusCAR ?? '',
      bioma: ip?.bioma ?? '',
      baciaHidrografica: ip?.baciaHidrografica ?? '',
      appInformadaCarHa: ip?.appInformadaCarHa ?? undefined,
      rlInformadaCarHa: ip?.rlInformadaCarHa ?? undefined,
      cardoc: ip?.cardoc ?? '',
      nomePropriedade: ip?.nome ?? '',
      agenteNome: agente0?.nome ?? '',
      agenteDocumento: agente0?.documento ?? '',
      agenteTipo: agente0?.tipoAgente ?? '',
    },
  });

  const onSubmit = async (values: FormValues) => {
    if (!firestore || !auth) {
      toast({ variant: 'destructive', title: 'Firebase não inicializado.' });
      return;
    }
    setLoading(true);
    const informacoesPropriedade = toInformacoesPropriedade(values);
    const agentes = toAgentes(values);
    const payload = {
      titulo: values.titulo,
      ...(values.clientId ? { clientId: values.clientId } : {}),
      ...(values.dataEmissao ? { dataEmissao: values.dataEmissao } : {}),
      ...(values.serial ? { serial: values.serial } : {}),
      informacoesPropriedade,
      agentes,
      criteriosResultados: currentItem?.criteriosResultados ?? [],
      detalhesAnalise: currentItem?.detalhesAnalise ?? [],
      updatedAt: new Date().toISOString(),
      ...(currentItem ? {} : { createdAt: new Date().toISOString(), createdBy: auth.uid }),
    };

    try {
      if (currentItem?.id) {
        const ref = doc(firestore, 'analisesSocioambientais', currentItem.id);
        await updateDoc(ref, payload);
        toast({ title: 'Análise atualizada', description: 'Os dados foram salvos.' });
      } else {
        await addDoc(collection(firestore, 'analisesSocioambientais'), payload);
        toast({ title: 'Análise cadastrada', description: 'Extrato incluído com sucesso.' });
      }
      onSuccess?.();
    } catch (e) {
      toast({ variant: 'destructive', title: 'Erro ao salvar', description: e instanceof Error ? e.message : 'Erro desconhecido.' });
      if (firestore) {
        errorEmitter.emit('permission-error', new FirestorePermissionError({ path: 'analisesSocioambientais', operation: currentItem ? 'update' : 'create' }));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="titulo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Título / Nome da propriedade</FormLabel>
              <FormControl>
                <Input placeholder="Ex: W EGIDO AGROPECUARIA LTDA" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="clientId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cliente vinculado</FormLabel>
                <Select
                  onValueChange={(v) => field.onChange(v === '__none__' ? undefined : v)}
                  value={field.value || '__none__'}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione (opcional)" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="__none__">Nenhum</SelectItem>
                    {clients.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="dataEmissao"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Data de emissão</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="serial"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Serial / Identificador</FormLabel>
              <FormControl>
                <Input placeholder="Ex: 709_5927_20240510" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="border-t pt-4">
          <h4 className="text-sm font-medium mb-3">Informações da propriedade</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField control={form.control} name="nomePropriedade" render={({ field }) => (
              <FormItem>
                <FormLabel>Nome</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="municipio" render={({ field }) => (
              <FormItem>
                <FormLabel>Município</FormLabel>
                <FormControl><Input placeholder="Ex: UNAI - MG" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="uf" render={({ field }) => (
              <FormItem>
                <FormLabel>UF</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="areaInformadaHa" render={({ field }) => (
              <FormItem>
                <FormLabel>Área informada (ha)</FormLabel>
                <FormControl>
                  <Input type="number" step="any" {...field} value={field.value ?? ''} onChange={(e) => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="statusCAR" render={({ field }) => (
              <FormItem>
                <FormLabel>Status CAR</FormLabel>
                <FormControl><Input placeholder="Ex: Ativo" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="bioma" render={({ field }) => (
              <FormItem>
                <FormLabel>Bioma</FormLabel>
                <FormControl><Input placeholder="Ex: Cerrado" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="baciaHidrografica" render={({ field }) => (
              <FormItem>
                <FormLabel>Bacia hidrográfica</FormLabel>
                <FormControl><Input placeholder="Ex: SÃO FRANCISCO" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="appInformadaCarHa" render={({ field }) => (
              <FormItem>
                <FormLabel>APP informada no CAR (ha)</FormLabel>
                <FormControl>
                  <Input type="number" step="any" {...field} value={field.value ?? ''} onChange={(e) => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="rlInformadaCarHa" render={({ field }) => (
              <FormItem>
                <FormLabel>RL informada no CAR (ha)</FormLabel>
                <FormControl>
                  <Input type="number" step="any" {...field} value={field.value ?? ''} onChange={(e) => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="cardoc" render={({ field }) => (
              <FormItem>
                <FormLabel>CARDOC</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </div>
        </div>
        <div className="border-t pt-4">
          <h4 className="text-sm font-medium mb-3">Agente (TOMADOR)</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField control={form.control} name="agenteNome" render={({ field }) => (
              <FormItem>
                <FormLabel>Nome</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="agenteDocumento" render={({ field }) => (
              <FormItem>
                <FormLabel>CPF/CNPJ</FormLabel>
                <FormControl><MaskedInput mask="cpfCnpj" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="agenteTipo" render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo</FormLabel>
                <FormControl><Input placeholder="Ex: TOMADOR" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-4">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
          )}
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {currentItem ? 'Salvar alterações' : 'Cadastrar análise'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
