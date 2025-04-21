import { FC } from 'react';

interface YusagilLogoProps {
  className?: string;
  size?: 'small' | 'medium' | 'large';
}

const YusagilLogo: FC<YusagilLogoProps> = ({ className = '', size = 'small' }) => {
  const sizeClass = {
    small: 'h-8',
    medium: 'h-12',
    large: 'h-20'
  };

  return (
    <div className={`flex justify-center ${className}`}>
      <div className={`${sizeClass[size]} text-center font-bold text-black`}>
        YUSAGIL
      </div>
    </div>
  );
};

export default YusagilLogo;