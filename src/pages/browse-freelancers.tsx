import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Input, 
  Button, 
  Card, 
  CardBody, 
  Avatar, 
  Chip, 
  Select, 
  SelectItem,
  Skeleton 
} from "@nextui-org/react";
import { Icon } from "@iconify/react";
import { useTranslation } from "react-i18next";
import { collection, query, where, orderBy, limit, getDocs, DocumentSnapshot, startAfter } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useNavigate, useSearchParams } from "react-router-dom";

export const BrowseFreelancersPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'all');
  const [sortBy, setSortBy] = useState('rating');
  const [freelancers, setFreelancers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastDoc, setLastDoc] = useState<DocumentSnapshot | null>(null);
  const [hasMore, setHasMore] = useState(true);
  
  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'design', label: 'Design' },
    { value: 'development', label: 'Development' },
    { value: 'writing', label: 'Writing' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'video', label: 'Video & Animation' },
    { value: 'music', label: 'Music & Audio' },
    { value: 'business', label: 'Business' },
  ];
  
  useEffect(() => {
    fetchFreelancers(true);
  }, [selectedCategory, sortBy]);
  
  const fetchFreelancers = async (reset = false) => {
    setLoading(true);
    try {
      let q = query(
        collection(db, 'users'),
        where('userType', 'in', ['freelancer', 'both'])
      );
      
      // Add category filter if not 'all'
      if (selectedCategory !== 'all') {
        q = query(q, where('skills', 'array-contains-any', getCategorySkills(selectedCategory)));
      }
      
      // Add sorting
      switch (sortBy) {
        case 'rating':
          q = query(q, orderBy('rating', 'desc'));
          break;
        case 'projects':
          q = query(q, orderBy('completedProjects', 'desc'));
          break;
        case 'newest':
          q = query(q, orderBy('createdAt', 'desc'));
          break;
      }
      
      // Add pagination
      q = query(q, limit(12));
      
      if (!reset && lastDoc) {
        q = query(q, startAfter(lastDoc));
      }
      
      const snapshot = await getDocs(q);
      
      const newFreelancers = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      if (reset) {
        setFreelancers(newFreelancers);
      } else {
        setFreelancers(prev => [...prev, ...newFreelancers]);
      }
      
      setLastDoc(snapshot.docs[snapshot.docs.length - 1] || null);
      setHasMore(snapshot.docs.length === 12);
    } catch (error) {
      console.error('Error fetching freelancers:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const getCategorySkills = (category: string): string[] => {
    const skillsMap: Record<string, string[]> = {
      design: ['ui-design', 'ux-design', 'graphic-design', 'web-design', 'figma', 'adobe-photoshop'],
      development: ['javascript', 'react', 'node.js', 'python', 'java', 'php'],
      writing: ['content-writing', 'copywriting', 'blog-writing', 'technical-writing'],
      marketing: ['seo', 'social-media', 'google-ads', 'facebook-ads', 'email-marketing'],
      video: ['video-editing', 'animation', 'motion-graphics', 'after-effects'],
      music: ['music-production', 'audio-editing', 'voice-over', 'mixing'],
      business: ['business-analysis', 'project-management', 'consulting', 'strategy']
    };
    
    return skillsMap[category] || [];
  };
  
  const filteredFreelancers = freelancers.filter(freelancer => {
    if (!searchQuery) return true;
    
    const searchLower = searchQuery.toLowerCase();
    return (
      freelancer.displayName?.toLowerCase().includes(searchLower) ||
      freelancer.bio?.toLowerCase().includes(searchLower) ||
      freelancer.skills?.some((skill: string) => skill.toLowerCase().includes(searchLower))
    );
  });
  
  const handleFreelancerClick = (freelancerId: string) => {
    navigate(`/freelancer/${freelancerId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0d1a] to-[#0f1629] py-8">
      <div className="container mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold bg-gradient-to-r from-beamly-primary to-beamly-secondary bg-clip-text text-transparent mb-2">
            {t('browseFreelancers.title')}
          </h1>
          <p className="text-gray-300">
            {t('browseFreelancers.subtitle')}
          </p>
        </motion.div>
        
        {/* Search and Filters */}
        <div className="glass-effect p-6 rounded-xl mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <Input
              size="lg"
              variant="bordered"
              placeholder={t('browseFreelancers.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-white/10"
              startContent={<Icon icon="lucide:search" className="text-gray-400" />}
            />
            <Select
              variant="bordered"
              selectedKeys={[selectedCategory]}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="md:w-48 bg-white/10"
              aria-label="Filter by category"
            >
              {categories.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </Select>
            <Select
              variant="bordered"
              selectedKeys={[sortBy]}
              onChange={(e) => setSortBy(e.target.value)}
              className="md:w-48 bg-white/10"
              aria-label="Sort freelancers by"
            >
              <SelectItem key="rating" value="rating">Highest Rated</SelectItem>
              <SelectItem key="projects" value="projects">Most Projects</SelectItem>
              <SelectItem key="newest" value="newest">Newest</SelectItem>
            </Select>
          </div>
        </div>
        
        {/* Freelancers Grid */}
        {loading && freelancers.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, index) => (
              <Card key={index} className="glass-card">
                <CardBody className="p-4">
                  <Skeleton className="rounded-full w-16 h-16 mx-auto mb-3" />
                  <Skeleton className="h-4 w-3/4 mx-auto mb-2" />
                  <Skeleton className="h-3 w-1/2 mx-auto" />
                </CardBody>
              </Card>
            ))}
          </div>
        ) : filteredFreelancers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredFreelancers.map((freelancer) => (
              <motion.div
                key={freelancer.id}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3 }}
              >
                <Card 
                  className="glass-card hover:scale-105 transition-transform cursor-pointer"
                  onClick={() => handleFreelancerClick(freelancer.id)}
                >
                  <CardBody className="p-4">
                    <div className="text-center">
                      <Avatar
                        src={freelancer.photoURL}
                        name={freelancer.displayName}
                        className="w-16 h-16 mx-auto mb-3"
                      />
                      <h3 className="font-semibold text-white mb-1">
                        {freelancer.displayName || 'Unnamed User'}
                      </h3>
                      <p className="text-sm text-gray-400 mb-3 line-clamp-2">
                        {freelancer.bio || 'No bio available'}
                      </p>
                      
                      {/* Rating */}
                      <div className="flex items-center justify-center gap-1 mb-3">
                        <Icon icon="lucide:star" className="text-beamly-secondary text-sm" />
                        <span className="text-white text-sm">
                          {freelancer.rating || '0.0'}
                        </span>
                        <span className="text-gray-400 text-xs">
                          ({freelancer.completedProjects || 0} projects)
                        </span>
                      </div>
                      
                      {/* Skills */}
                      <div className="flex flex-wrap gap-1 justify-center mb-3">
                        {freelancer.skills?.slice(0, 3).map((skill: string, index: number) => (
                          <Chip
                            key={index}
                            size="sm"
                            variant="flat"
                            className="bg-beamly-primary/20 text-beamly-primary"
                          >
                            {skill}
                          </Chip>
                        ))}
                        {freelancer.skills?.length > 3 && (
                          <Chip
                            size="sm"
                            variant="flat"
                            className="bg-gray-700/50 text-gray-300"
                          >
                            +{freelancer.skills.length - 3}
                          </Chip>
                        )}
                      </div>
                      
                      {/* Hourly Rate */}
                      {freelancer.hourlyRate && (
                        <div className="text-center">
                          <span className="text-beamly-secondary font-semibold">
                            ${freelancer.hourlyRate}/hr
                          </span>
                        </div>
                      )}
                      
                      {/* Availability Badge */}
                      {freelancer.isAvailable && (
                        <div className="mt-2">
                          <Chip
                            size="sm"
                            color="success"
                            variant="dot"
                          >
                            Available
                          </Chip>
                        </div>
                      )}
                    </div>
                  </CardBody>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Icon icon="lucide:users-x" className="text-6xl text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No freelancers found</h3>
            <p className="text-gray-400">Try adjusting your search or filters</p>
          </div>
        )}
        
        {/* Load More */}
        {!loading && hasMore && filteredFreelancers.length > 0 && (
          <div className="text-center mt-8">
            <Button
              color="primary"
              variant="bordered"
              onPress={() => fetchFreelancers(false)}
              className="text-white border-white/30"
            >
              Load More
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};