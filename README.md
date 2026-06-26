# BiblioTech

Sistema web para gestão de bibliotecas acadêmicas, desenvolvido para escolas e faculdades. Permite o controle de acervo, empréstimos, reservas e oferece uma experiência personalizada de descoberta de leitura para os alunos.

**Desenvolvedor:** Mateus Conte
**Curso:** Análise e Desenvolvimento de Sistemas — Unochapecó

---

## Tecnologias

| Camada | Tecnologia |
|--------|-----------|
| Frontend | Next.js 15 + TypeScript + Tailwind CSS |
| Backend | Node.js + Express 5 |
| Banco de dados | PostgreSQL 17 |
| Autenticação | JWT + Passport.js (Google OAuth 2.0) |
| Cache | Redis (via ioredis + BullMQ) |
| E-mail | Nodemailer (Mailtrap sandbox / Gmail) |
| Estado (frontend) | Zustand + React Query |
| Validação | Zod |

---

## Pré-requisitos

Antes de rodar o projeto, certifique-se de ter instalado:

- [Node.js](https://nodejs.org/) v18 ou superior
- [PostgreSQL](https://www.postgresql.org/) v14 ou superior
- [Git](https://git-scm.com/)
- Redis (opcional — o sistema funciona sem ele, apenas sem cache de recomendações)

---

## Configuração do Banco de Dados

1. Crie o banco de dados no PostgreSQL:

```sql
CREATE DATABASE bibliotech_db;
```

2. Execute o script de estrutura localizado em `database/bibliotech_backup.sql`:

```bash
psql -U postgres -d bibliotech_db -f database/bibliotech_backup.sql
```

Ou importe pelo DBeaver: clique com o botão direito no banco → **Ferramentas → Executar script**.

---

## Configuração do Backend

1. Acesse a pasta do backend:

```bash
cd backend
```

2. Instale as dependências:

```bash
npm install
```

3. Crie o arquivo `.env` na pasta `backend/` com as variáveis listadas na seção [Variáveis de Ambiente](#variáveis-de-ambiente).

4. Inicie o backend:

```bash
npm start
```

O servidor estará disponível em `http://localhost:3001`.

---

## Configuração do Frontend

1. Acesse a pasta do frontend:

```bash
cd frontend
```

2. Instale as dependências:

```bash
npm install
```

3. Crie o arquivo `.env.local` na pasta `frontend/`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

4. Inicie o frontend:

```bash
npm run dev
```

O sistema estará disponível em `http://localhost:3000`.

---

## Rodando o Projeto Completo

Abra dois terminais e execute:

**Terminal 1 — Backend:**
```bash
cd backend
npm start
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
```

Acesse `http://localhost:3000` no navegador.

---

## Variáveis de Ambiente

### Backend — `backend/.env`

```env
# ── Banco de dados ──────────────────────────────────────────
DB_USER=postgres
DB_HOST=localhost
DB_DATABASE=bibliotech_db
DB_PASSWORD=sua_senha_aqui
DB_PORT=5432

# ── Servidor ────────────────────────────────────────────────
PORT=3001
NODE_ENV=development

# ── Autenticação ────────────────────────────────────────────
JWT_SECRET=uma_string_longa_e_aleatoria_aqui
SESSION_SECRET=outra_string_longa_e_aleatoria_aqui

# ── Google OAuth (opcional) ─────────────────────────────────
GOOGLE_CLIENT_ID=seu_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=seu_client_secret
GOOGLE_CALLBACK_URL=http://localhost:3001/api/auth/google/callback

# ── URL do Frontend (usada nos redirects OAuth) ─────────────
FRONTEND_URL=http://localhost:3000

# ── E-mail via Mailtrap (sandbox para desenvolvimento) ──────
MAIL_HOST=sandbox.smtp.mailtrap.io
MAIL_PORT=2525
MAIL_USER=seu_usuario_mailtrap
MAIL_PASS=sua_senha_mailtrap

# ── E-mail via Gmail (alternativa para produção) ────────────
GMAIL_USER=seu_email@gmail.com
GMAIL_APP_PASSWORD=sua_app_password_gmail

# ── Redis (opcional) ────────────────────────────────────────
REDIS_URL=redis://localhost:6379
```

### Frontend — `frontend/.env.local`

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

---

## Perfis de Acesso

| Perfil | Acesso |
|--------|--------|
| **Aluno** | Catálogo, reservas, preferências, recomendações, criar/editar/excluir próprias avaliações |
| **Bibliotecário** | Gestão de livros, autores, categorias, empréstimos, arquivar avaliações |
| **Admin** | Acesso total + gestão de usuários, domínios permitidos e logs de acesso |

---

## Funcionalidades Implementadas

- Autenticação com e-mail/senha e Google OAuth 2.0
- Recuperação de senha por código de verificação enviado por e-mail
- Controle de permissões por perfil (Aluno, Bibliotecário, Admin)
- Rastreamento de sessões ativas com heartbeat e logs de acesso
- CRUD completo de Livros (com Integração API Google Books Search para autocompletar dados)
- CRUD completo de Usuários
- CRUD de Autores e Categorias
- Gestão unificada de Empréstimos e Reservas (tabela `emprestimo`)
- Sistema de Preferências literárias do aluno (categorias e autores favoritos)
- Recomendações personalizadas por algoritmo 100% SQL (função `recomendar_livros`)
- Notificações em tempo real (reserva confirmada, prazo vencendo, boas-vindas etc.)
- Controle de domínios de e-mail institucionais permitidos para login Google
- Modais modernos com Backdrop Blur em todos os CRUDs
- Painel Administrativo unificado com Sidebar expansível inteligente
- **CRUD de Avaliações de Livros** *(em desenvolvimento)*

---

## API — Endpoints

### Autenticação
| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/api/auth/login` | Login com e-mail e senha |
| POST | `/api/auth/validar-codigo` | Validar código de recuperação de senha |
| POST | `/api/auth/resetar-senha` | Redefinir senha |
| GET | `/api/auth/google` | Iniciar fluxo Google OAuth |
| GET | `/api/auth/google/callback` | Callback do Google OAuth |
| POST | `/api/auth/logout` | Logout |

### Sessão
| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/api/session/heartbeat` | Atualizar `last_seen` (a cada 60s) |
| POST | `/api/session/logout` | Encerrar sessão e invalidar access_log |
| GET | `/api/session/active` | Retornar dados da sessão ativa |

### Livros
| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| GET | `/api/public/livros` | Não | Livros com filtros (público) |
| GET | `/api/public/livro/:id` | Não | Detalhe do livro (público) |
| GET | `/api/public/livros-novos` | Não | Livros mais recentes (público) |
| GET | `/api/public/livros-promocao` | Não | Livros em promoção (público) |
| GET | `/api/livros/disponiveis` | Sim | Livros com estoque > 0 |
| GET | `/api/livros/categoria/:id` | Sim | Livros por categoria |
| GET | `/api/livros/autor/:id` | Sim | Livros por autor |
| POST | `/api/livros` | Admin | Cadastrar livro |
| PUT | `/api/livros/:id` | Admin | Editar livro |
| DELETE | `/api/livros/:id` | Admin | Remover livro |
| POST | `/api/livros/importar` | Admin | Importar livros via CSV |

### Usuários
| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| GET | `/api/usuarios` | Admin/Biblio | Listar usuários |
| GET | `/api/usuarios/:id` | Admin/Biblio | Buscar usuário por ID |
| POST | `/api/usuarios` | Admin | Criar usuário |
| PUT | `/api/usuarios/:id` | Admin | Editar usuário |
| DELETE | `/api/usuarios/:id` | Admin | Remover usuário |

### Reservas e Empréstimos
| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| GET | `/api/meus-livros` | Sim | Empréstimos e reservas do usuário logado |
| GET | `/api/reservas/minhas` | Sim | Reservas do usuário logado |
| POST | `/api/reservas` | Sim | Criar reserva |
| PUT | `/api/reservas/:id/cancelar` | Sim | Cancelar reserva |

### Avaliações *(em desenvolvimento)*
| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| GET | `/api/avaliacoes` | Sim | Listar com filtros (`livro_id`, `usuario_id`, `status`, `nota_min`) |
| POST | `/api/avaliacoes` | Aluno | Criar avaliação (1 por livro por usuário) |
| PUT | `/api/avaliacoes/:id` | Sim | Editar nota e/ou comentário |
| PATCH | `/api/avaliacoes/:id/arquivar` | Admin/Biblio | Alternar status ativa/arquivada |
| DELETE | `/api/avaliacoes/:id` | Sim | Excluir avaliação |

### Outros
| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| GET | `/api/notificacoes` | Sim | Notificações não lidas |
| GET | `/api/notificacoes/todas` | Sim | Todas as notificações |
| PUT | `/api/notificacoes/todas/lidas` | Sim | Marcar todas como lidas |
| PUT | `/api/notificacoes/:id/lida` | Sim | Marcar uma como lida |
| DELETE | `/api/notificacoes/:id` | Sim | Remover notificação |
| GET | `/api/preferencias` | Sim | Preferências do aluno |
| POST | `/api/preferencias` | Sim | Salvar preferências |
| GET | `/api/recomendacoes` | Sim | Livros recomendados pelo algoritmo SQL |
| GET | `/api/perfil` | Sim | Dados do perfil do usuário logado |
| GET | `/api/dashboard/aluno` | Sim | Dashboard do aluno |
| GET | `/api/dashboard/emprestimos` | Admin/Biblio | Dashboard de empréstimos |
| GET | `/api/relatorios/estatisticas` | Admin/Biblio | Estatísticas gerais |
| GET | `/api/admin/access-logs` | Admin | Logs de acesso |
| GET | `/api/dominios` | Admin | Domínios permitidos para login Google |
| POST | `/api/dominios` | Admin | Cadastrar domínio |
| PUT | `/api/dominios/:id` | Admin | Editar domínio |
| DELETE | `/api/dominios/:id` | Admin | Remover domínio |
| PATCH | `/api/dominios/:id/toggle` | Admin | Ativar/desativar domínio |

---

## Estrutura do Projeto

```
biblioteca_academica-main/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.js          # Pool de conexão PostgreSQL
│   │   │   ├── passport.js          # Estratégias de autenticação (Local + Google OAuth)
│   │   │   └── redis.js             # Conexão Redis
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   ├── avaliacoesController.js
│   │   │   ├── bookController.js
│   │   │   ├── authorController.js
│   │   │   ├── categoryController.js
│   │   │   ├── dashboardController.js
│   │   │   ├── dominiosController.js
│   │   │   ├── loanController.js
│   │   │   ├── notificacoesController.js
│   │   │   ├── perfilController.js
│   │   │   ├── preferenciasController.js
│   │   │   ├── publicController.js
│   │   │   ├── recomendacoesController.js
│   │   │   ├── relatorioController.js
│   │   │   ├── reservationController.js
│   │   │   ├── sessionController.js
│   │   │   ├── userController.js
│   │   │   └── ...
│   │   ├── routes/
│   │   │   ├── avaliacoesRoutes.js
│   │   │   ├── authRoutes.js
│   │   │   ├── bookRoutes.js
│   │   │   ├── dominiosRoutes.js
│   │   │   ├── loanRoutes.js
│   │   │   ├── notificacoesRoutes.js
│   │   │   ├── reservationRoutes.js
│   │   │   ├── userRoutes.js
│   │   │   └── ...
│   │   ├── middlewares/
│   │   │   ├── authMiddleware.js    # Valida JWT (Bearer token)
│   │   │   └── adminMiddleware.js   # checkAdmin / checkAdminOrBibliotecario
│   │   ├── services/
│   │   │   ├── auditoriaService.js  # Registra ações administrativas
│   │   │   └── emailService.js      # Envio de e-mails (Nodemailer)
│   │   ├── helpers/
│   │   │   └── criarNotificacao.js
│   │   ├── queues/
│   │   │   └── aiMetadataQueue.js   # Fila BullMQ para metadados de IA
│   │   └── server.js                # Entry point da aplicação
│   ├── migrations/                  # Scripts de estrutura do banco (001–013)
│   ├── scripts/
│   │   ├── migrations/              # Runners de migrations e fixes pontuais
│   │   ├── seeds/                   # Scripts de dados de exemplo
│   │   └── archive/                 # Scripts antigos fora de uso
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── app/                     # Páginas (Next.js App Router)
│   │   │   ├── auth/                # Login, recuperação de senha, OAuth
│   │   │   ├── aluno/               # Dashboard, reservas, perfil, preferências
│   │   │   ├── catalogo/            # Catálogo público com filtros
│   │   │   ├── livro/[id]/          # Detalhe do livro
│   │   │   └── dashboard/           # Painel administrativo
│   │   │       ├── livros/          # CRUD de livros
│   │   │       ├── usuarios/        # CRUD de usuários
│   │   │       ├── emprestimos/     # Gestão de empréstimos
│   │   │       ├── dominios/        # Domínios permitidos
│   │   │       └── relatorios/      # Relatórios e estatísticas
│   │   ├── components/
│   │   │   ├── catalogo/            # Componentes da vitrine de livros
│   │   │   ├── dashboard/           # Sidebar, TopBar, gráficos
│   │   │   └── ...
│   │   ├── contexts/
│   │   │   ├── AuthContext.tsx      # Estado de autenticação global
│   │   │   └── NotificationContext.tsx
│   │   ├── lib/
│   │   │   └── hooks/               # useBooks, useLoans, useReservations...
│   │   ├── services/
│   │   │   └── api.ts               # Cliente Axios configurado
│   │   └── types/                   # Tipos TypeScript (book, avaliacao, etc.)
│   └── package.json
├── database/
│   └── bibliotech_backup.sql        # Dump completo do banco (estrutura + dados)
└── docker-compose.yml               # Redis via Docker
```

---

## Banco de Dados

O dump completo com estrutura e dados de exemplo está em:

```
database/bibliotech_backup.sql
```

**Tabelas principais:**

| Tabela | Descrição |
|--------|-----------|
| `usuario` | Usuários do sistema (alunos, bibliotecários, admins) |
| `livro` | Catálogo de livros |
| `autor` | Autores cadastrados |
| `categoria` | Categorias literárias |
| `livro_autor` | Associação N:N livro ↔ autor |
| `livro_categoria` | Associação N:N livro ↔ categoria |
| `emprestimo` | Empréstimos e reservas (campo `tipo`: `'emprestimo'` ou `'reserva'`) |
| `avaliacoes` | Avaliações de livros (nota 1–5, comentário, status ativa/arquivada) |
| `avaliacoes_autor` | Avaliações de autores |
| `curtidas_comentario` | Curtidas em avaliações de livros e autores |
| `respostas_comentario` | Respostas a avaliações |
| `notificacoes` | Notificações do sistema para o usuário |
| `preferencias_aluno` | Categorias e autores favoritos do aluno |
| `moods` | 10 humores temáticos (fantasia, mistério, romance etc.) |
| `ai_book_metadata` | Metadados gerados por IA por livro |
| `integrations` | Configurações de provedores externos (OpenAI, Gemini) |
| `dominios_permitidos` | Domínios de e-mail institucionais autorizados para OAuth |
| `access_logs` | Histórico de sessões e logins |
| `audit_trail` | Auditoria de ações administrativas |

**Funções e views criadas automaticamente pelo script:**
- `recomendar_livros(aluno_id, limite)` — algoritmo de recomendação por score
- `vw_active_sessions` — sessões ativas com status de presença
- `vw_login_stats_daily` — estatísticas de login por dia
- `vw_recent_audit` — últimas ações administrativas
- `vw_estatisticas_autores` — média de notas e total de livros por autor
- `vw_ranking_comentarios_livros` — comentários ordenados por curtidas

---

## Observação sobre o Redis

O Redis é utilizado para gerenciar a fila de processamento de metadados de IA (BullMQ). Caso não tenha o Redis instalado, o sistema funciona normalmente — apenas o processamento assíncrono de metadados ficará indisponível. Os erros `[Redis] Erro de conexão` no terminal são esperados nesse caso e não afetam o funcionamento principal.

Para subir o Redis via Docker:

```bash
docker-compose up -d
```
