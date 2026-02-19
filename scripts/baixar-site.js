/**
 * Baixa o site publicado (ex.: Firebase Hosting) para a pasta ambientar-site.
 * Uso: node scripts/baixar-site.js [URL]
 * Exemplo: node scripts/baixar-site.js https://studio-316805764-e4d13.web.app
 *
 * Se não passar URL, usa a que estiver em config/site-url.txt ou pede para configurar.
 */

const path = require('path');
const fs = require('fs');

let url = process.argv[2];

if (!url) {
  const configPath = path.join(__dirname, '..', 'config', 'site-url.txt');
  if (fs.existsSync(configPath)) {
    url = fs.readFileSync(configPath, 'utf8').trim();
  }
}

if (!url) {
  console.log(`
Uso: node scripts/baixar-site.js <URL_DO_SITE>

Exemplo:
  node scripts/baixar-site.js https://studio-316805764-e4d13.web.app
  node scripts/baixar-site.js https://seu-dominio-customizado.com

Ou crie a pasta config e o arquivo config/site-url.txt com a URL na primeira linha.
Depois execute: node scripts/baixar-site.js

Para descobrir a URL do seu site no Firebase:
  1. Acesse https://console.firebase.google.com/
  2. Selecione o projeto (studio-316805764-e4d13)
  3. No menu, clique em "Hosting"
  4. Use a URL que aparece (ex.: https://....web.app)
`);
  process.exit(1);
}

// Remove barra final se houver
url = url.replace(/\/$/, '');
const outputDir = path.join(__dirname, '..', 'ambientar-site');

console.log('Baixando site:', url);
console.log('Pasta de destino:', outputDir);
console.log('Aguarde...\n');

const scrape = require('website-scraper');

const options = {
  urls: [url],
  directory: outputDir,
  maxDepth: 1,
  maxRecursiveDepth: 1,
  request: {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
  }
};

scrape(options)
  .then(() => {
    console.log('\nConcluído! Arquivos em:', outputDir);
    console.log('Para ver o site localmente: npm run servir');
  })
  .catch((err) => {
    console.error('Erro ao baixar:', err.message);
    process.exit(1);
  });
