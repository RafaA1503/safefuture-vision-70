import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { clearCaptures, listCaptures } from "@/utils/captureStorage";

const PASSWORD = "DavidCarla2025";

const Gallery = () => {
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState("");
  const [captures, setCaptures] = useState(() => listCaptures());
  const { toast } = useToast();

  useEffect(() => {
    document.title = "Galería de capturas | NeoSafety";
  }, []);

  const handleLogin = () => {
    if (password === PASSWORD) {
      setAuthed(true);
      setPassword("");
      setCaptures(listCaptures());
    } else {
      toast({ title: "Acceso denegado", description: "Contraseña incorrecta.", variant: "destructive" as any });
    }
  };

  const hasCaptures = useMemo(() => captures.length > 0, [captures]);

  if (!authed) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background px-4">
        <article className="w-full max-w-md glass rounded-lg p-6 animate-scale-in">
          <h1 className="text-2xl font-semibold mb-2">Acceso a la galería</h1>
          <p className="text-sm text-muted-foreground mb-4">Ingresa la contraseña para ver las capturas.</p>
          <div className="flex gap-2">
            <Input
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              aria-label="Contraseña"
            />
            <Button onClick={handleLogin}>Entrar</Button>
          </div>
        </article>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <header className="container py-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Galería de capturas</h1>
          <p className="text-sm text-muted-foreground">Visualiza las fotos tomadas automáticamente con fecha y hora.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => (window.location.href = "/")}>Volver al programa</Button>
          <Button
            variant="secondary"
            onClick={() => {
              clearCaptures();
              setCaptures([]);
              toast({ title: "Galería limpia", description: "Se eliminaron todas las capturas." });
            }}
          >
            Limpiar todo
          </Button>
        </div>
      </header>

      <section className="container pb-12">
        {!hasCaptures ? (
          <div className="h-[50vh] grid place-items-center text-muted-foreground animate-fade-in">
            No hay capturas aún.
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {captures.map((c) => (
              <figure key={c.id} className="rounded-lg overflow-hidden border bg-card animate-enter">
                <img
                  src={c.dataUrl}
                  alt={`Captura EPP ${new Date(c.timestamp).toLocaleString()}`}
                  loading="lazy"
                  className="w-full h-64 object-cover"
                />
                <figcaption className="p-4 text-sm flex items-center justify-between">
                  <span className="text-muted-foreground">
                    {new Date(c.timestamp).toLocaleString()}
                  </span>
                  <span className="text-xs px-2 py-1 rounded bg-secondary text-secondary-foreground">
                    {Object.entries(c.detections)
                      .filter(([, v]) => v)
                      .map(([k]) => k)
                      .join(", ") || "Sin EPP"}
                  </span>
                </figcaption>
              </figure>
            ))}
          </div>
        )}
      </section>
    </main>
  );
};

export default Gallery;
