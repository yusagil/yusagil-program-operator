import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getActiveGameRooms, getGameRoomUsers, getGameRoomResults } from "@/lib/api";

type User = {
  id: number;
  name: string;
  seatNumber: number;
};

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
  const roomId = parseInt(params.roomId);
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  
  const [roomCode, setRoomCode] = useState<string>("");
  const [users, setUsers] = useState<User[]>([]);
  const [results, setResults] = useState<Result[]>([]);
  const [isLoadingRoom, setIsLoadingRoom] = useState(true);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [isLoadingResults, setIsLoadingResults] = useState(true);
  
  // Load room details, users, and results
  useEffect(() => {
    if (isNaN(roomId)) {
      toast({
        title: "오류",
        description: "유효하지 않은 게임방 ID입니다",
        variant: "destructive"
      });
      navigate("/admin/dashboard");
      return;
    }
    
    // Load room details
    const loadRoomDetails = async () => {
      try {
        setIsLoadingRoom(true);
        const response = await getActiveGameRooms();
        
        if (response.success) {
          const room = response.gameRooms.find(r => r.id === roomId);
          if (room) {
            setRoomCode(room.code);
          } else {
            toast({
              title: "오류",
              description: "게임방을 찾을 수 없습니다",
              variant: "destructive"
            });
            navigate("/admin/dashboard");
          }
        } else {
          toast({
            title: "오류",
            description: response.error || "게임방 정보를 가져올 수 없습니다",
            variant: "destructive"
          });
        }
      } catch (error) {
        console.error("Error loading room details:", error);
        toast({
          title: "오류",
          description: "게임방 정보를 가져오는 중 오류가 발생했습니다",
          variant: "destructive"
        });
      } finally {
        setIsLoadingRoom(false);
      }
    };
    
    // Load users in the room
    const loadUsers = async () => {
      try {
        setIsLoadingUsers(true);
        const response = await getGameRoomUsers(roomId);
        
        if (response.success) {
          setUsers(response.users);
        } else {
          toast({
            title: "오류",
            description: response.error || "사용자 목록을 가져올 수 없습니다",
            variant: "destructive"
          });
        }
      } catch (error) {
        console.error("Error loading users:", error);
        toast({
          title: "오류",
          description: "사용자 목록을 가져오는 중 오류가 발생했습니다",
          variant: "destructive"
        });
      } finally {
        setIsLoadingUsers(false);
      }
    };
    
    // Load results in the room
    const loadResults = async () => {
      try {
        setIsLoadingResults(true);
        const response = await getGameRoomResults(roomId);
        
        if (response.success) {
          setResults(response.results);
        } else {
          toast({
            title: "오류",
            description: response.error || "결과를 가져올 수 없습니다",
            variant: "destructive"
          });
        }
      } catch (error) {
        console.error("Error loading results:", error);
        toast({
          title: "오류",
          description: "결과를 가져오는 중 오류가 발생했습니다",
          variant: "destructive"
        });
      } finally {
        setIsLoadingResults(false);
      }
    };
    
    loadRoomDetails();
    loadUsers();
    loadResults();
  }, [roomId]);
  
  const handleGoBack = () => {
    navigate("/admin/dashboard");
  };
  
  const refreshData = () => {
    setIsLoadingUsers(true);
    setIsLoadingResults(true);
    Promise.all([
      getGameRoomUsers(roomId),
      getGameRoomResults(roomId)
    ]).then(([usersResponse, resultsResponse]) => {
      if (usersResponse.success) {
        setUsers(usersResponse.users);
      }
      if (resultsResponse.success) {
        setResults(resultsResponse.results);
      }
    }).catch(error => {
      console.error("Error refreshing data:", error);
      toast({
        title: "오류",
        description: "데이터를 새로고침하는 중 오류가 발생했습니다",
        variant: "destructive"
      });
    }).finally(() => {
      setIsLoadingUsers(false);
      setIsLoadingResults(false);
    });
  };
  
  return (
    <div className="fade-in">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">게임방 관리</h1>
        <Button variant="outline" size="sm" onClick={handleGoBack}>
          뒤로
        </Button>
      </div>
      
      {isLoadingRoom ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-primary border-solid mx-auto mb-2"></div>
          <p className="text-gray-500">게임방 정보를 불러오는 중...</p>
        </div>
      ) : (
        <>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-xl">게임방 정보</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="text-3xl font-bold mb-2">{roomCode}</div>
                <p className="text-gray-500">참가자들에게 이 코드를 알려주세요</p>
              </div>
            </CardContent>
            <CardFooter className="justify-center">
              <Button 
                variant="ghost" 
                onClick={refreshData}
                className="text-sm"
              >
                데이터 새로고침
              </Button>
            </CardFooter>
          </Card>
          
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-xl">참가자 목록</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingUsers ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-primary border-solid mx-auto mb-2"></div>
                  <p className="text-gray-500">참가자 목록을 불러오는 중...</p>
                </div>
              ) : users.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-gray-500">아직 참가자가 없습니다.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>자리 번호</TableHead>
                      <TableHead>이름</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.sort((a, b) => a.seatNumber - b.seatNumber).map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>{user.seatNumber}</TableCell>
                        <TableCell>{user.name}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">게임 결과</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingResults ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-primary border-solid mx-auto mb-2"></div>
                  <p className="text-gray-500">결과를 불러오는 중...</p>
                </div>
              ) : results.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-gray-500">아직 완료된 게임이 없습니다.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>자리</TableHead>
                      <TableHead>이름</TableHead>
                      <TableHead>짝궁</TableHead>
                      <TableHead className="text-right">점수</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results.sort((a, b) => a.seatNumber - b.seatNumber).map((result) => (
                      <TableRow key={result.userId}>
                        <TableCell>{result.seatNumber}</TableCell>
                        <TableCell>{result.name}</TableCell>
                        <TableCell>
                          {result.partnerName} ({result.partnerSeatNumber}번)
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="font-medium">
                            {result.correctCount}/{result.totalQuestions}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default AdminGameRoomPage;