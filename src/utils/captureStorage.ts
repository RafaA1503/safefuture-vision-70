export type DetectionItems = {
  casco: boolean;
  chaleco: boolean;
  guantes: boolean;
  gafas: boolean;
  botas: boolean;
};

export type Capture = {
  id: string;
  dataUrl: string;
  timestamp: number;
  detections: DetectionItems;
};

const KEY = "ppe_captures_v1";

export function listCaptures(): Capture[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

export function saveCapture(input: Omit<Capture, "id"> & { id?: string }): Capture {
  const all = listCaptures();
  const capture: Capture = { id: input.id || crypto.randomUUID(), ...input };
  localStorage.setItem(KEY, JSON.stringify([capture, ...all]));
  return capture;
}

export function clearCaptures() {
  localStorage.removeItem(KEY);
}
