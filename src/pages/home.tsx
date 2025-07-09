import React from "react";
import { HomePage as HomePageComponent } from "../components/home-page";
import { useTheme } from "../contexts/theme-context";
import { useNavigate } from "react-router-dom";

export const HomePage: React.FC = () => {
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  
  const setCurrentPage = (page: string) => {
    // Handle navigation based on the page parameter
    if (page.includes('?')) {
      // Handle pages with query parameters
      navigate(`/${page}`);
    } else if (page === 'signup-freelancer') {
      navigate('/signup?type=freelancer');
    } else if (page === 'signup-company') {
      navigate('/signup?type=client');
    } else {
      navigate(`/${page}`);
    }
  };

  return <HomePageComponent setCurrentPage={setCurrentPage} isDarkMode={isDarkMode} />;
};

export default HomePage;