import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const DB_FILE = path.join(process.cwd(), 'local-db.json');

function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

async function readLocalDb() {
    try {
        const data = await fs.readFile(DB_FILE, 'utf-8');
        return JSON.parse(data);
    } catch {
        return {};
    }
}

async function writeLocalDb(data: any) {
    await fs.writeFile(DB_FILE, JSON.stringify(data, null, 2));
}

export async function GET() {
    try {
        const db = await readLocalDb();
        return NextResponse.json(db.orcamentos || []);
    } catch (error) {
        return NextResponse.json(
            { error: 'Erro ao buscar orçamentos' },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const rawBody = await request.text();
        const data = JSON.parse(rawBody);

        const db = await readLocalDb();

        const novoOrcamento = {
            ...data,
            id: data.id || generateUUID(),
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        if (!db.orcamentos) db.orcamentos = [];

        // Check if updating or creating (though POST usually means create, I'll assume create for now)
        // If the front-end sends an ID for an existing item on POST, we might duplicate. 
        // Standard REST: POST is create. PUT is update. 
        // I'll implement POST as create.

        db.orcamentos.push(novoOrcamento);

        await writeLocalDb(db);

        return NextResponse.json(novoOrcamento);

    } catch (error: any) {
        console.error('Erro ao salvar orçamento:', error);
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}
