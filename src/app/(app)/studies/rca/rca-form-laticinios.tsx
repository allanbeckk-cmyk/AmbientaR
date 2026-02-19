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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import type { Empreendedor as Client, Project } from '@/lib/types';
import { Textarea } from '@/components/ui/textarea';
import { PlusCircle, Trash2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface RcaFormLaticiniosProps {
    form: any;
    clients: Client[];
    isLoadingClients: boolean;
    projects: Project[];
    isLoadingProjects: boolean;
}

export function RcaFormLaticinios({ form, clients, isLoadingClients, projects, isLoadingProjects }: RcaFormLaticiniosProps) {
    
    const { fields: outrasAtividadesFields, append: appendOutraAtividade, remove: removeOutraAtividade } = useFieldArray({ control: form.control, name: 'outrasAtividades' });
    const { fields: materiasPrimasFields, append: appendMateriaPrima, remove: removeMateriaPrima } = useFieldArray({ control: form.control, name: 'materiasPrimas' });
    const { fields: produtosFields, append: appendProduto, remove: removeProduto } = useFieldArray({ control: form.control, name: 'produtosFabricados' });
    const { fields: efluentesIndustriaisFields, append: appendEfluenteIndustrial, remove: removeEfluenteIndustrial } = useFieldArray({ control: form.control, name: 'efluentesIndustriais' });
    const { fields: residuosSolidosFields, append: appendResiduoSolido, remove: removeResiduoSolido } = useFieldArray({ control: form.control, name: 'residuosSolidos' });


    return (
        <Accordion type="multiple" defaultValue={['item-4']} className="w-full">
            {/* Os Módulos 1, 2 e 3 são genéricos e já estão no formulário principal (rca-form.tsx) */}
            <AccordionItem value="item-4">
                <AccordionTrigger>MÓDULO 4 - CARACTERIZAÇÃO DO EMPREENDIMENTO E ENTORNO</AccordionTrigger>
                <AccordionContent className="space-y-6 p-1">
                    <div className="space-y-4 p-4 border rounded-md">
                        <h3 className="font-semibold">12. RECURSOS HUMANOS</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <FormField control={form.control} name="recursosHumanos.fixos" render={({ field }: any) => (<FormItem><FormLabel>Nº Fixos</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>)} />
                            <FormField control={form.control} name="recursosHumanos.temporarios" render={({ field }: any) => (<FormItem><FormLabel>Nº Temporários</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>)} />
                            <FormField control={form.control} name="recursosHumanos.terceirizados" render={({ field }: any) => (<FormItem><FormLabel>Nº Terceirizados</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>)} />
                        </div>
                         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <FormField control={form.control} name="recursosHumanos.producao" render={({ field }: any) => (<FormItem><FormLabel>Nº no Setor de Produção</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>)} />
                            <FormField control={form.control} name="recursosHumanos.administrativo" render={({ field }: any) => (<FormItem><FormLabel>Nº no Setor Administrativo</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>)} />
                            <FormField control={form.control} name="recursosHumanos.manutencao" render={({ field }: any) => (<FormItem><FormLabel>Nº no Setor de Manutenção</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>)} />
                        </div>
                    </div>
                     <div className="space-y-4 p-4 border rounded-md">
                        <h3 className="font-semibold">13. REGIME DE OPERAÇÃO</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <FormField control={form.control} name="regimeOperacao.horasDia" render={({ field }: any) => (<FormItem><FormLabel>Horas/dia</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>)} />
                            <FormField control={form.control} name="regimeOperacao.diasSemana" render={({ field }: any) => (<FormItem><FormLabel>Dias/semana</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>)} />
                            <FormField control={form.control} name="regimeOperacao.turnos" render={({ field }: any) => (<FormItem><FormLabel>Nº de Turnos</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>)} />
                             <FormField control={form.control} name="regimeOperacao.trabalhadoresTurno" render={({ field }: any) => (<FormItem><FormLabel>Trabalhadores/turno</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>)} />
                        </div>
                        <FormField control={form.control} name="regimeOperacao.sazonalidade" render={({ field }: any) => (
                            <FormItem>
                                <FormLabel>As atividades do empreendimento são sazonais?</FormLabel>
                                <FormControl>
                                    <RadioGroup onValueChange={(v) => field.onChange(v === 'true')} defaultValue={String(field.value)} className="flex items-center space-x-4">
                                        <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="false" /></FormControl><FormLabel className="font-normal">Não</FormLabel></FormItem>
                                        <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="true" /></FormControl><FormLabel className="font-normal">Sim</FormLabel></FormItem>
                                    </RadioGroup>
                                </FormControl>
                                {form.watch('regimeOperacao.sazonalidade') && (
                                    <FormField control={form.control} name="regimeOperacao.sazonalidadeDescricao" render={({ field }: any) => (<FormItem className="pt-2"><FormLabel>Descrever sazonalidade</FormLabel><FormControl><Textarea {...field} /></FormControl></FormItem>)} />
                                )}
                            </FormItem>
                        )} />
                    </div>
                     <div className="space-y-4 p-4 border rounded-md">
                        <div className="flex justify-between items-center"><h3 className="font-semibold">20. RELAÇÃO DE MATÉRIAS-PRIMAS E INSUMOS</h3><Button size="sm" type="button" onClick={() => appendMateriaPrima({})}><PlusCircle className="mr-2 h-4 w-4" /> Add</Button></div>
                        {materiasPrimasFields.map((item, index) => (
                            <div key={item.id} className="p-2 border rounded-md space-y-2 relative">
                                <Button type="button" variant="destructive" size="icon" className="absolute top-1 right-1 h-6 w-6" onClick={() => removeMateriaPrima(index)}><Trash2 className="h-4 w-4" /></Button>
                                <FormField control={form.control} name={`materiasPrimas.${index}.nome`} render={({ field }: any) => (<FormItem><FormLabel>Nome Técnico/Comercial</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                                <FormField control={form.control} name={`materiasPrimas.${index}.consumoMaximo`} render={({ field }: any) => (<FormItem><FormLabel>Consumo Máximo (un/mês)</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                                <FormField control={form.control} name={`materiasPrimas.${index}.consumoMedio`} render={({ field }: any) => (<FormItem><FormLabel>Consumo Médio (un/mês)</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                            </div>
                        ))}
                    </div>
                </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-5">
                <AccordionTrigger>MÓDULO 5 - POSSÍVEIS IMPACTOS AMBIENTAIS</AccordionTrigger>
                 <AccordionContent className="space-y-6">
                    {/* Conteúdo do Módulo 5 (genérico) */}
                </AccordionContent>
            </AccordionItem>
            {/* Outros módulos */}
        </Accordion>
    );
}
