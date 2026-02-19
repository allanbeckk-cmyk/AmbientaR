
'use client';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
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
import { MapPin, PlusCircle, Trash2 } from 'lucide-react';
import type { AnaliseSolo, AtividadeAgropecuaria, Biome, CoordinateFormat, Datum, Fuso, Irrigacao, Jurisdiction, ManagementCategory, OutraAtividade, OwnerCondition, PhysicalStructure, Project } from '@/lib/types';
import * as React from 'react';
import { ibgeData } from '@/lib/ibge-data';
import { Textarea } from '@/components/ui/textarea';
import { useFieldArray } from 'react-hook-form';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Label } from '@/components/ui/label';

interface FormDefaultProps {
    form: any;
    clients: Project['empreendedorId'][];
    isLoadingClients: boolean;
}

const ownerConditions: { value: OwnerCondition, label: string }[] = [
    { value: 'Proprietário', label: 'Proprietário' },
    { value: 'Arrendatário', label: 'Arrendatário' },
    { value: 'Parceiro', label: 'Parceiro' },
    { value: 'Posseiro', label: 'Posseiro' },
    { value: 'Outros', label: 'Outros' },
];

const datums: { value: Datum, label: string }[] = [
    { value: 'SAD-69', label: 'SAD-69' },
    { value: 'WGS-84', label: 'WGS-84' },
    { value: 'Córrego Alegre', label: 'Córrego Alegre' },
];

const coordinateFormats: { value: CoordinateFormat, label: string }[] = [
    { value: 'Lat/Long', label: 'Geográficas (Lat/Long)' },
    { value: 'UTM', label: 'UTM (X,Y)' },
];

const fusos: { value: Fuso, label: string }[] = [
    { value: '22', label: '22' },
    { value: '23', label: '23' },
    { value: '24', label: '24' },
];

const biomas: { value: Biome; label: string }[] = [
    { value: 'Cerrado', label: 'Cerrado' },
    { value: 'Mata Atlântica', label: 'Mata Atlântica' },
    { value: 'Outro', label: 'Outro' },
];

const nativeVegetationTypes = [
    'Floresta Ombrófila Sub Montana', 'Floresta Ombrófila Montana', 'Floresta Ombrófila Alto Montana',
    'Floresta Estacional Semidecidual Sub Montana', 'Floresta Estacional Semidecidual Montana',
    'Floresta Estacional Decidual Sub Montana', 'Floresta Estacional Decidual Montana', 'Campo',
    'Campo Rupestre', 'Campo Cerrado', 'Cerrado', 'Cerradão', 'Vereda', 'Outro'
];

const managementCategories: { value: ManagementCategory, label: string }[] = [
    { value: 'Uso Sustentável', label: 'Uso Sustentável' },
    { value: 'Proteção Integral', label: 'Proteção Integral' },
];

const jurisdictions: { value: Jurisdiction, label: string }[] = [
    { value: 'Federal', label: 'Federal' },
    { value: 'Estadual', label: 'Estadual' },
    { value: 'Municipal', label: 'Municipal' },
    { value: 'Privada', label: 'Privada' },
];

const dn130Commitments = [
    { id: "rl_fogo", label: "Proteger Reserva Legal contra fogo" },
    { id: "rl_pisoteio", label: "Proteger Reserva Legal contra pisoteio de animais domésticos" },
    { id: "app_fogo", label: "Proteger e preservar a APP contra fogo" },
    { id: "app_pisoteio", label: "Proteger e preservar a APP contra pisoteio de animais domésticos" }
];

const dn130Practices = [
    { id: "agrotoxicos", label: "Utiliza corretamente agrotóxicos" },
    { id: "embalagens_agrotoxico", label: "Destina adequadamente as embalagens de agrotóxico" },
    { id: "residuos_domesticos", label: "Destina adequadamente os resíduos domésticos" },
    { id: "controle_sanitario", label: "Possui controle sanitário efetivo" },
    { id: "conservacao_solo_agua_biota", label: "Utiliza práticas de conservação do solo, água e biota; inclusive adoção de sistema de produção integração lavoura-pecuária-floresta e suas variações, cultivos orgânicos atividades classificadas no Programa de Manejo Integrado de Pragas do MAPA" },
    { id: "outros_agroecologicos", label: "Utiliza outros sistemas agroecológicos" },
    { id: "biodigestores", label: "Utiliza biodigestores ou outras tecnologias apropriadas no sistema de tratamento de todos efluentes" },
    { id: "reserva_legal_preservada", label: "Possui reserva legal preservada com vegetação primária ou em qualquer estágio de regeneração acima do percentual legal" }
];

export function FormDefault({ form, clients, isLoadingClients }: FormDefaultProps) {
    
    const clientsMap = React.useMemo(() => new Map(clients?.map(c => [c.id, c])), [clients]);
    
    const selectedClientId = form.watch('empreendedorId');
    const coordinateFormat = form.watch('geographicLocation.format');
    const selectedUf = form.watch('uf');
    
    const citiesForSelectedUf = React.useMemo(() => {
    return ibgeData.statesWithCities.find(state => state.sigla === selectedUf)?.cidades || [];
    }, [selectedUf]);

    const inApp = form.watch('locationalRestrictions.inPermanentPreservationArea');
    const propertyHasApp = form.watch('locationalRestrictions.propertyHasPermanentPreservationArea');
    const isInConservationUnit = form.watch('conservationUnit.isInConservationUnit');
    const hasFormalCommitment = form.watch('criteriosDN130.compromissoFormal');
    
    const { fields: analiseSoloFields, append: appendAnaliseSolo, remove: removeAnaliseSolo } = useFieldArray({ control: form.control, name: 'analiseSolo' });

    const { fields: olericulturaFields, append: appendOlericultura, remove: removeOlericultura } = useFieldArray({ control: form.control, name: "atividadesAgricolas.olericultura" });
    const { fields: culturasAnuaisFields, append: appendCulturasAnuais, remove: removeCulturasAnuais } = useFieldArray({ control: form.control, name: "atividadesAgricolas.culturasAnuais" });
    const { fields: culturasPerenesFields, append: appendCulturasPerenes, remove: removeCulturasPerenes } = useFieldArray({ control: form.control, name: "atividadesAgricolas.culturasPerenes" });
    
    const { fields: irrigacaoFields, append: appendIrrigacao, remove: removeIrrigacao } = useFieldArray({ control: form.control, name: "irrigacao" });
    
    const { fields: silviculturaFields, append: appendSilvicultura, remove: removeSilvicultura } = useFieldArray({ control: form.control, name: "atividadesFlorestais.silvicultura" });
    const { fields: carvoejamentoFields, append: appendCarvoejamento, remove: removeCarvoejamento } = useFieldArray({ control: form.control, name: "atividadesFlorestais.carvoejamento" });
    
    const { fields: atividadesAgropecuariasFields, append: appendAtividadeAgropecuaria, remove: removeAtividadeAgropecuaria } = useFieldArray({ control: form.control, name: "atividadesAgropecuarias" });

    const { fields: outrasAtividadesFields, append: appendOutraAtividade, remove: removeOutraAtividade } = useFieldArray({ control: form.control, name: "outrasAtividades" });
    
    const { fields: infraestruturaFields, append: appendInfra, remove: removeInfra } = useFieldArray({ control: form.control, name: "physicalStructures" });
    
    const { fields: equipamentoFields, append: appendEquipamento, remove: removeEquipamento } = useFieldArray({ control: form.control, name: 'equipments' });

    const { fields: outrosInsumosFields, append: appendOutroInsumo, remove: removeOutroInsumo } = useFieldArray({ control: form.control, name: "agriculturalInputs.outros" });


    const olericulturaValues = form.watch('atividadesAgricolas.olericultura');
    const culturasAnuaisValues = form.watch('atividadesAgricolas.culturasAnuais');
    const culturasPerenesValues = form.watch('atividadesAgricolas.culturasPerenes');
    
    const silviculturaValues = form.watch('atividadesFlorestais.silvicultura');
    const carvoejamentoValues = form.watch('atividadesFlorestais.carvoejamento');

    const totalOlericultura = React.useMemo(() => olericulturaValues?.reduce((acc: number, item: any) => acc + (Number(item.area) || 0), 0) || 0, [olericulturaValues]);
    const totalCulturasAnuais = React.useMemo(() => culturasAnuaisValues?.reduce((acc: number, item: any) => acc + (Number(item.area) || 0), 0) || 0, [culturasAnuaisValues]);
    const totalCulturasPerenes = React.useMemo(() => culturasPerenesValues?.reduce((acc: number, item: any) => acc + (Number(item.area) || 0), 0) || 0, [culturasPerenesValues]);

    const totalGeralAtividadesAgricolas = totalOlericultura + totalCulturasAnuais + totalCulturasPerenes;
    
    const totalSilvicultura = React.useMemo(() => silviculturaValues?.reduce((acc: number, item: any) => acc + (Number(item.area) || 0), 0) || 0, [silviculturaValues]);
    const totalCarvoejamento = React.useMemo(() => carvoejamentoValues?.reduce((acc: number, item: any) => acc + (Number(item.volume) || 0), 0) || 0, [carvoejamentoValues]);


    return (
        <div className="space-y-6">
            <div className="space-y-4 rounded-md border p-4">
                <h3 className="text-lg font-medium">Dados do Empreendimento</h3>
                <FormField control={form.control} name="propertyName" render={({ field }) => ( <FormItem><FormLabel>Nome da Propriedade</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                <FormField control={form.control} name="fantasyName" render={({ field }) => ( <FormItem><FormLabel>Nome Fantasia</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                <FormField control={form.control} name="matricula" render={({ field }) => ( <FormItem><FormLabel>Matrículas Nº</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                <FormField control={form.control} name="comarca" render={({ field }) => ( <FormItem><FormLabel>Comarca</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
            </div>

            <div className="space-y-4 rounded-md border p-4">
                <h3 className="text-lg font-medium">Endereço</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField control={form.control} name="address" render={({ field }) => (<FormItem className='col-span-2'><FormLabel>Endereço</FormLabel><FormControl><Input placeholder="Rua Principal, 123" {...field} /></FormControl><FormMessage /></FormItem> )} />
                    <FormField control={form.control} name="numero" render={({ field }) => (<FormItem><FormLabel>Número</FormLabel><FormControl><Input placeholder="123" {...field} /></FormControl><FormMessage /></FormItem> )} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField control={form.control} name="uf" render={({ field }) => (
                        <FormItem><FormLabel>UF</FormLabel>
                        <Select onValueChange={(value) => { field.onChange(value); form.setValue('municipio', ''); }} defaultValue={field.value}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Selecione um estado" /></SelectTrigger></FormControl>
                            <SelectContent>{ibgeData.statesWithCities.map(s => <SelectItem key={s.sigla} value={s.sigla}>{s.nome}</SelectItem>)}</SelectContent>
                        </Select><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="municipio" render={({ field }) => (
                        <FormItem><FormLabel>Município</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ''} disabled={!selectedUf}>
                            <FormControl><SelectTrigger><SelectValue placeholder={!selectedUf ? "Selecione um estado primeiro" : "Selecione um município"} /></SelectTrigger></FormControl>
                            <SelectContent>{citiesForSelectedUf.map(city => <SelectItem key={city} value={city}>{city}</SelectItem>)}</SelectContent>
                        </Select><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="cep" render={({ field }) => ( <FormItem><FormLabel>CEP</FormLabel><FormControl><Input placeholder="00000-000" {...field} /></FormControl><FormMessage /></FormItem> )} />
                </div>
                <FormField control={form.control} name="district" render={({ field }) => ( <FormItem><FormLabel>Distrito ou Localidade</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
            </div>

            <div className="space-y-4 rounded-md border p-4">
                 <h3 className="text-lg font-medium">Proprietário</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="empreendedorId" render={({ field }) => (
                        <FormItem><FormLabel>Proprietário / Empreendedor</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoadingClients}>
                            <FormControl><SelectTrigger><SelectValue placeholder={isLoadingClients ? "Carregando..." : "Selecione"} /></SelectTrigger></FormControl>
                            <SelectContent>{clients?.map(client => ( <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem> ))}</SelectContent>
                        </Select><FormMessage /></FormItem>
                    )} />
                    <FormItem><FormLabel>CPF/CNPJ</FormLabel><Input disabled value={clientsMap.get(selectedClientId)?.cpfCnpj || ''} /></FormItem>
                </div>
                <FormField control={form.control} name="ownerCondition" render={() => (
                    <FormItem><FormLabel>Condição do Empreendedor</FormLabel>
                        <div className="flex flex-wrap gap-4">
                            {ownerConditions.map((item) => (
                            <FormField key={item.value} control={form.control} name="ownerCondition" render={({ field }) => (
                                <FormItem key={item.value} className="flex flex-row items-start space-x-2 space-y-0">
                                <FormControl><Checkbox checked={field.value?.includes(item.value)} onCheckedChange={(checked) => checked ? field.onChange([...(field.value || []), item.value]) : field.onChange(field.value?.filter((value: string) => value !== item.value))}/></FormControl>
                                <FormLabel className="font-normal">{item.label}</FormLabel>
                                </FormItem>
                            )} />
                            ))}
                        </div>
                    <FormMessage /></FormItem>
                )} />
            </div>

            <div className="space-y-4 rounded-md border p-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">Localização Geográfica</h3>
                </div>
                <FormField control={form.control} name="geographicLocation.datum" render={({ field }) => (
                    <FormItem className="space-y-3"><FormLabel>Assinalar Datum (Obrigatório)</FormLabel>
                    <FormControl><RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex space-x-4">
                        {datums.map(d => (
                            <FormItem key={d.value} className="flex items-center space-x-2">
                                <FormControl><RadioGroupItem value={d.value} /></FormControl>
                                <FormLabel className="font-normal">{d.label}</FormLabel>
                            </FormItem>
                        ))}
                    </RadioGroup></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="geographicLocation.format" render={({ field }) => (
                    <FormItem className="space-y-3"><FormLabel>Formato da Coordenada</FormLabel>
                    <FormControl><RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex space-x-4">
                        {coordinateFormats.map(f => (
                            <FormItem key={f.value} className="flex items-center space-x-2">
                                <FormControl><RadioGroupItem value={f.value} /></FormControl>
                                <FormLabel className="font-normal">{f.label}</FormLabel>
                            </FormItem>
                        ))}
                    </RadioGroup></FormControl><FormMessage /></FormItem>
                )} />
                
                {coordinateFormat === 'Lat/Long' && (
                    <div className="grid grid-cols-2 gap-x-8 gap-y-4 pt-4 border-t">
                        <div>
                            <FormLabel className="text-center block mb-2 font-semibold">Latitude</FormLabel>
                            <div className="grid grid-cols-3 gap-2">
                                <FormField control={form.control} name="geographicLocation.latLong.lat.grau" render={({ field }) => ( <FormItem><FormLabel className="text-xs">Grau</FormLabel><FormControl><Input placeholder="00" {...field}/></FormControl></FormItem> )} />
                                <FormField control={form.control} name="geographicLocation.latLong.lat.min" render={({ field }) => ( <FormItem><FormLabel className="text-xs">Min</FormLabel><FormControl><Input placeholder="00" {...field}/></FormControl></FormItem> )} />
                                <FormField control={form.control} name="geographicLocation.latLong.lat.seg" render={({ field }) => ( <FormItem><FormLabel className="text-xs">Seg</FormLabel><FormControl><Input placeholder="00" {...field}/></FormControl></FormItem> )} />
                            </div>
                        </div>
                        <div>
                            <FormLabel className="text-center block mb-2 font-semibold">Longitude</FormLabel>
                            <div className="grid grid-cols-3 gap-2">
                                <FormField control={form.control} name="geographicLocation.latLong.long.grau" render={({ field }) => ( <FormItem><FormLabel className="text-xs">Grau</FormLabel><FormControl><Input placeholder="00" {...field}/></FormControl></FormItem> )} />
                                <FormField control={form.control} name="geographicLocation.latLong.long.min" render={({ field }) => ( <FormItem><FormLabel className="text-xs">Min</FormLabel><FormControl><Input placeholder="00" {...field}/></FormControl></FormItem> )} />
                                <FormField control={form.control} name="geographicLocation.latLong.long.seg" render={({ field }) => ( <FormItem><FormLabel className="text-xs">Seg</FormLabel><FormControl><Input placeholder="00" {...field}/></FormControl></FormItem> )} />
                            </div>
                        </div>
                    </div>
                )}
                {coordinateFormat === 'UTM' && (
                    <div className="space-y-4 pt-4 border-t">
                        <div className="grid grid-cols-2 gap-4">
                            <FormField control={form.control} name="geographicLocation.utm.x" render={({ field }) => ( <FormItem><FormLabel>X (6 dígitos)</FormLabel><FormControl><Input {...field}/></FormControl><FormDescription>Não considerar casas decimais</FormDescription></FormItem> )} />
                            <FormField control={form.control} name="geographicLocation.utm.y" render={({ field }) => ( <FormItem><FormLabel>Y (7 dígitos)</FormLabel><FormControl><Input {...field}/></FormControl><FormDescription>Não considerar casas decimais</FormDescription></FormItem> )} />
                        </div>
                        <FormField control={form.control} name="geographicLocation.utm.fuso" render={({ field }) => (
                            <FormItem className="space-y-3 mt-4">
                                <FormLabel>Fuso</FormLabel>
                                <FormControl><RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex space-x-4">
                                    {fusos.map(f => (
                                    <FormItem key={f.value} className="flex items-center space-x-2">
                                        <FormControl><RadioGroupItem value={f.value} /></FormControl>
                                        <FormLabel className="font-normal">{f.label}</FormLabel>
                                    </FormItem>
                                    ))}
                                </RadioGroup></FormControl><FormMessage />
                            </FormItem>
                        )} />
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                    <FormField control={form.control} name="geographicLocation.local" render={({ field }) => ( <FormItem><FormLabel>Local (Fazenda, Sítio, etc.)</FormLabel><FormControl><Input {...field}/></FormControl></FormItem> )} />
                    <FormField control={form.control} name="geographicLocation.additionalLocationInfo" render={({ field }) => ( <FormItem><FormLabel>Informação adicional para localização</FormLabel><FormControl><Input placeholder="Ex: Próximo à ponte sobre o Rio..." {...field}/></FormControl></FormItem> )} />
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="geographicLocation.hydrographicBasin" render={({ field }) => ( <FormItem><FormLabel>Bacia Hidrográfica</FormLabel><FormControl><Input {...field}/></FormControl></FormItem> )} />
                    <FormField control={form.control} name="geographicLocation.upgrh" render={({ field }) => ( <FormItem><FormLabel>UPGRH</FormLabel><FormControl><Input {...field}/></FormControl></FormItem> )} />
                </div>
                <FormField control={form.control} name="geographicLocation.nearestWaterCourse" render={({ field }) => ( <FormItem><FormLabel>Curso d'água mais próximo</FormLabel><FormControl><Input {...field}/></FormControl></FormItem> )} />
            </div>
            
            <div className="space-y-4 rounded-md border p-4">
                <h3 className="text-lg font-medium">Restrições Locacionais</h3>
                <FormField
                    control={form.control}
                    name="locationalRestrictions.biome"
                    render={({ field }) => (
                        <FormItem className="space-y-3">
                            <FormLabel>Qual Bioma o empreendimento está localizado?</FormLabel>
                            <FormControl>
                                <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex space-x-4">
                                    {biomas.map(b => (
                                        <FormItem key={b.value} className="flex items-center space-x-2">
                                            <FormControl><RadioGroupItem value={b.value} /></FormControl>
                                            <FormLabel className="font-normal">{b.label}</FormLabel>
                                        </FormItem>
                                    ))}
                                </RadioGroup>
                            </FormControl>
                            {form.watch('locationalRestrictions.biome') === 'Outro' && (
                                <FormField control={form.control} name="locationalRestrictions.biomeOther" render={({ field }) => (<FormItem className='pt-2'><FormLabel>Qual?</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                            )}
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="locationalRestrictions.nativeVegetation"
                    render={() => (
                        <FormItem className='pt-4 border-t'>
                            <FormLabel>O empreendimento está localizado em área com remanescente de formações vegetais nativas?</FormLabel>
                            <FormDescription>Consulte o Inventário Florestal de Minas Gerais.</FormDescription>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                {nativeVegetationTypes.map((item) => (
                                    <FormField key={item} control={form.control} name="locationalRestrictions.nativeVegetation"
                                        render={({ field }) => {
                                            return (
                                                <FormItem className="flex flex-row items-start space-x-2 space-y-0">
                                                    <FormControl><Checkbox checked={field.value?.includes(item)} onCheckedChange={(checked) => checked ? field.onChange([...(field.value || []), item]) : field.onChange(field.value?.filter((value: string) => value !== item))}/></FormControl>
                                                    <FormLabel className="text-sm font-normal">{item}</FormLabel>
                                                </FormItem>
                                            )
                                        }}
                                    />
                                ))}
                            </div>
                            {form.watch('locationalRestrictions.nativeVegetation')?.includes('Outro') && (
                                <FormField control={form.control} name="locationalRestrictions.nativeVegetationOther" render={({ field }) => (<FormItem className='pt-2'><FormLabel>Qual?</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                            )}
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField control={form.control} name="locationalRestrictions.inPermanentPreservationArea" render={({ field }) => (
                    <FormItem className="space-y-2 pt-4 border-t"><FormLabel>O empreendimento está localizado em Área de Preservação Permanente – APP?</FormLabel><FormControl>
                       <RadioGroup onValueChange={(v) => field.onChange(v === 'true')} defaultValue={String(field.value)} className="flex space-x-4">
                            <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="true" /></FormControl><FormLabel className="font-normal">Sim</FormLabel></FormItem>
                            <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="false" /></FormControl><FormLabel className="font-normal">Não</FormLabel></FormItem>
                        </RadioGroup>
                    </FormControl></FormItem>
                )}/>
                <FormField control={form.control} name="locationalRestrictions.propertyHasPermanentPreservationArea" render={({ field }) => (
                    <FormItem className="space-y-2"><FormLabel>O empreendimento se localiza em propriedade que possui Área de Preservação Permanente – APP?</FormLabel><FormControl>
                        <RadioGroup onValueChange={(v) => field.onChange(v === 'true')} defaultValue={String(field.value)} className="flex space-x-4">
                            <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="true" /></FormControl><FormLabel className="font-normal">Sim</FormLabel></FormItem>
                            <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="false" /></FormControl><FormLabel className="font-normal">Não</FormLabel></FormItem>
                        </RadioGroup>
                    </FormControl></FormItem>
                )}/>
                {(inApp || propertyHasApp) && (
                    <div className="pl-4 border-l-2 space-y-4">
                        <FormField control={form.control} name="locationalRestrictions.isPermanentPreservationAreaPreserved" render={({ field }) => (
                            <FormItem className="space-y-2"><FormLabel>A APP se encontra comprovadamente preservada?</FormLabel><FormControl>
                                <RadioGroup onValueChange={(v) => field.onChange(v === 'true')} defaultValue={String(field.value)} className="flex space-x-4">
                                    <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="true" /></FormControl><FormLabel className="font-normal">Sim</FormLabel></FormItem>
                                    <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="false" /></FormControl><FormLabel className="font-normal">Não</FormLabel></FormItem>
                                </RadioGroup>
                            </FormControl></FormItem>
                        )}/>
                        <FormField control={form.control} name="locationalRestrictions.isPermanentPreservationAreaProtected" render={({ field }) => (
                            <FormItem className="space-y-2"><FormLabel>A APP está protegida?</FormLabel><FormControl>
                                <RadioGroup onValueChange={(v) => field.onChange(v === 'true')} defaultValue={String(field.value)} className="flex space-x-4">
                                    <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="true" /></FormControl><FormLabel className="font-normal">Sim</FormLabel></FormItem>
                                    <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="false" /></FormControl><FormLabel className="font-normal">Não</FormLabel></FormItem>
                                </RadioGroup>
                            </FormControl></FormItem>
                        )}/>
                    </div>
                )}
                 <FormField control={form.control} name="locationalRestrictions.inKarstArea" render={({ field }) => (
                    <FormItem className="space-y-2 pt-4 border-t"><FormLabel>O empreendimento localiza-se totalmente ou em parte em área cárstica?</FormLabel><FormControl>
                       <RadioGroup onValueChange={(v) => field.onChange(v === 'true')} defaultValue={String(field.value)} className="flex space-x-4">
                            <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="true" /></FormControl><FormLabel className="font-normal">Sim</FormLabel></FormItem>
                            <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="false" /></FormControl><FormLabel className="font-normal">Não</FormLabel></FormItem>
                        </RadioGroup>
                    </FormControl></FormItem>
                )}/>
                 <FormField control={form.control} name="locationalRestrictions.inFluvialLacustrineArea" render={({ field }) => (
                    <FormItem className="space-y-2 pt-4 border-t"><FormLabel>O empreendimento localiza-se totalmente ou em parte em área fluvial/lacustre?</FormLabel><FormControl>
                       <RadioGroup onValueChange={(v) => field.onChange(v === 'true')} defaultValue={String(field.value)} className="flex space-x-4">
                            <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="true" /></FormControl><FormLabel className="font-normal">Sim</FormLabel></FormItem>
                            <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="false" /></FormControl><FormLabel className="font-normal">Não</FormLabel></FormItem>
                        </RadioGroup>
                    </FormControl></FormItem>
                )}/>

            </div>

             <div className="space-y-4 rounded-md border p-4">
                <h3 className="text-lg font-medium">11. Unidades de Conservação</h3>
                <FormField
                    control={form.control}
                    name="conservationUnit.isInConservationUnit"
                    render={({ field }) => (
                        <FormItem className="space-y-3">
                            <FormLabel>O empreendimento está situado dentro de unidade de conservação ou dentro de zona de amortecimento de unidade de conservação (§ 2º do art. 25 da Lei Federal 9.985/2000) ou num raio de 10 km de área circundante de UC (art. 2° da Resolução CONAMA 13/90)?</FormLabel>
                            <FormControl>
                                <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex space-x-4">
                                    <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="Sim" /></FormControl><FormLabel className="font-normal">Sim</FormLabel></FormItem>
                                    <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="Não" /></FormControl><FormLabel className="font-normal">Não</FormLabel></FormItem>
                                </RadioGroup>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                {isInConservationUnit === 'Sim' && (
                    <div className="pl-4 border-l-2 space-y-4 mt-4">
                        <FormDescription>Processos de regularização ambiental para empreendimentos localizados em UC ou seu entorno, somente são formalizados com a anuência do órgão gestor. Favor colocar em anexo e preencher informações abaixo.</FormDescription>
                        <FormField control={form.control} name="conservationUnit.distance" render={({ field }) => (<FormItem><FormLabel>Distância</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                        <FormField control={form.control} name="conservationUnit.ucName" render={({ field }) => (<FormItem><FormLabel>Nome da UC</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                         <FormField
                            control={form.control}
                            name="conservationUnit.managementCategory"
                            render={({ field }) => (
                                <FormItem className="space-y-3">
                                <FormLabel>Categoria de Manejo?</FormLabel>
                                <FormControl>
                                    <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex space-x-4">
                                        {managementCategories.map(cat => <FormItem key={cat.value} className="flex items-center space-x-2"><FormControl><RadioGroupItem value={cat.value} /></FormControl><FormLabel className="font-normal">{cat.label}</FormLabel></FormItem>)}
                                    </RadioGroup>
                                </FormControl>
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="conservationUnit.jurisdiction"
                            render={({ field }) => (
                                <FormItem className="space-y-3">
                                <FormLabel>Jurisdição</FormLabel>
                                <FormControl>
                                    <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex space-x-4">
                                        {jurisdictions.map(j => <FormItem key={j.value} className="flex items-center space-x-2"><FormControl><RadioGroupItem value={j.value} /></FormControl><FormLabel className="font-normal">{j.label}</FormLabel></FormItem>)}
                                    </RadioGroup>
                                </FormControl>
                                </FormItem>
                            )}
                        />
                         <FormField control={form.control} name="conservationUnit.managingBody" render={({ field }) => (<FormItem><FormLabel>Informar o órgão gestor</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                    </div>
                )}
            </div>

            <div className="space-y-4 rounded-md border p-4">
                <h3 className="text-lg font-medium">12. Critérios adicionais para enquadramento de classe, conforme DN 130/2008</h3>
                 <FormField control={form.control} name="criteriosDN130.possuiRPPN" render={({ field }) => (<FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm"><FormLabel>Possui Reserva Particular de Patrimônio Natural – RPPN na propriedade objeto de regularização ambiental?</FormLabel><FormControl><RadioGroup onValueChange={(v) => field.onChange(v === 'true')} defaultValue={String(field.value)} className="flex space-x-4"><FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="true" /></FormControl><FormLabel className="font-normal">Sim</FormLabel></FormItem><FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="false" /></FormControl><FormLabel className="font-normal">Não</FormLabel></FormItem></RadioGroup></FormControl></FormItem>)} />
                 <FormField control={form.control} name="criteriosDN130.areaAntropizadaConsolidada" render={({ field }) => (<FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm"><FormLabel>Está localizado em área antropizada com ocupação devidamente consolidada?</FormLabel><FormControl><RadioGroup onValueChange={(v) => field.onChange(v === 'true')} defaultValue={String(field.value)} className="flex space-x-4"><FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="true" /></FormControl><FormLabel className="font-normal">Sim</FormLabel></FormItem><FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="false" /></FormControl><FormLabel className="font-normal">Não</FormLabel></FormItem></RadioGroup></FormControl></FormItem>)} />
                 <FormField control={form.control} name="criteriosDN130.reservaLegalProtegidaFogo" render={({ field }) => (<FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm"><FormLabel>A Reserva Legal encontra-se protegida contra fogo?</FormLabel><FormControl><RadioGroup onValueChange={(v) => field.onChange(v === 'true')} defaultValue={String(field.value)} className="flex space-x-4"><FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="true" /></FormControl><FormLabel className="font-normal">Sim</FormLabel></FormItem><FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="false" /></FormControl><FormLabel className="font-normal">Não</FormLabel></FormItem></RadioGroup></FormControl></FormItem>)} />
                 <FormField control={form.control} name="criteriosDN130.reservaLegalProtegidaPisoteio" render={({ field }) => (<FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm"><FormLabel>A Reserva Legal encontra-se protegida contra pisoteio de animais domésticos?</FormLabel><FormControl><RadioGroup onValueChange={(v) => field.onChange(v === 'true')} defaultValue={String(field.value)} className="flex space-x-4"><FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="true" /></FormControl><FormLabel className="font-normal">Sim</FormLabel></FormItem><FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="false" /></FormControl><FormLabel className="font-normal">Não</FormLabel></FormItem></RadioGroup></FormControl></FormItem>)} />
                 <FormField control={form.control} name="criteriosDN130.appProtegidaFogo" render={({ field }) => (<FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm"><FormLabel>A APP encontra-se protegida contra fogo?</FormLabel><FormControl><RadioGroup onValueChange={(v) => field.onChange(v === 'true')} defaultValue={String(field.value)} className="flex space-x-4"><FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="true" /></FormControl><FormLabel className="font-normal">Sim</FormLabel></FormItem><FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="false" /></FormControl><FormLabel className="font-normal">Não</FormLabel></FormItem></RadioGroup></FormControl></FormItem>)} />
                 <FormField control={form.control} name="criteriosDN130.appProtegidaPisoteio" render={({ field }) => (<FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm"><FormLabel>A APP encontra-se protegida contra pisoteio de animais domésticos?</FormLabel><FormControl><RadioGroup onValueChange={(v) => field.onChange(v === 'true')} defaultValue={String(field.value)} className="flex space-x-4"><FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="true" /></FormControl><FormLabel className="font-normal">Sim</FormLabel></FormItem><FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="false" /></FormControl><FormLabel className="font-normal">Não</FormLabel></FormItem></RadioGroup></FormControl></FormItem>)} />
                
                 <FormField control={form.control} name="criteriosDN130.compromissoFormal" render={({ field }) => (<FormItem><FormLabel>Tem compromisso formal com Órgão competente, especificando atos e cronogramas de execução?</FormLabel><FormControl><RadioGroup onValueChange={(v) => field.onChange(v === 'true')} defaultValue={String(field.value)} className="flex space-x-4">
                    <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="false" /></FormControl><FormLabel className="font-normal">Não</FormLabel></FormItem>
                    <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="true" /></FormControl><FormLabel className="font-normal">Sim</FormLabel></FormItem>
                </RadioGroup></FormControl></FormItem>)} />
                 {hasFormalCommitment && (
                    <FormField control={form.control} name="criteriosDN130.compromissos" render={() => (
                        <FormItem className="pl-4 border-l-2 space-y-2">
                        <FormLabel>Se sim, para:</FormLabel>
                        {dn130Commitments.map(item => (
                            <FormField key={item.id} control={form.control} name="criteriosDN130.compromissos"
                                render={({ field }) => (<FormItem className="flex items-center space-x-2"><FormControl><Checkbox checked={field.value?.includes(item.id)} onCheckedChange={c => c ? field.onChange([...(field.value || []), item.id]) : field.onChange(field.value?.filter((v: string) => v !== item.id))} /></FormControl><FormLabel className="font-normal">{item.label}</FormLabel></FormItem>)}
                            />
                        ))}
                        </FormItem>
                    )} />
                )}

                <FormField control={form.control} name="criteriosDN130.adotaSistemasReducaoVulnerabilidade" render={({ field }) => (<FormItem><FormLabel>Adota Sistemas de produção e controle para redução da vulnerabilidade ambiental?</FormLabel><FormControl><RadioGroup onValueChange={(v) => field.onChange(v === 'true')} defaultValue={String(field.value)} className="flex space-x-4">
                    <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="true" /></FormControl><FormLabel className="font-normal">Sim</FormLabel></FormItem>
                    <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="false" /></FormControl><FormLabel className="font-normal">Não</FormLabel></FormItem>
                </RadioGroup></FormControl></FormItem>)} />
                {form.watch('criteriosDN130.adotaSistemasReducaoVulnerabilidade') && (
                    <FormField control={form.control} name="criteriosDN130.sistemasReducaoDescricao" render={({ field }) => (<FormItem><FormLabel>Descreva o sistema de produção e controle</FormLabel><FormControl><Textarea {...field} /></FormControl></FormItem>)} />
                )}

                <FormField control={form.control} name="criteriosDN130.usaQueimaCana" render={({ field }) => (<FormItem><FormLabel>O empreendimento faz uso da queima de cana de açúcar como método facilitador da colheita?</FormLabel><FormControl><RadioGroup onValueChange={(v) => field.onChange(v === 'true')} defaultValue={String(field.value)} className="flex space-x-4">
                    <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="true" /></FormControl><FormLabel className="font-normal">Sim</FormLabel></FormItem>
                    <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="false" /></FormControl><FormLabel className="font-normal">Não</FormLabel></FormItem>
                </RadioGroup></FormControl></FormItem>)} />
                
                 <FormField control={form.control} name="criteriosDN130.praticasDesenvolvidas" render={() => (
                    <FormItem className="pt-4 border-t">
                        <FormLabel>Quais as práticas a seguir são desenvolvidas pelo empreendimento com comprovação por atestado emitido por profissional da Secretaria de Estado de Agricultura, Pecuária e Abastecimento e/ou entidades vinculadas?</FormLabel>
                        <FormDescription>Apresentar em anexo o(s) atestado(s).</FormDescription>
                        {dn130Practices.map(item => (<FormField key={item.id} control={form.control} name="criteriosDN130.praticasDesenvolvidas"
                            render={({ field }) => (<FormItem className="flex flex-row items-start space-x-3 space-y-0"><FormControl>
                                <Checkbox checked={field.value?.includes(item.id)} onCheckedChange={checked => checked ? field.onChange([...(field.value || []), item.id]) : field.onChange(field.value?.filter(v => v !== item.id))} />
                            </FormControl><FormLabel className="font-normal">{item.label}</FormLabel></FormItem>
                            )}
                        />))}
                        {form.watch('criteriosDN130.praticasDesenvolvidas')?.includes('outros_agroecologicos') && (
                            <FormField control={form.control} name="criteriosDN130.outrosSistemasAgroecologicos" render={({ field }) => (<FormItem className="mt-2"><FormLabel>Descreva outros sistemas agroecológicos</FormLabel><FormControl><Textarea {...field} /></FormControl></FormItem>)} />
                        )}
                    </FormItem>
                )} />

            </div>
            
            <div className="space-y-4 rounded-md border p-4">
                <h3 className="text-lg font-medium">13. TRABALHADORES/ EMPREGADOS/ FUNCIONÁRIOS</h3>
                 <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                     <FormField control={form.control} name="jobCreation.fixos" render={({ field }) => ( <FormItem><FormLabel>Nº de Funcionários Fixos</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem> )} />
                     <FormField control={form.control} name="jobCreation.temporarios" render={({ field }) => ( <FormItem><FormLabel>Nº de Funcionários Temporários</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem> )} />
                     <FormField control={form.control} name="jobCreation.terceirizados" render={({ field }) => ( <FormItem><FormLabel>Nº de Funcionários Terceirizados</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem> )} />
                     <FormField control={form.control} name="jobCreation.residentFamilies" render={({ field }) => ( <FormItem><FormLabel>Nº de Famílias Residentes</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem> )} />
                </div>
            </div>

            <div className="space-y-4 rounded-md border p-4">
                <h3 className="text-lg font-medium">14. ÁREA DO EMPREENDIMENTO</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="projectArea.totalArea" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Área total do terreno (ha)</FormLabel>
                            <FormControl><Input type="number" {...field} /></FormControl>
                        </FormItem>
                    )} />
                    <FormField control={form.control} name="projectArea.builtArea" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Área construída (ha)</FormLabel>
                            <FormControl><Input type="number" {...field} /></FormControl>
                        </FormItem>
                    )} />
                </div>
                <FormDescription>Incluir todas as áreas de administração e serviços vinculados ao proprietário ou locador do empreendimento.</FormDescription>
                <FormDescription className="italic">* Apresentar em anexo croqui de localização, mapa de uso do solo e relatório.</FormDescription>
            </div>
        </div>
    );
}


    
