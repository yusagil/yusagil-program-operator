import { useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface QuestionFormProps {
  currentQuestion: number;
  myAnswer: string;
  partnerGuess: string;
  onChange: (myAnswer: string, partnerGuess: string) => void;
}

const QuestionForm = ({ 
  currentQuestion, 
  myAnswer, 
  partnerGuess, 
  onChange 
}: QuestionFormProps) => {
  const myAnswerRef = useRef<HTMLInputElement>(null);
  const partnerGuessRef = useRef<HTMLInputElement>(null);
  
  // Focus on my answer input when question changes
  useEffect(() => {
    if (myAnswerRef.current && !myAnswer) {
      myAnswerRef.current.focus();
    }
  }, [currentQuestion, myAnswer]);
  
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="mb-6">
          <Label 
            htmlFor="my-answer"
            className="block text-base font-medium text-gray-800 mb-2"
          >
            내 답변
          </Label>
          <Input
            id="my-answer"
            ref={myAnswerRef}
            type="text"
            className="w-full p-3 bg-gray-100"
            placeholder="답변을 입력하세요"
            value={myAnswer}
            onChange={(e) => onChange(e.target.value, partnerGuess)}
          />
        </div>
        
        <div>
          <Label 
            htmlFor="partner-guess" 
            className="block text-base font-medium text-gray-800 mb-2"
          >
            내가 예상하는 짝궁의 답변
          </Label>
          <Input
            id="partner-guess"
            ref={partnerGuessRef}
            type="text"
            className="w-full p-3 bg-gray-100"
            placeholder="짝궁이 어떻게 답변할지 예상해 입력하세요"
            value={partnerGuess}
            onChange={(e) => onChange(myAnswer, e.target.value)}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default QuestionForm;
