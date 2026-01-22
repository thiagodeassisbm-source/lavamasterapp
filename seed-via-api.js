const { createClient } = require('@supabase/supabase-js')
const bcrypt = require('bcryptjs')

const supabaseUrl = 'https://bkhtemypttswlkluaort.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJraHRlbXlwdHRzd2xrbHVhb3J0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTA3MDgxNiwiZXhwIjoyMDg0NjQ2ODE2fQ.Ujqn2jopuZjnSuNa325JeXqb1YwYZ2OD3zSMM6CBoGc'

const supabase = createClient(supabaseUrl, supabaseKey)

async function seedData() {
    try {
        console.log('🚀 Iniciando inserção via API HTTP...\n')

        // 1. ATUALIZAR SUPER ADMIN
        console.log('🔄 Atualizando Super Admin...')
        const hashAdmin = await bcrypt.hash('admin123', 10)

        // Verificar se existe
        const { data: admins } = await supabase
            .from('super_admins')
            .select('id')
            .eq('email', 'thiago.deassisbm@gmail.com')

        if (admins && admins.length > 0) {
            const { error: errorUpdate } = await supabase
                .from('super_admins')
                .update({ senha: hashAdmin, ativo: true })
                .eq('email', 'thiago.deassisbm@gmail.com')

            if (errorUpdate) console.error('❌ Erro update admin:', errorUpdate.message)
            else console.log('✅ Super Admin atualizado com senha: admin123')
        } else {
            const { error: errorInsert } = await supabase
                .from('super_admins')
                .insert({
                    id: 'superadmin-api-001',
                    nome: 'Super Administrator',
                    email: 'thiago.deassisbm@gmail.com',
                    senha: hashAdmin,
                    ativo: true
                })

            if (errorInsert) console.error('❌ Erro insert admin:', errorInsert.message)
            else console.log('✅ Super Admin criado com senha: admin123')
        }


        // 2. CRIAR EMPRESA
        console.log('\n🏢 Criando Empresa de Teste...')
        const { error: errorEmpresa } = await supabase
            .from('empresas')
            .upsert({
                id: 'empresa-teste-api',
                nome: 'Lava Jato API Teste',
                cnpj: '00.000.000/0002-00',
                email: 'api@teste.com',
                plano: 'pro',
                ativo: true
            }, { onConflict: 'cnpj' })

        if (errorEmpresa) console.error('❌ Erro empresa:', errorEmpresa.message)
        else console.log('✅ Empresa criada/atualizada')


        // 3. CRIAR USUÁRIO
        console.log('\n👤 Criando Usuário de Teste...')
        const hashUser = await bcrypt.hash('123456', 10)

        // Verificar se usuario existe para pegar ID correto se ja existir
        // Ou usar upsert com composite key se a tabela suportar, mas vamos deletar e recriar pra garantir hash

        await supabase.from('usuarios').delete().eq('email', 'teste@lavajato.com')

        const { error: errorUser } = await supabase
            .from('usuarios')
            .insert({
                id: 'user-teste-api',
                empresaId: 'empresa-teste-api',
                nome: 'Usuário API',
                email: 'teste@lavajato.com',
                senha: hashUser,
                role: 'admin',
                ativo: true
            })

        if (errorUser) console.error('❌ Erro usuário:', errorUser.message)
        else console.log('✅ Usuário criado: teste@lavajato.com / 123456')

    } catch (error) {
        console.error('❌ Erro geral:', error)
    }
}

seedData()
