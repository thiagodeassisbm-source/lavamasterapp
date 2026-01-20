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
        return NextResponse.json(db.estoque || []);
    } catch (error) {
        return NextResponse.json(
            { error: 'Erro ao buscar estoque' },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const rawBody = await request.text();
        const data = JSON.parse(rawBody);

        const db = await readLocalDb();

        const novoProduto = {
            ...data,
            id: data.id || generateUUID(),
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        if (!db.estoque) db.estoque = [];
        db.estoque.push(novoProduto);

        await writeLocalDb(db);

        return NextResponse.json(novoProduto);

    } catch (error: any) {
        console.error('Erro ao salvar produto:', error);
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}
