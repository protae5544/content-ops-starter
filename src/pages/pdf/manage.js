import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';

export default function PdfManagePage() {
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const loadDocuments = async () => {
        try {
            const resp = await fetch('/api/pdf/documents');
            if (!resp.ok) throw new Error('Failed to load documents');
            const data = await resp.json();
            setDocuments(data);
        } catch (e) {
            setError(e.message);
        }
        setLoading(false);
    };

    useEffect(() => {
        loadDocuments();
    }, []);

    const handleDownload = async (id, name) => {
        try {
            const resp = await fetch(`/api/pdf/serve/${id}?dl=1`);
            if (!resp.ok) throw new Error('Download failed');
            const blob = await resp.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${name}.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (e) {
            alert('ดาวน์โหลดล้มเหลว: ' + e.message);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('ต้องการลบเอกสารนี้?')) return;
        try {
            await fetch(`/api/pdf/documents/${id}`, { method: 'DELETE' });
            loadDocuments();
        } catch (e) {
            alert('ลบล้มเหลว: ' + e.message);
        }
    };

    const methodLabel = (m) => {
        switch (m) {
            case 'builder':
                return 'สร้างเอง';
            case 'json':
                return 'JSON';
            case 'upload':
                return 'อัปโหลด';
            default:
                return m;
        }
    };

    return (
        <>
            <Head>
                <title>จัดการเอกสาร PDF</title>
                <meta name="viewport" content="width=device-width, initial-scale=1" />
            </Head>
            <div className="min-h-screen bg-gray-100">
                <header className="bg-white shadow-sm border-b">
                    <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
                        <div>
                            <h1 className="text-xl font-semibold text-gray-800">จัดการเอกสาร PDF</h1>
                            <p className="text-sm text-gray-500">PDF Document Management</p>
                        </div>
                        <Link
                            href="/pdf/builder/"
                            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm"
                        >
                            + สร้างเอกสารใหม่
                        </Link>
                    </div>
                </header>

                <main className="max-w-6xl mx-auto px-4 py-6">
                    {loading && <p className="text-gray-500 text-center py-8">กำลังโหลด...</p>}
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">{error}</div>
                    )}

                    {!loading && documents.length === 0 && (
                        <div className="text-center py-16">
                            <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="1.5"
                                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                />
                            </svg>
                            <p className="text-gray-500 mb-4">ยังไม่มีเอกสาร</p>
                            <Link href="/pdf/builder/" className="text-blue-600 hover:text-blue-700 font-medium">
                                สร้างเอกสารแรกของคุณ
                            </Link>
                        </div>
                    )}

                    <div className="grid gap-4">
                        {documents.map((doc) => (
                            <div key={doc.id} className="bg-white rounded-xl shadow-sm border p-5">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-gray-800 text-lg">{doc.name}</h3>
                                        <p className="text-sm text-gray-500 mt-1">
                                            สร้างเมื่อ:{' '}
                                            {new Date(doc.createdAt).toLocaleDateString('th-TH', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            })}
                                            {' | '}วิธี: {methodLabel(doc.method)}
                                        </p>
                                        <div className="mt-3 space-y-1">
                                            <p className="text-xs text-gray-500">
                                                <span className="font-medium">QR หน้า 1 (Viewer):</span>{' '}
                                                <span className="text-green-700">{doc.viewerUrl}</span>
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                <span className="font-medium">QR หน้า 2 (Download):</span>{' '}
                                                <span className="text-purple-700">{doc.downloadUrl}</span>
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t">
                                    <Link
                                        href={`/pdf/viewer/${doc.id}/`}
                                        target="_blank"
                                        className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium py-2 px-4 rounded-lg transition-colors"
                                    >
                                        ดูตัวอย่าง (หน้า 1)
                                    </Link>
                                    <button
                                        onClick={() => handleDownload(doc.id, doc.name)}
                                        className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors"
                                    >
                                        ดาวน์โหลดเอกสารคู่
                                    </button>
                                    <button
                                        onClick={() => handleDelete(doc.id)}
                                        className="bg-red-50 hover:bg-red-100 text-red-600 text-sm font-medium py-2 px-4 rounded-lg transition-colors"
                                    >
                                        ลบ
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </main>
            </div>
        </>
    );
}
