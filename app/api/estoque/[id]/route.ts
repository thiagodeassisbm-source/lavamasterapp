import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const DB_FILE = path.join(process.cwd(), 'local-db.json');

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

export async function PUT(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;
        const body = await request.json();
        const db = await readLocalDb();

        if (!db.estoque) return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 });

        const index = db.estoque.findIndex((p: any) => p.id === id);
        if (index === -1) return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 });

        const updatedProduto = {
            ...db.estoque[index],
            ...body,
            updatedAt: new Date(),
        };

        db.estoque[index] = updatedProduto;
        await writeLocalDb(db);

        return NextResponse.json(updatedProduto);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;
        const db = await readLocalDb();

        if (!db.estoque) return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 });

        const initialLength = db.estoque.length;
        db.estoque = db.estoque.filter((p: any) => p.id !== id);

        if (db.estoque.length === initialLength) {
            return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 });
        }

        await writeLocalDb(db);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
