# Baixar o projeto AmbientaR completo para o notebook (trabalhar sem Firebase Studio)

Este guia é para você ter **todos os arquivos** do projeto no seu notebook e trabalhar nas melhorias no seu **ambiente interno**, sem depender do Firebase Studio.

---

## Duas formas de ter o projeto

### Opção 1: Você já tem o código-fonte em algum lugar

Se o projeto foi desenvolvido em outro PC, backup ou pasta:

1. Copie **toda a pasta do projeto** (incluindo `node_modules` não é obrigatório; melhor sem e rodar `npm install` depois) para o notebook, por exemplo para:
   ```
   C:\Users\Allan Pimenta\Documents\GitHub\AmbientaR
   ```
2. Abra um terminal nessa pasta e rode:
   ```powershell
   npm install
   npm run dev
   ```
   (ou o comando que o projeto usar para desenvolvimento.)

Assim você tem o projeto completo (código-fonte, `package.json`, etc.) e trabalha localmente.

---

### Opção 2: Baixar o que está publicado no Firebase Hosting

Se o que você tem é o **site já publicado** no Firebase (e não o código-fonte), dá para baixar **todos os arquivos públicos** do site (HTML, CSS, JS, imagens) para uma pasta no notebook e abrir/servir localmente.

**Importante:** Você recebe os arquivos **já buildados/publicados**. Não vem a “pasta de desenvolvimento” (ex.: código React separado, `package.json` do projeto original). Mesmo assim dá para editar HTML/CSS/JS e ver no navegador.

#### Passo a passo

1. **Descobrir a URL do site**
   - Acesse: https://console.firebase.google.com/
   - Selecione o projeto **studio-316805764-e4d13**
   - No menu lateral, clique em **Hosting**
   - Copie a URL do site (ex.: `https://studio-316805764-e4d13.web.app` ou um domínio customizado)

2. **Instalar dependências deste repositório** (só uma vez)
   ```powershell
   cd "C:\Users\Allan Pimenta\Documents\GitHub\AmbientaR"
   npm install
   ```

3. **Baixar o site para uma pasta no notebook**
   ```powershell
   node scripts/baixar-site.js https://SUA-URL-AQUI.web.app
   ```
   Troque `https://SUA-URL-AQUI.web.app` pela URL que você copiou do Hosting.  
   Os arquivos serão salvos na pasta **`ambientar-site`**.

4. **Ver o site no seu ambiente interno**
   ```powershell
   npm run servir
   ```
   Abra no navegador o endereço que aparecer (ex.: `http://localhost:3000`).

5. **Trabalhar nas melhorias**
   - Edite os arquivos dentro de **`ambientar-site`** (HTML, CSS, JS).
   - Atualize a página no navegador para ver as mudanças.
   - Quando quiser publicar de novo, use o Firebase Hosting a partir dessa pasta ou do seu código-fonte.

---

## Resumo rápido

| Objetivo | O que fazer |
|----------|-------------|
| Tenho o código-fonte em outra pasta/PC | Copiar a pasta do projeto para o notebook → `npm install` → `npm run dev` (ou comando do projeto) |
| Só tenho o site no Firebase Hosting | Pegar a URL no Console Firebase → `npm install` → `node scripts/baixar-site.js URL` → `npm run servir` |

Assim você baixa o projeto todo (código-fonte ou site publicado) para o notebook e trabalha na melhoria da aplicação no seu ambiente interno, sem usar o Firebase Studio.
