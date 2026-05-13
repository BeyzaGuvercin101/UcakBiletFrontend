import { Plane } from 'lucide-react';
import turkishAirlinesLogo from '../../imports/dfbaz.jpg';
import pegasusLogo from '../../imports/download.png';
import sunExpressLogo from '../../imports/download-1.png';
import ajetLogo from '../../imports/download-2.png';

export const airlineLogos: Record<string, { color: string; bgColor: string; gradient: string }> = {
  'Turkish Airlines': {
    color: '#E30A17',
    bgColor: '#FEE2E2',
    gradient: 'from-red-600 to-red-500',
  },
  'Pegasus Airlines': {
    color: '#FFD100',
    bgColor: '#FEF3C7',
    gradient: 'from-yellow-500 to-yellow-400',
  },
  'SunExpress': {
    color: '#FFB81C',
    bgColor: '#FEF3C7',
    gradient: 'from-orange-500 to-yellow-500',
  },
  'AJet': {
    color: '#1E3A8A',
    bgColor: '#DBEAFE',
    gradient: 'from-blue-600 to-blue-400',
  },
};

interface AirlineLogoProps {
  airline: string;
  size?: 'sm' | 'md' | 'lg';
}

export function AirlineLogo({ airline, size = 'md' }: AirlineLogoProps) {
  const logoData = airlineLogos[airline];

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  // Turkish Airlines için gerçek logo
  if (airline === 'Turkish Airlines') {
    return (
      <img
        src={turkishAirlinesLogo}
        alt="Turkish Airlines"
        className={`${sizeClasses[size]} object-contain`}
      />
    );
  }

  // Pegasus Airlines için gerçek logo
  if (airline === 'Pegasus Airlines') {
    return (
      <img
        src={pegasusLogo}
        alt="Pegasus Airlines"
        className={`${sizeClasses[size]} object-contain`}
      />
    );
  }

  // SunExpress için gerçek logo
  if (airline === 'SunExpress') {
    return (
      <img
        src={sunExpressLogo}
        alt="SunExpress"
        className={`${sizeClasses[size]} object-contain`}
      />
    );
  }

  // AJet için gerçek logo
  if (airline === 'AJet') {
    return (
      <img
        src={ajetLogo}
        alt="AJet"
        className={`${sizeClasses[size]} object-contain`}
      />
    );
  }

  if (!logoData) {
    return (
      <div className={`${sizeClasses[size]} bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center`}>
        <Plane className={`${iconSizes[size]} text-white`} />
      </div>
    );
  }

  return (
    <div className={`${sizeClasses[size]} bg-gradient-to-br ${logoData.gradient} rounded-xl flex items-center justify-center shadow-md`}>
      <Plane className={`${iconSizes[size]} text-white`} />
    </div>
  );
}
