import React from "react";
import { motion } from "framer-motion";
import { Input, Button, Card, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Avatar, Chip } from "@nextui-org/react";
import { Icon } from "@iconify/react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useTheme } from "../contexts/theme-context";
import { VerifiedBadge } from "./profile/VerifiedBadge";

interface BrowseFreelancersPageProps {
  setCurrentPage?: (page: string) => void;
}

export const BrowseFreelancersPage: React.FC<BrowseFreelancersPageProps> = ({ 
  setCurrentPage
}) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { isDarkMode } = useTheme();
  const [searchQuery, setSearchQuery] = React.useState("");
  const [filterCategory, setFilterCategory] = React.useState("all");
  const [sortBy, setSortBy] = React.useState("rating");
  
  const categories = [
    { id: "all", name: t('browseFreelancers.allCategories') },
    { id: "design", name: t('categories.items.graphicDesign') },
    { id: "development", name: t('categories.items.webDevelopment') },
    { id: "marketing", name: t('categories.items.digitalMarketing') },
    { id: "writing", name: t('categories.items.writingTranslation') },
    { id: "video", name: t('categories.items.videoAnimation') }
  ];
  
  const freelancers = [
    {
      id: 1,
      name: "Ophelia Coleman",
      title: "UI/UX Designer",
      avatar: "https://img.heroui.chat/image/avatar?w=100&h=100&u=ophelia1",
      rating: 4.9,
      projectsCompleted: 87,
      hourlyRate: "$45",
      category: "design",
      skills: ["UI Design", "UX Research", "Figma"],
      isVerified: true
    },
    {
      id: 2,
      name: "Michael Chen",
      title: "Full Stack Developer",
      avatar: "https://img.heroui.chat/image/avatar?w=100&h=100&u=michael1",
      rating: 4.8,
      projectsCompleted: 124,
      hourlyRate: "$65",
      category: "development",
      skills: ["React", "Node.js", "MongoDB"],
      isVerified: true
    },
    {
      id: 3,
      name: "Sarah Johnson",
      title: "Content Writer",
      avatar: "https://img.heroui.chat/image/avatar?w=100&h=100&u=sarah1",
      rating: 4.7,
      projectsCompleted: 93,
      hourlyRate: "$35",
      category: "writing",
      skills: ["Blog Posts", "SEO Writing", "Copywriting"],
      isVerified: false
    },
    {
      id: 4,
      name: "David Wilson",
      title: "Digital Marketer",
      avatar: "https://img.heroui.chat/image/avatar?w=100&h=100&u=david1",
      rating: 4.9,
      projectsCompleted: 112,
      hourlyRate: "$50",
      category: "marketing",
      skills: ["SEO", "Social Media", "Google Ads"],
      isVerified: false
    },
    {
      id: 5,
      name: "Emma Phillips",
      title: "Video Editor",
      avatar: "https://img.heroui.chat/image/avatar?w=100&h=100&u=emma1",
      rating: 4.8,
      projectsCompleted: 76,
      hourlyRate: "$55",
      category: "video",
      skills: ["After Effects", "Premiere Pro", "Motion Graphics"],
      isVerified: true
    },
    {
      id: 6,
      name: "Alex Rodriguez",
      title: "WordPress Developer",
      avatar: "https://img.heroui.chat/image/avatar?w=100&h=100&u=alex1",
      rating: 4.7,
      projectsCompleted: 104,
      hourlyRate: "$40",
      category: "development",
      skills: ["WordPress", "PHP", "Theme Development"],
      isVerified: false
    },
    {
      id: 7,
      name: "Jessica Lee",
      title: "Graphic Designer",
      avatar: "https://img.heroui.chat/image/avatar?w=100&h=100&u=jessica1",
      rating: 4.9,
      projectsCompleted: 131,
      hourlyRate: "$45",
      category: "design",
      skills: ["Photoshop", "Illustrator", "Brand Identity"],
      isVerified: true
    },
    {
      id: 8,
      name: "Robert Taylor",
      title: "SEO Specialist",
      avatar: "https://img.heroui.chat/image/avatar?w=100&h=100&u=robert1",
      rating: 4.8,
      projectsCompleted: 89,
      hourlyRate: "$60",
      category: "marketing",
      skills: ["Keyword Research", "Link Building", "Analytics"],
      isVerified: false
    }
  ];
  
  const filteredFreelancers = React.useMemo(() => {
    let result = freelancers;
    
    // Filter by category
    if (filterCategory !== "all") {
      result = result.filter(freelancer => freelancer.category === filterCategory);
    }
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(freelancer => 
        freelancer.name.toLowerCase().includes(query) || 
        freelancer.title.toLowerCase().includes(query) ||
        freelancer.skills.some(skill => skill.toLowerCase().includes(query))
      );
    }
    
    // Sort
    switch (sortBy) {
      case "rating":
        return [...result].sort((a, b) => b.rating - a.rating);
      case "projects":
        return [...result].sort((a, b) => b.projectsCompleted - a.projectsCompleted);
      case "price-low":
        return [...result].sort((a, b) => 
          parseInt(a.hourlyRate.replace("$", "")) - parseInt(b.hourlyRate.replace("$", ""))
        );
      case "price-high":
        return [...result].sort((a, b) => 
          parseInt(b.hourlyRate.replace("$", "")) - parseInt(a.hourlyRate.replace("$", ""))
        );
      default:
        return result;
    }
  }, [filterCategory, searchQuery, sortBy]);

  const handleViewProfile = (id: number) => {
    // Use navigation if available, otherwise use setCurrentPage
    if (typeof window !== 'undefined' && navigate) {
      navigate(`/freelancer/${id}`);
    } else if (setCurrentPage) {
      setCurrentPage(`freelancer-profile`);
    }
  };
  
  return (
    <div className="min-h-screen pt-4 pb-20">
      {/* Mobile-optimized search section */}
      <div className="px-4 mb-4">
        <div className="mobile-profile-section">
          <Input
            placeholder="Search for freelancers by name"
            value={searchQuery}
            onValueChange={setSearchQuery}
            startContent={<Icon icon="lucide:search" className="text-gray-400" />}
            className="form-input"
            size="lg"
            classNames={{
              input: "text-white placeholder:text-gray-400",
              inputWrapper: "bg-transparent border-none"
            }}
          />
          <Button 
            color="secondary"
            size="lg"
            className="w-full mt-4 font-medium text-beamly-third"
            onPress={() => {
              console.log("Search freelancers");
            }}
          >
            Search
          </Button>
        </div>
      </div>
      
      {/* Category filters - horizontal scroll */}
      <div className="px-4 mb-4">
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
          {categories.map((category) => (
            <Button
              key={category.id}
              variant={filterCategory === category.id ? "solid" : "flat"}
              color={filterCategory === category.id ? "secondary" : "default"}
              size="sm"
              className={`min-w-fit ${filterCategory !== category.id ? 'bg-white/10 text-white border border-white/20' : 'text-beamly-third'}`}
              onPress={() => setFilterCategory(category.id)}
            >
              {category.name}
            </Button>
          ))}
        </div>
      </div>
      
      {/* Sort dropdown */}
      <div className="px-4 mb-6">
        <Dropdown>
          <DropdownTrigger>
            <Button 
              variant="flat" 
              className="w-full bg-white/10 text-white border border-white/20"
              endContent={<Icon icon="lucide:chevron-down" />}
            >
              Sort by: {
                sortBy === "rating" ? "Highest Rated" : 
                sortBy === "projects" ? "Most Projects" : 
                sortBy === "price-low" ? "Lowest Rate" : "Highest Rate"
              }
            </Button>
          </DropdownTrigger>
          <DropdownMenu 
            aria-label="Sort options"
            onAction={(key) => setSortBy(key as string)}
            className="bg-[#010b29]/95 backdrop-blur-md border border-white/10"
          >
            <DropdownItem key="rating" className="text-white">Highest Rated</DropdownItem>
            <DropdownItem key="projects" className="text-white">Most Projects</DropdownItem>
            <DropdownItem key="price-low" className="text-white">Lowest Rate</DropdownItem>
            <DropdownItem key="price-high" className="text-white">Highest Rate</DropdownItem>
          </DropdownMenu>
        </Dropdown>
      </div>
      
      {/* Mobile freelancer cards */}
      <div className="px-4 space-y-4">
        {filteredFreelancers.map((freelancer, index) => (
          <motion.div
            key={freelancer.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
            className="mobile-freelancer-card"
            onClick={() => handleViewProfile(freelancer.id)}
          >
            {/* Freelancer header */}
            <div className="flex items-start gap-4 mb-4">
              <Avatar 
                src={freelancer.avatar} 
                className="w-16 h-16 border-2 border-white/20"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-white text-lg">
                    {freelancer.name}
                  </h3>
                  {freelancer.isVerified && (
                    <Icon icon="lucide:check-circle" className="text-beamly-secondary w-5 h-5" />
                  )}
                </div>
                <p className="text-gray-300 text-sm mb-2">{freelancer.title}</p>
                <div className="flex items-center gap-1">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Icon 
                        key={i} 
                        icon="lucide:star" 
                        className={`w-4 h-4 ${i < Math.floor(freelancer.rating) ? 'text-beamly-secondary' : 'text-gray-600'}`}
                      />
                    ))}
                  </div>
                  <span className="text-white text-sm font-medium ml-1">{freelancer.rating}</span>
                  <span className="text-gray-400 text-sm">({freelancer.projectsCompleted} projects)</span>
                </div>
              </div>
            </div>
            
            {/* Skills */}
            <div className="flex flex-wrap gap-2 mb-4">
              {freelancer.skills.map((skill, i) => (
                <span key={i} className="skill-tag">
                  {skill}
                </span>
              ))}
            </div>
            
            {/* Rate and action */}
            <div className="flex justify-between items-center">
              <div>
                <span className="text-beamly-secondary font-bold text-xl">{freelancer.hourlyRate}</span>
                <span className="text-gray-400 text-sm ml-1">/hr</span>
              </div>
              <Button 
                color="secondary"
                size="md"
                className="font-medium text-beamly-third px-6"
                onPress={() => handleViewProfile(freelancer.id)}
              >
                View Profile
              </Button>
            </div>
          </motion.div>
        ))}
      </div>
      
      {filteredFreelancers.length === 0 && (
        <div className={`text-center py-12 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
          <Icon icon="lucide:search" className="mx-auto mb-4 text-4xl text-gray-400" />
          <h3 className="text-lg md:text-xl font-semibold mb-2">{t('browseFreelancers.noFreelancersFound')}</h3>
          <p className="text-gray-400 text-sm md:text-base">{t('browseFreelancers.tryAdjusting')}</p>
        </div>
      )}
      
      {filteredFreelancers.length > 0 && (
        <div className="flex justify-center mt-8 md:mt-10">
          <Button 
            color="primary"
            variant="bordered"
            className={isDarkMode ? "text-white border-white/30" : "text-beamly-primary border-beamly-primary/30"}
            onPress={() => {
              console.log("Load more");
            }}
          >
            {t('browseFreelancers.loadMore')}
          </Button>
        </div>
      )}
    </div>
  );
};