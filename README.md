# Contas a Pagar — Gestão Financeira

App de controle de despesas financeiras com dashboard, DRE, controle de compras e suporte a despesas recorrentes.

## Funcionalidades

- **Dashboard** com resumo financeiro, gráficos e alertas de vencimento
- **Contas a Pagar** com filtros, upload de PDF e **despesas recorrentes**
- **DRE** (Demonstrativo de Resultado do Exercício) mensal
- **Compras** avulsas com controle por mês
- **Categorias** customizáveis
- Autenticação local (email/senha) com senhas hasheadas via Web Crypto API
- Suporte a login com Google (via Google Identity Services)

## Despesas Recorrentes

Ao criar uma nova conta, ative **"Despesa Recorrente"** e informe o número de meses. O app criará automaticamente uma conta para cada mês, com vencimento mensal a partir da data escolhida e badge indicando `parcela/total`.

## Deploy no Vercel

1. Faça push deste repositório para o GitHub
2. Acesse [vercel.com](https://vercel.com) e importe o repositório
3. Framework: **Vite** (detectado automaticamente)
4. Build Command: `npm run build`
5. Output Directory: `dist`
6. (Opcional) Adicione `VITE_GOOGLE_CLIENT_ID` nas variáveis de ambiente do Vercel

## Desenvolvimento local

```bash
npm install
cp .env.example .env.local
npm run dev
```

## Variáveis de Ambiente

| Variável | Obrigatória | Descrição |
|---|---|---|
| `VITE_GOOGLE_CLIENT_ID` | Não | Client ID do Google OAuth para login social |

## Segurança

- Senhas armazenadas com hash SHA-256 (Web Crypto API) — nunca em texto plano
- Login Google valida estrutura JWT (3 partes) antes de processar
- IDs de usuário gerados com UUID v4 aleatório
- Headers de segurança configurados no `vercel.json`
- Sem dependências de terceiros desnecessárias
