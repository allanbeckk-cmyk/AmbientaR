
'use client';

import * as React from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { EnvironmentalCompany } from '@/lib/types';
import { useFirebase, errorEmitter } from '@/firebase';
import { FirestorePermissionError } from '@/firebase/errors';
import { doc, setDoc } from 'firebase/firestore';
import { DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ibgeData } from '@/lib/ibge-data';

const formSchema = z.object({
  name: z.string().min(2, 'A razão social é obrigatória.'),
  fantasyName: z.string().optional(),
  cnpj: z.string().min(14, 'O CNPJ é obrigatório (14 dígitos).').max(18, 'CNPJ inválido.'),
  address: z.string().optional(),
  numero: z.string().optional(),
  caixaPostal: z.string().optional(),
  municipio: z.string().optional(),
  district: z.string().optional(),
  uf: z.string().optional(),
  cep: z.string().optional(),
  ddd: z.string().optional(),
  phone: z.string().optional(),
  fax: z.string().optional(),
  email: z.string().email('Por favor, insira um e-mail válido.').optional().or(z.literal('')),
});

type FormValues = z.infer<typeof formSchema>;

interface CompanyFormProps {
  currentItem?: Omit<EnvironmentalCompany, 'id'> | null;
  onSuccess?: () => void;
}

export function CompanyForm({ currentItem, onSuccess }: CompanyFormProps) {
  const [loading, setLoading] = React.useState(false);
  const { toast } = useToast();
  const { firestore } = useFirebase();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: currentItem?.name || '',
      fantasyName: currentItem?.fantasyName || '',
      cnpj: currentItem?.cnpj || '',
      address: currentItem?.address || '',
      numero: currentItem?.numero || '',
      caixaPostal: currentItem?.caixaPostal || '',
      municipio: currentItem?.municipio || '',
      district: currentItem?.district || '',
      uf: currentItem?.uf || '',
      cep: currentItem?.cep || '',
      ddd: currentItem?.ddd || '',
      phone: currentItem?.phone || '',
      fax: currentItem?.fax || '',
      email: currentItem?.email || '',
    },
  });
  
  const selectedUf = form.watch('uf');
  const citiesForSelectedUf = React.useMemo(() => {
    return ibgeData.statesWithCities.find(state => state.sigla === selectedUf)?.cidades || [];
  }, [selectedUf]);
  
  const handleCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    value = value.replace(/^(\d{2})(\d)/, '$1.$2');
    value = value.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3');
    value = value.replace(/\.(\d{3})(\d)/, '.$1/$2');
    value = value.replace(/(\d{4})(\d)/, '$1-$2');
    form.setValue('cnpj', value);
  };
  
  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    value = value.replace(/(\d{5})(\d)/, '$1-$2');
    form.setValue('cep', value);
  }


  async function onSubmit(values: FormValues) {
    setLoading(true);

    if (!firestore) {
      toast({ variant: 'destructive', title: 'Firebase não inicializado.' });
      setLoading(false);
      return;
    }
    
    const docRef = doc(firestore, 'companySettings', 'companyProfile');
    // Using setDoc with merge:true will create or update the document.
    setDoc(docRef, values, { merge: true })
        .then(() => {
          toast({ title: 'Empresa atualizada!', description: 'Os dados da empresa foram salvos com sucesso.' });
          onSuccess?.();
        })
        .catch(async (serverError) => {
          const permissionError = new FirestorePermissionError({
            path: docRef.path,
            operation: 'write', // 'set' can be create or update
            requestResourceData: values,
          });
          errorEmitter.emit('permission-error', permissionError);
        })
        .finally(() => setLoading(false));
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Editar Informações da Empresa</DialogTitle>
        <DialogDescription>
          Atualize os detalhes da sua empresa abaixo.
        </DialogDescription>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="h-full flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto pr-6 pl-1 -mr-6 -ml-1 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Razão Social</FormLabel><FormControl><Input placeholder="Nome completo da empresa" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="fantasyName" render={({ field }) => (<FormItem><FormLabel>Nome Fantasia</FormLabel><FormControl><Input placeholder="Nome comercial" {...field} /></FormControl><FormMessage /></FormItem>)} />
          </div>
          <FormField control={form.control} name="cnpj" render={({ field }) => (<FormItem><FormLabel>CNPJ</FormLabel><FormControl><Input placeholder="00.000.000/0000-00" {...field} onChange={handleCnpjChange} maxLength={18} /></FormControl><FormMessage /></FormItem>)} />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField control={form.control} name="address" render={({ field }) => (<FormItem className="col-span-2"><FormLabel>Endereço</FormLabel><FormControl><Input placeholder="Rua, Av, etc." {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="numero" render={({ field }) => (<FormItem><FormLabel>Nº</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
          </div>
          <FormField control={form.control} name="caixaPostal" render={({ field }) => (<FormItem><FormLabel>Caixa Postal</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <FormField control={form.control} name="uf" render={({ field }) => (
                  <FormItem><FormLabel>UF</FormLabel>
                      <Select onValueChange={(value) => { field.onChange(value); form.setValue('municipio', ''); }} defaultValue={field.value}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger></FormControl>
                          <SelectContent>{ibgeData.statesWithCities.map(s => <SelectItem key={s.sigla} value={s.sigla}>{s.sigla}</SelectItem>)}</SelectContent>
                      </Select>
                  <FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="municipio" render={({ field }) => (
                  <FormItem className="md:col-span-2"><FormLabel>Município</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ''} disabled={!selectedUf}>
                              <FormControl><SelectTrigger><SelectValue placeholder={!selectedUf ? "Selecione um estado" : "Selecione um município"} /></SelectTrigger></FormControl>
                              <SelectContent>{citiesForSelectedUf.map(city => <SelectItem key={city} value={city}>{city}</SelectItem>)}</SelectContent>
                          </Select>
                  <FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="cep" render={({ field }) => (<FormItem><FormLabel>CEP</FormLabel><FormControl><Input placeholder="00000-000" {...field} onChange={handleCepChange} maxLength={9}/></FormControl><FormMessage /></FormItem>)} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField control={form.control} name="ddd" render={({ field }) => (<FormItem><FormLabel>DDD</FormLabel><FormControl><Input maxLength={2} {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="phone" render={({ field }) => (<FormItem><FormLabel>Fone</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="fax" render={({ field }) => (<FormItem><FormLabel>Fax</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
          </div>
          <FormField control={form.control} name="email" render={({ field }) => (<FormItem><FormLabel>E-mail</FormLabel><FormControl><Input type="email" placeholder="contato@empresa.com" {...field} /></FormControl><FormMessage /></FormItem>)} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onSuccess}>Cancelar</Button>
            <Button type="submit" disabled={loading}>
              {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...</> : 'Salvar'}
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </>
  );
}
