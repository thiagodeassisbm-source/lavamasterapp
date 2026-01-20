import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const DB_FILE = path.join(process.cwd(), 'local-db.json');

// Helper para ler o DB local
async function readLocalDb() {
    try {
        const data = await fs.readFile(DB_FILE, 'utf-8');
        const json = JSON.parse(data);
        // Garantir que existe a chave despesas
        if (!json.despesas) json.despesas = [];
        return json;
    } catch {
        return { clientes: [], atendimentos: [], despesas: [] };
    }
}

// Helper para escrever no DB local
async function writeLocalDb(data: any) {
    await fs.writeFile(DB_FILE, JSON.stringify(data, null, 2));
}

export async function GET() {
    try {
        const db = await readLocalDb();
        return NextResponse.json(db.despesas || []);
    } catch (error) {
        return NextResponse.json(
            { error: 'Erro ao buscar despesas' },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const db = await readLocalDb();

        const novaDespesa = {
            id: crypto.randomUUID(),
            ...body,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        if (!db.despesas) db.despesas = [];
        db.despesas.push(novaDespesa);

        await writeLocalDb(db);

        return NextResponse.json(novaDespesa);
    } catch (error) {
        console.error('Erro ao salvar despesa:', error);
        return NextResponse.json(
            { error: 'Erro ao salvar despesa' },
            { status: 500 }
        );
    }
}
