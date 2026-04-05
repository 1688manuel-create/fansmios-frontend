"use client";

import { useEffect, useRef } from "react";
import api from "@/lib/api"; 

export function useUltraKYCProtection() {
  const eventsRef = useRef<any[]>([]);
  const startTime = useRef(Date.now());
  const lastMove = useRef<number | null>(null);
  
  // 🔥 MEJORA: Caché para no recalcular el canvas cada 5 segundos
  const fingerprintCache = useRef<string | null>(null);

  useEffect(() => {
    // =========================
    // 🧬 FINGERPRINT AVANZADO (Optimizado)
    // =========================
    const generateFingerprint = () => {
      if (fingerprintCache.current) return fingerprintCache.current;

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      
      if (!ctx) return "";
      
      ctx.textBaseline = "top";
      ctx.font = "16px Arial";
      ctx.fillText("secure_fingerprint", 2, 2);
      
      const fingerprint = {
        ua: navigator.userAgent,
        lang: navigator.language,
        platform: navigator.platform,
        cpu: navigator.hardwareConcurrency || 1, // Fallback por si el navegador lo bloquea
        memory: (navigator as any).deviceMemory || 0,
        screen: `${window.screen.width}x${window.screen.height}`,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        canvas: canvas.toDataURL(),
        webdriver: navigator.webdriver,
        plugins: navigator.plugins.length,
        languages: navigator.languages,
      };

      fingerprintCache.current = btoa(JSON.stringify(fingerprint));
      return fingerprintCache.current;
    };

    // =========================
    // 🖱️ TRACKING HUMANO REAL (Con Throttling)
    // =========================
    let lastMouseMoveTime = 0;

    // 🔥 CORRECCIÓN: Usamos un tipo más flexible porque también recibe eventos de teclado y scroll
    const trackEvent = (type: string, e?: MouseEvent | KeyboardEvent | Event | any) => { 
      const now = Date.now();

      // 🔥 MEJORA: Estrangulamos el mousemove a máximo 1 captura cada 100ms
      if (type === "move") {
        if (now - lastMouseMoveTime < 100) return;
        lastMouseMoveTime = now;
      }

      let velocity = 0;
      if (lastMove.current) {
        velocity = now - lastMove.current;
      }
      lastMove.current = now;

      eventsRef.current.push({
        type,
        x: e?.clientX || 0,
        y: e?.clientY || 0,
        time: now,
        velocity,
      });
    };

    const onMove = (e: MouseEvent) => trackEvent("move", e);
    const onClick = (e: MouseEvent) => trackEvent("click", e);
    const onKey = (e: KeyboardEvent) => trackEvent("key", e);
    const onScroll = (e: Event) => trackEvent("scroll", e);

    window.addEventListener("mousemove", onMove);
    window.addEventListener("click", onClick);
    window.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onScroll);

    // =========================
    // 👁️ FOCUS TRACKING
    // =========================
    let focusChanges = 0;
    const onBlur = () => focusChanges++;
    const onFocus = () => focusChanges++;

    window.addEventListener("blur", onBlur);
    window.addEventListener("focus", onFocus);

    // =========================
    // 📡 ENVÍO PERIÓDICO
    // =========================
    const interval = setInterval(async () => {
      // Si no hubo actividad humana, no saturamos al servidor
      if (eventsRef.current.length < 5) return;

      const payload = {
        fingerprint: generateFingerprint(),
        events: eventsRef.current,
        focusChanges,
        sessionTime: Date.now() - startTime.current,
      };

      try {
        await api.post("/security/ultra-kyc", payload);
      } catch (error) {
        // Silencioso para no asustar al usuario si falla la telemetría
      }
      
      eventsRef.current = [];
    }, 5000);

    // =========================
    // 🧹 CLEANUP
    // =========================
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("click", onClick);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("focus", onFocus);
      clearInterval(interval);
    };
  }, []);
}