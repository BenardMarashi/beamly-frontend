import React, { useState, useEffect, useRef } from "react";
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
import { collection, query, where, orderBy, limit, getDocs, DocumentSnapshot, startAfter, QueryConstraint } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useNavigate, useSearchParams } from "react-router-dom";

interface Freelancer {
  id: string;
  displayName?: string;
  photoURL?: string;
  title?: string;
  bio?: string;
  skills?: string[];
  rating?: number;
  completedJobs?: number;
  category?: string;
  hourlyRate?: string;
  experienceLevel?: string;
  isVerified?: boolean;
  userType?: string;
  createdAt?: any;
  email?: string;
  location?: string;
  profileCompleted?: boolean;
  isPro?: boolean;
}

const BrowseFreelancersPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [urlSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(urlSearchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(urlSearchParams.get('category') || 'all');
  const [sortBy, setSortBy] = useState('rating');
  const [budgetFilter, setBudgetFilter] = useState('all');
  
  // CHANGED: Store all fetched users and display separately
  const [allFetchedUsers, setAllFetchedUsers] = useState<Freelancer[]>([]);
  const [freelancers, setFreelancers] = useState<Freelancer[]>([]);
  const [displayCount, setDisplayCount] = useState(12);
  
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const lastDocRef = useRef<DocumentSnapshot | null>(null);
  
  // Initialize search query and category from URL params on mount
  useEffect(() => {
    const search = urlSearchParams.get('search');
    const category = urlSearchParams.get('category');
    
    if (search) setSearchQuery(search);
    if (category) setSelectedCategory(category);
  }, [urlSearchParams]);
    
  const categories = [
    { value: 'all', label: t('freelancers.categories.all') },
    { value: 'design', label: t('freelancers.categories.design') },
    { value: 'development', label: t('freelancers.categories.development') },
    { value: 'writing', label: t('freelancers.categories.writing') },
    { value: 'marketing', label: t('freelancers.categories.marketing') },
    { value: 'video', label: t('freelancers.categories.video') },
    { value: 'music', label: t('freelancers.categories.music') },
    { value: 'business', label: t('freelancers.categories.business') },
    { value: 'data', label: t('freelancers.categories.data') },
    { value: 'photography', label: t('freelancers.categories.photography') },
    { value: 'translation', label: t('freelancers.categories.translation') }
  ];

  const budgetRanges = [
    { value: 'all', label: t('freelancers.budget.all') },
    { value: '0-25', label: t('freelancers.budget.under25') },
    { value: '25-50', label: t('freelancers.budget.25to50') },
    { value: '50-100', label: t('freelancers.budget.50to100') },
    { value: '100+', label: t('freelancers.budget.100plus') }
  ];
  
  const getCategorySkills = (category: string) => {
    const skillsMap: { [key: string]: string[] } = {
      design: ['ui-ux', 'graphic-design', 'logo-design', 'illustration', 'photoshop', 'figma', 'adobe-xd', 'sketch', 'web-design', 'branding'],
      development: ['javascript', 'react', 'node.js', 'python', 'java', 'php', 'angular', 'vue.js', 'typescript', 'html', 'css', 'mongodb', 'sql'],
      writing: ['content-writing', 'copywriting', 'blog-writing', 'technical-writing', 'creative-writing', 'editing', 'proofreading', 'seo-writing'],
      marketing: ['seo', 'social-media', 'google-ads', 'facebook-ads', 'email-marketing', 'content-marketing', 'digital-marketing', 'ppc'],
      video: ['video-editing', 'animation', 'motion-graphics', 'after-effects', 'premiere-pro', '3d-animation', 'video-production'],
      music: ['music-production', 'audio-editing', 'voice-over', 'mixing', 'mastering', 'sound-design', 'podcast-editing'],
      business: ['business-analysis', 'project-management', 'consulting', 'strategy', 'financial-analysis', 'business-development'],
      data: ['data-analysis', 'data-science', 'machine-learning', 'python', 'r', 'sql', 'tableau', 'power-bi', 'statistics'],
      photography: ['photography', 'photo-editing', 'photoshop', 'lightroom', 'product-photography', 'portrait-photography'],
      translation: ['translation', 'transcription', 'localization', 'interpretation', 'subtitling', 'proofreading']
    };
    
    return skillsMap[category] || [];
  };

  // Fetch users from database
  const fetchUsersFromDatabase = async (reset = false) => {
    const scrollPosition = window.scrollY;
    
    setLoading(true);
    try {
      if (reset) {
        lastDocRef.current = null;
        setAllFetchedUsers([]);
        setDisplayCount(12);
      }
      
      const constraints: QueryConstraint[] = [
        where('userType', 'in', ['freelancer', 'both'])
      ];
      
      // Add category filter if not 'all'
      if (selectedCategory !== 'all') {
        constraints.push(where('category', '==', selectedCategory));
      }
      
      // Always use createdAt for ordering to avoid errors
      constraints.push(orderBy('createdAt', 'desc'));
      
      if (!reset && lastDocRef.current) {
        constraints.push(startAfter(lastDocRef.current));
      }
      
      // CHANGED: Fetch more on initial load to ensure we get PRO users
      const fetchLimit = reset ? 100 : 20;
      constraints.push(limit(fetchLimit));
      
      const q = query(collection(db, 'users'), ...constraints);
      
      const querySnapshot = await getDocs(q);
      console.log(`Query returned ${querySnapshot.docs.length} documents (initial: ${reset})`);
      
      if (querySnapshot.docs.length > 0) {
        lastDocRef.current = querySnapshot.docs[querySnapshot.docs.length - 1];
      }
      
      const newUsers = querySnapshot.docs.map(doc => {
        const data = doc.data();
        console.log(`User ${doc.id}: isPro=${data.isPro}, name=${data.displayName}`);
        
        return {
          id: doc.id,
          ...data,
          isPro: data.isPro === true,
          rating: data.rating || 0,
          completedJobs: data.completedJobs || 0,
          hourlyRate: data.hourlyRate || '0',
          createdAt: data.createdAt || { seconds: 0 }
        } as Freelancer;
      });
      
      // Update all fetched users
      if (reset) {
        setAllFetchedUsers(newUsers);
      } else {
        setAllFetchedUsers(prev => [...prev, ...newUsers]);
      }
      
      setHasMore(querySnapshot.docs.length === fetchLimit);
      
      // Restore scroll for load more
      if (!reset && querySnapshot.docs.length > 0) {
        setTimeout(() => {
          window.scrollTo({
            top: scrollPosition,
            behavior: 'instant'
          });
        }, 50);
      }
      
    } catch (error) {
      console.error('Error fetching freelancers:', error);
      if (reset) {
        setAllFetchedUsers([]);
      }
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  };

  // Apply filters and sorting to all fetched users
  const applyFiltersAndSorting = React.useCallback(() => {
    let filtered = [...allFetchedUsers];
    
    // Apply budget filter
    if (budgetFilter !== 'all') {
      const [min, max] = budgetFilter.split('-').map(v => v === '100+' ? '100' : v);
      const minValue = parseInt(min);
      const maxValue = max ? parseInt(max) : Infinity;
      
      filtered = filtered.filter(freelancer => {
        const rate = parseInt(freelancer.hourlyRate || '0');
        if (budgetFilter === '100+') return rate >= 100;
        return rate >= minValue && rate <= maxValue;
      });
    }
    
    // Apply search filter
    if (searchQuery && searchQuery.trim()) {
      const searchLower = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(freelancer => 
        freelancer.displayName?.toLowerCase().includes(searchLower) ||
        freelancer.bio?.toLowerCase().includes(searchLower) ||
        freelancer.title?.toLowerCase().includes(searchLower) ||
        freelancer.skills?.some(skill => skill.toLowerCase().includes(searchLower)) ||
        freelancer.location?.toLowerCase().includes(searchLower)
      );
    }
    
    // SORT WITH PRO USERS ALWAYS FIRST
    const proUsers: Freelancer[] = [];
    const regularUsers: Freelancer[] = [];
    
    filtered.forEach(user => {
      if (user.isPro === true) {
        proUsers.push(user);
      } else {
        regularUsers.push(user);
      }
    });
    
    console.log(`After filtering: ${proUsers.length} Pro users, ${regularUsers.length} regular users out of ${allFetchedUsers.length} total`);
    
    // Sort function for each group
    const compareFunction = (a: Freelancer, b: Freelancer): number => {
      switch (sortBy) {
        case 'rating':
          return (b.rating || 0) - (a.rating || 0);
        case 'completedJobs':
          return (b.completedJobs || 0) - (a.completedJobs || 0);
        case 'hourlyRate':
          const aRate = parseInt(a.hourlyRate || '0');
          const bRate = parseInt(b.hourlyRate || '0');
          return aRate - bRate;
        case 'newest':
        default:
          const aTime = a.createdAt?.seconds || 0;
          const bTime = b.createdAt?.seconds || 0;
          return bTime - aTime;
      }
    };
    
    // Sort each group
    const sortedProUsers = [...proUsers].sort(compareFunction);
    const sortedRegularUsers = [...regularUsers].sort(compareFunction);
    
    // Combine with Pro users FIRST
    const sorted = [...sortedProUsers, ...sortedRegularUsers];
    
    // Display only the amount we want
    const displayed = sorted.slice(0, displayCount);
    
    console.log('First 3 after sorting:', displayed.slice(0, 3).map(f => ({
      name: f.displayName,
      isPro: f.isPro
    })));
    
    setFreelancers(displayed);
    
    // Check if we need more data
    if (displayed.length < displayCount && hasMore && !loading) {
      fetchUsersFromDatabase(false);
    }
  }, [allFetchedUsers, budgetFilter, searchQuery, sortBy, displayCount, hasMore, loading]);

  // Apply filters when data or filters change
  useEffect(() => {
    applyFiltersAndSorting();
  }, [applyFiltersAndSorting]);

  // Initial load and category change
  useEffect(() => {
    setFreelancers([]);
    setAllFetchedUsers([]);
    setDisplayCount(12);
    lastDocRef.current = null;
    fetchUsersFromDatabase(true);
  }, [selectedCategory]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setDisplayCount(12);
    applyFiltersAndSorting();
  };

  const handleLoadMore = () => {
    const currentPosition = window.scrollY;
    
    // Check if we have more filtered results to show
    let filtered = [...allFetchedUsers];
    
    // Apply same filters
    if (budgetFilter !== 'all') {
      const [min, max] = budgetFilter.split('-').map(v => v === '100+' ? '100' : v);
      const minValue = parseInt(min);
      const maxValue = max ? parseInt(max) : Infinity;
      
      filtered = filtered.filter(freelancer => {
        const rate = parseInt(freelancer.hourlyRate || '0');
        if (budgetFilter === '100+') return rate >= 100;
        return rate >= minValue && rate <= maxValue;
      });
    }
    
    if (searchQuery && searchQuery.trim()) {
      const searchLower = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(freelancer => 
        freelancer.displayName?.toLowerCase().includes(searchLower) ||
        freelancer.bio?.toLowerCase().includes(searchLower) ||
        freelancer.title?.toLowerCase().includes(searchLower) ||
        freelancer.skills?.some(skill => skill.toLowerCase().includes(searchLower)) ||
        freelancer.location?.toLowerCase().includes(searchLower)
      );
    }
    
    if (displayCount < filtered.length) {
      // We have more filtered results to show
      setDisplayCount(prev => prev + 12);
    } else if (hasMore) {
      // Need to fetch more from database
      fetchUsersFromDatabase(false).then(() => {
        setDisplayCount(prev => prev + 12);
      });
    }
    
    setTimeout(() => {
      window.scrollTo({
        top: currentPosition,
        behavior: 'instant'
      });
    }, 100);
  };

  const handleFreelancerClick = React.useCallback((freelancerId: string) => {
    if (!freelancerId) {
      console.error('Invalid freelancer ID');
      return;
    }
    navigate(`/freelancer/${freelancerId}`);
  }, [navigate]);

  const getExperienceLevelLabel = (level: string) => {
    switch (level) {
      case 'entry':
        return t('freelancers.experienceLevel.entry');
      case 'intermediate':
        return t('freelancers.experienceLevel.intermediate');
      case 'expert':
        return t('freelancers.experienceLevel.expert');
      default:
        return t('freelancers.experienceLevel.professional');
    }
  };

  const getInitials = (name?: string, email?: string) => {
    if (name) {
      return name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    if (email) {
      return email[0].toUpperCase();
    }
    return 'F';
  };

  return (
    <div className="container mx-auto px-4 py-6 pb-20 pt-20">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <h1 className="text-2xl md:text-3xl font-bold mb-2 text-white">{t('freelancers.title')}</h1>
        <p className="text-gray-300 mb-6">{t('freelancers.subtitle')}</p>
        
        {/* Search and Filters */}
        <div className="glass-effect p-4 md:p-6 rounded-xl mb-8">
          <form onSubmit={handleSearch} className="flex flex-col gap-4">
            <div className="flex flex-row gap-2" style={{ flexWrap: 'nowrap' }}>
              <Input
                size="lg"
                variant="bordered"
                placeholder={t('freelancers.searchPlaceholder')}
                value={searchQuery}
                onValueChange={setSearchQuery}
                startContent={<Icon icon="lucide:search" className="text-gray-400" />}
                className="flex-1"
                classNames={{
                  input: "text-white placeholder:text-gray-400",
                  inputWrapper: "bg-white/10 border-white/20"
                }}
              />
              <Button 
                type="submit"
                color="secondary"
                size="lg"
                className="font-medium text-beamly-third md:px-8"
              >
                {t('common.search')}
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Category Select */}
            <Select
              label={t('freelancers.filters.category')}
              selectedKeys={[selectedCategory]}
              onSelectionChange={(keys) => {
                const selected = Array.from(keys)[0] as string;
                if (selected) {
                  setSelectedCategory(selected);
                }
              }}
              className="w-full"
              classNames={{
                trigger: "bg-white/10 border-white/20 text-white",
                value: "text-white",
                label: "text-gray-400"
              }}
              disallowEmptySelection={true}
            >
              {categories.map((category) => (
                <SelectItem key={category.value} value={category.value}>
                  {category.label}
                </SelectItem>
              ))}
            </Select>

            {/* Budget Range Select */}
            <Select
              label={t('freelancers.filters.budgetRange')}
              selectedKeys={[budgetFilter]}
              onSelectionChange={(keys) => {
                const selected = Array.from(keys)[0] as string;
                if (selected) {
                  setBudgetFilter(selected);
                }
              }}
              className="w-full"
              classNames={{
                trigger: "bg-white/10 border-white/20 text-white",
                value: "text-white",
                label: "text-gray-400"
              }}
              disallowEmptySelection={true}
            >
              {budgetRanges.map((range) => (
                <SelectItem key={range.value} value={range.value}>
                  {range.label}
                </SelectItem>
              ))}
            </Select>

            {/* Sort By Select - WITH DEFAULT OPTION */}
            <Select
              label={t('freelancers.filters.sortBy')}
              selectedKeys={sortBy ? [sortBy] : []}
              onSelectionChange={(keys) => {
                const selected = Array.from(keys)[0] as string;
                if (selected) {
                  setSortBy(selected);
                }
              }}
              className="w-full"
              classNames={{
                trigger: "bg-white/10 border-white/20 text-white",
                value: "text-white",
                label: "text-gray-400"
              }}
              placeholder={t('freelancers.filters.selectSorting')}
            >
              <SelectItem key="rating" value="rating">{t('freelancers.sort.highestRated')}</SelectItem>
              <SelectItem key="completedJobs" value="completedJobs">{t('freelancers.sort.mostProjects')}</SelectItem>
              <SelectItem key="hourlyRate" value="hourlyRate">{t('freelancers.sort.lowestPrice')}</SelectItem>
              <SelectItem key="newest" value="newest">{t('freelancers.sort.newest')}</SelectItem>
            </Select>
            </div>
          </form>
        </div>
        
        {/* Freelancers Grid */}
        {loading && freelancers.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="glass-effect">
                <CardBody className="p-6">
                  <Skeleton className="rounded-full w-16 h-16 mb-4" />
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-3 w-full mb-4" />
                  <Skeleton className="h-8 w-full" />
                </CardBody>
              </Card>
            ))}
          </div>
        ) : freelancers.length === 0 ? (
          <Card className="glass-effect">
            <CardBody className="text-center py-12">
              <Icon icon="lucide:users-x" className="text-4xl text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">{t('freelancers.noResults')}</h3>
              <p className="text-gray-400">{t('freelancers.tryAdjusting')}</p>
            </CardBody>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {freelancers.map((freelancer) => (
                <motion.div
                  key={freelancer.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ scale: 1.05 }}
                  onClick={() => handleFreelancerClick(freelancer.id)}
                  className="cursor-pointer"
                >
                  <Card className="glass-effect hover:bg-white/10 transition-all duration-200 overflow-hidden"> {/* Add overflow-hidden */}
                    <CardBody className="p-6">
                      <div className="flex items-center gap-4 mb-4">
                        {freelancer.photoURL ? (
                          <Avatar
                            src={freelancer.photoURL}
                            className="w-16 h-16 flex-shrink-0" // Add flex-shrink-0
                            name={freelancer.displayName}
                          />
                        ) : (
                          <Avatar
                            name={getInitials(freelancer.displayName, freelancer.email)}
                            className="w-16 h-16 flex-shrink-0" // Add flex-shrink-0
                            classNames={{
                              base: "bg-beamly-secondary/20",
                              name: "text-beamly-secondary font-bold"
                            }}
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-white truncate flex-1">
                              {freelancer.displayName || t('freelancers.anonymousFreelancer')}
                            </h3>
                            {freelancer.isPro && (
                              <Chip
                                size="sm"
                                color="warning"
                                variant="flat"
                                className="flex-shrink-0"
                                startContent={<Icon icon="lucide:crown" className="text-xs" />}
                              >
                                {t('common.pro')}
                              </Chip>
                            )}
                          </div>
                          <p className="text-sm text-gray-300 truncate">
                            {freelancer.title || getExperienceLevelLabel(freelancer.experienceLevel || '')}
                          </p>
                      </div>
                    </div>
                      
                      {/* Bio already has line-clamp-2 which is good */}
                      
                      {freelancer.skills && freelancer.skills.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4 overflow-hidden"> {/* Add overflow-hidden */}
                          {freelancer.skills.slice(0, 3).map((skill, idx) => (
                            <Chip 
                              key={idx} 
                              size="sm" 
                              variant="flat"
                              className="bg-white/10 text-white max-w-[120px]" // Add max-width
                            >
                              <span className="truncate">{skill}</span> {/* Add truncate */}
                            </Chip>
                          ))}
                          {freelancer.skills.length > 3 && (
                            <Chip size="sm" variant="flat" className="bg-white/10 text-gray-400">
                              +{freelancer.skills.length - 3}
                            </Chip>
                          )}
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-1 min-w-0"> {/* Add min-w-0 */}
                          <Icon icon="lucide:star" className="text-yellow-500 flex-shrink-0" />
                          <span className="text-white whitespace-nowrap">{freelancer.rating || '0.0'}</span>
                          <span className="text-gray-400 truncate"> {/* Add truncate */}
                            ({freelancer.completedJobs || 0} {freelancer.completedJobs === 1 ? t('freelancers.job') : t('freelancers.jobs')})
                          </span>
                        </div>
                        {freelancer.hourlyRate && (
                          <span className="text-beamly-secondary font-semibold whitespace-nowrap"> {/* Add whitespace-nowrap */}
                            €{freelancer.hourlyRate}{t('common.perHour')}
                          </span>
                        )}
                      </div>
                      
                      {!freelancer.profileCompleted && (
                        <div className="mt-3 pt-3 border-t border-white/10">
                          <p className="text-xs text-gray-400 flex items-center gap-1">
                            <Icon icon="lucide:alert-circle" className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">{t('freelancers.profileIncomplete')}</span>
                          </p>
                        </div>
                      )}
                    </CardBody>
                  </Card>
                </motion.div>
              ))}
            </div>
            {(hasMore || freelancers.length >= 12) && !loading && (
              <div className="text-center mt-8">
                <Button
                  color="secondary"
                  variant="bordered"
                  size="lg"
                  onPress={handleLoadMore}
                  disabled={loading}
                  className="font-medium"
                >
                  {t('common.loadMore')}
                </Button>
              </div>
            )}

            {/* Loading spinner when loading more */}
            {loading && freelancers.length > 0 && (
              <div className="text-center mt-8">
                <div className="inline-flex items-center gap-2 text-gray-400">
                  <Icon icon="eos-icons:loading" className="animate-spin text-2xl" />
                  <span>{t('common.loadingMore')}</span>
                </div>
              </div>
            )}

            {loading && freelancers.length > 0 && ( // Show spinner when loading more
              <div className="text-center mt-8">
                <div className="inline-flex items-center gap-2 text-gray-400">
                  <Icon icon="eos-icons:loading" className="animate-spin text-2xl" />
                  <span>{t('common.loadingMore')}</span>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default BrowseFreelancersPage;