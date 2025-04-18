import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { startGame } from "@/lib/api";

// Form schema for game setup
const formSchema = z.object({
  myName: z.string().min(1, "이름을 입력해주세요"),
  mySeatNumber: z.coerce.number().int().min(1).max(12),
  partnerSeatNumber: z.coerce.number().int().min(1).max(12)
}).refine(data => data.mySeatNumber !== data.partnerSeatNumber, {
  message: "짝궁과 자리 번호가 같을 수 없습니다",
  path: ["partnerSeatNumber"]
});

const GameSetupPage = () => {
  const params = useParams<{ roomCode: string }>();
  const roomCode = params.roomCode || "";
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      myName: "",
      mySeatNumber: 1,
      partnerSeatNumber: 2
    }
  });
  
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsSubmitting(true);
      
      const response = await startGame({
        roomCode,
        myName: values.myName,
        mySeatNumber: values.mySeatNumber,
        partnerSeatNumber: values.partnerSeatNumber
      });
      
      if (response.success) {
        const { gameSession } = response;
        
        // Navigate to the question page
        navigate(`/room/${roomCode}/game/${gameSession.id}/${gameSession.userId}`);
      } else {
        toast({
          title: "오류",
          description: response.error || "게임을 시작할 수 없습니다",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error starting game:", error);
      toast({
        title: "오류",
        description: "게임 시작 중 오류가 발생했습니다",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleGoBack = () => {
    navigate("/join");
  };
  
  return (
    <div className="fade-in">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-xl text-center">게임 설정</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-gray-500 mb-4">
            게임방 코드: <span className="font-bold">{roomCode}</span>
          </p>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="myName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>내 이름</FormLabel>
                    <FormControl>
                      <Input placeholder="내 이름을 입력하세요" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="mySeatNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>내 자리 번호 (1-12)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min={1}
                        max={12}
                        placeholder="내 자리 번호를 입력하세요"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="partnerSeatNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>짝궁 자리 번호 (1-12)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min={1}
                        max={12}
                        placeholder="짝궁의 자리 번호를 입력하세요"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={handleGoBack}
                  disabled={isSubmitting}
                >
                  뒤로
                </Button>
                
                <Button 
                  type="submit" 
                  className="flex-1"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "처리 중..." : "게임 시작"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default GameSetupPage;