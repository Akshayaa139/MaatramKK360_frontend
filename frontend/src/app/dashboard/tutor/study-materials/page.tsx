"use client";

import { useEffect, useState, FormEvent, ChangeEvent } from "react";
import type { AxiosProgressEvent } from "axios";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import Link from "next/link";

export default function TutorStudyMaterialUpload() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [subjects, setSubjects] = useState("");
  const [url, setUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  type StudyMaterial = {
    _id: string;
    title: string;
    description?: string;
    subjects?: string[];
    url?: string;
    filePath?: string;
    type?: "video" | "link" | "pdf" | "image" | "other";
  };

  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [deletingIds, setDeletingIds] = useState<string[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editSubjects, setEditSubjects] = useState("");
  const [editUrl, setEditUrl] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get<StudyMaterial[]>("/tutor/study-materials/my");
        setMaterials(Array.isArray(res.data) ? res.data : []);
      } catch {
        // ignore
      }
    };
    load();
  }, []);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!title) return toast({ title: "Title required" });
    setLoading(true);
    try {
      if (file) {
        // client-side validation: file size & type
        const maxSize = 50 * 1024 * 1024; // 50MB
        if (file.size > maxSize) throw new Error("File too large (max 50MB)");
        const allowed =
          file.type.startsWith("video/") ||
          file.type.startsWith("image/") ||
          file.type === "application/pdf";
        if (!allowed)
          throw new Error(
            "Unsupported file type. Allowed: video/*, image/*, application/pdf"
          );
        const fd = new FormData();
        fd.append("file", file);
        fd.append("title", title);
        fd.append("description", description);
        fd.append("subjects", subjects);
        setUploadProgress(0);
        await api.post("/tutor/study-materials/upload", fd, {
          headers: { "Content-Type": "multipart/form-data" },
          onUploadProgress: (evt?: AxiosProgressEvent) => {
            if (
              evt &&
              typeof evt.total === "number" &&
              typeof evt.loaded === "number"
            ) {
              setUploadProgress(Math.round((evt.loaded / evt.total) * 100));
            }
          },
        });
        setUploadProgress(null);
      } else {
        await api.post("/tutor/study-materials", {
          title,
          description,
          url,
          subjects: subjects ? subjects.split(",").map((s) => s.trim()) : [],
        });
      }
      toast({ title: "Saved", description: "Study material uploaded" });
      // if server returned material, prepend to list
      try {
        const res = await api.get<StudyMaterial[]>("/tutor/study-materials/my");
        const mat = Array.isArray(res.data) ? res.data[0] : null;
        if (mat) setMaterials((s) => [mat, ...s]);
      } catch {
        // fallback: ignore
      }
      setTitle("");
      setDescription("");
      setSubjects("");
      setUrl("");
      setFile(null);
      setUploadProgress(null);
    } catch (error) {
      const extractMessage = (e: unknown): string | undefined => {
        if (e instanceof Error) return e.message;
        if (typeof e === "object" && e !== null) {
          const o = e as Record<string, unknown>;
          if (
            "response" in o &&
            typeof o.response === "object" &&
            o.response !== null
          ) {
            const r = o.response as Record<string, unknown>;
            if ("data" in r && typeof r.data === "object" && r.data !== null) {
              const d = r.data as Record<string, unknown>;
              if ("message" in d && typeof d.message === "string")
                return d.message;
            }
          }
          if ("message" in o && typeof o.message === "string") return o.message;
        }
        return undefined;
      };
      const msg = extractMessage(error) ?? "Failed to upload";
      toast({ title: "Error", description: msg });
    } finally {
      setLoading(false);
    }
  };

  const onDelete = async (id: string) => {
    if (!confirm("Delete this material?")) return;
    try {
      setDeletingIds((s) => [...s, id]);
      await api.delete(`/tutor/study-materials/${id}`);
      setMaterials((s) => s.filter((m) => m._id !== id));
      toast({ title: "Deleted" });
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Delete failed";
      toast({ title: "Error", description: msg });
    } finally {
      setDeletingIds((s) => s.filter((x) => x !== id));
    }
  };

  const onStartEdit = (m: StudyMaterial) => {
    setEditingId(m._id);
    setEditTitle(m.title || "");
    setEditDescription(m.description || "");
    setEditSubjects((m.subjects || []).join(","));
    setEditUrl(m.url || "");
  };

  const onCancelEdit = () => {
    setEditingId(null);
  };

  const onSaveEdit = async (id: string) => {
    try {
      const payload = {
        title: editTitle,
        description: editDescription,
        subjects: editSubjects
          ? editSubjects.split(",").map((s) => s.trim())
          : [],
        url: editUrl,
      } as const;
      const res = await api.put(`/tutor/study-materials/${id}`, payload);
      const updated = res.data?.material;
      if (updated) {
        setMaterials((s) => s.map((m) => (m._id === id ? updated : m)));
        toast({ title: "Updated" });
      }
      setEditingId(null);
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Update failed";
      toast({ title: "Error", description: msg });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Upload Study Material</h2>
        <p className="text-sm text-muted-foreground">
          Add links or upload files for students — students can browse materials{" "}
          <Link
            href="/dashboard/study-materials"
            className="text-blue-600 underline"
          >
            here
          </Link>
          .
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>New Material</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <Label>Title</Label>
              <Input
                value={title}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setTitle(e.target.value)
                }
              />
            </div>
            <div>
              <Label>Description</Label>
              <Input
                value={description}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setDescription(e.target.value)
                }
              />
            </div>
            <div>
              <Label>Subjects (comma-separated)</Label>
              <Input
                value={subjects}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setSubjects(e.target.value)
                }
              />
            </div>
            <div>
              <Label>URL (optional)</Label>
              <Input
                value={url}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setUrl(e.target.value)
                }
              />
            </div>
            <div>
              <Label htmlFor="file-input">File (optional)</Label>
              <input
                id="file-input"
                type="file"
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setFile(e.target.files?.[0] || null)
                }
              />
            </div>
            <div>
              <Button type="submit" disabled={loading}>
                {loading ? "Uploading…" : "Save"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>My Materials</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {materials.map((m) => (
              <Card key={m._id}>
                <CardHeader>
                  <CardTitle>{m.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  {m.type === "image" && m.filePath && (
                    // image preview
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
                  {m.filePath && uploadProgress !== null && (
                    <div className="text-sm text-muted-foreground mb-2">
                      Uploading: {uploadProgress}%
                    </div>
                  )}
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
                    {editingId === m._id ? (
                      <>
                        <Button onClick={() => onSaveEdit(m._id)}>Save</Button>
                        <Button variant="secondary" onClick={onCancelEdit}>
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button onClick={() => onStartEdit(m)}>Edit</Button>
                        <Button
                          variant="destructive"
                          onClick={() => onDelete(m._id)}
                          disabled={deletingIds.includes(m._id)}
                        >
                          {deletingIds.includes(m._id) ? "Deleting…" : "Delete"}
                        </Button>
                      </>
                    )}
                  </div>
                  {editingId === m._id && (
                    <div className="mt-3 space-y-2">
                      <Input
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                      />
                      <Input
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                      />
                      <Input
                        value={editSubjects}
                        onChange={(e) => setEditSubjects(e.target.value)}
                      />
                      <Input
                        value={editUrl}
                        onChange={(e) => setEditUrl(e.target.value)}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
            {materials.length === 0 && (
              <div className="text-sm text-muted-foreground">
                No materials found
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
