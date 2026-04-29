import Link from "next/link";
import { ArrowLeft, Scale, ShieldCheck } from "lucide-react";

export default function DMCAPage() {
  return (
    <main className="min-h-screen bg-[#050505] text-gray-300 font-sans p-6 sm:p-12 selection:bg-red-500/30">
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-gray-500 hover:text-white font-bold mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Volver al Inicio
        </Link>
        
        <div className="glass-panel bg-[#0a0a0a] border border-white/10 rounded-[2rem] p-8 sm:p-12 shadow-2xl">
          <div className="flex items-center gap-4 mb-8">
            <Scale className="w-10 h-10 text-purple-500" />
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">Política de Derechos de Autor (DMCA)</h1>
          </div>
          
          <div className="space-y-10 text-sm leading-relaxed font-medium">
            
            {/* 🛡️ SECCIÓN 1: EL ESCUDO LEGAL (PUERTO SEGURO) */}
            <section className="bg-purple-500/5 border border-purple-500/20 p-6 sm:p-8 rounded-2xl shadow-inner">
              <h2 className="text-xl font-black text-white mb-4 flex items-center gap-2">
                <ShieldCheck className="w-6 h-6 text-purple-400" /> 1. Declaración de "Puerto Seguro" (Safe Harbor)
              </h2>
              <p className="text-gray-400 mb-4">
                Fansmio VIP ("la Plataforma") actúa como un proveedor de servicios de Internet que permite a creadores independientes alojar y compartir contenido generado por ellos mismos. No supervisamos, alteramos ni aprobamos proactivamente el material subido por nuestros usuarios antes de su publicación.
              </p>
              <p className="text-gray-400">
                De acuerdo con la Ley de Derechos de Autor de la Era Digital (DMCA) y las normativas internacionales de comercio electrónico, <strong className="text-white">Fansmio VIP no se hace responsable por las infracciones de derechos de autor cometidas por sus usuarios.</strong> Nuestra política es responder de manera rápida y estructurada a cualquier notificación clara de presunta infracción que cumpla con los requisitos legales establecidos a continuación.
              </p>
            </section>

            {/* 📝 SECCIÓN 2: TAKEDOWN NOTICE */}
            <section>
              <h2 className="text-xl font-black text-white mb-4">2. Notificación de Infracción (Takedown Notice)</h2>
              <p className="text-gray-400 mb-4">Si usted es el propietario de los derechos de autor (o un agente autorizado) y cree de buena fe que cualquier contenido alojado en nuestra plataforma infringe sus derechos, debe enviar una notificación por escrito a nuestro Agente Designado que incluya obligatoriamente lo siguiente:</p>
              
              <ul className="list-none space-y-3 text-gray-400">
                <li className="flex gap-2"><span className="text-purple-500 font-bold">•</span> <span><strong>Firma:</strong> Una firma física o electrónica de la persona autorizada para actuar en nombre del propietario del derecho exclusivo.</span></li>
                <li className="flex gap-2"><span className="text-purple-500 font-bold">•</span> <span><strong>Identificación del material:</strong> Una descripción clara de la obra protegida por derechos de autor que se alega ha sido infringida.</span></li>
                <li className="flex gap-2"><span className="text-purple-500 font-bold">•</span> <span><strong>Ubicación infractora:</strong> La URL exacta (enlace) o la ubicación específica dentro de la plataforma del material que solicita que sea eliminado o cuyo acceso/audio deba ser inhabilitado.</span></li>
                <li className="flex gap-2"><span className="text-purple-500 font-bold">•</span> <span><strong>Información de contacto:</strong> Su dirección física, número de teléfono y dirección de correo electrónico.</span></li>
                <li className="flex gap-2"><span className="text-purple-500 font-bold">•</span> <span><strong>Declaración de Buena Fe:</strong> Una declaración de que usted cree de buena fe que el uso del material no está autorizado por el propietario, su agente o la ley.</span></li>
                <li className="flex gap-2"><span className="text-purple-500 font-bold">•</span> <span><strong>Declaración de Exactitud:</strong> Una declaración de que la información en la notificación es exacta, y bajo pena de perjurio, que usted está autorizado para actuar.</span></li>
              </ul>

              <div className="mt-6 bg-red-500/10 p-5 rounded-xl border border-red-500/20">
                <p className="text-red-400 italic">
                  <strong>Aviso:</strong> Una vez recibida una notificación válida, la Plataforma tomará las medidas pertinentes, que pueden incluir ejecutar nuestro "Protocolo de Silencio" (extirpar el audio infractor del video), eliminar el contenido o inhabilitar el acceso al mismo.
                </p>
              </div>
            </section>

            {/* 📬 DATOS DE CONTACTO */}
            <section className="bg-[#111] p-6 rounded-2xl border border-white/5">
              <h2 className="text-lg font-black text-white mb-3">Contacto del Agente Designado DMCA:</h2>
              <p className="text-gray-400 leading-loose">
                Departamento Legal / DMCA Agent<br />
                Fansmio VIP<br />
                Correo electrónico: <a href="mailto:dmca@fansmio.com" className="text-purple-400 font-bold hover:text-purple-300 hover:underline transition-colors">dmca@fansmio.com</a>
              </p>
            </section>

            {/* ⚖️ SECCIÓN 3: CONTRA-NOTIFICACIÓN */}
            <section>
              <h2 className="text-xl font-black text-white mb-3">3. Procedimiento de Contra-Notificación (Counter-Notice)</h2>
              <p className="text-gray-400">
                Si un creador de nuestra plataforma cree que su contenido fue silenciado o eliminado por error o por una identificación incorrecta, tiene derecho a enviar una Contra-Notificación. Esta debe enviarse al mismo correo de contacto e incluir su información personal, el enlace del contenido afectado y una declaración bajo pena de perjurio de que el retiro fue un error, aceptando la jurisdicción legal aplicable.
              </p>
            </section>

            {/* 🚫 SECCIÓN 4: BANEOS */}
            <section>
              <h2 className="text-xl font-black text-white mb-3">4. Política de Infractores Reincidentes</h2>
              <p className="text-gray-400">
                Para proteger la integridad de la comunidad, Fansmio VIP mantiene una política estricta de "Infractor Reincidente". Nos reservamos el derecho, a nuestra entera discreción, de suspender o cancelar permanentemente (banear) las cuentas de los usuarios que sean identificados como infractores reincidentes de las leyes de propiedad intelectual.
              </p>
            </section>

          </div>
        </div>
      </div>
    </main>
  );
}