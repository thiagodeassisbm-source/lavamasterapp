import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
    globalForPrisma.prisma ||
    new PrismaClient({
        log: ['query', 'info', 'warn', 'error'],
        datasources: {
            db: {
                url: process.env.DATABASE_URL
                    ? process.env.DATABASE_URL.replace('aws-0-sa-east-1.pooler.supabase.com', 'db.bkhtemypttswlkluaort.supabase.co').replace('aws-1-sa-east-1.pooler.supabase.com', 'db.bkhtemypttswlkluaort.supabase.co')
                    : "postgres://postgres.bkhtemypttswlkluaort:Z4PKLWQY8J9gF6Kp@db.bkhtemypttswlkluaort.supabase.co:5432/postgres",
            },
        },
    });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
