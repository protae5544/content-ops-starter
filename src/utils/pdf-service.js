import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import QRCode from 'qrcode';
import { getStore } from '@netlify/blobs';

const PDF_STORE = 'pdf-documents';
const META_STORE = 'pdf-metadata';

// ==================== Storage ====================

export function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}

export async function savePdfToStore(id, pdfBytes, metadata) {
    const pdfStore = getStore(PDF_STORE);
    const metaStore = getStore(META_STORE);
    await pdfStore.set(id, Buffer.from(pdfBytes), { metadata: { type: 'application/pdf' } });
    await metaStore.set(id, JSON.stringify(metadata));
}

export async function getPdfFromStore(id) {
    const pdfStore = getStore(PDF_STORE);
    const data = await pdfStore.get(id, { type: 'arrayBuffer' });
    if (!data) return null;
    return new Uint8Array(data);
}

export async function getMetaFromStore(id) {
    const metaStore = getStore(META_STORE);
    const raw = await metaStore.get(id);
    if (!raw) return null;
    return JSON.parse(raw);
}

export async function listAllMeta() {
    const metaStore = getStore(META_STORE);
    const { blobs } = await metaStore.list();
    const items = [];
    for (const b of blobs) {
        const raw = await metaStore.get(b.key);
        if (raw) {
            items.push({ id: b.key, ...JSON.parse(raw) });
        }
    }
    return items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export async function deleteFromStore(id) {
    const pdfStore = getStore(PDF_STORE);
    const metaStore = getStore(META_STORE);
    await pdfStore.delete(id);
    await metaStore.delete(id);
}

// ==================== QR Code Drawing ====================

function getQRMatrix(text) {
    const qr = QRCode.create(text, { errorCorrectionLevel: 'M' });
    return { data: qr.modules.data, size: qr.modules.size };
}

function drawQR(page, text, x, y, size) {
    const { data, size: moduleCount } = getQRMatrix(text);
    const cellSize = size / moduleCount;

    // White background with thin border
    page.drawRectangle({
        x: x - 5,
        y: y - 5,
        width: size + 10,
        height: size + 10,
        color: rgb(1, 1, 1),
        borderColor: rgb(0.8, 0.8, 0.8),
        borderWidth: 0.5
    });

    // Draw QR modules
    for (let r = 0; r < moduleCount; r++) {
        for (let c = 0; c < moduleCount; c++) {
            if (data[r * moduleCount + c]) {
                page.drawRectangle({
                    x: x + c * cellSize,
                    y: y + (moduleCount - 1 - r) * cellSize,
                    width: cellSize,
                    height: cellSize,
                    color: rgb(0, 0, 0)
                });
            }
        }
    }
}

// ==================== PDF Creation ====================

export async function createFromBuilder(builderData) {
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const W = 595.28;
    const H = 841.89;

    // Page 1
    const p1 = pdfDoc.addPage([W, H]);
    let y1 = H - 60;

    if (builderData.title) {
        p1.drawText(builderData.title, { x: 50, y: y1, size: 24, font: boldFont, color: rgb(0.1, 0.1, 0.1) });
        y1 -= 40;
    }
    if (builderData.subtitle) {
        p1.drawText(builderData.subtitle, { x: 50, y: y1, size: 14, font, color: rgb(0.4, 0.4, 0.4) });
        y1 -= 30;
    }
    if (builderData.content) {
        for (const line of builderData.content.split('\n')) {
            if (y1 < 60) break;
            p1.drawText(line, { x: 50, y: y1, size: 12, font, color: rgb(0.2, 0.2, 0.2) });
            y1 -= 18;
        }
    }

    // Page 2
    const p2 = pdfDoc.addPage([W, H]);
    let y2 = H - 60;

    if (builderData.page2Title) {
        p2.drawText(builderData.page2Title, { x: 50, y: y2, size: 24, font: boldFont, color: rgb(0.1, 0.1, 0.1) });
        y2 -= 40;
    }
    if (builderData.page2Content) {
        for (const line of builderData.page2Content.split('\n')) {
            if (y2 < 60) break;
            p2.drawText(line, { x: 50, y: y2, size: 12, font, color: rgb(0.2, 0.2, 0.2) });
            y2 -= 18;
        }
    }

    return pdfDoc.save();
}

export async function createFromJson(jsonDef) {
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const pages = jsonDef.pages || [];

    // Ensure at least 2 pages
    while (pages.length < 2) {
        pages.push({ elements: [] });
    }

    for (const pageDef of pages) {
        const w = pageDef.width || 595.28;
        const h = pageDef.height || 841.89;
        const page = pdfDoc.addPage([w, h]);

        for (const el of pageDef.elements || []) {
            const c = el.color || [0, 0, 0];
            const color = rgb(c[0] / 255, c[1] / 255, c[2] / 255);

            switch (el.type) {
                case 'text':
                    page.drawText(String(el.text || ''), {
                        x: el.x || 50,
                        y: el.y || 750,
                        size: el.fontSize || 12,
                        font: el.bold ? boldFont : font,
                        color
                    });
                    break;
                case 'rect':
                    page.drawRectangle({
                        x: el.x || 0,
                        y: el.y || 0,
                        width: el.width || 100,
                        height: el.height || 50,
                        color,
                        borderColor: el.borderColor ? rgb(el.borderColor[0] / 255, el.borderColor[1] / 255, el.borderColor[2] / 255) : undefined,
                        borderWidth: el.borderWidth
                    });
                    break;
                case 'line':
                    page.drawLine({
                        start: { x: el.x1 || 0, y: el.y1 || 0 },
                        end: { x: el.x2 || 100, y: el.y2 || 0 },
                        thickness: el.thickness || 1,
                        color
                    });
                    break;
                case 'circle':
                    page.drawCircle({
                        x: el.x || 100,
                        y: el.y || 100,
                        size: el.radius || 50,
                        color
                    });
                    break;
            }
        }
    }

    return pdfDoc.save();
}

export async function ensureTwoPages(pdfBytes) {
    const pdfDoc = await PDFDocument.load(pdfBytes);
    if (pdfDoc.getPageCount() < 2) {
        pdfDoc.addPage([595.28, 841.89]);
    }
    return pdfDoc.save();
}

export async function stampQRCodes(pdfBytes, viewerUrl, downloadUrl, options = {}) {
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const pages = pdfDoc.getPages();
    const qrSize = options.qrSize || 80;

    if (pages.length >= 1) {
        const { width } = pages[0].getSize();
        const pos = options.page1Pos || { x: width - qrSize - 20, y: 20 };
        drawQR(pages[0], viewerUrl, pos.x, pos.y, qrSize);
    }

    if (pages.length >= 2) {
        const { width } = pages[1].getSize();
        const pos = options.page2Pos || { x: width - qrSize - 20, y: 20 };
        drawQR(pages[1], downloadUrl, pos.x, pos.y, qrSize);
    }

    return pdfDoc.save();
}

export async function extractSinglePage(pdfBytes, pageIndex) {
    const src = await PDFDocument.load(pdfBytes);
    if (pageIndex < 0 || pageIndex >= src.getPageCount()) return null;
    const dest = await PDFDocument.create();
    const [copied] = await dest.copyPages(src, [pageIndex]);
    dest.addPage(copied);
    return dest.save();
}

export function getSiteUrl(req) {
    if (process.env.URL) return process.env.URL;
    const proto = req.headers['x-forwarded-proto'] || 'https';
    const host = req.headers['x-forwarded-host'] || req.headers.host;
    return `${proto}://${host}`;
}
