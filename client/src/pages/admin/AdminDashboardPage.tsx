import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { adminLogout, createGameRoom, getActiveGameRooms } from "@/lib/api";

// Date formatting helper
function formatDate(date: Date) {
  return new Date(date).toLocaleString('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

const AdminDashboardPage = () => {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const [gameRooms, setGameRooms] = useState<Array<{
    id: number;
    code: string;
    createdAt: Date;
    expiresAt: Date;
  }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  
  // Fetch active game rooms
  const fetchGameRooms = async () => {
    try {
      setIsLoading(true);
      const response = await getActiveGameRooms();
      
      if (response.success) {
        setGameRooms(response.gameRooms);
      } else {
        toast({
          title: "오류",
          description: response.error || "게임방 목록을 가져올 수 없습니다",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error fetching game rooms:", error);
      toast({
        title: "오류",
        description: "게임방 목록을 가져오는 중 오류가 발생했습니다",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Create a new game room
  const handleCreateGameRoom = async () => {
    try {
      setIsCreating(true);
      
      const response = await createGameRoom({
        expiryHours: 24 // Default to 24 hours
      });
      
      if (response.success) {
        toast({
          title: "성공",
          description: `게임방이 생성되었습니다. 코드: ${response.gameRoom.code}`
        });
        
        // Refresh the game room list
        fetchGameRooms();
      } else {
        toast({
          title: "오류",
          description: response.error || "게임방을 생성할 수 없습니다",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error creating game room:", error);
      toast({
        title: "오류",
        description: "게임방 생성 중 오류가 발생했습니다",
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };
  
  // Handle logout
  const handleLogout = async () => {
    try {
      const response = await adminLogout();
      
      if (response.success) {
        toast({
          title: "로그아웃 성공",
          description: "로그아웃되었습니다."
        });
        
        navigate("/");
      } else {
        toast({
          title: "오류",
          description: response.error || "로그아웃할 수 없습니다",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error logging out:", error);
      toast({
        title: "오류",
        description: "로그아웃 처리 중 오류가 발생했습니다",
        variant: "destructive"
      });
    }
  };
  
  // View game room details
  const handleViewGameRoom = (id: number) => {
    navigate(`/admin/rooms/${id}`);
  };
  
  // Load game rooms on mount
  useEffect(() => {
    fetchGameRooms();
  }, []);
  
  return (
    <div className="fade-in">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">관리자 대시보드</h1>
        <Button variant="outline" size="sm" onClick={handleLogout}>
          로그아웃
        </Button>
      </div>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-xl">게임방 관리</CardTitle>
        </CardHeader>
        <CardContent>
          <Button 
            className="w-full"
            onClick={handleCreateGameRoom}
            disabled={isCreating}
          >
            {isCreating ? "생성 중..." : "새 게임방 생성"}
          </Button>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">활성 게임방 목록</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-primary border-solid mx-auto mb-2"></div>
              <p className="text-gray-500">게임방 목록을 불러오는 중...</p>
            </div>
          ) : gameRooms.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-gray-500">활성 게임방이 없습니다.</p>
            </div>
          ) : (
            <div className="divide-y">
              {gameRooms.map((room) => (
                <div key={room.id} className="p-4">
                  <div className="flex justify-between items-center mb-2">
                    <div className="font-semibold">게임방 코드: {room.code}</div>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleViewGameRoom(room.id)}
                    >
                      상세보기
                    </Button>
                  </div>
                  <div className="text-sm text-gray-500">
                    <div>생성: {formatDate(room.createdAt)}</div>
                    <div>만료: {formatDate(room.expiresAt)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button 
            variant="ghost" 
            onClick={fetchGameRooms} 
            className="text-sm"
            disabled={isLoading}
          >
            새로고침
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default AdminDashboardPage;