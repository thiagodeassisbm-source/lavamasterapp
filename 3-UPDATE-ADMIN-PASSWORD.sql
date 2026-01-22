-- Execute este SQL no Supabase para atualizar a senha do superadmin
-- Senha: admin123

UPDATE usuarios 
SET senha = '$2b$10$rW7kQVXOWmF8zLJHZb1fxOqRvN3PYo4UJzK0iH8vvOSLtUVXkBC.6'
WHERE email = 'thiago.deassisbm@gmail.com';

-- Verificar
SELECT id, email, role, LENGTH(senha) as hash_length
FROM usuarios 
WHERE email = 'thiago.deassisbm@gmail.com';
