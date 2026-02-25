import {
    generateId, savePdfToStore, listAllMeta,
    createFromBuilder, createFromJson, ensureTwoPages,
    stampQRCodes, getSiteUrl
} from '../../../utils/pdf-service';

export const config = {
    api: { bodyParser: { sizeLimit: '10mb' } }
};

export default async function handler(req, res) {
    try {
        if (req.method === 'GET') {
            const items = await listAllMeta();
            return res.status(200).json(items);
        }

        if (req.method === 'POST') {
            const { method, data, name } = req.body;

            if (!method) {
                return res.status(400).json({ error: 'Missing "method" field. Use: builder, json, upload' });
            }

            const id = generateId();
            const siteUrl = getSiteUrl(req);
            const viewerUrl = `${siteUrl}/pdf/viewer/${id}/`;
            const downloadUrl = `${siteUrl}/pdf/download/${id}/`;

            let pdfBytes;

            if (method === 'builder') {
                pdfBytes = await createFromBuilder(data || {});
            } else if (method === 'json') {
                pdfBytes = await createFromJson(data || { pages: [] });
            } else if (method === 'upload') {
                if (!data?.base64) {
                    return res.status(400).json({ error: 'Missing base64 PDF data' });
                }
                const raw = Buffer.from(data.base64, 'base64');
                pdfBytes = await ensureTwoPages(raw);
            } else {
                return res.status(400).json({ error: 'Invalid method. Use: builder, json, upload' });
            }

            const stamped = await stampQRCodes(pdfBytes, viewerUrl, downloadUrl, data?.qrOptions || {});

            const metadata = {
                name: name || `Document-${id}`,
                method,
                createdAt: new Date().toISOString(),
                viewerUrl,
                downloadUrl
            };

            await savePdfToStore(id, stamped, metadata);

            return res.status(201).json({ id, ...metadata });
        }

        return res.status(405).json({ error: 'Method not allowed' });
    } catch (err) {
        console.error('PDF documents API error:', err);
        return res.status(500).json({ error: err.message });
    }
}
