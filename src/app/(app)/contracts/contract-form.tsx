
'use client';

import * as React from 'react';
import { z } from 'zod';
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
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
import { Textarea } from '@/components/ui/textarea';
import { Loader2, PlusCircle, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Contract, Client, EnvironmentalCompany, TechnicalResponsible } from '@/lib/types';
import { useFirebase, errorEmitter, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { FirestorePermissionError } from '@/firebase/errors';
import { collection, doc, addDoc, updateDoc } from 'firebase/firestore';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { numberToWordsBRL } from '@/lib/utils';

const formSchema = z.object({
  contratante: z.object({
    clientId: z.string().min(1, "Selecione um cliente."),
    nome: z.string().min(1, "Nome do contratante é obrigatório."),
    cpfCnpj: z.string().min(1, "CPF/CNPJ do contratante é obrigatório."),
    identidade: z.string().optional(),
    emissor: z.string().optional(),
    nacionalidade: z.string().optional(),
    estadoCivil: z.string().optional(),
    endereco: z.string().optional(),
    numero: z.string().optional(),
    bairro: z.string().optional(),
    cep: z.string().optional(),
    municipio: z.string().optional(),
    uf: z.string().optional(),
  }),
  contratado: z.object({
    name: z.string().min(1, "Razão social é obrigatória"),
    address: z.string().optional(),
    cnpj: z.string().optional(),
  }),
  responsavelTecnico: z.object({
    responsibleId: z.string().min(1, "Selecione um responsável técnico."),
    name: z.string().min(1, "Nome do responsável é obrigatório."),
    profession: z.string().optional(),
    nacionalidade: z.string().optional(),
    estadoCivil: z.string().optional(),
    cpf: z.string().optional(),
    identidade: z.string().optional(),
    emissor: z.string().optional(),
    address: z.string().optional(),
    registrationNumber: z.string().optional(), // Adicionado
    art: z.string().optional(), // Adicionado
  }),
  objeto: z.object({
    empreendimento: z.string().optional(),
    municipio: z.string().optional(),
    uf: z.string().optional(),
    servicos: z.string().min(1, "A descrição dos serviços é obrigatória"),
    itens: z.array(z.object({
        descricao: z.string(),
        valor: z.coerce.number(),
    })).optional(),
  }),
  pagamento: z.object({
    valorTotal: z.coerce.number().positive("O valor total deve ser positivo."),
    valorExtenso: z.string().min(1, "O valor por extenso é obrigatório."),
    forma: z.string().min(1, "A forma de pagamento é obrigatória."),
    banco: z.string().optional(),
    agencia: z.string().optional(),
    conta: z.string().optional(),
    pix: z.string().optional(),
  }),
  foro: z.object({
    comarca: z.string().min(1, "A comarca é obrigatória."),
    uf: z.string().min(2, "UF do foro é obrigatória.").max(2),
  }),
  dataContrato: z.string().transform((str) => new Date(str).toISOString()),
});

type FormValues = z.infer<typeof formSchema>;

interface ContractFormProps {
  currentItem?: Contract | null;
  onSuccess?: () => void;
}

const paymentMethods = [
    "Pix",
    "Deposito Bancário",
    "Boleto bancário",
    "Dinheiro",
    "Cheque",
    "Credito",
    "Debito"
];

const formatCurrencyBRL = (value: number) => {
    if (isNaN(value)) value = 0;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
};

const CurrencyInput = React.forwardRef<HTMLInputElement, Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> & { onChange: (value: number) => void; value: number }>(
    ({ value, onChange, ...props }, ref) => {
        const [displayValue, setDisplayValue] = React.useState(formatCurrencyBRL(value || 0));

        React.useEffect(() => {
            setDisplayValue(formatCurrencyBRL(value || 0));
        }, [value]);

        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const rawValue = e.target.value.replace(/\D/g, '');
            const numericValue = Number(rawValue) / 100;
            onChange(numericValue);
            setDisplayValue(formatCurrencyBRL(numericValue));
        };
        
        const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
            const rawValue = e.target.value.replace(/\D/g, '');
            const numericValue = Number(rawValue) / 100;
            setDisplayValue(formatCurrencyBRL(numericValue));
        };

        return <Input ref={ref} value={displayValue} onChange={handleChange} onBlur={handleBlur} {...props} />;
    }
);
CurrencyInput.displayName = "CurrencyInput";


export function ContractForm({ currentItem, onSuccess }: ContractFormProps) {
  const [loading, setLoading] = React.useState(false);
  const { toast } = useToast();
  const { firestore } = useFirebase();

  const clientsQuery = useMemoFirebase(() => (firestore ? collection(firestore, 'clients') : null), [firestore]);
  const { data: clients, isLoading: isLoadingClients } = useCollection<Client>(clientsQuery);

  const companyProfileDocRef = useMemoFirebase(() => (firestore ? doc(firestore, 'companySettings', 'companyProfile') : null), [firestore]);
  const { data: companyProfile, isLoading: isLoadingCompanyProfile } = useDoc<Omit<EnvironmentalCompany, 'id'>>(companyProfileDocRef);

  const responsiblesQuery = useMemoFirebase(() => (firestore ? collection(firestore, 'technicalResponsibles') : null), [firestore]);
  const { data: responsibles, isLoading: isLoadingResponsibles } = useCollection<TechnicalResponsible>(responsiblesQuery);


  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: currentItem ? {
      ...currentItem,
      dataContrato: new Date(currentItem.dataContrato).toISOString().split('T')[0],
      contratante: { clientId: currentItem.contratante.clientId, ...currentItem.contratante },
      responsavelTecnico: { responsibleId: currentItem.responsavelTecnico.responsibleId, ...currentItem.responsavelTecnico },
      contratado: currentItem.contratado,
    } : {
      contratante: { clientId: '' },
      responsavelTecnico: { responsibleId: '' },
      contratado: companyProfile || {},
      objeto: { servicos: '', itens: [{descricao: '', valor: 0}] },
      pagamento: { valorTotal: 0, valorExtenso: '' , forma: ''},
      foro: { comarca: 'Unaí', uf: 'MG'},
      dataContrato: new Date().toISOString().split('T')[0],
    },
  });
  
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "objeto.itens",
  });
  
  const selectedClientId = form.watch('contratante.clientId');
  const selectedResponsibleId = form.watch('responsavelTecnico.responsibleId');

  const watchedItems = useWatch({
    control: form.control,
    name: 'objeto.itens'
  });

  const totalAmount = React.useMemo(() => {
    return watchedItems?.reduce((acc, item) => acc + (Number(item.valor) || 0), 0) || 0;
  }, [watchedItems]);

  React.useEffect(() => {
    form.setValue('pagamento.valorTotal', totalAmount);
    form.setValue('pagamento.valorExtenso', numberToWordsBRL(totalAmount));
  }, [totalAmount, form]);


  React.useEffect(() => {
    if (selectedClientId && clients) {
        const client = clients.find(c => c.id === selectedClientId);
        if (client) {
            form.setValue('contratante.nome', client.name);
            form.setValue('contratante.cpfCnpj', client.cpfCnpj || '');
            form.setValue('contratante.endereco', client.address || '');
            form.setValue('contratante.numero', client.numero || '');
            form.setValue('contratante.bairro', client.bairro || '');
            form.setValue('contratante.cep', client.cep || '');
            form.setValue('contratante.municipio', client.municipio || '');
            form.setValue('contratante.uf', client.uf || '');
            form.setValue('contratante.identidade', client.identidade || '');
            form.setValue('contratante.emissor', client.emissor || '');
            form.setValue('contratante.nacionalidade', client.nacionalidade || 'Brasileira');
            form.setValue('contratante.estadoCivil', client.estadoCivil || '');
        }
    }
  }, [selectedClientId, clients, form]);
  
  React.useEffect(() => {
    if (companyProfile) {
        form.setValue('contratado.name', companyProfile.name);
        form.setValue('contratado.cnpj', companyProfile.cnpj);
        form.setValue('contratado.address', companyProfile.address || '');
    }
  }, [companyProfile, form]);

  React.useEffect(() => {
    if (selectedResponsibleId && responsibles) {
        const resp = responsibles.find(r => r.id === selectedResponsibleId);
        if (resp) {
            form.setValue('responsavelTecnico.name', resp.name);
            form.setValue('responsavelTecnico.cpf', resp.cpf);
            form.setValue('responsavelTecnico.profession', resp.profession);
            form.setValue('responsavelTecnico.identidade', resp.identidade || '');
            form.setValue('responsavelTecnico.emissor', resp.emissor || '');
            form.setValue('responsavelTecnico.nacionalidade', resp.nacionalidade || '');
            form.setValue('responsavelTecnico.estadoCivil', resp.estadoCivil || '');
            form.setValue('responsavelTecnico.address', resp.address || '');
            form.setValue('responsavelTecnico.registrationNumber', resp.registrationNumber || '');
            form.setValue('responsavelTecnico.art', resp.art || '');
        }
    }
  }, [selectedResponsibleId, responsibles, form]);

  async function onSubmit(values: FormValues) {
    setLoading(true);
    if (!firestore) {
      toast({ variant: 'destructive', title: 'Firebase não inicializado.' });
      setLoading(false);
      return;
    }
    
    const dataToSave = {
        ...values,
    };

    if (currentItem) {
      const docRef = doc(firestore, 'contracts', currentItem.id);
      await updateDoc(docRef, dataToSave);
      toast({ title: 'Contrato atualizado!' });
    } else {
      await addDoc(collection(firestore, 'contracts'), dataToSave);
      toast({ title: 'Contrato criado!' });
    }
    onSuccess?.();
    setLoading(false);
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>{currentItem ? 'Editar Contrato' : 'Novo Contrato de Prestação de Serviço'}</DialogTitle>
        <DialogDescription>
            {currentItem ? 'Atualize os detalhes do contrato abaixo.' : 'Preencha os campos para gerar um novo contrato.'}
        </DialogDescription>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="h-full flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto pr-4 -mr-6">
              <Accordion type="multiple" defaultValue={['item-1', 'item-3']} className="w-full">
                  <AccordionItem value="item-1">
                      <AccordionTrigger>Partes Envolvidas</AccordionTrigger>
                      <AccordionContent className="space-y-6 pt-4">
                          <div className="p-4 border rounded-md space-y-4">
                              <h3 className="font-semibold">Contratante</h3>
                              <FormField control={form.control} name="contratante.clientId" render={({ field }) => (
                                  <FormItem><FormLabel>Selecionar Cliente</FormLabel>
                                  <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoadingClients}>
                                      <FormControl><SelectTrigger><SelectValue placeholder={isLoadingClients ? "Carregando..." : "Selecione um cliente"} /></SelectTrigger></FormControl>
                                      <SelectContent>{clients?.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                                  </Select><FormMessage />
                                  </FormItem>
                              )} />
                              <FormField control={form.control} name="contratante.nome" render={({ field }) => (<FormItem><FormLabel>Nome</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                              <FormField control={form.control} name="contratante.cpfCnpj" render={({ field }) => (<FormItem><FormLabel>CPF/CNPJ</FormLabel><FormControl><MaskedInput mask="cpfCnpj" {...field} /></FormControl><FormMessage /></FormItem>)} />
                          </div>
                          <div className="p-4 border rounded-md space-y-4">
                              <h3 className="font-semibold">Contratado (Sua Empresa)</h3>
                              <FormField control={form.control} name="contratado.name" render={({ field }) => (<FormItem><FormLabel>Razão Social</FormLabel><FormControl><Input {...field} disabled /></FormControl><FormMessage /></FormItem>)} />
                          </div>
                          <div className="p-4 border rounded-md space-y-4">
                              <h3 className="font-semibold">Responsável Técnico</h3>
                              <FormField control={form.control} name="responsavelTecnico.responsibleId" render={({ field }) => (
                                  <FormItem><FormLabel>Selecionar Responsável Técnico</FormLabel>
                                  <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoadingResponsibles}>
                                      <FormControl><SelectTrigger><SelectValue placeholder={isLoadingResponsibles ? "Carregando..." : "Selecione o responsável"} /></SelectTrigger></FormControl>
                                      <SelectContent>{responsibles?.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                                  </Select><FormMessage />
                                  </FormItem>
                              )} />
                              <FormField control={form.control} name="responsavelTecnico.name" render={({ field }) => (<FormItem><FormLabel>Nome</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                          </div>
                      </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="item-2">
                      <AccordionTrigger>Objeto e Valor</AccordionTrigger>
                      <AccordionContent className="space-y-4 pt-4">
                          <FormField control={form.control} name="objeto.empreendimento" render={({ field }) => (<FormItem><FormLabel>Empreendimento</FormLabel><FormControl><Input placeholder="Nome do empreendimento/propriedade" {...field} /></FormControl></FormItem>)} />
                          <FormField control={form.control} name="objeto.servicos" render={({ field }) => (<FormItem><FormLabel>Descrição Geral dos Serviços</FormLabel><FormControl><Textarea className="min-h-32" {...field} /></FormControl></FormItem>)} />
                          
                          <div className="p-4 border rounded-md space-y-4">
                              <div className="flex justify-between items-center"><h3 className="font-semibold">Itens de Serviço e Valores</h3><Button size="sm" type="button" onClick={() => append({ descricao: '', valor: 0 })}><PlusCircle className="mr-2 h-4 w-4" /> Add</Button></div>
                              {fields.map((item, index) => (
                                  <div key={item.id} className="flex items-end gap-2">
                                      <FormField control={form.control} name={`objeto.itens.${index}.descricao`} render={({ field }) => (<FormItem className="flex-1"><FormLabel>Descrição</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                                      <FormField
                                        control={form.control}
                                        name={`objeto.itens.${index}.valor`}
                                        render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Valor (R$)</FormLabel>
                                            <FormControl>
                                            <CurrencyInput
                                                placeholder="R$ 0,00"
                                                value={field.value}
                                                onChange={field.onChange}
                                            />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                        )}
                                      />
                                      <Button type="button" variant="destructive" size="icon" onClick={() => remove(index)}><Trash2 className="h-4 w-4" /></Button>
                                  </div>
                              ))}
                          </div>
                      </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="item-3">
                      <AccordionTrigger>Pagamento e Condições</AccordionTrigger>
                      <AccordionContent className="space-y-4 pt-4">
                          <div className="p-4 border rounded-md space-y-4">
                              <h3 className="font-semibold">Condições de Pagamento</h3>
                              <FormField control={form.control} name="pagamento.valorTotal" render={({ field }) => (<FormItem><FormLabel>Valor Total (R$)</FormLabel><FormControl><Input type="number" {...field} readOnly /></FormControl></FormItem>)} />
                              <FormField control={form.control} name="pagamento.valorExtenso" render={({ field }) => (<FormItem><FormLabel>Valor por Extenso</FormLabel><FormControl><Input {...field} readOnly /></FormControl></FormItem>)} />
                              <FormField
                                control={form.control}
                                name="pagamento.forma"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Forma de Pagamento</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione a forma de pagamento" />
                                        </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                        {paymentMethods.map(method => (
                                            <SelectItem key={method} value={method}>{method}</SelectItem>
                                        ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                    </FormItem>
                                )}
                                />
                          </div>
                          <div className="p-4 border rounded-md space-y-4">
                              <h3 className="font-semibold">Dados Bancários para Pagamento</h3>
                              <FormField control={form.control} name="pagamento.banco" render={({ field }) => (<FormItem><FormLabel>Banco</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                              <FormField control={form.control} name="pagamento.agencia" render={({ field }) => (<FormItem><FormLabel>Agência</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                              <FormField control={form.control} name="pagamento.conta" render={({ field }) => (<FormItem><FormLabel>Conta Corrente</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                              <FormField control={form.control} name="pagamento.pix" render={({ field }) => (<FormItem><FormLabel>PIX</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                          </div>
                      </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="item-4">
                      <AccordionTrigger>Foro e Data</AccordionTrigger>
                      <AccordionContent className="space-y-4 pt-4">
                          <div className="grid grid-cols-2 gap-4">
                              <FormField control={form.control} name="foro.comarca" render={({ field }) => (<FormItem><FormLabel>Comarca do Foro</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                              <FormField control={form.control} name="foro.uf" render={({ field }) => (<FormItem><FormLabel>UF do Foro</FormLabel><FormControl><Input maxLength={2} {...field} /></FormControl></FormItem>)} />
                          </div>
                          <FormField control={form.control} name="dataContrato" render={({ field }) => (<FormItem><FormLabel>Data de Assinatura do Contrato</FormLabel><FormControl><Input type="date" {...field} /></FormControl></FormItem>)} />
                      </AccordionContent>
                  </AccordionItem>
              </Accordion>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onSuccess}>Cancelar</Button>
            <Button type="submit" disabled={loading}>
              {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...</> : 'Salvar Contrato'}
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </>
  );
}
