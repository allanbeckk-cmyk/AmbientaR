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
import type { Empreendedor as Client, Project, OwnerCondition, Datum, Fuso, RegularizacaoSituacao, ManagementCategory, Jurisdiction, Biome, AtividadeAgricola, ZeeGeofisicoItem, ZeeSocioeconomicoItem } from '@/lib/types';
import { Textarea } from '@/components/ui/textarea';
import { PlusCircle, Trash2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface RcaFormFundidosNaoFerrososProps {
    form: any;
    clients: Client[];
    isLoadingClients: boolean;
    projects: Project[];
    isLoadingProjects: boolean;
}

export function RcaFormFundidosNaoFerrosos({ form, clients, isLoadingClients, projects, isLoadingProjects }: RcaFormFundidosNaoFerrososProps) {
    
    const { fields: outrasAtividadesFields, append: appendOutraAtividade, remove: removeOutraAtividade } = useFieldArray({ control: form.control, name: 'outrasAtividades' });
    const { fields: fornecedoresMadeiraFields, append: appendFornecedorMadeira, remove: removeFornecedorMadeira } = useFieldArray({ control: form.control, name: 'fornecedoresMadeira' });
    const { fields: fornecedoresMinerioFields, append: appendFornecedorMinerio, remove: removeFornecedorMinerio } = useFieldArray({ control: form.control, name: 'fornecedoresMinerio' });
    const { fields: materiasPrimasFields, append: appendMateriaPrima, remove: removeMateriaPrima } = useFieldArray({ control: form.control, name: 'materiasPrimas' });
    const { fields: fornosFields, append: appendForno, remove: removeForno } = useFieldArray({ control: form.control, name: 'fornos' });
    
    return (
        <Accordion type="multiple" defaultValue={['item-4']} className="w-full">
            {/* Os Módulos 1, 2 e 3 são genéricos e já estão no formulário principal (rca-form.tsx) */}
            <AccordionItem value="item-4">
                <AccordionTrigger>MÓDULO 4 - CARACTERIZAÇÃO DO EMPREENDIMENTO E ENTORNO</AccordionTrigger>
                <AccordionContent className="space-y-6 p-1">
                    {/* Simplified for brevity - You would add all fields from the Termo de Referência here. */}
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
                     <div className="space-y-4 p-4 border rounded-md">
                        <h3 className="font-semibold">32. CONSOLIDAÇÃO DA RELAÇÃO DE MATÉRIAS-PRIMAS PRINCIPAIS E DE MATERIAIS INTERMEDIÁRIOS</h3>
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
                        <h3 className="font-semibold">35.3 Especificações dos fornos de redução para produção de ferro-ligas do empreendimento</h3>
                         <div className="flex justify-end">
                            <Button size="sm" type="button" onClick={() => appendForno({})}><PlusCircle className="mr-2 h-4 w-4" /> Adicionar Forno</Button>
                        </div>
                         {fornosFields.map((item, index) => (
                             <div key={item.id} className="p-4 border rounded-md space-y-4 relative">
                                <Button type="button" variant="destructive" size="icon" className="absolute top-2 right-2 h-6 w-6" onClick={() => removeForno(index)}><Trash2 className="h-4 w-4" /></Button>
                                <h4 className="font-medium">Forno {index + 1}</h4>
                                 <FormField control={form.control} name={`fornos.${index}.tipoForno`} render={({ field }: any) => (<FormItem><FormLabel>Tipo de Forno</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                                <FormField control={form.control} name={`fornos.${index}.identificacao`} render={({ field }: any) => (<FormItem><FormLabel>Identificação</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                                <FormField control={form.control} name={`fornos.${index}.volumeUtil`} render={({ field }: any) => (<FormItem><FormLabel>Volume Útil (m³)</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>)} />
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
