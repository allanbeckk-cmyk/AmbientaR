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
import { MaskedInput } from '@/components/ui/masked-input';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Fornecedor } from '@/lib/types';
import { useFirebase, errorEmitter } from '@/firebase';
import { FirestorePermissionError } from '@/firebase/errors';
import { collection, doc, addDoc, updateDoc } from 'firebase/firestore';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Textarea } from '@/components/ui/textarea';


const formSchema = z.object({
  name: z.string().min(2, 'O nome é obrigatório.'),
  cpfCnpj: z.string().min(11, 'O CPF/CNPJ é obrigatório.'),
  entityType: z.enum(['Pessoa Física', 'Pessoa Jurídica'], {
    required_error: 'Selecione o tipo de pessoa.',
  }),
  phone: z.string().optional(),
  email: z.string().email('Por favor, insira um e-mail válido.').optional().or(z.literal('')),
  serviceType: z.string().optional(),
  cep: z.string().optional(),
  logradouro: z.string().optional(),
  bairro: z.string().optional(),
  municipio: z.string().optional(),
  uf: z.string().optional(),
  referencia: z.string().optional(),
  bankDetails: z.object({
    bankName: z.string().optional(),
    agency: z.string().optional(),
    account: z.string().optional(),
    pixKey: z.string().optional(),
  }).optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface SupplierFormProps {
  currentItem?: Fornecedor | null;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function SupplierForm({ currentItem, onSuccess, onCancel }: SupplierFormProps) {
  const [loading, setLoading] = React.useState(false);
  const [isCepLoading, setIsCepLoading] = React.useState(false);
  const { toast } = useToast();
  const { firestore } = useFirebase();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: currentItem || {
      name: '',
      cpfCnpj: '',
      entityType: 'Pessoa Jurídica',
      phone: '',
      email: '',
      serviceType: '',
      cep: '',
      logradouro: '',
      bairro: '',
      municipio: '',
      uf: '',
      referencia: '',
      bankDetails: {
        bankName: '',
        agency: '',
        account: '',
        pixKey: '',
      }
    },
  });

  const cepValue = form.watch('cep');

  React.useEffect(() => {
    const fetchAddress = async () => {
      const cep = cepValue?.replace(/\D/g, '');
      if (cep?.length === 8) {
        setIsCepLoading(true);
        try {
          const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
          const data = await response.json();
          if (!data.erro) {
            form.setValue('logradouro', data.logradouro);
            form.setValue('bairro', data.bairro);
            form.setValue('municipio', data.localidade);
            form.setValue('uf', data.uf);
          } else {
            toast({ variant: 'destructive', title: 'CEP não encontrado' });
          }
        } catch (error) {
          toast({ variant: 'destructive', title: 'Erro ao buscar CEP' });
        } finally {
          setIsCepLoading(false);
        }
      }
    };
    fetchAddress();
  }, [cepValue, form, toast]);


  async function onSubmit(values: FormValues) {
    setLoading(true);

    if (!firestore) {
      toast({ variant: 'destructive', title: 'Firebase não inicializado.' });
      setLoading(false);
      return;
    }

    if (currentItem) {
      const docRef = doc(firestore, 'fornecedores', currentItem.id);
      updateDoc(docRef, values)
        .then(() => {
          toast({
            title: 'Fornecedor atualizado!',
            description: 'Os dados foram salvos com sucesso.',
          });
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
      const collectionRef = collection(firestore, 'fornecedores');
      addDoc(collectionRef, values)
        .then(() => {
          toast({
            title: 'Fornecedor criado!',
            description: `O fornecedor ${values.name} foi adicionado com sucesso.`,
          });
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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome / Razão Social</FormLabel>
              <FormControl><Input placeholder="Nome do fornecedor" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="entityType"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel>Tipo de Pessoa</FormLabel>
              <FormControl>
                <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex space-x-4">
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl><RadioGroupItem value="Pessoa Física" /></FormControl>
                    <FormLabel className="font-normal">Pessoa Física</FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl><RadioGroupItem value="Pessoa Jurídica" /></FormControl>
                    <FormLabel className="font-normal">Pessoa Jurídica</FormLabel>
                  </FormItem>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="cpfCnpj"
          render={({ field }) => (
            <FormItem>
              <FormLabel>CPF / CNPJ</FormLabel>
              <FormControl><MaskedInput mask="cpfCnpj" placeholder="00.000.000/0000-00" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField control={form.control} name="phone" render={({ field }) => ( <FormItem><FormLabel>Telefone</FormLabel><FormControl><MaskedInput mask="phone" placeholder="(XX) XXXXX-XXXX" {...field} /></FormControl><FormMessage /></FormItem> )} />
            <FormField control={form.control} name="email" render={({ field }) => ( <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" placeholder="contato@fornecedor.com" {...field} /></FormControl><FormMessage /></FormItem> )} />
        </div>
         <FormField
          control={form.control}
          name="serviceType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo de Serviço Fornecido (Opcional)</FormLabel>
              <FormControl><Input placeholder="Ex: Consultoria, Topografia" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
         <Accordion type="single" collapsible className="w-full">
             <AccordionItem value="address-details">
                <AccordionTrigger>Endereço</AccordionTrigger>
                <AccordionContent className="pt-4 space-y-4">
                    <FormField control={form.control} name="cep" render={({ field }) => ( <FormItem><FormLabel>CEP</FormLabel><FormControl><div className="relative"><Input placeholder="00000-000" {...field} /><div className="absolute inset-y-0 right-0 flex items-center pr-3">{isCepLoading && <Loader2 className="h-4 w-4 animate-spin" />}</div></div></FormControl><FormMessage /></FormItem> )} />
                    <FormField control={form.control} name="logradouro" render={({ field }) => ( <FormItem><FormLabel>Logradouro</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                    <FormField control={form.control} name="bairro" render={({ field }) => ( <FormItem><FormLabel>Bairro</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                    <div className="grid grid-cols-2 gap-4">
                        <FormField control={form.control} name="municipio" render={({ field }) => ( <FormItem><FormLabel>Município</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                        <FormField control={form.control} name="uf" render={({ field }) => ( <FormItem><FormLabel>UF</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                    </div>
                    <FormField control={form.control} name="referencia" render={({ field }) => ( <FormItem><FormLabel>Ponto de Referência (Opcional)</FormLabel><FormControl><Textarea placeholder="Ex: Próximo à praça central" {...field} /></FormControl><FormMessage /></FormItem> )} />
                </AccordionContent>
            </AccordionItem>
            <AccordionItem value="bank-details">
                <AccordionTrigger>Informações Bancárias (Opcional)</AccordionTrigger>
                <AccordionContent className="pt-4 space-y-4">
                    <FormField control={form.control} name="bankDetails.bankName" render={({ field }) => (<FormItem><FormLabel>Nome do Banco</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                    <div className="grid grid-cols-2 gap-4">
                        <FormField control={form.control} name="bankDetails.agency" render={({ field }) => (<FormItem><FormLabel>Agência</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                        <FormField control={form.control} name="bankDetails.account" render={({ field }) => (<FormItem><FormLabel>Conta</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                    </div>
                    <FormField control={form.control} name="bankDetails.pixKey" render={({ field }) => (<FormItem><FormLabel>Chave PIX</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                </AccordionContent>
            </AccordionItem>
        </Accordion>
        
        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>Cancelar</Button>
          <Button type="submit" disabled={loading}>
            {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...</> : 'Salvar'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
