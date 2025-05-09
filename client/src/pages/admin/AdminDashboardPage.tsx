import { useEffect, useState } from "react";
import { useLocation, Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { 
  Clock, 
  LogOut, 
  Plus, 
  Users,
  Clipboard,
  RefreshCw
} from "lucide-react";
import { adminLogout, createGameRoom, getActiveGameRooms } from "@/lib/api";

type GameRoom = {
  id: number;
  code: string;
  createdAt: Date;
  expiresAt: Date;
};

const AdminDashboardPage = () => {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  
  const [gameRooms, setGameRooms] = useState<GameRoom[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expiryHours, setExpiryHours] = useState(24);
  const [isCreating, setIsCreating] = useState(false);
  
  // Load active game rooms
  const fetchGameRooms = async () => {
    setIsLoading(true);
    try {
      const response = await getActiveGameRooms();
      
      if (response.success) {
        // Date 객체로 변환하여 저장
        setGameRooms(response.gameRooms.map(room => ({
          ...room,
          createdAt: new Date(room.createdAt),
          expiresAt: new Date(room.expiresAt)
        })));
      } else {
        // 오류 메시지 표시
        toast({
          title: "방 목록 로딩 실패",
          description: response.error || "게임방 정보를 불러올 수 없습니다.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching game rooms:", error);
      toast({
        title: "네트워크 오류",
        description: "게임방 정보를 불러올 수 없습니다. 네트워크 연결을 확인해주세요.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchGameRooms();
  }, []);
  
  const handleCreateRoom = async () => {
    if (expiryHours < 1 || expiryHours > 72) {
      toast({
        title: "입력 오류",
        description: "유효 기간은 1~72시간 사이로 입력해주세요.",
        variant: "destructive",
      });
      return;
    }
    
    setIsCreating(true);
    
    try {
      // API를 통해 실제 DB에 방 생성
      const response = await createGameRoom({ expiryHours });
      
      if (response.success) {
        // 방 생성 성공 시 성공 메시지 표시
        toast({
          title: "게임방 생성 완료",
          description: `게임방 코드: ${response.gameRoom.code}`,
        });
        
        // 방 목록 새로고침으로 DB 최신 상태 유지
        await fetchGameRooms();
        
        // 방금 생성한 방이 목록에 있는지 확인 (추가 보장)
        const createdRoom = response.gameRoom;
        const roomExists = gameRooms.some(room => room.code === createdRoom.code);
        
        if (!roomExists) {
          // DB에서 가져온 목록에 없으면 로컬에 추가 (임시 대응)
          setGameRooms(prevRooms => [
            ...prevRooms,
            {
              id: createdRoom.id,
              code: createdRoom.code,
              createdAt: new Date(),
              expiresAt: new Date(createdRoom.expiresAt)
            }
          ]);
        }
      } else {
        // 오류 메시지를 사용자에게 명확하게 표시
        toast({
          title: "게임방 생성 실패",
          description: response.error || "게임방을 생성할 수 없습니다.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error creating game room:", error);
      toast({
        title: "네트워크 오류",
        description: "서버와 통신 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };
  
  const handleLogout = async () => {
    try {
      const response = await adminLogout();
      
      if (response.success) {
        toast({
          title: "로그아웃 성공",
          description: "관리자 계정에서 로그아웃되었습니다.",
        });
        navigate("/manage");
      } else {
        toast({
          title: "로그아웃 실패",
          description: response.error || "로그아웃 중 오류가 발생했습니다.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Logout error:", error);
      toast({
        title: "오류 발생",
        description: "로그아웃 중 오류가 발생했습니다. 다시 시도해주세요.",
        variant: "destructive",
      });
    }
  };
  
  // Format date to locale string
  const formatDate = (date: Date) => {
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">관리자 대시보드</h1>
        <Button variant="outline" size="sm" onClick={handleLogout}>
          <LogOut className="h-4 w-4 mr-2" />
          로그아웃
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>새 게임방 생성</CardTitle>
          <CardDescription>
            새로운 게임방을 생성하고 코드를 참가자들에게 공유하세요.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="space-y-2 flex-1">
              <Label htmlFor="expiryHours">유효 기간 (시간)</Label>
              <Input
                id="expiryHours"
                type="number"
                min="1"
                max="72"
                value={expiryHours}
                onChange={(e) => setExpiryHours(parseInt(e.target.value) || 24)}
                disabled={isCreating}
              />
            </div>
            <div className="flex items-end">
              <Button 
                onClick={handleCreateRoom} 
                disabled={isCreating || isLoading}
                className="mb-0.5"
              >
                <Plus className="h-4 w-4 mr-2" />
                생성하기
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">활성 게임방 목록</h2>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={fetchGameRooms}
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          새로고침
        </Button>
      </div>
      
      {gameRooms.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-gray-500">
            {isLoading ? '게임방 정보를 불러오는 중...' : '활성화된 게임방이 없습니다.'}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {gameRooms.map((room) => (
            <Card key={room.id} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="bg-primary text-primary-foreground p-2 rounded-md">
                        <Clipboard className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold">{room.code}</h3>
                        <div className="flex items-center text-sm text-gray-500">
                          <Clock className="h-3.5 w-3.5 mr-1" />
                          {formatDate(room.expiresAt)} 만료
                        </div>
                      </div>
                    </div>
                    <Link href={`/manage/rooms/${room.id}`}>
                      <Button>
                        <Users className="h-4 w-4 mr-2" />
                        관리하기
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminDashboardPage;