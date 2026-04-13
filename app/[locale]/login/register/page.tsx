"use client";

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';

// 1. Aquí ponemos la lógica que lee la URL
function RegisterLogic() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const ref = searchParams.get('ref');
    if (ref) {
      router.replace(`/?tab=register&ref=${ref}`);
    } else {
      router.replace('/?tab=register');
    }
  }, [router, searchParams]);

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
}

// 2. Envolvemos esa lógica en el escudo "Suspense" para que Next.js compile feliz
export default function RegisterRedirect() {
  // Inicializamos el traductor por si en el futuro decides poner texto en el fallback
  const t = useTranslations('RegisterRedirect'); 

  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center gap-4">
        <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-500 text-sm font-bold uppercase tracking-widest animate-pulse">{t('loading')}</p>
      </div>
    }>
      <RegisterLogic />
    </Suspense>
  );
}