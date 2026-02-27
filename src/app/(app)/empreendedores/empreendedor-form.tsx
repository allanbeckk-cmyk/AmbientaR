
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
import type { Empreendedor } from '@/lib/types';
import { useFirebase, errorEmitter } from '@/firebase';
import { FirestorePermissionError } from '@/firebase/errors';
import { collection, doc, addDoc, updateDoc } from 'firebase/firestore';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ibgeData } from '@/lib/ibge-data';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const entityTypes = [
  { id: 'Pessoa Física', label: 'Pessoa Física' },
  { id: 'Pessoa Jurídica', label: 'Pessoa Jurídica' },
  { id: 'Produtor Rural', label: 'Produtor Rural' },
] as const;

const formSchema = z.object({
  name: z.string().min(2, 'O nome é obrigatório.'),
  cpfCnpj: z.string().min(11, 'O CPF/CNPJ é obrigatório.'),
  entityType: z.array(z.string()).refine((value) => value.some((item) => item), {
    message: "Você deve selecionar ao menos um tipo.",
  }),
  phone: z.string().min(8, 'O telefone é obrigatório.'),
  email: z.string().email('Por favor, insira um e-mail válido.'),
  
  dataNascimento: z.date().optional(),
  ctfIbama: z.string().optional(),

  address: z.string().optional(),
  numero: z.string().optional(),
  bairro: z.string().optional(),
  complemento: z.string().optional(),
  municipio: z.string().optional(),
  uf: z.string().optional(),
  cep: z.string().optional(),
});

type EmpreendedorFormValues = z.infer<typeof formSchema>;

interface EmpreendedorFormProps {
  currentItem?: Empreendedor | null;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function EmpreendedorForm({ currentItem, onSuccess, onCancel }: EmpreendedorFormProps) {
  const [loading, setLoading] = React.useState(false);
  const { toast } = useToast();
  const { firestore } = useFirebase();

  const form = useForm<EmpreendedorFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: currentItem?.name || '',
      cpfCnpj: currentItem?.cpfCnpj || '',
      entityType: currentItem?.entityType || [],
      phone: currentItem?.phone || '',
      email: currentItem?.email || '',
      dataNascimento: currentItem?.dataNascimento ? new Date(currentItem.dataNascimento) : undefined,
      ctfIbama: currentItem?.ctfIbama || '',
      address: currentItem?.address || '',
      numero: currentItem?.numero || '',
      bairro: currentItem?.bairro || '',
      complemento: '', // Não existe no tipo, é apenas UI
      municipio: currentItem?.municipio || '',
      uf: currentItem?.uf || '',
      cep: currentItem?.cep || '',
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


  async function onSubmit(values: EmpreendedorFormValues) {
    setLoading(true);

    if (!firestore) {
      toast({ variant: 'destructive', title: 'Firebase não inicializado.' });
      setLoading(false);
      return;
    }

    const dataToSave = {
        ...values,
        dataNascimento: values.dataNascimento?.toISOString(),
    }

    if (currentItem) {
      const empreendedorRef = doc(firestore, 'empreendedores', currentItem.id);
      updateDoc(empreendedorRef, dataToSave)
        .then(() => {
          toast({
            title: 'Empreendedor atualizado!',
            description: 'As informações do empreendedor foram salvas com sucesso.',
          });
          onSuccess?.();
        })
        .catch(async (serverError) => {
          const permissionError = new FirestorePermissionError({
            path: empreendedorRef.path,
            operation: 'update',
            requestResourceData: dataToSave,
          });
          errorEmitter.emit('permission-error', permissionError);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      const empreendedoresCollectionRef = collection(firestore, 'empreendedores');
      addDoc(empreendedoresCollectionRef, dataToSave)
        .then(() => {
          toast({
            title: 'Empreendedor criado!',
            description: `O empreendedor ${values.name} foi adicionado com sucesso.`,
          });
          form.reset();
          onSuccess?.();
        })
        .catch(async (serverError) => {
          const permissionError = new FirestorePermissionError({
            path: empreendedoresCollectionRef.path,
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
      <form onSubmit={form.handleSubmit(onSubmit)} className="h-full flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto pr-4 -mr-4 space-y-4 py-4">
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
                  render={() => (
                    <FormItem>
                      <FormLabel>Tipo de Pessoa</FormLabel>
                      <div className="flex flex-col space-y-2 md:flex-row md:space-y-0 md:space-x-4">
                        {entityTypes.map((item) => (
                          <FormField
                            key={item.id}
                            control={form.control}
                            name="entityType"
                            render={({ field }) => {
                              return (
                                <FormItem
                                  key={item.id}
                                  className="flex flex-row items-start space-x-3 space-y-0"
                                >
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(item.id)}
                                      onCheckedChange={(checked) => {
                                        let newValues = field.value ? [...field.value] : [];
                                        if (checked) {
                                          if(item.id === 'Pessoa Física' && newValues.includes('Pessoa Jurídica')) {
                                              newValues = newValues.filter(v => v !== 'Pessoa Jurídica');
                                          }
                                          if(item.id === 'Pessoa Jurídica' && newValues.includes('Pessoa Física')) {
                                              newValues = newValues.filter(v => v !== 'Pessoa Física');
                                          }
                                          newValues.push(item.id);
                                        } else {
                                          newValues = newValues.filter(
                                            (value) => value !== item.id
                                          )
                                        }
                                        field.onChange(newValues);
                                      }}
                                    />
                                  </FormControl>
                                  <FormLabel className="font-normal">
                                    {item.label}
                                  </FormLabel>
                                </FormItem>
                              )
                            }}
                          />
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
            </div>

            <div className="space-y-4 rounded-md border p-4">
                <h3 className="text-lg font-medium">Documentação Adicional</h3>
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
                    <FormField control={form.control} name="bairro" render={({ field }) => ( <FormItem><FormLabel>Bairro</FormLabel><FormControl><Input placeholder="Centro" {...field} /></FormControl><FormMessage /></FormItem> )} />
                    <FormField control={form.control} name="complemento" render={({ field }) => ( <FormItem><FormLabel>Complemento</FormLabel><FormControl><Input placeholder="Apto 101, Bloco B" {...field} /></FormControl><FormMessage /></FormItem> )} />
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                    <FormField control={form.control} name="cep" render={({ field }) => ( <FormItem><FormLabel>CEP</FormLabel><FormControl><Input placeholder="00000-000" {...field} onChange={handleCepChange} maxLength={9} /></FormControl><FormMessage /></FormItem> )} />
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="phone" render={({ field }) => ( <FormItem><FormLabel>Telefone (com DDD)</FormLabel><FormControl><MaskedInput mask="phone" placeholder="(XX) XXXXX-XXXX" {...field} /></FormControl><FormMessage /></FormItem> )} />
                    <FormField control={form.control} name="email" render={({ field }) => ( <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" placeholder="email@exemplo.com" {...field} /></FormControl><FormMessage /></FormItem> )} />
                </div>
            </div>
        </div>

        <div className="flex justify-end space-x-2 pt-4 mt-auto border-t">
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
