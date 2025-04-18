import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { adminLogin } from "@/lib/api";

// Form schema for admin login
const formSchema = z.object({
  username: z.string().min(1, "사용자명을 입력해주세요"),
  password: z.string().min(1, "비밀번호를 입력해주세요")
});

const AdminLoginPage = () => {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      password: ""
    }
  });
  
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsSubmitting(true);
      
      const response = await adminLogin({
        username: values.username,
        password: values.password
      });
      
      if (response.success) {
        toast({
          title: "로그인 성공",
          description: "관리자 대시보드로 이동합니다."
        });
        
        // Navigate to the admin dashboard
        navigate("/admin/dashboard");
      } else {
        toast({
          title: "로그인 실패",
          description: response.error || "사용자명 또는 비밀번호가 잘못되었습니다",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error logging in:", error);
      toast({
        title: "오류",
        description: "로그인 처리 중 오류가 발생했습니다",
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
          <CardTitle className="text-xl text-center">관리자 로그인</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>사용자명</FormLabel>
                    <FormControl>
                      <Input placeholder="사용자명을 입력하세요" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>비밀번호</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="비밀번호를 입력하세요" {...field} />
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
                  {isSubmitting ? "로그인 중..." : "로그인"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
      
      <div className="text-center text-sm text-gray-500">
        <p>기본 관리자 계정: admin / admin123</p>
      </div>
    </div>
  );
};

export default AdminLoginPage;