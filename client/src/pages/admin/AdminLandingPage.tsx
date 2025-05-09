import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocation } from "wouter";

const AdminLandingPage = () => {
  const [location, navigate] = useLocation();
  
  return (
    <div className="fade-in text-center">
      <h1 className="text-3xl font-bold mb-6">내 짝궁 맞춰봐</h1>
      <h2 className="text-xl font-medium mb-6 text-gray-600">관리자 포털</h2>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">관리자 접속</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-4">
            관리자는 게임방을 생성하고 결과를 확인할 수 있습니다.
          </p>
          <Button 
            className="w-full"
            onClick={() => navigate("/manage/login")}
          >
            관리자 로그인
          </Button>
        </CardContent>
      </Card>
      
      <div className="mt-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/")}
        >
          ← 메인으로 돌아가기
        </Button>
      </div>
    </div>
  );
};

export default AdminLandingPage;