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

interface RcaFormBorrachaProps {
    form: any;
    clients: Client[];
    isLoadingClients: boolean;
    projects: Project[];
    isLoadingProjects: boolean;
}

export function RcaFormBorracha({ form, clients, isLoadingClients, projects, isLoadingProjects }: RcaFormBorrachaProps) {
    
    // This form is a placeholder. You would implement the full form based on the Termo de Referência here.
    const { fields: materiasPrimasFields, append: appendMateriaPrima, remove: removeMateriaPrima } = useFieldArray({ control: form.control, name: 'materiasPrimas' });
    const { fields: produtosFabricadosFields, append: appendProdutoFabricado, remove: removeProdutoFabricado } = useFieldArray({ control: form.control, name: 'produtosFabricados' });
    const { fields: equipamentosFields, append: appendEquipamento, remove: removeEquipamento } = useFieldArray({ control: form.control, name: 'equipamentos' });
    const { fields: residuosSolidosFields, append: appendResiduo, remove: removeResiduo } = useFieldArray({ control: form.control, name: 'residuosSolidos' });


    return (
        <Accordion type="multiple" defaultValue={['item-1']} className="w-full">
            {/* Os Módulos 1, 2 e 3 são genéricos e já estão no formulário principal (rca-form.tsx) */}
            <AccordionItem value="item-4">
                <AccordionTrigger>MÓDULO 4 - CARACTERIZAÇÃO DO EMPREENDIMENTO E ENTORNO</AccordionTrigger>
                <AccordionContent className="space-y-6 p-1">
                    <div className="space-y-4 p-4 border rounded-md">
                        <h3 className="font-semibold">15. CONSUMO DE MATÉRIA PRIMA PRINCIPAL, CAPACIDADE INSTALADA E PRODUÇÃO NOMINAL</h3>
                        <FormField control={form.control} name="capacidadeInstalada" render={({ field }: any) => (<FormItem><FormLabel>Capacidade instalada (ton/ano)</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>)} />
                        <FormField control={form.control} name="consumoMateriaPrima" render={({ field }: any) => (<FormItem><FormLabel>Consumo de matéria prima principal (ton/ano)</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>)} />
                        <FormField control={form.control} name="producaoNominal" render={({ field }: any) => (<FormItem><FormLabel>Produção nominal (especificar unidade)</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                    </div>
                     <div className="space-y-4 p-4 border rounded-md">
                        <h3 className="font-semibold">16. RELAÇÃO DE MATÉRIAS-PRIMAS E INSUMOS</h3>
                        <div className="flex justify-end">
                            <Button size="sm" type="button" onClick={() => appendMateriaPrima({})}><PlusCircle className="mr-2 h-4 w-4" /> Adicionar Matéria-Prima</Button>
                        </div>
                        {materiasPrimasFields.map((item, index) => (
                            <div key={item.id} className="p-2 border rounded-md space-y-2 relative">
                                <Button type="button" variant="destructive" size="icon" className="absolute top-1 right-1 h-6 w-6" onClick={() => removeMateriaPrima(index)}><Trash2 className="h-4 w-4" /></Button>
                                <FormField control={form.control} name={`materiasPrimas.${index}.nome`} render={({ field }: any) => (<FormItem><FormLabel>Nome Técnico/Comercial</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                                <FormField control={form.control} name={`materiasPrimas.${index}.consumoMaximo`} render={({ field }: any) => (<FormItem><FormLabel>Consumo Máximo (un/mês)</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                                <FormField control={form.control} name={`materiasPrimas.${index}.consumoMedio`} render={({ field }: any) => (<FormItem><FormLabel>Consumo Médio (un/mês)</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                            </div>
                        ))}
                    </div>
                     <div className="space-y-4 p-4 border rounded-md">
                        <h3 className="font-semibold">20. EQUIPAMENTOS OU SISTEMAS UTILIZADOS</h3>
                         <div className="flex justify-between items-center"><h4 className='font-medium'>Equipamentos do Processo Produtivo</h4><Button size="sm" type="button" onClick={() => appendEquipamento({})}><PlusCircle className="mr-2 h-4 w-4" /> Add</Button></div>
                         {equipamentosFields.map((item, index) => (
                            <div key={item.id} className="p-2 border rounded-md space-y-2 relative">
                                <Button type="button" variant="destructive" size="icon" className="absolute top-1 right-1 h-6 w-6" onClick={() => removeEquipamento(index)}><Trash2 className="h-4 w-4" /></Button>
                                <FormField control={form.control} name={`equipamentosProducao.${index}.nome`} render={({ field }: any) => (<FormItem><FormLabel>Nome/Marca</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                                 <FormField control={form.control} name={`equipamentosProducao.${index}.quantidade`} render={({ field }: any) => (<FormItem><FormLabel>Quantidade</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>)} />
                                 <FormField control={form.control} name={`equipamentosProducao.${index}.capacidadeNominal`} render={({ field }: any) => (<FormItem><FormLabel>Capacidade Nominal</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                            </div>
                        ))}
                    </div>
                </AccordionContent>
            </AccordionItem>
             {/* Os Módulos 5, 6 e 7 são genéricos e podem ser incluídos aqui, se necessário, ou tratados no componente principal */}
        </Accordion>
    );
}
