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
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import type { Empreendedor as Client, Project } from '@/lib/types';
import { Textarea } from '@/components/ui/textarea';
import { PlusCircle, Trash2 } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface RcaFormSubprodutosAnimalProps {
    form: any;
    clients: Client[];
    isLoadingClients: boolean;
    projects: Project[];
    isLoadingProjects: boolean;
}

export function RcaFormSubprodutosAnimal({ form, clients, isLoadingClients, projects, isLoadingProjects }: RcaFormSubprodutosAnimalProps) {
    
    // This form is a placeholder. You would implement the full form based on the Termo de Referência here.
    const { fields: equipamentosFields, append: appendEquipamento, remove: removeEquipamento } = useFieldArray({ control: form.control, name: 'equipamentos' });
    const { fields: produtosFields, append: appendProduto, remove: removeProduto } = useFieldArray({ control: form.control, name: 'produtos' });


    return (
        <Accordion type="multiple" defaultValue={['item-1']} className="w-full">
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
                    </div>
                     <div className="space-y-4 p-4 border rounded-md">
                        <h3 className="font-semibold">21. PRODUTOS FABRICADOS E/OU PROCESSADOS</h3>
                        <div className="flex justify-end">
                            <Button size="sm" type="button" onClick={() => appendProduto({})}><PlusCircle className="mr-2 h-4 w-4" /> Adicionar Produto</Button>
                        </div>
                        {produtosFields.map((item, index) => (
                            <div key={item.id} className="p-2 border rounded-md space-y-2 relative">
                                <Button type="button" variant="destructive" size="icon" className="absolute top-1 right-1 h-6 w-6" onClick={() => removeProduto(index)}><Trash2 className="h-4 w-4" /></Button>
                                <FormField control={form.control} name={`produtos.${index}.nome`} render={({ field }: any) => (<FormItem><FormLabel>Nome Técnico/Comercial</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                                <FormField control={form.control} name={`produtos.${index}.armazenamento`} render={({ field }: any) => (<FormItem><FormLabel>Local de Armazenamento</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                                <div className="grid grid-cols-2 gap-4">
                                     <FormField control={form.control} name={`produtos.${index}.producaoMaxima`} render={({ field }: any) => (<FormItem><FormLabel>Produção Máx. (un/mês)</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                                     <FormField control={form.control} name={`produtos.${index}.producaoMedia`} render={({ field }: any) => (<FormItem><FormLabel>Produção Média (un/mês)</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="space-y-4 p-4 border rounded-md">
                        <div className="flex justify-between items-center"><h3 className="font-semibold">22. EQUIPAMENTOS</h3><Button size="sm" type="button" onClick={() => appendEquipamento({})}><PlusCircle className="mr-2 h-4 w-4" /> Add</Button></div>
                        {equipamentosFields.map((item, index) => (
                             <div key={item.id} className="p-2 border rounded-md space-y-2 relative">
                                <Button type="button" variant="destructive" size="icon" className="absolute top-1 right-1 h-6 w-6" onClick={() => removeEquipamento(index)}><Trash2 className="h-4 w-4" /></Button>
                                <FormField control={form.control} name={`equipamentos.${index}.nome`} render={({ field }: any) => (<FormItem><FormLabel>Nome/Marca</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                                 <FormField control={form.control} name={`equipamentos.${index}.quantidade`} render={({ field }: any) => (<FormItem><FormLabel>Quantidade</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>)} />
                                 <FormField control={form.control} name={`equipamentos.${index}.capacidade`} render={({ field }: any) => (<FormItem><FormLabel>Capacidade</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                            </div>
                        ))}
                    </div>
                </AccordionContent>
            </AccordionItem>
            {/* Outros módulos */}
        </Accordion>
    );
}
