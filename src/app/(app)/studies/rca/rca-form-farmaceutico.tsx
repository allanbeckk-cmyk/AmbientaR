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

interface RcaFormFarmaceuticoProps {
    form: any;
    clients: Client[];
    isLoadingClients: boolean;
    projects: Project[];
    isLoadingProjects: boolean;
}

export function RcaFormFarmaceutico({ form, clients, isLoadingClients, projects, isLoadingProjects }: RcaFormFarmaceuticoProps) {
    
    const { fields: materiasPrimasFields, append: appendMateriaPrima, remove: removeMateriaPrima } = useFieldArray({ control: form.control, name: 'materiasPrimas' });
    const { fields: produtosFabricadosFields, append: appendProdutoFabricado, remove: removeProdutoFabricado } = useFieldArray({ control: form.control, name: 'produtosFabricados' });
    const { fields: equipamentosFields, append: appendEquipamento, remove: removeEquipamento } = useFieldArray({ control: form.control, name: 'equipamentos' });
    const { fields: residuosSolidosFields, append: appendResiduo, remove: removeResiduo } = useFieldArray({ control: form.control, name: 'residuosSolidos' });


    return (
        <Accordion type="multiple" defaultValue={['item-1']} className="w-full">
            {/* Módulos genéricos (1 a 3) são assumidos como já existentes no formulário pai */}
            <AccordionItem value="item-4">
                <AccordionTrigger>MÓDULO 4 - CARACTERIZAÇÃO DO EMPREENDIMENTO E ENTORNO</AccordionTrigger>
                <AccordionContent className="space-y-6 p-1">
                    <div className="space-y-4 p-4 border rounded-md">
                        <h3 className="font-semibold">12. SIGILO</h3>
                        <FormField control={form.control} name="sigilo" render={({ field }: any) => (<FormItem>
                            <FormLabel>A empresa deseja manter o sigilo industrial das informações de processo industrial?</FormLabel>
                            <FormControl><RadioGroup onValueChange={(v) => field.onChange(v === 'true')} defaultValue={String(field.value)} className="flex space-x-4">
                                <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="false" /></FormControl><FormLabel className="font-normal">Não</FormLabel></FormItem>
                                <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="true" /></FormControl><FormLabel className="font-normal">Sim</FormLabel></FormItem>
                            </RadioGroup></FormControl>
                            <FormDescription>Se sim, apresentar solicitação formal em anexo.</FormDescription>
                        </FormItem>)} />
                    </div>
                     <div className="space-y-4 p-4 border rounded-md">
                        <h3 className="font-semibold">22. PROCESSO INDUSTRIAL</h3>
                         <div className="flex justify-between items-center"><h4 className='font-medium'>Matérias-Primas</h4><Button size="sm" type="button" onClick={() => appendMateriaPrima({})}><PlusCircle className="mr-2 h-4 w-4" /> Add</Button></div>
                        {materiasPrimasFields.map((item, index) => (
                            <div key={item.id} className="grid grid-cols-4 gap-2 items-end">
                                <FormField control={form.control} name={`materiasPrimas.${index}.identificacao`} render={({ field }: any) => (<FormItem><FormLabel>Identificação</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                                <FormField control={form.control} name={`materiasPrimas.${index}.fornecedor`} render={({ field }: any) => (<FormItem><FormLabel>Fornecedor</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                                <FormField control={form.control} name={`materiasPrimas.${index}.consumoMaximo`} render={({ field }: any) => (<FormItem><FormLabel>Consumo Máx.</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                                <FormField control={form.control} name={`materiasPrimas.${index}.consumoAtual`} render={({ field }: any) => (<FormItem><FormLabel>Consumo Atual</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                            </div>
                        ))}
                         <div className="flex justify-between items-center pt-4 mt-4 border-t"><h4 className='font-medium'>Produtos Fabricados</h4><Button size="sm" type="button" onClick={() => appendProdutoFabricado({})}><PlusCircle className="mr-2 h-4 w-4" /> Add</Button></div>
                        {produtosFabricadosFields.map((item, index) => (
                             <div key={item.id} className="grid grid-cols-3 gap-2 items-end">
                                <FormField control={form.control} name={`produtosFabricados.${index}.especificacao`} render={({ field }: any) => (<FormItem><FormLabel>Especificação</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                                <FormField control={form.control} name={`produtosFabricados.${index}.producaoMaxima`} render={({ field }: any) => (<FormItem><FormLabel>Produção Máx. (Kg/mês)</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                                <FormField control={form.control} name={`produtosFabricados.${index}.producaoAtual`} render={({ field }: any) => (<FormItem><FormLabel>Produção Atual (Kg/mês)</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                            </div>
                        ))}
                    </div>
                     <div className="space-y-4 p-4 border rounded-md">
                        <div className="flex justify-between items-center"><h3 className="font-semibold">Principais equipamentos utilizados no processo industrial e nas unidades auxiliares</h3><Button size="sm" type="button" onClick={() => appendEquipamento({})}><PlusCircle className="mr-2 h-4 w-4" /> Add</Button></div>
                        {equipamentosFields.map((item, index) => (
                             <div key={item.id} className="grid grid-cols-3 gap-2 items-end">
                                <FormField control={form.control} name={`equipamentos.${index}.nome`} render={({ field }: any) => (<FormItem><FormLabel>Equipamento</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                                <FormField control={form.control} name={`equipamentos.${index}.capacidadeNominal`} render={({ field }: any) => (<FormItem><FormLabel>Capacidade Nominal</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                                <FormField control={form.control} name={`equipamentos.${index}.potencia`} render={({ field }: any) => (<FormItem><FormLabel>Potência (MW)</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>)} />
                            </div>
                        ))}
                    </div>
                    {/* ... Adicionar outros campos do Módulo 4 ... */}
                </AccordionContent>
            </AccordionItem>
             <AccordionItem value="item-5">
                <AccordionTrigger>MÓDULO 5 – QUADRO RESUMO DOS POSSÍVEIS IMPACTOS AMBIENTAIS</AccordionTrigger>
                 <AccordionContent className="p-1">
                    {/* Campos do Módulo 5 (genéricos) */}
                </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-6">
                <AccordionTrigger>MÓDULO 6 – ZONEAMENTO ECOLÓGICO ECONÔMICO</AccordionTrigger>
                 <AccordionContent className="p-1">
                    {/* Campos do Módulo 6 (genéricos) */}
                </AccordionContent>
            </AccordionItem>
             <AccordionItem value="item-7">
                <AccordionTrigger>MÓDULO 7 ANEXOS QUE ACOMPANHAM O PRESENTE RELATÓRIO</AccordionTrigger>
                 <AccordionContent className="p-1">
                    {/* Campos do Módulo 7 (genéricos) */}
                </AccordionContent>
            </AccordionItem>
        </Accordion>
    );
}
