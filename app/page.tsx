// frontend/app/page.tsx
"use client";

import Link from "next/link";
import { ShieldCheck, Lock, CheckCircle2 } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#050505] flex flex-col relative overflow-hidden text-white selection:bg-red-500/30">
      
      {/* 🔴 LUZ DE AMBIENTE DE FONDO */}
      <div className="absolute top-1/2 left-1/2 w-[800px] h-[800px] bg-red-600/10 rounded-full blur-[150px] pointer-events-none -translate-x-1/2 -translate-y-1/2"></div>

      {/* ==========================================
          ⚡ CONTENEDOR CENTRAL: LOGIN / REGISTRO
      ========================================== */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 relative z-10 w-full max-w-lg mx-auto animate-fade-in mt-10">
        
        {/* LOGO */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 nm-inset bg-black rounded-3xl flex items-center justify-center border border-white/5 shadow-[0_0_40px_rgba(239,68,68,0.2)] mb-6">
            <span className="text-5xl drop-shadow-[0_0_20px_rgba(239,68,68,0.8)]">⚡</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tighter text-center">
            FANSMIO <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-red-700">VIP</span>
          </h1>
          <p className="text-gray-400 text-center text-sm sm:text-base mt-4 font-medium leading-relaxed max-w-sm">
            La plataforma exclusiva para creadores de élite. <br/>
            <strong className="text-white">Tu contenido. Tus reglas. Tus fans.</strong>
          </p>
        </div>

        {/* BOTONES DIRECTOS */}
        <div className="w-full space-y-4">
          <Link 
            href="/auth" 
            className="w-full nm-btn-primary flex items-center justify-center py-4 rounded-2xl text-lg font-black tracking-wide shadow-[0_0_20px_rgba(239,68,68,0.4)] hover:scale-[1.02] transition-all"
          >
            Iniciar Sesión
          </Link>
          
          <Link 
            href="/auth?tab=register" 
            className="w-full nm-btn bg-[#0a0a0a] border border-white/10 hover:border-white/30 text-white flex items-center justify-center py-4 rounded-2xl text-lg font-black tracking-wide hover:scale-[1.02] transition-all"
          >
            Crear Cuenta Nueva
          </Link>
        </div>

        {/* TRUST BADGES */}
        <div className="mt-10 grid grid-cols-3 gap-4 w-full">
          <div className="flex flex-col items-center text-center gap-2 opacity-70">
            <ShieldCheck className="w-6 h-6 text-blue-500" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Plataforma<br/>Segura</span>
          </div>
          <div className="flex flex-col items-center text-center gap-2 opacity-70">
            <Lock className="w-6 h-6 text-green-500" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Privacidad<br/>Absoluta</span>
          </div>
          <div className="flex flex-col items-center text-center gap-2 opacity-70">
            <CheckCircle2 className="w-6 h-6 text-purple-500" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Creadores<br/>Verificados</span>
          </div>
        </div>

      </div>

      {/* ==========================================
          ⚖️ FOOTER LEGAL (VISIBLE Y PROFESIONAL)
      ========================================== */}
      <footer className="w-full border-t border-white/10 bg-[#050505] pt-8 pb-8 px-4 relative z-10 mt-auto">
        <div className="max-w-5xl mx-auto space-y-6">
          
          {/* BADGES LEGALES DESTACADOS */}
          <div className="flex flex-wrap justify-center gap-3 md:gap-4 text-[10px] uppercase font-black tracking-widest opacity-90">
            <div className="flex items-center gap-2 border border-white/10 px-3 py-2 rounded-lg bg-black text-gray-400 shadow-inner">
              <span className="text-red-500 text-sm">🔞</span> 18+ SOLO ADULTOS
            </div>
            <div className="flex items-center gap-2 border border-white/10 px-3 py-2 rounded-lg bg-black text-gray-400 shadow-inner">
              <span className="text-blue-500 text-sm">🪪</span> KYC OBLIGATORIO
            </div>
            <div className="flex items-center gap-2 border border-white/10 px-3 py-2 rounded-lg bg-black text-gray-400 shadow-inner">
              <span className="text-green-500 text-sm">🔒</span> PAGOS SEGUROS
            </div>
            <div className="flex items-center gap-2 border border-white/10 px-3 py-2 rounded-lg bg-black text-gray-400 shadow-inner">
              <span className="text-purple-500 text-sm">⚖️</span> DMCA PROTECTED
            </div>
          </div>

          {/* ENLACES A DOCUMENTOS FUNCIONALES */}
          <div className="flex flex-wrap justify-center gap-4 md:gap-8 text-xs text-blue-500 font-bold tracking-wide">
            <Link href="/legal/terms" className="hover:text-blue-400 transition-colors underline decoration-blue-500/30 underline-offset-4">Términos de Servicio</Link>
            <Link href="/legal/privacy" className="hover:text-blue-400 transition-colors underline decoration-blue-500/30 underline-offset-4">Política de Privacidad</Link>
            <Link href="/legal/content-policy" className="hover:text-blue-400 transition-colors underline decoration-blue-500/30 underline-offset-4">Política de Contenido</Link>
            <Link href="/legal/dmca" className="hover:text-blue-400 transition-colors underline decoration-blue-500/30 underline-offset-4">DMCA</Link>
            <Link href="/legal/18plus" className="hover:text-blue-400 transition-colors underline decoration-blue-500/30 underline-offset-4">Consentimiento 18+</Link>
            <Link href="/legal/2257" className="hover:text-blue-400 transition-colors underline decoration-blue-500/30 underline-offset-4">18 U.S.C. 2257</Link>
          </div>

          {/* TEXTO LEGAL LARGO (Disclaimer) */}
          <div className="text-[11px] text-gray-500 space-y-3 leading-relaxed px-4 text-center max-w-4xl mx-auto font-medium">
            <p>
              Fansmio opera bajo estrictas políticas de moderación. Todo el contenido es generado por usuarios verificados mediante sistemas biométricos (KYC) y operamos bajo una política de tolerancia cero frente al contenido no consensuado. Todos los modelos han otorgado consentimiento expreso y documentado en estricto cumplimiento con 18 U.S.C. 2257.
            </p>
            <p>
              Los pagos son procesados por pasarelas seguras compatibles con el sector, garantizando la privacidad absoluta y el cumplimiento normativo internacional. El uso de esta plataforma implica la aceptación de todos nuestros términos legales.
            </p>
            <p className="pt-4 font-black tracking-widest text-gray-600">
              © {new Date().getFullYear()} FansMio VIP. TODOS LOS DERECHOS RESERVADOS.
            </p>
          </div>

        </div>
      </footer>

    </main>
  );
}