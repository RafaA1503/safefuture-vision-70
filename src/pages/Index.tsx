import { useEffect, useMemo, useRef, useState } from "react";
import Preloader from "@/components/Preloader";
import { ThemeToggle } from "@/components/ThemeToggle";

import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
import { DetectionItems, saveCapture } from "@/utils/captureStorage";
import { Shield, Camera } from "lucide-react";
import { composeStatusText, getTtsEnabled, setTtsEnabled, speak } from "@/utils/tts";

// UI helpers
const ItemRow = ({ label, on }: { label: string; on: boolean }) => (
  <div className="flex items-center justify-between py-3 group">
    <span className="text-sm font-medium text-foreground/90">{label}</span>
    <div className={`status-indicator ${on ? "status-detected" : "status-missing"}`}>
      <div className={`w-2 h-2 rounded-full ${on ? "bg-success animate-pulse" : "bg-muted-foreground/40"}`} />
      <span>{on ? "Detectado" : "No detectado"}</span>
    </div>
  </div>
);

const Index = () => {
  const [ready, setReady] = useState(false);
  const [streamError, setStreamError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [items, setItems] = useState<DetectionItems>({ casco: false, chaleco: false, guantes: false, gafas: false, botas: false });
  const [person, setPerson] = useState(false);
  const lastShot = useRef<number>(0);
  const lastSpokenRef = useRef<string | null>(null);
  const [audioOn, setAudioOn] = useState(getTtsEnabled());
  const [cameraEnabled, setCameraEnabled] = useState(true);
  

  useEffect(() => {
    document.title = "Detección de EPP en tiempo real | Sistema EPP UCV";
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', 'Detección de EPP con IA y cámara en vivo. Diseño futurista.');
  }, []);

  // Preloader 5s exactos
  useEffect(() => {
    const t = setTimeout(() => setReady(true), 5000);
    return () => clearTimeout(t);
  }, []);

  // Iniciar cámara al entrar
  useEffect(() => {
    if (!ready || !cameraEnabled) return;
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
      } catch (e) {
        const msg = (e as Error).message || "Error al acceder a la cámara";
        setStreamError(msg);
        toast({ title: "Permiso de cámara", description: msg, variant: "destructive" as any });
      }
    })();
  }, [ready, cameraEnabled]);

  // Detener cámara cuando se deshabilita
  useEffect(() => {
    if (!cameraEnabled && videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  }, [cameraEnabled]);

  // Loop de detección: cada 3s captura un frame y consulta la función Edge
  useEffect(() => {
    if (!ready || !cameraEnabled) return;
    const iv = setInterval(async () => {
      const video = videoRef.current;
      if (!video) return;
      const w = video.videoWidth || 640;
      const h = video.videoHeight || 360;
      const canvas = canvasRef.current || document.createElement("canvas");
      canvasRef.current = canvas;
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(video, 0, 0, w, h);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.8);

      try {
        const res = await fetch(`${SUPABASE_URL}/functions/v1/detect-ppe`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: dataUrl }),
        });
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        const { personPresent, items: detected } = data as { personPresent: boolean; items: DetectionItems };
        setPerson(!!personPresent);
        if (detected) setItems(detected);
        const now = Date.now();
        if (personPresent && now - lastShot.current > 10000) {
          saveCapture({ dataUrl, timestamp: now, detections: detected });
          lastShot.current = now;
          toast({ title: "Captura guardada", description: new Date(now).toLocaleString() });
        }
        const summary = composeStatusText(detected ?? items, !!personPresent);
        if (summary && summary !== lastSpokenRef.current) {
          speak(summary);
          lastSpokenRef.current = summary;
        }
      } catch (err: any) {
        // Silencioso, pero primera vez advertimos si falta key
        if (String(err?.message || err).includes("Unauthorized") || String(err?.message || err).includes("OPENAI")) {
          toast({ title: "Falta configurar OpenAI", description: "Configura OPENAI_API_KEY en las funciones de Supabase.", variant: "destructive" as any });
        }
      }
    }, 3000);

    return () => clearInterval(iv);
  }, [ready, cameraEnabled]);

  if (!ready) return <Preloader />;

  return (
    <main className="min-h-screen bg-background">
      {/* Hero Header */}
      <header className="relative">
        <div className="container py-8">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-brand-light bg-clip-text text-transparent">
                Sistema EPP UCV
              </h1>
              <p className="text-muted-foreground">Detección de EPP en tiempo real con Inteligencia Artificial</p>
            </div>
            <nav className="flex items-center gap-6">
              <a href="/galeria" className="story-link text-sm font-medium hover:text-primary transition-colors">
                Galería
              </a>
              <a href="/chat" className="story-link text-sm font-medium hover:text-primary transition-colors">
                Chat IA
              </a>
              <ThemeToggle />
            </nav>
          </div>
        </div>
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      </header>

      {/* Main Content */}
      <section className="container py-8">
        <div className="grid lg:grid-cols-[1fr_380px] gap-8 items-start">
          {/* Video Feed */}
          <div className="space-y-4">
            <div className="glass-strong rounded-2xl overflow-hidden p-1 hover-glow transition-all duration-300">
              <div className="relative rounded-xl overflow-hidden bg-background/5">
                <video 
                  ref={videoRef} 
                  className="w-full aspect-video object-cover rounded-xl" 
                  playsInline 
                  muted 
                />
                
                {/* Overlay Effects */}
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute inset-0 bg-gradient-to-t from-background/20 via-transparent to-transparent" />
                  {cameraEnabled && (
                    <div className="absolute inset-0 neon-border rounded-xl pulse-glow" />
                  )}
                </div>
                
                {/* Status Indicator */}
                <div className="absolute top-4 left-4">
                  <div className={`flex items-center gap-3 px-4 py-2 rounded-full glass-strong backdrop-blur-xl transition-all duration-300 ${
                    person ? 'border-success/30 shadow-[0_0_20px_hsl(var(--success)/0.3)]' : 'border-border/50'
                  }`}>
                    <div className="relative">
                      <Camera className="w-4 h-4 text-primary" />
                      <div className={`absolute -top-1 -right-1 w-2 h-2 rounded-full ${
                        cameraEnabled ? 'bg-success animate-pulse' : 'bg-muted-foreground/50'
                      }`} />
                    </div>
                    <span className="text-sm font-medium">
                      {!cameraEnabled ? 'Cámara deshabilitada' : person ? 'Persona detectada' : 'Esperando persona...'}
                    </span>
                  </div>
                </div>

                {/* Camera Disabled Overlay */}
                {!cameraEnabled && (
                  <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center rounded-xl">
                    <div className="text-center space-y-3">
                      <Camera className="w-16 h-16 mx-auto text-muted-foreground/50" />
                      <p className="text-lg font-medium text-muted-foreground">Cámara deshabilitada</p>
                      <p className="text-sm text-muted-foreground/70">Active la cámara desde el panel de controles</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Detection Summary */}
            <div className="glass rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" />
                  <span className="font-medium">Estado de Seguridad</span>
                </div>
                <div className="flex items-center gap-2">
                  {Object.values(items).filter(Boolean).length > 0 ? (
                    <div className="flex items-center gap-2 text-success">
                      <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
                      <span className="text-sm font-medium">
                        {Object.values(items).filter(Boolean).length} de 5 EPP detectados
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-warning">
                      <div className="w-2 h-2 bg-warning rounded-full" />
                      <span className="text-sm font-medium">Sin EPP detectado</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Control Panel */}
          <aside className="space-y-6">
            {/* EPP Detection Panel */}
            <div className="glass-strong rounded-2xl p-6 space-y-4 animate-slide-in-right">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">Equipos Detectados</h2>
                  <p className="text-sm text-muted-foreground">Estado actual de EPP</p>
                </div>
              </div>
              
              <div className="space-y-1">
                <ItemRow label="Casco de Seguridad" on={items.casco} />
                <ItemRow label="Chaleco Reflectivo" on={items.chaleco} />
                <ItemRow label="Guantes de Protección" on={items.guantes} />
                <ItemRow label="Gafas de Seguridad" on={items.gafas} />
                <ItemRow label="Botas de Seguridad" on={items.botas} />
              </div>
              
              <div className="pt-4 border-t border-border/50">
                <p className="text-xs text-muted-foreground">
                  🤖 Detección automática cada 3 segundos con IA
                </p>
              </div>
            </div>

            {/* Controls Panel */}
            <div className="glass rounded-xl p-6 space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full" />
                Controles del Sistema
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-card/50 border border-border/50">
                  <div className="space-y-1">
                    <span className="text-sm font-medium">Cámara</span>
                    <p className="text-xs text-muted-foreground">Habilitar detección en vivo</p>
                  </div>
                  <Switch 
                    checked={cameraEnabled} 
                    onCheckedChange={setCameraEnabled}
                    className="data-[state=checked]:bg-primary"
                  />
                </div>
                
                <div className="flex items-center justify-between p-3 rounded-lg bg-card/50 border border-border/50">
                  <div className="space-y-1">
                    <span className="text-sm font-medium">Anuncios de voz</span>
                    <p className="text-xs text-muted-foreground">Narración automática del estado</p>
                  </div>
                  <Switch 
                    checked={audioOn} 
                    onCheckedChange={(v) => { setAudioOn(v); setTtsEnabled(v); }}
                    className="data-[state=checked]:bg-primary"
                  />
                </div>
              </div>
              
              <div className="pt-4 border-t border-border/50">
                <p className="text-xs text-muted-foreground">
                  💬 Utiliza la voz del sistema del navegador
                </p>
              </div>
            </div>
          </aside>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-card/30">
        <div className="container py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Shield className="w-4 h-4 text-primary" />
              </div>
              <span className="text-sm font-medium">Sistema EPP UCV</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Desarrollado por Carla y David
            </p>
          </div>
        </div>
      </footer>

      {/* Canvas oculto para capturas */}
      <canvas ref={canvasRef} className="hidden" />
    </main>
  );
};

export default Index;
