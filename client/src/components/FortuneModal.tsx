import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { getRandomFortune } from "@/data/fortuneData";

interface FortuneModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const FortuneModal = ({ open, onOpenChange }: FortuneModalProps) => {
  const [isRevealing, setIsRevealing] = useState(false);
  const [fortune, setFortune] = useState<{ message: string; tip: string } | null>(null);
  const [isShaking, setIsShaking] = useState(false);

  // 운세 데이터 초기화
  useEffect(() => {
    if (open && !fortune) {
      setFortune(getRandomFortune());
    }

    // 모달 닫힐 때 상태 초기화
    if (!open) {
      setIsRevealing(false);
      setFortune(null);
    }
  }, [open]);

  // 부적 흔들기 효과
  const handleShake = () => {
    if (isShaking || isRevealing) return;
    
    setIsShaking(true);
    setTimeout(() => {
      setIsShaking(false);
      setIsRevealing(true);
    }, 1000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-lg border-none shadow-lg">
        <div className="relative overflow-hidden rounded-lg">
          {/* 배경 - 은은한 밤하늘 느낌 */}
          <div 
            className="absolute inset-0 bg-gradient-to-b from-indigo-900 to-purple-900"
            style={{ 
              backgroundImage: "radial-gradient(white, rgba(255, 255, 255, 0.1) 2px, transparent 3px)",
              backgroundSize: "50px 50px",
              opacity: 0.8
            }}
          />

          <div className="relative z-10 p-6 text-center">
            <DialogTitle className="text-xl text-white mb-6 mt-2">오늘의 운세</DialogTitle>
            
            {!isRevealing ? (
              <div className="flex flex-col items-center justify-center p-6">
                {/* 운세 카드/부적 이미지 */}
                <motion.div
                  className={`w-48 h-64 bg-gradient-to-br from-pink-300 to-purple-600 rounded-lg shadow-lg flex items-center justify-center mb-6 border-2 border-yellow-200 overflow-hidden`}
                  animate={isShaking ? { 
                    rotate: [0, -3, 3, -3, 3, 0],
                    scale: [1, 1.02, 0.98, 1.02, 0.98, 1]
                  } : {}}
                  transition={{ duration: 0.5 }}
                >
                  <div className="text-white text-opacity-90 text-xs font-bold whitespace-pre-wrap p-4 text-center">
                    <div className="text-lg mb-2">✨ 운세 ✨</div>
                    <div className="border-t border-b border-white border-opacity-40 py-3 my-2">
                      내 인연의<br />메시지가<br />담겨있어요
                    </div>
                    <div className="mt-2">오늘의 운세</div>
                  </div>
                </motion.div>
                
                <Button
                  onClick={handleShake}
                  className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white border-none rounded-full px-6 py-2 shadow-md hover:shadow-lg transition-all"
                >
                  운세 뽑기
                </Button>
              </div>
            ) : (
              <AnimatePresence>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-6 shadow-xl"
                >
                  {/* 운세 메시지 */}
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                    className="mb-6"
                  >
                    <h3 className="text-lg font-medium text-white mb-2">오늘의 운세</h3>
                    <p className="text-xl text-white font-bold py-3 border-b border-white border-opacity-20">
                      {fortune?.message}
                    </p>
                  </motion.div>
                  
                  {/* 인연을 높이는 팁 */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8, duration: 0.5 }}
                  >
                    <h3 className="text-lg font-medium text-white mb-2">인연을 높이는 팁</h3>
                    <p className="text-white text-lg">
                      {fortune?.tip}
                    </p>
                  </motion.div>
                </motion.div>
              </AnimatePresence>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FortuneModal;