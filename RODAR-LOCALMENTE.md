# Rodar o AmbientaR localmente (projeto do Firebase)

Este guia explica como baixar o projeto AmbientaR e rodar na sua máquina. O código fica no **GitHub**; o **Firebase** só hospeda a versão publicada — o código-fonte vem do repositório.

---

## 1. Baixar o código do projeto

Na pasta do projeto (ou em qualquer pasta onde queira clonar):

### Se a pasta já existe mas está vazia (só tem `.git`)

No **PowerShell** ou **Prompt de Comando**:

```powershell
cd "C:\Users\Allan Pimenta\Documents\GitHub\AmbientaR"
git pull origin main
```

Se der erro de branch ou “nothing to pull”, tente:

```powershell
git fetch origin
git checkout main
git pull origin main
```

### Se quiser clonar de novo em outra pasta

```powershell
cd C:\Users\Allan Pimenta\Documents\GitHub
git clone https://github.com/allanbeckk-cmyk/AmbientaR.git AmbientaR-local
cd AmbientaR-local
```

---

## 2. Configuração do Firebase (para rodar localmente)

O projeto no Firebase usa o projeto do Google Cloud **studio-316805764-e4d13**. Para rodar na sua máquina com os mesmos dados/serviços:

1. Acesse o [Console do Firebase](https://console.firebase.google.com/).
2. Selecione o projeto **studio-316805764-e4d13** (ou o que estiver ligado ao AmbientaR).
3. Em **Configurações do projeto** (ícone de engrenagem) → **Geral** → role até **“Seus aplicativos”**.
4. Se já existir um app Web, use-o; senão, clique em **“Adicionar aplicativo”** → ícone Web.
5. Copie o objeto `firebaseConfig` (apiKey, authDomain, projectId, etc.).
6. No projeto local, crie ou edite o arquivo de configuração (por exemplo `src/firebase.js`, `config/firebase.js` ou `.env`) e cole essas variáveis, conforme a estrutura do projeto (veja o passo 3).

Não compartilhe as chaves em repositórios públicos; use `.env` e coloque `.env` no `.gitignore`.

---

## 3. Instalar dependências e rodar

Depois do `git pull` (ou clone), na pasta do projeto:

```powershell
cd "C:\Users\Allan Pimenta\Documents\GitHub\AmbientaR"

# Se for projeto Node/React/Vite etc.
npm install

# Rodar em modo desenvolvimento
npm run dev
# ou
npm start
```

Se for só HTML/CSS/JS (sem `package.json`), abra o `index.html` no navegador ou use um servidor simples:

```powershell
npx serve .
# ou
npx live-server
```

---

## 4. Resumo rápido

| Onde | Comando / Ação |
|------|-----------------|
| **Baixar código** | `git pull origin main` (na pasta do repo) ou `git clone https://github.com/allanbeckk-cmyk/AmbientaR.git` |
| **Firebase** | Console Firebase → projeto → Configurações → copiar `firebaseConfig` → colar no projeto local |
| **Rodar** | `npm install` → `npm run dev` (ou `npm start`), ou `npx serve .` se for site estático |

Assim você terá o projeto AmbientaR baixado e rodando internamente na sua máquina, usando o mesmo projeto Firebase se configurar o `firebaseConfig` como acima.
