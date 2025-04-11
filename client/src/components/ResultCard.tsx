import { Card, CardContent } from "@/components/ui/card";
import { AnswerPair } from "@shared/schema";
import { CheckCircle2, XCircle } from "lucide-react";

interface ResultCardProps {
  answerPair: AnswerPair;
}

const ResultCard = ({ answerPair }: ResultCardProps) => {
  const { 
    questionNumber, 
    myAnswer, 
    partnerGuess, 
    actualPartnerAnswer, 
    isCorrect 
  } = answerPair;

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-medium">문제 {questionNumber}</h3>
          {isCorrect ? (
            <span className="text-green-500">
              <CheckCircle2 className="h-5 w-5" />
            </span>
          ) : (
            <span className="text-red-500">
              <XCircle className="h-5 w-5" />
            </span>
          )}
        </div>
        
        <div className="text-sm mb-1">
          <span className="text-gray-500">내 답변:</span> 
          <span className="ml-1">{myAnswer}</span>
        </div>
        
        <div className="text-sm mb-1">
          <span className="text-gray-500">내가 예상한 짝궁 답변:</span> 
          <span className="ml-1">{partnerGuess}</span>
        </div>
        
        <div className="text-sm">
          <span className="text-gray-500">짝궁의 실제 답변:</span> 
          <span 
            className={`ml-1 ${!isCorrect ? 'text-red-500 font-medium' : ''}`}
          >
            {actualPartnerAnswer}
          </span>
        </div>
      </CardContent>
    </Card>
  );
};

export default ResultCard;
