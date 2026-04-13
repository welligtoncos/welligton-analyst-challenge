# Frontend — Gestão de produtos (Angular)

SPA em **Angular 19** com **PrimeNG** que consome a API FastAPI do monorepo: login, rota protegida e CRUD de produtos (listagem, modal de criação/edição, exclusão com confirmação).

## Pré-requisitos

- **Node.js** 20 LTS (ou 18.19+), compatível com Angular 19.
- **npm** (vem com o Node).
- **Backend** em execução na porta **8000** quando você usar `ng serve` (o proxy encaminha `/api` para `http://127.0.0.1:8000`). Suba a API conforme o [README do backend](../app_backend/README.md) ou o [README na raiz do monorepo](../README.md).

Opcional: **Angular CLI** global (`npm i -g @angular/cli`); o projeto também funciona com `npx ng serve`.

## Instalação

Na pasta deste projeto:

```bash
cd app_frontend_analytst-challenge
npm install
```

## Servidor de desenvolvimento

```bash
npm start
```

Equivalente a `ng serve` com a configuração padrão do `angular.json` (inclui **proxy**).

- **URL da aplicação**: http://localhost:4200/
- Em desenvolvimento o build usa a configuração **development** (source maps, sem otimizações agressivas de produção).

Para porta ou host explícitos:

```bash
npx ng serve --port 4200 --host localhost
```

## Docker (imagem de produção)

Build em vários estágios: **Node 20** gera o bundle de produção; **Nginx** serve os arquivos estáticos e faz **proxy de `/api/`** para o serviço `api` na rede do Docker Compose (`http://api:8000`).

Na pasta deste projeto (somente a imagem do front):

```bash
docker build -t welligton-frontend .
```

Com a **stack completa**, na pasta `app_backend`:

```bash
docker compose up --build
```

Com `FRONTEND_PORT=9080` (padrão sugerido no Compose):

- **App**: http://localhost:9080/  
- **Login**: http://localhost:9080/login  

Outra porta: ajuste `FRONTEND_PORT` no `.env` em `app_backend/` e suba o Compose de novo.

O app usa `API_BASE_URL = '/api'`; o Nginx encaminha `/api/` para o serviço `api` na rede Docker (porta interna **8000**). **Swagger pelo proxy**: http://localhost:9080/api/docs (útil quando a API no host está em outra porta, ex. `API_HOST_PORT=8001` → **http://localhost:8001/docs**).

## Proxy e URL da API

O arquivo [`proxy.conf.json`](proxy.conf.json) define:

| Pedido no browser | Encaminhado para |
|--------------------|------------------|
| `http://localhost:4200/api/...` | `http://127.0.0.1:8000/...` (prefixo `/api` removido) |

Exemplo: `POST /api/auth/login` → `POST http://127.0.0.1:8000/auth/login`.

O [`src/app/api.config.ts`](src/app/api.config.ts) define `API_BASE_URL = '/api'`, ou seja, todos os serviços HTTP usam caminhos relativos ao origin do dev server. **Não é necessário** configurar CORS no browser para outro host: o browser fala só com `:4200`.

Se a API não estiver a correr na **8000**, altere o `target` em `proxy.conf.json` ou use um backend nessa porta.

## Fluxo de telas

1. **`/`** — redireciona para `/login`.
2. **`/login`** — formulário reativo (e-mail, senha). Em sucesso, o access token é guardado em `localStorage` e a navegação segue para o portal.
3. **`/portal`** — protegida por `authGuard`; exige token válido (não expirado).
   - Toolbar com resumo (totais), botão **Novo produto**, **Sair**.
   - Tabela PrimeNG com produtos; ações **Editar** e **Remover** (remover abre confirmação).
   - Diálogo para criar ou editar (nome, descrição, preço, quantidade, ativo); validações no formulário reativo.
   - Toasts de sucesso/erro; spinner ao carregar listagem e ao gravar.
4. **`/inicio`** — redireciona para `/portal`.
5. Rotas desconhecidas — redirecionam para `/login`.

O **interceptor** HTTP anexa `Authorization: Bearer …` e, em resposta **401**, remove o token e redireciona para `/login`.

## Usuário de teste

O projeto **não inclui** usuário pré-criado no banco. Crie um usuário pela API e depois use as mesmas credenciais no login.

**Desenvolvimento** (`ng serve` + API na 8000):

1. Abra **http://localhost:8000/docs**.
2. Execute **POST `/auth/register`** com um corpo JSON (exemplo abaixo).
3. Acesse **http://localhost:4200/login** com o mesmo e-mail e senha.

**Docker Compose** (ex.: front na **9080**, API no host na **8001** com `API_HOST_PORT=8001`):

1. Abra **http://localhost:8001/docs** **ou** **http://localhost:9080/api/docs** (mesmo origin do app).
2. Execute **POST `/auth/register`**:

```json
{
  "name": "Usuário Teste",
  "email": "teste@exemplo.com",
  "password": "AltereEstaSenha123"
}
```

3. Entre em **http://localhost:9080/login** com o mesmo e-mail e senha.

Se o registro devolver **409**, o e-mail já existe: use outro e-mail ou faça login com a conta já criada.

## Build de produção

```bash
npm run build
```

Artefactos em `dist/app_frontend_analytst-challenge/`. Em produção precisa de servir o SPA e de **apontar a API** (por exemplo variável de ambiente ou `API_BASE_URL` absoluto para o domínio da API); o proxy do `ng serve` **não** existe no build estático.

## Testes unitários

```bash
npm test
```

Executa Karma/Jasmine (requer ambiente gráfico ou launcher headless configurado).

## Estrutura relevante

| Caminho | Função |
|---------|--------|
| `src/app/pages/login/` | Tela de login |
| `src/app/pages/portal/` | Listagem e CRUD em diálogo |
| `src/app/services/auth.service.ts` | Login, token em `localStorage`, logout |
| `src/app/services/product.service.ts` | Chamadas REST de produtos |
| `src/app/guards/auth.guard.ts` | Proteção de rota |
| `src/app/interceptors/auth.interceptor.ts` | Header JWT e tratamento de 401 |
| `src/app/app.routes.ts` | Definição de rotas |

## Referência CLI Angular

[Angular CLI — documentação](https://angular.dev/tools/cli)
