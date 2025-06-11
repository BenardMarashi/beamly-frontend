import React from "react";
import { BrowseFreelancersPage as BrowseFreelancersPageComponent } from "../components/browse-freelancers-page";
import { useTheme } from "../contexts/theme-context";
import { BeamlyLogo } from "../components/beamly-logo"; // Add missing BeamlyLogo import

export const BrowseFreelancersPage: React.FC = () => {
  const { isDarkMode } = useTheme();
  
  const setCurrentPage = (page: string) => {
    // Using the history API for navigation
    window.history.pushState({}, '', `/${page}`);
  };

  return <BrowseFreelancersPageComponent setCurrentPage={setCurrentPage} isDarkMode={isDarkMode} />;
};

export default BrowseFreelancersPage;