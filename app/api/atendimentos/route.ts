import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const DB_FILE = path.join(process.cwd(), 'local-db.json');

// Helper para ler o DB local
async function readLocalDb() {
    try {
        const data = await fs.readFile(DB_FILE, 'utf-8');
        return JSON.parse(data);
    } catch {
        return { clientes: [], atendimentos: [] };
    }
}

// Helper para escrever no DB local
async function writeLocalDb(data: any) {
    await fs.writeFile(DB_FILE, JSON.stringify(data, null, 2));
}

export async function GET() {
    try {
        const db = await readLocalDb();
        return NextResponse.json(db.atendimentos || []);
    } catch (error) {
        return NextResponse.json(
            { error: 'Erro ao buscar atendimentos' },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const db = await readLocalDb();

        const novoAtendimento = {
            id: crypto.randomUUID(),
            ...body,
            createdAt: new Date(),
            updatedAt: new Date(),
            status: body.status || 'em_andamento'
        };

        if (!db.atendimentos) db.atendimentos = [];
        db.atendimentos.push(novoAtendimento);

        await writeLocalDb(db);

        return NextResponse.json(novoAtendimento);
    } catch (error) {
        console.error('Erro ao salvar atendimento:', error);
        return NextResponse.json(
            { error: 'Erro ao salvar atendimento' },
            { status: 500 }
        );
    }
}

export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const { id, ...updates } = body;

        if (!id) {
            return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 });
        }

        const db = await readLocalDb();
        if (!db.atendimentos) db.atendimentos = [];

        const index = db.atendimentos.findIndex((a: any) => a.id === id);

        if (index === -1) {
            return NextResponse.json({ error: 'Atendimento não encontrado' }, { status: 404 });
        }

        db.atendimentos[index] = {
            ...db.atendimentos[index],
            ...updates,
            updatedAt: new Date()
        };

        await writeLocalDb(db);

        return NextResponse.json(db.atendimentos[index]);
    } catch (error) {
        console.error('Erro ao atualizar atendimento:', error);
        return NextResponse.json(
            { error: 'Erro ao atualizar atendimento' },
            { status: 500 }
        );
    }
}
