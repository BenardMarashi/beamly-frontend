import React from "react";
import { useTheme } from "../contexts/theme-context";
    
interface BeamlyLogoProps {
  small?: boolean;
  className?: string;
}

export const BeamlyLogo: React.FC<BeamlyLogoProps> = ({ small = false, className = "" }) => {
  const { isDarkMode } = useTheme();
  
  return (
    <div className={`flex items-center ${className}`}>
      <svg 
        width={small ? "24" : "32"} 
        height={small ? "32" : "42"} 
        viewBox="0 0 1473.24 1885.32" 
        className={`mr-2 ${small ? 'w-6 h-8' : 'w-8 h-10'}`}
      >
        <path 
          fill="#FCE90D" 
          d="M735.92,412.09a732.65,732.65,0,0,0-327.18,77.08V408.73C408.74,183,225.74,0,0,0V1476.59c0,225.73,183,408.73,408.74,408.73v-77.17a731.52,731.52,0,0,0,327.88,77.17c406.2,0,736.61-330.41,736.62-736.61,0-406.77-330.54-737-737.32-736.62m31,1063.13a329.66,329.66,0,0,1-117.12-10.28c-39.45-10.83-81.08-10.82-120.93-1.58l-265.17,61.45L373.64,1349.9c31-49.35,43.26-107.77,37-165.72a332,332,0,0,1-1.53-51.4c7.84-165.5,141-300.85,306.33-311.29,199.73-12.62,364.59,154.66,347.9,355.17-13.09,157.22-139.26,284.38-296.4,298.56"
        />
      </svg>
      <div className={`font-bold ${small ? 'text-lg' : 'text-2xl'}`}>
        <span className={isDarkMode ? "text-white" : "text-gray-800"}>Beamly</span>
      </div>
    </div>
  );
};