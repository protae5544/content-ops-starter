import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';

const TABS = [
    { key: 'builder', label: 'สร้างเอง', sublabel: 'Dynamic Builder' },
    { key: 'json', label: 'นำเข้า JSON', sublabel: 'JSON Import' },
    { key: 'upload', label: 'อัปโหลดไฟล์', sublabel: 'File Upload' }
];

const JSON_EXAMPLE = JSON.stringify(
    {
        pages: [
            {
                width: 595.28,
                height: 841.89,
                elements: [
                    { type: 'text', text: 'Page 1 Title', x: 50, y: 780, fontSize: 24, bold: true, color: [0, 0, 0] },
                    { type: 'text', text: 'Content text here', x: 50, y: 740, fontSize: 12, color: [50, 50, 50] },
                    { type: 'rect', x: 50, y: 600, width: 200, height: 100, color: [220, 230, 240] },
                    { type: 'line', x1: 50, y1: 590, x2: 545, y2: 590, thickness: 1, color: [200, 200, 200] }
                ]
            },
            {
                elements: [
                    { type: 'text', text: 'Page 2 Title', x: 50, y: 780, fontSize: 24, bold: true, color: [0, 0, 0] },
                    { type: 'text', text: 'Page 2 content', x: 50, y: 740, fontSize: 12, color: [50, 50, 50] }
                ]
            }
        ]
    },
    null,
    2
);

function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result;
            resolve(result.split(',')[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

export default function PdfBuilderPage() {
    const [activeTab, setActiveTab] = useState('builder');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    // Builder form state
    const [builderData, setBuilderData] = useState({
        name: '',
        title: '',
        subtitle: '',
        content: '',
        page2Title: '',
        page2Content: ''
    });

    // JSON form state
    const [jsonName, setJsonName] = useState('');
    const [jsonContent, setJsonContent] = useState(JSON_EXAMPLE);

    // Upload form state
    const [uploadName, setUploadName] = useState('');
    const [uploadFile, setUploadFile] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);
        setSuccess(null);

        try {
            let body;

            if (activeTab === 'builder') {
                body = {
                    method: 'builder',
                    name: builderData.name || 'Untitled',
                    data: builderData
                };
            } else if (activeTab === 'json') {
                let parsed;
                try {
                    parsed = JSON.parse(jsonContent);
                } catch {
                    throw new Error('JSON ไม่ถูกต้อง / Invalid JSON format');
                }
                body = {
                    method: 'json',
                    name: jsonName || 'JSON Document',
                    data: parsed
                };
            } else if (activeTab === 'upload') {
                if (!uploadFile) throw new Error('กรุณาเลือกไฟล์ PDF');
                const base64 = await fileToBase64(uploadFile);
                body = {
                    method: 'upload',
                    name: uploadName || uploadFile.name.replace('.pdf', ''),
                    data: { base64 }
                };
            }

            const resp = await fetch('/api/pdf/documents', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (!resp.ok) {
                const errData = await resp.json();
                throw new Error(errData.error || 'สร้างเอกสารล้มเหลว');
            }

            const result = await resp.json();
            setSuccess(result);
        } catch (e) {
            setError(e.message);
        }
        setSubmitting(false);
    };

    const inputClass =
        'w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none';

    return (
        <>
            <Head>
                <title>สร้างเอกสาร PDF - PDF Builder</title>
                <meta name="viewport" content="width=device-width, initial-scale=1" />
            </Head>
            <div className="min-h-screen bg-gray-100">
                <header className="bg-white shadow-sm border-b">
                    <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
                        <div>
                            <h1 className="text-xl font-semibold text-gray-800">สร้างเอกสาร PDF</h1>
                            <p className="text-sm text-gray-500">Create PDF Document with QR Codes</p>
                        </div>
                        <Link href="/pdf/manage/" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                            กลับไปจัดการ
                        </Link>
                    </div>
                </header>

                <main className="max-w-4xl mx-auto px-4 py-6">
                    <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                        {/* Tabs */}
                        <div className="flex border-b">
                            {TABS.map((tab) => (
                                <button
                                    key={tab.key}
                                    onClick={() => {
                                        setActiveTab(tab.key);
                                        setError(null);
                                        setSuccess(null);
                                    }}
                                    className={`flex-1 py-3 px-4 text-center transition-colors ${
                                        activeTab === tab.key
                                            ? 'bg-blue-50 border-b-2 border-blue-600 text-blue-700'
                                            : 'text-gray-600 hover:bg-gray-50'
                                    }`}
                                >
                                    <div className="font-medium text-sm">{tab.label}</div>
                                    <div className="text-xs opacity-70">{tab.sublabel}</div>
                                </button>
                            ))}
                        </div>

                        <form onSubmit={handleSubmit} className="p-6">
                            {/* Builder Tab */}
                            {activeTab === 'builder' && (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อเอกสาร (Document Name)</label>
                                        <input
                                            type="text"
                                            value={builderData.name}
                                            onChange={(e) => setBuilderData({ ...builderData, name: e.target.value })}
                                            className={inputClass}
                                            placeholder="My Document"
                                        />
                                    </div>
                                    <fieldset className="border border-gray-200 rounded-lg p-4">
                                        <legend className="text-sm font-medium text-gray-600 px-2">หน้าที่ 1 (Page 1)</legend>
                                        <div className="space-y-3">
                                            <div>
                                                <label className="block text-sm text-gray-600 mb-1">หัวข้อ (Title)</label>
                                                <input
                                                    type="text"
                                                    value={builderData.title}
                                                    onChange={(e) => setBuilderData({ ...builderData, title: e.target.value })}
                                                    className={inputClass}
                                                    placeholder="Page 1 Title"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm text-gray-600 mb-1">หัวข้อรอง (Subtitle)</label>
                                                <input
                                                    type="text"
                                                    value={builderData.subtitle}
                                                    onChange={(e) => setBuilderData({ ...builderData, subtitle: e.target.value })}
                                                    className={inputClass}
                                                    placeholder="Subtitle"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm text-gray-600 mb-1">เนื้อหา (Content)</label>
                                                <textarea
                                                    value={builderData.content}
                                                    onChange={(e) => setBuilderData({ ...builderData, content: e.target.value })}
                                                    className={inputClass + ' h-32'}
                                                    placeholder="Enter content for page 1..."
                                                />
                                            </div>
                                        </div>
                                    </fieldset>
                                    <fieldset className="border border-gray-200 rounded-lg p-4">
                                        <legend className="text-sm font-medium text-gray-600 px-2">หน้าที่ 2 (Page 2)</legend>
                                        <div className="space-y-3">
                                            <div>
                                                <label className="block text-sm text-gray-600 mb-1">หัวข้อ (Title)</label>
                                                <input
                                                    type="text"
                                                    value={builderData.page2Title}
                                                    onChange={(e) => setBuilderData({ ...builderData, page2Title: e.target.value })}
                                                    className={inputClass}
                                                    placeholder="Page 2 Title"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm text-gray-600 mb-1">เนื้อหา (Content)</label>
                                                <textarea
                                                    value={builderData.page2Content}
                                                    onChange={(e) => setBuilderData({ ...builderData, page2Content: e.target.value })}
                                                    className={inputClass + ' h-32'}
                                                    placeholder="Enter content for page 2..."
                                                />
                                            </div>
                                        </div>
                                    </fieldset>
                                </div>
                            )}

                            {/* JSON Tab */}
                            {activeTab === 'json' && (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อเอกสาร (Document Name)</label>
                                        <input
                                            type="text"
                                            value={jsonName}
                                            onChange={(e) => setJsonName(e.target.value)}
                                            className={inputClass}
                                            placeholder="JSON Document"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">JSON Definition</label>
                                        <textarea
                                            value={jsonContent}
                                            onChange={(e) => setJsonContent(e.target.value)}
                                            className={inputClass + ' h-80 font-mono text-sm'}
                                            placeholder="Paste JSON here..."
                                        />
                                    </div>
                                    <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600">
                                        <strong>รูปแบบ JSON:</strong> กำหนด <code>pages[]</code> แต่ละหน้ามี <code>elements[]</code> ที่รองรับ:{' '}
                                        <code>text</code>, <code>rect</code>, <code>line</code>, <code>circle</code>
                                        <br />
                                        <strong>Element types:</strong>
                                        <br />- <code>text</code>: text, x, y, fontSize, bold, color[r,g,b]
                                        <br />- <code>rect</code>: x, y, width, height, color, borderColor, borderWidth
                                        <br />- <code>line</code>: x1, y1, x2, y2, thickness, color
                                        <br />- <code>circle</code>: x, y, radius, color
                                    </div>
                                </div>
                            )}

                            {/* Upload Tab */}
                            {activeTab === 'upload' && (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อเอกสาร (Document Name)</label>
                                        <input
                                            type="text"
                                            value={uploadName}
                                            onChange={(e) => setUploadName(e.target.value)}
                                            className={inputClass}
                                            placeholder="Document Name"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">เลือกไฟล์ PDF</label>
                                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
                                            <svg
                                                className="w-10 h-10 mx-auto text-gray-400 mb-3"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth="1.5"
                                                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                                                />
                                            </svg>
                                            <input
                                                type="file"
                                                accept=".pdf,application/pdf"
                                                onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                                                className="block mx-auto text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                            />
                                            {uploadFile && <p className="mt-3 text-sm text-green-700 font-medium">{uploadFile.name}</p>}
                                            <p className="mt-2 text-xs text-gray-400">
                                                นำเข้าไฟล์ PDF จากเครื่องหรือ bucket แล้วระบบจะแปะ QR Code ตามดีไซน์เดิม
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Messages */}
                            {error && (
                                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mt-4">{error}</div>
                            )}

                            {success && (
                                <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg mt-4">
                                    <p className="font-medium">สร้างเอกสารสำเร็จ! (Document Created)</p>
                                    <p className="text-sm mt-1">Document ID: {success.id}</p>
                                    <div className="mt-2 space-y-1 text-xs">
                                        <p>
                                            <strong>QR หน้า 1 (Viewer):</strong>{' '}
                                            <a href={success.viewerUrl} target="_blank" rel="noreferrer" className="text-blue-600 underline">
                                                {success.viewerUrl}
                                            </a>
                                        </p>
                                        <p>
                                            <strong>QR หน้า 2 (Download):</strong>{' '}
                                            <a href={success.downloadUrl} target="_blank" rel="noreferrer" className="text-blue-600 underline">
                                                {success.downloadUrl}
                                            </a>
                                        </p>
                                    </div>
                                    <div className="flex gap-3 mt-3">
                                        <a
                                            href={success.viewerUrl}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-sm text-blue-600 hover:text-blue-700 underline font-medium"
                                        >
                                            ดูตัวอย่าง
                                        </a>
                                        <Link href="/pdf/manage/" className="text-sm text-blue-600 hover:text-blue-700 underline font-medium">
                                            ไปจัดการเอกสาร
                                        </Link>
                                    </div>
                                </div>
                            )}

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full mt-6 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                            >
                                {submitting ? 'กำลังสร้าง...' : 'สร้างเอกสาร + แปะ QR Code'}
                            </button>
                        </form>
                    </div>

                    {/* Info Section */}
                    <div className="mt-6 bg-white rounded-xl shadow-sm border p-5">
                        <h2 className="font-semibold text-gray-800 mb-3">วิธีการทำงาน (How it works)</h2>
                        <div className="space-y-2 text-sm text-gray-600">
                            <p>1. สร้างเอกสาร PDF 2 หน้า ด้วยวิธีใดวิธีหนึ่ง (Builder / JSON / Upload)</p>
                            <p>2. ระบบแปะ QR Code อัตโนมัติบนทั้ง 2 หน้า</p>
                            <p>
                                3. <strong>QR Code หน้าที่ 1</strong> → ลิงก์ไปยัง Viewer แสดงเฉพาะหน้า 1
                            </p>
                            <p>
                                4. <strong>QR Code หน้าที่ 2</strong> → ลิงก์ไปยังหน้าดาวน์โหลด PDF ฉบับเต็ม
                            </p>
                            <p>5. เจ้าของสามารถดาวน์โหลด &quot;เอกสารคู่&quot; (PDF ทั้ง 2 หน้า) ได้จากหน้าจัดการ</p>
                        </div>
                    </div>
                </main>
            </div>
        </>
    );
}
