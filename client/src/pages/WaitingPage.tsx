import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { getGameResults } from "@/lib/api";

const WaitingPage = () => {
  const params = useParams<{ roomCode: string; gameSessionId: string; userId: string }>();
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  
  const [isPolling, setIsPolling] = useState(true);
  const [userName, setUserName] = useState<string>("");
  const [partnerName, setPartnerName] = useState<string>("");
  const [userSeatNumber, setUserSeatNumber] = useState<number>(0);
  const [partnerSeatNumber, setPartnerSeatNumber] = useState<number>(0);
  
  // Extract params
  const roomCode = params.roomCode || "";
  const gameSessionId = parseInt(params.gameSessionId);
  const userId = parseInt(params.userId);
  
  // 대기 상태 관련
  const [waitingMessage, setWaitingMessage] = useState("잠시만 기다려주세요...");
  const [partnerProgress, setPartnerProgress] = useState(0);
  
  // Get user and partner details from query params
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const userNameParam = searchParams.get("userName");
    const partnerNameParam = searchParams.get("partnerName");
    const userSeatParam = searchParams.get("userSeatNumber");
    const partnerSeatParam = searchParams.get("partnerSeatNumber");
    
    if (userNameParam) setUserName(userNameParam);
    if (partnerNameParam) setPartnerName(partnerNameParam);
    if (userSeatParam) setUserSeatNumber(parseInt(userSeatParam));
    if (partnerSeatParam) setPartnerSeatNumber(parseInt(partnerSeatParam));
  }, []);
  
  // Check for invalid params
  useEffect(() => {
    if (isNaN(gameSessionId) || isNaN(userId)) {
      toast({
        title: "잘못된 접근",
        description: "올바른 경로로 접근해주세요.",
        variant: "destructive",
      });
      navigate("/");
      return;
    }
    
    let intervalId: NodeJS.Timeout;
    
    // Start polling for results
    if (isPolling) {
      const checkResults = async () => {
        try {
          // 테스트 모드를 사용하지 않고 실제 파트너 답변을 기다림
          const testMode = false; // 자동으로 파트너 답변을 생성하지 않음
          const response = await getGameResults(gameSessionId, userId, testMode);
          
          if (response.success) {
            if (response.status === "complete") {
              // Results are ready, navigate to results page
              setIsPolling(false);
              // URL 경로 파라미터 이용
              navigate(`/room/${roomCode}/game/${gameSessionId}/${userId}/results`);
            } else if (response.status === "waiting") {
              // 대기 메시지 업데이트
              const waitingCount = Math.floor(Math.random() * 3) + 1;
              setWaitingMessage(`잠시만 기다려주세요${'.'.repeat(waitingCount)}`);
              
              // 진행 상황 업데이트 (서버에서 제공할 경우)
              const progressData = (response as any).progress;
              if (progressData && typeof progressData.completed === 'number') {
                setPartnerProgress(progressData.completed);
              }
              
              // 계속 대기 (polling 유지)
            }
          } else {
            // Error occurred
            toast({
              title: "오류 발생",
              description: response.error || "결과를 확인할 수 없습니다.",
              variant: "destructive",
            });
            setIsPolling(false);
          }
        } catch (error) {
          console.error("Error checking results:", error);
          toast({
            title: "오류 발생",
            description: "결과를 확인할 수 없습니다. 네트워크 연결을 확인해주세요.",
            variant: "destructive",
          });
          setIsPolling(false);
        }
      };
      
      // Initial check
      checkResults();
      
      // Setup interval for polling
      intervalId = setInterval(checkResults, 3000);
    }
    
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [gameSessionId, userId, isPolling, toast, navigate]);
  
  return (
    <div className="fade-in text-center">
      <Card className="mb-8">
        <CardContent className="p-8 flex flex-col items-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-purple-500 border-solid mb-6"></div>
          <h2 className="text-xl font-bold mb-3">답변 제출 완료!</h2>
          <p className="text-gray-600 mb-4">
            <span className="font-bold text-purple-600">{partnerName || "짝궁"}</span>님이 아직 답변을 완료하지 않았습니다.
          </p>
          <div className="p-4 bg-purple-50 rounded-lg border border-purple-100 mb-4">
            <p className="text-gray-800 mb-2 font-medium">결과 확인을 위해 필요한 사항:</p>
            <ul className="text-left text-gray-700 space-y-2">
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✓</span> <span>내가 답변 제출 완료</span>
              </li>
              <li className="flex items-center">
                <span className="text-yellow-500 mr-2">⌛</span> <span>짝궁의 답변 제출 대기 중</span>
              </li>
            </ul>
          </div>
          
          {partnerProgress > 0 && (
            <div className="w-full mb-4">
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">짝궁의 답변 진행률</span>
                <span className="text-sm font-medium text-purple-600">{partnerProgress}/10</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-purple-600 h-2.5 rounded-full transition-all duration-500 ease-in-out" 
                  style={{ width: `${(partnerProgress / 10) * 100}%` }}
                ></div>
              </div>
            </div>
          )}
          
          <p className="text-gray-600 font-medium animate-pulse">{waitingMessage}</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default WaitingPage;
