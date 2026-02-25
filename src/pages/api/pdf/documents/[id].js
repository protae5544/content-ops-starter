import { getMetaFromStore, deleteFromStore } from '../../../../utils/pdf-service';

export default async function handler(req, res) {
    try {
        const { id } = req.query;

        if (req.method === 'GET') {
            const meta = await getMetaFromStore(id);
            if (!meta) return res.status(404).json({ error: 'Document not found' });
            return res.status(200).json({ id, ...meta });
        }

        if (req.method === 'DELETE') {
            await deleteFromStore(id);
            return res.status(200).json({ deleted: true });
        }

        return res.status(405).json({ error: 'Method not allowed' });
    } catch (err) {
        console.error('PDF document API error:', err);
        return res.status(500).json({ error: err.message });
    }
}
