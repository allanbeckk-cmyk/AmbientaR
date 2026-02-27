
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
import { Loader2, CalendarIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Client } from '@/lib/types';
import { useFirebase, errorEmitter } from '@/firebase';
import { FirestorePermissionError } from '@/firebase/errors';
import { collection, doc, addDoc, updateDoc } from 'firebase/firestore';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { logUserAction } from '@/lib/audit-log';
import { ibgeData } from '@/lib/ibge-data';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const formSchema = z.object({
  name: z.string().min(2, 'O nome é obrigatório.'),
  cpfCnpj: z.string().min(11, 'O CPF/CNPJ é obrigatório.'),
  entityType: z.enum(['Pessoa Física', 'Pessoa Jurídica', 'Produtor Rural'], {
    required_error: 'Selecione o tipo de pessoa.',
  }),
  phone: z.string().min(8, 'O telefone é obrigatório.'),
  email: z.string().email('Por favor, insira um e-mail válido.'),
  
  identidade: z.string().optional(),
  emissor: z.string().optional(),
  nacionalidade: z.string().optional(),
  estadoCivil: z.string().optional(),
  dataNascimento: z.date().optional(),
  ctfIbama: z.string().optional(),

  address: z.string().optional(),
  numero: z.string().optional(),
  bairro: z.string().optional(),
  municipio: z.string().optional(),
  uf: z.string().optional(),
  cep: z.string().optional(),
});

type ClientFormValues = z.infer<typeof formSchema>;

interface ClientFormProps {
  currentClient?: Client | null;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ClientForm({ currentClient, onSuccess, onCancel }: ClientFormProps) {
  const [loading, setLoading] = React.useState(false);
  const { toast } = useToast();
  const { firestore, auth } = useFirebase();

  const form = useForm<ClientFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: currentClient?.name || '',
      cpfCnpj: currentClient?.cpfCnpj || '',
      entityType: currentClient?.entityType || undefined,
      phone: currentClient?.phone || '',
      email: currentClient?.email || '',
      identidade: currentClient?.identidade || '',
      emissor: currentClient?.emissor || '',
      nacionalidade: currentClient?.nacionalidade || 'Brasileira',
      estadoCivil: currentClient?.estadoCivil || '',
      dataNascimento: currentClient?.dataNascimento ? new Date(currentClient.dataNascimento) : undefined,
      ctfIbama: currentClient?.ctfIbama || '',
      address: currentClient?.address || '',
      numero: currentClient?.numero || '',
      bairro: currentClient?.bairro || '',
      municipio: currentClient?.municipio || '',
      uf: currentClient?.uf || '',
      cep: currentClient?.cep || '',
    },
  });
  
  const selectedUf = form.watch('uf');

  const citiesForSelectedUf = React.useMemo(() => {
    return ibgeData.statesWithCities.find(state => state.sigla === selectedUf)?.cidades || [];
  }, [selectedUf]);


  const handleCpfCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, ''); 
    
    if (value.length <= 11) {
      value = value.replace(/(\d{3})(\d)/, '$1.$2');
      value = value.replace(/(\d{3})(\d)/, '$1.$2');
      value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    } else { 
      value = value.replace(/^(\d{2})(\d)/, '$1.$2');
      value = value.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3');
      value = value.replace(/\.(\d{3})(\d)/, '.$1/$2');
      value = value.replace(/(\d{4})(\d)/, '$1-$2');
    }
    
    form.setValue('cpfCnpj', value);
  };
  
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 11) value = value.substring(0, 11);
    
    if (value.length > 10) {
      value = value.replace(/^(\d\d)(\d{5})(\d{4}).*/,"($1) $2-$3");
    } else if (value.length > 5) {
      value = value.replace(/^(\d\d)(\d{4})(\d{0,4}).*/,"($1) $2-$3");
    } else if (value.length > 2) {
      value = value.replace(/^(\d\d)(\d{0,5}).*/,"($1) $2");
    } else {
      value = value.replace(/^(\d*)/, "($1");
    }
    
    form.setValue('phone', value);
  };

  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 8) value = value.substring(0, 8);
    value = value.replace(/(\d{5})(\d)/, '$1-$2');
    form.setValue('cep', value);
  };


  async function onSubmit(values: ClientFormValues) {
    setLoading(true);

    if (!firestore || !auth) {
      toast({ variant: 'destructive', title: 'Firebase não inicializado.' });
      setLoading(false);
      return;
    }

    const dataToSave: Partial<Client> = {
        ...values,
        dataNascimento: values.dataNascimento?.toISOString(),
    };


    if (currentClient) {
      const clientRef = doc(firestore, 'clients', currentClient.id);
      updateDoc(clientRef, dataToSave)
        .then(() => {
          toast({
            title: 'Cliente atualizado!',
            description: 'As informações do cliente foram salvas com sucesso.',
          });
          logUserAction(firestore, auth, 'update_client', { clientId: currentClient.id, clientName: values.name });
          onSuccess?.();
        })
        .catch(async (serverError) => {
          const permissionError = new FirestorePermissionError({
            path: clientRef.path,
            operation: 'update',
            requestResourceData: dataToSave,
          });
          errorEmitter.emit('permission-error', permissionError);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      const clientsCollectionRef = collection(firestore, 'clients');
      addDoc(clientsCollectionRef, dataToSave)
        .then((docRef) => {
          toast({
            title: 'Cliente criado!',
            description: `O cliente ${values.name} foi adicionado com sucesso.`,
          });
          logUserAction(firestore, auth, 'create_client', { clientId: docRef.id, clientName: values.name });
          form.reset();
          onSuccess?.();
        })
        .catch(async (serverError) => {
          const permissionError = new FirestorePermissionError({
            path: clientsCollectionRef.path,
            operation: 'create',
            requestResourceData: dataToSave,
          });
          errorEmitter.emit('permission-error', permissionError);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="space-y-4">
            <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Nome / Razão Social</FormLabel>
                <FormControl>
                    <Input placeholder="Nome do cliente ou empresa" {...field} />
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
                <FormControl>
                    <MaskedInput mask="cpfCnpj" placeholder="000.000.000-00 ou 00.000.000/0000-00" {...field} />
                </FormControl>
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
                    <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="flex flex-col space-y-1 md:flex-row md:space-y-0 md:space-x-4"
                    >
                    <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                        <RadioGroupItem value="Pessoa Física" />
                        </FormControl>
                        <FormLabel className="font-normal">Pessoa Física</FormLabel>
                    </FormItem>
                    <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                        <RadioGroupItem value="Pessoa Jurídica" />
                        </FormControl>
                        <FormLabel className="font-normal">Pessoa Jurídica</FormLabel>
                    </FormItem>
                    <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                        <RadioGroupItem value="Produtor Rural" />
                        </FormControl>
                        <FormLabel className="font-normal">Produtor Rural (PR)</FormLabel>
                    </FormItem>
                    </RadioGroup>
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>
        
        <div className="space-y-4 rounded-md border p-4">
             <h3 className="text-lg font-medium">Documentação</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <FormField control={form.control} name="identidade" render={({ field }) => ( <FormItem><FormLabel>Identidade (RG)</FormLabel><FormControl><Input placeholder="Número do documento" {...field} /></FormControl><FormMessage /></FormItem> )} />
                 <FormField control={form.control} name="emissor" render={({ field }) => ( <FormItem><FormLabel>Órgão Emissor</FormLabel><FormControl><Input placeholder="Ex: SSP/MG" {...field} /></FormControl><FormMessage /></FormItem> )} />
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="nacionalidade" render={({ field }) => ( <FormItem><FormLabel>Nacionalidade</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                <FormField control={form.control} name="estadoCivil" render={({ field }) => ( <FormItem><FormLabel>Estado Civil</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger></FormControl>
                        <SelectContent>
                            <SelectItem value="Solteiro(a)">Solteiro(a)</SelectItem>
                            <SelectItem value="Casado(a)">Casado(a)</SelectItem>
                            <SelectItem value="Divorciado(a)">Divorciado(a)</SelectItem>
                            <SelectItem value="Viúvo(a)">Viúvo(a)</SelectItem>
                            <SelectItem value="União Estável">União Estável</SelectItem>
                        </SelectContent>
                    </Select>
                <FormMessage /></FormItem> )} />
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="dataNascimento" render={({ field }) => ( <FormItem className="flex flex-col"><FormLabel>Data de Nascimento</FormLabel><Popover><PopoverTrigger asChild><FormControl>
                    <Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                        {field.value ? format(field.value, "PPP", { locale: ptBR }) : <span>Escolha uma data</span>}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                </FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent></Popover><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="ctfIbama" render={({ field }) => ( <FormItem><FormLabel>CTF/IBAMA</FormLabel><FormControl><Input placeholder="Número de registro" {...field} /></FormControl><FormMessage /></FormItem> )} />
             </div>
        </div>

        <div className="space-y-4 rounded-md border p-4">
            <h3 className="text-lg font-medium">Contato e Endereço</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                 <FormField control={form.control} name="address" render={({ field }) => ( <FormItem className="col-span-3"><FormLabel>Endereço</FormLabel><FormControl><Input placeholder="Rua, Avenida, etc." {...field} /></FormControl><FormMessage /></FormItem> )} />
                  <FormField control={form.control} name="numero" render={({ field }) => ( <FormItem><FormLabel>Nº</FormLabel><FormControl><Input placeholder="123" {...field} /></FormControl><FormMessage /></FormItem> )} />
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="bairro" render={({ field }) => ( <FormItem><FormLabel>Bairro/Distrito</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                <FormField control={form.control} name="cep" render={({ field }) => ( <FormItem><FormLabel>CEP</FormLabel><FormControl><Input placeholder="00000-000" {...field} onChange={handleCepChange} maxLength={9} /></FormControl><FormMessage /></FormItem> )} />
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="uf"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>UF</FormLabel>
                      <Select onValueChange={(value) => { field.onChange(value); form.setValue('municipio', ''); }} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um estado" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {ibgeData.statesWithCities.map((state) => (
                            <SelectItem key={state.sigla} value={state.sigla}>
                              {state.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="municipio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Município</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ''} disabled={!selectedUf}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={!selectedUf ? "Selecione um estado primeiro" : "Selecione um município"} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {citiesForSelectedUf.map(city => (
                            <SelectItem key={city} value={city}>{city}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="phone" render={({ field }) => ( <FormItem><FormLabel>Telefone (com DDD)</FormLabel><FormControl><MaskedInput mask="phone" placeholder="(XX) XXXXX-XXXX" {...field} /></FormControl><FormMessage /></FormItem> )} />
                <FormField control={form.control} name="email" render={({ field }) => ( <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" placeholder="email@exemplo.com" {...field} /></FormControl><FormMessage /></FormItem> )} />
            </div>
        </div>
        
        <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
                Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
                {loading ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                </>
                ) : (
                'Salvar'
                )}
            </Button>
        </div>
      </form>
    </Form>
  );
}
    