const bcrypt = require('bcryptjs')

async function generateHash() {
    const senha = 'admin123'
    const hash = await bcrypt.hash(senha, 10)

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('🔑 HASH BCRYPT PARA SENHA: admin123')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log(hash)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('\nSQL para atualizar:')
    console.log(`UPDATE super_admins SET senha = '${hash}' WHERE email = 'thiago.deassisbm@gmail.com';`)
}

generateHash()
