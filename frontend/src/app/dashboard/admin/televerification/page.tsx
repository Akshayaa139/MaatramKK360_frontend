"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Phone, User, BookOpen, Clock, Star, Save, Send } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface TeleverificationData {
  applicationNumber: string;
  studentName: string;
  volunteerName: string;
  callDate: string;
  callDuration: string;
  communicationSkills: number;
  subjectKnowledge: number;
  confidenceLevel: number;
  familySupport: number;
  financialNeed: number;
  overallRating: number;
  recommendation: 'strong_recommend' | 'recommend' | 'neutral' | 'not_recommend';
  comments: string;
  followUpRequired: boolean;
  followUpNotes: string;
}

export default function TeleverificationPage() {
  // Get data from URL search params or use defaults
  const [applicationData, setApplicationData] = useState({
    applicationNumber: "KK20241234001",
    studentName: "Arun Kumar",
    classLevel: "10",
    subjects: ["Mathematics", "Physics", "Chemistry"],
    volunteerName: "Ramesh Kumar"
  });
  const [formData, setFormData] = useState<TeleverificationData>({
    applicationNumber: applicationData.applicationNumber,
    studentName: applicationData.studentName,
    volunteerName: applicationData.volunteerName,
    callDate: new Date().toISOString().split('T')[0],
    callDuration: "",
    communicationSkills: 0,
    subjectKnowledge: 0,
    confidenceLevel: 0,
    familySupport: 0,
    financialNeed: 0,
    overallRating: 0,
    recommendation: 'neutral',
    comments: "",
    followUpRequired: false,
    followUpNotes: ""
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const avgRating = (
      formData.communicationSkills +
      formData.subjectKnowledge +
      formData.confidenceLevel +
      formData.familySupport +
      formData.financialNeed
    ) / 5;

    const finalData = {
      ...formData,
      overallRating: Math.round(avgRating * 10) / 10
    };

    try {
      const res = await fetch('/api/televerification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(finalData),
      });

      if (res.ok) {
        toast({
          title: "Success",
          description: "Televerification evaluation submitted successfully!",
        });
        // Reset form or redirect
        setFormData({
          applicationNumber: applicationData.applicationNumber,
          studentName: applicationData.studentName,
          volunteerName: applicationData.volunteerName,
          callDate: new Date().toISOString().split('T')[0],
          callDuration: "",
          communicationSkills: 0,
          subjectKnowledge: 0,
          confidenceLevel: 0,
          familySupport: 0,
          financialNeed: 0,
          overallRating: 0,
          recommendation: 'neutral',
          comments: "",
          followUpRequired: false,
          followUpNotes: ""
        });
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to submit televerification evaluation.",
        });
      }
    } catch (error) {
      console.error('Error submitting televerification:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const RatingScale = ({ label, value, onChange, description }: { 
    label: string; 
    value: number; 
    onChange: (value: number) => void;
    description: string;
  }) => (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <Label className="text-base font-medium">{label}</Label>
        <div className="flex items-center gap-2">
          <Badge variant={value >= 4 ? "success" : value >= 3 ? "secondary" : "destructive"}>
            {value > 0 ? `${value}/5` : "Select"}
          </Badge>
          <div className="flex">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`h-5 w-5 cursor-pointer transition-colors ${
                  star <= value ? "fill-yellow-400 text-yellow-400" : "text-gray-300 hover:text-yellow-300"
                }`}
                onClick={() => onChange(star)}
              />
            ))}
          </div>
        </div>
      </div>
      <p className="text-sm text-gray-600">{description}</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Televerification Evaluation</h1>
              <p className="text-gray-600 mt-2">Evaluate student application through telephonic interview</p>
            </div>
            <Badge variant="outline" className="text-lg px-4 py-2">
              <Phone className="h-4 w-4 mr-2" />
              Televerification
            </Badge>
          </div>
        </div>

        {/* Student Information Card */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Student Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <Label className="text-sm text-gray-600">Application Number</Label>
                <p className="font-mono font-medium">{applicationData.applicationNumber}</p>
              </div>
              <div>
                <Label className="text-sm text-gray-600">Student Name</Label>
                <p className="font-medium">{applicationData.studentName}</p>
              </div>
              <div>
                <Label className="text-sm text-gray-600">Class</Label>
                <p className="font-medium">Class {applicationData.classLevel}</p>
              </div>
              <div>
                <Label className="text-sm text-gray-600">Subjects Applied</Label>
                <div className="flex flex-wrap gap-1">
                  {applicationData.subjects.map((subject, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {subject}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Evaluation Form */}
        <form onSubmit={handleSubmit}>
          <div className="space-y-8">
            {/* Call Details */}
            <Card>
              <CardHeader>
                <CardTitle>Call Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <Label htmlFor="volunteerName">Volunteer Name</Label>
                    <Input
                      id="volunteerName"
                      value={formData.volunteerName}
                      onChange={(e) => setFormData({ ...formData, volunteerName: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="callDate">Call Date</Label>
                    <Input
                      id="callDate"
                      type="date"
                      value={formData.callDate}
                      onChange={(e) => setFormData({ ...formData, callDate: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="callDuration">Call Duration (minutes)</Label>
                    <Input
                      id="callDuration"
                      type="number"
                      placeholder="e.g., 25"
                      value={formData.callDuration}
                      onChange={(e) => setFormData({ ...formData, callDuration: e.target.value })}
                      required
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Evaluation Criteria */}
            <Card>
              <CardHeader>
                <CardTitle>Evaluation Criteria</CardTitle>
                <p className="text-gray-600">Rate the student on a scale of 1-5 for each criterion</p>
              </CardHeader>
              <CardContent className="space-y-8">
                <RatingScale
                  label="Communication Skills"
                  value={formData.communicationSkills}
                  onChange={(value) => setFormData({ ...formData, communicationSkills: value })}
                  description="Ability to express thoughts clearly and understand questions"
                />
                
                <RatingScale
                  label="Subject Knowledge"
                  value={formData.subjectKnowledge}
                  onChange={(value) => setFormData({ ...formData, subjectKnowledge: value })}
                  description="Understanding of subjects they want to learn"
                />
                
                <RatingScale
                  label="Confidence Level"
                  value={formData.confidenceLevel}
                  onChange={(value) => setFormData({ ...formData, confidenceLevel: value })}
                  description="Self-confidence and willingness to learn"
                />
                
                <RatingScale
                  label="Family Support"
                  value={formData.familySupport}
                  onChange={(value) => setFormData({ ...formData, familySupport: value })}
                  description="Level of family support for education"
                />
                
                <RatingScale
                  label="Financial Need"
                  value={formData.financialNeed}
                  onChange={(value) => setFormData({ ...formData, financialNeed: value })}
                  description="Assessed financial need for the program"
                />
              </CardContent>
            </Card>

            {/* Recommendation */}
            <Card>
              <CardHeader>
                <CardTitle>Final Recommendation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label>Overall Recommendation</Label>
                  <RadioGroup
                    value={formData.recommendation}
                    onValueChange={(value) => setFormData({ ...formData, recommendation: value as any })}
                    className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4"
                  >
                    <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-gray-50">
                      <RadioGroupItem value="strong_recommend" id="strong_recommend" />
                      <Label htmlFor="strong_recommend" className="flex items-center cursor-pointer">
                        <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                        Strongly Recommend
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-gray-50">
                      <RadioGroupItem value="recommend" id="recommend" />
                      <Label htmlFor="recommend" className="flex items-center cursor-pointer">
                        <CheckCircle className="h-4 w-4 mr-2 text-blue-600" />
                        Recommend
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-gray-50">
                      <RadioGroupItem value="neutral" id="neutral" />
                      <Label htmlFor="neutral" className="flex items-center cursor-pointer">
                        <User className="h-4 w-4 mr-2 text-yellow-600" />
                        Neutral
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-gray-50">
                      <RadioGroupItem value="not_recommend" id="not_recommend" />
                      <Label htmlFor="not_recommend" className="flex items-center cursor-pointer">
                        <XCircle className="h-4 w-4 mr-2 text-red-600" />
                        Do Not Recommend
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                <div>
                  <Label htmlFor="comments">Detailed Comments</Label>
                  <Textarea
                    id="comments"
                    placeholder="Provide detailed feedback about the student's performance, strengths, areas for improvement, and any other relevant observations..."
                    className="min-h-[120px]"
                    value={formData.comments}
                    onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
                    required
                  />
                </div>
              </CardContent>
            </Card>

            {/* Follow-up */}
            <Card>
              <CardHeader>
                <CardTitle>Follow-up Requirements</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="followUpRequired"
                    checked={formData.followUpRequired}
                    onChange={(e) => setFormData({ ...formData, followUpRequired: e.target.checked })}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="followUpRequired">Follow-up required</Label>
                </div>
                
                {formData.followUpRequired && (
                  <div>
                    <Label htmlFor="followUpNotes">Follow-up Notes</Label>
                    <Textarea
                      id="followUpNotes"
                      placeholder="Specify what follow-up is needed and when..."
                      className="min-h-[80px]"
                      value={formData.followUpNotes}
                      onChange={(e) => setFormData({ ...formData, followUpNotes: e.target.value })}
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Submit Button */}
            <div className="flex justify-end gap-4">
              <Button type="button" variant="outline">
                <Save className="h-4 w-4 mr-2" />
                Save Draft
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Submit Evaluation
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}