import React, { useEffect, useState } from 'react';
import Head from 'next/head';

export default function PdfDownloadPage({ id }) {
    const [meta, setMeta] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [downloading, setDownloading] = useState(false);

    useEffect(() => {
        if (!id) return;
        fetch(`/api/pdf/documents/${id}`)
            .then((r) => {
                if (!r.ok) throw new Error('ไม่พบเอกสาร');
                return r.json();
            })
            .then((data) => {
                setMeta(data);
                setLoading(false);
            })
            .catch((e) => {
                setError(e.message);
                setLoading(false);
            });
    }, [id]);

    const handleDownload = async () => {
        setDownloading(true);
        try {
            const resp = await fetch(`/api/pdf/serve/${id}?dl=1`);
            if (!resp.ok) throw new Error('ดาวน์โหลดล้มเหลว');
            const blob = await resp.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${meta?.name || 'document'}.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (e) {
            setError(e.message);
        }
        setDownloading(false);
    };

    return (
        <>
            <Head>
                <title>Download Document</title>
                <meta name="viewport" content="width=device-width, initial-scale=1" />
            </Head>
            <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
                <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
                    <div className="mb-6">
                        <svg className="w-16 h-16 mx-auto text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="1.5"
                                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-800 mb-2">ดาวน์โหลดเอกสาร</h1>
                    <p className="text-gray-500 mb-6">Download Document</p>

                    {loading && <p className="text-gray-500">กำลังโหลด...</p>}
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">{error}</div>
                    )}

                    {meta && (
                        <>
                            <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
                                <p className="text-sm text-gray-600">
                                    <strong>ชื่อเอกสาร:</strong> {meta.name}
                                </p>
                                <p className="text-sm text-gray-600">
                                    <strong>สร้างเมื่อ:</strong> {new Date(meta.createdAt).toLocaleDateString('th-TH')}
                                </p>
                            </div>
                            <button
                                onClick={handleDownload}
                                disabled={downloading}
                                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                            >
                                {downloading ? 'กำลังดาวน์โหลด...' : 'ดาวน์โหลด PDF'}
                            </button>
                        </>
                    )}
                </div>
            </div>
        </>
    );
}

export async function getServerSideProps({ params }) {
    return { props: { id: params.id } };
}
