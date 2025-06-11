import React from "react";
import { motion } from "framer-motion";
import { Input, Button, Card, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@heroui/react";
import { Icon } from "@iconify/react";
import { PageHeader } from "./page-header";

const popularSearches = ["Web Development", "Logo Design", "Content Writing", "Mobile App", "UI/UX Design", "Video Editing"];

const services = [
  {
    id: 1,
    title: "Professional Logo Design",
    category: "Graphic Design",
    rating: 4.9,
    reviews: 253,
    price: 120,
    image: "https://img.heroui.chat/image/ai?w=400&h=300&u=service1"
  },
  {
    id: 2,
    title: "Full Stack Web Development",
    category: "Web Development",
    rating: 4.8,
    reviews: 189,
    price: 450,
    image: "https://img.heroui.chat/image/ai?w=400&h=300&u=service2"
  },
  {
    id: 3,
    title: "SEO Optimization",
    category: "Digital Marketing",
    rating: 4.7,
    reviews: 142,
    price: 200,
    image: "https://img.heroui.chat/image/ai?w=400&h=300&u=service3"
  },
  {
    id: 4,
    title: "Mobile App Development",
    category: "Programming",
    rating: 4.9,
    reviews: 217,
    price: 650,
    image: "https://img.heroui.chat/image/ai?w=400&h=300&u=service4"
  },
  {
    id: 5,
    title: "Content Writing",
    category: "Writing & Translation",
    rating: 4.8,
    reviews: 176,
    price: 80,
    image: "https://img.heroui.chat/image/ai?w=400&h=300&u=service5"
  },
  {
    id: 6,
    title: "Video Editing & Animation",
    category: "Video & Animation",
    rating: 4.9,
    reviews: 203,
    price: 250,
    image: "https://img.heroui.chat/image/ai?w=400&h=300&u=service6"
  },
  {
    id: 7,
    title: "Social Media Management",
    category: "Digital Marketing",
    rating: 4.7,
    reviews: 158,
    price: 180,
    image: "https://img.heroui.chat/image/ai?w=400&h=300&u=service7"
  },
  {
    id: 8,
    title: "UI/UX Design",
    category: "Graphic Design",
    rating: 4.8,
    reviews: 194,
    price: 350,
    image: "https://img.heroui.chat/image/ai?w=400&h=300&u=service8"
  }
];

export const ExplorePage: React.FC = () => {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [sortBy, setSortBy] = React.useState("popular");

  return (
    <div className="container mx-auto px-4 py-8">
      <PageHeader 
        title="Explore Services"
        subtitle="Discover top-rated services from talented freelancers"
      />
      
      <div className="glass-effect p-6 mb-8">
        <div className="flex flex-col md:flex-row gap-4">
          <Input
            placeholder="Search for services..."
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
        
        <div className="mt-4">
          <p className="text-sm text-gray-300 mb-2">Popular searches:</p>
          <div className="flex flex-wrap gap-2">
            {popularSearches.map((term, index) => (
              <Button
                key={index}
                variant="flat"
                color="default"
                size="sm"
                className="bg-white/10 text-white"
                onPress={() => setSearchQuery(term)}
              >
                {term}
              </Button>
            ))}
          </div>
        </div>
      </div>
      
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-white">
          {searchQuery ? `Results for "${searchQuery}"` : "All Services"}
        </h2>
        <Dropdown>
          <DropdownTrigger>
            <Button 
              variant="bordered" 
              className="border-white/20 text-white"
              endContent={<Icon icon="lucide:chevron-down" />}
            >
              Sort by: {sortBy === "popular" ? "Most Popular" : sortBy === "recent" ? "Most Recent" : "Price"}
            </Button>
          </DropdownTrigger>
          <DropdownMenu 
            aria-label="Sort options"
            onAction={(key) => setSortBy(key as string)}
            className="bg-[#010b29]/95 backdrop-blur-md border border-white/10"
          >
            <DropdownItem key="popular" className="text-white">Most Popular</DropdownItem>
            <DropdownItem key="recent" className="text-white">Most Recent</DropdownItem>
            <DropdownItem key="price-low" className="text-white">Price: Low to High</DropdownItem>
            <DropdownItem key="price-high" className="text-white">Price: High to Low</DropdownItem>
          </DropdownMenu>
        </Dropdown>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {services.map((service) => (
          <motion.div
            key={service.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div className="glass-card overflow-hidden card-hover h-full">
              <img 
                src={service.image} 
                alt={service.title} 
                className="w-full h-48 object-cover"
              />
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs bg-beamly-primary/20 text-beamly-primary px-2 py-1 rounded-full">
                    {service.category}
                  </span>
                  <div className="flex items-center">
                    <Icon icon="lucide:star" className="text-beamly-secondary text-sm" />
                    <span className="text-white ml-1 text-sm">{service.rating}</span>
                    <span className="text-gray-400 text-xs ml-1">({service.reviews})</span>
                  </div>
                </div>
                <h3 className="text-white font-semibold mb-2">{service.title}</h3>
                <div className="flex justify-between items-center mt-4">
                  <span className="text-beamly-secondary font-semibold">${service.price}</span>
                  <Button 
                    size="sm" 
                    color="secondary"
                    className="text-beamly-third"
                  >
                    View Details
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
      
      <div className="flex justify-center mt-10">
        <Button 
          color="primary"
          variant="bordered"
          className="text-white border-white/30"
        >
          Load More
        </Button>
      </div>
    </div>
  );
};