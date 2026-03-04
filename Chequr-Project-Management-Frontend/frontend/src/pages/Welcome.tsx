import { Settings, GraduationCap, CheckCircle } from 'lucide-react';

export const Welcome = () => {
  return (
    <div className="relative min-h-screen bg-[#F9FAFB] overflow-hidden">
      {/* Decorative Background */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/5 rounded-full blur-[120px] pointer-events-none" />

      <main className="min-h-screen py-12 px-6 relative z-10 max-w-4xl mx-auto">
        {/* Welcome Card */}
        <div className="bg-white rounded-[32px] p-12 border border-gray-100 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-[80px] -mr-32 -mt-32" />

          <div className="relative space-y-8">
            {/* Icon Section */}
            <div className="flex items-center justify-center gap-6">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white shadow-xl shadow-orange-500/20">
                <Settings className="w-10 h-10" />
              </div>
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white shadow-xl shadow-purple-500/20">
                <GraduationCap className="w-10 h-10" />
              </div>
            </div>

            {/* Heading */}
            <div className="text-center space-y-3">
              <h1 className="text-4xl font-extrabold text-gray-900 font-plus-jakarta tracking-tight">
                Welcome to the Knowledge Center
              </h1>
              <p className="text-lg text-gray-500 font-inter max-w-2xl mx-auto">
                Explore resources, documentation, and insights to help your team collaborate more effectively and achieve your goals.
              </p>
            </div>

            {/* Divider */}
            <div className="h-[1px] bg-gray-100" />

            {/* You'll Unlock Section */}
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-900 font-plus-jakarta text-center">
                You'll unlock:
              </h2>
              
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <CheckCircle className="w-6 h-6 text-indigo-600 shrink-0 mt-1" />
                  <div>
                    <h3 className="font-bold text-gray-900 font-plus-jakarta">
                      Comprehensive Documentation
                    </h3>
                    <p className="text-sm text-gray-500 font-inter mt-1">
                      Access detailed guides, tutorials, and best practices for your projects
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <CheckCircle className="w-6 h-6 text-indigo-600 shrink-0 mt-1" />
                  <div>
                    <h3 className="font-bold text-gray-900 font-plus-jakarta">
                      Team Collaboration Tools
                    </h3>
                    <p className="text-sm text-gray-500 font-inter mt-1">
                      Share knowledge, coordinate efforts, and work together seamlessly
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <CheckCircle className="w-6 h-6 text-indigo-600 shrink-0 mt-1" />
                  <div>
                    <h3 className="font-bold text-gray-900 font-plus-jakarta">
                      Real-time Updates & Insights
                    </h3>
                    <p className="text-sm text-gray-500 font-inter mt-1">
                      Stay informed with live notifications and analytics dashboards
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* CTA Button */}
            <div className="flex justify-center pt-4">
              <button className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold text-base shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:scale-[1.02] active:scale-[0.98] transition-all">
                Get Started
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
