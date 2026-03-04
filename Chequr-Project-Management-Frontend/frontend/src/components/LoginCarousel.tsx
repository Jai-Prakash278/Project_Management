import { useState, useEffect } from 'react';
import Frame18Img from '../assets/Frame 18.svg';

const slides = [
    {
        title: "Unlock Real-Time Business Insights",
        description: "Get AI-generated alerts and summaries on revenue, churn, and operational bottlenecks."
    }
];

const LoginCarousel = () => {
    const [currentSlide, setCurrentSlide] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % slides.length);
        }, 5000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div
            className="hidden lg:flex flex-col items-center w-full max-w-[565px] h-full p-[48px_32px_32px] border border-[#E8EAEE] rounded-[12px] relative overflow-hidden isolate flex-none order-0 flex-grow shadow-sm"
            style={{
                background: 'linear-gradient(157.78deg, #E5E7EB 0%, #FFFFFF 100%)',
                backgroundBlendMode: 'luminosity',
                boxSizing: 'border-box'
            }}
        >
            <div className="relative z-10 w-full h-full flex flex-col items-center">
                <div className="flex-1 relative w-full">
                    {slides.map((slide, index) => (
                        <div
                            key={index}
                            className={`transition-all duration-1000 ease-in-out absolute top-0 left-0 w-full h-full flex flex-col items-start ${index === currentSlide ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
                                }`}
                        >
                            {/* Content */}
                            <div className="w-full flex flex-col items-start gap-2 z-[10] self-stretch flex-none order-0 flex-grow-0">
                                <h2
                                    className="w-full text-[40px] font-extrabold font-['Plus_Jakarta_Sans'] leading-[48px] self-stretch flex-none order-0 flex-grow-0"
                                    style={{
                                        background: 'linear-gradient(90deg, #EA580C 0%, #F97316 100%)',
                                        WebkitBackgroundClip: 'text',
                                        WebkitTextFillColor: 'transparent',
                                        display: 'inline-block'
                                    }}
                                >
                                    {slide.title}
                                </h2>
                                <p className="w-full text-[16px] font-['Plus_Jakarta_Sans'] font-normal leading-[24px] text-[#374151] self-stretch flex-none order-1 flex-grow-0">
                                    {slide.description}
                                </p>
                            </div>

                            {/* Statis SVG Dashboard Preview */}
                            <div className="absolute w-[120%] h-[600px] -left-[10%] top-[238px] z-[5] flex items-start">
                                <img src={Frame18Img} alt="Dashboard Preview" className="w-full h-auto drop-shadow-2xl rounded-[16px]" />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Steps / Indicators */}
                <div className="flex flex-row items-center justify-center p-0 gap-2 w-full h-[6px] z-[20] flex-none order-2 flex-grow-0 mt-auto">
                    {slides.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => setCurrentSlide(index)}
                            className={`h-[4px] border-none rounded-full transition-all duration-300 ${index === currentSlide ? 'w-8 bg-gray-900/60' : 'w-2 bg-gray-900/10 hover:bg-gray-900/20'
                                }`}
                            aria-label={`Go to slide ${index + 1}`}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default LoginCarousel;
