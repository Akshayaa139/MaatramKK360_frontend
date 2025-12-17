"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Star, CheckCircle, XCircle, User, Mail, Phone, BookOpen, Calendar, Clock } from "lucide-react";

interface Student {
  id: string;
  name: string;
  applicationNumber: string;
  class: string;
  subjects: string[];
  phone: string;
  email: string;
  school: string;
  board: string;
  medium: string;
  televerificationScore?: number;
  televerificationComments?: string;
}

interface EvaluationForm {
  communicationSkills: number;
  subjectKnowledge: number;
  confidenceLevel: number;
  familySupport: number;
  financialNeed: number;
  overallRecommendation: 'select' | 'reject' | 'waitlist';
  detailedComments: string;
  followUpRequired: boolean;
  followUpDetails: string;
}

const sampleStudent: Student = {
  id: "1",
  name: "Arun Kumar",
  applicationNumber: "KK20241234001",
  class: "10",
  subjects: ["Mathematics", "Science"],
  phone: "9876543210",
  email: "arun@gmail.com",
  school: "Government Higher Secondary School, Chennai",
  board: "State Board",
  medium: "Tamil",
  televerificationScore: 85,
  televerificationComments: "Good communication skills, shows genuine interest in learning, family is supportive"
};

export default function PanelInterviewEvaluation() {
  const [evaluation, setEvaluation] = useState<EvaluationForm>({
    communicationSkills: 0,
    subjectKnowledge: 0,
    confidenceLevel: 0,
    familySupport: 0,
    financialNeed: 0,
    overallRecommendation: 'waitlist',
    detailedComments: '',
    followUpRequired: false,
    followUpDetails: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleScoreChange = (field: keyof EvaluationForm, value: number) => {
    setEvaluation(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    setIsSubmitting(true);
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
    }, 2000);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBadge = (score: number) => {
    if (score >= 80) return <Badge className="bg-green-100 text-green-800">Excellent</Badge>;
    if (score >= 60) return <Badge className="bg-yellow-100 text-yellow-800">Good</Badge>;
    if (score >= 40) return <Badge className="bg-orange-100 text-orange-800">Average</Badge>;
    return <Badge className="bg-red-100 text-red-800">Needs Improvement</Badge>;
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="p-8 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Evaluation Submitted</h2>
            <p className="text-gray-600 mb-6">
              Thank you for completing the panel interview evaluation. Your feedback has been recorded successfully.
            </p>
            <Button onClick={() => setSubmitted(false)}>
              Evaluate Another Student
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Panel Interview Evaluation</h1>
          <p className="text-gray-600 mt-2">Evaluate student performance in panel interview</p>
        </div>

        {/* Student Information */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Student Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex items-center">
                  <User className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="font-medium">{sampleStudent.name}</span>
                </div>
                <div className="flex items-center">
                  <Mail className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-gray-600">{sampleStudent.email}</span>
                </div>
                <div className="flex items-center">
                  <Phone className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-gray-600">{sampleStudent.phone}</span>
                </div>
                <div className="flex items-center">
                  <BookOpen className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-gray-600">Class {sampleStudent.class}</span>
                </div>
              </div>
              
              <div className="space-y-3">
                <div>
                  <span className="font-medium">Application Number: </span>
                  <Badge className="ml-2">{sampleStudent.applicationNumber}</Badge>
                </div>
                <div>
                  <span className="font-medium">School: </span>
                  <span className="text-gray-600">{sampleStudent.school}</span>
                </div>
                <div>
                  <span className="font-medium">Board: </span>
                  <span className="text-gray-600">{sampleStudent.board}</span>
                </div>
                <div>
                  <span className="font-medium">Medium: </span>
                  <span className="text-gray-600">{sampleStudent.medium}</span>
                </div>
                <div>
                  <span className="font-medium">Subjects: </span>
                  <span className="text-gray-600">{sampleStudent.subjects.join(', ')}</span>
                </div>
              </div>
            </div>
            
            {/* Televerification Summary */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Televerification Summary</h4>
              <div className="flex items-center gap-4">
                <span className="text-blue-800">Score: {sampleStudent.televerificationScore}/100</span>
                {getScoreBadge(sampleStudent.televerificationScore || 0)}
              </div>
              <p className="text-blue-700 text-sm mt-2">{sampleStudent.televerificationComments}</p>
            </div>
          </CardContent>
        </Card>

        {/* Evaluation Form */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Interview Evaluation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {/* Communication Skills */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <Label className="text-lg font-medium">Communication Skills</Label>
                  <div className="flex items-center gap-2">
                    <span className={`font-bold text-lg ${getScoreColor(evaluation.communicationSkills)}`}>
                      {evaluation.communicationSkills}/100
                    </span>
                    {evaluation.communicationSkills > 0 && getScoreBadge(evaluation.communicationSkills)}
                  </div>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  {[20, 40, 60, 80, 100].map((score) => (
                    <Button
                      key={score}
                      variant={evaluation.communicationSkills === score ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleScoreChange('communicationSkills', score)}
                      className="flex-1"
                    >
                      {score}
                    </Button>
                  ))}
                </div>
                <p className="text-sm text-gray-600">
                  Assess the student's ability to express thoughts clearly, language proficiency, and listening skills
                </p>
              </div>

              {/* Subject Knowledge */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <Label className="text-lg font-medium">Subject Knowledge</Label>
                  <div className="flex items-center gap-2">
                    <span className={`font-bold text-lg ${getScoreColor(evaluation.subjectKnowledge)}`}>
                      {evaluation.subjectKnowledge}/100
                    </span>
                    {evaluation.subjectKnowledge > 0 && getScoreBadge(evaluation.subjectKnowledge)}
                  </div>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  {[20, 40, 60, 80, 100].map((score) => (
                    <Button
                      key={score}
                      variant={evaluation.subjectKnowledge === score ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleScoreChange('subjectKnowledge', score)}
                      className="flex-1"
                    >
                      {score}
                    </Button>
                  ))}
                </div>
                <p className="text-sm text-gray-600">
                  Evaluate understanding of chosen subjects, problem-solving ability, and learning aptitude
                </p>
              </div>

              {/* Confidence Level */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <Label className="text-lg font-medium">Confidence Level</Label>
                  <div className="flex items-center gap-2">
                    <span className={`font-bold text-lg ${getScoreColor(evaluation.confidenceLevel)}`}>
                      {evaluation.confidenceLevel}/100
                    </span>
                    {evaluation.confidenceLevel > 0 && getScoreBadge(evaluation.confidenceLevel)}
                  </div>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  {[20, 40, 60, 80, 100].map((score) => (
                    <Button
                      key={score}
                      variant={evaluation.confidenceLevel === score ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleScoreChange('confidenceLevel', score)}
                      className="flex-1"
                    >
                      {score}
                    </Button>
                  ))}
                </div>
                <p className="text-sm text-gray-600">
                  Assess self-confidence, body language, and ability to handle pressure
                </p>
              </div>

              {/* Family Support */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <Label className="text-lg font-medium">Family Support</Label>
                  <div className="flex items-center gap-2">
                    <span className={`font-bold text-lg ${getScoreColor(evaluation.familySupport)}`}>
                      {evaluation.familySupport}/100
                    </span>
                    {evaluation.familySupport > 0 && getScoreBadge(evaluation.familySupport)}
                  </div>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  {[20, 40, 60, 80, 100].map((score) => (
                    <Button
                      key={score}
                      variant={evaluation.familySupport === score ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleScoreChange('familySupport', score)}
                      className="flex-1"
                    >
                      {score}
                    </Button>
                  ))}
                </div>
                <p className="text-sm text-gray-600">
                  Evaluate family's commitment to student's education and support for KK program participation
                </p>
              </div>

              {/* Financial Need */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <Label className="text-lg font-medium">Financial Need</Label>
                  <div className="flex items-center gap-2">
                    <span className={`font-bold text-lg ${getScoreColor(evaluation.financialNeed)}`}>
                      {evaluation.financialNeed}/100
                    </span>
                    {evaluation.financialNeed > 0 && getScoreBadge(evaluation.financialNeed)}
                  </div>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  {[20, 40, 60, 80, 100].map((score) => (
                    <Button
                      key={score}
                      variant={evaluation.financialNeed === score ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleScoreChange('financialNeed', score)}
                      className="flex-1"
                    >
                      {score}
                    </Button>
                  ))}
                </div>
                <p className="text-sm text-gray-600">
                  Assess the student's financial situation and need for free tutoring support
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Overall Recommendation */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Overall Recommendation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label>Final Recommendation</Label>
                <Select 
                  value={evaluation.overallRecommendation} 
                  onValueChange={(value: 'select' | 'reject' | 'waitlist') => 
                    setEvaluation(prev => ({ ...prev, overallRecommendation: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select recommendation" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="select">
                      <div className="flex items-center">
                        <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                        Select for KK Program
                      </div>
                    </SelectItem>
                    <SelectItem value="reject">
                      <div className="flex items-center">
                        <XCircle className="h-4 w-4 text-red-600 mr-2" />
                        Reject Application
                      </div>
                    </SelectItem>
                    <SelectItem value="waitlist">
                      <div className="flex items-center">
                        <Star className="h-4 w-4 text-yellow-600 mr-2" />
                        Waitlist for Future Batches
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Detailed Comments</Label>
                <Textarea
                  placeholder="Provide detailed feedback about the student's performance, strengths, areas for improvement, and reasoning for your recommendation..."
                  value={evaluation.detailedComments}
                  onChange={(e) => setEvaluation(prev => ({ ...prev, detailedComments: e.target.value }))}
                  rows={4}
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="followUp"
                  checked={evaluation.followUpRequired}
                  onChange={(e) => setEvaluation(prev => ({ ...prev, followUpRequired: e.target.checked }))}
                />
                <Label htmlFor="followUp">Follow-up required</Label>
              </div>
              
              {evaluation.followUpRequired && (
                <div>
                  <Label>Follow-up Details</Label>
                  <Textarea
                    placeholder="Specify what follow-up actions are needed and timeline..."
                    value={evaluation.followUpDetails}
                    onChange={(e) => setEvaluation(prev => ({ ...prev, followUpDetails: e.target.value }))}
                    rows={2}
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-end">
          <Button 
            onClick={handleSubmit}
            disabled={isSubmitting || 
              evaluation.communicationSkills === 0 ||
              evaluation.subjectKnowledge === 0 ||
              evaluation.confidenceLevel === 0 ||
              evaluation.familySupport === 0 ||
              evaluation.financialNeed === 0 ||
              !evaluation.detailedComments.trim()
            }
            size="lg"
          >
            {isSubmitting ? "Submitting..." : "Submit Evaluation"}
          </Button>
        </div>
      </div>
    </div>
  );
}