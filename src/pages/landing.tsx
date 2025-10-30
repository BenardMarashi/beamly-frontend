import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { HeroSection } from "../components/hero-section";
import { CategoriesSection } from "../components/categories-section";
import { HowItWorksSection } from "../components/how-it-works-section";
import { TestimonialsSection } from "../components/testimonials-section";
import { CTASection } from "../components/cta-section";

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // If user is logged in, redirect to home (dashboard)
  React.useEffect(() => {
    if (user) {
      navigate('/home');
    }
  }, [user, navigate]);

  const handlePageChange = (page: string) => {
    navigate(`/${page}`);
  };

  return (
    <div>
      {/* Hero Section */}
      <HeroSection setCurrentPage={handlePageChange} />
      
      {/* Categories Section */}
      <CategoriesSection setCurrentPage={handlePageChange} />
      
      {/* How It Works Section */}
      <HowItWorksSection />
      
      {/* Testimonials Section */}
      <TestimonialsSection />
      
      {/* CTA Section */}
      <CTASection setCurrentPage={handlePageChange} />
    </div>
  );
};