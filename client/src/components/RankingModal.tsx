import { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { UserScoreSummary } from '@shared/schema';

type RankingModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  gameRoomId: number;
};

const RankingModal = ({ open, onOpenChange, gameRoomId }: RankingModalProps) => {
  const [rankings, setRankings] = useState<UserScoreSummary[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRankings = async () => {
      if (!open) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        // 실제 백엔드 연동이 되기 전까지는 가상의 데이터 사용
        // 나중에 실제 API 연동시 대체 필요
        // const response = await fetch(`/api/rankings/${gameRoomId}`);
        // const data = await response.json();
        
        // 임시 데이터로 랭킹 표시 (12명 = 6쌍)
        const mockData: UserScoreSummary[] = [
          // 1번 자리
          { userId: 1, name: "김영수", seatNumber: 1, partnerId: 2, partnerName: "이지연", partnerSeatNumber: 7, correctCount: 10, totalQuestions: 10 },
          // 2번 자리
          { userId: 3, name: "박민지", seatNumber: 2, partnerId: 4, partnerName: "최재원", partnerSeatNumber: 8, correctCount: 9, totalQuestions: 10 },
          // 3번 자리
          { userId: 5, name: "정현우", seatNumber: 3, partnerId: 6, partnerName: "한미영", partnerSeatNumber: 9, correctCount: 8, totalQuestions: 10 },
          // 4번 자리
          { userId: 7, name: "윤서진", seatNumber: 4, partnerId: 8, partnerName: "강도현", partnerSeatNumber: 10, correctCount: 7, totalQuestions: 10 },
          // 5번 자리
          { userId: 9, name: "송지원", seatNumber: 5, partnerId: 10, partnerName: "임준영", partnerSeatNumber: 11, correctCount: 6, totalQuestions: 10 },
          // 6번 자리
          { userId: 11, name: "조현진", seatNumber: 6, partnerId: 12, partnerName: "황보라", partnerSeatNumber: 12, correctCount: 5, totalQuestions: 10 },
          // 7번 자리 (짝궁)
          { userId: 2, name: "이지연", seatNumber: 7, partnerId: 1, partnerName: "김영수", partnerSeatNumber: 1, correctCount: 9, totalQuestions: 10 },
          // 8번 자리 (짝궁)
          { userId: 4, name: "최재원", seatNumber: 8, partnerId: 3, partnerName: "박민지", partnerSeatNumber: 2, correctCount: 8, totalQuestions: 10 },
          // 9번 자리 (짝궁)
          { userId: 6, name: "한미영", seatNumber: 9, partnerId: 5, partnerName: "정현우", partnerSeatNumber: 3, correctCount: 7, totalQuestions: 10 },
          // 10번 자리 (짝궁)
          { userId: 8, name: "강도현", seatNumber: 10, partnerId: 7, partnerName: "윤서진", partnerSeatNumber: 4, correctCount: 6, totalQuestions: 10 },
          // 11번 자리 (짝궁)
          { userId: 10, name: "임준영", seatNumber: 11, partnerId: 9, partnerName: "송지원", partnerSeatNumber: 5, correctCount: 4, totalQuestions: 10 },
          // 12번 자리 (짝궁)
          { userId: 12, name: "황보라", seatNumber: 12, partnerId: 11, partnerName: "조현진", partnerSeatNumber: 6, correctCount: 3, totalQuestions: 10 },
        ];
        
        // 맞춘 개수순으로 정렬
        const sortedData = [...mockData].sort((a, b) => b.correctCount - a.correctCount);
        setRankings(sortedData);
      } catch (err) {
        console.error('Error fetching rankings:', err);
        setError('랭킹 정보를 불러오는데 실패했습니다. 다시 시도해주세요.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchRankings();
  }, [open, gameRoomId]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-xl">랭킹</DialogTitle>
          <DialogDescription className="text-center">
            가장 많이 맞춘 사람부터 순위를 보여줍니다.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {isLoading ? (
            <div className="py-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-primary border-solid mx-auto mb-4"></div>
              <p>랭킹 정보를 불러오는 중...</p>
            </div>
          ) : error ? (
            <div className="text-center text-red-500 py-4">{error}</div>
          ) : (
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
              {rankings.map((user, index) => (
                <div 
                  key={user.userId} 
                  className={`p-3 rounded-md flex items-center justify-between ${index === 0 ? 'bg-yellow-50 border border-yellow-200' : 'bg-gray-50 border border-gray-100'}`}
                >
                  <div className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 font-bold
                      ${index === 0 ? 'bg-yellow-300 text-yellow-800' : 
                        index === 1 ? 'bg-gray-300 text-gray-800' :
                        index === 2 ? 'bg-orange-300 text-orange-800' : 'bg-blue-200 text-blue-800'}`}
                    >
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium">
                        {user.name} ({user.seatNumber}번)
                      </div>
                      <div className="text-sm text-gray-500">
                        파트너: {user.partnerName} ({user.partnerSeatNumber}번)
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-lg">
                      {user.correctCount}/{user.totalQuestions}
                    </div>
                    <div className="text-xs text-gray-500">
                      정답 개수
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button 
            className="w-full" 
            onClick={() => onOpenChange(false)}
          >
            닫기
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RankingModal;