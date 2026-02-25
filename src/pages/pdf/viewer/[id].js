import React, { useEffect, useRef, useState } from 'react';
import Head from 'next/head';

export default function PdfViewerPage({ id }) {
    const canvasRef = useRef(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!id) return;

        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
        script.onload = async () => {
            window.pdfjsLib.GlobalWorkerOptions.workerSrc =
                'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

            try {
                const resp = await fetch(`/api/pdf/serve/${id}?page=1`);
                if (!resp.ok) throw new Error('ไม่พบเอกสาร');

                const buf = await resp.arrayBuffer();
                const pdf = await window.pdfjsLib.getDocument({ data: buf }).promise;
                const page = await pdf.getPage(1);

                const container = document.getElementById('pdf-container');
                const containerWidth = container?.clientWidth || 800;
                const unscaledViewport = page.getViewport({ scale: 1 });
                const scale = Math.min(containerWidth / unscaledViewport.width, 2);
                const viewport = page.getViewport({ scale });

                const canvas = canvasRef.current;
                canvas.width = viewport.width;
                canvas.height = viewport.height;

                await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
                setLoading(false);
            } catch (e) {
                setError(e.message);
                setLoading(false);
            }
        };
        script.onerror = () => {
            setError('Failed to load PDF renderer');
            setLoading(false);
        };
        document.head.appendChild(script);
    }, [id]);

    return (
        <>
            <Head>
                <title>Document Viewer</title>
                <meta name="viewport" content="width=device-width, initial-scale=1" />
            </Head>
            <div className="min-h-screen bg-gray-100">
                <header className="bg-white shadow-sm border-b">
                    <div className="max-w-4xl mx-auto px-4 py-4">
                        <h1 className="text-xl font-semibold text-gray-800">Document Viewer</h1>
                        <p className="text-sm text-gray-500">แสดงเอกสารหน้าที่ 1</p>
                    </div>
                </header>
                <main id="pdf-container" className="max-w-4xl mx-auto px-4 py-6 flex flex-col items-center">
                    {loading && (
                        <div className="flex items-center gap-2 text-gray-600 py-12">
                            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                            <span>กำลังโหลดเอกสาร...</span>
                        </div>
                    )}
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg my-4">
                            {error}
                        </div>
                    )}
                    <canvas
                        ref={canvasRef}
                        className="shadow-lg rounded-sm bg-white"
                        style={{ maxWidth: '100%', display: loading ? 'none' : 'block' }}
                    />
                </main>
            </div>
        </>
    );
}

export async function getServerSideProps({ params }) {
    return { props: { id: params.id } };
}
