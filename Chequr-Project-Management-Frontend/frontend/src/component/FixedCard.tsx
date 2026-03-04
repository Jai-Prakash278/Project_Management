import React from 'react';

const FixedCard = ({ children }: { children: React.ReactNode }) => {
  return (
    /* Yeh aapka safed card hai */
    <div className="bg-white rounded-[24px] shadow-sm p-[32px] w-full h-full overflow-y-auto border border-gray-100">
      {children}
    </div>
  );
};

export default FixedCard;