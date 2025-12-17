"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function StudyMaterialsPage() {
  const [materials, setMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await api.get("/study-materials");
        setMaterials(Array.isArray(res.data) ? res.data : []);
      } catch (e) {
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Study Materials</h2>
        <p className="text-sm text-muted-foreground">
          Browse curated materials from tutors
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {materials.map((m) => (
          <Card key={m._id}>
            <CardHeader>
              <CardTitle>{m.title}</CardTitle>
            </CardHeader>
            <CardContent>
              {m.type === "image" && m.filePath && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={`/uploads/study-materials/${m.filePath}`}
                  alt={m.title}
                  className="w-full max-h-40 object-cover mb-2 rounded"
                />
              )}
              {m.type === "video" && m.filePath && (
                <video controls className="w-full max-h-40 mb-2 rounded">
                  <source src={`/uploads/study-materials/${m.filePath}`} />
                  Your browser does not support the video tag.
                </video>
              )}
              {m.type === "pdf" && m.filePath && (
                <div className="mb-2 text-sm text-muted-foreground">
                  PDF:{" "}
                  <a
                    className="text-blue-600 underline"
                    href={`/uploads/study-materials/${m.filePath}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open PDF
                  </a>
                </div>
              )}
              <div className="text-sm text-muted-foreground mb-2">
                {m.description}
              </div>
              <div className="flex gap-2 mt-2">
                {m.url && (
                  <Button asChild>
                    <a href={m.url} target="_blank" rel="noreferrer">
                      Open Link
                    </a>
                  </Button>
                )}
                {m.filePath && (
                  <Button asChild>
                    <a
                      href={`/uploads/study-materials/${m.filePath}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Download
                    </a>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
        {materials.length === 0 && !loading && (
          <div className="text-sm text-muted-foreground">
            No materials found
          </div>
        )}
      </div>
    </div>
  );
}
