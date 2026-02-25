import { getPdfFromStore, extractSinglePage } from '../../../../utils/pdf-service';

export default async function handler(req, res) {
    try {
        const { id, page, dl } = req.query;

        if (req.method !== 'GET') {
            return res.status(405).json({ error: 'Method not allowed' });
        }

        const pdfBytes = await getPdfFromStore(id);
        if (!pdfBytes) return res.status(404).json({ error: 'Document not found' });

        let output = pdfBytes;

        if (page) {
            const pageIdx = parseInt(page, 10) - 1;
            const extracted = await extractSinglePage(pdfBytes, pageIdx);
            if (!extracted) return res.status(404).json({ error: 'Page not found' });
            output = extracted;
        }

        const disposition = dl === '1' ? 'attachment' : 'inline';
        const filename = `document-${id}${page ? `-page${page}` : ''}.pdf`;

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `${disposition}; filename="${filename}"`);
        res.send(Buffer.from(output));
    } catch (err) {
        console.error('PDF serve error:', err);
        return res.status(500).json({ error: err.message });
    }
}
