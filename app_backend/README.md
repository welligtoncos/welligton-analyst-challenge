# API FastAPI — Auth JWT + PostgreSQL (async)

## Requisitos

- Python 3.12+ (local) ou Docker + Docker Compose
- PostgreSQL 16 (via Compose ou instalado localmente)

## Variáveis de ambiente

Copie `.env.example` para `.env` e ajuste `DATABASE_URL`, `SECRET_KEY` e demais campos.

O `main.py` e o `alembic/env.py` carregam o `.env` com **prioridade sobre variáveis já definidas no ambiente** (por exemplo `DATABASE_URL` antiga no Windows). Sem isso, o Pydantic pode ignorar o `.env` em favor do valor global do sistema.

### Host do Postgres: `127.0.0.1` vs `db`

| Onde você roda o comando | `DATABASE_URL` deve usar |
|--------------------------|---------------------------|
| `alembic` ou `uvicorn` **no Windows** contra o Postgres **deste** Compose | `...@127.0.0.1:5433/...` (porta publicada no host; padrão `POSTGRES_PORT=5433`) |
| Postgres **instalado** no Windows (outra porta) | a porta que esse servidor usa (geralmente 5432) |
| Apenas **dentro do container** `api` | O Compose define `@db:5432` automaticamente |

Se aparecer **`getaddrinfo failed`**, o `.env` provavelmente aponta para o host **`db`**, que só existe na rede Docker. Corrija para **`127.0.0.1`** ao rodar Alembic na sua máquina.

Se aparecer **falha de autenticação** para `app` ou `postgres`, confira **porta e usuário**: na **5432** pode estar o PostgreSQL local (outras credenciais); para o banco do Compose use **`127.0.0.1:5433`** e `app`/`app`/`appdb`.

## Local (sem Docker, Postgres instalado)

```bash
python -m venv .venv
venv\Scripts\activate   # Windows
pip install -r requirements.txt
# No .env: DATABASE_URL com host/porta do seu Postgres e credenciais reais
alembic upgrade head
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## Só o banco no Docker, API e Alembic no PC

O Compose expõe o Postgres do container em **`127.0.0.1:5433`** (porta **5433** no host, não 5432), para não conflitar com um PostgreSQL instalado no Windows que costuma ocupar a **5432**. Se `alembic` mostrar falha de senha para o usuário `app` usando a porta **5432**, você provavelmente está conectando no Postgres errado.

```bash
docker compose up -d db
# Após alterar a porta no compose, recrie o container: docker compose up -d --force-recreate db
# No .env: DATABASE_URL=...@127.0.0.1:5433/appdb  (usuário/senha/banco: app/app/appdb)
alembic upgrade head
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## Docker Compose (API + banco)

Na pasta `app_backend`:

```bash
cp .env.example .env
# Edite .env: defina SECRET_KEY. DATABASE_URL com 127.0.0.1 no .env é ignorado pelo serviço api
# (o compose injeta @db:5432 no container).
docker compose up --build
```

- Swagger: http://localhost:8000/docs  
- Health: http://localhost:8000/health e http://localhost:8000/health/db  
- RabbitMQ Management: http://localhost:15672 (padrão: `app` / `app`)

## Alembic (migrations)

Gerar nova revisão a partir dos modelos (quando alterar `app/models/`):

```bash
alembic revision --autogenerate -m "descreva a mudança"
```

Aplicar migrações no banco:

```bash
alembic upgrade head
```

Reverter um passo:

```bash
alembic downgrade -1
```

Ver histórico:

```bash
alembic history
```

## Estrutura

- `app/routes/` — apenas roteamento HTTP
- `app/services/` — regras de negócio (sem SQL)
- `app/repositories/` — queries com `AsyncSession`
- `app/models/` — ORM SQLAlchemy
- `app/schemas/` — Pydantic v2
- `app/core/` — config, DB assíncrono, segurança JWT
