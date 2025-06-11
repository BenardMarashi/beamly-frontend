import React from "react";
import { FreelancerProfilePage as FreelancerProfilePageComponent } from "../components/freelancer-profile-page";
import { useTheme } from "../contexts/theme-context";
import { BeamlyLogo } from "../components/beamly-logo"; // Add missing BeamlyLogo import

export const FreelancerProfilePage: React.FC = () => {
  const { isDarkMode } = useTheme();
  
  const setCurrentPage = (page: string) => {
    // Using the history API for navigation
    window.history.pushState({}, '', `/${page}`);
  };

  return <FreelancerProfilePageComponent setCurrentPage={setCurrentPage} isDarkMode={isDarkMode} />;
};

export default FreelancerProfilePage;