
'use client';

import * as React from 'react';
import { z } from 'zod';
import { useForm, useFieldArray } from 'react-hook-form';
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
import { Loader2, PlusCircle, Trash2, CalendarIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Prada, Empreendedor as Client, Project, AvaliacaoResultadoItem } from '@/lib/types';
import { useFirebase, errorEmitter, useCollection, useMemoFirebase } from '@/firebase';
import { FirestorePermissionError } from '@/firebase/errors';
import { collection, doc, addDoc, updateDoc } from 'firebase/firestore';
import { DialogFooter } from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';


const formSchema = z.object({
    status: z.enum(['Rascunho', 'Aprovado']).optional(),
    requerente: z.object({
        clientId: z.string().optional(),
        nome: z.string().min(1, "O nome do requerente é obrigatório."),
        cpfCnpj: z.string().min(1, "O CPF/CNPJ do requerente é obrigatório."),
    }),
    empreendimento: z.object({
        projectId: z.string().optional(),
        nome: z.string().min(1, "O nome do empreendimento é obrigatório."),
        denominacao: z.string().min(1, "A denominação do imóvel é obrigatória."),
        car: z.string().min(1, "O N.º do Recibo do CAR é obrigatório."),
        matricula: z.string().min(1, "A matrícula é obrigatória."),
    }),
    responsavelTecnico: z.object({
        nome: z.string().min(1, "O nome do responsável é obrigatório."),
        cpf: z.string().min(1, "O CPF do responsável é obrigatório."),
        email: z.string().email("E-mail inválido.").optional().or(z.literal('')),
        telefone: z.string().optional(),
        formacao: z.string().min(1, "A formação é obrigatória."),
        registroConselho: z.string().min(1, "O registro no conselho é obrigatório."),
        art: z.string().min(1, "A ART é obrigatória."),
        ctfAida: z.string().optional(),
    }),
    objetivosPrada: z.array(z.string()).optional(),
    objetivoDescricao: z.string().optional(),
    areasRecuperacao: z.array(z.object({
        identificacao: z.string().min(1, "A identificação é obrigatória."),
        descricao: z.string().min(1, "A descrição é obrigatória."),
        extensao: z.coerce.number().positive("A extensão deve ser um número positivo."),
        justificativa: z.string().min(1, "A justificativa é obrigatória."),
    })).optional(),
    cronograma: z.array(z.object({
        etapa: z.string().min(1, "O nome da etapa é obrigatório."),
        dataInicio: z.date({ required_error: 'A data inicial é obrigatória.' }),
        dataFim: z.date({ required_error: 'A data final é obrigatória.' }),
    })).optional(),
    metodologiaAtracaoFauna: z.array(z.object({
        titulo: z.string().min(1, "O título é obrigatório."),
        descricao: z.string().min(1, "A descrição é obrigatória."),
    })).optional(),
    opcaoPrada: z.enum(['WebAmbiente', 'Projeto-Técnico']).optional(),
    formasDeReconstituicao: z.array(z.string()).optional(),
    reconstituicaoDescricao: z.string().optional(),
    regeneracaoNatural: z.string().optional(),
    enriquecimento: z.string().optional(),
    reflorestamento: z.string().optional(),
    especiesIndicadas: z.object({
        pioneiras: z.array(z.string()).optional(),
        secundarias: z.array(z.string()).optional(),
        climax: z.array(z.string()).optional(),
        frutiferas: z.array(z.string()).optional(),
        exoticas: z.array(z.string()).optional(),
        justificativaExoticas: z.string().optional(),
    }).optional(),
    projetoImplantacao: z.object({
        combateFormigas: z.string().optional(),
        preparoSolo: z.string().optional(),
        espacamentoAlinhamento: z.string().optional(),
        coveamentoAdubacao: z.string().optional(),
        plantio: z.string().optional(),
        coroamento: z.string().optional(),
        tratosCulturais: z.string().optional(),
        replantio: z.string().optional(),
        preservacaoRecursos: z.string().optional(),
        atracaoFauna: z.string().optional(),
    }).optional(),
    avaliacaoResultados: z.array(z.object({
        metrica: z.string(),
        indicador: z.string(),
        graduacao: z.coerce.number().min(0).max(10).optional(),
    })).optional(),
    referenciasBibliograficas: z.string().optional(),
});

type PradaFormValues = z.infer<typeof formSchema>;

interface PradaFormProps {
  currentItem?: Prada | null;
  onSuccess?: () => void;
}

const objetivosPradaOptions = [
    { id: 'recuperacao_app', label: 'Recuperação de APP' },
    { id: 'recuperacao_reserva_legal', label: 'Recuperação de Reserva Legal' },
    { id: 'recuperacao_area_uso_restrito', label: 'Recuperação de Área de Uso Restrito' },
    { id: 'compensacao_app', label: 'Compensação de APP' },
    { id: 'compensacao_corte_mata_atlantica', label: 'Compensação pelo corte de vegetação nativa no bioma Mata Atlântica' },
    { id: 'compensacao_especies_ameacadas', label: 'Compensação pelo corte de espécies ameaçadas' },
    { id: 'compensacao_especies_protecao_especial', label: 'Compensação pelo corte de espécies objeto de proteção especial' },
]

const defaultFaunaMethods = [
    {
        id: 'poleiros_artificiais',
        titulo: 'Poleiros artificiais',
        descricao: 'Estruturas como galhos secos, troncos ou cruzetas de madeira instaladas estrategicamente para atrair aves. Elas funcionam como pontos de observação e descanso, ajudando na dispersão de sementes e controle de pragas.'
    },
    {
        id: 'plantio_especies_nativas_frutiferas',
        titulo: 'Plantio de espécies nativas frutíferas',
        descricao: 'A introdução de árvores e arbustos que produzem frutos é uma forma eficiente de fornecer alimento para aves, mamíferos e insetos. Isso atrai a fauna e ainda estimula a regeneração natural.'
    },
    {
        id: 'abrigos_ninhos_artificiais',
        titulo: 'Abrigose ninhos artificiais',
        descricao: 'Instalação de caixas-ninho, tocas ou outros abrigos que sirvam de local para descanso e reprodução de espécies como aves, morcegos e pequenos mamíferos.'
    },
    {
        id: 'conservacao_recursos_hidricos',
        titulo: 'Conservação de recursos hídricos',
        descricao: 'Garantir que nascentes, córregos, brejos ou qualquer outro ponto com água estejam preservados ou recuperados é essencial. A presença de água atrai animais como: anfíbios e peixes até aves e mamíferos que dependem desses ambientes para beber, se alimentar ou se reproduzir.'
    }
]

const formasDeReconstituicaoOptions = [
    { id: 'regeneracao_natural', label: 'Regeneração Natural' },
    { id: 'reflorestamento', label: 'Reflorestamento' },
    { id: 'enriquecimento', label: 'Enriquecimento' },
    { id: 'conjugacao', label: 'Conjugação' },
];

const especiesPioneirasOptions = [
    { id: 'inga', label: 'Ingá (Inga spp.)' },
    { id: 'cajuzinho', label: 'Cajuzinho-do-cerrado (Anacardium othonianum)' },
    { id: 'jatoba', label: 'Jatobá (Hymenaea courbaril)' },
    { id: 'aroeira', label: 'Aroeira (Schinus terebinthifolius)' },
    { id: 'capim_dourado', label: 'Capim-dourado (Syngonanthus nitens)' },
    { id: 'canela_de_ema', label: 'Canela-de-ema (Vellozia squamata)' },
    { id: 'bacupari', label: 'Bacupari (Salacia crassifolia)' },
    { id: 'candeia', label: 'Candeia (Eremanthus erythropappus)' },
    { id: 'marmeleiro', label: 'Marmeleiro (Croton spp.)' },
    { id: 'ipe_amarelo', label: 'Ipê-amarelo (Tabebuia spp.)' },
];

const especiesSecundariasOptions = [
    { id: 'candeia', label: 'Candeia (Eremanthus erythropappus)' },
    { id: 'jacaranda_do_cerrado', label: 'Jacarandá-do-cerrado (Dalbergia miscolobium)' },
    { id: 'canafistula', label: 'Canafístula (Peltophorum dubium)' },
    { id: 'goncalo_alves', label: 'Gonçalo-Alves (Astronium fraxinifolium)' },
    { id: 'pau_terra', label: 'Pau-terra (Qualea spp.)' },
    { id: 'sucupira', label: 'Sucupira (Bowdichia virgilioides)' },
    { id: 'caviuna', label: 'Caviúna (Machaerium spp.)' },
    { id: 'jacaranda_de_espinho', label: 'Jacarandá-de-espinho (Machaerium villosum)' },
    { id: 'jatoba', label: 'Jatobá (Hymenaea courbaril)' },
    { id: 'inga', label: 'Ingá (Inga spp.)' },
];

const especiesClimaxOptions = [
    { id: 'pequi', label: 'Pequi (Caryocar brasiliense)' },
    { id: 'sucupira_preta', label: 'Sucupira-preta (Diplotropis spp.)' },
    { id: 'baru', label: 'Baru (Dipteryx alata)' },
    { id: 'cagaita', label: 'Cagaita (Eugenia dysenterica)' },
    { id: 'araticum', label: 'Araticum (Annona spp.)' },
    { id: 'canjerana', label: 'Canjerana (Cabralea canjerana)' },
    { id: 'pau_santo', label: 'Pau-santo (Kielmeyera spp.)' },
    { id: 'caviuna', label: 'Caviúna (Machaerium spp.)' },
    { id: 'goncalo_alves', label: 'Gonçalo-Alves (Astronium fraxinifolium)' },
];

const especiesFrutiferasOptions = [
    { id: 'pequi', label: 'Pequi (Caryocar brasiliense)' },
    { id: 'cagaita', label: 'Cagaita (Eugenia dysenterica)' },
    { id: 'araticum', label: 'Araticum (Annona spp.)' },
    { id: 'murici', label: 'Murici (Byrsonima spp.)' },
    { id: 'cajui', label: 'Cajuí (Anacardium spp.)' },
    { id: 'jenipapo', label: 'Jenipapo (Genipa americana)' },
    { id: 'mangaba', label: 'Mangaba (Hancornia speciosa)' },
    { id: 'guavira', label: 'Guavira (Campomanesia spp.)' },
    { id: 'pindaiba', label: 'Pindaíba (Ximenia americana)' },
];

const avaliacaoDefault: AvaliacaoResultadoItem[] = [
    { metrica: "Cobertura vegetal", indicador: "Porcentagem de área coberta por vegetação" },
    { metrica: "Diversidade de espécies", indicador: "Índice de diversidade de Shannon-Wiener" },
    { metrica: "Estrutura da vegetação", indicador: "Altura média das plantas" },
    { metrica: "Composição da vegetação", indicador: "Área basal" },
    { metrica: "Condição do solo", indicador: "pH do solo, teor de matéria orgânica" },
    { metrica: "presença de fauna", indicador: "Número de espécies observadas" },
    { metrica: "Indicadores específicos", indicador: "Taxa de crescimento das mudas" },
]


export function PradaForm({ currentItem, onSuccess }: PradaFormProps) {
  const [loading, setLoading] = React.useState(false);
  const { toast } = useToast();
  const { firestore } = useFirebase();

  const clientsQuery = useMemoFirebase(() => firestore ? collection(firestore, 'clients') : null, [firestore]);
  const { data: clients, isLoading: isLoadingClients } = useCollection<Client>(clientsQuery);
  const projectsQuery = useMemoFirebase(() => firestore ? collection(firestore, 'projects') : null, [firestore]);
  const { data: projects, isLoading: isLoadingProjects } = useCollection<Project>(projectsQuery);

  const form = useForm<PradaFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: currentItem ? {
        ...currentItem,
        // @ts-ignore - Assuming cronograma exists and might have string dates from Firestore
        cronograma: currentItem.cronograma?.map(c => ({...c, dataInicio: new Date(c.dataInicio), dataFim: new Date(c.dataFim)})) || [],
        metodologiaAtracaoFauna: currentItem.metodologiaAtracaoFauna || [],
        avaliacaoResultados: currentItem.avaliacaoResultados || avaliacaoDefault,
    } : {
      status: 'Rascunho',
      requerente: { clientId: '', nome: '', cpfCnpj: '' },
      empreendimento: { projectId: '', nome: '', denominacao: '', car: '', matricula: '' },
      responsavelTecnico: { nome: 'Elaine de Sales Fernandes', cpf: '057.947.006-70', email: 'pimentambiental@hotmail.com', telefone: '(38) 9.9879-8039', formacao: 'Engenheira Ambiental', registroConselho: 'CREA-MG 144.093/D', art: '', ctfAida: '7358652' },
      objetivosPrada: [],
      objetivoDescricao: 'A Lei nº 20.922, de 16 de outubro de 2013, de Minas Gerais, estabelece diretrizes essenciais para a proteção da biodiversidade e o manejo florestal no estado. Entre suas prioridades, destaca-se a recuperação de áreas degradadas, com a obrigatoriedade de recomposição da vegetação em Áreas de Preservação Permanente (APPs) e Reservas Legais, visando preservar o equilíbrio ecológico e promover o uso sustentável dos recursos naturais.',
      cronograma: [],
      metodologiaAtracaoFauna: [],
      formasDeReconstituicao: [],
      reconstituicaoDescricao: 'A recuperação de áreas degradadas se baseia na reintrodução de espécies vegetais nativas e no restabelecimento da estrutura ecológica do ecossistema afetado. Isso ocorre porque as plantas nativas desempenham um papel fundamental na manutenção da saúde e estabilidade dos ecossistemas, fornecendo abrigo, alimento e condições adequadas para a fauna local...',
      especiesIndicadas: {
          pioneiras: [],
          secundarias: [],
          climax: [],
          frutiferas: [],
          exoticas: [],
          justificativaExoticas: '',
      },
      projetoImplantacao: {
        combateFormigas: "O combate às formigas é necessário para garantir o sucesso do plantio e o desenvolvimento saudável das mudas. Formigas cortadeiras, como as saúvas e quenquéns, podem causar danos significativos às mudas recém-plantadas, cortando as folhas e prejudicando o crescimento das plantas. Nessa atividade, serão utilizadas técnicas adequadas para controlar a população de formigas, como a aplicação de iscas formicidas ou a adoção de métodos naturais de controle, visando minimizar os danos causados por esses insetos.",
        preparoSolo: "O preparo do solo é uma etapa fundamental antes do plantio das mudas. Nessa atividade, serão realizadas a remoção de vegetação indesejada, a aração e a gradagem do solo, a fim de melhorar suas condições físicas, como aeração e drenagem, além de promover a descompactação e a remoção de materiais que possam impedir o enraizamento das mudas. O objetivo é criar um ambiente propício para o desenvolvimento das plantas e facilitar a penetração das raízes no solo.",
        espacamentoAlinhamento: "O espaçamento e alinhamento adequados entre as mudas são fundamentais para garantir um bom crescimento e desenvolvimento das plantas, evitando a competição por recursos como luz, água e nutrientes. Nessa atividade, serão estabelecidos as distâncias e o alinhamento entre as mudas de acordo com as características das espécies plantadas, considerando também fatores como a estrutura ecológica desejada e as condições locais.",
        coveamentoAdubacao: "O coveamento consiste na abertura de covas individuais para o plantio das mudas. Nessa atividade, serão feitas as covas de tamanho adequado para acomodar as raízes das mudas, levando em consideração o tamanho e o sistema radicular de cada espécie. Além disso, será realizada a adubação das covas, fornecendo nutrientes essenciais para o bom desenvolvimento das plantas, como nitrogênio, fósforo e potássio, entre outros elementos importantes para o crescimento saudável.",
        plantio: "O plantio das mudas é uma etapa crucial do projeto, em que as plantas serão inseridas nas covas preparadas. Nessa atividade, serão seguidas técnicas adequadas para garantir que as mudas sejam plantadas na profundidade correta, com a posição adequada das raízes e sem danificar sua estrutura. Será necessário cuidado para evitar danos às raízes e garantir que as mudas estejam firmemente posicionadas no solo.",
        coroamento: "O coroamento é o processo de criação de uma pequena depressão circular em torno da muda recém-plantada, ajudando a direcionar a água das chuvas para a região das raízes e reduzindo a competição com a vegetação invasora. Essa atividade contribui para a conservação da umidade e a proteção das mudas, evitando o desperdício de água e permitindo que elas tenham acesso a recursos necessários para o seu crescimento.",
        tratosCulturais: "Os tratos culturais são práticas realizadas após o plantio para promover o bom desenvolvimento das mudas. Essas práticas incluem a remoção de plantas invasoras que possam competir por recursos, a poda de ramos secos ou danificados, a proteção contra pragas e doenças, e a manutenção de um ambiente favorável ao crescimento das plantas. Também podem envolver a aplicação de adubação complementar, quando necessário, para suprir deficiências nutricionais.",
        replantio: "Em algumas situações, pode ser necessário realizar o replantio de mudas que não se desenvolveram adequadamente ou foram danificadas. Essa atividade envolve a remoção das mudas problemáticas e o plantio de novas mudas no local, seguindo os mesmos procedimentos de preparo do solo, espaçamento e plantio adotados anteriormente. O replantio visa garantir o estabelecimento de uma vegetação saudável e diversificada na área degradada.",
        preservacaoRecursos: "A reconstrução de áreas de preservação permanente (APP’s) é uma importante medida para a conservação dos recursos hídricos e edáficos. A adoção de práticas conservacionistas, como a reflorestação com espécies nativas, a construção de barreiras de contenção e o controle da erosão, são essenciais para garantir a recuperação dessas áreas.",
        atracaoFauna: "A fauna desempenha um papel importante na dispersão de sementes e na regeneração natural da vegetação. Para atrair a fauna dispersora de sementes, serão adotadas práticas conservacionistas, como a implantação de cercas vivas ou corredores vegetados que fornecem abrigo e alimento para os animais. Também podem ser instalados ninhos artificiais, bebedouros ou comedouros para atrair aves e pequenos mamíferos, incentivando sua presença na área e contribuindo para a dispersão de sementes.",
      },
      avaliacaoResultados: avaliacaoDefault,
      referenciasBibliograficas: '',
    },
  });
  
  const { fields: areaFields, append: appendArea, remove: removeArea } = useFieldArray({
    control: form.control,
    name: "areasRecuperacao",
  });

  const { fields: cronogramaFields, append: appendCronograma, remove: removeCronograma } = useFieldArray({
    control: form.control,
    name: "cronograma",
  });
  
  const { fields: faunaFields, append: appendFauna, remove: removeFauna } = useFieldArray({
    control: form.control,
    name: "metodologiaAtracaoFauna",
  });

  const { fields: avaliacaoFields } = useFieldArray({
    control: form.control,
    name: 'avaliacaoResultados'
  });


  const selectedClientId = form.watch('requerente.clientId');
  const selectedProjectId = form.watch('empreendimento.projectId');
  const cronogramaData = form.watch('cronograma');

  React.useEffect(() => {
    if (selectedClientId) {
      const client = clients?.find(c => c.id === selectedClientId);
      if (client) {
        form.setValue('requerente.nome', client.name);
        form.setValue('requerente.cpfCnpj', client.cpfCnpj || '');
      }
    }
  }, [selectedClientId, clients, form]);

  React.useEffect(() => {
    if (selectedProjectId) {
      const project = projects?.find(p => p.id === selectedProjectId);
      if (project) {
        form.setValue('empreendimento.nome', project.fantasyName || project.propertyName);
        form.setValue('empreendimento.denominacao', project.propertyName);
        form.setValue('empreendimento.matricula', project.matricula || '');
      }
    }
  }, [selectedProjectId, projects, form]);

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
    
    const dataToSave = {
        ...values,
        status: status, // Ensure status is set
        cronograma: values.cronograma?.map(c => ({
            ...c,
            // @ts-ignore
            dataInicio: c.dataInicio instanceof Date ? c.dataInicio.toISOString() : c.dataInicio,
            // @ts-ignore
            dataFim: c.dataFim instanceof Date ? c.dataFim.toISOString() : c.dataFim,
        }))
    }

    if (currentItem) {
      const docRef = doc(firestore, 'pradas', currentItem.id);
      updateDoc(docRef, dataToSave)
        .then(() => {
          toast({
            title: 'PRADA atualizado!',
            description: 'O formulário foi salvo com sucesso.',
          });
          if (status === 'Aprovado') onSuccess?.();
        })
        .catch(async (serverError) => {
          const permissionError = new FirestorePermissionError({
            path: docRef.path,
            operation: 'update',
            requestResourceData: dataToSave,
          });
          errorEmitter.emit('permission-error', permissionError);
        })
        .finally(() => setLoading(false));
    } else {
      const collectionRef = collection(firestore, 'pradas');
      addDoc(collectionRef, dataToSave)
        .then(() => {
          toast({
            title: 'PRADA criado!',
            description: `O formulário para ${values.empreendimento.nome} foi criado com sucesso.`,
          });
          form.reset();
          if (status === 'Aprovado') onSuccess?.();
        })
        .catch(async (serverError) => {
          const permissionError = new FirestorePermissionError({
            path: collectionRef.path,
            operation: 'create',
            requestResourceData: dataToSave,
          });
          errorEmitter.emit('permission-error', permissionError);
        })
        .finally(() => setLoading(false));
    }
  }

  const ExecutionSchedule = ({ cronogramaData }: { cronogramaData: PradaFormValues['cronograma'] }) => {
    const { tableData, legend, years } = React.useMemo(() => {
      if (!cronogramaData || cronogramaData.length === 0) {
        return { tableData: {}, legend: [], years: [] };
      }

      const legendItems = cronogramaData.map((item, index) => ({
        number: index + 1,
        label: item.etapa,
      }));

      const data: { [year: number]: (string | number)[][] } = {};
      const yearSet = new Set<number>();

      cronogramaData.forEach((item, index) => {
        const etapaNumber = index + 1;
        let currentDate = new Date(item.dataInicio);
        const endDate = new Date(item.dataFim);

        while (currentDate <= endDate) {
          const year = currentDate.getFullYear();
          const month = currentDate.getMonth();
          yearSet.add(year);

          if (!data[year]) {
            data[year] = Array.from({ length: 12 }, () => []);
          }
          if (!data[year][month].includes(etapaNumber)) {
            data[year][month].push(etapaNumber);
          }

          currentDate.setMonth(currentDate.getMonth() + 1);
        }
      });
      
      const sortedYears = Array.from(yearSet).sort();

      return { tableData: data, legend: legendItems, years: sortedYears };
    }, [cronogramaData]);

    if (years.length === 0) {
      return <p className="text-muted-foreground">Preencha o cronograma na Etapa 3 para gerar a tabela de execução.</p>;
    }

    return (
      <div className="prose prose-sm dark:prose-invert max-w-none">
        <p>Este cronograma detalha as etapas de implementação, com base nos dados fornecidos na Etapa 3.</p>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ano</TableHead>
              {['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'].map(m => <TableHead key={m}>{m}</TableHead>)}
            </TableRow>
          </TableHeader>
          <TableBody>
            {years.map(year => (
              <TableRow key={year}>
                <TableCell>{year}</TableCell>
                {Array.from({ length: 12 }).map((_, monthIndex) => (
                  <TableCell key={monthIndex}>
                    {tableData[year]?.[monthIndex]?.join('-') || ''}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <p><strong>Legenda:</strong> {legend.map(l => `${l.number}-${l.label}`).join('; ')}.</p>
      </div>
    );
  };


  return (
    <Form {...form}>
      <form onSubmit={(e) => e.preventDefault()} className="h-full flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto pr-4 -mr-6">
            <Tabs defaultValue="info-gerais" className="w-full">
                <TabsList className="h-auto flex-wrap justify-start">
                    <TabsTrigger value="info-gerais">1. Informações Gerais</TabsTrigger>
                    <TabsTrigger value="objetivos">2. Objetivos</TabsTrigger>
                    <TabsTrigger value="cronograma">3. Cronograma</TabsTrigger>
                    <TabsTrigger value="metodologia">4. Metodologia</TabsTrigger>
                    <TabsTrigger value="opcao">5. Opção</TabsTrigger>
                    <TabsTrigger value="projeto-tecnico">6. Projeto Técnico</TabsTrigger>
                    <TabsTrigger value="avaliacao">7. Avaliação</TabsTrigger>
                    <TabsTrigger value="cronograma-execucao">8. Cronograma Exec.</TabsTrigger>
                    <TabsTrigger value="referencias">9. Referências</TabsTrigger>
                </TabsList>
                <div className="mt-4">
                    <TabsContent value="info-gerais" className="mt-0">
                        <div className="space-y-6">
                            <div className="space-y-4 p-4 border rounded-md">
                                <h3 className="text-lg font-medium">1.1 Dados do Requerente ou Empreendedor</h3>
                                <FormField
                                control={form.control}
                                name="requerente.clientId"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Buscar Requerente Cadastrado</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoadingClients}>
                                        <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder={isLoadingClients ? "Carregando..." : "Selecione um cliente para preencher"} />
                                        </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                        {clients?.map(client => (
                                            <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                                        ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                    </FormItem>
                                )}
                                />
                                <FormField control={form.control} name="requerente.nome" render={({ field }) => (<FormItem><FormLabel>Nome</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                                <FormField control={form.control} name="requerente.cpfCnpj" render={({ field }) => (<FormItem><FormLabel>CPF/CNPJ</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                            </div>

                            <div className="space-y-4 p-4 border rounded-md">
                                <h3 className="text-lg font-medium">1.2 Dados do Empreendimento</h3>
                                <FormField
                                control={form.control}
                                name="empreendimento.projectId"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Buscar Empreendimento Cadastrado</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoadingProjects}>
                                        <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder={isLoadingProjects ? "Carregando..." : "Selecione um empreendimento para preencher"} />
                                        </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                        {projects?.map(project => (
                                            <SelectItem key={project.id} value={project.id}>{project.propertyName}</SelectItem>
                                        ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                    </FormItem>
                                )}
                                />
                                <FormField control={form.control} name="empreendimento.nome" render={({ field }) => (<FormItem><FormLabel>Nome do Empreendimento</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                                <FormField control={form.control} name="empreendimento.denominacao" render={({ field }) => (<FormItem><FormLabel>Denominação do imóvel</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                                <FormField control={form.control} name="empreendimento.car" render={({ field }) => (<FormItem><FormLabel>N.º Recibo do CAR</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                                <FormField control={form.control} name="empreendimento.matricula" render={({ field }) => (<FormItem><FormLabel>Matrícula</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                            </div>
                        </div>
                    </TabsContent>
                    <TabsContent value="objetivos" className="mt-0">
                        <div className="space-y-6">
                            <div className="space-y-4 rounded-md border p-4">
                                <h3 className="text-lg font-medium">2. Objetivo do PRADA</h3>
                                <FormField
                                    control={form.control}
                                    name="objetivosPrada"
                                    render={() => (
                                        <FormItem>
                                            {objetivosPradaOptions.map((item) => (
                                                <FormField
                                                key={item.id}
                                                control={form.control}
                                                name="objetivosPrada"
                                                render={({ field }) => {
                                                    return (
                                                    <FormItem
                                                        key={item.id}
                                                        className="flex flex-row items-start space-x-3 space-y-0"
                                                    >
                                                        <FormControl>
                                                        <Checkbox
                                                            checked={field.value?.includes(item.id)}
                                                            onCheckedChange={(checked) => {
                                                            return checked
                                                                ? field.onChange([...(field.value || []), item.id])
                                                                : field.onChange(
                                                                    field.value?.filter(
                                                                    (value) => value !== item.id
                                                                    )
                                                                )
                                                            }}
                                                        />
                                                        </FormControl>
                                                        <FormLabel className="font-normal">
                                                        {item.label}
                                                        </FormLabel>
                                                    </FormItem>
                                                    )
                                                }}
                                                />
                                            ))}
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <div className="space-y-4 rounded-md border p-4">
                                <h3 className="text-lg font-medium">2.1 Objetivo</h3>
                                <FormField
                                    control={form.control}
                                    name="objetivoDescricao"
                                    render={({ field }) => (
                                        <FormItem>
                                        <FormLabel>Descrição dos Objetivos</FormLabel>
                                        <FormControl>
                                            <Textarea
                                            placeholder="Descreva de forma objetiva todas as áreas contempladas neste PRADA..."
                                            {...field}
                                            />
                                        </FormControl>
                                        <FormDescription>
                                            Inclua extensão total, localização geral e tipo de impacto. Pode ser útil inserir um mapa geral.
                                        </FormDescription>
                                        <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="space-y-4 rounded-md border p-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-medium">2.1.1 Área de Recuperação - PRADA</h3>
                                    <Button
                                        type="button"
                                        size="sm"
                                        onClick={() => appendArea({ identificacao: '', descricao: '', extensao: 0, justificativa: '' })}
                                    >
                                        <PlusCircle className="mr-2 h-4 w-4" />
                                        Adicionar Área
                                    </Button>
                                </div>
                                {areaFields.map((field, index) => (
                                    <div key={field.id} className="space-y-4 rounded-md border p-4 relative">
                                        <Button
                                            type="button"
                                            variant="destructive"
                                            size="icon"
                                            className="absolute top-2 right-2 h-6 w-6"
                                            onClick={() => removeArea(index)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                            <span className="sr-only">Remover Área</span>
                                        </Button>
                                        <FormField
                                        control={form.control}
                                        name={`areasRecuperacao.${index}.identificacao`}
                                        render={({ field }) => (
                                            <FormItem>
                                            <FormLabel>Identificação da área</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Nome/código, localização precisa" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                            </FormItem>
                                        )}
                                        />
                                        <FormField
                                        control={form.control}
                                        name={`areasRecuperacao.${index}.descricao`}
                                        render={({ field }) => (
                                            <FormItem>
                                            <FormLabel>Descrição da degradação</FormLabel>
                                            <FormControl>
                                                <Textarea placeholder="Tipo de alteração (supressão, erosão, etc.), grau de degradação, presença de vegetação nativa..." {...field} />
                                            </FormControl>
                                            <FormMessage />
                                            </FormItem>
                                        )}
                                        />
                                        <FormField
                                        control={form.control}
                                        name={`areasRecuperacao.${index}.extensao`}
                                        render={({ field }) => (
                                            <FormItem>
                                            <FormLabel>Extensão</FormLabel>
                                            <FormControl>
                                                <Input type="number" placeholder="Área total (em hectares ou m²)" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                            </FormItem>
                                        )}
                                        />
                                        <FormField
                                        control={form.control}
                                        name={`areasRecuperacao.${index}.justificativa`}
                                        render={({ field }) => (
                                            <FormItem>
                                            <FormLabel>Justificativa para a recomposição</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Legal, ambiental, funcional" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                            </FormItem>
                                        )}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </TabsContent>
                    <TabsContent value="cronograma" className="mt-0">
                        <div className="space-y-4 rounded-md border p-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-medium">3. Cronograma de Execução e Monitoramento</h3>
                                <Button
                                    type="button"
                                    size="sm"
                                    onClick={() => appendCronograma({ etapa: '', dataInicio: new Date(), dataFim: new Date() })}
                                >
                                    <PlusCircle className="mr-2 h-4 w-4" />
                                    Adicionar Etapa
                                </Button>
                            </div>
                            <div className="space-y-4">
                                {cronogramaFields.map((field, index) => (
                                <div key={field.id} className="space-y-4 rounded-md border p-4 relative">
                                    <Button
                                        type="button"
                                        variant="destructive"
                                        size="icon"
                                        className="absolute top-2 right-2 h-6 w-6"
                                        onClick={() => removeCronograma(index)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                        <span className="sr-only">Remover Etapa</span>
                                    </Button>
                                    <FormField
                                    control={form.control}
                                    name={`cronograma.${index}.etapa`}
                                    render={({ field }) => (
                                        <FormItem>
                                        <FormLabel>Nome da Etapa/Ação</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Ex: Preparo do Solo" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                        </FormItem>
                                    )}
                                    />
                                    <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name={`cronograma.${index}.dataInicio`}
                                        render={({ field }) => (
                                            <FormItem className="flex flex-col">
                                            <FormLabel>Data de Início</FormLabel>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                                    {field.value ? format(field.value, "PPP", { locale: ptBR }) : <span>Escolha uma data</span>}
                                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                    </Button>
                                                </FormControl>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0" align="start">
                                                <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                                                </PopoverContent>
                                            </Popover>
                                            <FormMessage />
                                            </FormItem>
                                        )}
                                        />
                                        <FormField
                                        control={form.control}
                                        name={`cronograma.${index}.dataFim`}
                                        render={({ field }) => (
                                            <FormItem className="flex flex-col">
                                            <FormLabel>Data de Fim</FormLabel>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                                    {field.value ? format(field.value, "PPP", { locale: ptBR }) : <span>Escolha uma data</span>}
                                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                    </Button>
                                                </FormControl>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0" align="start">
                                                <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                                                </PopoverContent>
                                            </Popover>
                                            <FormMessage />
                                            </FormItem>
                                        )}
                                        />
                                    </div>
                                </div>
                                ))}
                            </div>
                        </div>
                    </TabsContent>
                    {/* Placeholder for other tabs */}
                </div>
            </Tabs>
        </div>
        
        <DialogFooter>
            <Button variant="outline" type="button" onClick={onSuccess}>
                Voltar
            </Button>
            <Button variant="secondary" onClick={() => handleSave('Rascunho')} disabled={loading}>
                {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...</> : 'Salvar Rascunho'}
            </Button>
            <Button onClick={() => handleSave('Aprovado')} disabled={loading}>
                {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Concluindo...</> : 'Concluir e Aprovar'}
            </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
