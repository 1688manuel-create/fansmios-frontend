export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] w-full bg-transparent">
      {/* Círculo de Carga Estilo FansMio */}
      <div className="relative flex items-center justify-center">
        {/* Brillo de fondo */}
        <div className="absolute w-16 h-16 bg-teal-500/20 blur-xl rounded-full animate-pulse"></div>
        
        {/* El Spinner */}
        <div className="w-12 h-12 border-4 border-white/5 border-t-teal-500 rounded-full animate-spin"></div>
      </div>
      
      {/* Texto opcional sutil */}
      <p className="mt-4 text-xs font-bold tracking-widest text-gray-500 uppercase animate-pulse">
        Cargando Experiencia...
      </p>
    </div>
  );
}