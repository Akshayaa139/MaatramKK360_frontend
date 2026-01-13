"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Clock, AlertCircle } from "lucide-react";
import { MathText } from "./MathText";
import { toast } from "sonner";
import api from "@/lib/api";

interface Question {
  questionText: string;
  options: string[];
  correctAnswer: number;
}

interface Test {
  _id: string;
  title: string;
  description?: string;
  duration?: number;
  questions: Question[];
}

interface TakeQuizDialogProps {
  isOpen: boolean;
  onClose: () => void;
  test: Test | null;
  onSuccess?: (marks: number) => void;
}

export function TakeQuizDialog({
  isOpen,
  onClose,
  test,
  onSuccess,
}: TakeQuizDialogProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [viewedSummary, setViewedSummary] = useState(false);
  const [score, setScore] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen && test) {
      if (test.duration) {
        setTimeLeft(test.duration * 60);
      } else {
        setTimeLeft(null);
      }
      setCurrentQuestionIndex(0);
      setAnswers({});
      setViewedSummary(false);
      setScore(null);
    }
  }, [isOpen, test]);

  const submitQuiz = useCallback(async () => {
    if (!test || !test.questions || test.questions.length === 0) return;
    setIsSubmitting(true);
    try {
      let correctCount = 0;
      test.questions.forEach((q, idx) => {
        if (answers[idx] === q.correctAnswer) {
          correctCount++;
        }
      });

      const finalScore = Math.round(
        (correctCount / test.questions.length) * 100
      );

      // Send to backend
      await api.post(`/students/tests/${test._id}/submit`, {
        marks: finalScore,
        answers: Object.entries(answers).map(([idx, ans]) => ({
          questionIndex: parseInt(idx),
          selectedOption: ans,
        })),
      });

      setScore(finalScore);
      setViewedSummary(true);
      if (onSuccess) onSuccess(finalScore);
      toast.success("Quiz submitted successfully!");
    } catch (error) {
      console.error("Submit quiz error:", error);
      toast.error("Failed to submit quiz.");
    } finally {
      setIsSubmitting(false);
    }
  }, [test, answers, onSuccess]);

  const handleAutoSubmit = useCallback(() => {
    toast.warning("Time's up! Submitting your answers.");
    submitQuiz();
  }, [submitQuiz]);

  useEffect(() => {
    if (timeLeft === 0 && !viewedSummary && !isSubmitting) {
      handleAutoSubmit();
    }
    if (timeLeft && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => (prev !== null ? prev - 1 : null));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [timeLeft, viewedSummary, isSubmitting, handleAutoSubmit]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  if (!test) return null;

  const hasQuestions = test.questions && test.questions.length > 0;
  const currentQuestion = hasQuestions
    ? test.questions[currentQuestionIndex]
    : null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex justify-between items-center pr-8">
            <DialogTitle className="text-xl font-bold">
              {test.title}
            </DialogTitle>
            {timeLeft !== null && !viewedSummary && (
              <div
                className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-bold ${
                  timeLeft < 60
                    ? "bg-red-100 text-red-600 animate-pulse"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                <Clock className="h-4 w-4" />
                {formatTime(timeLeft)}
              </div>
            )}
          </div>
        </DialogHeader>

        {!viewedSummary ? (
          <div className="py-6 space-y-6">
            {!hasQuestions ? (
              <div className="py-12 flex flex-col items-center text-center space-y-4">
                <AlertCircle className="h-12 w-12 text-amber-500" />
                <h3 className="text-lg font-bold">No Questions Found</h3>
                <p className="text-slate-500">
                  This quiz doesn&apos;t have any questions yet. Please contact
                  your tutor.
                </p>
              </div>
            ) : (
              currentQuestion && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-maatram-blue uppercase tracking-wider">
                      Question {currentQuestionIndex + 1} of{" "}
                      {test.questions.length}
                    </span>
                  </div>
                  <div className="text-lg font-medium">
                    <MathText text={currentQuestion.questionText} />
                  </div>
                  <RadioGroup
                    value={answers[currentQuestionIndex]?.toString()}
                    onValueChange={(val) =>
                      setAnswers((prev) => ({
                        ...prev,
                        [currentQuestionIndex]: parseInt(val),
                      }))
                    }
                    className="space-y-3"
                  >
                    {currentQuestion.options.map((opt, idx) => (
                      <div
                        key={idx}
                        className="flex items-center space-x-2 border rounded-lg p-3 hover:bg-slate-50 transition-colors"
                      >
                        <RadioGroupItem
                          value={idx.toString()}
                          id={`option-${idx}`}
                        />
                        <Label
                          htmlFor={`option-${idx}`}
                          className="flex-grow cursor-pointer"
                        >
                          <MathText text={opt} />
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              )
            )}
          </div>
        ) : (
          <div className="py-8 text-center space-y-6">
            <div className="text-5xl font-bold text-maatram-blue">{score}%</div>
            <p className="text-slate-600">
              You have completed the quiz. Your score has been recorded.
            </p>
          </div>
        )}

        <div className="flex justify-between pt-4 border-t">
          {!viewedSummary && (
            <>
              <Button
                variant="outline"
                onClick={() =>
                  setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))
                }
                disabled={currentQuestionIndex === 0}
              >
                Previous
              </Button>
              {currentQuestionIndex === (test.questions?.length || 0) - 1 ? (
                <Button onClick={submitQuiz} disabled={isSubmitting}>
                  {isSubmitting ? "Submitting..." : "Submit Quiz"}
                </Button>
              ) : (
                <Button
                  onClick={() =>
                    setCurrentQuestionIndex((prev) =>
                      Math.min((test.questions?.length || 0) - 1, prev + 1)
                    )
                  }
                  disabled={
                    !hasQuestions ||
                    currentQuestionIndex === (test.questions?.length || 0) - 1
                  }
                >
                  Next
                </Button>
              )}
            </>
          )}
          {viewedSummary && (
            <Button onClick={onClose} className="w-full">
              Close
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
