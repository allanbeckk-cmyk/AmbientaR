/**
 * Tipos para Extrato de Análise Socioambiental (relatórios no padrão Sicoob/AgroTools).
 * Permite gerar relatórios similares, preencher cadastro do cliente e reutilizar em estudos.
 */

/** Informações da propriedade/território (espelho do PDF) */
export type InformacoesPropriedade = {
  codigo?: string;
  nivel?: string;
  nome?: string;
  unidade?: string;
  areaInformadaHa?: number;
  areaCalculadaHa?: number;
  areaConsolidada?: string;
  municipio?: string;
  uf?: string;
  appInformadaCarHa?: number;
  rlInformadaCarHa?: number;
  porcentagemRlCar?: number;
  rlExigidaLeiHa?: number;
  areaTotalRlDeclaradaHa?: number;
  statusCAR?: string;
  condicaoCadastroCAR?: string;
  bioma?: string;
  microrregiao?: string;
  mesorregiao?: string;
  baciaHidrografica?: string;
  regiaoAmazonica?: boolean;
  latitude?: number;
  longitude?: number;
  distanciaMunicipioSedeKm?: number;
  cardoc?: string;
  modulosFiscais?: number;
  codigoTerritorio?: string;
  tipoExploracao?: string;
};

/** Agente envolvido com o território (TOMADOR, etc.) */
export type AgenteTerritorio = {
  nome: string;
  documento: string; // CPF/CNPJ
  codigo?: string;
  tipoAgente?: string;
};

/** Resultado de um critério (Apto / Inapto) */
export type ResultadoCriterio = {
  criterio: string;
  resultado: 'Apto' | 'Inapto' | 'Não Analisado';
  detalhe?: string;
};

/** Detalhe de análise de um critério (ex.: PRODES, UC buffer) */
export type DetalheAnalise = {
  criterio: string;
  ano?: number;
  numeroDeteccoes?: number;
  tamanhoDeteccoesHa?: number;
  dataDeteccao?: string;
  areaSobreposicaoHa?: number;
  nomeUnidadeConservacao?: string;
  categoria?: string;
  esfera?: string;
  tipo?: string;
  observacao?: string;
};

/** Documento principal: Extrato de Análise Socioambiental */
export type AnaliseSocioambiental = {
  id: string;
  /** Cliente/empreendimento ao qual a análise se refere (preenchimento automático do cadastro) */
  clientId?: string;
  /** Empreendimento/projeto vinculado, se houver */
  projectId?: string;
  /** Nome do relatório ou da propriedade (ex.: W EGIDO AGROPECUARIA LTDA) */
  titulo: string;
  /** Data de emissão do extrato */
  dataEmissao?: string;
  /** Serial/identificador do relatório na origem (ex.: Sicoob) */
  serial?: string;
  /** Informações da propriedade */
  informacoesPropriedade: InformacoesPropriedade;
  /** Agentes (TOMADOR, etc.) */
  agentes: AgenteTerritorio[];
  /** Critérios e resultados (Apto/Inapto) */
  criteriosResultados: ResultadoCriterio[];
  /** Detalhes por critério (PRODES, UC, Reserva Legal, etc.) */
  detalhesAnalise: DetalheAnalise[];
  /** URL do PDF anexo, se importado */
  pdfUrl?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
  createdBy?: string;
};
