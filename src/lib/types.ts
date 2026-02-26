

import type { LucideIcon } from "lucide-react";

export type AuditLog = {
    id: string;
    userId: string;
    userName: string;
    action: string;
    details: Record<string, any>;
    timestamp: any;
};


export type Empreendedor = {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  numero?: string;
  projectIds?: string[];
  cpfCnpj?: string;
  entityType?: ('Pessoa Física' | 'Pessoa Jurídica' | 'Produtor Rural')[];
  municipio?: string;
  bairro?: string;
  uf?: string;
  cep?: string;
  fax?: string;
  correspondenceLogradouro?: string;
  correspondenceNumero?: string;
  correspondenceBairro?: string;
  correspondenceMunicipio?: string;
  correspondenceUf?: string;
  correspondenceCep?: string;
  userId?: string;
  sourceClientId?: string;
  dataNascimento?: string;
  ctfIbama?: string;
};

export type EnvironmentalCompany = {
    id: string;
    name: string;
    fantasyName?: string;
    cnpj: string;
    address?: string;
    numero?: string;
    caixaPostal?: string;
    municipio?: string;
    district?: string;
    uf?: string;
    cep?: string;
    ddd?: string;
    phone?: string;
    fax?: string;
    email?: string;
}

export type TechnicalResponsible = {
    id: string;
    name: string;
    cpf: string;
    identidade?: string;
    emissor?: string;
    nacionalidade?: string;
    estadoCivil?: string;
    profession: string;
    registrationNumber: string;
    art?: string;
    address?: string;
    numero?: string;
    bairro?: string;
    municipio?: string;
    uf?: string;
    cep?: string;
}

/** Cliente (cadastro financeiro/CRM). Dados podem ser preenchidos a partir de Análise Socioambiental. */
export type Client = {
  id: string;
  name: string;
  cpfCnpj: string;
  entityType?: 'Pessoa Física' | 'Pessoa Jurídica' | 'Produtor Rural';
  phone?: string;
  email?: string;
  identidade?: string;
  emissor?: string;
  nacionalidade?: string;
  estadoCivil?: string;
  dataNascimento?: string;
  ctfIbama?: string;
  address?: string;
  numero?: string;
  bairro?: string;
  municipio?: string;
  uf?: string;
  cep?: string;
  /** ID da análise socioambiental vinculada (preenchimento automático / relatórios) */
  analiseSocioambientalId?: string;
}

export type Invoice = {
  id: string;
  clientId: string;
  contractId?: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  amount: number;
  status: 'Paid' | 'Unpaid' | 'Overdue';
  fileUrl?: string;
};

export type Revenue = {
  id: string;
  clientId?: string;
  date: string;
  amount: number;
  description: string;
  fileUrl?: string;
};

export type Expense = {
    id: string;
    date: string;
    amount: number;
    description: string;
    fileUrl?: string;
};

export type Transaction = (Revenue | Expense) & { type: 'revenue' | 'expense' };


export type Appointment = {
  id: string;
  description: string;
  startTime: string;
  endTime: string;
  type: 'appointment' | 'deadline' | 'audit';
  clientId?: string;
  location?: string;
  ownerId?: string;
  ownerRole?: UserRole;
};

export type PermitType = 'LP' | 'LI' | 'LO' | 'LAS' | 'AAF' | 'Outra';
export type PermitStatus = 'Válida' | 'Vencida' | 'Em Renovação' | 'Suspensa' | 'Cancelada' | 'Em Andamento';
export type OwnerCondition = 'Proprietário' | 'Arrendatário' | 'Parceiro' | 'Posseiro' | 'Outros';
export type Datum = 'SAD-69' | 'WGS-84' | 'Córrego Alegre';
export type CoordinateFormat = 'Lat/Long' | 'UTM';
export type Fuso = '22' | '23' | '24';
export type Biome = 'Cerrado' | 'Mata Atlântica' | 'Outro' | 'Não';
export type ManagementCategory = 'Uso Sustentável' | 'Proteção Integral';
export type Jurisdiction = 'Federal' | 'Estadual' | 'Municipal' | 'Privada';
export type ZoneType = 'Rural' | 'Residencial' | 'Comercial' | 'Não';
export type LegalReserveStatus = 'not_rural' | 'demarcation_in_progress' | 'commitment_signed' | 'demarcation_done' | 'registered';
export type RegularizacaoSituacao = 'Regularizada' | 'Em Análise' | 'Não Regularizada';
export type TipoPessoa = 'Pessoa Física' | 'Pessoa Jurídica';

export type InputDetail = {
    used?: boolean;
    storageLocation?: string;
};

export type PhysicalStructure = {
  name: string;
  quantity: number;
  area: number;
  description: string;
}

export type BarragemAlternativa = {
  identificacaoArea?: string;
  distanciaGeracaoRejeito?: number;
  jusanteContribuicaoPluvial?: boolean;
  topografia?: {
    alturaTalude?: 'Menor que 30 metros' | 'Entre 30 e 60 metros' | 'Maior que 60 metros';
    areaInundacao?: number;
    volumeTerraMovimentada?: number;
    distanciaAreaEmprestimo?: number;
  };
  hidrologia?: {
    areaContribuicao?: 'Menor que 5 vezes área do lago' | 'Entre 5 e 10 vezes a área do lago' | 'Maior que 10 vezes a área do lago';
    aporteAguasSuperficiais?: number;
    aporteAguaPluvial?: number;
  };
  geologia?: {
    descricaoGeologiaLocal?: string;
    permeabilidade?: number;
    disponibilidadeMaterialNatural?: string;
    condicoesFundacao?: string;
  };
  aguaSubterranea?: {
    profundidadeLencolFreatico?: number;
  };
};

export type DamSheetData = {
  areaBaciaContribuicao?: number;
  areaDesmatamento?: number;
  elevacaoBase?: number;
  elevacaoCrista?: number;
  alturaMaximaFinal?: number;
  larguraCrista?: number;
  comprimentoFinalCrista?: number;
  anguloTaludeGeral?: number;
  alturaBancadas?: number;
  larguraBermas?: number;
  volumeTotalFinalMacico?: number;
  volumeFinalReservatorio?: number;
  descargaMaximaVertedouro?: number;
  areaReservatorio?: number;
  alturaMaximaAtual?: number;
};

export type AnaliseSolo = {
  cultura: string;
  parametros?: {
    RAS?: string; MO?: string; P?: string; K?: string; PH?: string;
    VA?: string; Al?: string; Ca?: string; Mg?: string; SB?: string;
    TEXTURA?: string;
  };
};

export type AtividadeAgricola = {
  especificacao: string;
  sistema: 'Convencional' | 'Orgânico';
  area: number;
  certificado?: string;
};

export type Irrigacao = {
  cultura: string;
  tipo: string;
  vazao: string;
  pontoCaptacao: string;
  classificacaoAgua: string;
  volumeOutorgado: string;
  velocidadeInfiltracao: string;
  laminaDagua: string;
  turnoRega: string;
};

export type AtividadeAgropecuaria = {
  especificacao: string;
  cabecas: number;
};

export type OutraAtividade = {
  especificacao: string;
  codigo?: string;
  unidade?: string;
  quantidade?: number;
  inicio?: string;
};

export type License = {
  id: string;
  empreendedorId: string;
  projectId: string;
  permitType: PermitType;
  processNumber: string;
  permitNumber: string;
  issuingBody: string;
  issueDate: string;
  expirationDate: string;
  status: PermitStatus;
  description?: string;
  fileUrl?: string;
};

export type Project = {
  id: string;
  empreendedorId: string;
  userId?: string;
  assignedTeam?: string[];
  activity: string;
  propertyName: string;
  fantasyName?: string;
  incraCode?: string;
  cnpj?: string;
  zoneType?: ZoneType;
  caixaPostal?: string;
  inscricaoEstadual?: string;
  inscricaoMunicipal?: string;
  correspondenceIsSame?: boolean;
  correspondenceAddress?: string;
  correspondenceCaixaPostal?: string;
  correspondenceMunicipio?: string;
  correspondenceUf?: string;
  correspondenceCep?: string;
  matricula?: string;
  comarca?: string;
  address?: string;
  numero?: string;
  cep?: string;
  municipio?: string;
  district?: string;
  uf?: string;
  ownerCondition?: OwnerCondition[];
  geographicLocation?: {
    datum: Datum;
    format: CoordinateFormat;
    latLong?: {
      lat: { grau?: string; min?: string; seg?: string; };
      long: { grau?: string; min?: string; seg?: string; };
    };
    utm?: {
      x?: string;
      y?: string;
      fuso: Fuso;
    };
    local?: string;
    additionalLocationInfo?: string;
    hydrographicBasin?: string;
    hydrographicSubBasin?: string;
    upgrh?: string;
    nearestWaterCourse?: string;
  };
  locationalRestrictions?: {
    biome: Biome;
    biomeOther?: string;
    hasNativeVegetation?: boolean;
    nativeVegetation?: string[];
    nativeVegetationOther?: string;
    inPermanentPreservationArea?: boolean;
    propertyHasPermanentPreservationArea?: boolean;
    isPermanentPreservationAreaPreserved?: boolean;
    isPermanentPreservationAreaProtected?: boolean;
    inKarstArea: boolean;
    inFluvialLacustrineArea: boolean;
  };
  conservationUnit?: {
    isInConservationUnit: 'Sim' | 'Não';
    distance?: string;
    ucName?: string;
    managementCategory?: ManagementCategory;
    jurisdiction?: Jurisdiction;
    managingBody?: string;
  };
  legalReserve?: {
    status: LegalReserveStatus;
    commitmentProcessNumber?: string;
    demarcationProcessNumber?: string;
  };
  criteriosDN130?: {
    possuiRPPN?: boolean;
    areaAntropizadaConsolidada?: boolean;
    compromissoFormal?: boolean;
    compromissos?: string[];
    adotaSistemasReducaoVulnerabilidade?: boolean;
    sistemasReducaoDescricao?: string;
    usaQueimaCana?: boolean;
    praticasDesenvolvidas?: string[];
    outrosSistemasAgroecologicos?: string;
  };
  barragemAlternativas?: BarragemAlternativa[];
  damTechnicalSheet?: {
    barragemNova?: DamSheetData;
    barragemExistente?: DamSheetData;
    alteamento?: DamSheetData;
  };
  projectArea?: {
    totalArea?: number;
    builtArea?: number;
  };
  jobCreation?: {
    fixos?: number;
    temporarios?: number;
    terceirizados?: number;
    residentFamilies?: number;
  };
  equipments?: {
    name: string;
    quantity: number;
  }[];
  agriculturalInputs?: {
    gesso?: InputDetail;
    calcario?: InputDetail;
    silica?: InputDetail;
    fertilizantes?: {
        fosfatagem?: InputDetail;
        outros?: InputDetail;
    };
    defensivos?: {
        herbicida?: InputDetail;
        inseticida?: InputDetail;
        fungicida?: InputDetail;
        outros?: InputDetail;
    };
    acaricida?: InputDetail;
    vermifugo?: InputDetail;
    antibioticos?: InputDetail;
    hormonios?: InputDetail;
    vacinas?: InputDetail;
    outros?: { name: string; storageLocation: string; }[];
  };
  physicalStructures?: PhysicalStructure[];
  analiseSolo?: AnaliseSolo[];
  atividadesAgricolas?: {
    olericultura?: AtividadeAgricola[];
    culturasAnuais?: AtividadeAgricola[];
    culturasPerenes?: AtividadeAgricola[];
  };
  irrigacao?: Irrigacao[];
  atividadesFlorestais?: {
    silvicultura?: { especie: string, area: number }[];
    carvoejamento?: { tipo: 'Nativo' | 'Plantada', especie: string, volume: number }[];
  };
  atividadesAgropecuarias?: AtividadeAgropecuaria[];
  outrasAtividades?: OutraAtividade[];
  processNumber?: string;
  issuingBody?: string;
  issueDate?: string;
  expirationDate?: string;
  status?: PermitStatus;
  description?: string;
  fileUrl?: string;
  clientId?: string;
};

export type WaterPermit = {
  id: string;
  empreendedorId: string;
  projectId?: string;
  permitNumber: string; // Portaria de Outorga
  processNumber: string;
  issueDate: string;
  expirationDate: string;
  status: PermitStatus;
  description: string; // Finalidade (e.g., Captação de água subterrânea)
  fileUrl?: string;
  pontosDeMonitoramento: { id: string; nome: string }[];
};

export type ManualMonitoringLog = {
    id: string;
    outorgaId: string;
    pontoId: string;
    logDate: string;
    startTime: string;
    endTime: string;
    flowRateLps: number;
    flowRateM3h: number;
    horimeterStart: number;
    horimeterEnd: number;
    userId: string;
    createdAt: any;
}

export type EnvironmentalIntervention = {
  id: string;
  empreendedorId:string;
  processNumber: string;
  issuingBody: string; // IEF / SEMAD
  issueDate: string;
  expirationDate: string;
  status: PermitStatus;
  description: string; // Tipo (e.g., Supressão de Vegetação Nativa)
  fileUrl?: string;
};

export type Condicionante = {
    id: string;
    referenceId: string;
    referenceType: 'licenca' | 'outorga' | 'intervencao';
    description: string;
    dueDate: string;
    status: 'Pendente' | 'Em Execução' | 'Cumprida' | 'Atrasada' | 'Não Aplicável';
    recurrence: 'Única' | 'Mensal' | 'Trimestral' | 'Semestral' | 'Anual';
    fileUrl?: string;
};

export type AreaRecuperacao = {
    identificacao: string;
    descricao: string;
    extensao: number;
    justificativa: string;
};

export type CronogramaEtapa = {
    etapa: string;
    dataInicio: string | Date;
    dataFim: string | Date;
}

export type MetodologiaAtracaoFauna = {
    titulo: string;
    descricao: string;
}

export type AvaliacaoResultadoItem = {
    metrica: string;
    indicador: string;
    graduacao?: number;
};

export type Prada = {
  id: string;
  status?: 'Rascunho' | 'Aprovado';
  requerente: {
    clientId?: string;
    nome: string;
    cpfCnpj: string;
  };
  proprietario?: {
    clientId?: string;
    nome?: string;
    cpfCnpj?: string;
  };
  empreendimento: {
    projectId?: string;
    nome: string;
    denominacao: string;
    car: string;
    matricula: string;
  };
  responsavelTecnico: {
    nome: string;
    cpf: string;
    email?: string;
    telefone?: string;
    formacao: string;
    registroConselho: string;
    art: string;
    ctfAida?: string;
  };
  objetivosPrada?: string[];
  objetivoDescricao?: string;
  areasRecuperacao?: AreaRecuperacao[];
  cronograma?: CronogramaEtapa[];
  metodologiaAtracaoFauna?: MetodologiaAtracaoFauna[];
  opcaoPrada?: 'WebAmbiente' | 'Projeto-Técnico';
  formasDeReconstituicao?: string[];
  reconstituicaoDescricao?: string;
  regeneracaoNatural?: string;
  enriquecimento?: string;
  reflorestamento?: string;
  especiesIndicadas?: {
    pioneiras?: string[];
    secundarias?: string[];
    climax?: string[];
    frutiferas?: string[];
    exoticas?: string[];
    justificativaExoticas?: string;
  };
  projetoImplantacao?: {
    combateFormigas?: string;
    preparoSolo?: string;
    espacamentoAlinhamento?: string;
    coveamentoAdubacao?: string;
    plantio?: string;
    coroamento?: string;
    tratosCulturais?: string;
    replantio?: string;
    preservacaoRecursos?: string;
    atracaoFauna?: string;
  };
  avaliacaoResultados?: AvaliacaoResultadoItem[];
  referenciasBibliograficas?: string;
};

export type PTRF = {
  id: string;
  status: 'Rascunho' | 'Aprovado';
  requerente: {
    clientId?: string;
    nome: string;
    cpfCnpj: string;
  };
  empreendimento: {
    projectId?: string;
    nome: string;
    car: string;
  };
  responsavelTecnico: {
    nome: string;
    cpf: string;
    formacao: string;
    registroConselho: string;
  };
  objetivoDescricao: string;
  referenciasBibliograficas?: string;
};


export type PiaType = 'Simplificado' | 'Corretivo' | 'Inventário Florestal' | 'Censo Florestal';

export type PIA = {
    id: string;
    type: PiaType;
    status?: 'Rascunho' | 'Aprovado';
    requerente: {
        clientId?: string;
        nome: string;
        cpfCnpj: string;
    };
    empreendimento: {
        projectId?: string;
        nome: string;
    };
}


export type DispensaPEA = {
    id: string;
    empreendedorId: string;
    justificativa: string;
    createdAt: any;
    createdBy: string;
    razaoSocial?: string;
    nomeFantasia?: string;
    cnpj?: string;
    logradouro?: string;
    numero?: string;
    complemento?: string;
    bairro?: string;
    municipio?: string;
    uf?: string;
    cep?: string;
    telefoneComercial?: string;
    telefoneCelular?: string;
    email?: string;
    coordenadas?: {
        latitude?: string;
        longitude?: string;
    };
    // New justification fields
    solicitacaoParcial?: boolean;
    dispensaParcialCampos?: string[];
    dispensaParcialOutro?: string;
    caracterizacaoSocioeconomica?: string;
    // New Responsible fields
    responsavel?: {
        id?: string;
        nome?: string;
        documento?: string;
        formacao?: string;
        cargo?: string;
        localData?: string;
        assinaturaUrl?: string;
    };
}

export type ZeeGeofisicoItem = {
    classificacao?: string;
    percentual?: number;
};

export type ZeeSocioeconomicoItem = {
    municipio?: string;
    ips?: number;
    populacao?: number;
    distribuicaoEspacial?: number;
    razaoDependencia?: number;
    malhaRodoviaria?: number;
    vaIndustria?: number;
    vaServicos?: number;
    vaAgropecuaria?: number;
    exportacoes?: number;
    doet?: number;
    concentracaoFundiaria?: number;
    agricultoresFamiliares?: number;
    nivelTecnologico?: number;
    icmsEcologico?: number;
    renda?: number;
    saude?: number;
    educacao?: number;
    idhM?: number;
    ocupacaoEconomica?: number;
    gestaoDesenvolvimentoRural?: number;
    capacidadeInstitucional?: number;
    gestaoAmbiental?: number;
    orgJuridicas?: number;
    orgFiscalizacaoControle?: number;
    orgEnsinoSuperiorProfissional?: number;
    orgSegurancaPublica?: number;
};


export type RCA = {
  id: string;
  status?: 'Rascunho' | 'Aprovado';
  activity: string;
  subActivity?: string;
  termoReferencia?: {
    titulo?: string;
    processo?: string;
    dataEmissao?: string | Date;
    versao?: string;
  };
  empreendedor?: {
    clientId?: string;
    nome?: string;
    cpfCnpj?: string;
    identidade?: string;
    orgaoExpedidor?: string;
    uf?: string;
    endereco?: string;
    caixaPostal?: string;
    municipio?: string;
    distrito?: string;
    cep?: string;
    ddd?: string;
    fone?: string;
    fax?: string;
    email?: string;
    tipoPessoa?: TipoPessoa;
    cadastroProdutorRural?: string;
    condicao?: OwnerCondition;
    cargo?: string;
  };
  empreendimento?: {
    projectId?: string;
    nome?: string;
    inscricaoIncra?: string;
    nomeFantasia?: string;
    cnpj?: string;
    zonaRural?: 'Sim' | 'Não' | 'Residencial' | 'Comercial';
    endereco?: string;
    caixaPostal?: string;
    municipio?: string;
    distrito?: string;
    uf?: string;
    cep?: string;
    ddd?: string;
    fone?: string;
    fax?: string;
    email?: string;
    inscricaoEstadual?: string;
    inscricaoMunicipal?: string;
    correspondenciaIsSame?: boolean;
    correspondenceAddress?: string;
    correspondenceCaixaPostal?: string;
    correspondenceMunicipio?: string;
    correspondenceUf?: string;
    correspondenceCep?: string;
    correspondenceDdd?: string;
    correspondenceFone?: string;
    correspondenceFax?: string;
    correspondenceEmail?: string;
  };
  responsavelAmbiental?: {
    nome?: string;
    cpf?: string;
    registroConselho?: string;
    art?: string;
    endereco?: string;
    caixaPostal?: string;
    municipio?: string;
    distrito?: string;
    uf?: string;
    cep?: string;
    ddd?: string;
    fone?: string;
    fax?: string;
    email?: string;
  };
  responsaveisEstudo?: {
    empresa?: Omit<EnvironmentalCompany, 'id'>,
    tecnicos?: Omit<TechnicalResponsible, 'id'>[],
    outrosProfissionais?: {
      estudo?: string;
      nome?: string;
      art?: string;
    }[],
  };
  geographicLocation?: {
    datum?: Datum;
    format?: CoordinateFormat;
    latLong?: {
      lat: { grau?: string; min?: string; seg?: string; };
      long: { grau?: string; min?: string; seg?: string; };
    };
    utm?: {
      x?: string;
      y?: string;
      fuso?: Fuso;
    };
    local?: string;
    additionalLocationInfo?: string;
    hydrographicBasin?: string;
    hydrographicSubBasin?: string;
    upgrh?: string;
    nearestWaterCourse?: string;
  };
  atividades?: {
    principal?: string;
    codigo?: string;
    unidade?: string;
    quantidade?: string;
    inicioAtividade?: string;
  }[];
  faseRegularizacao?: {
    isAmpliacao?: boolean;
    processoAnterior?: string;
    fase?: 'LI' | 'LIC' | 'LP+LI' | 'LOC';
    classe?: string;
  };
  agendaVerde?: {
    fazUso?: boolean;
    reservaLegal?: RegularizacaoSituacao;
    ocupacaoApp?: RegularizacaoSituacao;
    supressaoNativa?: RegularizacaoSituacao;
    intervencaoApp?: RegularizacaoSituacao;
    destoca?: RegularizacaoSituacao;
    aproveitamentoLenhoso?: RegularizacaoSituacao;
    corteIsoladas?: RegularizacaoSituacao;
    coletaNativa?: RegularizacaoSituacao;
    manejoSustentavel?: RegularizacaoSituacao;
  };
  agendaAzul?: {
    usaConcessionaria?: boolean;
    concessionaria?: string;
    fazUsoAutorizacao?: boolean;
    captacaoCursoAgua?: RegularizacaoSituacao;
    pocoTubular?: RegularizacaoSituacao;
    pocoManual?: RegularizacaoSituacao;
    rebaixamento?: RegularizacaoSituacao;
    surgencia?: RegularizacaoSituacao;
    lancamentoEfluente?: RegularizacaoSituacao;
    outros?: { especificacao: string; situacao: RegularizacaoSituacao }[];
  };
  restricoesLocacionais?: {
    biome?: Biome;
    biomeOutro?: string;
    hasNativeVegetation?: boolean;
    nativeVegetation?: string[];
    nativeVegetationOther?: string;
    inPermanentPreservationArea?: boolean;
    propertyHasPermanentPreservationArea?: boolean;
    isPermanentPreservationAreaPreserved?: boolean;
    isPermanentPreservationAreaProtected?: boolean;
    inKarstArea?: boolean;
    inFluvialLacustrineArea?: boolean;
  };
  unidadesConservacao?: {
    dentroOuRaio10km?: boolean;
    distancia?: string;
    nomeUC?: string;
    categoriaManejo?: ManagementCategory;
    jurisdicao?: Jurisdiction;
    orgaoGestor?: string;
  };
  criteriosDN130?: {
    possuiRPPN?: boolean;
    areaAntropizadaConsolidada?: boolean;
    compromissos?: string[];
    adotaSistemasReducaoVulnerabilidade?: boolean;
    sistemasReducaoDescricao?: string;
    usaQueimaCana?: boolean;
    praticasDesenvolvidas?: string[];
    outrosSistemasAgroecologicos?: string;
  };
  recursosHumanos?: { fixos: number, temporarios: number, terceirizados: number, producao: number, administrativo: number, manutencao: number };
  regimeOperacao?: { horasDia: number, diasSemana: number, turnos: number, trabalhadoresTurno: number, sazonalidade: boolean, sazonalidadeDescricao: string };
  capacidadeInstalada?: number;
  consumoMateriaPrima?: number;
  producaoNominal?: string;
  materiasPrimas?: any[];
  equipamentosProducao?: any[];
  equipamentosCalor?: any[];
  residuosSolidos?: any[];
  produtos?: any[];
  produtosFabricados?: any[];
  equipamentos?: any[];
  capacidade?: any;
  trabalhadores?: {
    fixos?: number;
    temporarios?: number;
    familiasResidentes?: number;
  };
  areaEmpreendimento?: {
    total?: number;
    construida?: number;
    explorada?: number;
    preservada?: number;
    destinada?: number;
    corposDagua?: string;
    interesseHistorico?: boolean;
    interesseCenico?: boolean;
    interesseCultural?: boolean;
    interesseCientifico?: boolean;
    interesseNatural?: boolean;
  };
  analiseSolo?: AnaliseSolo[];
  atividadesAgricolas?: {
    olericultura?: AtividadeAgricola[];
    culturasAnuais?: AtividadeAgricola[];
    culturasPerenes?: AtividadeAgricola[];
  };
  irrigacao?: Irrigacao[];
  atividadesFlorestais?: {
    silvicultura?: { especie: string, area: number }[];
    carvoejamento?: { tipo: 'Nativo' | 'Plantada', especie: string, volume: number }[];
  };
  atividadesAgropecuarias?: { especificacao: string, cabecas: number }[];
  outrasAtividades?: { especificacao: string, codigo: string, unidade: string, quantidade: string, inicio: string }[];
  infraestrutura?: {
      tipo: string;
      quantidade: number;
      area: number;
      descricao: string;
  }[];
  insumos?: {
      tipo: string;
      local: string;
  }[];
  manutencaoEquipamentos?: string;
  destinoEfluentesLavador?: string[];
  destinoResiduosLavador?: string[];
  destinoEfluentesAgricolas?: string[];
  destinoEmbalagensAgrotoxicos?: string[];
  efluentesDomesticos?: { local: string; destinos: string[] }[];
  residuosDomesticos?: { local: string; destinos: string[] }[];
  destinoEfluentesAgropecuarios?: string[];
  destinoResiduosAgropecuarios?: string[];
  destinoRestosAnimais?: string[];
  queimaAgricola?: string[];
  retornoLavouras?: string[];
  fertirrigacao?: string[];
  compostagem?: string[];
  tratamentoEfluentes?: string[];
  outrosDestinosEfluentes?: string;
  reciclagemEmbalagens?: string;
  tripliceLavagem?: string;
  incineracaoEmbalagens?: string;
  outrosDestinosEmbalagens?: string;
  impactosAmbientais?: {
      identificacao: string;
      local: string;
      medida: string;
  }[];
  diagnosticoAPPeRL?: {
      localizacao: string;
      estadoConservacao: 'Inicial' | 'Intermediário' | 'Avançado' | 'Primário' | 'Misto';
  };
  analiseViabilidadeLocacional?: {
      alternativa: number;
      local: string;
      justificativa: string;
  }[];
  impactosMeioFisico?: string[];
  impactosMeioBiotico?: string[];
  impactosMeioSocioeconomico?: string[];
  zeeGeofisico?: {
      [key: string]: ZeeGeofisicoItem;
  };
  zeeSocioeconomico?: ZeeSocioeconomicoItem[];
  anexos?: string[];
  anexosOutros?: string;
  usoMadeira?: { consome: boolean, possuiRegistroIEF: boolean };
  capacidadeEstocagem?: { cotaMaxima: number, percentualMedio: number };
  processoProdutivo?: { descricao: string };
  reatores?: { tipoForno: string, identificacao: string, volumeUtil: number, capacidade: number }[];
  efluentesHidricosReatores?: { identificacao: string, vazao: number, lancamento: string, tratamento: string }[];
  emissoesResiduosReatores?: { identificacao: string, taxa: string, sistemaControle: string, eficiencia: number }[];
};

export type TemplateField = 
    | 'templatesRcaListagemA' | 'templatesRcaListagemB' | 'templatesRcaListagemC' | 'templatesRcaListagemD' | 'templatesRcaListagemE' | 'templatesRcaListagemF' | 'templatesRcaListagemG'
    | 'templatesPcaListagemA' | 'templatesPcaListagemB' | 'templatesPcaListagemC' | 'templatesPcaListagemD' | 'templatesPcaListagemE' | 'templatesPcaListagemF' | 'templatesPcaListagemG'
    | 'templatesEiaListagemA' | 'templatesEiaListagemB' | 'templatesEiaListagemC' | 'templatesEiaListagemD' | 'templatesEiaListagemE' | 'templatesEiaListagemF' | 'templatesEiaListagemG'
    | 'templatesLasRasListagemA' | 'templatesLasRasListagemB' | 'templatesLasRasListagemC' | 'templatesLasRasListagemD' | 'templatesLasRasListagemE' | 'templatesLasRasListagemF' | 'templatesLasRasListagemG'
    | 'templatesFauna' | 'templatesInventarioFlorestal' | 'templatesRequerimentoIntervencao' | 'templatesPrada' | 'templatesPtrf'
    | 'templatesRima' | 'templatesOutorgas' | 'templatesSegurancaBarragem' | 'templatesEstudosCavidades' | 'templatesReservaLegal'
    | 'templatesEducacaoAmbiental' | 'templatesProjetoTecnicoBarragem';


export type CompanySettings = {
    id: string; // Should be a singleton, e.g., 'branding'
    headerImageUrl?: string;
    footerImageUrl?: string;
    watermarkImageUrl?: string;
    logoUsage?: 'pdf_only' | 'system_wide';
    systemLogoSource?: 'header' | 'watermark';
    templatesRcaListagemA?: { name: string; url: string; }[];
    templatesRcaListagemB?: { name: string; url: string; }[];
    templatesRcaListagemC?: { name: string; url: string; }[];
    templatesRcaListagemD?: { name: string; url: string; }[];
    templatesRcaListagemE?: { name: string; url: string; }[];
    templatesRcaListagemF?: { name: string; url: string; }[];
    templatesRcaListagemG?: { name: string; url: string; }[];
    templatesPcaListagemA?: { name: string; url: string; }[];
    templatesPcaListagemB?: { name: string; url: string; }[];
    templatesPcaListagemC?: { name: string; url: string; }[];
    templatesPcaListagemD?: { name: string; url: string; }[];
    templatesPcaListagemE?: { name: string; url: string; }[];
    templatesPcaListagemF?: { name: string; url: string; }[];
    templatesPcaListagemG?: { name: string; url: string; }[];
    templatesEiaListagemA?: { name: string; url: string; }[];
    templatesEiaListagemB?: { name: string; url: string; }[];
    templatesEiaListagemC?: { name: string; url: string; }[];
    templatesEiaListagemD?: { name: string; url: string; }[];
    templatesEiaListagemE?: { name: string; url: string; }[];
    templatesEiaListagemF?: { name: string; url: string; }[];
    templatesEiaListagemG?: { name: string; url: string; }[];
    templatesLasRasListagemA?: { name: string; url: string; }[];
    templatesLasRasListagemB?: { name: string; url: string; }[];
    templatesLasRasListagemC?: { name: string; url: string; }[];
    templatesLasRasListagemD?: { name: string; url: string; }[];
    templatesLasRasListagemE?: { name: string; url: string; }[];
    templatesLasRasListagemF?: { name: string; url: string; }[];
    templatesLasRasListagemG?: { name: string; url: string; }[];
    templatesFauna?: { name: string; url: string; }[];
    templatesInventarioFlorestal?: { name: string; url: string; }[];
    templatesRequerimentoIntervencao?: { name: string; url: string; }[];
    templatesPrada?: { name: string; url: string; }[];
    templatesPtrf?: { name: string; url: string; }[];
    templatesRima?: { name: string; url: string; }[];
    templatesOutorgas?: { name: string; url: string; }[];
    templatesSegurancaBarragem?: { name: string; url: string; }[];
    templatesEstudosCavidades?: { name: string; url: string; }[];
    templatesReservaLegal?: { name: string; url: string; }[];
    templatesEducacaoAmbiental?: { name: string; url: string; }[];
    templatesProjetoTecnicoBarragem?: { name: string; url: string; }[];
}

export type PCA = {
  id: string;
  status?: 'Rascunho' | 'Aprovado';
  activity: string;
  termoReferencia: {
    titulo: string;
    processo: string;
    dataEmissao: string | Date;
    versao?: string;
  };
  empreendedor: {
    clientId?: string;
    nome: string;
    cpfCnpj: string;
    endereco: string;
    contato: string;
  };
  empreendimento: {
    projectId?: string;
    nome: string;
    municipio: string;
    endereco: string;
    coordenadas: string;
    atividade: string;
    tipologia: string;
    faseLicenciamento: 'LP' | 'LI' | 'LO' | 'AAF' | 'Outra';
  };
  objetoEstudo: {
    objeto: string;
    fundamentacaoLegal: string;
  };
  conteudoEstudo: {
    introducao: string;
    caracterizacaoEmpreendimento: string;
    diagnosticoMeioFisico: string;
    diagnosticoMeioBiotico: string;
    diagnosticoMeioSocioeconomico: string;
    analiseImpactos: string;
    medidasMitigadoras: string;
    programasAmbientais: string;
    conclusao: string;
    referencias: string;
    anexos: string;
  };
  equipeTecnica: {
    qualificacoes: string;
    arts: string;
  };
};

export type UserRole = 'admin' | 'client' | 'technical' | 'sales' | 'financial' | 'gestor' | 'supervisor' | 'diretor_fauna';

export type NavItem = {
  href?: string;
  label: string;
  icon: LucideIcon;
  roles?: UserRole[];
  subItems?: NavSubItem[];
};

export type NavSubItem = {
  href?: string;
  label: string;
  icon?: LucideIcon;
  external?: boolean;
  subItems?: NavSubItem[];
  roles?: UserRole[];
};

export type AppUser = {
  id: string; // Firestore document ID
  uid: string; // Firebase Auth UID
  name: string;
  email: string;
  role: UserRole;
  status: 'active' | 'inactive';
  cpf?: string;
  cnpjs?: string[];
  photoURL?: string;
  isOnline?: boolean;
  lastLogin?: any;
  dataNascimento?: string;
};

export type OpportunityStage = 'Qualificação' | 'Proposta' | 'Negociação' | 'Fechado Ganho' | 'Fechado Perdido';

export type Opportunity = {
    id: string;
    name: string;
    clientId: string;
    value: number;
    closeDate: string;
    stage: OpportunityStage;
    assignedTo?: string;
};

export type CommercialProposalItem = {
  description: string;
  value: number;
};

export type CommercialProposal = {
  id: string;
  clientId: string;
  empreendimento?: string;
  proposalNumber: string;
  proposalDate: string;
  validUntilDate: string;
  items: CommercialProposalItem[];
  paymentTerms?: string;
  amount: number;
  status: 'Draft' | 'Sent' | 'Accepted' | 'Rejected';
  fileUrl?: string;
  contractId?: string;
};


export type Contract = {
    id: string;
    status: 'Rascunho' | 'Aprovado';
    contratante: {
        clientId: string;
        nome: string;
        cpfCnpj: string;
        identidade?: string;
        emissor?: string;
        nacionalidade?: string;
        estadoCivil?: string;
        endereco?: string;
        numero?: string;
        bairro?: string;
        cep?: string;
        municipio?: string;
        uf?: string;
    };
    contratado: {
        name: string;
        address?: string;
        cnpj?: string;
    };
    responsavelTecnico: {
        responsibleId: string;
        name: string;
        profession?: string;
        nacionalidade?: string;
        estadoCivil?: string;
        cpf?: string;
        identidade?: string;
        emissor?: string;
        address?: string;
        registrationNumber?: string;
        art?: string;
    };
    objeto: {
        empreendimento?: string;
        municipio?: string;
        uf?: string;
        servicos: string;
        itens?: { descricao: string; valor: number }[];
    };
    pagamento: {
        valorTotal: number;
        valorExtenso: string;
        forma: string;
        banco?: string;
        agencia?: string;
        conta?: string;
        pix?: string;
    };
    foro: {
        comarca: string;
        uf: string;
    };
    dataContrato: string;
    fileUrl?: string; // URL to the uploaded signed contract PDF
};


export type Contact = {
    id: string;
    name: string;
    email: string;
    phone?: string;
    company?: string;
    status: 'New' | 'Contacted' | 'Qualified' | 'Unqualified';
};

export type InventoryProject = {
    id: string;
    nome: string;
    descricao?: string;
    data: string;
    tipoProjeto: string;
    ownerId: string;
    createdAt: any;
}

export type Notification = {
    id: string;
    userId: string;
    title: string;
    description: string;
    link?: string;
    isRead: boolean;
    createdAt: any;
};

export type Chat = {
    participants: string[];
    lastMessage: string;
    lastMessageTimestamp: any;
    lastMessageSenderId: string;
}

export type ChatMessage = {
    id: string;
    senderId: string;
    receiverId: string;
    text: string;
    timestamp: any;
    read: boolean;
    deletedFor?: string[];
};

export type FaunaStudy = {
    id: string;
    studyType: 'inventario_projeto' | 'inventario_relatorio' | 'monitoramento_projeto' | 'monitoramento_relatorio' | 'resgate_projeto' | 'resgate_relatorio' | 'externo';
    empreendedorId: string;
    consultoriaId: string;
    documentName?: string;
    fileUrl?: string;
    empreendedor?: any; // Substituir por tipo Empreendedor
    consultoria?: any; // Substituir por tipo EnvironmentalCompany
    caracterizacaoEmpreendimento?: string;
    caracterizacaoAreaEstudo?: {
        area: string;
        clima: string;
    };
    caracterizacaoAmbientalSecundaria?: string;
    listaEspeciesSecundaria?: string;
    impactosPotenciais?: {
        vetores: string;
        analiseInteracao: string;
    };
    metodologiaInventariamento?: string;
    equipes?: string;
    referencias?: string;
    numeroAutorizacao?: string;
    responsaveisTecnicosRelatorio?: string;
    areaDiretamenteAfetada?: string;
    resultados?: {
        caracterizacaoAmbientalPrimaria?: string;
        listaEspeciesPrimaria?: string;
        impactosAmbientais?: string;
    };
    discussao?: string;
    recomendacoes?: string;
    objetivosMonitoramento?: string;
    perguntasHipoteses?: string;
    cronogramaExecucao?: string;
    destinoMaterialBiologico?: string;
    areasIntervencao?: string;
    areasSoltura?: string;
    programaResgate?: {
        metodologias?: string;
        baseSalvamento?: string;
    };
    cursoCapacitacao?: string;
    planoSupressao?: string;
    acoesResgate?: string;
    status?: 'draft' | 'completed';
    createdAt?: any;
    ownerId?: string;
};

export type Inconformidade = {
    description: string;
    criticality: 'Baixa' | 'Média' | 'Alta' | 'Urgente';
    imageUrls?: string[];
};

export type Inspection = {
    id: string;
    empreendedorId: string;
    projectId: string;
    inspectionDate: string;
    inspectorId: string;
    inspectorName: string;
    inconformidades: Inconformidade[];
    createdAt: any;
    status?: 'Em Aberto' | 'Aprovada';
    accompaniedBy?: string;
    signatureUrl?: string;
    readBy?: {
        [userId: string]: string; // userId: timestamp ISO string
    };
}

export type Request = {
    id: string;
    empreendedorId: string;
    projectId: string;
    services: string[];
    status: 'Draft' | 'Submitted' | 'In Progress' | 'Completed';
    createdAt: any;
    solicitationNumber?: string;
}

export type Fornecedor = {
  id: string;
  name: string;
  cpfCnpj: string;
  entityType: 'Pessoa Física' | 'Pessoa Jurídica';
  email?: string;
  phone?: string;
  serviceType?: string;
  cep?: string;
  logradouro?: string;
  bairro?: string;
  municipio?: string;
  uf?: string;
  referencia?: string;
  bankDetails?: {
    bankName?: string;
    agency?: string;
    account?: string;
    pixKey?: string;
  };
};

export type Service = {
  id: string;
  name: string;
  description?: string;
  cost?: number;
  price: number;
};

export type CharcoalProductionPerformance = {
  id: string;
  numeroDocumento?: string;
  data: string; // ISO date string
  mesReferencia: string; // "YYYY-MM" format
  proprietario: {
    nome: string;
    endereco: string;
    municipio: string;
    cep: string;
    telefone: string;
  };
  empreendimento: {
    denominacao: string;
    areaTotal: number; // in hectares
    endereco: string;
    paCopam: string;
    municipioDistrito: string;
    cep: string;
  };
  dadosMadeira: {
    dataColheita: string; // ISO date string
    periodo: 'chuvoso' | 'seca';
    residuos: boolean;
    umidadeEstimada: number;
    tempoMedioSecagem: number;
  };
  carbonizacao: {
    bateladasMes: number;
    volumeMadeiraEnfornada: number;
    volumeCarvaoProduzido: number;
    rendimentoVolumetrico: number;
    rendimentoGravimetrico: number;
  };
  temperaturaMedia?: {
    fornosAmostrados?: number;
    medicoesTotais?: number;
    temperatura?: number;
    realizadaPor?: ('Pirômetro' | 'Termopares' | 'Outro')[];
    outro?: string;
  };
  integridadeFornos?: {
    manutencaoEstrutura?: {
      data: string;
      duracao: string;
      operacao: string;
    }[];
    limpezaPiso?: {
      data: string;
      duracao: string;
    }[];
    limpezaConexoes?: {
      data: string;
      duracao: string;
      operacao: string;
    }[];
  };
  createdAt: any;
};

export type TransporteResiduosPerigosos = {
    id: string;
    empreendedor: {
        id?: string;
        nome?: string;
        cnpjCpf?: string;
        endereco?: string;
        telefone?: string;
        email?: string;
    };
    empreendimento: {
        id?: string;
        nome?: string;
        endereco?: string;
        municipioUf?: string;
    };
    empresaResponsavel?: {
        id?: string;
        razaoSocial?: string;
        endereco?: string;
        cnpjCpf?: string;
        telefone?: string;
        email?: string;
        ctfAida?: string;
    };
    responsavelTecnico: {
        id?: string;
        nome?: string;
        formacao?: string;
        registroClasse?: string;
        art?: string;
        ctfAidaIbama?: string;
    };
    veiculosTransporte?: {
        tipo?: string;
        placa?: string;
        anoFabricacao?: string;
        acondicionamento?: 'Granel' | 'Fracionado';
        civNumero?: string;
        civValidade?: string;
    }[];
    equipamentosGranel?: {
        tipoCarroceria?: string;
        placaFabricacao?: string;
        anoFabricacao?: string;
        cippNumero?: string;
        cippValidade?: string;
    }[];
    classificacaoProdutos?: {
        nomeTecnico?: string;
        nomeComercial?: string;
        numeroOnu?: string;
        classeRisco?: string;
        acondicionamento?: string;
    }[];
    classificacaoResiduos?: {
        nomeTecnico?: string;
        nomeComercial?: string;
        numeroOnu?: string;
        classeRisco?: string;
        acondicionamento?: string;
    }[];
    origemDestinoProdutos?: {
        produto?: string;
        produtorNome?: string;
        produtorEndereco?: string;
        consumidorNome?: string;
        consumidorEndereco?: string;
        viasPreferenciais?: string;
    }[];
    origemDestinoResiduos?: {
        residuo?: string;
        geradorNome?: string;
        geradorEndereco?: string;
        destinadorNome?: string;
        destinadorEndereco?: string;
        viasPreferenciais?: string;
    }[];
    anexoART?: string;
    createdAt?: any;
};


// Moved from ai/flows
import { z } from 'zod';
export const GenerateSustainabilityReportInputSchema = z.object({
  projectData: z.string().describe('Project data, including details about the project activities and resources used.'),
  environmentalMetrics: z.string().describe('Environmental metrics data, including measurements of emissions, waste, water usage, and other relevant environmental factors.'),
  context: z.string().optional().describe('Any other relevant information about the project or the environmental context, to help customize the sustainability report.'),
});
export type GenerateSustainabilityReportInput = z.infer<typeof GenerateSustainabilityReportInputSchema>;

export const GenerateSustainabilityReportOutputSchema = z.object({
  report: z.string().describe('The generated sustainability report.'),
});
export type GenerateSustainabilityReportOutput = z.infer<typeof GenerateSustainabilityReportOutputSchema>;

export const GenerateFinancialReportInputSchema = z.object({
  revenues: z.string().describe('A JSON string representing an array of revenue objects.'),
  expenses: z.string().describe('A JSON string representing an array of expense objects.'),
  context: z.string().optional().describe('Any other relevant information or specific instructions for generating the report.'),
});
export type GenerateFinancialReportInput = z.infer<typeof GenerateFinancialReportInputSchema>;

export const GenerateFinancialReportOutputSchema = z.object({
  report: z.string().describe('The generated financial report in a structured format.'),
});
export type GenerateFinancialReportOutput = z.infer<typeof GenerateFinancialReportOutputSchema>;

export const AssistantInputSchema = z.object({
  prompt: z.string().describe('A pergunta do usuário para o assistente.'),
});
export type AssistantInput = z.infer<typeof AssistantInputSchema>;

export const AssistantOutputSchema = z.object({
  response: z.string().describe('A resposta gerada pelo assistente de IA.'),
});
export type AssistantOutput = z.infer<typeof AssistantOutputSchema>;
// End moved types
    









  




