import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocation } from "wouter";

const WelcomePage = () => {
  const [location, navigate] = useLocation();
  
  return (
    <div className="fade-in text-center">
      <h1 className="text-3xl font-bold mb-6">내 짝궁 맞춰봐</h1>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">게임 참여하기</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">
            바에서 짝궁과 함께 진행하는 질문 게임입니다.<br />
            상대방의 답변을 얼마나 잘 맞출 수 있는지 확인해보세요!
          </p>
          <Button 
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            onClick={() => navigate("/join")}
          >
            게임방 입장하기
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default WelcomePage;