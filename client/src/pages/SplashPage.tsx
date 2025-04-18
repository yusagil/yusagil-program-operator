import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

const TypedMessage = ({ message, onComplete }: { message: string, onComplete: () => void }) => {
  const [displayedText, setDisplayedText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  
  useEffect(() => {
    if (currentIndex < message.length) {
      const timer = setTimeout(() => {
        setDisplayedText(prev => prev + message[currentIndex]);
        setCurrentIndex(prevIndex => prevIndex + 1);
      }, 80); // 타이핑 속도 (80ms)
      
      return () => clearTimeout(timer);
    } else {
      onComplete();
    }
  }, [currentIndex, message, onComplete]);
  
  return (
    <p className="whitespace-pre-line">{displayedText}</p>
  );
};

const SplashPage = () => {
  const [location, navigate] = useLocation();
  const [messageIndex, setMessageIndex] = useState(0);
  const [showButton, setShowButton] = useState(false);
  
  const messages = [
    "어서와요, 유사길에 오신 걸 환영해요.",
    "이곳은 혼자 왔다가 둘이 되어 나가는 마법 같은 곳이죠.",
    "지금부터 함께 여행을 떠나볼까요?"
  ];
  
  const handleMessageComplete = () => {
    if (messageIndex < messages.length - 1) {
      setMessageIndex(prev => prev + 1);
    } else {
      setShowButton(true);
    }
  };
  
  return (
    <div className="fade-in flex flex-col items-center justify-center min-h-[80vh] text-center">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold mb-8">내 짝궁 맞춰봐</h1>
        
        <div className="bg-white/80 backdrop-blur-sm p-8 rounded-lg shadow-md mb-8 min-h-[200px] flex flex-col justify-center">
          <div className="text-lg font-medium mb-4">
            <TypedMessage 
              message={messages[messageIndex]} 
              onComplete={handleMessageComplete} 
            />
          </div>
          
          {showButton && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="mt-6"
            >
              <Button 
                size="lg"
                className="w-full"
                onClick={() => navigate("/home")}
              >
                시작하기
              </Button>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default SplashPage;