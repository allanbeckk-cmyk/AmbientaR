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

interface RcaFormFundidosFerroAcoProps {
    form: any;
    clients: Client[];
    isLoadingClients: boolean;
    projects: Project[];
    isLoadingProjects: boolean;
}

export function RcaFormFundidosFerroAco({ form, clients, isLoadingClients, projects, isLoadingProjects }: RcaFormFundidosFerroAcoProps) {
    
    const { fields: materiasPrimasFields, append: appendMateriaPrima, remove: removeMateriaPrima } = useFieldArray({ control: form.control, name: 'materiasPrimas' });
    const { fields: equipamentosFusaoFields, append: appendEquipamentoFusao, remove: removeEquipamentoFusao } = useFieldArray({ control: form.control, name: 'equipamentosFusao' });
    const { fields: efluentesRefrigeracaoFields, append: appendEfluenteRefrigeracao, remove: removeEfluenteRefrigeracao } = useFieldArray({ control: form.control, name: 'efluentesRefrigeracao' });
    
    return (
        <Accordion type="multiple" defaultValue={['item-1']} className="w-full">
            {/* Os Módulos 1, 2 e 3 são genéricos e já estão no formulário principal (rca-form.tsx) */}
            <AccordionItem value="item-4">
                <AccordionTrigger>MÓDULO 4 - CARACTERIZAÇÃO DO EMPREENDIMENTO E ENTORNO</AccordionTrigger>
                <AccordionContent className="space-y-6 p-1">
                     <div className="space-y-4 p-4 border rounded-md">
                        <h3 className="font-semibold">28. USO DE MADEIRA</h3>
                        <FormField control={form.control} name="usoMadeira.consome" render={({ field }: any) => (<FormItem><FormLabel>Consome lenha/madeira/derivados como matéria prima ou combustível?</FormLabel><FormControl><RadioGroup onValueChange={(v) => field.onChange(v === 'true')} defaultValue={String(field.value)} className="flex space-x-4">
                            <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="true" /></FormControl><FormLabel className="font-normal">Sim</FormLabel></FormItem>
                            <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="false" /></FormControl><FormLabel className="font-normal">Não</FormLabel></FormItem>
                        </RadioGroup></FormControl></FormItem>)} />
                        {form.watch('usoMadeira.consome') && (
                            <FormField control={form.control} name="usoMadeira.possuiRegistroIEF" render={({ field }: any) => (<FormItem><FormLabel>Possui Certificado de Registro no IEF?</FormLabel><FormControl><RadioGroup onValueChange={(v) => field.onChange(v === 'true')} defaultValue={String(field.value)} className="flex space-x-4">
                                <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="true" /></FormControl><FormLabel className="font-normal">Sim</FormLabel></FormItem>
                                <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="false" /></FormControl><FormLabel className="font-normal">Não</FormLabel></FormItem>
                            </RadioGroup></FormControl><FormDescription>Se não, providencie com urgência.</FormDescription></FormItem>)} />
                        )}
                    </div>
                     <div className="space-y-4 p-4 border rounded-md">
                        <h3 className="font-semibold">32. CONSOLIDAÇÃO DA RELAÇÃO DE MATÉRIAS-PRIMAS E MATERIAIS INTERMEDIÁRIOS</h3>
                        <div className="flex justify-end">
                            <Button size="sm" type="button" onClick={() => appendMateriaPrima({})}><PlusCircle className="mr-2 h-4 w-4" /> Adicionar</Button>
                        </div>
                        {materiasPrimasFields.map((item, index) => (
                            <div key={item.id} className="p-4 border rounded-md space-y-4 relative">
                                <Button type="button" variant="destructive" size="icon" className="absolute top-2 right-2 h-6 w-6" onClick={() => removeMateriaPrima(index)}><Trash2 className="h-4 w-4" /></Button>
                                <FormField control={form.control} name={`materiasPrimas.${index}.setor`} render={({ field }: any) => (<FormItem><FormLabel>Setor</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                                <FormField control={form.control} name={`materiasPrimas.${index}.nome`} render={({ field }: any) => (<FormItem><FormLabel>Matéria-Prima/Insumo</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                                {/* ... mais campos da matéria-prima ... */}
                            </div>
                        ))}
                    </div>
                     <div className="space-y-4 p-4 border rounded-md">
                        <h3 className="font-semibold">36. PROCESSO DE FUSÃO - TIPO DE FORNOS UTILIZADOS NA FUSÃO DA CARGA METÁLICA</h3>
                         <div className="flex justify-end">
                            <Button size="sm" type="button" onClick={() => appendEquipamentoFusao({})}><PlusCircle className="mr-2 h-4 w-4" /> Adicionar Forno</Button>
                        </div>
                         {equipamentosFusaoFields.map((item, index) => (
                             <div key={item.id} className="p-4 border rounded-md space-y-4 relative">
                                <Button type="button" variant="destructive" size="icon" className="absolute top-2 right-2 h-6 w-6" onClick={() => removeEquipamentoFusao(index)}><Trash2 className="h-4 w-4" /></Button>
                                <h4 className="font-medium">Forno {index + 1}</h4>
                                <FormField control={form.control} name={`equipamentosFusao.${index}.combustivel`} render={({ field }: any) => (<FormItem><FormLabel>Combustível</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                                <FormField control={form.control} name={`equipamentosFusao.${index}.tipoForno`} render={({ field }: any) => (<FormItem><FormLabel>Tipo do Forno</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                                <FormField control={form.control} name={`equipamentosFusao.${index}.quantidade`} render={({ field }: any) => (<FormItem><FormLabel>Nº de Fornos</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>)} />
                                <FormField control={form.control} name={`equipamentosFusao.${index}.capacidade`} render={({ field }: any) => (<FormItem><FormLabel>Capacidade (t/h)</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>)} />
                             </div>
                        ))}
                    </div>
                    {/* ... Adicionar outros campos específicos do Módulo 4 ... */}
                </AccordionContent>
            </AccordionItem>
             {/* Os Módulos 5, 6 e 7 são genéricos e podem ser incluídos aqui, se necessário, ou tratados no componente principal */}
        </Accordion>
    );
}
