
'use client';

import * as React from 'react';
import { z } from 'zod';
import { useForm, useFieldArray } from 'react-hook-form';
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
import { Loader2, PlusCircle, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useFirebase, errorEmitter, useCollection, useMemoFirebase } from '@/firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { FirestorePermissionError } from '@/firebase/errors';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Empreendedor, EnvironmentalCompany, Project, TechnicalResponsible, TransporteResiduosPerigosos } from '@/lib/types';
import { Textarea } from '@/components/ui/textarea';

const formSchema = z.object({
    empreendedor: z.object({
        id: z.string().optional(),
        nome: z.string().min(1, "O nome do empreendedor é obrigatório."),
        cnpjCpf: z.string().min(1, "O CPF/CNPJ é obrigatório."),
        endereco: z.string().optional(),
        telefone: z.string().optional(),
        email: z.string().optional(),
    }),
    empreendimento: z.object({
        id: z.string().optional(),
        nome: z.string().min(1, "O nome do empreendimento é obrigatório."),
        endereco: z.string().optional(),
        municipioUf: z.string().optional(),
    }),
    empresaResponsavel: z.object({
        id: z.string().optional(),
        razaoSocial: z.string().optional(),
        endereco: z.string().optional(),
        cnpjCpf: z.string().optional(),
        telefone: z.string().optional(),
        email: z.string().email("Email inválido").optional().or(z.literal('')),
        ctfAida: z.string().optional(),
    }).optional(),
    responsavelTecnico: z.object({
        id: z.string().min(1, "Selecione um responsável técnico."),
        nome: z.string().optional(),
        formacao: z.string().optional(),
        registroClasse: z.string().optional(),
        art: z.string().optional(),
        ctfAidaIbama: z.string().optional(),
    }),
    veiculosTransporte: z.array(z.object({
        tipo: z.string().min(1, "Obrigatório"),
        placa: z.string().min(7, "Placa inválida"),
        anoFabricacao: z.string().min(4, "Ano inválido"),
        acondicionamento: z.enum(['Granel', 'Fracionado']),
        civNumero: z.string().optional(),
        civValidade: z.string().optional(),
    })).optional(),
    equipamentosGranel: z.array(z.object({
        tipoCarroceria: z.string().optional(),
        placaFabricacao: z.string().optional(),
        anoFabricacao: z.string().optional(),
        cippNumero: z.string().optional(),
        cippValidade: z.string().optional(),
    })).optional(),
    classificacaoProdutos: z.array(z.object({
        nomeTecnico: z.string().optional(),
        nomeComercial: z.string().optional(),
        numeroOnu: z.string().optional(),
        classeRisco: z.string().optional(),
        acondicionamento: z.string().optional(),
    })).optional(),
    classificacaoResiduos: z.array(z.object({
        nomeTecnico: z.string().optional(),
        nomeComercial: z.string().optional(),
        numeroOnu: z.string().optional(),
        classeRisco: z.string().optional(),
        acondicionamento: z.string().optional(),
    })).optional(),
    origemDestinoProdutos: z.array(z.object({
        produto: z.string().optional(),
        produtorNome: z.string().optional(),
        produtorEndereco: z.string().optional(),
        consumidorNome: z.string().optional(),
        consumidorEndereco: z.string().optional(),
        viasPreferenciais: z.string().optional(),
    })).optional(),
    origemDestinoResiduos: z.array(z.object({
        residuo: z.string().optional(),
        geradorNome: z.string().optional(),
        geradorEndereco: z.string().optional(),
        destinadorNome: z.string().optional(),
        destinadorEndereco: z.string().optional(),
        viasPreferenciais: z.string().optional(),
    })).optional(),
    anexoART: z.string().optional(),
});


type FormValues = z.infer<typeof formSchema>;

interface TransporteResiduosFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export function TransporteResiduosForm({ onSuccess, onCancel }: TransporteResiduosFormProps) {
  const [loading, setLoading] = React.useState(false);
  const { toast } = useToast();
  const { firestore } = useFirebase();

  const empreendedoresQuery = useMemoFirebase(() => firestore ? collection(firestore, 'empreendedores') : null, [firestore]);
  const { data: empreendedores, isLoading: isLoadingEmpreendedores } = useCollection<Empreendedor>(empreendedoresQuery);

  const projectsQuery = useMemoFirebase(() => firestore ? collection(firestore, 'projects') : null, [firestore]);
  const { data: allProjects, isLoading: isLoadingProjects } = useCollection<Project>(projectsQuery);
  
  const empresasQuery = useMemoFirebase(() => firestore ? collection(firestore, 'environmentalCompanies') : null, [firestore]);
  const { data: empresas, isLoading: isLoadingEmpresas } = useCollection<EnvironmentalCompany>(empresasQuery);
  
  const responsaveisQuery = useMemoFirebase(() => firestore ? collection(firestore, 'technicalResponsibles') : null, [firestore]);
  const { data: responsaveis, isLoading: isLoadingResponsaveis } = useCollection<TechnicalResponsible>(responsaveisQuery);


  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
        empreendedor: {id: '', nome: '', cnpjCpf: ''},
        empreendimento: {id: '', nome: ''},
        empresaResponsavel: {id: '', razaoSocial: '', endereco: '', cnpjCpf: '', telefone: '', email: '', ctfAida: ''},
        responsavelTecnico: {id: '', nome: '', formacao: '', registroClasse: '', art: '', ctfAidaIbama: ''},
        veiculosTransporte: [],
        equipamentosGranel: [],
        classificacaoProdutos: [],
        classificacaoResiduos: [],
        origemDestinoProdutos: [],
        origemDestinoResiduos: [],
    },
  });

  const { fields: veiculosFields, append: appendVeiculo, remove: removeVeiculo } = useFieldArray({ control: form.control, name: "veiculosTransporte" });
  const { fields: equipamentosFields, append: appendEquipamento, remove: removeEquipamento } = useFieldArray({ control: form.control, name: "equipamentosGranel" });
  const { fields: produtosFields, append: appendProduto, remove: removeProduto } = useFieldArray({ control: form.control, name: "classificacaoProdutos" });
  const { fields: residuosFields, append: appendResiduo, remove: removeResiduo } = useFieldArray({ control: form.control, name: "classificacaoResiduos" });
  const { fields: origemProdutosFields, append: appendOrigemProduto, remove: removeOrigemProduto } = useFieldArray({ control: form.control, name: "origemDestinoProdutos" });
  const { fields: origemResiduosFields, append: appendOrigemResiduo, remove: removeOrigemResiduo } = useFieldArray({ control: form.control, name: "origemDestinoResiduos" });


  const selectedEmpreendedorId = form.watch('empreendedor.id');
  const selectedEmpresaId = form.watch('empresaResponsavel.id');
  const selectedResponsavelId = form.watch('responsavelTecnico.id');
  const selectedEmpreendimentoId = form.watch('empreendimento.id');
  
  const filteredProjects = React.useMemo(() => {
    if (!selectedEmpreendedorId || !allProjects) return [];
    return allProjects.filter(p => p.empreendedorId === selectedEmpreendedorId);
  }, [selectedEmpreendedorId, allProjects]);

  React.useEffect(() => {
    const empreendedor = empreendedores?.find(e => e.id === selectedEmpreendedorId);
    if(empreendedor) {
        form.setValue('empreendedor.nome', empreendedor.name);
        form.setValue('empreendedor.cnpjCpf', empreendedor.cpfCnpj || '');
        form.setValue('empreendedor.endereco', empreendedor.address || '');
        form.setValue('empreendedor.telefone', empreendedor.phone || '');
        form.setValue('empreendedor.email', empreendedor.email || '');
    }
  }, [selectedEmpreendedorId, empreendedores, form]);
  
  React.useEffect(() => {
    const project = allProjects?.find(p => p.id === selectedEmpreendimentoId);
    if(project) {
        form.setValue('empreendimento.nome', project.propertyName);
        form.setValue('empreendimento.endereco', project.address || '');
        form.setValue('empreendimento.municipioUf', `${project.municipio || ''}/${project.uf || ''}`);
    }
  }, [selectedEmpreendimentoId, allProjects, form]);

  React.useEffect(() => {
    const empresa = empresas?.find(e => e.id === selectedEmpresaId);
    if(empresa) {
        form.setValue('empresaResponsavel.razaoSocial', empresa.name);
        form.setValue('empresaResponsavel.cnpjCpf', empresa.cnpj);
        form.setValue('empresaResponsavel.endereco', empresa.address);
        form.setValue('empresaResponsavel.telefone', empresa.phone);
        form.setValue('empresaResponsavel.email', empresa.email);
    }
  }, [selectedEmpresaId, empresas, form]);

  React.useEffect(() => {
    const responsavel = responsaveis?.find(r => r.id === selectedResponsavelId);
    if(responsavel) {
        form.setValue('responsavelTecnico.nome', responsavel.name);
        form.setValue('responsavelTecnico.formacao', responsavel.profession);
        form.setValue('responsavelTecnico.registroClasse', responsavel.registrationNumber);
        form.setValue('responsavelTecnico.art', responsavel.art);
    }
  }, [selectedResponsavelId, responsaveis, form]);

  async function onSubmit(values: FormValues) {
    setLoading(true);

    if (!firestore) {
      toast({ variant: 'destructive', title: 'Firebase não inicializado.' });
      setLoading(false);
      return;
    }
    
    const dataToSave = { ...values, createdAt: serverTimestamp() };

    try {
        await addDoc(collection(firestore, 'transporteResiduosReports'), dataToSave);
        toast({ title: 'Relatório Salvo!', description: 'O relatório de transporte foi salvo com sucesso.' });
        onSuccess();
    } catch(error) {
        console.error("Error saving report: ", error);
        const permissionError = new FirestorePermissionError({
            path: 'transporteResiduosReports',
            operation: 'create',
            requestResourceData: dataToSave,
        });
        errorEmitter.emit('permission-error', permissionError);
    } finally {
        setLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        
        <h2 className="text-xl font-bold">2. IDENTIFICAÇÃO</h2>
        <Card>
            <CardHeader><CardTitle>2.1. Identificação do Empreendedor</CardTitle></CardHeader>
            <CardContent className="space-y-4">
                <FormField control={form.control} name="empreendedor.id" render={({ field }) => (
                    <FormItem><FormLabel>Selecionar Empreendedor Cadastrado (Opcional)</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoadingEmpreendedores}>
                            <FormControl><SelectTrigger><SelectValue placeholder={isLoadingEmpreendedores ? "Carregando..." : "Selecione para preencher automaticamente"} /></SelectTrigger></FormControl>
                            <SelectContent>{empreendedores?.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}</SelectContent>
                        </Select>
                    </FormItem>
                )} />
                <FormField control={form.control} name="empreendedor.nome" render={({ field }) => ( <FormItem><FormLabel>Nome</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                <FormField control={form.control} name="empreendedor.cnpjCpf" render={({ field }) => (<FormItem><FormLabel>CNPJ/CPF</FormLabel><FormControl><MaskedInput mask="cpfCnpj" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="empreendedor.endereco" render={({ field }) => (<FormItem><FormLabel>Endereço</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="empreendedor.telefone" render={({ field }) => (<FormItem><FormLabel>Telefone</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="empreendedor.email" render={({ field }) => (<FormItem><FormLabel>E-mail</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>)} />
            </CardContent>
        </Card>
        
        <Card>
            <CardHeader><CardTitle>2.2. Identificação do Empreendimento</CardTitle></CardHeader>
            <CardContent className="space-y-4">
                 <FormField control={form.control} name="empreendimento.id" render={({ field }) => (
                    <FormItem><FormLabel>Selecionar Empreendimento Cadastrado (Opcional)</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!selectedEmpreendedorId || isLoadingProjects}>
                            <FormControl><SelectTrigger><SelectValue placeholder={!selectedEmpreendedorId ? "Selecione um empreendedor primeiro" : "Selecione o empreendimento"} /></SelectTrigger></FormControl>
                            <SelectContent>{filteredProjects.map(p => <SelectItem key={p.id} value={p.id}>{p.propertyName}</SelectItem>)}</SelectContent>
                        </Select><FormMessage />
                    </FormItem>
                )} />
                 <FormField control={form.control} name="empreendimento.nome" render={({ field }) => ( <FormItem><FormLabel>Nome do Empreendimento</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                 <FormField control={form.control} name="empreendimento.endereco" render={({ field }) => ( <FormItem><FormLabel>Endereço</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                 <FormField control={form.control} name="empreendimento.municipioUf" render={({ field }) => ( <FormItem><FormLabel>Município/UF</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
            </CardContent>
        </Card>

         <Card>
            <CardHeader><CardTitle>2.3. Identificação da Empresa Responsável pela Elaboração (se for o caso)</CardTitle></CardHeader>
            <CardContent className="space-y-4">
                 <FormField control={form.control} name="empresaResponsavel.id" render={({ field }) => (
                    <FormItem><FormLabel>Buscar Empresa Cadastrada</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoadingEmpresas}>
                            <FormControl><SelectTrigger><SelectValue placeholder={isLoadingEmpresas ? "Carregando..." : "Selecione a empresa"} /></SelectTrigger></FormControl>
                            <SelectContent>{empresas?.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}</SelectContent>
                        </Select><FormMessage />
                    </FormItem>
                )} />
                 <FormField control={form.control} name="empresaResponsavel.razaoSocial" render={({ field }) => ( <FormItem><FormLabel>Razão Social</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                 <FormField control={form.control} name="empresaResponsavel.endereco" render={({ field }) => ( <FormItem><FormLabel>Endereço</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="empresaResponsavel.cnpjCpf" render={({ field }) => ( <FormItem><FormLabel>CNPJ/CPF</FormLabel><FormControl><MaskedInput mask="cpfCnpj" {...field} /></FormControl><FormMessage /></FormItem> )} />
                    <FormField control={form.control} name="empresaResponsavel.telefone" render={({ field }) => ( <FormItem><FormLabel>Telefone</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                </div>
                 <FormField control={form.control} name="empresaResponsavel.email" render={({ field }) => ( <FormItem><FormLabel>E-mail</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem> )} />
                 <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="empresaResponsavel.ctfAida" render={({ field }) => ( <FormItem><FormLabel>Cadastro Técnico Federal (CTF/AIDA)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                </div>
            </CardContent>
        </Card>

        <Card>
            <CardHeader><CardTitle>2.4. Responsável Técnico pela Elaboração do Relatório</CardTitle></CardHeader>
             <CardContent className="space-y-4">
                <FormField control={form.control} name="responsavelTecnico.id" render={({ field }) => (
                    <FormItem><FormLabel>Buscar Responsável Técnico Cadastrado</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoadingResponsaveis}>
                            <FormControl><SelectTrigger><SelectValue placeholder={isLoadingResponsaveis ? "Carregando..." : "Selecione o responsável"} /></SelectTrigger></FormControl>
                            <SelectContent>{responsaveis?.map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}</SelectContent>
                        </Select><FormMessage />
                    </FormItem>
                )} />
                 <FormField control={form.control} name="responsavelTecnico.nome" render={({ field }) => ( <FormItem><FormLabel>Nome</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                 <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="responsavelTecnico.formacao" render={({ field }) => ( <FormItem><FormLabel>Formação acadêmica</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                    <FormField control={form.control} name="responsavelTecnico.registroClasse" render={({ field }) => ( <FormItem><FormLabel>Registro de Classe</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                </div>
                 <FormField control={form.control} name="responsavelTecnico.art" render={({ field }) => ( <FormItem><FormLabel>Nº ART ou equivalente</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                 <FormField control={form.control} name="responsavelTecnico.ctfAidaIbama" render={({ field }) => ( <FormItem><FormLabel>Nº CTF/AIDA-IBAMA</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
            </CardContent>
        </Card>
        
        <h2 className="text-xl font-bold pt-4">3. INFORMAÇÕES DOS VEÍCULOS E/OU EQUIPAMENTOS</h2>
        <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <CardTitle>3.1 Dados dos Veículos Utilizados no Transporte</CardTitle>
                    <Button size="sm" type="button" onClick={() => appendVeiculo({ tipo: '', placa: '', anoFabricacao: '', acondicionamento: 'Fracionado' })}><PlusCircle className="mr-2 h-4 w-4" /> Adicionar Veículo</Button>
                </div>
            </CardHeader>
            <CardContent>
                 <div className="space-y-4">
                    {veiculosFields.map((item, index) => (
                        <div key={item.id} className="p-4 border rounded-md space-y-4 relative">
                            <Button type="button" variant="destructive" size="icon" className="absolute top-2 right-2 h-6 w-6" onClick={() => removeVeiculo(index)}><Trash2 className="h-4 w-4" /></Button>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <FormField control={form.control} name={`veiculosTransporte.${index}.tipo`} render={({ field }) => (<FormItem><FormLabel>Tipo</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                                <FormField control={form.control} name={`veiculosTransporte.${index}.placa`} render={({ field }) => (<FormItem><FormLabel>Placa</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                                <FormField control={form.control} name={`veiculosTransporte.${index}.anoFabricacao`} render={({ field }) => (<FormItem><FormLabel>Ano Fabr.</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                                 <FormField control={form.control} name={`veiculosTransporte.${index}.acondicionamento`} render={({ field }) => (<FormItem><FormLabel>Acondicionamento</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent><SelectItem value="Granel">Granel</SelectItem><SelectItem value="Fracionado">Fracionado</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                            </div>
                             <div className="grid grid-cols-2 gap-4">
                                <FormField control={form.control} name={`veiculosTransporte.${index}.civNumero`} render={({ field }) => (<FormItem><FormLabel>Certificado Inmetro (CIV) - Número</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                                <FormField control={form.control} name={`veiculosTransporte.${index}.civValidade`} render={({ field }) => (<FormItem><FormLabel>Validade</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>)} />
                            </div>
                        </div>
                    ))}
                </div>
                 <p className="text-sm text-muted-foreground mt-4">Nº total de veículos: {veiculosFields.length}</p>
            </CardContent>
        </Card>
        
        <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <CardTitle>3.2 Dados dos Equipamentos Utilizados no Transporte a Granel</CardTitle>
                    <Button size="sm" type="button" onClick={() => appendEquipamento({})}><PlusCircle className="mr-2 h-4 w-4" /> Adicionar Equipamento</Button>
                </div>
            </CardHeader>
            <CardContent>
                 <div className="space-y-4">
                     {equipamentosFields.map((item, index) => (
                        <div key={item.id} className="p-4 border rounded-md space-y-4 relative">
                            <Button type="button" variant="destructive" size="icon" className="absolute top-2 right-2 h-6 w-6" onClick={() => removeEquipamento(index)}><Trash2 className="h-4 w-4" /></Button>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <FormField control={form.control} name={`equipamentosGranel.${index}.tipoCarroceria`} render={({ field }) => (<FormItem><FormLabel>Tipo/Carroceria</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                                <FormField control={form.control} name={`equipamentosGranel.${index}.placaFabricacao`} render={({ field }) => (<FormItem><FormLabel>Placa de Fabricação</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                                <FormField control={form.control} name={`equipamentosGranel.${index}.anoFabricacao`} render={({ field }) => (<FormItem><FormLabel>Ano Fabr.</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                            </div>
                             <div className="grid grid-cols-2 gap-4">
                                <FormField control={form.control} name={`equipamentosGranel.${index}.cippNumero`} render={({ field }) => (<FormItem><FormLabel>Certificado Inmetro (CIPP) - Número</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                                <FormField control={form.control} name={`equipamentosGranel.${index}.cippValidade`} render={({ field }) => (<FormItem><FormLabel>Validade</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>)} />
                            </div>
                        </div>
                    ))}
                 </div>
                 <p className="text-sm text-muted-foreground mt-4">Nº total de equipamentos: {equipamentosFields.length}</p>
            </CardContent>
        </Card>

        <h2 className="text-xl font-bold pt-4">4. CLASSIFICAÇÃO DOS PRODUTOS E/OU RESÍDUOS</h2>
         <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <CardTitle>4.1 Classificação do Produto</CardTitle>
                    <Button size="sm" type="button" onClick={() => appendProduto({})}><PlusCircle className="mr-2 h-4 w-4" /> Add Produto</Button>
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {produtosFields.map((item, index) => (
                        <div key={item.id} className="p-4 border rounded-md space-y-4 relative">
                            <Button type="button" variant="destructive" size="icon" className="absolute top-2 right-2 h-6 w-6" onClick={() => removeProduto(index)}><Trash2 className="h-4 w-4" /></Button>
                            <div className="grid grid-cols-2 gap-4">
                                 <FormField control={form.control} name={`classificacaoProdutos.${index}.nomeTecnico`} render={({ field }) => ( <FormItem><FormLabel>Nome Técnico</FormLabel><FormControl><Input {...field} /></FormControl></FormItem> )} />
                                 <FormField control={form.control} name={`classificacaoProdutos.${index}.nomeComercial`} render={({ field }) => ( <FormItem><FormLabel>Nome Comercial</FormLabel><FormControl><Input {...field} /></FormControl></FormItem> )} />
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <FormField control={form.control} name={`classificacaoProdutos.${index}.numeroOnu`} render={({ field }) => ( <FormItem><FormLabel>Nº ONU</FormLabel><FormControl><Input {...field} /></FormControl></FormItem> )} />
                                <FormField control={form.control} name={`classificacaoProdutos.${index}.classeRisco`} render={({ field }) => ( <FormItem><FormLabel>Classe de Risco</FormLabel><FormControl><Input {...field} /></FormControl></FormItem> )} />
                                <FormField control={form.control} name={`classificacaoProdutos.${index}.acondicionamento`} render={({ field }) => ( <FormItem><FormLabel>Acondicionamento</FormLabel><FormControl><Input {...field} /></FormControl></FormItem> )} />
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
        
        <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <CardTitle>4.2 Classificação do Resíduo</CardTitle>
                    <Button size="sm" type="button" onClick={() => appendResiduo({})}><PlusCircle className="mr-2 h-4 w-4" /> Add Resíduo</Button>
                </div>
            </CardHeader>
             <CardContent>
                <div className="space-y-4">
                    {residuosFields.map((item, index) => (
                        <div key={item.id} className="p-4 border rounded-md space-y-4 relative">
                            <Button type="button" variant="destructive" size="icon" className="absolute top-2 right-2 h-6 w-6" onClick={() => removeResiduo(index)}><Trash2 className="h-4 w-4" /></Button>
                            <div className="grid grid-cols-2 gap-4">
                                 <FormField control={form.control} name={`classificacaoResiduos.${index}.nomeTecnico`} render={({ field }) => ( <FormItem><FormLabel>Nome Técnico</FormLabel><FormControl><Input {...field} /></FormControl></FormItem> )} />
                                 <FormField control={form.control} name={`classificacaoResiduos.${index}.nomeComercial`} render={({ field }) => ( <FormItem><FormLabel>Nome Comercial</FormLabel><FormControl><Input {...field} /></FormControl></FormItem> )} />
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <FormField control={form.control} name={`classificacaoResiduos.${index}.numeroOnu`} render={({ field }) => ( <FormItem><FormLabel>Nº ONU</FormLabel><FormControl><Input {...field} /></FormControl></FormItem> )} />
                                <FormField control={form.control} name={`classificacaoResiduos.${index}.classeRisco`} render={({ field }) => ( <FormItem><FormLabel>Classe de Risco</FormLabel><FormControl><Input {...field} /></FormControl></FormItem> )} />
                                <FormField control={form.control} name={`classificacaoResiduos.${index}.acondicionamento`} render={({ field }) => ( <FormItem><FormLabel>Acondicionamento</FormLabel><FormControl><Input {...field} /></FormControl></FormItem> )} />
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
        
        <h2 className="text-xl font-bold pt-4">5. INFORMAÇÕES DE ORIGEM E DESTINO</h2>
         <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <CardTitle>5.1 Dados de Origem e Destino do Produto</CardTitle>
                    <Button size="sm" type="button" onClick={() => appendOrigemProduto({})}><PlusCircle className="mr-2 h-4 w-4" /> Add</Button>
                </div>
            </CardHeader>
            <CardContent>
                 <div className="space-y-4">
                    {origemProdutosFields.map((item, index) => (
                        <div key={item.id} className="p-4 border rounded-md space-y-4 relative">
                            <Button type="button" variant="destructive" size="icon" className="absolute top-2 right-2 h-6 w-6" onClick={() => removeOrigemProduto(index)}><Trash2 className="h-4 w-4" /></Button>
                            <FormField control={form.control} name={`origemDestinoProdutos.${index}.produto`} render={({ field }) => ( <FormItem><FormLabel>Produto</FormLabel><FormControl><Input {...field} /></FormControl></FormItem> )} />
                            <div className="grid grid-cols-2 gap-4">
                                <FormField control={form.control} name={`origemDestinoProdutos.${index}.produtorNome`} render={({ field }) => ( <FormItem><FormLabel>Produtor (Origem): Nome</FormLabel><FormControl><Input {...field} /></FormControl></FormItem> )} />
                                <FormField control={form.control} name={`origemDestinoProdutos.${index}.produtorEndereco`} render={({ field }) => ( <FormItem><FormLabel>Produtor (Origem): Endereço</FormLabel><FormControl><Input {...field} /></FormControl></FormItem> )} />
                            </div>
                             <div className="grid grid-cols-2 gap-4">
                                <FormField control={form.control} name={`origemDestinoProdutos.${index}.consumidorNome`} render={({ field }) => ( <FormItem><FormLabel>Consumidor (Destino): Nome</FormLabel><FormControl><Input {...field} /></FormControl></FormItem> )} />
                                <FormField control={form.control} name={`origemDestinoProdutos.${index}.consumidorEndereco`} render={({ field }) => ( <FormItem><FormLabel>Consumidor (Destino): Endereço</FormLabel><FormControl><Input {...field} /></FormControl></FormItem> )} />
                            </div>
                            <FormField control={form.control} name={`origemDestinoProdutos.${index}.viasPreferenciais`} render={({ field }) => ( <FormItem><FormLabel>Vias Preferenciais</FormLabel><FormControl><Input {...field} /></FormControl></FormItem> )} />
                        </div>
                    ))}
                 </div>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <CardTitle>5.2 Dados de Origem e Destino do Resíduo</CardTitle>
                    <Button size="sm" type="button" onClick={() => appendOrigemResiduo({})}><PlusCircle className="mr-2 h-4 w-4" /> Add</Button>
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {origemResiduosFields.map((item, index) => (
                         <div key={item.id} className="p-4 border rounded-md space-y-4 relative">
                            <Button type="button" variant="destructive" size="icon" className="absolute top-2 right-2 h-6 w-6" onClick={() => removeOrigemResiduo(index)}><Trash2 className="h-4 w-4" /></Button>
                            <FormField control={form.control} name={`origemDestinoResiduos.${index}.residuo`} render={({ field }) => ( <FormItem><FormLabel>Resíduo</FormLabel><FormControl><Input {...field} /></FormControl></FormItem> )} />
                            <div className="grid grid-cols-2 gap-4">
                                <FormField control={form.control} name={`origemDestinoResiduos.${index}.geradorNome`} render={({ field }) => ( <FormItem><FormLabel>Gerador (Origem): Nome</FormLabel><FormControl><Input {...field} /></FormControl></FormItem> )} />
                                <FormField control={form.control} name={`origemDestinoResiduos.${index}.geradorEndereco`} render={({ field }) => ( <FormItem><FormLabel>Gerador (Origem): Endereço</FormLabel><FormControl><Input {...field} /></FormControl></FormItem> )} />
                            </div>
                             <div className="grid grid-cols-2 gap-4">
                                <FormField control={form.control} name={`origemDestinoResiduos.${index}.destinadorNome`} render={({ field }) => ( <FormItem><FormLabel>Destinador (Destino): Nome</FormLabel><FormControl><Input {...field} /></FormControl></FormItem> )} />
                                <FormField control={form.control} name={`origemDestinoResiduos.${index}.destinadorEndereco`} render={({ field }) => ( <FormItem><FormLabel>Destinador (Destino): Endereço</FormLabel><FormControl><Input {...field} /></FormControl></FormItem> )} />
                            </div>
                            <FormField control={form.control} name={`origemDestinoResiduos.${index}.viasPreferenciais`} render={({ field }) => ( <FormItem><FormLabel>Vias Preferenciais</FormLabel><FormControl><Input {...field} /></FormControl></FormItem> )} />
                        </div>
                    ))}
                 </div>
            </CardContent>
        </Card>

        <h2 className="text-xl font-bold pt-4">6. ANEXOS</h2>
        <FormField control={form.control} name="anexoART" render={({ field }) => (<FormItem><FormLabel>Anexar cópia da ART ou documento equivalente</FormLabel><FormControl><Input type="file" /></FormControl><FormMessage /></FormItem>)} />

        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
            Cancelar
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...
              </>
            ) : (
              'Salvar Relatório'
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
