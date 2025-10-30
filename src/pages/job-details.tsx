import React from "react";
import { JobDetailsPage as JobDetailsPageComponent } from "../components/job-details-page";
import { useTheme } from "../contexts/theme-context";

export const JobDetailsPage: React.FC = () => {
  const { isDarkMode } = useTheme();
  
  return <JobDetailsPageComponent isDarkMode={isDarkMode} />;
};

export default JobDetailsPage;