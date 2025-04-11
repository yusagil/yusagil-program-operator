import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { ArrowRight } from "lucide-react";
import { startGame } from "@/lib/api";

const HomePage = () => {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  
  const [myName, setMyName] = useState<string>("");
  const [mySeatNumber, setMySeatNumber] = useState<string>("");
  const [partnerName, setPartnerName] = useState<string>("");
  const [partnerSeatNumber, setPartnerSeatNumber] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const handleStartGame = async () => {
    if (!myName || !partnerName) {
      toast({
        title: "입력 오류",
        description: "본인과 짝궁의 이름을 모두 입력해주세요.",
        variant: "destructive",
      });
      return;
    }
    
    if (!mySeatNumber || !partnerSeatNumber) {
      toast({
        title: "입력 오류",
        description: "본인과 짝궁의 자리 번호를 모두 선택해주세요.",
        variant: "destructive",
      });
      return;
    }

    if (mySeatNumber === partnerSeatNumber) {
      toast({
        title: "입력 오류",
        description: "본인과 짝궁의 자리 번호는 달라야 합니다.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const result = await startGame({
        myName: myName,
        mySeatNumber: parseInt(mySeatNumber),
        partnerName: partnerName,
        partnerSeatNumber: parseInt(partnerSeatNumber),
      });

      if (result.success) {
        navigate(`/game/${result.gameSession.id}/${result.gameSession.userId}?seatNumber=${result.gameSession.seatNumber}`);
      } else {
        toast({
          title: "오류 발생",
          description: result.error || "게임을 시작할 수 없습니다.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "오류 발생",
        description: "게임을 시작할 수 없습니다. 다시 시도해주세요.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fade-in">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold mb-6">내 짝궁 맞춰봐</h1>
        <p className="text-gray-600 mb-8">본인과 짝궁의 이름과 자리 번호를 입력한 후 시작해주세요</p>
        
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="mb-4">
              <Label htmlFor="my-name" className="block text-sm font-medium text-gray-700 mb-1">
                내 이름
              </Label>
              <Input 
                id="my-name" 
                value={myName} 
                onChange={(e) => setMyName(e.target.value)}
                placeholder="이름 입력" 
                className="w-full bg-gray-100"
              />
            </div>
            
            <div className="mb-4">
              <Label htmlFor="my-seat" className="block text-sm font-medium text-gray-700 mb-1">
                내 자리 번호
              </Label>
              <Select value={mySeatNumber} onValueChange={setMySeatNumber}>
                <SelectTrigger id="my-seat" className="w-full bg-gray-100">
                  <SelectValue placeholder="선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((num) => (
                    <SelectItem key={`my-${num}`} value={num.toString()}>
                      {num}번
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="mb-4">
              <Label htmlFor="partner-name" className="block text-sm font-medium text-gray-700 mb-1">
                짝궁 이름
              </Label>
              <Input 
                id="partner-name" 
                value={partnerName} 
                onChange={(e) => setPartnerName(e.target.value)}
                placeholder="짝궁 이름 입력" 
                className="w-full bg-gray-100"
              />
            </div>
            
            <div>
              <Label htmlFor="partner-seat" className="block text-sm font-medium text-gray-700 mb-1">
                짝궁 자리 번호
              </Label>
              <Select value={partnerSeatNumber} onValueChange={setPartnerSeatNumber}>
                <SelectTrigger id="partner-seat" className="w-full bg-gray-100">
                  <SelectValue placeholder="선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((num) => (
                    <SelectItem key={`partner-${num}`} value={num.toString()}>
                      {num}번
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
        
        <Button 
          className="w-full"
          onClick={handleStartGame}
          disabled={isLoading}
        >
          게임 시작하기
          {!isLoading && <ArrowRight className="ml-1 h-5 w-5" />}
        </Button>
      </div>
    </div>
  );
};

export default HomePage;
