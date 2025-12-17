"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Search, HelpCircle, MessageSquare, FileText, BookOpen, Video, ExternalLink, Send } from "lucide-react";

export default function HelpSupportPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("faq");
  
  // Sample FAQ data
  const faqCategories = [
    {
      id: "general",
      name: "General",
      questions: [
        {
          id: "q1",
          question: "How do I reschedule a class?",
          answer: "You can reschedule a class by navigating to the 'Reschedule/Cancel Session' page from the sidebar. Select the class you want to reschedule, choose a new date and time, provide a reason, and submit the request. Students will be notified automatically."
        },
        {
          id: "q2",
          question: "How do I mark attendance for my class?",
          answer: "To mark attendance, go to the 'Attendance' page from the sidebar. Select the class and date, and you'll see a list of students. Mark each student as present, absent, or late, and save the attendance record."
        },
        {
          id: "q3",
          question: "How do I create and assign tests?",
          answer: "Navigate to the 'Assignments & Tests' page, select the 'Tests' tab, and click on 'Create New Test'. Fill in the test details, select the class, set the due date, and upload any necessary files. Once created, students will be able to access the test."
        }
      ]
    },
    {
      id: "technical",
      name: "Technical Issues",
      questions: [
        {
          id: "q4",
          question: "What should I do if my video isn't working during a class?",
          answer: "First, check your camera permissions in your browser settings. If that doesn't work, try refreshing the page. If the issue persists, you can continue with audio-only mode and contact technical support after the class."
        },
        {
          id: "q5",
          question: "How do I share my screen during a class?",
          answer: "During an active class, click on the 'Share Screen' button at the bottom of the video interface. Select which window or application you want to share, and click 'Share'. Students will be able to see your screen immediately."
        },
        {
          id: "q6",
          question: "What browser is recommended for the platform?",
          answer: "We recommend using the latest versions of Chrome, Firefox, or Edge for the best experience. Safari is also supported but may have limited functionality for some features."
        }
      ]
    },
    {
      id: "policies",
      name: "Policies & Procedures",
      questions: [
        {
          id: "q7",
          question: "What is the cancellation policy?",
          answer: "Classes should be cancelled at least 24 hours in advance. Late cancellations may affect your performance metrics. Always provide a reason for cancellation and suggest an alternative date if possible."
        },
        {
          id: "q8",
          question: "How are tutor performance evaluations conducted?",
          answer: "Tutor evaluations are based on student feedback, attendance records, class completion rates, and engagement metrics. Evaluations are conducted quarterly, and you'll receive a detailed report with feedback and suggestions for improvement."
        },
        {
          id: "q9",
          question: "What are the guidelines for creating additional learning materials?",
          answer: "All learning materials should align with the curriculum objectives. Materials should be clear, concise, and accessible. You can upload PDFs, presentations, or links to external resources through the 'Assignments & Tests' page."
        }
      ]
    }
  ];
  
  // Sample support ticket data
  const supportTickets = [
    {
      id: "ticket1",
      subject: "Video freezing during class",
      date: "2023-12-10",
      status: "open",
      messages: [
        {
          sender: "You",
          message: "I've been experiencing video freezing issues during my classes. It happens about 15 minutes into the session and requires me to refresh the page.",
          timestamp: "2023-12-10 14:30"
        },
        {
          sender: "Support",
          message: "Thank you for reporting this issue. Could you please provide more details about your internet connection speed and the browser you're using?",
          timestamp: "2023-12-10 15:45"
        }
      ]
    },
    {
      id: "ticket2",
      subject: "Unable to upload assignment files",
      date: "2023-12-05",
      status: "closed",
      messages: [
        {
          sender: "You",
          message: "I'm trying to upload PDF files for an assignment but keep getting an error message saying 'File type not supported'.",
          timestamp: "2023-12-05 10:15"
        },
        {
          sender: "Support",
          message: "We've identified the issue with PDF uploads and have deployed a fix. Please try uploading your files again and let us know if you encounter any further problems.",
          timestamp: "2023-12-05 13:20"
        },
        {
          sender: "You",
          message: "The upload is working now. Thank you for the quick resolution!",
          timestamp: "2023-12-05 14:05"
        },
        {
          sender: "Support",
          message: "Great! We're glad the issue is resolved. Don't hesitate to contact us if you need any further assistance.",
          timestamp: "2023-12-05 14:30"
        }
      ]
    }
  ];
  
  // Sample resources data
  const resources = [
    {
      id: "res1",
      title: "Tutor Handbook",
      type: "document",
      description: "Comprehensive guide covering all policies, procedures, and best practices for tutors.",
      link: "#"
    },
    {
      id: "res2",
      title: "Virtual Classroom Tutorial",
      type: "video",
      description: "Step-by-step guide on using all features of the virtual classroom effectively.",
      link: "#"
    },
    {
      id: "res3",
      title: "Effective Online Teaching Strategies",
      type: "document",
      description: "Research-based strategies to enhance student engagement and learning outcomes in online environments.",
      link: "#"
    },
    {
      id: "res4",
      title: "Accessibility Guidelines",
      type: "document",
      description: "Guidelines for creating accessible learning materials for students with diverse needs.",
      link: "#"
    },
    {
      id: "res5",
      title: "Assessment Design Workshop",
      type: "video",
      description: "Workshop on designing effective assessments for online learning environments.",
      link: "#"
    }
  ];
  
  // Filter FAQ based on search query
  const filteredFAQs = faqCategories.map(category => ({
    ...category,
    questions: category.questions.filter(q => 
      q.question.toLowerCase().includes(searchQuery.toLowerCase()) || 
      q.answer.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(category => category.questions.length > 0);
  
  // Filter resources based on search query
  const filteredResources = resources.filter(resource => 
    resource.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    resource.description.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const handleSubmitTicket = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Submitting support ticket");
    // Implementation would go here
  };
  
  const handleSendMessage = (ticketId: string, message: string) => {
    console.log(`Sending message for ticket ${ticketId}: ${message}`);
    // Implementation would go here
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Help & Support</h2>
      </div>
      
      <div className="relative mb-6">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search for help topics, FAQs, or resources..."
          className="pl-8"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      
      <Tabs defaultValue="faq" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger 
            value="faq" 
            onClick={() => setActiveTab("faq")}
          >
            <HelpCircle className="h-4 w-4 mr-2" />
            FAQs
          </TabsTrigger>
          <TabsTrigger 
            value="support" 
            onClick={() => setActiveTab("support")}
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            Support Tickets
          </TabsTrigger>
          <TabsTrigger 
            value="resources" 
            onClick={() => setActiveTab("resources")}
          >
            <BookOpen className="h-4 w-4 mr-2" />
            Resources
          </TabsTrigger>
        </TabsList>
        
        {/* FAQs Tab */}
        <TabsContent value="faq" className="space-y-6">
          {searchQuery && filteredFAQs.length === 0 ? (
            <div className="text-center py-8">
              <HelpCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No FAQs found</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Try a different search term or browse the categories below
              </p>
            </div>
          ) : (
            filteredFAQs.map((category) => (
              <Card key={category.id}>
                <CardHeader>
                  <CardTitle>{category.name}</CardTitle>
                  <CardDescription>
                    Frequently asked questions about {category.name.toLowerCase()} topics
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="w-full">
                    {category.questions.map((faq) => (
                      <AccordionItem key={faq.id} value={faq.id}>
                        <AccordionTrigger className="text-left">
                          {faq.question}
                        </AccordionTrigger>
                        <AccordionContent>
                          <p className="text-muted-foreground">
                            {faq.answer}
                          </p>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>
            ))
          )}
          
          {!searchQuery && (
            <Card>
              <CardHeader>
                <CardTitle>Can't find what you're looking for?</CardTitle>
                <CardDescription>
                  Submit a support ticket and our team will assist you
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => setActiveTab("support")}>
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Contact Support
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        {/* Support Tickets Tab */}
        <TabsContent value="support" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            {/* New Ticket Form */}
            <Card className="md:col-span-1">
              <CardHeader>
                <CardTitle>Submit a Support Ticket</CardTitle>
                <CardDescription>
                  Our support team will respond within 24 hours
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmitTicket} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="ticket-subject">Subject</Label>
                    <Input id="ticket-subject" placeholder="Brief description of the issue" />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="ticket-category">Category</Label>
                    <Select>
                      <SelectTrigger id="ticket-category">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="technical">Technical Issue</SelectItem>
                        <SelectItem value="account">Account Management</SelectItem>
                        <SelectItem value="class">Class-related</SelectItem>
                        <SelectItem value="billing">Billing & Payments</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="ticket-priority">Priority</Label>
                    <Select>
                      <SelectTrigger id="ticket-priority">
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low - General inquiry</SelectItem>
                        <SelectItem value="medium">Medium - Affects some functionality</SelectItem>
                        <SelectItem value="high">High - Prevents teaching</SelectItem>
                        <SelectItem value="urgent">Urgent - Class in progress</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="ticket-description">Description</Label>
                    <Textarea 
                      id="ticket-description" 
                      placeholder="Please provide details about the issue you're experiencing"
                      rows={5}
                    />
                  </div>
                  
                  <Button type="submit" className="w-full">
                    Submit Ticket
                  </Button>
                </form>
              </CardContent>
            </Card>
            
            {/* Existing Tickets */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Your Support Tickets</CardTitle>
                <CardDescription>
                  View and manage your existing support tickets
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {supportTickets.length > 0 ? (
                  supportTickets.map((ticket) => (
                    <Card key={ticket.id}>
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg">{ticket.subject}</CardTitle>
                            <CardDescription>
                              Ticket ID: {ticket.id} • {ticket.date}
                            </CardDescription>
                          </div>
                          <Badge variant={ticket.status === "open" ? "default" : "secondary"}>
                            {ticket.status === "open" ? "Open" : "Closed"}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-3 max-h-60 overflow-y-auto border rounded-md p-3">
                          {ticket.messages.map((msg, index) => (
                            <div 
                              key={index} 
                              className={`flex ${msg.sender === "You" ? "justify-end" : "justify-start"}`}
                            >
                              <div 
                                className={`max-w-[80%] p-3 rounded-lg ${
                                  msg.sender === "You" 
                                    ? "bg-primary text-primary-foreground" 
                                    : "bg-muted"
                                }`}
                              >
                                <div className="text-xs mb-1">
                                  {msg.sender} • {msg.timestamp}
                                </div>
                                <div>{msg.message}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        {ticket.status === "open" && (
                          <div className="flex items-center space-x-2 mt-4">
                            <Input placeholder="Type your reply..." />
                            <Button 
                              size="icon"
                              onClick={() => handleSendMessage(ticket.id, "Sample reply message")}
                            >
                              <Send className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">No support tickets</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      You haven't submitted any support tickets yet
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Resources Tab */}
        <TabsContent value="resources" className="space-y-6">
          {searchQuery && filteredResources.length === 0 ? (
            <div className="text-center py-8">
              <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No resources found</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Try a different search term or browse all resources
              </p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredResources.map((resource) => (
                <Card key={resource.id} className="overflow-hidden">
                  <div className={`h-1 ${
                    resource.type === "document" ? "bg-blue-500" : 
                    resource.type === "video" ? "bg-red-500" : 
                    "bg-green-500"
                  }`} />
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      {resource.type === "document" && <FileText className="h-5 w-5 mr-2 text-blue-500" />}
                      {resource.type === "video" && <Video className="h-5 w-5 mr-2 text-red-500" />}
                      {resource.title}
                    </CardTitle>
                    <CardDescription>
                      {resource.type.charAt(0).toUpperCase() + resource.type.slice(1)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      {resource.description}
                    </p>
                  </CardContent>
                  <CardFooter>
                    <Button variant="outline" className="w-full" asChild>
                      <a href={resource.link} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View Resource
                      </a>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
          
          <Card>
            <CardHeader>
              <CardTitle>Request Additional Resources</CardTitle>
              <CardDescription>
                Can't find what you need? Request additional training materials or resources
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="resource-topic">Topic</Label>
                  <Input id="resource-topic" placeholder="What topic do you need resources for?" />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="resource-type">Resource Type</Label>
                  <Select>
                    <SelectTrigger id="resource-type">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="document">Document</SelectItem>
                      <SelectItem value="video">Video Tutorial</SelectItem>
                      <SelectItem value="training">Live Training</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="resource-description">Description</Label>
                  <Textarea 
                    id="resource-description" 
                    placeholder="Please describe what specific information or training you need"
                    rows={3}
                  />
                </div>
                
                <Button type="submit">
                  Submit Request
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}