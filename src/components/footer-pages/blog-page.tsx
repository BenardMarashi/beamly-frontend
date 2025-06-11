import React from "react";
import { motion } from "framer-motion";
import { Button, Input, Chip } from "@heroui/react";
import { Icon } from "@iconify/react";
import { PageHeader } from "../page-header";

export const BlogPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState("all");
  
  const categories = [
    { id: "all", name: "All Posts" },
    { id: "freelancing", name: "Freelancing Tips" },
    { id: "business", name: "Business Growth" },
    { id: "design", name: "Design" },
    { id: "development", name: "Development" },
    { id: "marketing", name: "Marketing" }
  ];
  
  const featuredPost = {
    id: 1,
    title: "10 Ways to Grow Your Freelance Business in 2023",
    excerpt: "Discover proven strategies to expand your client base, increase your rates, and build a sustainable freelance career in today's competitive market.",
    image: "https://img.heroui.chat/image/ai?w=800&h=400&u=blog1",
    author: "Sarah Johnson",
    authorImage: "https://img.heroui.chat/image/avatar?w=60&h=60&u=sarah1",
    date: "January 15, 2023",
    category: "freelancing",
    readTime: "8 min read"
  };
  
  const blogPosts = [
    {
      id: 2,
      title: "Essential Tools Every Freelance Developer Should Use",
      excerpt: "Boost your productivity and streamline your workflow with these must-have tools for coding, project management, and client communication.",
      image: "https://img.heroui.chat/image/ai?w=400&h=250&u=blog2",
      author: "Michael Chen",
      authorImage: "https://img.heroui.chat/image/avatar?w=60&h=60&u=michael1",
      date: "January 10, 2023",
      category: "development",
      readTime: "6 min read"
    },
    {
      id: 3,
      title: "How to Create a Stunning Portfolio That Wins Clients",
      excerpt: "Learn the key elements of an effective portfolio that showcases your skills and convinces potential clients to hire you.",
      image: "https://img.heroui.chat/image/ai?w=400&h=250&u=blog3",
      author: "Jessica Williams",
      authorImage: "https://img.heroui.chat/image/avatar?w=60&h=60&u=jessica1",
      date: "January 5, 2023",
      category: "design",
      readTime: "5 min read"
    },
    {
      id: 4,
      title: "Effective Strategies for Setting Your Freelance Rates",
      excerpt: "Stop undercharging for your services. This guide will help you determine your worth and confidently communicate your rates to clients.",
      image: "https://img.heroui.chat/image/ai?w=400&h=250&u=blog4",
      author: "David Wilson",
      authorImage: "https://img.heroui.chat/image/avatar?w=60&h=60&u=david1",
      date: "December 28, 2022",
      category: "freelancing",
      readTime: "7 min read"
    },
    {
      id: 5,
      title: "Building a Social Media Strategy for Small Businesses",
      excerpt: "A comprehensive guide to creating and implementing a social media marketing plan that drives engagement and conversions.",
      image: "https://img.heroui.chat/image/ai?w=400&h=250&u=blog5",
      author: "Emily Rodriguez",
      authorImage: "https://img.heroui.chat/image/avatar?w=60&h=60&u=emily1",
      date: "December 20, 2022",
      category: "marketing",
      readTime: "9 min read"
    },
    {
      id: 6,
      title: "How to Scale Your Freelance Business into an Agency",
      excerpt: "Ready to grow beyond solo freelancing? Learn the steps to transform your one-person operation into a thriving agency.",
      image: "https://img.heroui.chat/image/ai?w=400&h=250&u=blog6",
      author: "James Thompson",
      authorImage: "https://img.heroui.chat/image/avatar?w=60&h=60&u=james1",
      date: "December 15, 2022",
      category: "business",
      readTime: "10 min read"
    }
  ];
  
  const filteredPosts = selectedCategory === "all" 
    ? blogPosts 
    : blogPosts.filter(post => post.category === selectedCategory);

  return (
    <div className="container mx-auto px-4 py-8">
      <PageHeader 
        title="Beamly Blog"
        subtitle="Insights, tips, and resources for freelancers and businesses"
        showBackButton
      />
      
      <div className="flex flex-col md:flex-row gap-8 mb-12">
        <div className="md:w-3/4">
          <div className="glass-effect p-6 mb-8">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <Input
                placeholder="Search articles..."
                value={searchQuery}
                onValueChange={setSearchQuery}
                startContent={<Icon icon="lucide:search" className="text-gray-400" />}
                className="flex-1 bg-white/10 border-white/20"
              />
              <div className="flex gap-2 flex-wrap">
                {categories.map((category) => (
                  <Chip
                    key={category.id}
                    color={selectedCategory === category.id ? "secondary" : "default"}
                    variant={selectedCategory === category.id ? "solid" : "bordered"}
                    className={selectedCategory === category.id ? "text-beamly-third" : "text-white"}
                    onClick={() => setSelectedCategory(category.id)}
                  >
                    {category.name}
                  </Chip>
                ))}
              </div>
            </div>
          </div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="glass-card overflow-hidden mb-8 card-hover"
          >
            <div className="relative">
              <img 
                src={featuredPost.image} 
                alt={featuredPost.title} 
                className="w-full h-64 md:h-80 object-cover"
              />
              <div className="absolute top-4 left-4">
                <Chip color="secondary" className="text-beamly-third">Featured</Chip>
              </div>
            </div>
            <div className="p-6">
              <div className="flex items-center mb-4">
                <img 
                  src={featuredPost.authorImage} 
                  alt={featuredPost.author} 
                  className="w-10 h-10 rounded-full mr-3"
                />
                <div>
                  <p className="text-white font-medium">{featuredPost.author}</p>
                  <div className="flex items-center text-sm text-gray-400">
                    <span>{featuredPost.date}</span>
                    <span className="mx-2">•</span>
                    <span>{featuredPost.readTime}</span>
                  </div>
                </div>
              </div>
              <h2 className="text-2xl font-bold text-white mb-3">{featuredPost.title}</h2>
              <p className="text-gray-300 mb-4">{featuredPost.excerpt}</p>
              <Button 
                color="secondary"
                className="text-beamly-third"
                endContent={<Icon icon="lucide:arrow-right" />}
              >
                Read Article
              </Button>
            </div>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredPosts.map((post, index) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="glass-card overflow-hidden card-hover"
              >
                <img 
                  src={post.image} 
                  alt={post.title} 
                  className="w-full h-48 object-cover"
                />
                <div className="p-5">
                  <div className="flex items-center mb-3">
                    <img 
                      src={post.authorImage} 
                      alt={post.author} 
                      className="w-8 h-8 rounded-full mr-2"
                    />
                    <div className="text-sm">
                      <p className="text-white">{post.author}</p>
                      <div className="flex items-center text-xs text-gray-400">
                        <span>{post.date}</span>
                        <span className="mx-1">•</span>
                        <span>{post.readTime}</span>
                      </div>
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">{post.title}</h3>
                  <p className="text-gray-300 text-sm mb-4 line-clamp-2">{post.excerpt}</p>
                  <Button 
                    color="default"
                    variant="light"
                    size="sm"
                    className="text-white"
                    endContent={<Icon icon="lucide:arrow-right" width={16} />}
                  >
                    Read More
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
          
          <div className="flex justify-center mt-8">
            <Button 
              color="primary"
              variant="bordered"
              className="text-white border-white/30"
            >
              Load More Articles
            </Button>
          </div>
        </div>
        
        <div className="md:w-1/4">
          <div className="glass-effect p-5 mb-6">
            <h3 className="text-lg font-semibold text-white mb-4">Subscribe to Our Newsletter</h3>
            <p className="text-gray-300 text-sm mb-4">Get the latest articles, resources, and tips delivered directly to your inbox.</p>
            <Input
              placeholder="Your email address"
              className="mb-3 bg-white/10 border-white/20"
            />
            <Button 
              color="secondary"
              className="w-full text-beamly-third"
            >
              Subscribe
            </Button>
          </div>
          
          <div className="glass-effect p-5">
            <h3 className="text-lg font-semibold text-white mb-4">Popular Tags</h3>
            <div className="flex flex-wrap gap-2">
              {["Freelancing", "Remote Work", "Productivity", "Client Management", "Invoicing", "Marketing", "Portfolio", "Networking", "Skills", "Tools"].map((tag, index) => (
                <Chip
                  key={index}
                  variant="flat"
                  color="default"
                  className="bg-white/10 text-white"
                >
                  {tag}
                </Chip>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};