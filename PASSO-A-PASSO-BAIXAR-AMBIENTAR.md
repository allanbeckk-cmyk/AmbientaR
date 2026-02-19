# Passo a passo detalhado: baixar o AmbientaR para sua máquina

Este guia explica **do zero** como baixar o projeto AmbientaR que está vinculado ao projeto **studio-316805764-e4d13** (Google Cloud / Firebase) e rodar na sua máquina.

---

## Entendendo de onde vem o projeto

- **studio-316805764-e4d13** é o **ID do projeto** no Google Cloud e no Firebase.
- No Firebase ficam: o **site publicado** (Hosting), **dados** (Firestore), **autenticação** (Auth), etc.
- O **código-fonte** do AmbientaR não fica no Firebase; ele fica no **GitHub**, no repositório:  
  **https://github.com/allanbeckk-cmyk/AmbientaR**

Para “baixar o projeto para a máquina” você vai:
1. Baixar o código do GitHub (clone ou pull).
2. (Opcional) Pegar a configuração do Firebase do projeto **studio-316805764-e4d13** para o app rodar com os mesmos dados/serviços.
3. Instalar dependências e rodar o projeto localmente.

---

## Pré-requisitos na sua máquina

Antes de começar, você precisa ter instalado:

| Ferramenta | Para que serve | Como verificar |
|------------|----------------|----------------|
| **Git** | Baixar e atualizar o código do GitHub | Abra o PowerShell e digite: `git --version` |
| **Node.js** | Rodar projetos com `npm` (se o projeto usar) | Digite: `node --version` e `npm --version` |

- Se **Git** não estiver instalado: baixe em https://git-scm.com/download/win e instale.
- Se **Node.js** não estiver: baixe em https://nodejs.org/ (versão LTS) e instale.

---

## Passo 1: Escolher onde o projeto vai ficar na sua máquina

Decida a pasta onde o AmbientaR vai ficar. Exemplos:

- **Opção A:** Usar a pasta que você já tem:  
  `C:\Users\Allan Pimenta\Documents\GitHub\AmbientaR`
- **Opção B:** Criar uma pasta nova, por exemplo:  
  `C:\Users\Allan Pimenta\Documents\AmbientaR`

Anote o caminho; você vai usar nos próximos passos.

---

## Passo 2: Abrir o terminal na pasta escolhida

1. Pressione **Win + R**, digite `powershell` e pressione Enter (ou abra “Windows PowerShell” pelo menu Iniciar).
2. No PowerShell, vá até a pasta escolhida:

   **Se for usar a pasta que já existe (Opção A):**
   ```powershell
   cd "C:\Users\Allan Pimenta\Documents\GitHub\AmbientaR"
   ```

   **Se for criar uma pasta nova (Opção B):**
   ```powershell
   cd "C:\Users\Allan Pimenta\Documents"
   mkdir AmbientaR
   cd AmbientaR
   ```

---

## Passo 3: Baixar o código do GitHub

Há duas situações possíveis.

### Situação A: A pasta já existe e já tem o repositório Git (ex.: só a pasta `.git`)

Isso é o que você tem em `Documents\GitHub\AmbientaR`. Faça o seguinte:

1. Certifique-se de estar na pasta do projeto:
   ```powershell
   cd "C:\Users\Allan Pimenta\Documents\GitHub\AmbientaR"
   ```

2. Buscar as últimas atualizações do GitHub:
   ```powershell
   git fetch origin
   ```

3. Garantir que está na branch `main`:
   ```powershell
   git checkout main
   ```

4. Trazer o código para a pasta (se a pasta estiver “vazia”, isso preenche com os arquivos):
   ```powershell
   git pull origin main
   ```

   Se o Git reclamar que não há tracking, use:
   ```powershell
   git branch --set-upstream-to=origin/main main
   git pull
   ```

5. Se mesmo assim a pasta continuar sem arquivos (só `.git`), force a pasta a ficar igual ao GitHub:
   ```powershell
   git reset --hard origin/main
   ```

Depois disso, na pasta devem aparecer os arquivos do projeto (por exemplo `index.html`, `package.json`, pastas `src`, etc.).

### Situação B: Você está em uma pasta vazia e quer clonar do zero

1. Vá para a pasta onde quer criar o projeto (ex.: `Documents`):
   ```powershell
   cd "C:\Users\Allan Pimenta\Documents"
   ```

2. Clone o repositório do AmbientaR (isso cria a pasta `AmbientaR` com todo o código):
   ```powershell
   git clone https://github.com/allanbeckk-cmyk/AmbientaR.git
   ```

3. Entre na pasta criada:
   ```powershell
   cd AmbientaR
   ```

Agora o código do AmbientaR está na sua máquina.

---

## Passo 4: (Opcional) Configurar o projeto para usar o Firebase do studio-316805764-e4d13

Para o app rodar localmente **usando os mesmos dados e serviços** do projeto **studio-316805764-e4d13**:

1. Abra o navegador e acesse: **https://console.firebase.google.com/**
2. Faça login na conta Google que usa esse projeto.
3. Na lista de projetos, clique no projeto que tem o ID **studio-316805764-e4d13** (o nome pode ser “AmbientaR” ou outro).
4. Clique no **ícone de engrenagem** ao lado de “Visão geral do projeto” e escolha **Configurações do projeto**.
5. Na aba **Geral**, role até a seção **“Seus aplicativos”**.
6. Se já existir um **app Web** (ícone `</>`), clique nele.  
   Se não existir, clique em **“Adicionar aplicativo”** e depois no ícone **Web** (`</>`), dê um apelido (ex.: “AmbientaR Web”) e registre.
7. Você verá um bloco de código com **`firebaseConfig`**, algo assim:
   ```javascript
   const firebaseConfig = {
     apiKey: "...",
     authDomain: "...",
     projectId: "studio-316805764-e4d13",
     storageBucket: "...",
     messagingSenderId: "...",
     appId: "..."
   };
   ```
8. **Copie** esse objeto (ou anote os valores).
9. No projeto que você baixou na sua máquina, procure um arquivo de configuração do Firebase, por exemplo:
   - `src/firebase.js` ou `src/firebase.ts`
   - `config/firebase.js`
   - `.env` ou `.env.local`
   - Ou um arquivo onde apareça “firebase” no nome.
10. Cole os valores no lugar onde o projeto espera a configuração (substituindo os placeholders ou valores antigos).  
    Se o projeto usar `.env`, use variáveis como:
    ```env
    VITE_FIREBASE_API_KEY=...
    VITE_FIREBASE_AUTH_DOMAIN=...
    VITE_FIREBASE_PROJECT_ID=studio-316805764-e4d13
    ```
    (os nomes exatos dependem do que o código do AmbientaR já usa.)

Assim, ao rodar na sua máquina, o app continuará conectado ao mesmo projeto Firebase **studio-316805764-e4d13**.

---

## Passo 5: Instalar dependências (se o projeto tiver `package.json`)

1. No PowerShell, certifique-se de estar **dentro da pasta do projeto** (onde está o `package.json`):
   ```powershell
   cd "C:\Users\Allan Pimenta\Documents\GitHub\AmbientaR"
   ```
   (ou o caminho que você usou no Passo 2.)

2. Instale as dependências:
   ```powershell
   npm install
   ```

   Aguarde até terminar. Se aparecer erro de rede, tente de novo ou use uma rede estável.

---

## Passo 6: Rodar o projeto na sua máquina

Ainda na pasta do projeto:

- **Se existir `package.json`** (projeto Node/React/Vite etc.):
  ```powershell
  npm run dev
  ```
  ou, se não existir o script `dev`:
  ```powershell
  npm start
  ```
  O terminal vai mostrar um endereço (ex.: `http://localhost:5173`). Abra esse endereço no navegador.

- **Se for só HTML/CSS/JS** (sem `package.json` ou sem script de desenvolvimento):
  ```powershell
  npx serve .
  ```
  ou:
  ```powershell
  npx live-server
  ```
  Use o endereço que aparecer no terminal (ex.: `http://localhost:3000`).

Pronto: o AmbientaR está rodando **internamente na sua máquina**, e, se você fez o Passo 4, usando o Firebase do projeto **studio-316805764-e4d13**.

---

## Resumo em ordem

| Ordem | O que fazer |
|-------|-------------|
| 1 | Ter Git e Node.js instalados |
| 2 | Abrir PowerShell e ir até a pasta onde quer o projeto |
| 3 | **Baixar o código:** `git pull origin main` (pasta já existente) ou `git clone https://github.com/allanbeckk-cmyk/AmbientaR.git` (pasta nova) |
| 4 | (Opcional) No Firebase Console, projeto **studio-316805764-e4d13**, copiar `firebaseConfig` e colar no projeto local |
| 5 | Na pasta do projeto: `npm install` |
| 6 | Rodar: `npm run dev` ou `npm start` ou `npx serve .` |

Se em algum passo aparecer uma mensagem de erro, copie a mensagem completa e o comando que você usou para poder corrigir (ou perguntar com o erro exato).
