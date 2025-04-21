import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { GameResult } from "@shared/schema";
import { getGameResults } from "@/lib/api";
import ResultCard from "@/components/ResultCard";
import RankingModal from "@/components/RankingModal";

const ResultsPage = () => {
  const params = useParams<{ roomCode: string; gameSessionId: string; userId: string }>();
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  
  const [results, setResults] = useState<GameResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRankingOpen, setIsRankingOpen] = useState(false);
  
  // Extract params
  const roomCode = params.roomCode || "";
  const gameSessionId = parseInt(params.gameSessionId);
  const userId = parseInt(params.userId);
  
  // 테스트 모드 설정
  const testMode = true; // 테스트 목적으로 항상 true로 설정
  
  // Fetch results
  useEffect(() => {
    const fetchResults = async () => {
      if (!roomCode || isNaN(gameSessionId) || isNaN(userId)) {
        toast({
          title: "잘못된 접근",
          description: "올바른 경로로 접근해주세요.",
          variant: "destructive",
        });
        navigate("/");
        return;
      }
      
      try {
        const response = await getGameResults(gameSessionId, userId, testMode);
        
        if (response.success && response.status === "complete") {
          setResults(response.results || null);
        } else {
          if (response.status === "waiting") {
            // Still waiting for partner to complete
            navigate(`/room/${roomCode}/game/${gameSessionId}/${userId}/waiting`);
          } else {
            // Error occurred
            toast({
              title: "오류 발생",
              description: response.error || "결과를 확인할 수 없습니다.",
              variant: "destructive",
            });
            navigate("/");
          }
        }
      } catch (error) {
        console.error("Error fetching results:", error);
        toast({
          title: "오류 발생",
          description: "결과를 확인할 수 없습니다. 네트워크 연결을 확인해주세요.",
          variant: "destructive",
        });
        navigate("/");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchResults();
  }, [roomCode, gameSessionId, userId, toast, navigate]);
  
  const handleRestart = () => {
    navigate("/");
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-60">
        <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-primary border-solid"></div>
      </div>
    );
  }
  
  if (!results) {
    return null;
  }
  
  return (
    <div className="fade-in">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-3">결과 확인</h2>
        <p className="text-lg mb-1">
          <span className="font-bold">{results.partnerName}</span>님의 답변을 맞춘 결과입니다
        </p>
        <div className="mt-3 bg-green-50 p-3 rounded-lg border border-green-200 inline-block">
          <p className="text-gray-700">
            총 <span className="font-bold text-primary text-xl">{results.correctCount}</span>개의 
            짝궁 답변을 맞추었습니다!
          </p>
          <p className="text-xs text-gray-500 mt-1">랭킹에서 순위를 확인해보세요</p>
        </div>
      </div>
      
      <div className="space-y-4 mb-8">
        {results.answerPairs.map((pair) => (
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
          className="w-full"
          onClick={handleRestart}
        >
          다시 시작하기
        </Button>
      </div>

      {/* 랭킹 모달 */}
      <RankingModal
        open={isRankingOpen}
        onOpenChange={setIsRankingOpen}
        gameRoomId={results.gameRoomId}
      />
    </div>
  );
};

export default ResultsPage;
