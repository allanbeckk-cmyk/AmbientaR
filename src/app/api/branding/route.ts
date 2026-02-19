import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const BRANDING_DIR = path.join(process.cwd(), 'public', 'branding');
const CONFIG_PATH = path.join(BRANDING_DIR, 'config.json');
const FIELDS = ['headerImageUrl', 'footerImageUrl', 'watermarkImageUrl'] as const;
const FIELD_TO_FILE: Record<string, string> = {
  headerImageUrl: 'header',
  footerImageUrl: 'footer',
  watermarkImageUrl: 'watermark',
};

async function ensureDir() {
  await fs.mkdir(BRANDING_DIR, { recursive: true });
}

function getPathForField(fieldName: string, ext: string) {
  const base = FIELD_TO_FILE[fieldName] ?? fieldName;
  return path.join(BRANDING_DIR, `${base}${ext}`);
}

async function readConfig(): Promise<{ logoUsage?: string; systemLogoSource?: string }> {
  try {
    const raw = await fs.readFile(CONFIG_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export async function GET() {
  try {
    await ensureDir();
    const result: Record<string, string | null | undefined> = {};
    for (const field of FIELDS) {
      const base = FIELD_TO_FILE[field];
      const entries = await fs.readdir(BRANDING_DIR).catch(() => []);
      const found = entries.find((e) => e.startsWith(base + '.') || e === base);
      result[field] = found ? `/branding/${found}` : null;
    }
    const config = await readConfig();
    result.logoUsage = config.logoUsage ?? 'pdf_only';
    result.systemLogoSource = config.systemLogoSource ?? 'header';
    return NextResponse.json(result);
  } catch (e) {
    console.error('GET /api/branding:', e);
    return NextResponse.json(
      { headerImageUrl: null, footerImageUrl: null, watermarkImageUrl: null, logoUsage: 'pdf_only', systemLogoSource: 'header' },
      { status: 200 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const fieldName = formData.get('fieldName') as string | null;
    const file = formData.get('file') as File | null;

    if (!fieldName || !FIELDS.includes(fieldName as any) || !file?.size) {
      return NextResponse.json(
        { success: false, error: 'fieldName e arquivo são obrigatórios.' },
        { status: 400 }
      );
    }

    await ensureDir();
    const ext = path.extname(file.name) || '.png';
    const safeExt = ['.png', '.jpg', '.jpeg', '.gif', '.webp'].includes(ext.toLowerCase()) ? ext : '.png';
    const outPath = getPathForField(fieldName, safeExt);

    const bytes = await file.arrayBuffer();
    await fs.writeFile(outPath, Buffer.from(bytes));

    const publicUrl = `/branding/${path.basename(outPath)}`;
    return NextResponse.json({ success: true, url: publicUrl });
  } catch (e) {
    console.error('POST /api/branding:', e);
    return NextResponse.json(
      { success: false, error: (e as Error).message || 'Falha ao salvar imagem.' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await ensureDir();
    const body = await request.json();
    const config = await readConfig();
    if (body.logoUsage !== undefined) config.logoUsage = body.logoUsage;
    if (body.systemLogoSource !== undefined) config.systemLogoSource = body.systemLogoSource;
    await fs.writeFile(CONFIG_PATH, JSON.stringify(config, null, 2));
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('PATCH /api/branding:', e);
    return NextResponse.json({ success: false, error: (e as Error).message }, { status: 500 });
  }
}
