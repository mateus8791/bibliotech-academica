@echo off
echo ========================================
echo MIGRACAO: Unificar Emprestimo e Reserva
echo ========================================
echo.

echo [1/4] Verificando conexao com o banco...
psql -h localhost -U postgres -d biblioteca_academica -c "SELECT 1;" >nul 2>&1
if errorlevel 1 (
    echo ERRO: Nao foi possivel conectar ao PostgreSQL
    echo Verifique se:
    echo - O PostgreSQL esta rodando
    echo - As credenciais estao corretas
    echo - O banco biblioteca_academica existe
    pause
    exit /b 1
)
echo OK: Conexao estabelecida!
echo.

echo [2/4] Criando backup de seguranca...
pg_dump -h localhost -U postgres -d biblioteca_academica > backup_antes_migracao_%date:~-4,4%%date:~-10,2%%date:~-7,2%_%time:~0,2%%time:~3,2%%time:~6,2%.sql
if errorlevel 1 (
    echo ERRO: Falha ao criar backup
    pause
    exit /b 1
)
echo OK: Backup criado!
echo.

echo [3/4] Executando migracao SQL...
node run-migration-unify.js
if errorlevel 1 (
    echo ERRO: Falha na migracao
    echo O backup foi salvo. Voce pode restaurar se necessario.
    pause
    exit /b 1
)
echo.

echo [4/4] Verificando resultado...
psql -h localhost -U postgres -d biblioteca_academica -c "SELECT column_name FROM information_schema.columns WHERE table_name = 'emprestimo' AND column_name = 'tipo';"
if errorlevel 1 (
    echo AVISO: Nao foi possivel verificar a coluna 'tipo'
) else (
    echo OK: Coluna 'tipo' existe!
)
echo.

echo ========================================
echo MIGRACAO CONCLUIDA!
echo ========================================
echo.
echo Proximos passos:
echo 1. Reinicie o servidor backend (Ctrl+C e depois npm run dev)
echo 2. Teste a aplicacao
echo 3. Se tudo funcionar, voce pode remover a tabela 'reserva'
echo.
echo Backup salvo em: backup_antes_migracao_*.sql
echo.
pause
