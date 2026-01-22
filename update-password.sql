-- Atualizar senha do Super Admin para 'admin123'
-- Hash gerado recentemente
UPDATE super_admins 
SET senha = '$2a$10$IiAPYr0FSqQt.rvJe/LulnmCa' 
WHERE email = 'thiago.deassisbm@gmail.com';

-- Verificar se o usuário existe e exibir
SELECT id, nome, email, ativo FROM super_admins WHERE email = 'thiago.deassisbm@gmail.com';
