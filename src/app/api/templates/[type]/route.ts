import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const ALLOWED_EXT = ['.docx', '.doc'];

const TEMPLATE_SLUGS = [
  'rca',
  'ptrf',
  'prada',
  'pia',
  'eia-rima',
  'las-ras',
  'pca',
  'pea',
  'reserva-legal',
  'fauna',
  'outorgas',
  'barragens',
] as const;

function getTemplateDir(type: string) {
  const slug = type.toLowerCase().replace(/[^a-z0-9-]/g, '');
  if (!TEMPLATE_SLUGS.includes(slug as (typeof TEMPLATE_SLUGS)[number])) return null;
  return path.join(process.cwd(), 'public', 'templates', slug);
}

async function ensureDir(dir: string) {
  await fs.mkdir(dir, { recursive: true });
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  const { type } = await params;
  const dir = getTemplateDir(type);
  if (!dir) {
    return NextResponse.json({ url: null, fileName: null }, { status: 404 });
  }
  try {
    await ensureDir(dir);
    const entries = await fs.readdir(dir).catch(() => []);
    const found = entries.find((e) => ALLOWED_EXT.includes(path.extname(e).toLowerCase()));
    const slug = path.basename(dir);
    const url = found ? `/templates/${slug}/${found}` : null;
    return NextResponse.json({ url, fileName: found ?? null });
  } catch (e) {
    console.error('GET /api/templates/[type]:', e);
    return NextResponse.json({ url: null, fileName: null }, { status: 200 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  const { type } = await params;
  const dir = getTemplateDir(type);
  if (!dir) {
    return NextResponse.json({ success: false, error: 'Tipo de template inválido.' }, { status: 400 });
  }
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file?.size) {
      return NextResponse.json(
        { success: false, error: 'Envie um arquivo DOCX.' },
        { status: 400 }
      );
    }

    const ext = path.extname(file.name).toLowerCase();
    if (!ALLOWED_EXT.includes(ext)) {
      return NextResponse.json(
        { success: false, error: 'Apenas arquivos .docx ou .doc são aceitos.' },
        { status: 400 }
      );
    }

    await ensureDir(dir);
    const outPath = path.join(dir, `template${ext}`);
    const bytes = await file.arrayBuffer();
    await fs.writeFile(outPath, Buffer.from(bytes));

    const slug = path.basename(dir);
    const publicUrl = `/templates/${slug}/template${ext}`;
    return NextResponse.json({ success: true, url: publicUrl });
  } catch (e) {
    console.error('POST /api/templates/[type]:', e);
    return NextResponse.json(
      { success: false, error: (e as Error).message || 'Falha ao salvar template.' },
      { status: 500 }
    );
  }
}
