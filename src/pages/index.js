import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function IndexPage() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/pdf/manage/');
    }, [router]);

    return (
        <>
            <Head>
                <title>PDF Document System</title>
                <meta name="viewport" content="width=device-width, initial-scale=1" />
            </Head>
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <p className="text-gray-500">Redirecting...</p>
            </div>
        </>
    );
}
