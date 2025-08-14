import React from "react";
import { Bot } from "lucide-react";

const Preloader: React.FC = () => {
  return (
    <div className="min-h-screen grid place-items-center bg-background">
      <div className="flex flex-col items-center gap-6 animate-fade-in">
        <div className="relative w-32 h-32">
          <div className="absolute inset-0 rounded-full neon-ring" />
          <div className="absolute inset-0 rounded-full border-2 border-primary/20" />
          <div className="absolute inset-1 rounded-full border-4 border-transparent border-t-primary animate-[spin_1.2s_linear_infinite]" />
          <div className="absolute inset-0 grid place-items-center z-10">
            <Bot className="text-primary" size={44} aria-label="Robot saludando" />
          </div>
          <span className="absolute -right-1 top-6 z-20 text-xl animate-bounce" aria-hidden="true">👋</span>
        </div>
        <h1 className="text-2xl font-semibold tracking-wider">NeoSafety</h1>
        <p className="text-sm text-muted-foreground">Inicializando sistema de visión...</p>
      </div>
    </div>
  );
};

export default Preloader;
