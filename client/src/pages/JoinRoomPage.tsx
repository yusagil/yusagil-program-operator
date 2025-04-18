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
  roomCode: z.string().min(1, "게임방 코드를 입력해주세요"),
  name: z.string().min(1, "이름을 입력해주세요"),
  seatNumber: z.coerce.number().int().min(1).max(12)
});

const JoinRoomPage = () => {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      roomCode: "",
      name: "",
      seatNumber: 1
    }
  });
  
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsSubmitting(true);
      
      // First validate the room code
      const validateResponse = await validateGameRoomCode(values.roomCode);
      
      if (!validateResponse.success) {
        toast({
          title: "오류",
          description: validateResponse.error || "게임방 코드를 확인할 수 없습니다",
          variant: "destructive"
        });
        return;
      }
      
      // Then join the room
      const joinResponse = await joinGameRoom({
        roomCode: values.roomCode,
        name: values.name,
        seatNumber: values.seatNumber
      });
      
      if (joinResponse.success) {
        toast({
          title: "성공",
          description: "게임방에 참여했습니다!"
        });
        
        // Navigate to the game setup page
        navigate(`/room/${values.roomCode}/setup`);
      } else {
        toast({
          title: "오류",
          description: joinResponse.error || "게임방에 참여할 수 없습니다",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error joining game room:", error);
      toast({
        title: "오류",
        description: "게임방 참여 중 오류가 발생했습니다",
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
                        placeholder="게임방 코드를 입력하세요"
                        {...field}
                        value={field.value.toUpperCase()}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>이름</FormLabel>
                    <FormControl>
                      <Input placeholder="내 이름을 입력하세요" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="seatNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>자리 번호 (1-12)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min={1}
                        max={12}
                        placeholder="자리 번호를 입력하세요"
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