# Desafio técnico — Gestão de produtos (full stack)

Monorepo com **API FastAPI** (autenticação JWT, CRUD de produtos, PostgreSQL) e **SPA Angular** (login, área logada com CRUD). Eventos de produto são publicados no **RabbitMQ**; um **consumer** grava auditoria assíncrona no **MongoDB**.

## Objetivo da aplicação

Permitir que um usuário autenticado gerencie produtos (criar, listar, consultar por ID, editar e remover), com API documentada em OpenAPI e fluxo assíncrono de auditoria via mensageria.

## Arquitetura (resumo)

**Desenvolvimento local (`ng serve`):**

```text
[Angular :4200]  --proxy /api-->  [FastAPI host :8000]  -->  [PostgreSQL]
```

**Docker Compose** (Nginx no host publica o Angular; a API pode usar outra porta no host se `8000` estiver ocupada):

```text
[Browser :9080]  --/api-->  [Nginx]  --proxy-->  [api:8000 FastAPI]  -->  [PostgreSQL]
```

- **Frontend**: em dev, só chama `/api/...` no mesmo origin (`:4200`); no Docker, idem em `:FRONTEND_PORT` (padrão **9080**), e o Nginx encaminha `/api` para o serviço `api` na rede interna (evita CORS no navegador).
- **Backend**: regras em serviços, persistência em repositórios SQLAlchemy async; JWT na camada HTTP.
- **Mensageria**: publicação em exchange de eventos de produto; consumo dedicado grava trilha de auditoria no Mongo.

## Tecnologias

| Camada        | Tecnologia |
|---------------|------------|
| Frontend      | Angular 19, PrimeNG, RxJS, formulários reativos |
| Backend       | Python 3.12+, FastAPI, Pydantic v2, SQLAlchemy async, Alembic |
| Banco principal | PostgreSQL 16 |
| Mensageria    | RabbitMQ 3 (management plugin) |
| Auditoria     | MongoDB 7 (coleção de eventos) |
| Orquestração local | Docker Compose na pasta `app_backend` (API, Postgres, RabbitMQ, Mongo, consumer, **frontend** em Nginx) |

## Estrutura do repositório

| Pasta | Responsabilidade |
|-------|-------------------|
| `app_backend/` | API, migrações, Docker Compose (API + Postgres + RabbitMQ + Mongo + consumer), documentação detalhada do backend |
| `app_frontend_analytst-challenge/` | Aplicação Angular, proxy de desenvolvimento, README do frontend |

Documentação mais profunda da API (variáveis de ambiente, Alembic, RabbitMQ, troubleshooting de `DATABASE_URL`): [**app_backend/README.md**](app_backend/README.md).

Instruções do **frontend** (pré-requisitos, `ng serve`, proxy, fluxo de telas): [**app_frontend_analytst-challenge/README.md**](app_frontend_analytst-challenge/README.md).

## Pré-requisitos

- **Docker** e **Docker Compose** (recomendado para Postgres, RabbitMQ, Mongo e consumer), **ou** PostgreSQL (e demais serviços) instalados localmente conforme [`app_backend/.env.example`](app_backend/.env.example).
- **Python 3.12+** e **Node.js** (recomendado **20 LTS**) com **npm**, para rodar API e Angular na máquina.

## Como executar (visão geral)

### 1) Dependências (banco, RabbitMQ, Mongo)

Na pasta `app_backend`:

```bash
cd app_backend
cp .env.example .env
# Edite .env: defina SECRET_KEY. Para API/Alembic no Windows apontando ao Postgres do Compose, use DATABASE_URL com 127.0.0.1:5433 (ver app_backend/README.md).
docker compose up -d db rabbitmq mongo audit_consumer
```

Para subir **toda a stack** (API, banco, RabbitMQ, Mongo, consumer de auditoria e **frontend** servido por Nginx):

```bash
docker compose up --build
```

- Interface web (Angular): **http://localhost:9080/** (padrão `FRONTEND_PORT`; login: **http://localhost:9080/login**).
- O Nginx do frontend faz proxy de `/api` para o serviço `api`, como o `proxy.conf.json` no `ng serve`.
- **Swagger no host** quando a API não usa a porta 8000: ex. **`http://localhost:8001/docs`** se no `.env` estiver `API_HOST_PORT=8001` (evita “port already allocated” na 8000). Alternativa sem abrir a API no host: **http://localhost:9080/api/docs** (mesmo origin do app).

### 2) Backend (se não usar o serviço `api` do Compose)

```bash
cd app_backend
python -m venv .venv
# Windows: .venv\Scripts\activate
pip install -r requirements.txt
alembic upgrade head
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 3) Frontend

```bash
cd app_frontend_analytst-challenge
npm install
npm start
# ou: npx ng serve
```

Abra **http://localhost:4200/**. A API deve estar em **http://127.0.0.1:8000** para o proxy funcionar.

## Variáveis de ambiente

- **Backend**: copie [`app_backend/.env.example`](app_backend/.env.example) para `app_backend/.env` e ajuste `SECRET_KEY`, `DATABASE_URL`, `RABBITMQ_URL`, `MONGO_URI` conforme onde os serviços rodam (host `127.0.0.1` fora do Docker vs `db` / `rabbitmq` / `mongo` dentro do Compose).
- **Docker — portas no host** (opcionais, ver [`app_backend/.env.example`](app_backend/.env.example)):
  - **`FRONTEND_PORT`** — onde o Nginx publica o Angular (padrão **9080**).
  - **`API_HOST_PORT`** — onde a API FastAPI é exposta no Windows/Linux host (padrão **8000**; use **8001** se a 8000 estiver ocupada).

## URLs úteis

| Recurso | URL |
|---------|-----|
| Frontend (`ng serve`) | http://localhost:4200/ e http://localhost:4200/login |
| Frontend (Docker) | http://localhost:9080/ e http://localhost:9080/login (`FRONTEND_PORT`, padrão 9080) |
| OpenAPI direto no host | `http://localhost:<API_HOST_PORT>/docs` — padrão **8000**; com `API_HOST_PORT=8001` → **http://localhost:8001/docs** |
| OpenAPI via proxy do front (Docker) | http://localhost:9080/api/docs (útil quando a API no host não está em 8000) |
| Health (API no host) | `http://localhost:<API_HOST_PORT>/health` |
| RabbitMQ Management | http://localhost:15672 (`app` / `app`) |
| Mongo Express | http://localhost:8081 (`admin` / `admin`) |

## Usuário de teste

Não há usuário pré-cadastrado no repositório. **Crie uma conta** com `POST /auth/register` (Swagger em **http://localhost:8001/docs** se usar `API_HOST_PORT=8001`, ou **http://localhost:9080/api/docs** no Docker com o front na 9080) e use o **mesmo e-mail e senha** em **http://localhost:9080/login** (ou `:4200/login` em dev). Exemplo de corpo JSON:

```json
{
  "name": "Usuário Teste",
  "email": "teste@exemplo.com",
  "password": "umaSenhaForte123"
}
```

## Fluxo principal de navegação

1. Acesse `/login`, autentique-se.
2. Redirecionamento para `/portal`: listagem de produtos, criar/editar em diálogo, remover com confirmação, sair (limpa token local).

## Endpoints principais da API

| Método | Caminho | Descrição |
|--------|---------|-----------|
| POST | `/auth/register` | Cadastro |
| POST | `/auth/login` | Access + refresh JWT |
| POST | `/auth/refresh` | Novo par de tokens |
| GET | `/auth/me` | Perfil (JWT obrigatório) |
| POST | `/products` | Criar produto |
| GET | `/products` | Listar produtos |
| GET | `/products/{id}` | Detalhe |
| PUT | `/products/{id}` | Atualizar |
| DELETE | `/products/{id}` | Remover |

Rotas de produtos e `/auth/me` exigem o header `Authorization` com valor `Bearer` seguido do access token JWT.

## Mensageria (RabbitMQ)

Em operações de produto, a API publica eventos (`product.created`, `product.updated`, `product.deleted`). O serviço `audit_consumer` consome esses eventos e persiste auditoria no MongoDB. Detalhes e comandos de log: [`app_backend/README.md`](app_backend/README.md).

## Decisões em alto nível

- **Monorepo** para facilitar revisão e alinhamento de contratos entre frontend e backend.
- **Proxy `/api`** no `ng serve` para o browser falar só com `localhost:4200`, reduzindo atrito de CORS em desenvolvimento.
- **MongoDB** usado de forma complementar para auditoria assíncrona desacoplada do fluxo HTTP síncrono.
