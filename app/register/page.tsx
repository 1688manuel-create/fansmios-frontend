"use client";

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function RegisterRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Atrapamos si trae un código de referido
    const ref = searchParams.get('ref');
    
    // Lo mandamos a la nueva página principal fusionada
    if (ref) {
      router.replace(`/?tab=register&ref=${ref}`);
    } else {
      router.replace('/?tab=register');
    }
  }, [router, searchParams]);

  // Pantalla negra de carga que dura milisegundos
  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
}