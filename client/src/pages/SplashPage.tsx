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
    <p className="whitespace-pre-line">{displayedText}<span className="animate-pulse">|</span></p>
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
      setTimeout(() => {
        setMessageIndex(prev => prev + 1);
      }, 500); // 메시지 사이 약간의 딜레이
    } else {
      setTimeout(() => {
        setShowButton(true);
      }, 500);
    }
  };
  
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
        className="w-full max-w-md"
      >
        <motion.h1 
          className="text-4xl font-bold mb-8 text-gray-800"
          initial={{ y: -20 }}
          animate={{ y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          내 짝궁 맞춰봐
        </motion.h1>
        
        <div className="bg-white/80 backdrop-blur-sm p-8 rounded-lg shadow-md mb-8 min-h-[200px] flex flex-col justify-center">
          <div className="text-lg font-medium mb-4 text-gray-700 min-h-[100px] flex items-center justify-center">
            <TypedMessage 
              message={messages[messageIndex]} 
              onComplete={handleMessageComplete} 
            />
          </div>
          
          {showButton && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="mt-6"
            >
              <Button 
                size="lg"
                className="w-full text-lg py-6"
                onClick={() => navigate("/home")}
              >
                시작하기
              </Button>
            </motion.div>
          )}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 1 }}
        className="absolute bottom-4 text-xs text-gray-500"
      >
        유사길 © 2025
      </motion.div>
    </div>
  );
};

export default SplashPage;