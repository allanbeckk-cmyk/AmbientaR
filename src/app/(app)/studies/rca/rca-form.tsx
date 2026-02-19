

'use client';

import * as React from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import {
  Form,
} from '@/components/ui/form';
import { Loader2, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { RCA, Empreendedor as Client, Project } from '@/lib/types';
import { useFirebase, errorEmitter, useCollection, useMemoFirebase } from '@/firebase';
import { FirestorePermissionError } from '@/firebase/errors';
import { collection, doc, addDoc, updateDoc } from 'firebase/firestore';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RcaFormCulturas } from './rca-form-culturas';
import { RcaFormSiderurgia } from './rca-form-siderurgia';
import { RcaFormMoveis } from './rca-form-moveis';
import { RcaFormMetalurgiaNaoFerrosos } from './rca-form-metalurgia-nao-ferrosos';
import { RcaFormMateriaisCeramicos } from './rca-form-materiais-ceramicos';
import { RcaFormTelhasTijolos } from './rca-form-telhas-tijolos';
import { RcaFormFundidosFerroAco } from './rca-form-fundidos-ferro-aco';
import { RcaFormFundidosNaoFerrosos } from './rca-form-fundidos-nao-ferrosos';
import { RcaFormLigasFerrosas } from './rca-form-ligas-ferrosas';
import { RcaFormExplosivos } from './rca-form-explosivos';
import { RcaFormFarmaceutico } from './rca-form-farmaceutico';
import { RcaFormCourosPeles } from './rca-form-couros-peles';
import { RcaFormBorracha } from './rca-form-borracha';
import { RcaFormPapelPapelao } from './rca-form-papel-papelao';
import { RcaFormAguardente } from './rca-form-aguardente';
import { RcaFormLaticinios } from './rca-form-laticinios';
import { RcaFormAbatedouros } from './rca-form-abatedouros';
import { RcaFormRacaoAnimal } from './rca-form-racao-animal';
import { RcaFormSubprodutosAnimal } from './rca-form-subprodutos-animal';
import { RcaFormOleosGorduras } from './rca-form-oleos-gorduras';
import { RcaFormLavraSubterranea } from './rca-form-lavra-subterranea';
import { RcaFormRochasOrnamentais } from './rca-form-rochas-ornamentais';
import { useRouter } from 'next/navigation';
import { cleanEmptyValues } from '@/lib/utils';
import _ from 'lodash';


const formSchema = z.object({
  activity: z.string().min(1, "A seleção da listagem é obrigatória."),
  subActivity: z.string().optional(),
  empreendedor: z.object({}).passthrough(),
  empreendimento: z.object({}).passthrough(),
}).passthrough();

type RcaFormValues = z.infer<typeof formSchema>;

interface RcaFormProps {
  currentItem?: RCA | null;
  onSuccess: () => void;
}

const activities = [
    "LISTAGEM A – ATIVIDADES MINERÁRIAS",
    "LISTAGEM B – ATIVIDADES INDUSTRIAIS / INDÚSTRIA METALÚRGICA E OUTRAS",
    "LISTAGEM C – ATIVIDADES INDUSTRIAIS/INDÚSTRIA QUÍMICA E OUTRAS",
    "LISTAGEM D – ATIVIDADES INDUSTRIAIS / INDÚSTRIA ALIMENTÍCIA",
    "LISTAGEM E – ATIVIDADES DE INFRAESTRUTURA",
    "LISTAGEM F – GERENCIAMENTO DE RESÍDUOS E SERVIÇOS",
    "LISTAGEM G – ATIVIDADES AGROSSILVIPASTORIS",
    "LISTAGEM H – OUTRAS ATIVIDADES - H-01-01-1 Atividades e empreendimentos não listados ou não enquadrados em outros códigos, com supressão de vegetação primária ou secundária nativa pertencente ao bioma Mata Atlântica, em estágios médio e/ou avançado de regeneração, sujeita a EIA/Rima nos termos da Lei Federal nº 11.428, de 22 de dezembro de 2006, exceto árvores isoladas."
];

const subActivities: Record<string, string[]> = {
    "LISTAGEM A – ATIVIDADES MINERÁRIAS": [
        "Lavra Subterrânea",
        "Lavra de rochas ornamentais",
        "Extração Areia Cascalho Argila",
        "Barragem de rejeitos e resíduos"
    ],
    "LISTAGEM B – ATIVIDADES INDUSTRIAIS / INDÚSTRIA METALÚRGICA E OUTRAS": [
      "Fabricação de Telhas, Tijolos e Outros Artigos de Barro Cozido",
      "Fabricação de Materiais Cerâmicos",
      "Siderurgia - Produção de ferro Gusa",
      "Produção de ligas metálicas (ferro ligas)",
      "Produção de Fundidos de Ferro e Aço",
      "Produção de fundidos de metais não-ferrosos, inclusive ligas, com e sem tratamento químico superficial e/ou galvanotécnico, inclusive a partir da reciclagem.",
      "Fabricação de móveis",
    ],
     "LISTAGEM C – ATIVIDADES INDUSTRIAIS/INDÚSTRIA QUÍMICA E OUTRAS": [
        "Fabricação de Explosivos, Pólvora Negra e Artigos Pirotécnicos",
        "Setor Farmacêutico",
        "Papel e papelão",
        "Indústria da Borracha",
        "Couros e Peles",
        "Indústria de Plásticos",
        "Produtos de Limpeza",
    ],
    "LISTAGEM D – ATIVIDADES INDUSTRIAIS / INDÚSTRIA ALIMENTÍCIA": [
        "Fabricação de Aguardente de Cana-de-Açúcar",
        "Preparação do leite e fabricação de produtos de laticínios",
        "Abatedouros e Matadouros",
        "Formulação de Rações Balanceadas e de Alimentos Preparados para Animais",
        "Processamento de subprodutos de origem animal para produção de sebo, óleos e farinha",
        "Refinação e preparação de óleos e gorduras vegetais, produção de manteiga de cacau e de gorduras de origem animal destinadas à alimentação",
    ],
    "LISTAGEM E – ATIVIDADES DE INFRAESTRUTURA": [
        "Rodovias",
        "Gasoduto, transporte de produtos químicos e oleodutos e minerodutos",
        "Recapacitação e/ou Repotenciação de CGHs e PCHs",
        "Projetos de aproveitamento de Biogás de Aterro Sanitário com ou sem Geração de Energia Elétrica",
        "Sistema de Biometanização de Resíduos Sólidos Urbanos com Geração de Energia Elétrica",
        "Sistema de Tratamento Térmico de Resíduos Sólidos Urbanos com Geração de Energia Elétrica",
        "Barragem de Saneamento",
        "Sistema de Abastecimento de Água",
        "Sistema de Esgotamento Sanitário",
        "Sistemas de Tratamento e Disposição Final de Resíduos Sólidos Urbanos",
        "Solo Urbano Exclusiva ou Predominantemente Residencial",
        "Dragagem em corpos d'água"
    ],
    "LISTAGEM F – GERENCIAMENTO DE RESÍDUOS E SERVIÇOS": [
        "Posto de Combustível"
    ],
    "LISTAGEM G – ATIVIDADES AGROSSILVIPASTORIS": [
        "Cultura anuais, perenes e olericultura",
        "Criação de Bovinos",
        "Projetos Agropecuarios Irrigados",
        "Silvicultura e Carvoejamento",
        "Processamento, beneficiamento e armazenamento de graos",
        "Suinocultura",
        "Avicultura",
    ]
}

const getInitialValues = (currentItem?: RCA | null): RcaFormValues => {
    const defaults: RcaFormValues = {
      activity: '',
      subActivity: '',
      status: 'Rascunho',
      termoReferencia: { titulo: '', processo: '', dataEmissao: new Date(), versao: '' },
      empreendedor: { clientId: '', nome: '', cpfCnpj: '', identidade: '', orgaoExpedidor: '', uf: '', endereco: '', caixaPostal: '', municipio: '', distrito: '', cep: '', ddd: '', fone: '', fax: '', email: '', tipoPessoa: 'Pessoa Jurídica', cadastroProdutorRural: '', condicao: 'Proprietário', cargo: '' },
      empreendimento: { projectId: '', nome: '', inscricaoIncra: '', nomeFantasia: '', cnpj: '', zonaRural: 'Não', endereco: '', caixaPostal: '', municipio: '', distrito: '', uf: '', cep: '', ddd: '', fone: '', fax: '', email: '', inscricaoEstadual: '', inscricaoMunicipal: '', correspondenceIsSame: true, correspondenceAddress: '', correspondenceCaixaPostal: '', correspondenceMunicipio: '', correspondenceUf: '', correspondenceCep: '', correspondenceDdd: '', correspondenceFone: '', correspondenceFax: '', correspondenceEmail: '' },
      responsavelAmbiental: { nome: '', cpf: '', registroConselho: '', art: '', endereco: '', caixaPostal: '', municipio: '', distrito: '', uf: '', cep: '', ddd: '', fone: '', fax: '', email: '' },
      responsaveisEstudo: { empresa: { name: '', fantasyName: '', cnpj: '' }, tecnicos: [{ name: '', cpf: '' }], outrosProfissionais: [] },
      geographicLocation: { datum: 'SAD-69', format: 'Lat/Long', latLong: { lat: { grau: '', min: '', seg: '' }, long: { grau: '', min: '', seg: '' } }, utm: { x: '', y: '', fuso: '23' }, local: '', hydrographicBasin: '', upgrh: '', nearestWaterCourse: '' },
      atividades: [{}],
      faseRegularizacao: { isAmpliacao: false, processoAnterior: '', fase: 'LI', classe: '' },
      agendaVerde: { fazUso: false },
      agendaAzul: { usaConcessionaria: false, concessionaria: '', fazUsoAutorizacao: false },
      restricoesLocacionais: { biome: undefined, biomeOutro: '', hasNativeVegetation: false, nativeVegetation: [], nativeVegetationOther: '', inPermanentPreservationArea: false, propertyHasPermanentPreservationArea: false, isPermanentPreservationAreaPreserved: false, isPermanentPreservationAreaProtected: false, inKarstArea: false, inFluvialLacustrineArea: false },
      unidadesConservacao: { dentroOuRaio10km: false, distancia: '', nomeUC: '', orgaoGestor: '' },
      criteriosDN130: { possuiRPPN: false, areaAntropizadaConsolidada: false, compromissos: [], adotaSistemasReducaoVulnerabilidade: false, sistemasReducaoDescricao: '', usaQueimaCana: false, praticasDesenvolvidas: [] },
      recursosHumanos: { fixos: 0, temporarios: 0, terceirizados: 0, producao: 0, administrativo: 0, manutencao: 0 },
      regimeOperacao: { horasDia: 0, diasSemana: 0, turnos: 0, trabalhadoresTurno: 0, sazonalidade: false, sazonalidadeDescricao: '' },
      capacidadeInstalada: 0,
      consumoMateriaPrima: 0,
      producaoNominal: '',
      materiasPrimas: [],
      equipamentosProducao: [],
      equipamentosCalor: [],
      residuosSolidos: [],
      produtos: [],
      produtosFabricados: [],
      equipamentos: [],
      capacidade: {},
      trabalhadores: {},
      areaEmpreendimento: { total: 0, construida: 0, explorada: 0, preservada: 0, destinada: 0, corposDagua: '', interesseHistorico: false, interesseCenico: false, interesseCultural: false, interesseCientifico: false, interesseNatural: false },
      analiseSolo: [],
      atividadesAgricolas: { olericultura: [], culturasAnuais: [], culturasPerenes: [] },
      irrigacao: [],
      atividadesFlorestais: { silvicultura: [], carvoejamento: [] },
      atividadesAgropecuarias: [],
      outrasAtividades: [],
      infraestrutura: [],
      insumos: [],
      manutencaoEquipamentos: '',
      destinoEfluentesLavador: [],
      destinoResiduosLavador: [],
      destinoEfluentesAgricolas: [],
      destinoEmbalagensAgrotoxicos: [],
      efluentesDomesticos: [],
      residuosDomesticos: [],
      destinoEfluentesAgropecuarios: [],
      destinoResiduosAgropecuarios: [],
      destinoRestosAnimais: [],
      queimaAgricola: [],
      retornoLavouras: [],
      fertirrigacao: [],
      compostagem: [],
      tratamentoEfluentes: [],
      outrosDestinosEfluentes: '',
      reciclagemEmbalagens: '',
      tripliceLavagem: '',
      incineracaoEmbalagens: '',
      outrosDestinosEmbalagens: '',
      impactosAmbientais: [],
      diagnosticoAPPeRL: { localizacao: '', estadoConservacao: 'Inicial' },
      analiseViabilidadeLocacional: [],
      impactosMeioFisico: [],
      impactosMeioBiotico: [],
      impactosMeioSocioeconomico: [],
      zeeGeofisico: {},
      zeeSocioeconomico: [],
      anexos: [],
      anexosOutros: '',
      usoMadeira: { consome: false, possuiRegistroIEF: false },
      capacidadeEstocagem: { cotaMaxima: 0, percentualMedio: 0 },
      processoProdutivo: { descricao: '' },
      reatores: [],
      efluentesHidricosReatores: [],
      emissoesResiduosReatores: [],
    };
    
    if (currentItem) {
        // Deep merge to ensure all keys from defaults are present, even if undefined in currentItem
        const merged = _.merge({}, defaults, currentItem);
        
        if (currentItem.termoReferencia?.dataEmissao) {
            merged.termoReferencia.dataEmissao = new Date(currentItem.termoReferencia.dataEmissao);
        }
        
        return merged as RcaFormValues;
    }

    return defaults;
};


export function RcaForm({ currentItem, onSuccess }: RcaFormProps) {
  const [loading, setLoading] = React.useState(false);
  const { toast } = useToast();
  const { firestore } = useFirebase();
  const router = useRouter();


  const empreendedoresQuery = useMemoFirebase(() => firestore ? collection(firestore, 'empreendedores') : null, [firestore]);
  const { data: clients, isLoading: isLoadingClients } = useCollection<Client>(empreendedoresQuery);
  const projectsQuery = useMemoFirebase(() => firestore ? collection(firestore, 'projects') : null, [firestore]);
  const { data: projects, isLoading: isLoadingProjects } = useCollection<Project>(projectsQuery);

  const form = useForm<RcaFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: getInitialValues(currentItem),
  });

  const selectedActivity = form.watch('activity');
  const selectedSubActivity = form.watch('subActivity');

  async function handleSave(status: 'Rascunho' | 'Aprovado') {
    setLoading(true);

    const isValid = await form.trigger();
    if (!isValid && status === 'Aprovado') {
        toast({
            variant: 'destructive',
            title: 'Formulário Inválido',
            description: 'Por favor, corrija os erros antes de concluir.',
        });
        setLoading(false);
        return;
    }
    
    const values = form.getValues();

    if (!firestore) {
      toast({ variant: 'destructive', title: 'Firebase não inicializado.' });
      setLoading(false);
      return;
    }
    
    const dataToSave = cleanEmptyValues({
      ...values,
      status: status,
      termoReferencia: {
        ...(values.termoReferencia || {}),
        dataEmissao: values.termoReferencia?.dataEmissao ? new Date(values.termoReferencia.dataEmissao).toISOString() : null,
      }
    });

    try {
        if (currentItem) {
          const docRef = doc(firestore, 'rcas', currentItem.id);
          await updateDoc(docRef, dataToSave);
          toast({ title: 'RCA atualizado!', description: 'O relatório foi salvo com sucesso.' });
        } else {
          const collectionRef = collection(firestore, 'rcas');
          await addDoc(collectionRef, dataToSave);
          toast({ title: 'RCA criado!', description: `O relatório foi criado com sucesso.` });
        }
        onSuccess();
    } catch (e: any) {
        console.error("Error saving RCA: ", e);
        const permissionError = new FirestorePermissionError({
            path: currentItem ? `rcas/${currentItem.id}` : 'rcas',
            operation: currentItem ? 'update' : 'create',
            requestResourceData: dataToSave,
          });
        errorEmitter.emit('permission-error', permissionError);
    } finally {
        setLoading(false);
    }
  }
  
  const formProps = {
    form,
    clients: clients || [],
    isLoadingClients,
    projects: projects || [],
    isLoadingProjects
  };

  const renderDynamicForm = () => {
    if (!selectedActivity || !selectedSubActivity) {
         return <p className="text-muted-foreground text-center py-8">Selecione uma atividade e sub-atividade para exibir o formulário correspondente.</p>;
    }

    const commonProps = {
        form,
        clients: clients || [],
        isLoadingClients,
        projects: projects || [],
        isLoadingProjects
    };
    
    if (selectedActivity === 'LISTAGEM A – ATIVIDADES MINERÁRIAS' && selectedSubActivity === 'Lavra Subterrânea') {
      return <RcaFormLavraSubterranea {...commonProps} />;
    }

    if (selectedActivity === 'LISTAGEM A – ATIVIDADES MINERÁRIAS' && selectedSubActivity === 'Lavra de rochas ornamentais') {
      return <RcaFormRochasOrnamentais {...commonProps} />;
    }

    if (selectedActivity === 'LISTAGEM G – ATIVIDADES AGROSSILVIPASTORIS' && selectedSubActivity === 'Cultura anuais, perenes e olericultura') {
        return <RcaFormCulturas {...commonProps} />;
    }
    
    if (selectedActivity === 'LISTAGEM B – ATIVIDADES INDUSTRIAIS / INDÚSTRIA METALÚRGICA E OUTRAS' && selectedSubActivity === 'Siderurgia - Produção de ferro Gusa') {
        return <RcaFormSiderurgia {...commonProps} />;
    }
    
    if (selectedActivity === 'LISTAGEM B – ATIVIDADES INDUSTRIAIS / INDÚSTRIA METALÚRGICA E OUTRAS' && selectedSubActivity === 'Produção de ligas metálicas (ferro ligas)') {
      return <RcaFormLigasFerrosas {...commonProps} />;
    }
    
    if (selectedActivity === 'LISTAGEM B – ATIVIDADES INDUSTRIAIS / INDÚSTRIA METALÚRGICA E OUTRAS' && selectedSubActivity === 'Produção de Fundidos de Ferro e Aço') {
      return <RcaFormFundidosFerroAco {...commonProps} />;
    }
    
    if (selectedActivity === 'LISTAGEM B – ATIVIDADES INDUSTRIAIS / INDÚSTRIA METALÚRGICA E OUTRAS' && selectedSubActivity === 'Produção de fundidos de metais não-ferrosos, inclusive ligas, com e sem tratamento químico superficial e/ou galvanotécnico, inclusive a partir da reciclagem.') {
      return <RcaFormFundidosNaoFerrosos {...commonProps} />;
    }

    if (selectedActivity === 'LISTAGEM B – ATIVIDADES INDUSTRIAIS / INDÚSTRIA METALÚRGICA E OUTRAS' && selectedSubActivity === 'Fabricação de móveis') {
        return <RcaFormMoveis {...commonProps} />;
    }

    if (selectedActivity === 'LISTAGEM B – ATIVIDADES INDUSTRIAIS / INDÚSTRIA METALÚRGICA E OUTRAS' && selectedSubActivity === 'Fabricação de Materiais Cerâmicos') {
      return <RcaFormMateriaisCeramicos {...commonProps} />;
    }

    if (selectedActivity === 'LISTAGEM B – ATIVIDADES INDUSTRIAIS / INDÚSTRIA METALÚRGICA E OUTRAS' && selectedSubActivity === "Fabricação de Telhas, Tijolos e Outros Artigos de Barro Cozido") {
      return <RcaFormTelhasTijolos {...commonProps} />;
    }
    
     if (selectedActivity === 'LISTAGEM C – ATIVIDADES INDUSTRIAIS/INDÚSTRIA QUÍMICA E OUTRAS' && selectedSubActivity === 'Fabricação de Explosivos, Pólvora Negra e Artigos Pirotécnicos') {
      return <RcaFormExplosivos {...commonProps} />;
    }

    if (selectedActivity === 'LISTAGEM C – ATIVIDADES INDUSTRIAIS/INDÚSTRIA QUÍMICA E OUTRAS' && selectedSubActivity === 'Setor Farmacêutico') {
      return <RcaFormFarmaceutico {...commonProps} />;
    }
    
    if (selectedActivity === 'LISTAGEM C – ATIVIDADES INDUSTRIAIS/INDÚSTRIA QUÍMICA E OUTRAS' && selectedSubActivity === 'Indústria da Borracha') {
        return <RcaFormBorracha {...commonProps} />;
    }

    if (selectedActivity === 'LISTAGEM C – ATIVIDADES INDUSTRIAIS/INDÚSTRIA QUÍMICA E OUTRAS' && selectedSubActivity === 'Couros e Peles') {
      return <RcaFormCourosPeles {...commonProps} />;
    }
    
    if (selectedActivity === 'LISTAGEM C – ATIVIDADES INDUSTRIAIS/INDÚSTRIA QUÍMICA E OUTRAS' && selectedSubActivity === 'Indústria de Plásticos') {
        return <RcaFormPlasticos {...commonProps} />;
    }
    
    if (selectedActivity === 'LISTAGEM C – ATIVIDADES INDUSTRIAIS/INDÚSTRIA QUÍMICA E OUTRAS' && selectedSubActivity === 'Papel e papelão') {
        return <RcaFormPapelPapelao {...commonProps} />;
    }

    if (selectedActivity === 'LISTAGEM C – ATIVIDADES INDUSTRIAIS/INDÚSTRIA QUÍMICA E OUTRAS' && selectedSubActivity === 'Produtos de Limpeza') {
      return <RcaFormProdutosLimpeza {...commonProps} />;
    }
    
    if (selectedActivity === 'LISTAGEM D – ATIVIDADES INDUSTRIAIS / INDÚSTRIA ALIMENTÍCIA' && selectedSubActivity === 'Fabricação de Aguardente de Cana-de-Açúcar') {
      return <RcaFormAguardente {...commonProps} />;
    }
    
    if (selectedActivity === 'LISTAGEM D – ATIVIDADES INDUSTRIAIS / INDÚSTRIA ALIMENTÍCIA' && selectedSubActivity === 'Preparação do leite e fabricação de produtos de laticínios') {
        return <RcaFormLaticinios {...commonProps} />;
    }
    
    if (selectedActivity === 'LISTAGEM D – ATIVIDADES INDUSTRIAIS / INDÚSTRIA ALIMENTÍCIA' && selectedSubActivity === 'Abatedouros e Matadouros') {
        return <RcaFormAbatedouros {...commonProps} />;
    }
    
    if (selectedActivity === 'LISTAGEM D – ATIVIDADES INDUSTRIAIS / INDÚSTRIA ALIMENTÍCIA' && selectedSubActivity === 'Formulação de Rações Balanceadas e de Alimentos Preparados para Animais') {
        return <RcaFormRacaoAnimal {...commonProps} />;
    }
    
    if (selectedActivity === 'LISTAGEM D – ATIVIDADES INDUSTRIAIS / INDÚSTRIA ALIMENTÍCIA' && selectedSubActivity === 'Processamento de subprodutos de origem animal para produção de sebo, óleos e farinha') {
        return <RcaFormSubprodutosAnimal {...commonProps} />;
    }
    
    if (selectedActivity === 'LISTAGEM D – ATIVIDADES INDUSTRIAIS / INDÚSTRIA ALIMENTÍCIA' && selectedSubActivity === 'Refinação e preparação de óleos e gorduras vegetais, produção de manteiga de cacau e de gorduras de origem animal destinadas à alimentação') {
        return <RcaFormOleosGorduras {...commonProps} />;
    }


    return <p className="text-muted-foreground text-center py-8">Formulário para "{selectedSubActivity}" em construção.</p>;
  }
  

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(() => handleSave(form.getValues('status') || 'Rascunho'))} className="flex flex-col h-full overflow-hidden">
        <div className="flex-1 pr-4 space-y-4 overflow-y-auto">
          <div className="p-4 border rounded-md space-y-4">
              <FormField
              control={form.control}
              name="activity"
              render={({ field }) => (
                  <FormItem>
                  <FormLabel>Listagem/Atividade Principal</FormLabel>
                  <Select onValueChange={(value) => { field.onChange(value); form.setValue('subActivity', undefined); }} defaultValue={field.value}>
                      <FormControl>
                      <SelectTrigger>
                          <SelectValue placeholder="Selecione a atividade da DN 217" />
                      </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                      {activities.map(activity => (
                          <SelectItem key={activity} value={activity}>{activity}</SelectItem>
                      ))}
                      </SelectContent>
                  </Select>
                  <FormMessage />
                  </FormItem>
              )}
              />
              {selectedActivity && subActivities[selectedActivity] && (
                  <FormField
                  control={form.control}
                  name="subActivity"
                  render={({ field }) => (
                      <FormItem>
                      <FormLabel>Atividade Específica</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                          <SelectTrigger>
                              <SelectValue placeholder="Selecione a atividade específica" />
                          </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                          {subActivities[selectedActivity].map(subActivity => (
                              <SelectItem key={subActivity} value={subActivity}>{subActivity}</SelectItem>
                          ))}
                          </SelectContent>
                      </Select>
                      <FormMessage />
                      </FormItem>
                  )}
                  />
              )}
          </div>

          {renderDynamicForm()}
        </div>
        
        <div className="flex justify-between items-center pt-6 mt-4 border-t">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => handleSave('Rascunho')} disabled={loading}>
                {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...</> : 'Salvar Rascunho'}
            </Button>
            <Button onClick={() => handleSave('Aprovado')} disabled={loading}>
                {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Concluindo...</> : 'Concluir e Aprovar'}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}
