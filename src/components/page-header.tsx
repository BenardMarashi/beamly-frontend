import React from "react";
import { motion } from "framer-motion";
import { Button } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useNavigate } from "react-router-dom";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  className?: string;
  titleClassName?: string;
  subtitleClassName?: string;
  showBackButton?: boolean;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  className = "",
  titleClassName = "",
  subtitleClassName = "",
  showBackButton = false
}) => {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`text-center py-12 px-4 ${className}`}
    >
      {showBackButton && (
        <Button
          variant="light"
          className="mb-4"
          startContent={<Icon icon="lucide:arrow-left" />}
          onPress={() => navigate(-1)}
        >
          Back
        </Button>
      )}
      <h1 className={`text-4xl md:text-5xl font-bold text-white mb-4 ${titleClassName}`}>
        {title}
      </h1>
      {subtitle && (
        <p className={`text-lg text-gray-300 max-w-2xl mx-auto ${subtitleClassName}`}>
          {subtitle}
        </p>
      )}
    </motion.div>
  );
};