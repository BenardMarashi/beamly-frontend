import React from "react";
import { Link } from "@heroui/react"; // FIXED: Added Link import
import { Icon } from "@iconify/react"; // FIXED: Added Icon import
import { useTheme } from "../contexts/theme-context";

interface NavbarProps {
  // FIXED: Added isDarkMode prop or get it from context
}

export const Navbar: React.FC<NavbarProps> = () => {
  const { isDarkMode } = useTheme(); // FIXED: Get isDarkMode from context

  return (
    <Link href="/" className="flex items-center gap-2">
      <Icon icon="lucide:message-circle" className="text-xl text-beamly-primary" />
      <span className={`text-2xl font-bold font-outfit ${isDarkMode ? "text-white" : "text-gray-900"}`}>
        Beamly
      </span>
    </Link>
  );
};

export default Navbar;