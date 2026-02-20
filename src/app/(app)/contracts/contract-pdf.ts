/**
 * Geração do PDF do Contrato de Prestação de Serviços (modelo padrão).
 * Preenche com dados do cliente (contratante), contratado, responsável técnico, objeto, pagamento e foro.
 */

import type { Contract, CompanySettings } from '@/lib/types';
import jsPDF from 'jspdf';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

/** Retorna y após escrever texto; adiciona nova página se necessário. onNewPage é chamado ao criar nova página (para desenhar marca d'água atrás). */
function addText(
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  pageHeight: number,
  marginBottom: number,
  lineHeight = 0.5,
  onNewPage?: () => void
): number {
  const lines = doc.splitTextToSize(text, maxWidth);
  for (const line of lines) {
    if (y > pageHeight - marginBottom) {
      doc.addPage();
      y = 2.5;
      onNewPage?.();
    }
    doc.text(line, x, y);
    y += lineHeight;
  }
  return y;
}

/** Escreve um título de cláusula e retorna nova y. onNewPage é chamado ao criar nova página. */
function addClauseTitle(
  doc: jsPDF,
  title: string,
  y: number,
  pageWidth: number,
  pageHeight: number,
  marginBottom: number,
  onNewPage?: () => void
): number {
  if (y > pageHeight - marginBottom - 1) {
    doc.addPage();
    y = 2.5;
    onNewPage?.();
  }
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(title, 2, y);
  y += 0.6;
  doc.setFont('helvetica', 'normal');
  return y;
}

export async function generateContractPdf(
  contract: Contract,
  brandingData: CompanySettings | null | undefined,
  fetchBrandingImageAsBase64: (url: string | undefined) => Promise<string | null>
): Promise<void> {
  const doc = new jsPDF({ unit: 'cm', format: 'a4' });
  const pageHeight = doc.internal.pageSize.getHeight();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 2;
  const marginBottom = 2.5;
  const contentWidth = pageWidth - margin * 2;

  const contratante = contract.contratante;
  const contratado = contract.contratado;
  const responsavel = contract.responsavelTecnico;
  const objeto = contract.objeto;
  const pagamento = contract.pagamento;
  const foro = contract.foro;

  const headerBase64 = await fetchBrandingImageAsBase64(brandingData?.headerImageUrl);
  const footerBase64 = await fetchBrandingImageAsBase64(brandingData?.footerImageUrl);
  const watermarkBase64 = await fetchBrandingImageAsBase64(brandingData?.watermarkImageUrl);

  /** Desenha a marca d'água na página atual (atrás do texto, para não sobrepor o conteúdo). */
  const drawWatermarkOnCurrentPage = () => {
    if (!watermarkBase64) return;
    const imgProps = doc.getImageProperties(watermarkBase64);
    const ar = imgProps.width / imgProps.height;
    const w = 10;
    doc.addImage(watermarkBase64, 'PNG', (pageWidth - w) / 2, (pageHeight - w / ar) / 2, w, w / ar, undefined, 'FAST');
  };

  const addHeaderFooter = () => {
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      if (headerBase64) doc.addImage(headerBase64, 'PNG', margin, 1, contentWidth, 2.2);
      if (footerBase64) doc.addImage(footerBase64, 'PNG', margin, pageHeight - 1.5, contentWidth, 1.2);
    }
  };

  if (watermarkBase64) drawWatermarkOnCurrentPage();

  let y = headerBase64 ? 3.8 : 2;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('CONTRATO PARA PRESTAÇÃO DE SERVIÇOS TÉCNICOS DE ASSESSORIA E CONSULTORIA AMBIENTAL', pageWidth / 2, y, { align: 'center', maxWidth: contentWidth });
  y += 1;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);

  const introContratante = `Pelo presente instrumento particular de Contrato de prestação de serviços no Município de ${contratante.municipio || '_______________'}- ${contratante.uf || '__'}, de um lado Sr(a). ${contratante.nome}; ${contratante.nacionalidade || 'brasileira'}, ${(contratante.estadoCivil || '').toLowerCase()}, CPF ${contratante.cpfCnpj || '__________________'} ${contratante.identidade ? `RG ${contratante.identidade} ${contratante.emissor || 'SSP'}` : ''}, residente e domiciliado à ${contratante.endereco || '__________________'}, nº ${contratante.numero || '___'}, ${contratante.bairro ? `Bairro ${contratante.bairro}, ` : ''}CEP ${contratante.cep || '_____-___'}, no município de ${contratante.municipio || '_______________'} – ${contratante.uf || '__'}, à doravante denominado CONTRATANTE`;
  y = addText(doc, introContratante, margin, y, contentWidth, pageHeight, marginBottom, 0.45, drawWatermarkOnCurrentPage);
  y += 0.3;

  const introContratada = `e do outro lado a ${contratado.name || '__________________'}, com sede na ${contratado.address || '__________________'}, ${contratado.cnpj ? `CNPJ ${contratado.cnpj}` : ''}, sob responsabilidade técnica do(a) Sr(a). ${responsavel.name || '__________________'}, ${responsavel.profession || '__________________'}, ${responsavel.nacionalidade || 'brasileira'}, ${(responsavel.estadoCivil || '').toLowerCase()}, CPF ${responsavel.cpf || '__________________'} e Cédula de Identidade nº ${responsavel.identidade || '__________________'} ${responsavel.emissor ? `SSP-${responsavel.emissor}` : ''}, residente e domiciliado na cidade de ${responsavel.address || '__________________'}, doravante denominada CONTRATADA. Mediantes as cláusulas e condições seguintes tem justo e contrato o que se segue:`;
  y = addText(doc, introContratada, margin, y, contentWidth, pageHeight, marginBottom, 0.45, drawWatermarkOnCurrentPage);
  y += 0.8;

  y = addClauseTitle(doc, 'CLÁUSULA PRIMEIRA - DO OBJETO', y, pageWidth, pageHeight, marginBottom, drawWatermarkOnCurrentPage);
  const objetoText = `O presente contrato foi elaborado no sentido de atender a demanda solicitada para ${objeto.empreendimento || '__________________'} no município de ${objeto.municipio || '__________________'} no estado de ${objeto.uf || '__'} e consiste nas seguintes prestações de serviços:`;
  y = addText(doc, objetoText, margin, y, contentWidth, pageHeight, marginBottom, 0.45, drawWatermarkOnCurrentPage);
  y += 0.3;

  const itens = objeto.itens && objeto.itens.length > 0 ? objeto.itens : [{ descricao: objeto.servicos || '—', valor: pagamento?.valorTotal ?? 0 }];
  if (y > pageHeight - 4) { doc.addPage(); y = 2.5; drawWatermarkOnCurrentPage(); }
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('Item', margin, y);
  doc.text('Serviços', margin + 1.5, y);
  doc.text('Valor', pageWidth - margin - 3, y, { align: 'right' });
  y += 0.5;
  doc.setFont('helvetica', 'normal');
  for (let i = 0; i < itens.length; i++) {
    if (y > pageHeight - marginBottom - 0.5) { doc.addPage(); y = 2.5; drawWatermarkOnCurrentPage(); }
    const item = itens[i];
    const descLines = doc.splitTextToSize(item.descricao || '—', contentWidth - 4);
    doc.text(String(i + 1), margin, y);
    doc.text(descLines[0], margin + 1.5, y);
    doc.text(formatCurrency(Number(item.valor) || 0), pageWidth - margin - 3, y, { align: 'right' });
    y += 0.45;
    for (let j = 1; j < descLines.length; j++) {
      doc.text(descLines[j], margin + 1.5, y);
      y += 0.4;
    }
  }
  y += 0.6;

  y = addClauseTitle(doc, 'CLÁUSULA SEGUNDA - DAS OBRIGAÇÕES DA CONTRATADA', y, pageWidth, pageHeight, marginBottom, drawWatermarkOnCurrentPage);
  y = addText(doc, 'A CONTRATADA assume inteira responsabilidade pelos serviços técnicos que serão realizados, assim como pelas orientações técnicas que transmitir ao CONTRATANTE em função do objeto deste contrato.', margin, y, contentWidth, pageHeight, marginBottom, 0.45, drawWatermarkOnCurrentPage);
  y += 0.4;

  y = addClauseTitle(doc, 'CLÁUSULA TERCEIRA - DAS OBRIGAÇÕES DO CONTRATANTE', y, pageWidth, pageHeight, marginBottom, drawWatermarkOnCurrentPage);
  y = addText(doc, 'O CONTRATANTE compromete-se a observar e a cumprir rigorosamente todas as orientações técnicas transmitidas pela CONTRATADA, sob pena de eximir esta das consequências pela não observância e cumprimento.', margin, y, contentWidth, pageHeight, marginBottom, 0.45, drawWatermarkOnCurrentPage);
  y += 0.4;

  y = addClauseTitle(doc, 'CLÁUSULA QUARTA - DA FORMA DE PAGAMENTO', y, pageWidth, pageHeight, marginBottom, drawWatermarkOnCurrentPage);
  const cl4 = `O CONTRATANTE pagará à CONTRATADA pelos serviços prestados o valor total de ${formatCurrency(Number(pagamento?.valorTotal) || 0)} (${pagamento?.valorExtenso || '__________________'}) com a contratação dos estudos que se seguem. Forma de pagamento: ${pagamento?.forma || '__________________'}.`;
  y = addText(doc, cl4, margin, y, contentWidth, pageHeight, marginBottom, 0.45, drawWatermarkOnCurrentPage);
  y += 0.25;
  if (pagamento?.banco || pagamento?.agencia || pagamento?.conta || pagamento?.pix) {
    const bancoPart = pagamento.banco ? 'banco ' + pagamento.banco + ', ' : '';
    const agenciaPart = pagamento.agencia ? 'Agência ' + pagamento.agencia + ', ' : '';
    const contaPart = pagamento.conta ? 'Conta ' + pagamento.conta + '; ' : '';
    const pixPart = pagamento.pix ? 'PIX e CNPJ: ' + (contratado.cnpj || pagamento.pix) : '';
    const dadosBanc = `Dados para pagamento e/ou depósito: ${contratado.name || '—'}, ${bancoPart}${agenciaPart}${contaPart}${pixPart}.`;
    y = addText(doc, dadosBanc, margin, y, contentWidth, pageHeight, marginBottom, 0.45, drawWatermarkOnCurrentPage);
    y += 0.25;
  }
  const parag1 = 'PARÁGRAFO PRIMEIRO: Ficará sob a responsabilidade do CONTRATANTE o(s) pagamento(s) de taxa(s) estabelecidas pelos órgãos competentes.';
  const parag2 = 'PARÁGRAFO SEGUNDO: Serão também de responsabilidade do CONTRATANTE eventuais outros serviços e/ou despesas aqui não incluídas e que surgirem em função da execução do objeto deste contrato, devendo os valores inerentes serem especificados e submetidos previamente à análise do CONTRATANTE.';
  const parag3 = 'PARÁGRAFO TERCEIRO: Serão de responsabilidade do CONTRATANTE quanto à parte arqueológica e espeleológica, caso necessário relatório de gradação de cavidades.';
  const parag4 = 'PARÁGRAFO QUARTO: Serão de responsabilidade do CONTRATANTE eventuais deslocamentos extraordinários, quando não forem para o município de Belo Horizonte ou não se tratarem de assuntos relacionados ao projeto/escopo deste contrato.';
  y = addText(doc, parag1, margin, y, contentWidth, pageHeight, marginBottom, 0.42, drawWatermarkOnCurrentPage);
  y = addText(doc, parag2, margin, y, contentWidth, pageHeight, marginBottom, 0.42, drawWatermarkOnCurrentPage);
  y = addText(doc, parag3, margin, y, contentWidth, pageHeight, marginBottom, 0.42, drawWatermarkOnCurrentPage);
  y = addText(doc, parag4, margin, y, contentWidth, pageHeight, marginBottom, 0.42, drawWatermarkOnCurrentPage);
  y += 0.4;

  const cl5 = 'CLÁUSULA QUINTA - DO PRAZO - Este instrumento é celebrado por tempo indeterminado, iniciando-se na assinatura do contrato e terminando na conclusão dos serviços relacionados na Cláusula Primeira.';
  y = addClauseTitle(doc, cl5, y, pageWidth, pageHeight, marginBottom, drawWatermarkOnCurrentPage);
  y += 0.4;

  const cl6 = 'CLÁUSULA SEXTA - DAS SANÇÕES E PENALIDADES - No caso do não cumprimento da Cláusula Quarta, fica o CONTRATANTE sujeito à multa de 30% (trinta por cento) sobre o valor inadimplido. Persistindo a inadimplência, a CONTRATADA poderá retirar sua responsabilidade técnica sobre o processo oriundo deste contrato, eximindo-se de qualquer responsabilidade por eventuais danos decorrentes.';
  y = addClauseTitle(doc, cl6, y, pageWidth, pageHeight, marginBottom, drawWatermarkOnCurrentPage);
  y += 0.4;

  const cl7 = 'CLÁUSULA SÉTIMA - Quando o processo for julgado e a licença for concedida, o cumprimento das condicionantes impostas pelos órgãos ambientais competentes será objeto de novo contrato, se necessário.';
  y = addClauseTitle(doc, cl7, y, pageWidth, pageHeight, marginBottom, drawWatermarkOnCurrentPage);
  y += 0.4;

  const cl8 = 'CLÁUSULA OITAVA - Caso o órgão ambiental venha a solicitar informações complementares (durante o período de análise do projeto) que não sejam próprias do estudo elaborado, o valor para elaboração será combinado à parte. Para correção ou adequação de qualquer parte do estudo não será cobrado valor adicional do CONTRATANTE.';
  y = addClauseTitle(doc, cl8, y, pageWidth, pageHeight, marginBottom, drawWatermarkOnCurrentPage);
  y += 0.4;

  const cl9Body = `Por meio deste instrumento, a ${contratado.name || 'CONTRATADA'} está autorizada a coletar, armazenar e utilizar os dados pessoais do(a) contratante ${contratante.nome} tais como nome, endereço, número de identificação, informações de contato e quaisquer outros dados pertinentes à execução e manutenção do contrato entre as partes. Essas informações serão utilizadas exclusivamente para os fins de manutenção, cumprimento e execução do referido contrato. Ainda que o contratante seja Pessoa jurídica poderá ocorrer a coleta de dados pessoais (ex.: sócios, contato, e-mail, cópias de documentos). Qualquer dado pessoal coletado será utilizado para fins de manutenção de contrato e cumprimento de obrigações legais (ex.: emissão de Nota Fiscal). Poderá ocorrer o repasse para órgãos ambientais imprescindíveis para cadastramento e realização da atividade fim. Os dados pessoais não serão compartilhados com parceiros de negócios a menos que envolvidos na execução do serviço contratado, mediante concordância do contratante. Ao concordar com esta cláusula, o(a) contratante declara estar ciente e de acordo com a coleta e uso dos seus dados pessoais. Contato: ${contratado.name || '—'}, ${contratado.address || '—'}.`;
  y = addClauseTitle(doc, 'CLÁUSULA NONA - Proteção de Dados Pessoais', y, pageWidth, pageHeight, marginBottom, drawWatermarkOnCurrentPage);
  y = addText(doc, cl9Body, margin, y, contentWidth, pageHeight, marginBottom, 0.42, drawWatermarkOnCurrentPage);
  y += 0.4;

  const cl10 = "CLÁUSULA DÉCIMA - Dever de Sigilo e Confidencialidade: As partes reconhecem a importância da proteção dos dados pessoais e se comprometem a manter estrito sigilo sobre todas as informações obtidas ou acessadas durante a execução deste contrato. Entende-se por 'dados pessoais' todas as informações relacionadas à pessoa física identificada ou identificável. As partes se comprometem a não divulgar, compartilhar, ceder ou transferir tais dados, salvo mediante autorização por escrito do titular ou quando necessário para cumprimento de obrigações legais. O dever de sigilo perdurará mesmo após o término deste contrato.";
  y = addClauseTitle(doc, cl10, y, pageWidth, pageHeight, marginBottom, drawWatermarkOnCurrentPage);
  y += 0.4;

  const cl11 = 'CLÁUSULA DÉCIMA PRIMEIRA - DAS CONDIÇÕES COMPLEMENTARES: Para fins de complementação das obrigações contratuais, estabelecem as partes que: (I) O presente contrato vincula-se expressamente ao Processo, incluindo o cumprimento de PRADA e PTRF quando aplicáveis; (II) Os pagamentos sob responsabilidade do CONTRATANTE deverão ocorrer conforme a forma e datas acordadas na Cláusula Quarta; (III) Os valores constantes na proposta incluem os serviços técnicos prestados, abrangendo honorários, relatórios, monitoramentos, visitas técnicas e demais atividades necessárias à execução do objeto contratual; (IV) Todas as taxas, emolumentos e despesas vinculadas a órgãos ambientais serão de responsabilidade do CONTRATANTE.';
  y = addClauseTitle(doc, cl11, y, pageWidth, pageHeight, marginBottom, drawWatermarkOnCurrentPage);
  y += 0.4;

  const cl12 = `CLÁUSULA DÉCIMA SEGUNDA - DO FORO - Os casos omissos serão resolvidos de comum acordo. Para dirimir dúvidas ou conflitos, fica eleito o Foro da Comarca de ${foro.comarca || 'Unaí'} – ${foro.uf || 'MG'}.`;
  y = addClauseTitle(doc, cl12, y, pageWidth, pageHeight, marginBottom, drawWatermarkOnCurrentPage);
  y += 0.6;

  const encerramento = 'E por estarem de comum acordo, assinam o presente instrumento em 02 (duas) vias de igual teor e forma.';
  y = addText(doc, encerramento, margin, y, contentWidth, pageHeight, marginBottom, 0.45, drawWatermarkOnCurrentPage);
  y += 0.8;

  const dataContrato = contract.dataContrato ? new Date(contract.dataContrato).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }) : '____________________';
  const cidadeForo = foro.comarca || 'Unaí';
  doc.text(`${cidadeForo}/${foro.uf || 'MG'}, ${dataContrato}.`, margin, y);
  y += 1.2;

  doc.setFont('helvetica', 'normal');
  doc.text('_______________________________________________________________', margin, y);
  y += 0.5;
  doc.text(contratante.nome || 'CONTRATANTE', margin, y);
  doc.text(`CPF ${contratante.cpfCnpj || '__________________'}`, margin, y + 0.45);
  doc.text('Contratante', margin, y + 0.9);
  y += 1.5;

  doc.text('_________________________________________________________________', margin, y);
  y += 0.5;
  doc.text(contratado.name || 'CONTRATADA', margin, y);
  doc.text(contratado.cnpj ? `CNPJ ${contratado.cnpj}` : '', margin, y + 0.45);
  doc.text('Contratada', margin, y + 0.9);
  y += 1.4;

  doc.setFontSize(9);
  doc.text('Testemunha 1: ____________________________________________;', margin, y);
  doc.text('Testemunha 2: _____________________________________________.', margin, y + 0.5);

  addHeaderFooter();
  doc.save(`Contrato_Prestacao_Servicos_${(contratante.nome || 'Contratante').replace(/\s+/g, '_')}.pdf`);
}
