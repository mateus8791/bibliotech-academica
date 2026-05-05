# Migração: Unificação das Tabelas Empréstimo e Reserva

## Objetivo

Unificar as tabelas `emprestimo` e `reserva` em uma única tabela `emprestimo`, usando uma coluna `tipo` para diferenciar entre empréstimos e reservas.

## Por que fazer esta migração?

1. **Simplificação da arquitetura**: Uma única tabela centraliza toda a gestão de livros
2. **Redução de duplicação**: Evita código duplicado nos controllers
3. **Facilita manutenção**: Alterações futuras precisam ser feitas em apenas um lugar
4. **Melhor organização**: Sistema baseado em empréstimos com funcionalidade de reserva integrada

## Estrutura antes da migração

### Tabela `emprestimo`
- id, livro_id, usuario_id, data_emprestimo, data_devolucao_prevista, data_devolucao_real, status, created_at, updated_at

### Tabela `reserva`
- id, livro_id, usuario_id, data_reserva, data_expiracao, status, created_at, updated_at

## Estrutura depois da migração

### Tabela `emprestimo` (unificada)
**Colunas existentes:**
- id, livro_id, usuario_id, data_emprestimo, data_devolucao_prevista, data_devolucao_real, status, created_at, updated_at

**Novas colunas adicionadas:**
- `tipo` VARCHAR(20) - 'emprestimo' ou 'reserva'
- `data_reserva` TIMESTAMP - Data da reserva
- `data_expiracao` TIMESTAMP - Data de expiração da reserva
- `data_retirada` DATE - Data de retirada desejada
- `posicao_fila` INTEGER - Posição na fila de espera
- `notificado` BOOLEAN - Se o usuário foi notificado

**Status possíveis:**
- Empréstimos: `ativo`, `atrasado`, `devolvido`, `renovado`
- Reservas: `aguardando`, `disponivel`, `cancelado`, `concluido`, `expirado`

## Arquivos da migração

### 1. Script SQL: `migrate-unify-emprestimo-reserva.sql`
Contém as instruções SQL para:
- Adicionar novas colunas à tabela `emprestimo`
- Atualizar constraints de status
- Migrar dados da tabela `reserva` para `emprestimo`
- Criar índices para performance
- Criar views de compatibilidade (opcional)

### 2. Script de execução: `run-migration-unify.js`
Script Node.js que:
- Executa o SQL de migração
- Verifica os resultados
- Exibe relatórios de contagem
- Mostra a estrutura final da tabela

## Como executar a migração

### Passo 1: Fazer backup do banco de dados

**IMPORTANTE: Faça backup antes de continuar!**

```bash
# No PostgreSQL
pg_dump -h localhost -U postgres -d biblioteca_academica > backup_antes_migracao.sql
```

### Passo 2: Configurar variáveis de ambiente

Certifique-se de que as variáveis de ambiente estão configuradas em `.env`:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=biblioteca_academica
DB_USER=postgres
DB_PASSWORD=sua_senha
```

### Passo 3: Executar a migração

```bash
cd backend/scripts
node run-migration-unify.js
```

### Passo 4: Verificar os resultados

O script irá mostrar:
- ✓ Confirmação de sucesso
- Contagem de registros migrados
- Estrutura da tabela atualizada
- Próximos passos

### Passo 5: Testar as funcionalidades

Teste todas as funcionalidades:
- ✓ Criar uma nova reserva
- ✓ Listar minhas reservas
- ✓ Cancelar uma reserva
- ✓ Dashboard do aluno
- ✓ Criar um empréstimo (se aplicável)
- ✓ Listar meus livros

### Passo 6: Remover tabela antiga (opcional)

**APENAS após confirmar que tudo está funcionando:**

```sql
-- Remover views de compatibilidade (se não precisar mais)
DROP VIEW IF EXISTS vw_reservas;
DROP VIEW IF EXISTS vw_emprestimos;

-- Remover tabela reserva antiga
DROP TABLE reserva CASCADE;
```

## Arquivos modificados

### Backend - Controllers

1. **reservationController.js** ([backend/src/controllers/reservationController.js](../src/controllers/reservationController.js))
   - `createReservation()` - Agora insere na tabela `emprestimo` com tipo='reserva'
   - `getMyReservations()` - Busca da tabela `emprestimo` WHERE tipo='reserva'
   - `cancelReservation()` - Atualiza na tabela `emprestimo`

2. **loanController.js** ([backend/src/controllers/loanController.js](../src/controllers/loanController.js))
   - `getMyBooks()` - Unificado em uma única query com filtro por tipo

3. **dashboardController.js** ([backend/src/controllers/dashboardController.js](../src/controllers/dashboardController.js))
   - `getStudentDashboard()` - Todas as queries agora usam tabela `emprestimo`

### Benefícios da nova estrutura

1. **Query unificada**: Buscar empréstimos e reservas em uma única consulta
2. **Índices eficientes**: Melhor performance nas buscas
3. **Manutenção simplificada**: Um único lugar para gerenciar
4. **Escalabilidade**: Fácil adicionar novos tipos no futuro

## Views de compatibilidade

Foram criadas duas views para facilitar a transição:

### `vw_reservas`
Emula a tabela `reserva` antiga, mostrando apenas registros com tipo='reserva'

### `vw_emprestimos`
Emula a tabela `emprestimo` antiga, mostrando apenas registros com tipo='emprestimo'

**Uso:**
```sql
-- Usar como se fosse a tabela antiga
SELECT * FROM vw_reservas WHERE usuario_id = 1;
SELECT * FROM vw_emprestimos WHERE status = 'ativo';
```

## Rollback (se necessário)

Se precisar reverter a migração:

```sql
BEGIN;

-- 1. Restaurar tabela reserva a partir dos dados migrados
CREATE TABLE reserva_restaurada AS
SELECT
  id, livro_id, usuario_id,
  data_reserva, data_expiracao,
  status, created_at, updated_at
FROM emprestimo
WHERE tipo = 'reserva';

-- 2. Remover registros de reserva da tabela emprestimo
DELETE FROM emprestimo WHERE tipo = 'reserva';

-- 3. Remover colunas adicionadas
ALTER TABLE emprestimo
DROP COLUMN tipo,
DROP COLUMN data_reserva,
DROP COLUMN data_expiracao,
DROP COLUMN data_retirada,
DROP COLUMN posicao_fila,
DROP COLUMN notificado;

-- 4. Renomear tabela restaurada
DROP TABLE reserva;
ALTER TABLE reserva_restaurada RENAME TO reserva;

COMMIT;
```

**Importante:** Após o rollback, você precisará reverter também as mudanças nos controllers.

## Troubleshooting

### Erro: "column tipo does not exist"
- A migração não foi executada. Execute `node run-migration-unify.js`

### Erro: "constraint emprestimo_status_check"
- A constraint antiga ainda existe. Execute a migração SQL manualmente

### Erro: "relation reserva does not exist"
- Você removeu a tabela reserva mas não atualizou os controllers
- Verifique se todos os controllers foram atualizados

## Suporte

Se encontrar problemas durante a migração:

1. Verifique os logs do console
2. Verifique se o backup foi criado
3. Consulte a estrutura atual: `\d emprestimo` no psql
4. Reverta usando o backup se necessário

## Checklist de migração

- [ ] Backup do banco de dados criado
- [ ] Variáveis de ambiente configuradas
- [ ] Script de migração executado com sucesso
- [ ] Contagens verificadas (reservas migradas)
- [ ] Estrutura da tabela verificada (novas colunas)
- [ ] Testes de criação de reserva
- [ ] Testes de listagem de reservas
- [ ] Testes de cancelamento de reserva
- [ ] Testes do dashboard
- [ ] Testes de empréstimos (se aplicável)
- [ ] Frontend funcionando corretamente
- [ ] Tabela antiga removida (opcional)
- [ ] Backup pós-migração criado

## Conclusão

Esta migração simplifica significativamente a arquitetura do sistema, mantendo todas as funcionalidades existentes. O processo é reversível e seguro se seguir todos os passos corretamente.
