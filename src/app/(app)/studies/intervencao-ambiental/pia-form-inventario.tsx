'use client';
import * as React from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import type { Empreendedor as Client, Project } from '@/lib/types';
import { Textarea } from '@/components/ui/textarea';
import { CalendarIcon, PlusCircle, Trash2 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface PiaFormInventarioProps {
    form: any;
    clients: Client[];
    isLoadingClients: boolean;
    projects: Project[];
    isLoadingProjects: boolean;
}

export function PiaFormInventario({ form, clients, isLoadingClients, projects, isLoadingProjects }: PiaFormInventarioProps) {
    
    const { fields: cronogramaFields, append: appendCronograma, remove: removeCronograma } = useFieldArray({
        control: form.control,
        name: "cronograma",
    });

    const selectedRequerenteId = form.watch('requerente.clientId');
    const selectedProprietarioId = form.watch('proprietario.clientId');
    const selectedProjectId = form.watch('empreendimento.projectId');


    React.useEffect(() => {
        if (selectedRequerenteId) {
            const client = clients?.find(c => c.id === selectedRequerenteId);
            if (client) {
                form.setValue('requerente.nome', client.name);
                form.setValue('requerente.cpfCnpj', client.cpfCnpj || '');
            }
        }
    }, [selectedRequerenteId, clients, form]);

    React.useEffect(() => {
        if (selectedProprietarioId) {
            const client = clients?.find(c => c.id === selectedProprietarioId);
            if (client) {
                form.setValue('proprietario.nome', client.name);
                form.setValue('proprietario.cpfCnpj', client.cpfCnpj || '');
            }
        }
    }, [selectedProprietarioId, clients, form]);

    React.useEffect(() => {
        if (selectedProjectId) {
            const project = projects?.find(p => p.id === selectedProjectId);
            if (project) {
                form.setValue('empreendimento.nome', project.fantasyName || project.propertyName);
                form.setValue('empreendimento.denominacao', project.propertyName);
                // @ts-ignore - Assuming CAR is a field on project
                form.setValue('empreendimento.car', project.car || '');
                form.setValue('empreendimento.atividades', project.activity);
            }
        }
    }, [selectedProjectId, projects, form]);

    return (
       <Accordion type="multiple" defaultValue={['item-1', 'item-2', 'item-3']} className="w-full">
            <AccordionItem value="item-1">
                <AccordionTrigger>Informações Gerais</AccordionTrigger>
                <AccordionContent className="space-y-6">
                    <div className="space-y-4 p-4 border rounded-md">
                        <h3 className="font-semibold text-base">Dados do requerente ou empreendedor</h3>
                         <FormField control={form.control} name="requerente.clientId" render={({ field }) => (
                            <FormItem><FormLabel>Buscar Requerente Cadastrado</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoadingClients}><FormControl><SelectTrigger>
                                <SelectValue placeholder={isLoadingClients ? "Carregando..." : "Selecione um cliente"} />
                            </SelectTrigger></FormControl><SelectContent>{clients?.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="requerente.nome" render={({ field }) => (<FormItem><FormLabel>Nome</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="requerente.cpfCnpj" render={({ field }) => (<FormItem><FormLabel>CPF/CNPJ</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                    </div>
                     <div className="space-y-4 p-4 border rounded-md">
                        <h3 className="font-semibold text-base">Dados do proprietário do imóvel</h3>
                         <FormField control={form.control} name="proprietario.clientId" render={({ field }) => (
                            <FormItem><FormLabel>Buscar Proprietário Cadastrado</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoadingClients}><FormControl><SelectTrigger>
                                <SelectValue placeholder={isLoadingClients ? "Carregando..." : "Selecione um cliente"} />
                            </SelectTrigger></FormControl><SelectContent>{clients?.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="proprietario.nome" render={({ field }) => (<FormItem><FormLabel>Nome</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="proprietario.cpfCnpj" render={({ field }) => (<FormItem><FormLabel>CPF/CNPJ</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                    </div>
                    <div className="space-y-4 p-4 border rounded-md">
                        <h3 className="font-semibold text-base">Dados do imóvel rural e empreendimento</h3>
                         <FormField control={form.control} name="empreendimento.projectId" render={({ field }) => (
                            <FormItem><FormLabel>Buscar Empreendimento Cadastrado</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoadingProjects}><FormControl><SelectTrigger>
                                <SelectValue placeholder={isLoadingProjects ? "Carregando..." : "Selecione um empreendimento"} />
                            </SelectTrigger></FormControl><SelectContent>{projects?.map(p => <SelectItem key={p.id} value={p.id}>{p.propertyName}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="empreendimento.nome" render={({ field }) => (<FormItem><FormLabel>Nome do empreendimento (quando couber)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="empreendimento.denominacao" render={({ field }) => (<FormItem><FormLabel>Denominação do imóvel</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="empreendimento.car" render={({ field }) => (<FormItem><FormLabel>Nº do recibo do CAR</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="empreendimento.atividades" render={({ field }) => (<FormItem><FormLabel>Atividades desenvolvidas no empreendimento</FormLabel><FormControl><Textarea placeholder="Listar as atividades conforme Deliberação Normativa Copam nº 217" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    </div>
                    <div className="space-y-4 p-4 border rounded-md">
                        <h3 className="font-semibold text-base">Dados do responsável técnico pelo projeto</h3>
                        <FormField control={form.control} name="responsavelTecnico.nome" render={({ field }) => (<FormItem><FormLabel>Nome</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="responsavelTecnico.cpf" render={({ field }) => (<FormItem><FormLabel>CPF</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="responsavelTecnico.email" render={({ field }) => (<FormItem><FormLabel>E-mail</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="responsavelTecnico.telefone" render={({ field }) => (<FormItem><FormLabel>Telefone</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="responsavelTecnico.formacao" render={({ field }) => (<FormItem><FormLabel>Formação</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="responsavelTecnico.registroConselho" render={({ field }) => (<FormItem><FormLabel>Nº de registro em conselho de classe</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="responsavelTecnico.art" render={({ field }) => (<FormItem><FormLabel>Nº da ART</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="responsavelTecnico.ctfAida" render={({ field }) => (<FormItem><FormLabel>CFT/AIDA</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                    </div>
                </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2">
                <AccordionTrigger>Objetivo da Intervenção</AccordionTrigger>
                <AccordionContent className="space-y-4 p-4">
                     <FormField
                        control={form.control}
                        name="objetivo.texto"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Descrição do Objetivo</FormLabel>
                                <FormControl><Textarea className="min-h-[200px]" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="objetivo.supressao"
                        render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                                <div className="space-y-1 leading-none">
                                <FormLabel>Supressão de cobertura vegetal nativa, para uso alternativo do solo</FormLabel>
                                </div>
                            </FormItem>
                        )}
                    />
                     <FormField
                        control={form.control}
                        name="objetivo.finalidade"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Finalidade da intervenção requerida</FormLabel>
                                <FormControl><Textarea className="min-h-[100px]" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </AccordionContent>
            </AccordionItem>
             <AccordionItem value="item-3">
                <AccordionTrigger>Diagnóstico Socioambiental</AccordionTrigger>
                <AccordionContent className="space-y-6">
                    <div className="space-y-4 p-4 border rounded-md">
                        <h3 className="font-semibold text-base">Delimitação da área diretamente afetada (ADA)</h3>
                         <FormDescription>Adicione o Mapa 1: Área Diretamente Afetada (ADA)</FormDescription>
                    </div>
                    <div className="space-y-4 p-4 border rounded-md">
                        <h3 className="font-semibold text-base">Caracterização do meio biótico</h3>
                         <FormField control={form.control} name="diagnostico.meioBiotico" render={({ field }) => (<FormItem><FormControl><Textarea className="min-h-[150px]" {...field} /></FormControl></FormItem>)} />
                    </div>
                     <div className="space-y-4 p-4 border rounded-md">
                        <h3 className="font-semibold text-base">Caracterização do meio abiótico</h3>
                        <FormField control={form.control} name="diagnostico.meioAbiotico.clima" render={({ field }) => (<FormItem><FormLabel>Clima</FormLabel><FormControl><Textarea className="min-h-[150px]" {...field} /></FormControl><FormDescription className="pt-2">Adicione o Gráfico 1: Temperatura e Precipitação</FormDescription></FormItem>)} />
                        <FormField control={form.control} name="diagnostico.meioAbiotico.solos" render={({ field }) => (<FormItem className="pt-4 border-t"><FormLabel>Solos</FormLabel><FormControl><Textarea className="min-h-[150px]" {...field} /></FormControl><FormDescription className="pt-2">Adicione o Mapa 2: Mapa de Solos</FormDescription></FormItem>)} />
                        <FormField control={form.control} name="diagnostico.meioAbiotico.hidrografia" render={({ field }) => (<FormItem className="pt-4 border-t"><FormLabel>Hidrografia</FormLabel><FormControl><Textarea className="min-h-[150px]" {...field} /></FormControl><FormDescription className="pt-2">Adicione o Mapa 3: Mapa Hidrográfico</FormDescription></FormItem>)} />
                        <FormField control={form.control} name="diagnostico.meioAbiotico.topografia" render={({ field }) => (<FormItem className="pt-4 border-t"><FormLabel>Topografia</FormLabel><FormControl><Textarea className="min-h-[150px]" {...field} /></FormControl><FormDescription className="pt-2">Adicione o Mapa 4: Topografia do empreendimento</FormDescription></FormItem>)} />
                    </div>
                     <div className="space-y-4 p-4 border rounded-md">
                        <h3 className="font-semibold text-base">Caracterização socioeconômica</h3>
                         <FormField control={form.control} name="diagnostico.socioeconomico" render={({ field }) => (<FormItem><FormControl><Textarea className="min-h-[150px]" {...field} /></FormControl></FormItem>)} />
                    </div>
                </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-4">
                <AccordionTrigger>Caracterização da Intervenção</AccordionTrigger>
                <AccordionContent className="space-y-6">
                     <div className="space-y-4 p-4 border rounded-md">
                        <h3 className="font-semibold text-base">Técnica a ser usada na intervenção ambiental</h3>
                        <FormField control={form.control} name="caracterizacaoIntervencao.tecnica" render={({ field }) => (<FormItem><FormControl><Textarea className="min-h-[200px]" {...field} /></FormControl></FormItem>)} />
                    </div>
                    <div className="space-y-4 p-4 border rounded-md">
                        <h3 className="font-semibold text-base">Método de aproveitamento e destinação do material lenhoso</h3>
                        <FormField control={form.control} name="caracterizacaoIntervencao.destinacaoMaterialLenhoso" render={({ field }) => (<FormItem><FormControl><Textarea className="min-h-[200px]" {...field} /></FormControl></FormItem>)} />
                    </div>
                    <div className="space-y-4 p-4 border rounded-md">
                        <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-base">Cronograma de execução</h3>
                            <Button type="button" size="sm" onClick={() => appendCronograma({ etapa: '', dataInicio: new Date(), dataFim: new Date() })}>
                                <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Etapa
                            </Button>
                        </div>
                        {cronogramaFields.map((field, index) => (
                            <div key={field.id} className="relative p-4 border rounded-md space-y-4">
                                <Button type="button" variant="destructive" size="icon" className="absolute top-2 right-2 h-6 w-6" onClick={() => removeCronograma(index)}><Trash2 className="h-4 w-4" /></Button>
                                <FormField control={form.control} name={`cronograma.${index}.etapa`} render={({ field }) => (<FormItem><FormLabel>Etapa</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                                <div className="grid grid-cols-2 gap-4">
                                     <FormField control={form.control} name={`cronograma.${index}.dataInicio`} render={({ field }) => (<FormItem className="flex flex-col"><FormLabel>Data de Início</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>{field.value ? format(field.value, "PPP", { locale: ptBR }) : <span>Escolha uma data</span>}<CalendarIcon className="w-4 h-4 ml-auto opacity-50" /></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent></Popover><FormMessage /></FormItem>)} />
                                     <FormField control={form.control} name={`cronograma.${index}.dataFim`} render={({ field }) => (<FormItem className="flex flex-col"><FormLabel>Data de Fim</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>{field.value ? format(field.value, "PPP", { locale: ptBR }) : <span>Escolha uma data</span>}<CalendarIcon className="w-4 h-4 ml-auto opacity-50" /></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent></Popover><FormMessage /></FormItem>)} />
                                </div>
                            </div>
                        ))}
                    </div>
                </AccordionContent>
            </AccordionItem>
            {/* Outros módulos podem ser adicionados aqui */}
       </Accordion>
    )
}
