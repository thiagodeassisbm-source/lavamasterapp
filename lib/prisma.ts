import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
    globalForPrisma.prisma ||
    new PrismaClient({
        log: ['query', 'info', 'warn', 'error'],
        datasources: {
            db: {
                // FORÇANDO CONEXÃO DIRETA NA PORTA 5432 (Ignorando variáveis de ambiente quebradas da Vercel)
                url: "postgres://postgres.bkhtemypttswlkluaort:Z4PKLWQY8J9gF6Kp@db.bkhtemypttswlkluaort.supabase.co:5432/postgres?pgbouncer=true&connection_limit=1",
            },
        },
    });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
