import React from "react";
import { motion } from "framer-motion";
import { Input, Button } from "@heroui/react";
import { Icon } from "@iconify/react";
import { PageHeader } from "./page-header";

const categories = [
  {
    name: "Graphic Design",
    icon: "lucide:palette",
    color: "#FF6B6B",
    subcategories: [
      "Logo Design",
      "Brand Identity",
      "Social Media Graphics",
      "Illustration",
      "Print Design",
      "Packaging Design",
      "Infographics",
      "UI/UX Design"
    ]
  },
  {
    name: "Web Development",
    icon: "lucide:code",
    color: "#4ECDC4",
    subcategories: [
      "Frontend Development",
      "Backend Development",
      "Full Stack Development",
      "E-commerce Development",
      "WordPress Development",
      "Shopify Development",
      "Landing Page Design",
      "Web Maintenance"
    ]
  },
  {
    name: "Digital Marketing",
    icon: "lucide:megaphone",
    color: "#FFD166",
    subcategories: [
      "Social Media Marketing",
      "Search Engine Optimization (SEO)",
      "Pay-Per-Click (PPC)",
      "Email Marketing",
      "Content Marketing",
      "Influencer Marketing",
      "Marketing Strategy",
      "Analytics & Reporting"
    ]
  },
  {
    name: "Writing & Translation",
    icon: "lucide:pen-tool",
    color: "#6A0572",
    subcategories: [
      "Blog & Article Writing",
      "Copywriting",
      "Technical Writing",
      "Creative Writing",
      "Translation Services",
      "Proofreading & Editing",
      "Resume & Cover Letters",
      "Scriptwriting"
    ]
  },
  {
    name: "Video & Animation",
    icon: "lucide:video",
    color: "#1A936F",
    subcategories: [
      "Video Editing",
      "Animation",
      "Motion Graphics",
      "Visual Effects",
      "Whiteboard & Explainer Videos",
      "Video Production",
      "3D Animation",
      "Intro & Outro Videos"
    ]
  },
  {
    name: "Music & Audio",
    icon: "lucide:music",
    color: "#3D348B",
    subcategories: [
      "Voice Over",
      "Music Production",
      "Audio Editing",
      "Sound Design",
      "Podcast Production",
      "Mixing & Mastering",
      "Jingles & Intros",
      "Audio Ads"
    ]
  },
  {
    name: "Programming",
    icon: "lucide:terminal",
    color: "#F18701",
    subcategories: [
      "Mobile App Development",
      "Game Development",
      "Desktop Applications",
      "API Development",
      "Database Design",
      "Blockchain & Cryptocurrency",
      "QA & Testing",
      "DevOps & Cloud"
    ]
  },
  {
    name: "Business",
    icon: "lucide:briefcase",
    color: "#7678ED",
    subcategories: [
      "Business Plans",
      "Market Research",
      "Business Consulting",
      "Financial Analysis",
      "Legal Consulting",
      "Virtual Assistance",
      "Project Management",
      "Data Entry"
    ]
  },
  {
    name: "Lifestyle",
    icon: "lucide:heart",
    color: "#E84855",
    subcategories: [
      "Online Tutoring",
      "Fitness Lessons",
      "Cooking Lessons",
      "Life Coaching",
      "Astrology & Readings",
      "Gaming",
      "Arts & Crafts",
      "Relationship Advice"
    ]
  },
  {
    name: "Data",
    icon: "lucide:bar-chart-2",
    color: "#5F7FFF",
    subcategories: [
      "Data Analysis",
      "Data Visualization",
      "Machine Learning",
      "Data Mining",
      "Data Entry",
      "Data Processing",
      "Excel & Spreadsheets",
      "Statistical Analysis"
    ]
  },
  {
    name: "Photography",
    icon: "lucide:camera",
    color: "#FF9F1C",
    subcategories: [
      "Product Photography",
      "Portrait Photography",
      "Event Photography",
      "Real Estate Photography",
      "Photo Editing",
      "Photo Retouching",
      "Food Photography",
      "Stock Photography"
    ]
  },
  {
    name: "Education & Training",
    icon: "lucide:book-open",
    color: "#2EC4B6",
    subcategories: [
      "Course Creation",
      "Instructional Design",
      "Online Teaching",
      "Tutoring",
      "Test Prep",
      "Language Lessons",
      "Technical Training",
      "Curriculum Development"
    ]
  }
];

export const AllCategoriesPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = React.useState("");
  
  const filteredCategories = searchQuery 
    ? categories.filter(cat => 
        cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cat.subcategories.some(sub => sub.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : categories;
  
  return (
    <div className="container mx-auto px-4 py-8">
      <PageHeader 
        title="All Categories"
        subtitle="Explore our comprehensive range of service categories"
        showBackButton
      />
      
      <div className="glass-effect p-6 mb-8">
        <div className="flex flex-col md:flex-row gap-4">
          <Input
            placeholder="Search categories..."
            value={searchQuery}
            onValueChange={setSearchQuery}
            startContent={<Icon icon="lucide:search" className="text-gray-400" />}
            className="flex-1 bg-white/10 border-white/20"
            size="lg"
          />
          <Button 
            color="secondary"
            size="lg"
            className="font-medium font-outfit text-beamly-third"
          >
            Search
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCategories.map((category, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: index * 0.05 }}
          >
            <div className="glass-card p-6 h-full card-hover">
              <div className="flex items-center mb-4">
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center mr-4"
                  style={{ backgroundColor: `${category.color}20` }}
                >
                  <Icon icon={category.icon} className="text-2xl" style={{ color: category.color }} />
                </div>
                <h3 className="text-xl font-semibold text-white">{category.name}</h3>
              </div>
              
              <ul className="grid grid-cols-1 gap-2 mt-4">
                {category.subcategories.map((subcat, idx) => (
                  <li key={idx}>
                    <Button
                      variant="light"
                      className="justify-start px-2 py-1 h-auto min-h-0 text-gray-300 hover:text-white w-full"
                      endContent={<Icon icon="lucide:chevron-right" className="text-sm" />}
                    >
                      {subcat}
                    </Button>
                  </li>
                ))}
              </ul>
              
              <div className="mt-4 pt-4 border-t border-white/10">
                <Button 
                  color="default"
                  variant="flat"
                  className="w-full bg-white/5 text-white"
                >
                  View All in {category.name}
                </Button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
      
      <div className="yellow-glass p-8 text-center mt-12">
        <h2 className="text-2xl font-bold text-white mb-4">Can't Find What You're Looking For?</h2>
        <p className="text-gray-300 max-w-2xl mx-auto mb-6">
          Post a custom request and let freelancers come to you with tailored proposals.
        </p>
        <Button 
          color="secondary"
          size="lg"
          className="font-medium font-outfit text-beamly-third"
          endContent={<Icon icon="lucide:plus" />}
        >
          Post a Custom Request
        </Button>
      </div>
    </div>
  );
};