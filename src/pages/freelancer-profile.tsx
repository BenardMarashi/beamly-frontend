import React from "react";
import { FreelancerProfilePage as FreelancerProfilePageComponent } from "../components/freelancer-profile-page";
import { useTheme } from "../contexts/theme-context";

export const FreelancerProfilePage: React.FC = () => {
  const { isDarkMode } = useTheme();
  
  return <FreelancerProfilePageComponent isDarkMode={isDarkMode} />;
};

export default FreelancerProfilePage;