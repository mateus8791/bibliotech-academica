-- Script para criar usuário administrador
-- Senha: admin123

-- Primeiro, verificar se já existe um admin
DO $$ 
BEGIN
  -- Inserir usuário admin se não existir
  IF NOT EXISTS (SELECT 1 FROM usuario WHERE email = 'admin@bibliotech.com') THEN
    INSERT INTO usuario (
      nome, 
      email, 
      senha_hash, 
      tipo_usuario, 
      is_google_user,
      data_cadastro
    ) VALUES (
      'Administrador do Sistema',
      'admin@bibliotech.com',
      '$2b$10$DtyLBMJgB.bj5mvyofZUCO7twt05Y27H6nZ0pXgFeJJnjIKWPOFAi',
      'admin',
      false,
      CURRENT_TIMESTAMP
    );
    
    RAISE NOTICE 'Usuário admin criado com sucesso!';
    RAISE NOTICE 'Email: admin@bibliotech.com';
    RAISE NOTICE 'Senha: admin123';
  ELSE
    RAISE NOTICE 'Usuário admin já existe!';
  END IF;
END $$;

-- Verificar o usuário criado
SELECT id, nome, email, tipo_usuario, data_cadastro 
FROM usuario 
WHERE email = 'admin@bibliotech.com';
