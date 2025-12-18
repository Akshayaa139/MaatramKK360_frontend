"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Link2, Users, Trophy, Wand2, Lightbulb, CheckCircle2, XCircle } from "lucide-react";
import api from "@/lib/api";
import { toast } from "@/components/ui/use-toast";
import { motion, AnimatePresence } from "framer-motion";

type ProfileResponse = {
  user: {
    name: string;
    email: string;
    phone?: string;
  };
  student: {
    grade: string;
    subjects: string[];
    performance?: any[];
  };
};

type ClassItem = {
  id: string;
  title?: string;
  subject?: string;
  schedule?: { day?: string; startTime?: string; endTime?: string };
  sessionLink?: string;
};

const QUOTES = [
  "The only way to do great work is to love what you do. – Steve Jobs",
  "Believe you can and you're halfway there. – Theodore Roosevelt",
  "Success is not final, failure is not fatal: it is the courage to continue that counts. – Winston Churchill",
  "Learning never exhausts the mind. – Leonardo da Vinci",
  "Live as if you were to die tomorrow. Learn as if you were to live forever. – Mahatma Gandhi",
  "It always seems impossible until it's done. – Nelson Mandela",
  "Education is the most powerful weapon which you can use to change the world. – Nelson Mandela"
];

interface QuizQuestion {
  question: string;
  choices: string[];
  correctIndex?: number;
  subject?: string;
}

export default function StudentDashboard() {
  const { data: session } = useSession();
  const accessToken = (session as any)?.accessToken;
  const [profileData, setProfileData] = useState<ProfileResponse | null>(null);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [progress, setProgress] = useState<{
    attendanceRate?: number;
    testAveragePercent?: number;
    compositeGrowth?: number;
  } | null>(null);

  // Quiz State
  const [quickQuiz, setQuickQuiz] = useState<QuizQuestion[] | null>(null);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [showResult, setShowResult] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [loadingQuiz, setLoadingQuiz] = useState(true);

  // New States for Validation & Points
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [dailyPoints, setDailyPoints] = useState(0);

  // Quote State
  const [quote, setQuote] = useState("");

  useEffect(() => {
    // Random quote on mount
    setQuote(QUOTES[Math.floor(Math.random() * QUOTES.length)]);

    const headers = accessToken
      ? { Authorization: `Bearer ${accessToken}` }
      : undefined;

    const load = async () => {
      try {
        const [p, c, prog] = await Promise.all([
          api.get("/students/profile", { headers }),
          api.get("/students/classes", { headers }),
          api.get("/students/progress", { headers }),
        ]);
        setProfileData(p.data);
        setClasses(Array.isArray(c.data) ? c.data : []);
        setProgress(prog.data || null);

        // Quick quiz
        loadQuiz(p.data?.student?.subjects || []);
      } catch (e) {
        console.error("Dashboard load error", e);
        setLoadingQuiz(false);
      }
    };
    if (accessToken) load();
  }, [accessToken]);

  const loadQuiz = async (subjects: string[]) => {
    setLoadingQuiz(true);
    setShowResult(false);
    setCurrentQuestionIdx(0);
    setQuizAnswers({});
    setDailyPoints(prev => prev); // Keep points from previous sessions? Or reset? Let's keep for now.
    // Actually reset per "session" of quiz, but maybe show total per day if I had backend support.

    setIsCorrect(null);
    setSelectedAnswer(null);

    try {
      // Pass ALL subjects joined by comma for combined quiz
      const subjectParam = subjects.join(",");

      const endpoint = subjects.length > 0
        ? `/flashcards/quick?n=5&subject=${encodeURIComponent(subjectParam)}`
        : "/flashcards/quick?n=5";

      const q = await api.get(endpoint);
      const questions = Array.isArray(q.data?.questions) ? q.data.questions : [];
      setQuickQuiz(questions);
    } catch (e) {
      console.error("Quiz load error", e);
    } finally {
      setLoadingQuiz(false);
    }
  };

  const handleAnswerSelect = (choiceIndex: number) => {
    if (selectedAnswer !== null) return; // Prevent double click

    const currentQ = quickQuiz ? quickQuiz[currentQuestionIdx] : null;
    if (!currentQ) return;

    setSelectedAnswer(choiceIndex);
    const correct = currentQ.correctIndex !== undefined ? currentQ.correctIndex === choiceIndex : true; // Default to true if no index provided (fallback)
    setIsCorrect(correct);

    if (correct) {
      setDailyPoints(prev => prev + 10);
      toast({
        title: "Correct!",
        description: "+10 Points",
        className: "bg-green-100 border-green-500 text-green-900"
      });
    } else {
      toast({
        title: "Incorrect",
        description: "Keep trying!",
        variant: "destructive"
      });
    }

    setQuizAnswers(prev => ({ ...prev, [currentQuestionIdx]: choiceIndex }));

    setTimeout(() => {
      if (quickQuiz && currentQuestionIdx < quickQuiz.length - 1) {
        setCurrentQuestionIdx(prev => prev + 1);
        setSelectedAnswer(null);
        setIsCorrect(null);
      } else {
        setShowResult(true);
      }
    }, 1500); // 1.5s delay to see feedback
  };

  const submitQuiz = async () => {
    try {
      const answers = Object.keys(quizAnswers).map((k) => ({
        questionIndex: Number(k),
        selectedIndex: quizAnswers[Number(k)],
      }));
      const headers = accessToken
        ? { Authorization: `Bearer ${accessToken}` }
        : undefined;
      await api.post(
        "/flashcards/responses",
        { answers },
        { headers }
      );
      toast({
        title: "Challenge Completed!",
        description: `You earned ${dailyPoints} points today!`,
      });
      // specific logic: reload quiz
      const subjects = profileData?.student?.subjects || [];
      loadQuiz(subjects);
    } catch (e) {
      toast({
        title: "Error",
        description: "Failed to save quiz.",
        variant: "destructive"
      });
    }
  };

  const user = profileData?.user;
  const student = profileData?.student;

  const currentQ = quickQuiz && quickQuiz[currentQuestionIdx];

  return (
    <div className="space-y-6">
      {/* Motivational Quote Banner */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-xl p-6 text-white shadow-lg relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Lightbulb size={100} />
        </div>
        <div className="relative z-10">
          <h3 className="font-semibold text-indigo-100 flex items-center gap-2 mb-2">
            <Wand2 className="h-4 w-4" /> Daily Inspiration
          </h3>
          <p className="text-xl md:text-2xl font-bold italic leading-relaxed">
            "{quote}"
          </p>
        </div>
      </motion.div>

      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-1 space-y-6">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Student Dashboard</h2>
            <p className="text-sm text-muted-foreground">
              Welcome back, {user?.name || session?.user?.name || "Student"}
            </p>
          </div>

          {/* Verification Pending Banner */}
          {!profileData?.student && (
            <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-md shadow-sm">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-amber-700">
                    <span className="font-bold">Application Under Review:</span> Your account is currently pending tele-verification.
                    Full access to classes, quizzes, and specific subject materials will be enabled once your application is verified by an admin.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Profile Card */}
          {profileData && (
            <Card className="border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-500" />
                  My Profile
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="space-y-3">
                    <div className="flex justify-between border-b pb-1">
                      <span className="text-muted-foreground">Name</span>
                      <span className="font-medium">{user?.name}</span>
                    </div>
                    <div className="flex justify-between border-b pb-1">
                      <span className="text-muted-foreground">Email</span>
                      <span className="font-medium">{user?.email}</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between border-b pb-1">
                      <span className="text-muted-foreground">Grade</span>
                      <span className="font-medium">{student?.grade}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block mb-2">Enrolled Subjects</span>
                      <div className="flex flex-wrap gap-2">
                        {(student?.subjects || []).map((s) => (
                          <Badge key={s} variant="secondary" className="px-2 py-1 bg-blue-100 text-blue-700 hover:bg-blue-200">
                            {s}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Activity/Progress Snapshot */}
          {progress && (
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                  <div className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Attendance</div>
                  <div className="text-2xl font-bold text-green-600">{progress.attendanceRate ?? 0}%</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                  <div className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Test Avg</div>
                  <div className="text-2xl font-bold text-blue-600">{progress.testAveragePercent ?? 0}%</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                  <div className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Growth</div>
                  <div className="text-2xl font-bold text-violet-600">{progress.compositeGrowth ?? 0}%</div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Gaming Flashcard Section */}
        <div className="w-full md:w-1/3">
          <Card className="h-full border-2 border-indigo-100 bg-slate-50 relative overflow-hidden flex flex-col">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  Daily Challenge
                </span>
                <Badge className="bg-amber-500 hover:bg-amber-600 text-white shadow-sm shimmer">
                  {dailyPoints} Pts
                </Badge>
              </CardTitle>
              <CardDescription>
                Boost your knowledge with quick flashcards!
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              {loadingQuiz ? (
                <div className="flex flex-col items-center justify-center h-64 space-y-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                  <p className="text-sm text-muted-foreground">Loading your challenge...</p>
                </div>
              ) : quickQuiz && quickQuiz.length > 0 ? (
                <div className="flex-1 flex flex-col min-h-[300px]">
                  {!showResult && currentQ ? (
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={currentQuestionIdx}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="flex-1 flex flex-col"
                      >
                        <div className="flex justify-between items-center mb-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          <span>Question {currentQuestionIdx + 1} of {quickQuiz.length}</span>
                          {currentQ.subject && <Badge variant="outline" className="text-[10px] h-5">{currentQ.subject}</Badge>}
                        </div>

                        <div className="mb-6">
                          <h4 className="text-lg font-medium leading-snug text-slate-800">
                            {currentQ.question}
                          </h4>
                        </div>

                        <div className="space-y-3 mt-auto">
                          {currentQ.choices.map((choice, idx) => {
                            const isSelected = selectedAnswer === idx;
                            const isCorrectAnswer = currentQ.correctIndex === idx;
                            const showCorrect = selectedAnswer !== null && isCorrectAnswer;
                            const showWrong = isSelected && !isCorrectAnswer;

                            let borderClass = 'border-white bg-white hover:border-indigo-200';
                            let textClass = 'text-slate-700';
                            let icon = <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs border bg-slate-100 text-slate-500 border-slate-200`}>{String.fromCharCode(65 + idx)}</div>;

                            if (showCorrect) {
                              borderClass = 'border-green-500 bg-green-50 shadow-md';
                              textClass = 'text-green-700 font-medium';
                              icon = <CheckCircle2 className="w-6 h-6 text-green-600" />;
                            } else if (showWrong) {
                              borderClass = 'border-red-500 bg-red-50 shadow-md';
                              textClass = 'text-red-700 font-medium';
                              icon = <XCircle className="w-6 h-6 text-red-600" />;
                            } else if (selectedAnswer === null) {
                              // Default hover state handled in className
                            }

                            return (
                              <button
                                key={idx}
                                onClick={() => handleAnswerSelect(idx)}
                                disabled={selectedAnswer !== null}
                                className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-200 relative ${borderClass} shadow-sm`}
                              >
                                <div className="flex items-center gap-3">
                                  {icon}
                                  <span className={textClass}>{choice}</span>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </motion.div>
                    </AnimatePresence>
                  ) : (
                    <motion.div
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-6"
                    >
                      <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center relative">
                        <Trophy className="h-10 w-10 text-yellow-600" />
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.5 }}
                          className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full border-2 border-white"
                        >
                          +{dailyPoints}
                        </motion.div>
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-slate-800">Challenge Complete!</h3>
                        <p className="text-muted-foreground mt-2">
                          You earned <strong>{dailyPoints} points</strong> today.
                        </p>
                      </div>
                      <Button size="lg" className="w-full bg-indigo-600 hover:bg-indigo-700" onClick={submitQuiz}>
                        Save Progress
                      </Button>
                    </motion.div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No quizzes available for your subjects right now.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>My Classes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {classes.map((cls) => (
              <div key={cls.id} className="p-4 border rounded-xl hover:shadow-md transition-all bg-white">
                <div className="font-semibold text-lg text-slate-800">{cls.title || "Class"}</div>
                <div className="flex flex-col gap-2 mt-3">
                  <div className="text-sm text-muted-foreground flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span>{cls.subject || ""}</span>
                  </div>
                  <div className="text-sm text-muted-foreground flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>{cls.schedule?.day || ""} • {cls.schedule?.startTime} - {cls.schedule?.endTime}</span>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t">
                  {cls.sessionLink ? (
                    <Button variant="outline" size="sm" className="w-full" asChild>
                      <a
                        href={cls.sessionLink}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Link2 className="h-3 w-3 mr-2" /> Join Class
                      </a>
                    </Button>
                  ) : (
                    <Badge variant="secondary" className="w-full justify-center py-1">No link available</Badge>
                  )}
                </div>
              </div>
            ))}
            {classes.length === 0 && (
              <div className="col-span-full text-center py-8 text-muted-foreground italic">
                No active classes found.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
