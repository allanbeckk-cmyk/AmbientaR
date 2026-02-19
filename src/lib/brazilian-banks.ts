
export const banks = [
  { "code": "001", "name": "Banco do Brasil S.A." },
  { "code": "003", "name": "Banco da Amazônia S.A." },
  { "code": "004", "name": "Banco do Nordeste do Brasil S.A." },
  { "code": "021", "name": "BANESTES S.A. Banco do Estado do Espírito Santo" },
  { "code": "033", "name": "Banco Santander (Brasil) S.A." },
  { "code": "041", "name": "Banrisul - Banco do Estado do Rio Grande do Sul S.A." },
  { "code": "047", "name": "Banco do Estado de Sergipe S.A." },
  { "code": "070", "name": "BRB - Banco de Brasília S.A." },
  { "code": "077", "name": "Banco Inter S.A." },
  { "code": "104", "name": "Caixa Econômica Federal" },
  { "code": "237", "name": "Banco Bradesco S.A." },
  { "code": "260", "name": "Nu Pagamentos S.A. - Nubank" },
  { "code": "341", "name": "Itaú Unibanco S.A." },
  { "code": "389", "name": "Banco Mercantil do Brasil S.A." },
  { "code": "399", "name": "HSBC Bank Brasil S.A. - Banco Múltiplo" },
  { "code": "422", "name": "Banco Safra S.A." },
  { "code": "655", "name": "Banco Votorantim S.A." },
  { "code": "735", "name": "Banco Neon S.A." },
  { "code": "745", "name": "Banco Citibank S.A." },
  { "code": "748", "name": "Banco Cooperativo Sicredi S.A." },
  { "code": "756", "name": "Banco Cooperativo do Brasil S.A. - BANCOOB" },
  { "code": "000", "name": "Outro (manual)" }
].sort((a, b) => {
    if (a.name < b.name) return -1;
    if (a.name > b.name) return 1;
    return 0;
});
