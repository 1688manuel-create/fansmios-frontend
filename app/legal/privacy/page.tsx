import Link from "next/link";
import { ArrowLeft, Shield } from "lucide-react";

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-[#050505] text-gray-300 font-sans p-6 sm:p-12 selection:bg-red-500/30">
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-gray-500 hover:text-white font-bold mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Volver al Inicio
        </Link>
        
        <div className="glass-panel bg-[#0a0a0a] border border-white/10 rounded-[2rem] p-8 sm:p-12 shadow-2xl">
          <div className="flex items-center gap-4 mb-6">
            <Shield className="w-10 h-10 text-blue-500" />
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">Política de Privacidad</h1>
          </div>
          <p className="text-sm font-bold text-blue-500 mb-10">Última actualización: Marzo 2026</p>

          <div className="space-y-8 text-sm leading-relaxed font-medium">
            <section>
              <h2 className="text-xl font-black text-white mb-3">1. Introducción</h2>
              <p>En Fansmios VIP ("nosotros", "la Plataforma"), valoramos su privacidad. Esta política describe cómo recopilamos, usamos, protegemos y compartimos su información personal cuando utiliza nuestros servicios. Al usar la plataforma, usted acepta las prácticas descritas en este documento.</p>
            </section>

            <section>
              <h2 className="text-xl font-black text-white mb-3">2. Información que Recopilamos</h2>
              <ul className="list-disc pl-6 space-y-2 text-gray-400">
                <li><strong className="text-white">Datos de Cuenta:</strong> Correo electrónico, nombre de usuario y contraseñas encriptadas.</li>
                <li><strong className="text-white">Datos KYC (Solo Creadores):</strong> Para cumplir con normativas legales, recopilamos identificaciones gubernamentales, reconocimiento facial biométrico y datos fiscales a través de proveedores externos certificados. No almacenamos estos documentos directamente en nuestros servidores públicos.</li>
                <li><strong className="text-white">Datos de Pago:</strong> Información de tarjetas o billeteras de criptomonedas procesadas a través de pasarelas de pago seguras de terceros (PCI-DSS compliant).</li>
                <li><strong className="text-white">Datos de Uso:</strong> Direcciones IP, tipo de navegador, interacciones en la plataforma y registros de chat.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-black text-white mb-3">3. Uso de la Información</h2>
              <p>Utilizamos su información para:</p>
              <ul className="list-disc pl-6 space-y-2 text-gray-400 mt-2">
                <li>Proporcionar y mantener la Plataforma.</li>
                <li>Procesar transacciones financieras de forma segura.</li>
                <li>Verificar la identidad de los creadores (prevención de fraude y cumplimiento 18 U.S.C. 2257).</li>
                <li>Detectar y prevenir actividades ilegales o violaciones a nuestros Términos de Servicio.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-black text-white mb-3">4. Compartir Información</h2>
              <p>No vendemos su información personal a terceros. Solo compartiremos información con:</p>
              <ul className="list-disc pl-6 space-y-2 text-gray-400 mt-2">
                <li>Proveedores de servicios (procesadores de pago, sistemas KYC, alojamiento en la nube).</li>
                <li>Autoridades legales y fuerzas del orden (Law Enforcement) cuando se requiera mediante citación, orden judicial u orden de allanamiento válida, o para prevenir un daño inminente.</li>
              </ul>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}