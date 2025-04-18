import { useEffect, useState } from "react";
import { useParams, useLocation, Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft,
  Users,
  TrendingUp,
  RefreshCw 
} from "lucide-react";
import { getGameRoomUsers, getGameRoomResults } from "@/lib/api";

// User type
type User = {
  id: number;
  name: string;
  seatNumber: number;
};

// Result type
type Result = {
  userId: number;
  name: string;
  seatNumber: number;
  partnerId: number;
  partnerName: string;
  partnerSeatNumber: number;
  correctCount: number;
  totalQuestions: number;
};

const AdminGameRoomPage = () => {
  const params = useParams<{ roomId: string }>();
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  
  const roomId = parseInt(params.roomId);
  
  const [users, setUsers] = useState<User[]>([]);
  const [results, setResults] = useState<Result[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [isLoadingResults, setIsLoadingResults] = useState(true);
  
  // Load game room users
  const fetchUsers = async () => {
    if (isNaN(roomId)) {
      toast({
        title: "잘못된 접근",
        description: "올바른 게임방 ID를 입력해주세요.",
        variant: "destructive",
      });
      navigate("/admin/dashboard");
      return;
    }
    
    setIsLoadingUsers(true);
    
    try {
      const response = await getGameRoomUsers(roomId);
      
      if (response.success) {
        setUsers(response.users);
      } else {
        toast({
          title: "오류 발생",
          description: response.error || "참가자 정보를 불러올 수 없습니다.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      toast({
        title: "오류 발생",
        description: "참가자 정보를 불러올 수 없습니다. 네트워크 연결을 확인해주세요.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingUsers(false);
    }
  };
  
  // Load game results
  const fetchResults = async () => {
    if (isNaN(roomId)) return;
    
    setIsLoadingResults(true);
    
    try {
      const response = await getGameRoomResults(roomId);
      
      if (response.success) {
        setResults(response.results);
      } else {
        toast({
          title: "오류 발생",
          description: response.error || "게임 결과를 불러올 수 없습니다.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching results:", error);
      toast({
        title: "오류 발생",
        description: "게임 결과를 불러올 수 없습니다. 네트워크 연결을 확인해주세요.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingResults(false);
    }
  };
  
  // Load all data
  useEffect(() => {
    fetchUsers();
    fetchResults();
  }, [roomId]);
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Link href="/admin/dashboard">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">게임방 관리</h1>
        </div>
      </div>
      
      <Tabs defaultValue="participants">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="participants">
            <Users className="h-4 w-4 mr-2" />
            참가자 목록
          </TabsTrigger>
          <TabsTrigger value="results">
            <TrendingUp className="h-4 w-4 mr-2" />
            게임 결과
          </TabsTrigger>
        </TabsList>
        
        {/* Participants Tab */}
        <TabsContent value="participants" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">참가자 목록</h2>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={fetchUsers}
              disabled={isLoadingUsers}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingUsers ? 'animate-spin' : ''}`} />
              새로고침
            </Button>
          </div>
          
          {users.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center text-gray-500">
                {isLoadingUsers ? '참가자 정보를 불러오는 중...' : '아직 참가자가 없습니다.'}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {users.map((user) => (
                <Card key={user.id}>
                  <CardContent className="p-4 flex justify-between items-center">
                    <div className="flex items-center space-x-4">
                      <Badge variant="outline" className="h-8 w-8 flex items-center justify-center rounded-full">
                        {user.seatNumber}
                      </Badge>
                      <div>
                        <h3 className="font-medium">{user.name}</h3>
                        <p className="text-sm text-gray-500">자리 번호: {user.seatNumber}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        
        {/* Results Tab */}
        <TabsContent value="results" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">게임 결과</h2>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={fetchResults}
              disabled={isLoadingResults}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingResults ? 'animate-spin' : ''}`} />
              새로고침
            </Button>
          </div>
          
          {results.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center text-gray-500">
                {isLoadingResults ? '결과를 불러오는 중...' : '아직 게임 결과가 없습니다.'}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {results.map((result) => (
                <Card key={`${result.userId}-${result.partnerId}`}>
                  <CardContent className="p-4">
                    <div className="flex flex-col space-y-2">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className="flex-shrink-0">
                            {result.seatNumber}번
                          </Badge>
                          <h3 className="font-medium">{result.name}</h3>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className="bg-primary">
                            {result.correctCount}/{result.totalQuestions}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="text-sm text-gray-500 flex justify-between">
                        <div>
                          <span className="font-medium">파트너:</span> {result.partnerName} ({result.partnerSeatNumber}번)
                        </div>
                        <div>
                          <span className="font-medium">정답률:</span> {Math.round((result.correctCount / result.totalQuestions) * 100)}%
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminGameRoomPage;