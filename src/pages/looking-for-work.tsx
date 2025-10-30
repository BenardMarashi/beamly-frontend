import React from "react";
import { LookingForWorkPage as LookingForWorkPageComponent } from "../components/looking-for-work-page";
import { useTheme } from "../contexts/theme-context";

interface LookingForWorkPageProps {}

export const LookingForWorkPage: React.FC<LookingForWorkPageProps> = () => {
  const { isDarkMode } = useTheme();
  
  const setCurrentPage = (page: string) => {
    // Using the history API for navigation
    window.history.pushState({}, '', `/${page}`);
  };

  return (
    <LookingForWorkPageComponent 
      setCurrentPage={setCurrentPage}
      isDarkMode={isDarkMode}
    />
  );
};

export default LookingForWorkPage;