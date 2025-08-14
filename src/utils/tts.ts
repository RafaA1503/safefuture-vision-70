export type PPEItems = {
  casco: boolean;
  chaleco: boolean;
  guantes: boolean;
  gafas: boolean;
  botas: boolean;
};

const TTS_TOGGLE = "tts_on";

export function getTtsEnabled(): boolean {
  const raw = localStorage.getItem(TTS_TOGGLE);
  return raw === null ? true : raw === "true";
}

export function setTtsEnabled(on: boolean) {
  localStorage.setItem(TTS_TOGGLE, String(on));
}


export function composeStatusText(items: PPEItems, person: boolean): string | null {
  if (!person) return null; // no anunciar si no hay persona
  const faltantes = Object.entries(items)
    .filter(([, v]) => !v)
    .map(([k]) => k);
  if (faltantes.length === 0) return "Está usando EPP completo.";
  const lista = faltantes.join(", ");
  return `EPP incompleto. Le falta: ${lista}.`;
}

export async function speak(text: string) {
  if (!getTtsEnabled()) return;
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "es-ES";
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utter);
  }
}
