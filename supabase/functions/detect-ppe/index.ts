// deno-lint-ignore-file no-explicit-any
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "*",
};

interface PPEResult {
  personPresent: boolean;
  items: { casco: boolean; chaleco: boolean; guantes: boolean; gafas: boolean; botas: boolean };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: cors });
  }

  try {
    const { image } = await req.json();
    if (!image) throw new Error("image field required (data URL)");

    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "OPENAI_API_KEY not set" }), {
        status: 401,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const prompt = `Eres un asistente de seguridad industrial. Analiza la imagen y responde SOLO JSON con este formato:
{
  "personPresent": boolean,
  "items": {
    "casco": boolean,
    "chaleco": boolean,
    "guantes": boolean,
    "gafas": boolean,
    "botas": boolean
  }
}
Marca true sólo si el elemento de EPP es claramente visible puesto por la persona.`;

    const body = {
      model: "gpt-4.1-2025-04-14",
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: prompt },
        {
          role: "user",
          content: [
            { type: "input_text", text: "Detecta EPP en esta imagen" },
            { type: "input_image", image_url: image },
          ],
        },
      ],
    } as any;

    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!r.ok) {
      const t = await r.text();
      return new Response(JSON.stringify({ error: t }), { status: 500, headers: { ...cors, "Content-Type": "application/json" } });
    }

    const data = await r.json();
    const content = data.choices?.[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(content) as PPEResult;

    return new Response(JSON.stringify(parsed), { headers: { ...cors, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 400, headers: { ...cors, "Content-Type": "application/json" } });
  }
});
