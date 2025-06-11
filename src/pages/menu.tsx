import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useTranslation } from "react-i18next";
import { useTheme } from "../contexts/theme-context";
import { BeamlyLogo } from "../components/beamly-logo"; // Add missing BeamlyLogo import

interface MenuPageProps {
  isLoggedIn?: boolean;
  onLogout?: () => void;
}

export const MenuPage: React.FC<MenuPageProps> = ({ isLoggedIn = false, onLogout = () => {} }) => {
  const navigate = useNavigate();
  
  return (
    <Button
      variant="primary"
      onClick={() => navigate(-1)}
    >
      <Icon icon="heroicons:menu" />
    </Button>
  );
};

export default MenuPage;