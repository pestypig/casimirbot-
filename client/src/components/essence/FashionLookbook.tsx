import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Piece = "cape" | "shirt" | "pants";

type Look = {
  essence_id: string;
  uri: string;
  piece: Piece;
  template_id: string;
};

const PIECES: Piece[] = ["cape", "shirt", "pants"];

export default function FashionLookbook() {
  const [piece, setPiece] = useState<Piece>("cape");
  const [templateId, setTemplateId] = useState<string>("");
  const [imageUrl, setImageUrl] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [styleHint, setStyleHint] = useState<string>("space-baroque; gold filigree");
  const [tags, setTags] = useState<string>("space-baroque,goldwork,noir");
  const [looks, setLooks] = useState<Look[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const endpoints = useMemo(
    () => ({
      looks: `/api/fashion/pieces/${piece}/looks`,
    }),
    [piece],
  );

  const handleSubmit = async (evt: React.FormEvent) => {
    evt.preventDefault();
    setError(null);
    setStatus(null);
    setLooks([]);
    setLoading(true);
    try {
      let response: Response;
      if (file) {
        const form = new FormData();
        form.append("image", file);
        if (imageUrl) form.append("image_url", imageUrl);
        if (styleHint) form.append("style_hint", styleHint);
        if (templateId) form.append("template_id", templateId);
        if (tags) form.append("tags", tags);
        response = await fetch(endpoints.looks, { method: "POST", body: form });
      } else {
        response = await fetch(endpoints.looks, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            image_url: imageUrl,
            style_hint: styleHint,
            template_id: templateId || undefined,
            tags,
          }),
        });
      }
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error ?? "look_generation_failed");
      }
      setLooks(payload.looks ?? []);
      setTemplateId((prev) => prev || payload.template_id || templateId);
      setStatus(`Generated ${payload.looks?.length ?? 0} looks for ${payload.piece ?? piece}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate looks");
    } finally {
      setLoading(false);
    }
  };

  const copyEssenceId = async (id: string) => {
    try {
      await navigator.clipboard.writeText(id);
      setStatus(`Copied essence_id ${id}`);
    } catch {
      setError("Could not copy essence_id");
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6 p-4 text-sm text-slate-200">
      <Card className="bg-slate-900/70 border-slate-800">
        <CardHeader>
          <CardTitle>Fashion Lookbook</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
            <div className="space-y-3">
              <Label htmlFor="piece">Piece</Label>
              <div className="flex gap-2">
                {PIECES.map((p) => (
                  <Button
                    key={p}
                    type="button"
                    variant={p === piece ? "default" : "outline"}
                    onClick={() => setPiece(p)}
                    className="flex-1 capitalize"
                  >
                    {p}
                  </Button>
                ))}
              </div>
              <Label htmlFor="template">Template ID (optional)</Label>
              <Input
                id="template"
                placeholder="cape.short_shoulder.v1"
                value={templateId}
                onChange={(e) => setTemplateId(e.target.value)}
              />
              <Label htmlFor="image_url">Image URL or local path</Label>
              <Input
                id="image_url"
                placeholder="/mnt/data/board.jpg"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
              />
              <Label htmlFor="upload">Or upload</Label>
              <Input
                id="upload"
                type="file"
                accept="image/*"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
              <Label htmlFor="tags">Tags (comma separated)</Label>
              <Input id="tags" value={tags} onChange={(e) => setTags(e.target.value)} />
            </div>
            <div className="space-y-3">
              <Label htmlFor="style">Style hint</Label>
              <Textarea
                id="style"
                rows={6}
                value={styleHint}
                onChange={(e) => setStyleHint(e.target.value)}
                placeholder="space-baroque floral + gold filigree"
              />
              <div className="flex items-center gap-3 pt-2">
                <Button type="submit" disabled={loading} className="w-40">
                  {loading ? "Generating..." : "Generate 4 looks"}
                </Button>
                <div className="text-xs text-slate-400">
                  Endpoint: <code className="text-slate-200">{endpoints.looks}</code>
                </div>
              </div>
              {error ? <p className="text-red-400 text-xs">{error}</p> : null}
              {status ? <p className="text-emerald-300 text-xs">{status}</p> : null}
            </div>
          </form>
        </CardContent>
      </Card>

      {looks.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {looks.map((look) => (
            <Card key={look.essence_id} className="bg-slate-900/60 border-slate-800">
              <CardHeader>
                <CardTitle className="text-sm">Look {look.template_id}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <img
                  src={look.uri}
                  alt={`Look ${look.piece}`}
                  className="w-full rounded border border-slate-800 bg-slate-950 object-contain"
                />
                <div className="flex items-center justify-between text-xs text-slate-300">
                  <span className="break-all">essence_id: {look.essence_id}</span>
                  <Button size="sm" variant="outline" onClick={() => copyEssenceId(look.essence_id)}>
                    Copy
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}
    </div>
  );
}
