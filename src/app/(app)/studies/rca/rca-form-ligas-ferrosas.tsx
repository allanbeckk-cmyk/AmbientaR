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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { PlusCircle, Trash2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface RcaFormLigasFerrosasProps {
    form: any;
    clients: Client[];
    isLoadingClients: boolean;
    projects: Project[];
    isLoadingProjects: boolean;
}

export function RcaFormLigasFerrosas({ form, clients, isLoadingClients, projects, isLoadingProjects }: RcaFormLigasFerrosasProps) {
    
    const { fields: outrasAtividadesFields, append: appendOutraAtividade, remove: removeOutraAtividade } = useFieldArray({ control: form.control, name: 'outrasAtividades' });
    const { fields: fornecedoresMadeiraFields, append: appendFornecedorMadeira, remove: removeFornecedorMadeira } = useFieldArray({ control: form.control, name: 'fornecedoresMadeira' });
    const { fields: fornecedoresMinerioFields, append: appendFornecedorMinerio, remove: removeFornecedorMinerio } = useFieldArray({ control: form.control, name: 'fornecedoresMinerio' });
    const { fields: residuosTerceirosFields, append: appendResiduoTerceiro, remove: removeResiduoTerceiro } = useFieldArray({ control: form.control, name: 'residuosTerceiros' });
    const { fields: materiasPrimasFields, append: appendMateriaPrima, remove: removeMateriaPrima } = useFieldArray({ control: form.control, name: 'materiasPrimas' });
    const { fields: reatoresFields, append: appendReator, remove: removeReator } = useFieldArray({ control: form.control, name: 'reatores' });


    return (
        <Accordion type="multiple" defaultValue={['item-1']} className="w-full">
            {/* Os Módulos 1, 2 e 3 são genéricos e já estão no formulário principal. */}
            <AccordionItem value="item-4">
                <AccordionTrigger>MÓDULO 4 - CARACTERIZAÇÃO DO EMPREENDIMENTO E ENTORNO</AccordionTrigger>
                <AccordionContent className="space-y-6 p-1">
                    <div className="space-y-4 p-4 border rounded-md">
                        <div className="flex justify-between items-center"><h3 className="font-semibold">12. OUTRAS ATIVIDADES NÃO DESCRITAS</h3><Button size="sm" type="button" onClick={() => appendOutraAtividade({})}><PlusCircle className="mr-2 h-4 w-4" /> Add</Button></div>
                        {outrasAtividadesFields.map((item, index) => (
                            <div key={item.id} className="grid grid-cols-5 gap-2 items-end">
                                <FormField control={form.control} name={`outrasAtividades.${index}.especificacao`} render={({ field }: any) => (<FormItem className='col-span-2'><FormLabel>Especificação</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                                <FormField control={form.control} name={`outrasAtividades.${index}.codigo`} render={({ field }: any) => (<FormItem><FormLabel>Código</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                                <FormField control={form.control} name={`outrasAtividades.${index}.unidade`} render={({ field }: any) => (<FormItem><FormLabel>Unidade</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                                <FormField control={form.control} name={`outrasAtividades.${index}.quantidade`} render={({ field }: any) => (<FormItem><FormLabel>Quantidade</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                            </div>
                        ))}
                    </div>
                    {/* ... (itens 13 a 27) ... */}
                    <div className="space-y-4 p-4 border rounded-md">
                        <h3 className="font-semibold">28. USO DE MADEIRA OU DE CARVÃO VEGETAL</h3>
                         <FormField control={form.control} name="usoMadeira.consome" render={({ field }: any) => (<FormItem><FormLabel>Consome carvão vegetal ou madeira?</FormLabel><FormControl><RadioGroup onValueChange={(v) => field.onChange(v === 'true')} defaultValue={String(field.value)} className="flex space-x-4">
                            <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="true" /></FormControl><FormLabel className="font-normal">Sim</FormLabel></FormItem>
                            <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="false" /></FormControl><FormLabel className="font-normal">Não</FormLabel></FormItem>
                        </RadioGroup></FormControl></FormItem>)} />
                        {/* ... mais campos ... */}
                    </div>
                     <div className="space-y-4 p-4 border rounded-md">
                        <h3 className="font-semibold">33. CONSOLIDAÇÃO DA RELAÇÃO DE MATÉRIAS-PRIMAS PRINCIPAIS E DE MATERIAIS INTERMEDIÁRIOS</h3>
                        <div className="flex justify-end">
                            <Button size="sm" type="button" onClick={() => appendMateriaPrima({})}><PlusCircle className="mr-2 h-4 w-4" /> Adicionar Matéria-Prima</Button>
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
                        <h3 className="font-semibold">35.3 Especificações dos fornos de redução para produção de ferro-ligas do empreendimento</h3>
                         <div className="flex justify-end">
                            <Button size="sm" type="button" onClick={() => appendReator({})}><PlusCircle className="mr-2 h-4 w-4" /> Adicionar Forno</Button>
                        </div>
                         {reatoresFields.map((item, index) => (
                             <div key={item.id} className="p-4 border rounded-md space-y-4 relative">
                                <Button type="button" variant="destructive" size="icon" className="absolute top-2 right-2 h-6 w-6" onClick={() => removeReator(index)}><Trash2 className="h-4 w-4" /></Button>
                                <h4 className="font-medium">Forno {index + 1}</h4>
                                 <FormField control={form.control} name={`reatores.${index}.tipoForno`} render={({ field }: any) => (<FormItem><FormLabel>Tipo de Forno</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                                <FormField control={form.control} name={`reatores.${index}.identificacao`} render={({ field }: any) => (<FormItem><FormLabel>Identificação</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                                <FormField control={form.control} name={`reatores.${index}.volumeUtil`} render={({ field }: any) => (<FormItem><FormLabel>Volume Útil (m³)</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>)} />
                             </div>
                        ))}
                    </div>
                    {/* Outros campos do módulo 4 */}
                </AccordionContent>
            </AccordionItem>
            {/* Outros módulos */}
        </Accordion>
    );
}
