
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
import { collection, doc, addDoc, updateDoc } from 'firebase/firestore';
import { DialogFooter } from '@/components/ui/dialog';

const formSchema = z.object({
  name: z.string().min(2, 'A razão social é obrigatória.'),
  fantasyName: z.string().optional(),
  cnpj: z.string().min(14, 'O CNPJ é obrigatório (14 dígitos).').max(18, 'CNPJ inválido.'),
  address: z.string().optional(),
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
  currentItem?: EnvironmentalCompany | null;
  onSuccess?: () => void;
}

export function CompanyForm({ currentItem, onSuccess }: CompanyFormProps) {
  const [loading, setLoading] = React.useState(false);
  const { toast } = useToast();
  const { firestore } = useFirebase();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: currentItem || {
      name: '',
      fantasyName: '',
      cnpj: '',
      address: '',
      caixaPostal: '',
      municipio: '',
      district: '',
      uf: '',
      cep: '',
      ddd: '',
      phone: '',
      fax: '',
      email: '',
    },
  });

  async function onSubmit(values: FormValues) {
    setLoading(true);

    if (!firestore) {
      toast({ variant: 'destructive', title: 'Firebase não inicializado.' });
      setLoading(false);
      return;
    }

    if (currentItem) {
      const docRef = doc(firestore, 'environmentalCompanies', currentItem.id);
      updateDoc(docRef, values)
        .then(() => {
          toast({ title: 'Empresa atualizada!', description: 'Os dados da empresa foram salvos com sucesso.' });
          onSuccess?.();
        })
        .catch(async (serverError) => {
          const permissionError = new FirestorePermissionError({
            path: docRef.path,
            operation: 'update',
            requestResourceData: values,
          });
          errorEmitter.emit('permission-error', permissionError);
        })
        .finally(() => setLoading(false));
    } else {
      const collectionRef = collection(firestore, 'environmentalCompanies');
      addDoc(collectionRef, values)
        .then(() => {
          toast({ title: 'Empresa criada!', description: `A empresa ${values.name} foi adicionada com sucesso.` });
          form.reset();
          onSuccess?.();
        })
        .catch(async (serverError) => {
          const permissionError = new FirestorePermissionError({
            path: collectionRef.path,
            operation: 'create',
            requestResourceData: values,
          });
          errorEmitter.emit('permission-error', permissionError);
        })
        .finally(() => setLoading(false));
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto pr-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Razão Social</FormLabel><FormControl><Input placeholder="Nome completo da empresa" {...field} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="fantasyName" render={({ field }) => (<FormItem><FormLabel>Nome Fantasia</FormLabel><FormControl><Input placeholder="Nome comercial" {...field} /></FormControl><FormMessage /></FormItem>)} />
        </div>
        <FormField control={form.control} name="cnpj" render={({ field }) => (<FormItem><FormLabel>CNPJ</FormLabel><FormControl><Input placeholder="00.000.000/0000-00" {...field} /></FormControl><FormMessage /></FormItem>)} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField control={form.control} name="address" render={({ field }) => (<FormItem><FormLabel>Endereço</FormLabel><FormControl><Input placeholder="Rua, Av, etc." {...field} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="caixaPostal" render={({ field }) => (<FormItem><FormLabel>Caixa Postal</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <FormField control={form.control} name="municipio" render={({ field }) => (<FormItem><FormLabel>Município</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="district" render={({ field }) => (<FormItem><FormLabel>Distrito/Localidade</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="uf" render={({ field }) => (<FormItem><FormLabel>UF</FormLabel><FormControl><Input maxLength={2} {...field} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="cep" render={({ field }) => (<FormItem><FormLabel>CEP</FormLabel><FormControl><Input placeholder="00000-000" {...field} /></FormControl><FormMessage /></FormItem>)} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField control={form.control} name="ddd" render={({ field }) => (<FormItem><FormLabel>DDD</FormLabel><FormControl><Input maxLength={2} {...field} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="phone" render={({ field }) => (<FormItem><FormLabel>Fone</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="fax" render={({ field }) => (<FormItem><FormLabel>Fax</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
        </div>
        <FormField control={form.control} name="email" render={({ field }) => (<FormItem><FormLabel>E-mail</FormLabel><FormControl><Input type="email" placeholder="contato@empresa.com" {...field} /></FormControl><FormMessage /></FormItem>)} />
        
        <DialogFooter>
          <Button type="submit" disabled={loading}>
            {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...</> : 'Salvar'}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
