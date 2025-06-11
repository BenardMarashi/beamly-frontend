import React, { lazy, Suspense } from "react";
import { HeroSection } from "./hero-section";
import { Button, Spinner } from "@heroui/react";

// Lazy load secondary sections to improve initial page load
const CategoriesSection = lazy(() => import("./categories-section").then(module => ({ default: module.CategoriesSection })));
const FeaturesSection = lazy(() => import("./features-section").then(module => ({ default: module.FeaturesSection })));
const HowItWorksSection = lazy(() => import("./how-it-works-section").then(module => ({ default: module.HowItWorksSection })));
const TestimonialsSection = lazy(() => import("./testimonials-section").then(module => ({ default: module.TestimonialsSection })));
const CTASection = lazy(() => import("./cta-section").then(module => ({ default: module.CTASection })));

interface LandingPageProps {
  setCurrentPage: (page: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ setCurrentPage }) => {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section id="hero">
        <HeroSection />
      </section>
      
      <Suspense fallback={<div className="flex justify-center p-8"><Spinner color="secondary" size="lg" /></div>}>
        <section id="explore" className="section-container">
          <CategoriesSection />
        </section>
        
        <section id="services" className="section-container">
          <FeaturesSection />
        </section>
        
        <section id="how-it-works" className="section-container primary-glow">
          <HowItWorksSection />
        </section>
        
        <section id="testimonials" className="section-container">
          <TestimonialsSection />
        </section>
        
        <section id="cta" className="section-container">
          <CTASection />
        </section>
      </Suspense>
    </div>
  );
};