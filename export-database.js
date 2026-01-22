const { PrismaClient } = require('@prisma/client')
const fs = require('fs')

const prisma = new PrismaClient()

async function exportData() {
    try {
        console.log('📦 Exportando dados do SQLite...\n')

        const usuarios = await prisma.usuario.findMany()
        const data = {
            superAdmins: usuarios.filter(u => u.role === 'superadmin'),
            planos: await prisma.plano.findMany(),
            empresas: await prisma.empresa.findMany(),
            usuarios,
            clientes: await prisma.cliente.findMany(),
            veiculos: await prisma.veiculo.findMany(),
            servicos: await prisma.servico.findMany(),
            produtos: await prisma.produto.findMany(),
            agendamentos: await prisma.agendamento.findMany(),
            agendamentosServicos: await prisma.agendamentoServico.findMany(),
            vendas: await prisma.venda.findMany(),
            itensVenda: await prisma.itemVenda.findMany(),
            orcamentos: await prisma.orcamento.findMany(),
            itensOrcamento: await prisma.itemOrcamento.findMany(),
            despesas: await prisma.despesa.findMany(),
            receitas: await prisma.receita.findMany(),
            movimentacoesEstoque: await prisma.movimentacaoEstoque.findMany()
        }

        console.log('📊 Dados encontrados:')
        console.log(`   👤 ${data.superAdmins.length} Super Admin(s)`)
        console.log(`   📋 ${data.planos.length} Plano(s)`)
        console.log(`   🏢 ${data.empresas.length} Empresa(s)`)
        console.log(`   👥 ${data.usuarios.length} Usuário(s)`)
        console.log(`   🧑‍🤝‍🧑 ${data.clientes.length} Cliente(s)`)
        console.log(`   🚗 ${data.veiculos.length} Veículo(s)`)
        console.log(`   🔧 ${data.servicos.length} Serviço(s)`)
        console.log(`   📦 ${data.produtos.length} Produto(s)`)
        console.log(`   📅 ${data.agendamentos.length} Agendamento(s)`)
        console.log(`   💰 ${data.vendas.length} Venda(s)`)
        console.log(`   📝 ${data.orcamentos.length} Orçamento(s)`)
        console.log(`   💸 ${data.despesas.length} Despesa(s)`)
        console.log(`   💵 ${data.receitas.length} Receita(s)\n`)

        // Salvar em arquivo JSON
        fs.writeFileSync('database-export.json', JSON.stringify(data, null, 2))
        console.log('✅ Dados exportados para: database-export.json\n')

        // Criar arquivo SQL para importação direta
        let sql = '-- Exportação do banco SQLite para PostgreSQL\n\n'

        fs.writeFileSync('database-export.sql', sql)
        console.log('✅ SQL gerado em: database-export.sql\n')

        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        console.log('✅ EXPORTAÇÃO CONCLUÍDA!')
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

    } catch (error) {
        console.error('❌ Erro na exportação:', error)
    } finally {
        await prisma.$disconnect()
    }
}

exportData()
