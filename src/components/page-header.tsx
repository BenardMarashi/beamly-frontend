import React from "react";
import { Button } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../contexts/theme-context";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  showBackButton?: boolean;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ 
  title, 
  subtitle, 
  showBackButton = false,
  className = "",
  titleClassName = "",
  subtitleClassName = ""
}) => {
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  
  return (
    <div className={`mb-6 ${className}`}>
      {showBackButton && (
        <Button
          variant="light"
          size="sm"
          startContent={<Icon icon="lucide:arrow-left" />}
          onPress={() => navigate(-1)}
          className="mb-4"
        >
          Back
        </Button>
      )}
      <h1 className={`text-2xl md:text-3xl font-bold mb-2 ${isDarkMode ? "text-white" : "text-gray-900"} ${titleClassName}`}>
        {title}
      </h1>
      {subtitle && (
        <p className={`text-sm md:text-base ${isDarkMode ? "text-gray-300" : "text-gray-600"} ${subtitleClassName}`}>
          {subtitle}
        </p>
      )}
    </div>
  );
};