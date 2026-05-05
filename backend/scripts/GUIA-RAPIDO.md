# 🚀 Guia Rápido de Migração

## ⚠️ IMPORTANTE: Execute ANTES de testar a aplicação!

Os controllers já foram atualizados para usar a nova estrutura, mas o banco de dados ainda não foi migrado. Siga os passos abaixo:

## Passos para Executar a Migração

### 1️⃣ Fazer Backup (OBRIGATÓRIO)

```bash
# Abra o terminal no diretório do projeto
cd c:\Users\Usuario\biblioteca-academica\biblioteca-academica

# Crie um backup
pg_dump -h localhost -U postgres -d biblioteca_academica > backup_antes_migracao.sql
```

### 2️⃣ Verificar se o PostgreSQL está rodando

```bash
# Teste a conexão
psql -h localhost -U postgres -d biblioteca_academica -c "SELECT COUNT(*) FROM emprestimo;"
```

### 3️⃣ Executar a Migração

**OPÇÃO A: Via Node.js (Recomendado)**

```bash
cd backend\scripts
node run-migration-unify.js
```

**OPÇÃO B: Via SQL direto no psql**

```bash
psql -h localhost -U postgres -d biblioteca_academica -f backend\scripts\migrate-unify-emprestimo-reserva.sql
```

### 4️⃣ Verificar se funcionou

```bash
# Entre no psql
psql -h localhost -U postgres -d biblioteca_academica

# Verifique a estrutura da tabela
\d emprestimo

# Deve mostrar as novas colunas:
# - tipo
# - data_reserva
# - data_expiracao
# - data_retirada
# - posicao_fila
# - notificado

# Verifique os dados migrados
SELECT tipo, COUNT(*) FROM emprestimo GROUP BY tipo;

# Deve mostrar:
#  tipo       | count
# ------------+-------
#  emprestimo |  X
#  reserva    |  Y

# Saia do psql
\q
```

### 5️⃣ Reiniciar o servidor backend

```bash
cd backend
npm run dev
```

### 6️⃣ Testar a aplicação

Agora você pode testar:
- ✅ Criar uma reserva
- ✅ Listar reservas
- ✅ Cancelar reserva
- ✅ Dashboard

## 🔧 Se der erro durante a migração

### Erro: "relation reserva does not exist"

Isso significa que a tabela `reserva` não existe. Duas possibilidades:

1. Você já removeu a tabela antes - nesse caso, a migração não conseguirá copiar os dados, mas pode continuar
2. O nome da tabela está diferente - verifique com `\dt` no psql

**Solução:** Comente a parte de migração de dados no SQL e execute apenas a criação das colunas:

```sql
-- Comente estas linhas no arquivo migrate-unify-emprestimo-reserva.sql
-- INSERT INTO emprestimo (...)
-- SELECT ... FROM reserva ...
```

### Erro: "column tipo already exists"

A migração já foi executada antes. Verifique:

```sql
SELECT column_name FROM information_schema.columns
WHERE table_name = 'emprestimo' AND column_name = 'tipo';
```

Se retornar resultado, a migração já foi feita!

### Erro: "constraint emprestimo_status_check already exists"

A constraint já existe. Remova antes:

```sql
ALTER TABLE emprestimo DROP CONSTRAINT IF EXISTS emprestimo_status_check;
```

E execute a migração novamente.

## 📊 Checklist Pós-Migração

- [ ] Tabela `emprestimo` tem coluna `tipo`
- [ ] Tabela `emprestimo` tem coluna `data_reserva`
- [ ] Tabela `emprestimo` tem coluna `data_expiracao`
- [ ] Tabela `emprestimo` tem coluna `notificado`
- [ ] Tabela `emprestimo` tem coluna `posicao_fila`
- [ ] Dados de `reserva` foram migrados para `emprestimo`
- [ ] Backend reiniciado
- [ ] Criar reserva funciona
- [ ] Listar reservas funciona
- [ ] Cancelar reserva funciona
- [ ] Dashboard carrega sem erros

## 🆘 Problemas?

### Backend não inicia

Verifique os logs do terminal. Se mostrar erro de coluna não encontrada:
- A migração não foi executada
- Execute novamente: `node run-migration-unify.js`

### Frontend mostra "Network Error"

1. Verifique se o backend está rodando
2. Verifique se a migração foi executada
3. Veja os logs do backend para mais detalhes

### Dados de reserva não aparecem

Verifique se foram migrados:

```sql
SELECT COUNT(*) FROM emprestimo WHERE tipo = 'reserva';
```

Se retornar 0, a migração de dados não funcionou. Execute manualmente:

```sql
INSERT INTO emprestimo (
  livro_id, usuario_id, tipo, data_reserva, data_expiracao,
  status, created_at, updated_at, notificado
)
SELECT
  livro_id, usuario_id, 'reserva', data_reserva, data_expiracao,
  status, created_at, updated_at, FALSE
FROM reserva;
```

## 💡 Dica

Mantenha o backup! Não delete até ter certeza que tudo está funcionando perfeitamente.

Se precisar voltar atrás, restaure o backup:

```bash
psql -h localhost -U postgres -d biblioteca_academica < backup_antes_migracao.sql
```

E reverta as mudanças nos controllers (use git para voltar ao commit anterior).
