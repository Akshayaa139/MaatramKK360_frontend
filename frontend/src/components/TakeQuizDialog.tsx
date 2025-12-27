"use client";

import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Clock, CheckCircle2, AlertCircle } from "lucide-react";
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
    }, [timeLeft, viewedSummary, isSubmitting]);

    const handleAutoSubmit = () => {
        toast.warning("Time's up! Submitting your answers.");
        submitQuiz();
    };

    const submitQuiz = async () => {
        if (!test || !test.questions || test.questions.length === 0) return;
        setIsSubmitting(true);
        try {
            let correctCount = 0;
            test.questions.forEach((q, idx) => {
                if (answers[idx] === q.correctAnswer) {
                    correctCount++;
                }
            });

            const finalScore = Math.round((correctCount / test.questions.length) * 100);

            // Send to backend
            await api.post(`/students/tests/${test._id}/submit`, {
                marks: finalScore,
                answers: Object.entries(answers).map(([idx, ans]) => ({
                    questionIndex: parseInt(idx),
                    selectedOption: ans
                }))
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
    };

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, "0")}`;
    };

    if (!test) return null;

    const hasQuestions = test.questions && test.questions.length > 0;
    const currentQuestion = hasQuestions ? test.questions[currentQuestionIndex] : null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <div className="flex justify-between items-center pr-8">
                        <DialogTitle className="text-xl font-bold">{test.title}</DialogTitle>
                        {timeLeft !== null && !viewedSummary && (
                            <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-bold ${timeLeft < 60 ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-slate-100 text-slate-600'}`}>
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
                                <p className="text-slate-500">This quiz doesn't have any questions yet. Please contact your tutor.</p>
                            </div>
                        ) : (
                            currentQuestion && (
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-bold text-maatram-blue uppercase tracking-wider">
                                            Question {currentQuestionIndex + 1} of {test.questions.length}
                                        </span>
                                        <div className="h-2 w-32 bg-slate-100 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-maatram-blue transition-all duration-300"
                                                style={{ width: `${((currentQuestionIndex + 1) / test.questions.length) * 100}%` }}
                                            />
                                        </div>
                                    </div>

                                    <h3 className="text-lg font-medium text-slate-900">
                                        <MathText text={currentQuestion.questionText} />
                                    </h3>

                                    <RadioGroup
                                        value={answers[currentQuestionIndex]?.toString()}
                                        onValueChange={(val) => setAnswers({ ...answers, [currentQuestionIndex]: parseInt(val) })}
                                        className="space-y-3"
                                    >
                                        {currentQuestion.options.map((opt, idx) => (
                                            <div key={idx} className={`flex items-center space-x-2 p-3 rounded-lg border-2 transition-all ${answers[currentQuestionIndex] === idx ? 'border-maatram-blue bg-blue-50' : 'border-slate-100 hover:border-slate-200'}`}>
                                                <RadioGroupItem value={idx.toString()} id={`opt-${idx}`} />
                                                <Label htmlFor={`opt-${idx}`} className="flex-grow cursor-pointer font-medium p-1">
                                                    <span className="mr-2 text-slate-400 font-bold">{String.fromCharCode(65 + idx)}.</span>
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
                    <div className="py-12 flex flex-col items-center text-center space-y-4">
                        <div className="h-20 w-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                            <CheckCircle2 className="h-10 w-10" />
                        </div>
                        <h2 className="text-2xl font-bold">Quiz Completed!</h2>
                        <div className="text-5xl font-black text-maatram-blue">
                            {score}%
                        </div>
                        <p className="text-slate-500 max-w-sm">
                            Your results have been recorded and sent to your tutor. Great job on finishing the test!
                        </p>
                    </div>
                )}

                <DialogFooter className="mt-4 border-t pt-4">
                    {!viewedSummary ? (
                        <div className="flex justify-between w-full">
                            <Button
                                variant="outline"
                                onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
                                disabled={currentQuestionIndex === 0 || !hasQuestions}
                            >
                                Previous
                            </Button>

                            {currentQuestionIndex === (test.questions?.length || 0) - 1 ? (
                                <Button
                                    onClick={submitQuiz}
                                    disabled={isSubmitting || !hasQuestions || Object.keys(answers).length < (test.questions?.length || 0)}
                                    className="bg-green-600 hover:bg-green-700"
                                >
                                    {isSubmitting ? "Submitting..." : "Finish Quiz"}
                                </Button>
                            ) : (
                                <Button
                                    onClick={() => setCurrentQuestionIndex(currentQuestionIndex + 1)}
                                    disabled={answers[currentQuestionIndex] === undefined}
                                >
                                    Next Question
                                </Button>
                            )}
                        </div>
                    ) : (
                        <Button onClick={onClose} className="w-full bg-slate-900">Close</Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
