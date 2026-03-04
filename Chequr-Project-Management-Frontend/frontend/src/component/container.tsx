import React from 'react';

const Container = ({ children }: { children: React.ReactNode }) => {
  return (
    /* Figma se liya hua 1200px frame */
    <div className="flex flex-row items-start p-[8px] w-[1200px] h-[900px] bg-[#F9F9F9] mx-auto shadow-xl overflow-hidden">
      {children}
    </div>
  );
};

export default Container;