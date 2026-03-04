import React from 'react';
import Container from './container'; // Path check kar lein
import FixedCard from './FixedCard';   // Path check kar lein

// Baaki members ke components jab ready ho jayein:
// import Sidebar from './Sidebar';
// import Header from './Header';

const MainLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    /* Step 1: Sabse bahar aapka Figma Container */
    <Container>
      
      {/* Step 2: Sidebar (Member 1 ka area) */}
      <aside className="w-64 h-full">
        {/* <Sidebar /> aayega yahan */}
        <div className="h-full bg-white border-r border-gray-100">Sidebar</div>
      </aside>

      {/* Step 3: Right Side (Header + Content) */}
      <div className="flex flex-col flex-1 h-full">
        
        {/* Header (Aapka part) */}
        <header className="h-16 w-full bg-white border-b border-gray-100">
          {/* <Header /> aayega yahan */}
          <div className="p-4 font-bold">Header</div>
        </header>

        {/* Step 4: Fixed Card (Jahan Member 3 ka kaam dikhega) */}
        <div className="flex-1 p-6 overflow-hidden">
          <FixedCard>
            {/* children ka matlab hai ki jo bhi page khulega, 
                wo is FixedCard ke andar hi dikhega */}
            {children}
          </FixedCard>
        </div>

      </div>
    </Container>
  );
};

export default MainLayout;