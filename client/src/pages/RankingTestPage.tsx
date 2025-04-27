import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import RankingModal from "@/components/RankingModal";
import FortuneModal from "@/components/FortuneModal";
import ResultCard from "@/components/ResultCard";
import { GameResult } from "@shared/schema";

const RankingTestPage = () => {
  const [, navigate] = useLocation();
  const [isRankingOpen, setIsRankingOpen] = useState(false);
  const [isFortuneOpen, setIsFortuneOpen] = useState(false);
  
  // 테스트용 데이터
  const mockResult: GameResult = {
    gameRoomId: 1,
    gameSessionId: 1,
    userId: 1,
    partnerId: 2,
    userName: "김유사",
    partnerName: "이길",
    userSeatNumber: 3,
    partnerSeatNumber: 8,
    answerPairs: [
      { questionNumber: 1, myAnswer: "애플", partnerGuess: "삼성", actualPartnerAnswer: "애플", isCorrect: true },
      { questionNumber: 2, myAnswer: "여름", partnerGuess: "가을", actualPartnerAnswer: "여름", isCorrect: true },
      { questionNumber: 3, myAnswer: "개", partnerGuess: "고양이", actualPartnerAnswer: "개", isCorrect: true },
      { questionNumber: 4, myAnswer: "바다", partnerGuess: "산", actualPartnerAnswer: "강", isCorrect: false },
      { questionNumber: 5, myAnswer: "치킨", partnerGuess: "피자", actualPartnerAnswer: "피자", isCorrect: true },
      { questionNumber: 6, myAnswer: "축구", partnerGuess: "농구", actualPartnerAnswer: "야구", isCorrect: false },
      { questionNumber: 7, myAnswer: "영화", partnerGuess: "노래", actualPartnerAnswer: "영화", isCorrect: true },
      { questionNumber: 8, myAnswer: "서울", partnerGuess: "부산", actualPartnerAnswer: "부산", isCorrect: true },
      { questionNumber: 9, myAnswer: "파란색", partnerGuess: "빨간색", actualPartnerAnswer: "초록색", isCorrect: false },
      { questionNumber: 10, myAnswer: "봄", partnerGuess: "여름", actualPartnerAnswer: "봄", isCorrect: true },
    ],
    correctCount: 7,
  };

  return (
    <div className="fade-in">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-3">결과 확인</h2>
        <p className="text-lg mb-1">
          <span className="font-bold">{mockResult.partnerName}</span>님의 답변을 맞춘 결과입니다
        </p>
        <div className="mt-3 bg-green-50 p-3 rounded-lg border border-green-200 inline-block">
          <p className="text-gray-700">
            총 <span className="font-bold text-primary text-xl">{mockResult.correctCount}</span>개의 
            짝궁 답변을 맞추었습니다!
          </p>
          <p className="text-xs text-gray-500 mt-1">랭킹에서 순위를 확인해보세요</p>
        </div>
      </div>
      
      <div className="space-y-4 mb-8">
        {mockResult.answerPairs.map((pair) => (
          <ResultCard key={pair.questionNumber} answerPair={pair} />
        ))}
      </div>
      
      <div className="space-y-4">
        <Button 
          className="w-full"
          variant="outline"
          onClick={() => setIsRankingOpen(true)}
        >
          랭킹 보기
        </Button>

        <Button 
          className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
          onClick={() => setIsFortuneOpen(true)}
        >
          오늘의 운세 뽑기 ➝
        </Button>

        <Button 
          className="w-full"
          onClick={() => navigate("/")}
        >
          다시 시작하기
        </Button>
      </div>

      {/* 랭킹 모달 */}
      <RankingModal
        open={isRankingOpen}
        onOpenChange={setIsRankingOpen}
        gameRoomId={1} // 임의의 게임룸 ID
      />
      
      {/* 운세 모달 */}
      <FortuneModal
        open={isFortuneOpen}
        onOpenChange={setIsFortuneOpen}
      />
    </div>
  );
};

export default RankingTestPage;