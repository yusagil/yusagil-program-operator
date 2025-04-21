import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { getGameResults } from "@/lib/api";

const WaitingPage = () => {
  const params = useParams<{ gameSessionId: string; userId: string }>();
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  
  const [isPolling, setIsPolling] = useState(true);
  const [userName, setUserName] = useState<string>("");
  const [partnerName, setPartnerName] = useState<string>("");
  const [userSeatNumber, setUserSeatNumber] = useState<number>(0);
  const [partnerSeatNumber, setPartnerSeatNumber] = useState<number>(0);
  
  // Extract params
  const gameSessionId = parseInt(params.gameSessionId);
  const userId = parseInt(params.userId);
  
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
          // 테스트 모드 파라미터 추가
          const response = await getGameResults(gameSessionId, userId, true);
          
          if (response.success) {
            if (response.status === "complete") {
              // Results are ready, navigate to results page
              setIsPolling(false);
              // 경로 수정
              const roomCode = new URLSearchParams(window.location.search).get("roomCode") || "";
              navigate(`/room/${roomCode}/game/${gameSessionId}/${userId}/results`);
            }
            // If status is "waiting", keep polling
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
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-primary border-solid mb-6"></div>
          <h2 className="text-xl font-bold mb-3">답변 제출 완료!</h2>
          <p className="text-gray-600 mb-4">
            <span className="font-bold">{partnerName}</span>님이 아직 제출 중입니다.
          </p>
          <p className="text-gray-600">잠시만 기다려주세요...</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default WaitingPage;
