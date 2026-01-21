const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function createSuperAdmin() {
    try {
        // Verificar se já existe um super admin
        const existingSuperAdmin = await prisma.superAdmin.findFirst()

        if (existingSuperAdmin) {
            console.log('✅ Super Admin já existe!')
            console.log('Email:', existingSuperAdmin.email)
            return
        }

        // Criar senha hash
        const senhaHash = await bcrypt.hash('admin123', 10)

        // Criar super admin
        const superAdmin = await prisma.superAdmin.create({
            data: {
                nome: 'Super Administrador',
                email: 'superadmin@lavamaster.com.br',
                senha: senhaHash,
                ativo: true
            }
        })

        console.log('✅ Super Admin criado com sucesso!')
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        console.log('📧 Email:', superAdmin.email)
        console.log('🔑 Senha:', 'admin123')
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        console.log('🌐 Acesse: http://localhost:3000/superadmin')
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    } catch (error) {
        console.error('❌ Erro ao criar Super Admin:', error)
    } finally {
        await prisma.$disconnect()
    }
}

createSuperAdmin()
