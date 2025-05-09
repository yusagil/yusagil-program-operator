import { useEffect, useState } from "react";
import { useLocation, Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Clock, 
  LogOut, 
  Plus,
  PlusCircle,
  MinusCircle, 
  Users,
  Clipboard,
  RefreshCw,
  Trash
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
  
  // 팀 설정 관련 상태
  const [totalParticipants, setTotalParticipants] = useState(2);
  const [teamCount, setTeamCount] = useState(1);
  const [activeTab, setActiveTab] = useState("basic");
  const [teamConfig, setTeamConfig] = useState<Record<string, number[]>>({
    "Team 1": [1, 2]
  });
  const [partnerConfig, setPartnerConfig] = useState<Record<string, number>>({
    "1": 2,
    "2": 1
  });
  
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
  
  // 총 인원 수가 변경되면 팀 구성 및 짝궁 구성을 초기화
  useEffect(() => {
    // 기본적으로 모든 인원을 한 팀에 배정
    const defaultTeam = Array.from({ length: totalParticipants }, (_, i) => i + 1);
    
    setTeamConfig({
      "Team 1": defaultTeam
    });
    setTeamCount(1);
    
    // 기본 짝궁 구성: 원형으로 연결 (1->2, 2->3, ..., n->1)
    const newPartnerConfig: Record<string, number> = {};
    for (let i = 1; i <= totalParticipants; i++) {
      const nextIndex = i === totalParticipants ? 1 : i + 1;
      newPartnerConfig[i.toString()] = nextIndex;
    }
    setPartnerConfig(newPartnerConfig);
  }, [totalParticipants]);
  
  // 팀 추가
  const addTeam = () => {
    if (teamCount >= 10) {
      toast({
        title: "팀 추가 제한",
        description: "최대 10개의 팀까지 생성 가능합니다.",
        variant: "destructive",
      });
      return;
    }
    
    const newTeamName = `Team ${teamCount + 1}`;
    setTeamConfig(prev => ({
      ...prev,
      [newTeamName]: []
    }));
    setTeamCount(prev => prev + 1);
  };
  
  // 팀 삭제
  const removeTeam = (teamName: string) => {
    if (teamCount <= 1) {
      toast({
        title: "팀 삭제 제한",
        description: "최소 1개의 팀이 필요합니다.",
        variant: "destructive",
      });
      return;
    }
    
    // 삭제된 팀 구성원들을 첫 번째 팀으로 이동
    const firstTeamName = Object.keys(teamConfig)[0];
    const membersToBeMoved = teamConfig[teamName] || [];
    
    const newTeamConfig = { ...teamConfig };
    delete newTeamConfig[teamName];
    
    if (firstTeamName && firstTeamName !== teamName) {
      newTeamConfig[firstTeamName] = [
        ...newTeamConfig[firstTeamName],
        ...membersToBeMoved
      ];
    }
    
    setTeamConfig(newTeamConfig);
    setTeamCount(prev => prev - 1);
  };
  
  // 참가자를 팀에 추가
  const addMemberToTeam = (teamName: string, seatNumber: number) => {
    // 이미 다른 팀에 있는지 확인
    let alreadyInTeam = false;
    let currentTeam = "";
    
    Object.entries(teamConfig).forEach(([team, members]) => {
      if (members.includes(seatNumber)) {
        alreadyInTeam = true;
        currentTeam = team;
      }
    });
    
    if (alreadyInTeam && currentTeam !== teamName) {
      // 기존 팀에서 제거
      const newTeamConfig = { ...teamConfig };
      newTeamConfig[currentTeam] = newTeamConfig[currentTeam].filter(m => m !== seatNumber);
      
      // 새 팀에 추가
      newTeamConfig[teamName] = [...newTeamConfig[teamName], seatNumber].sort((a, b) => a - b);
      
      setTeamConfig(newTeamConfig);
    } else if (!alreadyInTeam) {
      // 새 팀에 추가
      setTeamConfig(prev => ({
        ...prev,
        [teamName]: [...prev[teamName], seatNumber].sort((a, b) => a - b)
      }));
    }
  };
  
  // 참가자를 팀에서 제거
  const removeMemberFromTeam = (teamName: string, seatNumber: number) => {
    setTeamConfig(prev => ({
      ...prev,
      [teamName]: prev[teamName].filter(m => m !== seatNumber)
    }));
  };
  
  // 짝궁 변경
  const changePartner = (seatNumber: number, partnerId: number) => {
    if (seatNumber === partnerId) {
      toast({
        title: "짝궁 설정 오류",
        description: "자기 자신을 짝궁으로 지정할 수 없습니다.",
        variant: "destructive",
      });
      return;
    }
    
    if (partnerId < 1 || partnerId > totalParticipants) {
      toast({
        title: "짝궁 설정 오류",
        description: `짝궁은 1~${totalParticipants} 범위 내에서 지정해주세요.`,
        variant: "destructive",
      });
      return;
    }
    
    setPartnerConfig(prev => ({
      ...prev,
      [seatNumber.toString()]: partnerId
    }));
  };
  
  const handleCreateRoom = async () => {
    if (expiryHours < 1 || expiryHours > 72) {
      toast({
        title: "입력 오류",
        description: "유효 기간은 1~72시간 사이로 입력해주세요.",
        variant: "destructive",
      });
      return;
    }
    
    // 팀 구성원 총합이 전체 인원수와 맞는지 확인
    const allMembers = Object.values(teamConfig).flat();
    const uniqueMembers = Array.from(new Set(allMembers));
    
    if (uniqueMembers.length !== totalParticipants) {
      toast({
        title: "팀 구성 오류",
        description: `모든 참가자(1~${totalParticipants})가 팀에 배정되어야 합니다.`,
        variant: "destructive",
      });
      return;
    }
    
    // 모든 참가자가 짝궁이 지정되었는지 확인
    const assignedPartners = Object.keys(partnerConfig).length;
    if (assignedPartners !== totalParticipants) {
      toast({
        title: "짝궁 설정 오류",
        description: "모든 참가자에게 짝궁이 지정되어야 합니다.",
        variant: "destructive",
      });
      return;
    }
    
    setIsCreating(true);
    
    try {
      // API를 통해 실제 DB에 방 생성
      const response = await createGameRoom({ 
        expiryHours,
        totalParticipants,
        teamConfig,
        partnerConfig
      });
      
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
        
        // 성공 후 초기화
        setActiveTab("basic");
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
          <Tabs 
            defaultValue="basic" 
            className="w-full" 
            value={activeTab}
            onValueChange={setActiveTab}
          >
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="basic">기본 설정</TabsTrigger>
              <TabsTrigger value="teams">팀 구성</TabsTrigger>
              <TabsTrigger value="partners">짝궁 설정</TabsTrigger>
            </TabsList>
            
            <TabsContent value="basic" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
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
                <div className="space-y-2">
                  <Label htmlFor="totalParticipants">총 참가자 수</Label>
                  <Input
                    id="totalParticipants"
                    type="number"
                    min="2"
                    max="20"
                    value={totalParticipants}
                    onChange={(e) => setTotalParticipants(parseInt(e.target.value) || 2)}
                    disabled={isCreating}
                  />
                </div>
              </div>
              <div className="text-sm text-gray-500 mt-2">
                총 참가자 수를 설정하면 자동으로 기본 팀 구성과 짝궁 설정이 생성됩니다.
              </div>
            </TabsContent>
            
            <TabsContent value="teams" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">팀 구성 설정</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addTeam}
                  disabled={isCreating || teamCount >= 10}
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  팀 추가
                </Button>
              </div>
              
              {Object.entries(teamConfig).map(([teamName, members], index) => (
                <Card key={teamName} className="mt-4">
                  <CardHeader className="py-3">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-base">{teamName}</CardTitle>
                      {teamCount > 1 && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => removeTeam(teamName)}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="py-2">
                    <div className="mb-2">
                      <Label>팀 구성원 (좌석 번호)</Label>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {members.map((member) => (
                        <Badge key={member} className="py-1 px-2 cursor-pointer">
                          {member}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-4 w-4 p-0 ml-1"
                            onClick={() => removeMemberFromTeam(teamName, member)}
                          >
                            <MinusCircle className="h-3 w-3" />
                          </Button>
                        </Badge>
                      ))}
                    </div>
                    <div className="flex gap-2 mt-4">
                      <div className="space-y-1 flex-1">
                        <Label htmlFor={`add-member-${teamName}`}>새 구성원 추가</Label>
                        <div className="flex gap-2">
                          <Input
                            id={`add-member-${teamName}`}
                            type="number"
                            min="1"
                            max={totalParticipants}
                            placeholder="좌석 번호"
                            disabled={isCreating}
                          />
                          <Button
                            variant="outline"
                            className="shrink-0"
                            onClick={(e) => {
                              const input = document.getElementById(`add-member-${teamName}`) as HTMLInputElement;
                              const seatNumber = parseInt(input.value);
                              if (seatNumber && seatNumber >= 1 && seatNumber <= totalParticipants) {
                                addMemberToTeam(teamName, seatNumber);
                                input.value = '';
                              }
                            }}
                          >
                            추가
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
            
            <TabsContent value="partners" className="space-y-4">
              <div className="mb-4">
                <h3 className="text-lg font-medium mb-2">짝궁 설정</h3>
                <p className="text-sm text-gray-500">
                  각 참가자의 짝궁(문제를 맞춰야 할 상대)을 지정해주세요.
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                {Array.from({ length: totalParticipants }, (_, i) => i + 1).map((seatNumber) => (
                  <div key={seatNumber} className="space-y-2">
                    <Label htmlFor={`partner-${seatNumber}`}>
                      {seatNumber}번 참가자의 짝궁
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        id={`partner-${seatNumber}`}
                        type="number"
                        min="1"
                        max={totalParticipants}
                        value={partnerConfig[seatNumber.toString()] || ""}
                        onChange={(e) => {
                          const partnerId = parseInt(e.target.value);
                          if (partnerId) {
                            changePartner(seatNumber, partnerId);
                          }
                        }}
                        disabled={isCreating}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
          
          <div className="flex justify-end mt-6">
            <Button 
              onClick={handleCreateRoom} 
              disabled={isCreating || isLoading}
              size="lg"
            >
              <Plus className="h-4 w-4 mr-2" />
              {isCreating ? "생성 중..." : "게임방 생성하기"}
            </Button>
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