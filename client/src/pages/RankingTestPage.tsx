import { useState } from "react";
import { Button } from "@/components/ui/button";
import RankingModal from "@/components/RankingModal";

const RankingTestPage = () => {
  const [isRankingOpen, setIsRankingOpen] = useState(false);

  return (
    <div className="fade-in">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-3">랭킹 테스트 페이지</h2>
        <p className="text-gray-600 mb-6">
          아래 버튼을 클릭하여 랭킹 모달을 열어 확인하세요
        </p>
        
        <Button 
          className="w-full"
          onClick={() => setIsRankingOpen(true)}
        >
          랭킹 보기
        </Button>
      </div>

      {/* 랭킹 모달 */}
      <RankingModal
        open={isRankingOpen}
        onOpenChange={setIsRankingOpen}
        gameRoomId={1} // 임의의 게임룸 ID
      />
    </div>
  );
};

export default RankingTestPage;