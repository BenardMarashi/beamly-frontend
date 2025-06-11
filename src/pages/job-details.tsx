import React from "react";
import { JobDetailsPage as JobDetailsPageComponent } from "../components/job-details-page";
import { useTheme } from "../contexts/theme-context";
import { BeamlyLogo } from "../components/beamly-logo"; // Add missing BeamlyLogo import

export const JobDetailsPage: React.FC = () => {
  const { isDarkMode } = useTheme();
  
  const setCurrentPage = (page: string) => {
    // Using the history API for navigation
    window.history.pushState({}, '', `/${page}`);
  };

  return <JobDetailsPageComponent setCurrentPage={setCurrentPage} isDarkMode={isDarkMode} />;
};

export default JobDetailsPage;