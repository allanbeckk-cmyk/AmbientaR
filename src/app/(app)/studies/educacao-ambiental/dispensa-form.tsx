'use client';

import * as React from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { MaskedInput } from '@/components/ui/masked-input';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { DispensaPEA, Empreendedor, TechnicalResponsible } from '@/lib/types';
import { useFirebase, errorEmitter, useCollection, useMemoFirebase } from '@/firebase';
import { FirestorePermissionError } from '@/firebase/errors';
import { collection, doc, addDoc, updateDoc } from 'firebase/firestore';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { SignaturePad } from '@/components/ui/signature-pad';


const formSchema = z.object({
  empreendedorId: z.string().min(1, 'Selecione um empreendedor.'),
  // Empreendedor fields (auto-filled)
  razaoSocialEmpreendedor: z.string().optional(),
  nomeFantasiaEmpreendedor: z.string().optional(),
  cnpjEmpreendedor: z.string().optional(),
  logradouroEmpreendedor: z.string().optional(),
  numeroEmpreendedor: z.string().optional(),
  complementoEmpreendedor: z.string().optional(),
  bairroEmpreendedor: z.string().optional(),
  municipioEmpreendedor: z.string().optional(),
  ufEmpreendedor: z.string().optional(),
  cepEmpreendedor: z.string().optional(),
  telefoneComercialEmpreendedor: z.string().optional(),
  telefoneCelularEmpreendedor: z.string().optional(),
  emailEmpreendedor: z.string().optional(),

  // Empreendimento fields (manual fill)
  razaoSocial: z.string().optional(),
  nomeFantasia: z.string().optional(),
  cnpj: z.string().optional(),
  logradouro: z.string().optional(),
  numero: z.string().optional(),
  complemento: z.string().optional(),
  bairro: z.string().optional(),
  municipio: z.string().optional(),
  uf: z.string().optional(),
  cep: z.string().optional(),
  telefoneComercial: z.string().optional(),
  telefoneCelular: z.string().optional(),
  email: z.string().optional(),
  coordenadas: z.object({
      latitude: z.string().optional(),
      longitude: z.string().optional(),
  }).optional(),

  // Licenciamento fields
  processoAdministrativo: z.string().optional(),
  solicitacaoLicenciamento: z.string().optional(),
  faseProcesso: z.string().optional(),
  ampliacaoAlteracao: z.enum(['sim', 'nao']).optional(),
  classeEmpreendimento: z.enum(['3', '4', '5', '6']).optional(),
  porteEmpreendimento: z.enum(['P', 'M', 'G']).optional(),
  codigoTipologia: z.string().optional(),
  tipologia: z.string().optional(),
  possuiLicenca: z.enum(['sim', 'nao']).optional(),
  licencaAnterior: z.object({
    numeroProcesso: z.string().optional(),
    tipoLicenca: z.string().optional(),
    objeto: z.string().optional(),
    dataConcessao: z.string().optional(),
    validade: z.string().optional(),
  }).optional(),
  possuiPea: z.enum(['sim', 'nao']).optional(),
  peaConformeDN: z.enum(['sim', 'nao']).optional(),


  // Justificativa
  justificativa: z.string().min(20, "A justificativa deve ter no mínimo 20 caracteres."),
  solicitacaoParcial: z.boolean().optional(),
  dispensaParcialCampos: z.array(z.string()).optional(),
  dispensaParcialOutro: z.string().optional(),
  caracterizacaoSocioeconomica: z.string().optional(),

  // Responsável pelo preenchimento
  responsavel: z.object({
    id: z.string().optional(), // ID do responsável técnico se selecionado
    nome: z.string().min(1, 'Nome do responsável é obrigatório'),
    documento: z.string().min(1, 'RG ou CPF é obrigatório'),
    formacao: z.string().min(1, 'Formação é obrigatória'),
    cargo: z.string().min(1, 'Cargo/vínculo é obrigatório'),
    localData: z.string().min(1, 'Local e data são obrigatórios'),
    assinaturaUrl: z.string().optional(),
  }).optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface DispensaFormProps {
  currentItem?: DispensaPEA | null;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const fasesLicenciamento = [
    "Licença Prévia - LP",
    "Licença de Instalação - LI",
    "Licença de Operação - LO",
    "Licença de Renovação de Instalação",
    "Licença de Renovação de Operação",
    "Licença de Instalação Corretiva - LIC",
    "Licença de Operação Corretiva - LOC",
    "Licença Prévia e de Instalação Concomitantes - LP+LI",
    "Licença de Instalação e Operação Concomitantes - LI+LO",
    "Licença Prévia, de Instalação e Operação Concomitantes - LP+LI+LO"
];

const dispensaParcialOptions = [
    { id: 'publico_interno_instalacao', label: 'Público-alvo interno, durante a instalação do empreendimento' },
    { id: 'publico_interno_operacao', label: 'Público-alvo interno, durante a operação do empreendimento' },
    { id: 'publico_externo_instalacao', label: 'Público-alvo externo, durante a instalação do empreendimento' },
    { id: 'publico_externo_operacao', label: 'Público-alvo externo, durante a operação do empreendimento' },
    { id: 'dsp_flutuante', label: 'Diagnóstico Socioambiental Participativo - DSP para o público flutuante' },
    { id: 'revisao_pea_licenca', label: 'Revisão e/ou complementação do PEA para a obtenção de licença ambiental' },
]

export function DispensaForm({ currentItem, onSuccess, onCancel }: DispensaFormProps) {
  const [loading, setLoading] = React.useState(false);
  const { toast } = useToast();
  const { firestore } = useFirebase();

  const empreendedoresQuery = useMemoFirebase(() => firestore ? collection(firestore, 'empreendedores') : null, [firestore]);
  const { data: empreendedores, isLoading: isLoadingEmpreendedores } = useCollection<Empreendedor>(empreendedoresQuery);

  const responsiblesQuery = useMemoFirebase(() => firestore ? collection(firestore, 'technicalResponsibles') : null, [firestore]);
  const { data: responsibles, isLoading: isLoadingResponsibles } = useCollection<TechnicalResponsible>(responsiblesQuery);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: currentItem || {
        empreendedorId: '',
        justificativa: '',
    },
  });
  
  const selectedEmpreendedorId = form.watch('empreendedorId');
  const selectedResponsibleId = form.watch('responsavel.id');

  React.useEffect(() => {
    if (selectedEmpreendedorId) {
      const empreendedor = empreendedores?.find(e => e.id === selectedEmpreendedorId);
      if (empreendedor) {
        form.setValue('razaoSocialEmpreendedor', empreendedor.name);
        // @ts-ignore
        form.setValue('nomeFantasiaEmpreendedor', empreendedor.fantasyName || '');
        form.setValue('cnpjEmpreendedor', empreendedor.cpfCnpj);
        form.setValue('logradouroEmpreendedor', empreendedor.address);
        form.setValue('numeroEmpreendedor', empreendedor.numero);
        // @ts-ignore
        form.setValue('complementoEmpreendedor', empreendedor.complemento || '');
        form.setValue('bairroEmpreendedor', empreendedor.bairro);
        form.setValue('municipioEmpreendedor', empreendedor.municipio);
        form.setValue('ufEmpreendedor', empreendedor.uf);
        form.setValue('cepEmpreendedor', empreendedor.cep);
        // @ts-ignore
        form.setValue('telefoneComercialEmpreendedor', empreendedor.phone); // Assuming phone is commercial
        // @ts-ignore
        form.setValue('telefoneCelularEmpreendedor', empreendedor.phone); // And also mobile
        form.setValue('emailEmpreendedor', empreendedor.email);
      }
    }
  }, [selectedEmpreendedorId, empreendedores, form]);

  React.useEffect(() => {
    if (selectedResponsibleId) {
      const responsible = responsibles?.find(r => r.id === selectedResponsibleId);
      if (responsible) {
        form.setValue('responsavel.nome', responsible.name);
        form.setValue('responsavel.documento', responsible.cpf || responsible.identidade || '');
        form.setValue('responsavel.formacao', responsible.profession);
      }
    }
  }, [selectedResponsibleId, responsibles, form]);


  async function onSubmit(values: FormValues) {
    setLoading(true);
    console.log("Dispensa Form Data:", values);
    await new Promise(resolve => setTimeout(resolve, 1000));
    toast({
      title: 'Solicitação de Dispensa Enviada!',
      description: 'Sua solicitação foi registrada com sucesso.',
    });
    setLoading(false);
    onSuccess?.();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Card>
            <CardHeader>
                <CardTitle>1. Identificação do Empreendedor</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <FormField
                    control={form.control}
                    name="empreendedorId"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Buscar Empreendedor Cadastrado</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoadingEmpreendedores}>
                        <FormControl>
                            <SelectTrigger>
                            <SelectValue placeholder={isLoadingEmpreendedores ? "Carregando..." : "Selecione para preencher automaticamente"} />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            {empreendedores?.map(e => (
                            <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                            ))}
                        </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <FormField control={form.control} name="razaoSocialEmpreendedor" render={({ field }) => (<FormItem><FormLabel>Razão Social</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                <FormField control={form.control} name="nomeFantasiaEmpreendedor" render={({ field }) => (<FormItem><FormLabel>Nome Fantasia</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                <FormField control={form.control} name="cnpjEmpreendedor" render={({ field }) => (<FormItem><FormLabel>CPF/CNPJ</FormLabel><FormControl><MaskedInput mask="cpfCnpj" {...field} /></FormControl></FormItem>)} />
                <FormField control={form.control} name="logradouroEmpreendedor" render={({ field }) => (<FormItem><FormLabel>Logradouro</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                <FormField control={form.control} name="numeroEmpreendedor" render={({ field }) => (<FormItem><FormLabel>Número</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                <FormField control={form.control} name="complementoEmpreendedor" render={({ field }) => (<FormItem><FormLabel>Complemento</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                <FormField control={form.control} name="bairroEmpreendedor" render={({ field }) => (<FormItem><FormLabel>Bairro</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                <FormField control={form.control} name="municipioEmpreendedor" render={({ field }) => (<FormItem><FormLabel>Município</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                <FormField control={form.control} name="ufEmpreendedor" render={({ field }) => (<FormItem><FormLabel>UF</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                <FormField control={form.control} name="cepEmpreendedor" render={({ field }) => (<FormItem><FormLabel>CEP</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                <FormField control={form.control} name="telefoneComercialEmpreendedor" render={({ field }) => (<FormItem><FormLabel>Telefone Comercial</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                <FormField control={form.control} name="telefoneCelularEmpreendedor" render={({ field }) => (<FormItem><FormLabel>Telefone Celular</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                <FormField control={form.control} name="emailEmpreendedor" render={({ field }) => (<FormItem><FormLabel>Email</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
            </CardContent>
        </Card>
        
         <Card>
            <CardHeader>
                <CardTitle>2. Identificação do Empreendimento</CardTitle>
                <CardDescription>Preencher apenas caso a identificação do empreendimento seja diferente daquela do empreendedor.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <FormField control={form.control} name="razaoSocial" render={({ field }) => (<FormItem><FormLabel>2.1 Razão Social</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                <FormField control={form.control} name="nomeFantasia" render={({ field }) => (<FormItem><FormLabel>2.2 Nome Fantasia</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                <FormField control={form.control} name="cnpj" render={({ field }) => (<FormItem><FormLabel>2.3 CNPJ</FormLabel><FormControl><MaskedInput mask="cnpj" {...field} /></FormControl></FormItem>)} />
                
                <h4 className="font-semibold text-base pt-4">2.4 Endereço Completo</h4>
                <FormField control={form.control} name="logradouro" render={({ field }) => (<FormItem><FormLabel>2.4.1 Logradouro</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="numero" render={({ field }) => (<FormItem><FormLabel>2.4.2 Nº/km</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                    <FormField control={form.control} name="complemento" render={({ field }) => (<FormItem><FormLabel>2.4.3 Complemento</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                </div>
                <FormField control={form.control} name="bairro" render={({ field }) => (<FormItem><FormLabel>2.4.4 Bairro/Localidade</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField control={form.control} name="municipio" render={({ field }) => (<FormItem><FormLabel>2.4.5 Município</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                    <FormField control={form.control} name="uf" render={({ field }) => (<FormItem><FormLabel>2.4.6 UF</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                    <FormField control={form.control} name="cep" render={({ field }) => (<FormItem><FormLabel>2.4.7 CEP</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="telefoneComercial" render={({ field }) => (<FormItem><FormLabel>2.5 Telefone Comercial</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                    <FormField control={form.control} name="telefoneCelular" render={({ field }) => (<FormItem><FormLabel>2.6 Telefone Celular</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                </div>
                 <FormField control={form.control} name="email" render={({ field }) => (<FormItem><FormLabel>2.7 E-mail</FormLabel><FormControl><Input type="email" {...field} /></FormControl></FormItem>)} />
                <h4 className="font-semibold text-base pt-4">2.8 Coordenadas</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <FormField control={form.control} name="coordenadas.latitude" render={({ field }) => (<FormItem><FormLabel>2.8.1 Latitude</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                     <FormField control={form.control} name="coordenadas.longitude" render={({ field }) => (<FormItem><FormLabel>2.8.2 Longitude</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                </div>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>3. Informações Sobre o Processo de Licenciamento Ambiental</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                 <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="processoAdministrativo" render={({ field }) => (<FormItem><FormLabel>3.1 Processo Administrativo</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                    <FormField control={form.control} name="solicitacaoLicenciamento" render={({ field }) => (<FormItem><FormLabel>Nº da Solicitação de Licenciamento</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                 </div>
                 <FormField control={form.control} name="faseProcesso" render={({ field }) => (
                     <FormItem><FormLabel>3.2 Fase do Processo</FormLabel>
                        <FormControl><RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="grid grid-cols-2 gap-2">
                             {fasesLicenciamento.map(fase => <FormItem key={fase} className="flex items-center space-x-2"><FormControl><RadioGroupItem value={fase} /></FormControl><FormLabel className="font-normal text-sm">{fase}</FormLabel></FormItem>)}
                         </RadioGroup></FormControl>
                     </FormItem>
                 )} />
                 <FormField control={form.control} name="ampliacaoAlteracao" render={({ field }) => (
                     <FormItem><FormLabel>3.3 Trata-se de ampliação ou alteração?</FormLabel>
                        <FormControl><RadioGroup onValueChange={field.onChange} defaultValue={String(field.value)} className="flex items-center space-x-4">
                            <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="sim" /></FormControl><FormLabel className="font-normal">Sim</FormLabel></FormItem>
                            <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="nao" /></FormControl><FormLabel className="font-normal">Não</FormLabel></FormItem>
                         </RadioGroup></FormControl>
                     </FormItem>
                 )} />
                 <FormField control={form.control} name="classeEmpreendimento" render={({ field }) => (
                     <FormItem><FormLabel>3.4 Classe</FormLabel>
                        <FormControl><RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex items-center space-x-4">
                            <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="3" /></FormControl><FormLabel className="font-normal">3</FormLabel></FormItem>
                            <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="4" /></FormControl><FormLabel className="font-normal">4</FormLabel></FormItem>
                             <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="5" /></FormControl><FormLabel className="font-normal">5</FormLabel></FormItem>
                            <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="6" /></FormControl><FormLabel className="font-normal">6</FormLabel></FormItem>
                         </RadioGroup></FormControl>
                     </FormItem>
                 )} />
                 <FormField control={form.control} name="porteEmpreendimento" render={({ field }) => (
                     <FormItem><FormLabel>3.5 Porte</FormLabel>
                        <FormControl><RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex items-center space-x-4">
                            <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="P" /></FormControl><FormLabel className="font-normal">P</FormLabel></FormItem>
                            <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="M" /></FormControl><FormLabel className="font-normal">M</FormLabel></FormItem>
                            <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="G" /></FormControl><FormLabel className="font-normal">G</FormLabel></FormItem>
                         </RadioGroup></FormControl>
                     </FormItem>
                 )} />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="codigoTipologia" render={({ field }) => (<FormItem><FormLabel>3.6 Código(s) e Tipologia(s)</FormLabel><FormControl><Input placeholder="Código(s)" {...field} /></FormControl></FormItem>)} />
                    <FormField control={form.control} name="tipologia" render={({ field }) => (<FormItem><FormLabel>&nbsp;</FormLabel><FormControl><Input placeholder="Tipologia(s)" {...field} /></FormControl></FormItem>)} />
                 </div>
                 <FormField control={form.control} name="possuiLicenca" render={({ field }) => (
                     <FormItem><FormLabel>3.7 O empreendimento possui licença ambiental?</FormLabel>
                        <FormControl><RadioGroup onValueChange={field.onChange} defaultValue={String(field.value)} className="flex items-center space-x-4">
                            <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="sim" /></FormControl><FormLabel className="font-normal">Sim</FormLabel></FormItem>
                            <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="nao" /></FormControl><FormLabel className="font-normal">Não</FormLabel></FormItem>
                         </RadioGroup></FormControl>
                     </FormItem>
                 )} />
                 {form.watch('possuiLicenca') === 'sim' && (
                    <div className="pl-4 space-y-4 border-l-2 ml-2">
                        <FormField control={form.control} name="licencaAnterior.numeroProcesso" render={({ field }) => (<FormItem><FormLabel>Nº do processo anterior</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                        <FormField control={form.control} name="licencaAnterior.tipoLicenca" render={({ field }) => (<FormItem><FormLabel>Tipo de Licença</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                        <FormField control={form.control} name="licencaAnterior.objeto" render={({ field }) => (<FormItem><FormLabel>Objeto</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                        <div className="grid grid-cols-2 gap-4">
                            <FormField control={form.control} name="licencaAnterior.dataConcessao" render={({ field }) => (<FormItem><FormLabel>Data de concessão</FormLabel><FormControl><Input type="date" {...field} /></FormControl></FormItem>)} />
                            <FormField control={form.control} name="licencaAnterior.validade" render={({ field }) => (<FormItem><FormLabel>Validade</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                        </div>
                    </div>
                 )}
                 <FormField control={form.control} name="possuiPea" render={({ field }) => (
                     <FormItem><FormLabel>3.8 O empreendimento possui PEA?</FormLabel>
                        <FormControl><RadioGroup onValueChange={field.onChange} defaultValue={String(field.value)} className="flex items-center space-x-4">
                            <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="sim" /></FormControl><FormLabel className="font-normal">Sim</FormLabel></FormItem>
                            <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="nao" /></FormControl><FormLabel className="font-normal">Não</FormLabel></FormItem>
                         </RadioGroup></FormControl>
                     </FormItem>
                 )} />
                 {form.watch('possuiPea') === 'sim' && (
                      <FormField control={form.control} name="peaConformeDN" render={({ field }) => (
                        <FormItem className="pl-4 border-l-2 ml-2"><FormLabel>O PEA atende à DN COPAM 214/17?</FormLabel>
                           <FormControl><RadioGroup onValueChange={field.onChange} defaultValue={String(field.value)} className="flex items-center space-x-4">
                               <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="sim" /></FormControl><FormLabel className="font-normal">Sim</FormLabel></FormItem>
                               <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="nao" /></FormControl><FormLabel className="font-normal">Não</FormLabel></FormItem>
                            </RadioGroup></FormControl>
                        </FormItem>
                    )} />
                 )}
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>4. Justificativas para a Dispensa do PEA</CardTitle>
                <CardDescription>Apresentar como anexo a este formulário a justificativa de solicitação de dispensa do PEA, devidamente fundamentada.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                 <FormField
                    control={form.control}
                    name="solicitacaoParcial"
                    render={({ field }) => (
                        <FormItem className="border-b pb-4">
                            <FormLabel>4.1 A solicitação de dispensa do PEA é total ou parcial?</FormLabel>
                            <FormControl>
                                <RadioGroup onValueChange={(v) => field.onChange(v === 'true')} defaultValue={String(field.value)} className="flex items-center space-x-4">
                                    <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="false" /></FormControl><FormLabel className="font-normal">Total</FormLabel></FormItem>
                                    <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="true" /></FormControl><FormLabel className="font-normal">Parcial</FormLabel></FormItem>
                                </RadioGroup>
                            </FormControl>
                        </FormItem>
                    )}
                />

                {form.watch('solicitacaoParcial') && (
                    <div className="p-4 border rounded-md">
                        <FormField
                            control={form.control}
                            name="dispensaParcialCampos"
                            render={() => (
                                <FormItem>
                                    <FormLabel>4.2 Objeto do pedido de dispensa (marcar mais de uma opção, se necessário)</FormLabel>
                                    <div className="space-y-2 mt-2">
                                        {dispensaParcialOptions.map((item) => (
                                            <FormField
                                                key={item.id}
                                                control={form.control}
                                                name="dispensaParcialCampos"
                                                render={({ field }) => (
                                                    <FormItem key={item.id} className="flex flex-row items-start space-x-3 space-y-0">
                                                        <FormControl>
                                                            <Checkbox
                                                                checked={field.value?.includes(item.id)}
                                                                onCheckedChange={(checked) => (checked ? field.onChange([...(field.value || []), item.id]) : field.onChange(field.value?.filter((value) => value !== item.id)))}
                                                            />
                                                        </FormControl>
                                                        <FormLabel className="font-normal text-sm">{item.label}</FormLabel>
                                                    </FormItem>
                                                )}
                                            />
                                        ))}
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="dispensaParcialOutro"
                            render={({ field }) => (
                                <FormItem className="mt-4">
                                    <FormLabel>Outro (Descrever)</FormLabel>
                                    <FormControl><Input {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                )}
                
                <FormField
                    control={form.control}
                    name="caracterizacaoSocioeconomica"
                    render={({ field }) => (
                        <FormItem className="pt-4 border-t">
                        <FormLabel>4.3 Caracterização socioeconômica e síntese dos principais impactos</FormLabel>
                        <FormControl>
                            <Textarea
                                placeholder="Apresentar as informações como anexo, exceto quando protocolizado com EIA/RIMA. Incluir diagnóstico, mapa de grupos sociais impactados e análise de riscos."
                                className="min-h-[150px]"
                                {...field}
                            />
                        </FormControl>
                        <FormDescription>
                            Anexar Diagnóstico, Mapa de localização dos grupos e Análise de Riscos e Impactos.
                        </FormDescription>
                        <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="space-y-4">
                    <div className="p-4 border rounded-lg bg-muted/50">
                        <h4 className="font-semibold">4.4.1. Para a solicitação da dispensa total de apresentação do PEA:</h4>
                        <p className="text-sm text-muted-foreground mt-2">Apresentar conjuntamente as informações solicitadas nos tópicos 4.4.2 e 4.4.3 deste Formulário.</p>
                    </div>

                    <div className="p-4 border rounded-lg">
                        <h4 className="font-semibold">4.4.2. Para a solicitação da dispensa parcial de apresentação do PEA, para o público-alvo interno:</h4>
                        <p className="text-sm text-muted-foreground mt-2">Será dispensada a realização do PEA para o público-alvo interno, para as fases de implantação e/ou operação com menos de 30 trabalhadores diretos, mediante a apresentação das seguintes informações:</p>
                        <ul className="list-disc pl-5 mt-2 space-y-2 text-sm">
                            <li>O cronograma físico das obras e o quantitativo de trabalhadores direta e indiretamente envolvidos com a atividade, a cada mês, ao longo da fase de instalação do empreendimento.</li>
                            <li>A quantidade de trabalhadores direta e indiretamente envolvidos com a atividade durante a fase de operação do empreendimento. Em caso de flutuação do número de trabalhadores devido à sazonalidade do empreendimento, deverá ser apresentada a quantidade média de trabalhadores por mês ao longo do ano.</li>
                            <li>No caso em que os trabalhadores direta e indiretamente envolvidos com atividades de lavra que possuam corpos mineralizados dispersos, de forma itinerante e abrangente ao longo do território e com permanência de curto prazo nestes corpos, deverá ser apresentada a quantidade média de trabalhadores por mês ao longo do ano.</li>
                        </ul>
                        <p className="text-xs text-muted-foreground mt-4 italic">
                            Cumpre destacar que, conforme DN COPAM 214/17, é automaticamente dispensada a realização do DSP com público-alvo interno, durante a fase de implantação do empreendimento, exceto no caso de ampliações e/ou alterações passíveis de licenciamento ambiental de empreendimentos nos quais não haverá mobilização de mão de obra, sendo utilizados trabalhadores que já atuam no empreendimento nas obras de implantação. Contudo, o PEA ainda deverá apresentar e executar ações e/ou projetos de educação ambiental nos casos dispensados de DSP.
                        </p>
                    </div>
                     <div className="p-4 border rounded-lg">
                        <h4 className="font-semibold">4.4.3. Para a solicitação da dispensa parcial de apresentação do PEA, para o público-alvo externo:</h4>
                        <p className="text-sm text-muted-foreground mt-2">
                            Será dispensada a realização do PEA para o público-alvo externo, nas fases de implantação e operação, para empreendimentos que não possuam indivíduos ou comunidades que se caracterizam como grupo social, conforme conceituado na DN COPAM 214/17, ou para atividades de lavra que possuam corpos mineralizados dispersos, de forma itinerante e abrangente ao longo do território e com permanência de curto prazo nestes corpos, ou cujo grupo social seja formado por públicos dispersos, tais como comunidades de sitiantes em grandes propriedades, desde que comprovado mediante as informações apresentadas no tópico 4.3.
                        </p>
                         <p className="text-sm text-muted-foreground mt-2">
                            Também deverá ser apresentada, em meio digital, no formato KML ou shapefile, a delimitação da Área Diretamente Afetada (ADA) e da Área de Abrangência da Educação Ambiental (ABEA) do empreendimento, com legenda e escala compatível, identificando as comunidades e demais agrupamentos habitacionais da ABEA. Em caso de ampliação e/ou alteração de empreendimento ou atividade existente, apresentar a ADA e a ABEA nos cenários com e sem a ampliação e/ou alteração.
                        </p>
                    </div>
                     <div className="p-4 border rounded-lg">
                        <h4 className="font-semibold">4.4.4. Para a solicitação da dispensa de realização do Diagnóstico Socioambiental Participativo - DSP:</h4>
                         <p className="text-sm text-muted-foreground mt-2">
                            O DSP poderá ser dispensado nos casos de público flutuante, conforme previsto no § 9º do Art. 6º da DN COPAM 214/17, transcrito a seguir:
                        </p>
                        <blockquote className="mt-2 pl-4 border-l-2 text-sm italic">
                            "§ 9º - Será dispensada a realização do DSP para o público flutuante, desde que tecnicamente motivado pelo empreendedor, mantendo-se a obrigatoriedade de se apresentar e executar ações e projetos de educação ambiental para este público."
                        </blockquote>
                        <p className="text-sm text-muted-foreground mt-2">
                            Assim, o empreendedor deverá caracterizar o público-alvo como flutuante, conforme conceito estabelecido no inciso IX do Art. 2º da DN COPAM 214/17, transcrito a seguir:
                        </p>
                        <blockquote className="mt-2 pl-4 border-l-2 text-sm italic">
                            "IX - público flutuante: indivíduos presentes na ABEA, durante um período de curta duração, tais como mão-de-obra temporária ou sazonal e/ou atraídos em função de eventuais potenciais turísticos decorrentes da atividade ou empreendimento."
                        </blockquote>
                         <p className="text-sm text-muted-foreground mt-4">
                            Cabe ressaltar que caso o empreendedor solicite a dispensa total de apresentação de novo PEA (conforme tópico 4.4.1) ou da revisão e/ou complementação de PEA já existente (conforme tópico 4.4.5) e a mesma seja aprovada pelo órgão ambiental, será automaticamente dispensada a realização do DSP nestes casos. Nos mesmos termos, caso seja solicitada e aprovada a dispensa parcial de apresentação do PEA para o público-alvo interno ou externo, será automaticamente dispensada a realização de DSP para o público correspondente.
                        </p>
                    </div>
                    <div className="p-4 border rounded-lg">
                        <h4 className="font-semibold">4.4.5. Para a solicitação da dispensa de realização da revisão e/ou complementação do PEA:</h4>
                        <p className="text-sm text-muted-foreground mt-2">
                           Apresentar as seguintes informações:
                        </p>
                        <ul className="list-disc pl-5 mt-2 space-y-2 text-sm">
                            <li>O cronograma físico das obras e o quantitativo de trabalhadores direta e indiretamente envolvidos com a atividade, a cada mês, ao longo da fase de instalação da ampliação ou alteração do empreendimento, quando aplicável;</li>
                            <li>Se houver a necessidade do aumento da mão-de-obra durante a fase de operação do empreendimento após sua ampliação e/ou alteração e, em caso positivo, o acréscimo de trabalhadores;</li>
                            <li>Descrição dos novos grupos sociais incluídos na ABEA após a ampliação e/ou alteração do empreendimento ou na renovação da LO, caso existam.</li>
                            <li>Novas tipologias do empreendimento, não previstas no PEA anterior, caso existam.</li>
                        </ul>
                    </div>
                    <FormField
                        control={form.control}
                        name="justificativa"
                        render={({ field }) => (
                        <FormItem className="pt-4 border-t">
                            <FormLabel>Justificativa Técnica</FormLabel>
                            <FormControl>
                            <Textarea
                                placeholder="Apresente aqui a justificativa técnica para a dispensa..."
                                className="min-h-[150px]"
                                {...field}
                            />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                </div>
            </CardContent>
        </Card>
        
        <Card>
            <CardHeader>
                <CardTitle>5. Responsável pelo Preenchimento do Formulário</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                 <FormField
                    control={form.control}
                    name="responsavel.id"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Buscar Responsável Técnico Cadastrado</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoadingResponsibles}>
                            <FormControl>
                                <SelectTrigger>
                                <SelectValue placeholder={isLoadingResponsibles ? "Carregando..." : "Selecione um responsável para preencher"} />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {responsibles?.map(r => (
                                <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                 <FormField control={form.control} name="responsavel.nome" render={({ field }) => (<FormItem><FormLabel>5.1 Nome completo</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                 <FormField control={form.control} name="responsavel.documento" render={({ field }) => (<FormItem><FormLabel>5.2 RG ou CPF</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                 <FormField control={form.control} name="responsavel.formacao" render={({ field }) => (<FormItem><FormLabel>5.3 Formação profissional</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                 <FormField control={form.control} name="responsavel.cargo" render={({ field }) => (<FormItem><FormLabel>5.4 Cargo ou vínculo com o empreendimento</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                 <FormField control={form.control} name="responsavel.localData" render={({ field }) => (<FormItem><FormLabel>5.5 Local e Data</FormLabel><FormControl><Input {...field} placeholder="Cidade, 01 de Janeiro de 2024" /></FormControl><FormMessage /></FormItem>)} />
                 <FormField control={form.control} name="responsavel.assinaturaUrl" render={({ field }) => (
                    <FormItem>
                        <FormLabel>5.6 Assinatura</FormLabel>
                        <FormControl>
                            <SignaturePad onSignatureEnd={(dataUrl) => field.onChange(dataUrl)} initialDataUrl={field.value}/>
                        </FormControl>
                        <FormDescription>Assine no quadro acima.</FormDescription>
                        <FormMessage />
                    </FormItem>
                 )} />
            </CardContent>
        </Card>


        <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
                Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
                {loading ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                </>
                ) : (
                'Enviar Solicitação'
                )}
            </Button>
        </div>
      </form>
    </Form>
  );
}
