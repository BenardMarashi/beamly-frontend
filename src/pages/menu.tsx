import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@heroui/react";
import { Icon } from "@iconify/react";

interface MenuPageProps {
  isLoggedIn?: boolean;
  onLogout?: () => void;
}

export const MenuPage: React.FC<MenuPageProps> = () => {
  const navigate = useNavigate();
  
  return (
    <Button
      variant="flat"
      onClick={() => navigate(-1)}
    >
      <Icon icon="heroicons:menu" />
    </Button>
  );
};

export default MenuPage;