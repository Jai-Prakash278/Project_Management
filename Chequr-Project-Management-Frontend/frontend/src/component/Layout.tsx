import type { ReactNode } from 'react';
import Sidebar from './layout/Sidebar';

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {


  return (
    <div className="flex h-screen overflow-hidden bg-white">
      <Sidebar />
      <main className="flex-1 bg-[#F9FAFB] overflow-hidden p-2">
        <div className="h-full bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden relative flex flex-col">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
