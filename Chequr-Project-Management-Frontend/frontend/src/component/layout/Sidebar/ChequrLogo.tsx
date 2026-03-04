
import ChequrIcon from '../../../assets/Integration Icons.svg';

interface ChequrLogoProps {
    className?: string;
}

const ChequrLogo = ({ className }: ChequrLogoProps) => {
    return (
        <img
            src={ChequrIcon}
            alt="Chequr AI"
            className={`object-contain ${className || ''}`}
        />
    );
};

export default ChequrLogo;
