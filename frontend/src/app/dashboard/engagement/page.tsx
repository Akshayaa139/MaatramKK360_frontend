"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, ThumbsUp, Send, Calendar, Clock, Users, BookOpen, Star } from "lucide-react";

// Mock data for discussions
const discussionsData = [
  {
    id: 1,
    title: "Understanding Quadratic Equations",
    subject: "Mathematics",
    author: "Alex Johnson",
    date: "2023-06-10",
    replies: 8,
    likes: 12,
    content: "I'm having trouble understanding how to factor quadratic equations. Can someone explain the process step by step?",
    tags: ["algebra", "equations", "help"],
  },
  {
    id: 2,
    title: "Shakespeare's Macbeth Themes",
    subject: "English",
    author: "Emma Wilson",
    date: "2023-06-11",
    replies: 5,
    likes: 7,
    content: "What are the main themes in Shakespeare's Macbeth? I need to write an essay and would appreciate some insights.",
    tags: ["literature", "shakespeare", "themes"],
  },
  {
    id: 3,
    title: "Newton's Laws of Motion Applications",
    subject: "Physics",
    author: "James Miller",
    date: "2023-06-12",
    replies: 10,
    likes: 15,
    content: "Can anyone share some real-world applications of Newton's laws of motion? I'm working on a project and need examples.",
    tags: ["mechanics", "newton", "physics"],
  },
];

// Mock data for feedback
const feedbackData = [
  {
    id: 1,
    tutor: "Dr. John Smith",
    subject: "Mathematics",
    date: "2023-06-08",
    rating: 5,
    comment: "Excellent explanation of calculus concepts. Dr. Smith took the time to ensure I understood each step before moving on.",
    response: "Thank you for your kind words! I'm glad I could help you understand calculus better.",
  },
  {
    id: 2,
    tutor: "Sarah Johnson",
    subject: "Chemistry",
    date: "2023-06-05",
    rating: 4,
    comment: "Very knowledgeable about organic chemistry. Could improve by providing more practice problems.",
    response: null,
  },
];

// Mock data for resources
const resourcesData = [
  {
    id: 1,
    title: "Calculus Fundamentals",
    subject: "Mathematics",
    type: "PDF",
    author: "Dr. John Smith",
    downloads: 156,
    rating: 4.8,
    link: "https://example.com/resources/calculus-fundamentals.pdf",
  },
  {
    id: 2,
    title: "Chemistry Lab Safety Guidelines",
    subject: "Chemistry",
    type: "Video",
    author: "Sarah Johnson",
    downloads: 98,
    rating: 4.5,
    link: "https://example.com/resources/chemistry-lab-safety.mp4",
  },
  {
    id: 3,
    title: "English Literature Essay Writing Guide",
    subject: "English",
    type: "PDF",
    author: "Michael Brown",
    downloads: 210,
    rating: 4.9,
    link: "https://example.com/resources/essay-writing-guide.pdf",
  },
  {
    id: 4,
    title: "Physics Problem Solving Techniques",
    subject: "Physics",
    type: "Interactive",
    author: "Robert Wilson",
    downloads: 175,
    rating: 4.7,
    link: "https://example.com/resources/physics-problem-solving.html",
  },
];

export default function EngagementPage() {
  const { data: session } = useSession();
  const [newDiscussion, setNewDiscussion] = useState({ title: "", content: "", subject: "", tags: "" });
  const [newFeedback, setNewFeedback] = useState({ tutor: "", subject: "", rating: 5, comment: "" });
  const [likedDiscussions, setLikedDiscussions] = useState<number[]>([]);
  const [downloadedResources, setDownloadedResources] = useState<number[]>([]);

  const handleLikeDiscussion = (discussionId: number) => {
    if (!likedDiscussions.includes(discussionId)) {
      setLikedDiscussions([...likedDiscussions, discussionId]);
    } else {
      setLikedDiscussions(likedDiscussions.filter(id => id !== discussionId));
    }
  };

  const handleDownloadResource = (resourceId: number) => {
    if (!downloadedResources.includes(resourceId)) {
      setDownloadedResources([...downloadedResources, resourceId]);
    }
  };

  const handleSubmitDiscussion = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, this would send the new discussion to the backend
    alert("Discussion submitted successfully!");
    setNewDiscussion({ title: "", content: "", subject: "", tags: "" });
  };

  const handleSubmitFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, this would send the feedback to the backend
    alert("Feedback submitted successfully!");
    setNewFeedback({ tutor: "", subject: "", rating: 5, comment: "" });
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
              <CardDescription>Share your questions or insights with other students and tutors</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmitDiscussion} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="title" className="text-sm font-medium">Title</label>
                    <Input 
                      id="title" 
                      value={newDiscussion.title} 
                      onChange={(e) => setNewDiscussion({...newDiscussion, title: e.target.value})}
                      placeholder="Enter a clear, specific title"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="subject" className="text-sm font-medium">Subject</label>
                    <Input 
                      id="subject" 
                      value={newDiscussion.subject} 
                      onChange={(e) => setNewDiscussion({...newDiscussion, subject: e.target.value})}
                      placeholder="e.g., Mathematics, Physics, English"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label htmlFor="content" className="text-sm font-medium">Content</label>
                  <Textarea 
                    id="content" 
                    value={newDiscussion.content} 
                    onChange={(e) => setNewDiscussion({...newDiscussion, content: e.target.value})}
                    placeholder="Describe your question or topic in detail"
                    rows={5}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="tags" className="text-sm font-medium">Tags (comma separated)</label>
                  <Input 
                    id="tags" 
                    value={newDiscussion.tags} 
                    onChange={(e) => setNewDiscussion({...newDiscussion, tags: e.target.value})}
                    placeholder="e.g., algebra, equations, help"
                  />
                </div>
                <Button type="submit" className="w-full">Post Discussion</Button>
              </form>
            </CardContent>
          </Card>
          
          <h3 className="text-lg font-semibold mt-6">Recent Discussions</h3>
          <div className="space-y-4">
            {discussionsData.map((discussion) => (
              <Card key={discussion.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{discussion.title}</CardTitle>
                      <CardDescription>
                        Posted by {discussion.author} on {discussion.date} • Subject: {discussion.subject}
                      </CardDescription>
                    </div>
                    <Badge variant="outline">{discussion.subject}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{discussion.content}</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {discussion.tags.map((tag) => (
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
                      onClick={() => handleLikeDiscussion(discussion.id)}
                    >
                      <ThumbsUp className={`h-4 w-4 ${likedDiscussions.includes(discussion.id) ? "fill-primary text-primary" : ""}`} />
                      <span>{likedDiscussions.includes(discussion.id) ? discussion.likes + 1 : discussion.likes}</span>
                    </Button>
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <MessageSquare className="h-4 w-4" />
                      <span>{discussion.replies} replies</span>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    View Discussion
                  </Button>
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
              <CardDescription>Share your experience with tutors to help them improve</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmitFeedback} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="tutor" className="text-sm font-medium">Tutor Name</label>
                    <Input 
                      id="tutor" 
                      value={newFeedback.tutor} 
                      onChange={(e) => setNewFeedback({...newFeedback, tutor: e.target.value})}
                      placeholder="Enter tutor's name"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="subject" className="text-sm font-medium">Subject</label>
                    <Input 
                      id="subject" 
                      value={newFeedback.subject} 
                      onChange={(e) => setNewFeedback({...newFeedback, subject: e.target.value})}
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
                        className={`p-1 ${newFeedback.rating >= rating ? "text-amber-500" : "text-gray-300"}`}
                        onClick={() => setNewFeedback({...newFeedback, rating})}
                      >
                        <Star className={`h-6 w-6 ${newFeedback.rating >= rating ? "fill-amber-500" : ""}`} />
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <label htmlFor="comment" className="text-sm font-medium">Comments</label>
                  <Textarea 
                    id="comment" 
                    value={newFeedback.comment} 
                    onChange={(e) => setNewFeedback({...newFeedback, comment: e.target.value})}
                    placeholder="Share your experience with this tutor"
                    rows={4}
                    required
                  />
                </div>
                <Button type="submit" className="w-full">Submit Feedback</Button>
              </form>
            </CardContent>
          </Card>
          
          <h3 className="text-lg font-semibold mt-6">Your Recent Feedback</h3>
          <div className="space-y-4">
            {feedbackData.map((feedback) => (
              <Card key={feedback.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{feedback.tutor}</CardTitle>
                      <CardDescription>
                        Subject: {feedback.subject} • Submitted on {feedback.date}
                      </CardDescription>
                    </div>
                    <div className="flex items-center">
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <Star 
                          key={rating} 
                          className={`h-4 w-4 ${rating <= feedback.rating ? "fill-amber-500 text-amber-500" : "text-gray-300"}`} 
                        />
                      ))}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium mb-1">Your Comment</h4>
                    <p className="text-sm">{feedback.comment}</p>
                  </div>
                  
                  {feedback.response && (
                    <div className="bg-gray-50 p-3 rounded-md">
                      <h4 className="text-sm font-medium mb-1">Tutor Response</h4>
                      <p className="text-sm">{feedback.response}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        {/* Resources Tab */}
        <TabsContent value="resources" className="space-y-4 mt-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {resourcesData.map((resource) => (
              <Card key={resource.id} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{resource.title}</CardTitle>
                    <Badge variant={
                      resource.type === "PDF" ? "default" : 
                      resource.type === "Video" ? "destructive" : 
                      "secondary"
                    }>
                      {resource.type}
                    </Badge>
                  </div>
                  <CardDescription>{resource.subject}</CardDescription>
                </CardHeader>
                <CardContent className="pb-2">
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-2 text-gray-500" />
                      <span>Author: {resource.author}</span>
                    </div>
                    <div className="flex items-center">
                      <Star className="h-4 w-4 mr-2 text-amber-500" />
                      <span>Rating: {resource.rating}/5.0</span>
                    </div>
                    <div className="flex items-center">
                      <BookOpen className="h-4 w-4 mr-2 text-gray-500" />
                      <span>Downloads: {downloadedResources.includes(resource.id) ? resource.downloads + 1 : resource.downloads}</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    className="w-full" 
                    variant={downloadedResources.includes(resource.id) ? "secondary" : "default"}
                    onClick={() => handleDownloadResource(resource.id)}
                    asChild
                  >
                    <a href={resource.link} target="_blank" rel="noopener noreferrer">
                      {downloadedResources.includes(resource.id) ? "Downloaded" : "Download Resource"}
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