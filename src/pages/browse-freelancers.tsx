import React, { useState, useEffect, useRef, useMemo, useCallback, memo } from "react";
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
import { formatNameWithInitial } from '../utils/nameFormatter';

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

// Memoized freelancer card component
const FreelancerCard = memo(({ 
  freelancer, 
  onClick, 
  getInitials,
  getExperienceLevelLabel,
  t 
}: {
  freelancer: Freelancer;
  onClick: (id: string) => void;
  getInitials: (name?: string, email?: string) => string;
  getExperienceLevelLabel: (level: string) => string;
  t: any;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    whileHover={{ scale: 1.05 }}
    onClick={() => onClick(freelancer.id)}
    className="cursor-pointer"
  >
    <Card className="glass-effect hover:bg-white/10 transition-all duration-200 overflow-hidden">
      <CardBody className="p-6">
        <div className="flex items-center gap-4 mb-4">
          {freelancer.photoURL ? (
            <Avatar
              src={freelancer.photoURL}
              className="w-16 h-16 flex-shrink-0"
              name={freelancer.displayName}
            />
          ) : (
            <Avatar
              name={getInitials(freelancer.displayName, freelancer.email)}
              className="w-16 h-16 flex-shrink-0"
              classNames={{
                base: "bg-beamly-secondary/20",
                name: "text-beamly-secondary font-bold"
              }}
            />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-white truncate flex-1">
                {formatNameWithInitial(freelancer.displayName) || t('freelancers.anonymousFreelancer')}
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
        
        {freelancer.skills && freelancer.skills.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4 overflow-hidden">
            {freelancer.skills.slice(0, 3).map((skill, idx) => (
              <Chip 
                key={idx} 
                size="sm" 
                variant="flat"
                className="bg-white/10 text-white max-w-[120px]"
              >
                <span className="truncate">{skill}</span>
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
          <div className="flex items-center gap-1 min-w-0">
            <Icon icon="lucide:star" className="text-yellow-500 flex-shrink-0" />
            <span className="text-white whitespace-nowrap">{freelancer.rating || '0.0'}</span>
            <span className="text-gray-400 truncate">
              ({freelancer.completedJobs || 0} {freelancer.completedJobs === 1 ? t('freelancers.job') : t('freelancers.jobs')})
            </span>
          </div>
          {freelancer.hourlyRate && (
            <span className="text-beamly-secondary font-semibold whitespace-nowrap">
              €{freelancer.hourlyRate}{t('common.perHour')}
            </span>
          )}
        </div>
        
        
      </CardBody>
    </Card>
  </motion.div>
));

const BrowseFreelancersPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [urlSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(urlSearchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(urlSearchParams.get('category') || 'all');
  const [sortBy, setSortBy] = useState('rating');
  const [budgetFilter, setBudgetFilter] = useState('all');
  
  const [allFetchedUsers, setAllFetchedUsers] = useState<Freelancer[]>([]);
  const [displayCount, setDisplayCount] = useState(12);
  
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const lastDocRef = useRef<DocumentSnapshot | null>(null);
  
  // Initialize from URL params
  useEffect(() => {
    const search = urlSearchParams.get('search');
    const category = urlSearchParams.get('category');
    
    if (search) setSearchQuery(search);
    if (category) setSelectedCategory(category);
  }, [urlSearchParams]);
    
  // Memoize static data
  const categories = useMemo(() => [
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
  ], [t]);

  const budgetRanges = useMemo(() => [
    { value: 'all', label: t('freelancers.budget.all') },
    { value: '0-25', label: t('freelancers.budget.under25') },
    { value: '25-50', label: t('freelancers.budget.25to50') },
    { value: '50-100', label: t('freelancers.budget.50to100') },
    { value: '100+', label: t('freelancers.budget.100plus') }
  ], [t]);

  // Fetch users from database
const fetchUsersFromDatabase = useCallback(async (reset = false) => {
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
    
    if (selectedCategory !== 'all') {
      constraints.push(where('category', '==', selectedCategory));
    }
    
    // ✅ NO orderBy - sorting happens in memory instead
    // This avoids needing a composite index
    
    if (!reset && lastDocRef.current) {
      constraints.push(startAfter(lastDocRef.current));
    }
    
    const fetchLimit = reset ? 500 : 50;
    constraints.push(limit(fetchLimit));
    
    const q = query(collection(db, 'users'), ...constraints);
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.docs.length > 0) {
      lastDocRef.current = querySnapshot.docs[querySnapshot.docs.length - 1];
    }
    
    const newUsers = querySnapshot.docs.map(doc => {
      const data = doc.data();
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
    
    if (reset) {
      setAllFetchedUsers(newUsers);
    } else {
      setAllFetchedUsers(prev => {
        const existingIds = new Set(prev.map(u => u.id));
        const uniqueNewUsers = newUsers.filter(u => !existingIds.has(u.id));
        return [...prev, ...uniqueNewUsers];
      });
    }
    
    setHasMore(querySnapshot.docs.length === fetchLimit);
    
    if (!reset && querySnapshot.docs.length > 0) {
      setTimeout(() => {
        window.scrollTo({ top: scrollPosition, behavior: 'instant' });
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
}, [selectedCategory]);

const filteredAndSortedFreelancers = useMemo(() => {
  // Remove duplicates first
  const uniqueUsersMap = new Map<string, Freelancer>();
  allFetchedUsers.forEach(user => {
    uniqueUsersMap.set(user.id, user);
  });
  const uniqueUsers = Array.from(uniqueUsersMap.values());
  
  // Apply profile completion filter
  const completedProfiles = uniqueUsers.filter(user => {
    if (user.profileCompleted === true) return true;
    
    const hasDisplayName = user.displayName && user.displayName.trim() !== '';
    const hasBio = user.bio && user.bio.trim() !== '';
    
    if (user.userType === 'freelancer' || user.userType === 'both') {
      const hasSkills = user.skills && user.skills.length > 0;
      const hasHourlyRate = user.hourlyRate && parseFloat(user.hourlyRate) > 0;
      
      return hasDisplayName && hasBio && hasSkills && hasHourlyRate;
    }
    
    return hasDisplayName && hasBio;
  });
  
  // Apply search and budget filters
  const searchLower = searchQuery.toLowerCase().trim();
  const [minBudget, maxBudget] = budgetFilter === 'all' 
    ? [0, Infinity] 
    : budgetFilter === '100+' 
      ? [100, Infinity]
      : budgetFilter.split('-').map(Number);

  const filtered = completedProfiles.filter(freelancer => {
    const rate = parseInt(freelancer.hourlyRate || '0');
    if (rate < minBudget || rate > (maxBudget || Infinity)) return false;
    
    if (searchLower && !(
      freelancer.displayName?.toLowerCase().includes(searchLower) ||
      freelancer.bio?.toLowerCase().includes(searchLower) ||
      freelancer.title?.toLowerCase().includes(searchLower) ||
      freelancer.skills?.some(skill => skill.toLowerCase().includes(searchLower)) ||
      freelancer.location?.toLowerCase().includes(searchLower)
    )) return false;
    
    return true;
  });

  // ✅ SORT: PRO users first (by createdAt asc), then regular users (by createdAt asc)
  const sorted = [...filtered].sort((a, b) => {
  const aIsPro = a.isPro === true;
  const bIsPro = b.isPro === true;
  
  // PRO users always first
  if (aIsPro && !bIsPro) return -1;
  if (!aIsPro && bIsPro) return 1;
  
  // Within same tier, different sorting
  const aTime = a.createdAt?.seconds || 0;
  const bTime = b.createdAt?.seconds || 0;
  
  if (aIsPro && bIsPro) {
    // Both PRO: oldest first (ascending)
    return aTime - bTime;
  } else {
    // Both regular: newest first (descending)
    return bTime - aTime;
  }
});

  return sorted.slice(0, displayCount);
}, [allFetchedUsers, budgetFilter, searchQuery, sortBy, displayCount]);

  // Check if need more data
  useEffect(() => {
    if (filteredAndSortedFreelancers.length < displayCount && hasMore && !loading) {
      fetchUsersFromDatabase(false);
    }
  }, [filteredAndSortedFreelancers.length, displayCount, hasMore, loading, fetchUsersFromDatabase]);

  // Initial load and category change
  useEffect(() => {
    setAllFetchedUsers([]);
    setDisplayCount(12);
    lastDocRef.current = null;
    fetchUsersFromDatabase(true);
  }, [selectedCategory, fetchUsersFromDatabase]);

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    setDisplayCount(12);
  }, []);

  const handleLoadMore = useCallback(() => {
    const currentPosition = window.scrollY;
    
    // Check if we have more filtered results
    const searchLower = searchQuery.toLowerCase().trim();
    const [minBudget, maxBudget] = budgetFilter === 'all' 
      ? [0, Infinity] 
      : budgetFilter === '100+' 
        ? [100, Infinity]
        : budgetFilter.split('-').map(Number);

    const filteredCount = allFetchedUsers.filter(freelancer => 
  freelancer.profileCompleted !== false && freelancer.displayName
).filter(freelancer => {
      const rate = parseInt(freelancer.hourlyRate || '0');
      if (rate < minBudget || rate > (maxBudget || Infinity)) return false;
      
      if (searchLower && !(
        freelancer.displayName?.toLowerCase().includes(searchLower) ||
        freelancer.bio?.toLowerCase().includes(searchLower) ||
        freelancer.title?.toLowerCase().includes(searchLower) ||
        freelancer.skills?.some(skill => skill.toLowerCase().includes(searchLower)) ||
        freelancer.location?.toLowerCase().includes(searchLower)
      )) return false;
      
      return true;
    }).length;
    
    if (displayCount < filteredCount) {
      setDisplayCount(prev => prev + 12);
    } else if (hasMore) {
      fetchUsersFromDatabase(false).then(() => {
        setDisplayCount(prev => prev + 12);
      });
    }
    
    setTimeout(() => {
      window.scrollTo({ top: currentPosition, behavior: 'instant' });
    }, 100);
  }, [allFetchedUsers, searchQuery, budgetFilter, displayCount, hasMore, fetchUsersFromDatabase]);

  const handleFreelancerClick = useCallback((freelancerId: string) => {
    if (!freelancerId) {
      console.error('Invalid freelancer ID');
      return;
    }
    navigate(`/freelancer/${freelancerId}`);
  }, [navigate]);

  // Memoize helper functions
  const getExperienceLevelLabel = useCallback((level: string) => {
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
  }, [t]);

  const getInitials = useCallback((name?: string, email?: string) => {
    if (name) {
      const parts = name.split(' ');
      return parts
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return email ? email[0].toUpperCase() : 'F';
  }, []);

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
              <Select
                label={t('freelancers.filters.category')}
                selectedKeys={[selectedCategory]}
                onSelectionChange={(keys) => {
                  const selected = Array.from(keys)[0] as string;
                  if (selected) setSelectedCategory(selected);
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

              <Select
                label={t('freelancers.filters.budgetRange')}
                selectedKeys={[budgetFilter]}
                onSelectionChange={(keys) => {
                  const selected = Array.from(keys)[0] as string;
                  if (selected) setBudgetFilter(selected);
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

              <Select
                label={t('freelancers.filters.sortBy')}
                selectedKeys={sortBy ? [sortBy] : []}
                onSelectionChange={(keys) => {
                  const selected = Array.from(keys)[0] as string;
                  if (selected) setSortBy(selected);
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
        {loading && filteredAndSortedFreelancers.length === 0 ? (
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
        ) : filteredAndSortedFreelancers.length === 0 ? (
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
              {filteredAndSortedFreelancers.map((freelancer) => (
                <FreelancerCard
                  key={freelancer.id}
                  freelancer={freelancer}
                  onClick={handleFreelancerClick}
                  getInitials={getInitials}
                  getExperienceLevelLabel={getExperienceLevelLabel}
                  t={t}
                />
              ))}
            </div>
            
            {(() => {
            // Calculate total filtered users count
            const searchLower = searchQuery.toLowerCase().trim();
            const [minBudget, maxBudget] = budgetFilter === 'all' 
              ? [0, Infinity] 
              : budgetFilter === '100+' 
                ? [100, Infinity]
                : budgetFilter.split('-').map(Number);

            const totalFilteredCount = allFetchedUsers
              .filter(freelancer => freelancer.profileCompleted !== false && freelancer.displayName)
              .filter(freelancer => {
                const rate = parseInt(freelancer.hourlyRate || '0');
                if (rate < minBudget || rate > (maxBudget || Infinity)) return false;
                
                if (searchLower && !(
                  freelancer.displayName?.toLowerCase().includes(searchLower) ||
                  freelancer.bio?.toLowerCase().includes(searchLower) ||
                  freelancer.title?.toLowerCase().includes(searchLower) ||
                  freelancer.skills?.some(skill => skill.toLowerCase().includes(searchLower)) ||
                  freelancer.location?.toLowerCase().includes(searchLower)
                )) return false;
                
                return true;
              }).length;

            // Show button if: more filtered results available OR more data in database
            const shouldShowButton = (displayCount < totalFilteredCount) || hasMore;

            return shouldShowButton && !loading && (
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
            );
          })()}

            {loading && filteredAndSortedFreelancers.length > 0 && (
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

export default memo(BrowseFreelancersPage);