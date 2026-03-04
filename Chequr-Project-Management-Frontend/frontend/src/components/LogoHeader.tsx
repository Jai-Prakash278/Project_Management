import UnionBlueImg from '../assets/UnionBlue.svg';

interface LogoHeaderProps {
    showContactButton?: boolean;
}

const LogoHeader = ({ showContactButton = true }: LogoHeaderProps) => {
    return (
        <div className="w-full flex items-center justify-between h-[40px] mb-8">
            <div className="flex items-center gap-[9px]">
                <img src={UnionBlueImg} alt="Chequr" className="w-[24px] h-[24px] object-contain" />
                <span className="text-[20px] font-semibold text-[#4338CA] tracking-tight leading-[24px]">Chequr</span>
            </div>
            {showContactButton && (
                <button className="px-[16px] py-[6px] h-[32px] text-[14px] font-semibold text-[#374151] bg-white border border-[#D1D5DB] rounded-[10px] hover:bg-gray-50 transition-colors">
                    Contact us
                </button>
            )}
        </div>
    );
};

export default LogoHeader;
