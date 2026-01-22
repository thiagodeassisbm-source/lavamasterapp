-- Execute no Supabase para ver o hash completo
SELECT 
    email, 
    role,
    LENGTH(senha) as hash_length,
    senha
FROM usuarios 
WHERE email = 'thiago.deassisbm@gmail.com';
