# Depois de baixar os arquivos manualmente do Studio

Você vai colocar os arquivos baixados do projeto **studio-316805764-e4d13** nesta pasta (ou na pasta que preferir). Siga estes passos para rodar e trabalhar no seu ambiente interno.

---

## 1. Onde colocar os arquivos

- **Opção A:** Dentro desta pasta do repositório:  
  `C:\Users\Allan Pimenta\Documents\GitHub\AmbientaR`  
  Coloque aqui os arquivos que você baixou (por exemplo: `index.html`, `src/`, `package.json`, etc.), na raiz do projeto.

- **Opção B:** Em outra pasta (ex.: `C:\Users\Allan Pimenta\Documents\AmbientaR`).  
  Anote o caminho para usar nos comandos abaixo.

---

## 2. Instalar dependências (se tiver `package.json`)

Abra o **PowerShell**, vá até a pasta onde estão os arquivos e rode:

```powershell
cd "C:\Users\Allan Pimenta\Documents\GitHub\AmbientaR"
npm install
```

(Só faça isso se existir um arquivo `package.json` na pasta.)

---

## 3. Rodar o projeto no seu notebook

- **Se for projeto com Node/React/Vite etc.:**
  ```powershell
  npm run dev
  ```
  ou
  ```powershell
  npm start
  ```
  Abra no navegador o endereço que aparecer no terminal (ex.: `http://localhost:5173`).

- **Se for só HTML/CSS/JS (sem `package.json` ou sem script de dev):**
  ```powershell
  npx serve .
  ```
  Use o endereço que aparecer (ex.: `http://localhost:3000`).

---

## 4. Trabalhar nas melhorias

- Edite os arquivos no seu editor (ex.: Cursor).
- Salve e atualize a página no navegador para ver as mudanças.
- Tudo roda no seu ambiente interno, sem depender do Firebase Studio.

Quando terminar de baixar e colocar os arquivos, use estes passos para começar a desenvolver.
