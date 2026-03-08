import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#050505] text-gray-300 font-sans p-6 sm:p-12 selection:bg-red-500/30">
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-gray-500 hover:text-white font-bold mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Volver al Inicio
        </Link>
        
        <div className="glass-panel bg-[#0a0a0a] border border-white/10 rounded-[2rem] p-8 sm:p-12 shadow-2xl">
          <h1 className="text-3xl sm:text-4xl font-black text-white mb-4 tracking-tight">Términos de Servicio</h1>
          <p className="text-sm font-bold text-red-500 mb-10">Última actualización: Marzo 2026</p>

          <div className="space-y-8 text-sm leading-relaxed font-medium">
            <section>
              <h2 className="text-xl font-black text-white mb-3">1. Aceptación de los Términos</h2>
              <p>Al acceder y utilizar Fansmios VIP ("la Plataforma"), usted acepta estar sujeto a estos Términos de Servicio. Si no está de acuerdo con alguna parte de estos términos, tiene prohibido utilizar la Plataforma. Debe tener al menos 18 años de edad (o la mayoría de edad legal en su jurisdicción) para crear una cuenta.</p>
            </section>

            <section>
              <h2 className="text-xl font-black text-white mb-3">2. Creadores y Verificación KYC</h2>
              <p>Todo usuario que desee monetizar contenido ("Creador") debe someterse a un riguroso proceso de verificación de identidad (KYC - Know Your Customer) proporcionando una identificación gubernamental válida y una prueba de vida (reconocimiento facial biométrico). Fansmios mantiene una política de tolerancia cero frente al fraude, la trata de personas y el contenido no consensuado.</p>
            </section>

            <section>
              <h2 className="text-xl font-black text-white mb-3">3. Propiedad del Contenido (UGC)</h2>
              <p>
                <strong className="text-white">Fansmios VIP NO es propietario ni adquiere los derechos de propiedad intelectual del material subido por los Creadores.</strong> La plataforma actúa estricta y únicamente como un proveedor de servicios interactivos (intermediario tecnológico/hosting) para facilitar la distribución del contenido. 
              </p>
              <p className="mt-2">
                El Creador conserva en todo momento el 100% de la titularidad y responsabilidad legal de su obra. Al subir contenido, usted otorga a Fansmios únicamente una licencia técnica mundial, no exclusiva y libre de regalías para alojar, almacenar y mostrar dicho contenido en su nombre a los usuarios que hayan pagado por el acceso.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-black text-white mb-3">4. Relación Laboral e Impuestos</h2>
              <p>
                <strong className="text-white">Los Creadores utilizan Fansmios VIP estrictamente en calidad de Contratistas Independientes.</strong> Bajo ninguna circunstancia se interpretará que existe una relación laboral, de subordinación, asociación, empresa conjunta (joint venture), franquicia o agencia entre el Creador y Fansmios VIP. Los creadores no son empleados de la plataforma.
              </p>
              <p className="mt-2 text-red-400 font-bold">
                Obligaciones Fiscales:
              </p>
              <p>
                Fansmios VIP NO retiene impuestos sobre la renta, cargas sociales, seguros médicos, beneficios ni ninguna otra obligación patronal o fiscal en nombre de los Creadores. <strong className="text-white">Cada Creador es única y exclusivamente responsable de declarar sus ingresos y pagar los impuestos correspondientes en su jurisdicción local, estatal o nacional derivados de las ganancias obtenidas a través de la Plataforma.</strong>
              </p>
            </section>

            <section>
              <h2 className="text-xl font-black text-white mb-3">5. Pagos, Tarifas y Retiros</h2>
              <p>Fansmios facilita transacciones entre Fans y Creadores. La Plataforma retiene un porcentaje estándar como tarifa de uso de tecnología para cubrir costos de alojamiento, procesamiento de pagos y soporte técnico. Los retiros de fondos están sujetos a un período de retención por seguridad y verificación de contracargos. Los pagos se procesan a través de pasarelas de terceros y/o criptomonedas, y están sujetos a sus respectivos términos operativos.</p>
            </section>

            <section>
              <h2 className="text-xl font-black text-white mb-3">6. Cancelación de la Cuenta</h2>
              <p>Fansmios se reserva el derecho de suspender o eliminar permanentemente cualquier cuenta, y retener fondos pendientes, sin previo aviso si determinamos que el usuario ha violado estos Términos de Servicio, nuestras Políticas de Contenido, o si representa un riesgo legal, financiero o de reputación para la plataforma.</p>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}