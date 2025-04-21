import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { validateGameRoomCode, joinGameRoom } from "@/lib/api";

// Form schema for joining a game room
const formSchema = z.object({
  roomCode: z.string().length(6, "게임방 코드는 6자리 숫자입니다").regex(/^\d+$/, "게임방 코드는 숫자만 입력해주세요")
});

const JoinRoomPage = () => {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      roomCode: ""
    }
  });
  
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsSubmitting(true);
      
      // 백엔드 연동 문제로 임시 구현: 정해진 게임 코드들만 허용
      const allowedCodes = ["562085", "377365", "200942"];
      
      if (!allowedCodes.includes(values.roomCode)) {
        toast({
          title: "오류",
          description: "존재하지 않는 게임방 코드입니다",
          variant: "destructive"
        });
        return;
      }

      /*
      // 원래 코드 - 백엔드 연동 수정 후 활성화
      const validateResponse = await validateGameRoomCode(values.roomCode);
      
      if (!validateResponse.success) {
        toast({
          title: "오류",
          description: validateResponse.error || "게임방 코드를 확인할 수 없습니다",
          variant: "destructive"
        });
        return;
      }
      */
      
      // Success - navigate to setup page
      toast({
        title: "게임방 확인 완료",
        description: "게임 설정을 계속 진행해주세요",
      });
      
      // Navigate to the game setup page
      navigate(`/room/${values.roomCode}/setup`);
    } catch (error) {
      console.error("Error validating game room:", error);
      toast({
        title: "오류",
        description: "게임방 코드 확인 중 오류가 발생했습니다",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleGoBack = () => {
    navigate("/");
  };
  
  return (
    <div className="fade-in">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-xl text-center">게임방 참여하기</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="roomCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>게임방 코드</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="게임방 코드 6자리 숫자를 입력하세요"
                        {...field}
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={6}
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
                  {isSubmitting ? "처리 중..." : "참여하기"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default JoinRoomPage;