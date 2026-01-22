import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
    globalForPrisma.prisma ||
    new PrismaClient({
        log: ['query'],
        datasources: {
            db: {
                url: process.env.DATABASE_URL?.replace('aws-0-sa-east-1.pooler.supabase.com', 'db.bkhtemypttswlkluaort.supabase.co'),
            },
        },
    });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
