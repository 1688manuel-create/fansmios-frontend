"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import AppLayout from '../../../../components/AppLayout';
import api from '../../../../lib/api';
// 🔥 IMPORTAMOS TU ESCUDO ANTIFRAUDE
import { useUltraKYCProtection } from '../../../../hooks/useUltraKYCProtection';
import { useTranslations } from 'next-intl'; // 👈 AGREGAR AQUÍ

// 🔥 ICONOS PREMIUM DE LUCIDE
import { 
  ShieldCheck, 
  ArrowLeft, 
  CheckCircle2, 
  Loader2, 
  AlertTriangle, 
  IdCard, 
  CreditCard, 
  ScanFace, 
  Camera, 
  X, 
  Video, 
  Lock,
  RefreshCw,
  Check,
  UploadCloud,
  Cpu,
  Fingerprint
} from 'lucide-react';

type CameraMode = 'FRONT' | 'BACK' | 'SELFIE' | null;

export default function KYCVerification() {
  // 🛡️ INICIALIZAMOS EL ESCUDO INVISIBLE (Rastreo Humano/Bot)
  useUltraKYCProtection();

  const router = useRouter();
  const t = useTranslations('KYCVerification'); // 👈 AGREGAR ESTA LÍNEA AQUÍ
  const [kycStatus, setKycStatus] = useState<string>('NONE'); 
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Archivos finales (Las 3 pruebas obligatorias)
  const [idFrontImage, setIdFrontImage] = useState<File | null>(null);
  const [idFrontPreview, setIdFrontPreview] = useState<string | null>(null);

  const [idBackImage, setIdBackImage] = useState<File | null>(null);
  const [idBackPreview, setIdBackPreview] = useState<string | null>(null);

  const [selfieVideo, setSelfieVideo] = useState<Blob | null>(null);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);

  // Controladores de Cámara
  const videoRef = useRef<HTMLVideoElement>(null);
  const directorVideoRef = useRef<HTMLVideoElement>(null); 
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [activeCamera, setActiveCamera] = useState<CameraMode>(null);

  // 🎬 Controladores Liveness Check
  const [isRecording, setIsRecording] = useState(false);
  const [recordingStep, setRecordingStep] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const directorIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 🎤 INSTRUCCIONES LIVENESS (Ahora traducidas)
  const livenessPrompts = [
    t('liveness_1'),
    t('liveness_2'),
    t('liveness_3'),
    t('liveness_4'),
    t('liveness_5'),
    t('liveness_6'),
    t('liveness_7'),
    t('liveness_8'),
    t('liveness_9')
  ];

  useEffect(() => {
    fetchKycStatus();
    return () => {
      stopCamera();
      if (directorIntervalRef.current) clearInterval(directorIntervalRef.current);
    };
  }, []);

  const fetchKycStatus = async () => {
    try {
      const res = await api.get('/profile/me');
      setKycStatus(res.data.profile?.kycStatus || 'NONE');
      setRejectionReason(res.data.profile?.kycRejectionReason || '');
    } catch (error) {
      console.error("Error obteniendo estatus KYC", error);
    } finally {
      setIsLoading(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    if (directorVideoRef.current) directorVideoRef.current.srcObject = null;
    
    if (directorIntervalRef.current) clearInterval(directorIntervalRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') mediaRecorderRef.current.stop();
    
    setActiveCamera(null);
    setIsRecording(false);
  };

  const startPhotoCamera = async (mode: CameraMode) => {
    try {
      stopCamera(); 
      const facingMode = mode === 'FRONT' || mode === 'BACK' ? 'environment' : 'user';
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode } });
      
      streamRef.current = stream; 
      setTimeout(() => { if (videoRef.current) videoRef.current.srcObject = stream; }, 100);
      
      setActiveCamera(mode);
      if (mode === 'FRONT') { setIdFrontImage(null); setIdFrontPreview(null); }
      if (mode === 'BACK') { setIdBackImage(null); setIdBackPreview(null); }
    } catch (err) {
      alert(t('alert_camera_error'));
      setActiveCamera(null);
    }
  };

  const takeSnapshot = () => {
    if (videoRef.current && canvasRef.current && activeCamera) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
        
        canvasRef.current.toBlob((blob) => {
          if (blob) {
            const fileName = `kyc_${activeCamera.toLowerCase()}_${Date.now()}.jpg`;
            const file = new File([blob], fileName, { type: "image/jpeg" });
            const previewUrl = URL.createObjectURL(file);

            if (activeCamera === 'FRONT') { setIdFrontImage(file); setIdFrontPreview(previewUrl); } 
            else if (activeCamera === 'BACK') { setIdBackImage(file); setIdBackPreview(previewUrl); }
            stopCamera();
          }
        }, 'image/jpeg', 0.9);
      }
    }
  };

  const startVideoRecording = async () => {
    try {
      stopCamera(); 
      setSelfieVideo(null); setSelfiePreview(null); setRecordingStep(0); chunksRef.current = [];

      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: true });
      streamRef.current = stream;
      
      setIsRecording(true); 
      setActiveCamera('SELFIE');

      setTimeout(() => { if (directorVideoRef.current) directorVideoRef.current.srcObject = stream; }, 100);

      let mimeType = typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported('video/webm') ? 'video/webm' : 'video/mp4';
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mediaRecorder.onstop = () => {
        const recordedMimeType = mediaRecorder.mimeType || mimeType;
        const videoBlob = new Blob(chunksRef.current, { type: recordedMimeType });
        setSelfieVideo(videoBlob); setSelfiePreview(URL.createObjectURL(videoBlob)); 
        stopCamera();
      };

      mediaRecorder.start();

      let step = 0;
      directorIntervalRef.current = setInterval(() => {
        step++;
        if (step < livenessPrompts.length) setRecordingStep(step);
        if (step === livenessPrompts.length - 1) {
          if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') mediaRecorderRef.current.stop();
          if (directorIntervalRef.current) clearInterval(directorIntervalRef.current);
        }
      }, 3500); 

    } catch (error) {
      alert(t('alert_mic_error'));
      stopCamera();
    }
  };

  const handleSubmitKYC = async () => {
    if (!idFrontImage || !idBackImage || !selfieVideo) {
      alert(t('alert_missing_tests'));
      return;
    }

    setIsSubmitting(true);
    const formData = new FormData();
    formData.append('idFront', idFrontImage);
    formData.append('idBack', idBackImage);
    const ext = selfieVideo.type.includes('mp4') ? 'mp4' : 'webm';
    formData.append('idSelfie', selfieVideo, `liveness.${ext}`); 

    try {
      await api.post('/profile/kyc/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert(t('alert_kyc_submitted'));
      setKycStatus('PENDING');
    } catch (error: any) {
      alert(error.response?.data?.error || t('alert_error_submit'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <AppLayout><div className="min-h-screen bg-nm-base flex items-center justify-center"><Loader2 className="w-12 h-12 text-blue-500 animate-spin"/></div></AppLayout>;

 const renderPhotoBox = (title: string, Icon: any, description: string, preview: string | null, mode: CameraMode, activeColorClass: string, hasFile: boolean) => (
    <div className={`p-6 rounded-[2rem] flex flex-col justify-between overflow-hidden transition-all ${hasFile ? 'nm-inset border border-green-500/20' : 'nm-btn border border-white/5'}`}>
      <div className="mb-6 text-center">
        <div className={`w-14 h-14 mx-auto rounded-2xl nm-inset flex items-center justify-center mb-4 border ${hasFile ? 'border-green-500/30 text-green-400' : 'border-white/5 text-gray-400'}`}>
          <Icon className="w-7 h-7" strokeWidth={1.5} />
        </div>
        <h3 className="font-black text-white mb-1 tracking-wide">{title}</h3>
        <p className="text-[10px] text-gray-500 font-medium leading-relaxed px-2">{description}</p>
      </div>

      {activeCamera === mode ? (
        <div className={`relative w-full rounded-2xl overflow-hidden border border-blue-500/50 shadow-[0_0_20px_rgba(59,130,246,0.3)] bg-black h-40 md:h-48 nm-inset`}>
          <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
          <button onClick={takeSnapshot} className="absolute bottom-3 left-1/2 transform -translate-x-1/2 nm-btn-primary px-6 py-2.5 rounded-full z-10 flex items-center gap-2 text-sm font-bold shadow-2xl">
            <Camera className="w-4 h-4"/> {t('btn_scan')}
          </button>
          <button onClick={stopCamera} className="absolute top-3 right-3 nm-btn bg-black/60 hover:text-red-500 text-white p-2 rounded-full z-10 backdrop-blur-md">
            <X className="w-4 h-4"/>
          </button>
        </div>
      ) : preview ? (
        <div className="relative w-full rounded-2xl overflow-hidden border border-green-500/30 h-40 md:h-48 group nm-inset shadow-inner">
          <img src={preview} alt={title} className="w-full h-full object-cover opacity-90" />
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
            <button onClick={() => startPhotoCamera(mode)} className="nm-btn border border-white/20 text-white text-xs font-bold px-5 py-2.5 rounded-full flex items-center gap-2 hover:text-red-400">
              <RefreshCw className="w-4 h-4"/> {t('btn_rescan')}
            </button>
          </div>
          <div className="absolute top-3 left-3 nm-inset bg-green-500/10 border border-green-500/50 text-green-400 text-[9px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest flex items-center gap-1 shadow-lg">
            <Check className="w-3 h-3"/> {t('lbl_captured')}
          </div>
        </div>
      ) : (
        <button onClick={() => startPhotoCamera(mode)} disabled={activeCamera !== null || isRecording} className={`w-full nm-btn text-gray-300 ${activeColorClass} font-bold py-3.5 px-4 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-30 border border-transparent`}>
          <Camera className="w-4 h-4"/> {t('btn_activate_scanner')}
        </button>
      )}
    </div>
  );

  return (
    <AppLayout>
      <div className="min-h-screen bg-nm-base pb-24 sm:pb-10 relative">
        
        {/* NAV SUPERIOR */}
        <nav className="sticky top-0 z-50 bg-[#0a0a0a]/90 border-b border-white/5 px-6 py-4 flex justify-between items-center backdrop-blur-xl shadow-md">
          <h1 className="text-xl font-black text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-blue-500" strokeWidth={2.5}/> {t('nav_title')}
          </h1>
          <div className="flex items-center gap-4">
            {/* 🔥 BADGE DE SEGURIDAD ACTIVA */}
            <div className="hidden sm:flex items-center gap-2 bg-green-500/10 border border-green-500/30 px-3 py-1 rounded-full text-[10px] font-bold text-green-400 uppercase tracking-widest animate-pulse">
              <Fingerprint className="w-3 h-3" /> {t('badge_telemetry')}
            </div>
            <button onClick={() => router.push('/dashboard')} className="text-sm nm-btn text-gray-300 px-5 py-2.5 rounded-full hover:text-white transition-colors font-bold flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" /> <span className="hidden sm:inline">{t('btn_back')}</span>
            </button>
          </div>
        </nav>

        <main className="max-w-5xl mx-auto p-4 md:p-6 mt-4 relative z-10">
          
          <div className="mb-8 pl-2 text-center max-w-2xl mx-auto space-y-4 animate-fade-in">
            <p className="text-gray-400 text-sm font-medium leading-relaxed">
              {t('desc_system')}
            </p>
          </div>

          {kycStatus === 'APPROVED' && (
            <div className="nm-inset p-10 rounded-[2rem] border border-green-500/30 text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-t from-green-900/10 to-transparent pointer-events-none"></div>
              <CheckCircle2 className="w-20 h-20 text-green-500 mx-auto mb-4 drop-shadow-[0_0_15px_rgba(34,197,94,0.5)]" strokeWidth={1.5} />
              <h2 className="text-3xl font-black text-white tracking-tight">{t('status_approved_title')}</h2>
              <p className="text-gray-400 mt-2 font-medium">{t('status_approved_desc')}</p>
            </div>
          )}

          {(kycStatus === 'PENDING' || kycStatus === 'REVIEW') && (
            <div className="nm-inset p-10 rounded-[2rem] border border-blue-500/30 text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-t from-blue-900/10 to-transparent pointer-events-none"></div>
              <Cpu className="w-20 h-20 text-blue-500 mx-auto mb-4 animate-pulse drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]" strokeWidth={1.5} />
              <h2 className="text-3xl font-black text-white tracking-tight">{t('status_pending_title')}</h2>
              <p className="text-gray-400 mt-2 font-medium">{t('status_pending_desc')}</p>
            </div>
          )}

          {(kycStatus === 'NONE' || kycStatus === 'REJECTED') && (
            <div className="space-y-8 animate-fade-in">
              
              {kycStatus === 'REJECTED' && (
                <div className="nm-inset border-l-4 border-l-red-500 p-6 rounded-2xl flex flex-col sm:flex-row gap-4 items-start sm:items-center bg-[#110505]">
                  <AlertTriangle className="w-8 h-8 text-red-500 shrink-0" />
                  <div>
                    <p className="font-black text-white text-lg tracking-wide">{t('alert_risk_motor')}</p>
                    <p className="text-sm mt-1 text-red-400 font-medium">{t('lbl_reason')}: {rejectionReason || t('default_rejection_reason')}</p>
                  </div>
                </div>
              )}

              <div className="grid md:grid-cols-3 gap-6">
                {renderPhotoBox(t('box_front_title'), IdCard, t('box_front_desc'), idFrontPreview, 'FRONT', "hover:text-blue-400 hover:border-blue-500/30", idFrontImage !== null)}
                {renderPhotoBox(t('box_back_title'), CreditCard, t('box_back_desc'), idBackPreview, 'BACK', "hover:text-indigo-400 hover:border-indigo-500/30", idBackImage !== null)}

                {/* 🔥 CAJA VIDEO PRUEBA DE VIDA */}
                <div className={`p-6 rounded-[2rem] flex flex-col justify-between overflow-hidden transition-all ${selfieVideo ? 'nm-inset border border-green-500/20' : 'nm-btn border border-white/5'}`}>
                  <div className="mb-6 text-center">
                    <div className={`w-14 h-14 mx-auto rounded-2xl nm-inset flex items-center justify-center mb-4 border ${selfieVideo ? 'border-green-500/30 text-green-400' : 'border-white/5 text-gray-400'}`}>
                      {selfieVideo ? <CheckCircle2 className="w-7 h-7" /> : <ScanFace className="w-7 h-7" />}
                    </div>
                    <h3 className="font-black text-white mb-1 tracking-wide">{t('box_liveness_title')}</h3>
                    <p className="text-[10px] text-gray-500 font-medium leading-relaxed px-2">
                      {selfieVideo ? t('liveness_captured') : t('box_liveness_desc')}
                    </p>
                  </div>

                  {selfiePreview ? (
                    <div className="relative w-full rounded-2xl overflow-hidden border border-green-500/30 h-40 md:h-48 group nm-inset shadow-inner">
                      <video src={selfiePreview} controls playsInline className="w-full h-full object-cover" />
                      <button onClick={startVideoRecording} className="absolute top-3 right-3 bg-black/60 hover:bg-red-500 p-2 rounded-full text-white backdrop-blur-md transition-colors" title={t('btn_repeat_analysis')}>
                        <RefreshCw className="w-4 h-4"/>
                      </button>
                    </div>
                  ) : (
                    <button onClick={startVideoRecording} disabled={activeCamera !== null || isRecording} className={`w-full nm-btn text-gray-300 hover:text-purple-400 hover:border-purple-500/30 font-bold py-3.5 px-4 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-30 border border-transparent`}>
                      <Video className="w-4 h-4"/> {t('btn_start_analysis')}
                    </button>
                  )}
                </div>
              </div>

              <canvas ref={canvasRef} className="hidden" />

              <div className="pt-4 border-t border-white/5">
                <button 
                  onClick={handleSubmitKYC}
                  disabled={!idFrontImage || !idBackImage || !selfieVideo || isSubmitting || activeCamera !== null || isRecording}
                  className="w-full nm-btn-primary py-5 rounded-2xl text-lg disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed flex items-center justify-center gap-3 transition-all font-black relative overflow-hidden group"
                >
                  {isSubmitting ? (
                    <><Cpu className="w-6 h-6 animate-pulse"/> {t('btn_processing_kyc')}</>
                  ) : (
                    <><ShieldCheck className="w-6 h-6"/> {t('btn_submit_kyc')}</>
                  )}
                  {/* Sweep effect para hacerlo ver "tecnológico" */}
                  <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:animate-[shimmer_1.5s_infinite]"></div>
                </button>
                <p className="text-center text-[10px] text-gray-500 mt-4 flex items-center justify-center gap-1.5 font-bold uppercase tracking-widest">
                  <Lock className="w-3 h-3"/> {t('footer_sec')}
                </p>
              </div>

            </div>
          )}
        </main>

        {/* 🎥 MODAL FLOTANTE DEL DIRECTOR VIRTUAL (🔥 FIX z-) */}
        {isRecording && (
          <div className="fixed inset-0 z-[999]flex items-center justify-center bg-black/95 backdrop-blur-xl p-4 animate-fade-in">
            <div className="bg-[#0a0a0a] border border-red-500/50 p-4 rounded-[2rem] w-full max-w-sm flex flex-col items-center shadow-[0_0_50px_rgba(239,68,68,0.15)] relative">
              
              <button onClick={stopCamera} className="absolute -top-4 -right-4 bg-red-500 text-white p-2 rounded-full shadow-xl hover:bg-red-600 transition-colors z-50">
                <X className="w-5 h-5"/>
              </button>

              <h3 className="text-white font-black text-xl mb-4 flex items-center gap-2">
                <ScanFace className="w-5 h-5 text-blue-500" /> {t('modal_scan_title')}
              </h3>
              
              <div className="w-full aspect-[3/4] bg-black rounded-2xl overflow-hidden relative border-2 border-white/10">
                <video ref={directorVideoRef} autoPlay muted playsInline className="w-full h-full object-cover transform -scale-x-100" />
                
                <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex flex-col items-center justify-end h-1/2">
                  <div className="bg-black/60 backdrop-blur-md border border-white/20 p-4 rounded-2xl text-center shadow-2xl animate-pulse min-h-[80px] flex items-center justify-center w-full">
                    <p className="text-white font-black text-lg leading-tight">{livenessPrompts[recordingStep]}</p>
                  </div>
                </div>
                
                <div className="absolute top-4 right-4 bg-red-600 px-3 py-1 rounded-full text-white text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 animate-pulse shadow-lg">
                  <div className="w-2 h-2 bg-white rounded-full"></div> REC
                </div>
                
                {/* Cuadrícula de escaneo tipo sci-fi */}
                <div className="absolute inset-0 border border-blue-500/20 pointer-events-none opacity-50 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay"></div>
              </div>

              <p className="text-gray-500 text-xs mt-6 font-bold uppercase tracking-widest text-center">
                {t('modal_scan_desc_1')}<br/>{t('modal_scan_desc_2')}
              </p>
            </div>
          </div>
        )}

      </div>
    </AppLayout>
  );
}
