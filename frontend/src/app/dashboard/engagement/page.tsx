"use client";

import { useState, useEffect } from "react";
// import { useSession } from "next-auth/react";
import { useTabSession } from "@/hooks/useTabSession";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  MessageSquare,
  ThumbsUp,
  Send,
  Calendar,
  Clock,
  Users,
  BookOpen,
  Star,
} from "lucide-react";
import api, { BACKEND_URL } from "@/lib/api";
import { toast } from "sonner";

export default function EngagementPage() {
  const { data: session } = useTabSession();
  const [newDiscussion, setNewDiscussion] = useState({
    title: "",
    content: "",
    subject: "",
    tags: "",
  });
  const [newFeedback, setNewFeedback] = useState({
    tutor: "",
    subject: "",
    rating: 5,
    comment: "",
  });
  const [discussions, setDiscussions] = useState<any[]>([]);
  const [feedback, setFeedback] = useState<any[]>([]);
  const [resources, setResources] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchDiscussions();
    fetchFeedback();
    fetchResources();
  }, []);

  const fetchDiscussions = async () => {
    try {
      const res = await api.get("/engagement/discussions");
      setDiscussions(res.data || []);
    } catch (err) {
      console.error("Failed to fetch discussions", err);
    }
  };

  const fetchFeedback = async () => {
    try {
      const res = await api.get("/engagement/feedback");
      setFeedback(res.data || []);
    } catch (err) {
      console.error("Failed to fetch feedback", err);
    }
  };

  const fetchResources = async () => {
    try {
      const res = await api.get("/study-materials");
      // Add detailed steps and summaries to backend results
      const enrichedResources = (res.data || []).map((m: any) => ({
        ...m,
        id: m._id,
        details:
          m.summary ||
          m.description ||
          "Comprehensive guide covering the essentials. Perfect for conceptual understanding.",
        steps:
          m.steps && m.steps.length > 0
            ? m.steps
            : [
              "Review core concepts in this guide",
              "Solve the practice problems included",
              "Discuss with peers in the forum",
              "Contact your tutor for deep dives",
            ],
      }));
      setResources(enrichedResources);
    } catch (err) {
      console.error("Failed to fetch resources", err);
    }
  };

  const handleLikeDiscussion = async (discussionId: string) => {
    try {
      await api.post(`/engagement/discussions/${discussionId}/like`);
      fetchDiscussions();
    } catch (err) {
      toast.error("Failed to like discussion");
    }
  };

  const handleDownloadResource = (resourceId: number) => {
    // Analytics or counter update
    toast.info("Downloading resource...");
  };

  const handleSubmitDiscussion = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      await api.post("/engagement/discussions", {
        ...newDiscussion,
        tags: newDiscussion.tags.split(",").map((t) => t.trim()),
      });
      toast.success("Discussion posted successfully!");
      setNewDiscussion({ title: "", content: "", subject: "", tags: "" });
      fetchDiscussions();
    } catch (err) {
      toast.error("Failed to post discussion");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      await api.post("/engagement/feedback", newFeedback);
      toast.success("Feedback submitted successfully!");
      setNewFeedback({ tutor: "", subject: "", rating: 5, comment: "" });
      fetchFeedback();
    } catch (err) {
      toast.error("Failed to submit feedback");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="discussions" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="discussions">Discussions</TabsTrigger>
          <TabsTrigger value="feedback">Feedback</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
        </TabsList>

        {/* Discussions Tab */}
        <TabsContent value="discussions" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Start a New Discussion</CardTitle>
              <CardDescription>
                Share your questions or insights with other students and tutors
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmitDiscussion} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="title" className="text-sm font-medium">
                      Title
                    </label>
                    <Input
                      id="title"
                      value={newDiscussion.title}
                      onChange={(e) =>
                        setNewDiscussion({
                          ...newDiscussion,
                          title: e.target.value,
                        })
                      }
                      placeholder="Enter a clear, specific title"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="subject" className="text-sm font-medium">
                      Subject
                    </label>
                    <Input
                      id="subject"
                      value={newDiscussion.subject}
                      onChange={(e) =>
                        setNewDiscussion({
                          ...newDiscussion,
                          subject: e.target.value,
                        })
                      }
                      placeholder="e.g., Mathematics, Physics, English"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label htmlFor="content" className="text-sm font-medium">
                    Content
                  </label>
                  <Textarea
                    id="content"
                    value={newDiscussion.content}
                    onChange={(e) =>
                      setNewDiscussion({
                        ...newDiscussion,
                        content: e.target.value,
                      })
                    }
                    placeholder="Describe your question or topic in detail"
                    rows={5}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="tags" className="text-sm font-medium">
                    Tags (comma separated)
                  </label>
                  <Input
                    id="tags"
                    value={newDiscussion.tags}
                    onChange={(e) =>
                      setNewDiscussion({
                        ...newDiscussion,
                        tags: e.target.value,
                      })
                    }
                    placeholder="e.g., algebra, equations, help"
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Posting..." : "Post Discussion"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <h3 className="text-lg font-semibold mt-6">Recent Discussions</h3>
          <div className="space-y-4">
            {discussions.map((discussion: any) => (
              <Card key={discussion._id || discussion.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{discussion.title}</CardTitle>
                      <CardDescription>
                        Posted by {discussion.author?.name || "Unknown"} on{" "}
                        {discussion.createdAt
                          ? new Date(discussion.createdAt).toLocaleDateString()
                          : "Unknown"}{" "}
                        • Subject: {discussion.subject}
                      </CardDescription>
                    </div>
                    <Badge variant="outline">{discussion.subject}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{discussion.content}</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {discussion.tags?.map((tag: string) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <div className="flex items-center gap-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex items-center gap-1"
                      onClick={() =>
                        handleLikeDiscussion(discussion._id || discussion.id)
                      }
                    >
                      <ThumbsUp className="h-4 w-4" />
                      <span>{discussion.likes?.length || 0}</span>
                    </Button>
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <MessageSquare className="h-4 w-4" />
                      <span>{discussion.replies?.length || 0} replies</span>
                    </div>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Feedback Tab */}
        <TabsContent value="feedback" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Submit Feedback</CardTitle>
              <CardDescription>
                Share your experience with tutors to help them improve
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmitFeedback} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="tutor" className="text-sm font-medium">
                      Tutor Name
                    </label>
                    <Input
                      id="tutor"
                      value={newFeedback.tutor}
                      onChange={(e) =>
                        setNewFeedback({
                          ...newFeedback,
                          tutor: e.target.value,
                        })
                      }
                      placeholder="Enter tutor's name"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="subject" className="text-sm font-medium">
                      Subject
                    </label>
                    <Input
                      id="subject"
                      value={newFeedback.subject}
                      onChange={(e) =>
                        setNewFeedback({
                          ...newFeedback,
                          subject: e.target.value,
                        })
                      }
                      placeholder="e.g., Mathematics, Physics, English"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Rating</label>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <Button
                        key={rating}
                        type="button"
                        variant="ghost"
                        size="sm"
                        className={`p-1 ${newFeedback.rating >= rating
                            ? "text-amber-500"
                            : "text-gray-300"
                          }`}
                        onClick={() =>
                          setNewFeedback({ ...newFeedback, rating })
                        }
                      >
                        <Star
                          className={`h-6 w-6 ${newFeedback.rating >= rating ? "fill-amber-500" : ""
                            }`}
                        />
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <label htmlFor="comment" className="text-sm font-medium">
                    Comments
                  </label>
                  <Textarea
                    id="comment"
                    value={newFeedback.comment}
                    onChange={(e) =>
                      setNewFeedback({
                        ...newFeedback,
                        comment: e.target.value,
                      })
                    }
                    placeholder="Share your experience with this tutor"
                    rows={4}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Submitting..." : "Submit Feedback"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <h3 className="text-lg font-semibold mt-6">Your Recent Feedback</h3>
          <div className="space-y-4">
            {feedback.map((f) => (
              <Card key={f._id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{f.tutor?.name || f.tutor}</CardTitle>
                      <CardDescription>
                        Subject: {f.subject} • Submitted on{" "}
                        {new Date(f.createdAt).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    <div className="flex items-center">
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <Star
                          key={rating}
                          className={`h-4 w-4 ${rating <= f.rating
                              ? "fill-amber-500 text-amber-500"
                              : "text-gray-300"
                            }`}
                        />
                      ))}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium mb-1">Your Comment</h4>
                    <p className="text-sm">{f.comment}</p>
                  </div>

                  {f.response && (
                    <div className="bg-gray-50 p-3 rounded-md">
                      <h4 className="text-sm font-medium mb-1">
                        Tutor Response
                      </h4>
                      <p className="text-sm">{f.response}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Resources Tab */}
        <TabsContent value="resources" className="space-y-4 mt-4">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
            {resources.map((resource) => (
              <Card
                key={resource.id}
                className="flex flex-col overflow-hidden border-2 border-slate-100 hover:border-maatram-yellow transition-all"
              >
                <CardHeader className="pb-2 bg-slate-50">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-xl text-slate-900">
                      {resource.title}
                    </CardTitle>
                    <Badge
                      variant={
                        resource.type?.toLowerCase() === "pdf"
                          ? "default"
                          : resource.type?.toLowerCase() === "video"
                            ? "destructive"
                            : "secondary"
                      }
                    >
                      {resource.type?.toUpperCase()}
                    </Badge>
                  </div>
                  <CardDescription className="font-bold text-maatram-blue uppercase tracking-wider">
                    {resource.subjects?.join(", ") || resource.subject}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-grow py-4 space-y-4">
                  <div className="bg-white p-3 rounded border border-slate-200 shadow-sm">
                    <h4 className="text-sm font-bold mb-2 flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-maatram-blue" />
                      Executive Summary
                    </h4>
                    <p className="text-sm text-slate-600 italic">
                      {resource.details}
                    </p>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold mb-2 flex items-center gap-2">
                      <Clock className="h-4 w-4 text-maatram-yellow" />
                      Learning Roadmap
                    </h4>
                    <ul className="space-y-2">
                      {(resource.steps || []).map(
                        (step: string, idx: number) => (
                          <li key={idx} className="text-xs flex gap-2">
                            <span className="font-bold text-maatram-yellow">
                              {idx + 1}.
                            </span>
                            <span className="text-slate-600">{step}</span>
                          </li>
                        )
                      )}
                    </ul>
                  </div>
                </CardContent>
                <CardFooter className="pt-2 bg-slate-50 border-t">
                  <Button
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold"
                    onClick={() => handleDownloadResource(resource.id)}
                    asChild
                  >
                    <a
                      href={
                        resource.url ||
                        (resource.filePath
                          ? `${BACKEND_URL}/uploads/study-materials/${resource.filePath}`
                          : resource.link)
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Download Study Material
                    </a>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
