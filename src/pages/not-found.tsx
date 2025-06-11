import React from "react";
import { Button } from "@heroui/react";
import { Icon } from "@iconify/react";
import { Link } from "react-router-dom";
import { BeamlyLogo } from "../components/beamly-logo"; // Add missing BeamlyLogo import

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[calc(100vh-64px)] flex flex-col items-center justify-center px-4 py-12">
      <div className="glass-effect p-8 max-w-md w-full text-center">
        <Icon icon="lucide:file-question" className="mx-auto mb-6 text-6xl text-beamly-secondary" />
        <h1 className="text-3xl font-bold text-white mb-2">404</h1>
        <h2 className="text-xl font-semibold text-white mb-4">Page Not Found</h2>
        <p className="text-gray-300 mb-6">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Button
          as={Link}
          to="/"
          color="secondary"
          className="text-beamly-third font-medium"
          startContent={<Icon icon="lucide:home" />}
        >
          Go Back Home
        </Button>
      </div>
    </div>
  );
};

export default NotFoundPage;