# Rodar a aplicação AmbientaR no notebook

Se o site funcionava ontem e hoje não abre, siga estes passos **no PowerShell** (abrir como Administrador se precisar).

**Resumo:** na pasta do projeto, use `npm install` (uma vez) e depois `npm run dev`. Acesse **http://localhost:9002** no navegador.

---

## 1. Abrir o PowerShell na pasta do projeto

```powershell
cd "C:\Users\Allan Pimenta\Documents\GitHub\AmbientaR"
```

---

## 2. Verificar Node e npm

```powershell
node --version
npm --version
```

- Se der erro "não reconhecido", o **Node.js** não está no PATH ou foi desinstalado. Reinstale em https://nodejs.org (versão LTS).

---

## 3. Ver se a porta 9002 está ocupada

```powershell
netstat -ano | findstr "9002"
```

- Se aparecer alguma linha, outro processo está usando a porta. Você pode:
  - **Fechar** o outro programa que está usando a 9002, ou
  - **Mudar a porta** do AmbientaR: no `package.json`, na linha do script `"dev"`, troque `-p 9002` por `-p 3000` (por exemplo) e salve.

---

## 4. Instalar dependências (se ainda não instalou ou mudou algo)

```powershell
npm install
```

Aguarde terminar (pode demorar alguns minutos).

---

## 5. Iniciar o servidor

```powershell
npm run dev
```

- Deve aparecer algo como: **Local: http://localhost:9002**
- Deixe essa janela **aberta**. Abra o navegador e acesse: **http://localhost:9002**

---

## Se ainda não funcionar

- **Antivírus / Firewall:** pode estar bloqueando Node ou a porta. Tente permitir o Node ou desativar temporariamente para testar.
- **Encerrar processo na porta 9002:** no PowerShell (como Admin):
  ```powershell
  netstat -ano | findstr "9002"
  ```
  Anote o **PID** (último número da linha). Depois:
  ```powershell
  taskkill /PID <número_do_PID> /F
  ```
  Substitua `<número_do_PID>` pelo número anotado. Depois rode `npm run dev` de novo.
- **Limpar cache do Next.js:**
  ```powershell
  Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
  npm run dev
  ```

Depois de rodar esses passos, se algo der erro, copie a mensagem que aparecer no PowerShell e envie para analisarmos.
