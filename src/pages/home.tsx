import React from "react";
import { HomePage as HomePageComponent } from "../components/home-page";
import { useTheme } from "../contexts/theme-context";

export const HomePage: React.FC = () => {
  const { isDarkMode } = useTheme();
  
  const setCurrentPage = (page: string) => {
    // Using the history API for navigation
    window.history.pushState({}, '', `/${page}`);
  };

  return <HomePageComponent setCurrentPage={setCurrentPage} isDarkMode={isDarkMode} />;
};

export default HomePage;