import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import QuestionForm from "@/components/QuestionForm";
import { submitAnswers } from "@/lib/api";

const QuestionPage = () => {
  const params = useParams<{ gameSessionId: string; userId: string }>();
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  
  const [currentQuestion, setCurrentQuestion] = useState(1);
  const [answers, setAnswers] = useState<Array<{ myAnswer: string; partnerGuess: string }>>(
    Array(10).fill({ myAnswer: "", partnerGuess: "" })
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [partnerName, setPartnerName] = useState<string>("");
  
  // Extract params
  const gameSessionId = parseInt(params.gameSessionId);
  const userId = parseInt(params.userId);
  
  // Get query params
  const searchParams = new URLSearchParams(window.location.search);
  const userName = searchParams.get("userName") || "";
  const partnerNameParam = searchParams.get("partnerName") || "";
  
  // Set partner name
  useEffect(() => {
    if (partnerNameParam) {
      setPartnerName(partnerNameParam);
    }
  }, [partnerNameParam]);
  
  // Check for invalid params
  useEffect(() => {
    if (isNaN(gameSessionId) || isNaN(userId)) {
      toast({
        title: "잘못된 접근",
        description: "올바른 경로로 접근해주세요.",
        variant: "destructive",
      });
      navigate("/");
    }
  }, [gameSessionId, userId, toast, navigate]);
  
  const handleAnswerChange = (myAnswer: string, partnerGuess: string) => {
    const updatedAnswers = [...answers];
    updatedAnswers[currentQuestion - 1] = { myAnswer, partnerGuess };
    setAnswers(updatedAnswers);
  };
  
  const goToPrevQuestion = () => {
    if (currentQuestion > 1) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };
  
  const goToNextQuestion = () => {
    // Validate inputs
    const currentAnswerPair = answers[currentQuestion - 1];
    if (!currentAnswerPair.myAnswer.trim() || !currentAnswerPair.partnerGuess.trim()) {
      toast({
        title: "입력 필요",
        description: "답변을 모두 입력해주세요.",
        variant: "destructive",
      });
      return;
    }
    
    if (currentQuestion < 10) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      // Last question, submit all answers
      handleSubmitAnswers();
    }
  };
  
  const handleSubmitAnswers = async () => {
    // Validate all answers
    for (let i = 0; i < answers.length; i++) {
      if (!answers[i].myAnswer.trim() || !answers[i].partnerGuess.trim()) {
        toast({
          title: "입력 오류",
          description: `문제 ${i + 1}의 답변을 모두 입력해주세요.`,
          variant: "destructive",
        });
        setCurrentQuestion(i + 1);
        return;
      }
    }
    
    setIsSubmitting(true);
    
    try {
      const result = await submitAnswers({
        gameSessionId,
        userId,
        answers,
      });
      
      if (result.success) {
        // Navigate to waiting page
        navigate(`/game/${gameSessionId}/${userId}/waiting`);
      } else {
        toast({
          title: "제출 오류",
          description: result.error || "답변을 제출할 수 없습니다.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "제출 오류",
        description: "답변을 제출할 수 없습니다. 다시 시도해주세요.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="fade-in">
      <div className="mb-6 text-center">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm text-gray-500">내 이름: {userName}</div>
          <div className="text-sm text-gray-500">짝궁 이름: {partnerName}</div>
        </div>
        <h2 className="text-xl font-bold">문제 {currentQuestion}/10</h2>
        <Progress 
          value={currentQuestion * 10}
          className="h-2 mt-3"
        />
      </div>
      
      <QuestionForm 
        currentQuestion={currentQuestion}
        myAnswer={answers[currentQuestion - 1]?.myAnswer || ""}
        partnerGuess={answers[currentQuestion - 1]?.partnerGuess || ""}
        onChange={handleAnswerChange}
      />
      
      <div className="flex gap-3 mt-8">
        <Button
          variant="outline"
          className="flex-1"
          onClick={goToPrevQuestion}
          disabled={currentQuestion === 1 || isSubmitting}
        >
          이전
        </Button>
        
        <Button
          className="flex-1"
          onClick={goToNextQuestion}
          disabled={isSubmitting}
        >
          {currentQuestion < 10 ? "다음" : "제출하기"}
        </Button>
      </div>
    </div>
  );
};

export default QuestionPage;
