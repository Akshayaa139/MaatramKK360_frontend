"use client";

import { useEffect, useState } from "react";
import api, { BACKEND_URL } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Clock, FileText, ExternalLink, Download } from "lucide-react";

export default function StudyMaterialsPage() {
  const [materials, setMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await api.get("/study-materials");
        // Enrich data with summaries and steps if missing
        const enriched = (Array.isArray(res.data) ? res.data : []).map(m => ({
          ...m,
          details: m.summary || m.description || "Comprehensive guide covering the essentials. Perfect for conceptual understanding.",
          steps: (m.steps && m.steps.length > 0) ? m.steps : [
            "Review core concepts in this guide",
            "Solve the practice problems included",
            "Discuss with peers in the forum",
            "Contact your tutor for deep dives"
          ]
        }));
        setMaterials(enriched);
      } catch (e) {
        console.error("Failed to load materials", e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-maatram-yellow"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Study Materials</h2>
          <p className="text-slate-500 mt-1">
            Access curated learning resources and roadmap to excel in your subjects
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {materials.map((m) => (
          <Card key={m._id} className="flex flex-col overflow-hidden border-2 border-slate-100 hover:border-maatram-yellow transition-all shadow-sm hover:shadow-md">
            <CardHeader className="pb-4 bg-slate-50/50">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <CardTitle className="text-xl text-slate-800">{m.title}</CardTitle>
                  <CardDescription className="font-bold text-maatram-blue uppercase tracking-wider text-xs">
                    {(m.subjects || []).join(", ") || "General Study"}
                  </CardDescription>
                </div>
                <Badge variant={
                  m.type === "pdf" ? "default" :
                    m.type === "video" ? "destructive" :
                      "secondary"
                } className="uppercase font-bold">
                  {m.type}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="flex-grow py-6 space-y-6">
              {/* Preview image/video if present */}
              {m.type === "image" && m.filePath && (
                <div className="rounded-lg overflow-hidden border border-slate-200">
                  <img
                    src={`${BACKEND_URL}/uploads/study-materials/${m.filePath}`}
                    alt={m.title}
                    className="w-full max-h-48 object-cover"
                  />
                </div>
              )}
              {m.type === "video" && m.filePath && (
                <div className="rounded-lg overflow-hidden border border-slate-200 bg-black">
                  <video controls className="w-full max-h-48 mx-auto">
                    <source src={`${BACKEND_URL}/uploads/study-materials/${m.filePath}`} />
                  </video>
                </div>
              )}

              {/* Summary Section */}
              <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                <h4 className="text-sm font-bold mb-2 flex items-center gap-2 text-slate-800">
                  <BookOpen className="h-4 w-4 text-maatram-blue" />
                  Executive Summary
                </h4>
                <p className="text-sm text-slate-600 leading-relaxed italic">
                  {m.details}
                </p>
              </div>

              {/* Roadmap Section */}
              <div className="space-y-3">
                <h4 className="text-sm font-bold flex items-center gap-2 text-slate-800">
                  <Clock className="h-4 w-4 text-maatram-yellow" />
                  Learning Roadmap
                </h4>
                <ul className="grid grid-cols-1 gap-2">
                  {(m.steps || []).map((step: string, idx: number) => (
                    <li key={idx} className="text-[13px] flex gap-3 p-2 rounded-lg bg-slate-50 border border-transparent hover:border-slate-200 transition-colors">
                      <span className="font-bold text-maatram-yellow shrink-0">{idx + 1}.</span>
                      <span className="text-slate-600">{step}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>

            <CardFooter className="pt-4 bg-slate-50/50 border-t border-slate-100 flex gap-3">
              {m.url && (
                <Button variant="outline" className="flex-1 font-bold h-11" asChild>
                  <a href={m.url} target="_blank" rel="noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open Source
                  </a>
                </Button>
              )}
              <Button className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-bold h-11" asChild>
                <a
                  href={m.filePath ? `${BACKEND_URL}/uploads/study-materials/${m.filePath}` : m.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Download className="h-4 w-4 mr-2" />
                  {m.type === "pdf" ? "Get PDF" : "Download"}
                </a>
              </Button>
            </CardFooter>
          </Card>
        ))}
        {materials.length === 0 && !loading && (
          <Card className="col-span-full py-12">
            <CardContent className="flex flex-col items-center justify-center text-center">
              <FileText className="h-12 w-12 text-slate-300 mb-4" />
              <p className="text-lg font-medium text-slate-600">No materials found</p>
              <p className="text-sm text-slate-400">Tutors haven't posted any materials yet.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
