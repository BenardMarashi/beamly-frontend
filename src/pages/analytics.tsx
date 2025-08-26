import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardBody, Select, SelectItem, Progress } from '@nextui-org/react';
import { Icon } from '@iconify/react';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { collection, query, where, getDocs, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface AnalyticsData {
  totalEarnings?: number;
  totalJobs: number;
  completedJobs: number;
  avgRating: number;
  totalProposals: number;
  acceptedProposals: number;
  monthlyEarnings?: { month: string; amount: number }[];
  categoryBreakdown: { name: string; value: number }[];
}

// Memoized Metric Card Component
const MetricCard = memo(({ 
  icon, 
  iconColor, 
  title, 
  value, 
  extra 
}: {
  icon: React.ReactNode;
  iconColor: string;
  title: string;
  value: string | number;
  extra?: React.ReactNode;
}) => (
  <Card className="glass-effect border-none">
    <CardBody className="p-6">
      <div className="flex items-start justify-between mb-2">
        {icon}
        {extra}
      </div>
      <div className="mt-4">
        <h3 className="text-gray-400 text-sm mb-1">{title}</h3>
        <p className="text-2xl font-bold text-white">{value}</p>
      </div>
    </CardBody>
  </Card>
));

// Memoized Earnings Chart Component
const EarningsChart = memo(({ 
  monthlyEarnings 
}: { 
  monthlyEarnings: { month: string; amount: number }[] 
}) => {
  // Pre-calculate max amount once
  const maxAmount = useMemo(() => 
    Math.max(...monthlyEarnings.map(d => d.amount), 1),
    [monthlyEarnings]
  );

  // Pre-calculate bar heights
  const barData = useMemo(() => 
    monthlyEarnings.map(data => ({
      ...data,
      heightPercentage: (data.amount / maxAmount) * 100,
      displayAmount: data.amount > 1000 
        ? `${(data.amount/1000).toFixed(1)}k` 
        : data.amount.toString()
    })),
    [monthlyEarnings, maxAmount]
  );

  return (
    <div className="h-64 flex flex-col justify-end bg-gray-800/50 rounded-lg p-4">
      <div className="flex items-end justify-around h-full gap-2">
        {barData.map((data, index) => (
          <div key={`${data.month}-${index}`} className="flex-1 flex flex-col items-center justify-end">
            <div className="relative w-full flex flex-col items-center">
              <span className="text-xs text-white mb-1">
                €{data.displayAmount}
              </span>
              <div 
                className="w-full bg-gradient-to-t from-blue-500 to-purple-500 rounded-t transition-all duration-500 chart-bar"
                style={{ 
                  height: `${Math.max(data.heightPercentage * 1.5, 10)}px`,
                  opacity: data.heightPercentage > 0 ? 1 : 0.3
                }}
              />
            </div>
            <span className="text-xs text-gray-400 mt-2">{data.month}</span>
          </div>
        ))}
      </div>
    </div>
  );
});

// Memoized Category Breakdown Component
const CategoryBreakdown = memo(({ 
  categoryBreakdown, 
  totalJobs,
  t
}: {
  categoryBreakdown: { name: string; value: number }[];
  totalJobs: number;
  t: any;
}) => {
  const colors = ['primary', 'secondary', 'success', 'warning', 'danger'] as const;
  
  // Pre-calculate percentages
  const categoriesWithPercentages = useMemo(() => 
    categoryBreakdown.map((category, index) => ({
      ...category,
      percentage: totalJobs > 0 ? (category.value / totalJobs) * 100 : 0,
      color: colors[index % colors.length]
    })),
    [categoryBreakdown, totalJobs, colors]
  );

  if (categoryBreakdown.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center">
        <p className="text-gray-400 text-center">{t('analytics.noDataAvailable')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {categoriesWithPercentages.map((category) => (
        <div key={category.name}>
          <div className="flex justify-between mb-1">
            <span className="text-gray-300 text-sm">{category.name}</span>
            <span className="text-white text-sm">
              {category.value} ({category.percentage.toFixed(0)}%)
            </span>
          </div>
          <Progress 
            value={category.percentage} 
            color={category.color}
            size="sm"
            aria-label={`${category.name} completion percentage`}
          />
        </div>
      ))}
    </div>
  );
});

// Memoized Success Rate Component
const SuccessRateCard = memo(({ 
  analyticsData,
  t
}: {
  analyticsData: AnalyticsData;
  t: any;
}) => {
  const acceptanceRate = useMemo(() => 
    analyticsData.totalProposals > 0 
      ? (analyticsData.acceptedProposals / analyticsData.totalProposals) * 100
      : 0,
    [analyticsData.totalProposals, analyticsData.acceptedProposals]
  );

  const pendingRejected = useMemo(() => 
    analyticsData.totalProposals - analyticsData.acceptedProposals,
    [analyticsData.totalProposals, analyticsData.acceptedProposals]
  );

  return (
    <Card className="glass-effect border-none">
      <CardBody className="p-6">
        <h3 className="text-xl font-semibold text-white mb-4">{t('analytics.proposalSuccessRate')}</h3>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-gray-400">{t('analytics.acceptanceRate')}</span>
              <span className="text-white">
                {acceptanceRate.toFixed(0)}%
              </span>
            </div>
            <Progress 
              value={acceptanceRate} 
              color="success"
              className="mb-4"
              aria-label="Proposal acceptance rate"
            />
          </div>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-white">{analyticsData.totalProposals}</p>
              <p className="text-gray-400 text-sm">{t('analytics.totalProposals')}</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-400">{analyticsData.acceptedProposals}</p>
              <p className="text-gray-400 text-sm">{t('analytics.accepted')}</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-red-400">{pendingRejected}</p>
              <p className="text-gray-400 text-sm">{t('analytics.pendingRejected')}</p>
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  );
});

const AnalyticsPage: React.FC = memo(() => {
  const { user, userData } = useAuth();
  const { t } = useTranslation();
  const [timeRange, setTimeRange] = useState('last30days');
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    totalJobs: 0,
    completedJobs: 0,
    avgRating: 0,
    totalProposals: 0,
    acceptedProposals: 0,
    categoryBreakdown: []
  });

  // Memoize date range calculation
  const getDateRange = useCallback(() => {
    const endDate = new Date();
    const startDate = new Date();
    
    switch(timeRange) {
      case 'last7days':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case 'last30days':
        startDate.setDate(endDate.getDate() - 30);
        break;
      case 'last90days':
        startDate.setDate(endDate.getDate() - 90);
        break;
      case 'lastyear':
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
      default:
        startDate.setDate(endDate.getDate() - 30);
    }
    
    return { startDate, endDate };
  }, [timeRange]);

  // Memoize monthly earnings calculation
  const calculateMonthlyEarnings = useCallback(async (userId: string) => {
    const { startDate, endDate } = getDateRange();
    const monthlyData: { [key: string]: number } = {};
    
    // Initialize months with 0 values
    const months = [];
    const current = new Date(startDate);
    while (current <= endDate) {
      const monthKey = current.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      monthlyData[monthKey] = 0;
      months.push(monthKey);
      current.setMonth(current.getMonth() + 1);
    }
    
    try {
      const paymentsQuery = query(
        collection(db, 'payments'),
        where('recipientId', '==', userId),
        where('status', '==', 'completed'),
        where('createdAt', '>=', Timestamp.fromDate(startDate)),
        where('createdAt', '<=', Timestamp.fromDate(endDate)),
        orderBy('createdAt', 'desc')
      );
      
      const paymentsSnapshot = await getDocs(paymentsQuery);
      
      paymentsSnapshot.forEach((doc) => {
        const payment = doc.data();
        const date = payment.createdAt.toDate();
        const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        
        if (monthlyData[monthKey] !== undefined) {
          const amount = payment.amount || 0;
          monthlyData[monthKey] += amount;
        }
      });
    } catch (error) {
      console.error('Error fetching payments:', error);
    }
    
    // Return only last 6 months for display
    const sortedMonths = months.slice(-6);
    return sortedMonths.map(month => ({
      month: month.split(' ')[0],
      amount: Math.round(monthlyData[month] || 0)
    }));
  }, [getDateRange]);

  // Main fetch analytics function
  const fetchAnalytics = useCallback(async () => {
    if (!user || !userData) return;
    
    setLoading(true);
    
    try {
      let totalEarnings = 0;
      let totalJobs = 0;
      let completedJobs = 0;
      let totalProposals = 0;
      let acceptedProposals = 0;
      const categoryMap: { [key: string]: number } = {};
      let monthlyEarnings = undefined;

      if (userData.userType === 'freelancer' || userData.userType === 'both') {
        // Fetch proposals in parallel
        const proposalsQuery = query(
          collection(db, 'proposals'),
          where('freelancerId', '==', user.uid)
        );
        
        const proposalsSnapshot = await getDocs(proposalsQuery);
        
        proposalsSnapshot.forEach((doc) => {
          const proposal = doc.data();
          totalProposals++;
          if (proposal.status === 'accepted') {
            acceptedProposals++;
            completedJobs++;
          }
        });
        
        totalJobs = userData.completedProjects || completedJobs;
        completedJobs = userData.completedProjects || completedJobs;
        
        // Calculate earnings
        const { startDate, endDate } = getDateRange();
        const earningsQuery = query(
          collection(db, 'payments'),
          where('recipientId', '==', user.uid),
          where('status', '==', 'completed'),
          where('createdAt', '>=', Timestamp.fromDate(startDate)),
          where('createdAt', '<=', Timestamp.fromDate(endDate)),
          orderBy('createdAt', 'desc')
        );
        
        try {
          const earningsSnapshot = await getDocs(earningsQuery);
          
          earningsSnapshot.forEach((doc) => {
            const payment = doc.data();
            totalEarnings += payment.amount || 0;
          });
        } catch (error) {
          console.error('Error fetching payments:', error);
          totalEarnings = userData.totalEarnings || 0;
        }
        
        monthlyEarnings = await calculateMonthlyEarnings(user.uid);

        // Fetch projects for categories
        try {
          const projectsQuery = query(
            collection(db, 'projects'),
            where('freelancerId', '==', user.uid)
          );
          
          const projectsSnapshot = await getDocs(projectsQuery);
          
          projectsSnapshot.forEach((doc) => {
            const project = doc.data();
            if (project.category) {
              categoryMap[project.category] = (categoryMap[project.category] || 0) + 1;
            }
          });
        } catch (error) {
          console.error('Error fetching projects:', error);
        }
      }

      if (userData.userType === 'client' || userData.userType === 'both') {
        const jobsQuery = query(
          collection(db, 'jobs'),
          where('clientId', '==', user.uid)
        );
        
        const jobsSnapshot = await getDocs(jobsQuery);
        
        jobsSnapshot.forEach((doc) => {
          const job = doc.data();
          totalJobs++;
          if (job.status === 'completed') {
            completedJobs++;
          }
          
          if (job.category) {
            categoryMap[job.category] = (categoryMap[job.category] || 0) + 1;
          }
        });

        const clientProposalsQuery = query(
          collection(db, 'proposals'),
          where('clientId', '==', user.uid)
        );
        
        try {
          const clientProposalsSnapshot = await getDocs(clientProposalsQuery);
          
          clientProposalsSnapshot.forEach((doc) => {
            const proposal = doc.data();
            totalProposals++;
            if (proposal.status === 'accepted') {
              acceptedProposals++;
            }
          });
        } catch (error) {
          console.error('Error fetching client proposals:', error);
        }
      }

      // Convert category map to sorted array
      const categoryBreakdown = Object.entries(categoryMap)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5);

      const finalData = {
        totalEarnings: userData.userType !== 'client' ? Math.round(totalEarnings) : undefined,
        monthlyEarnings: userData.userType !== 'client' ? (monthlyEarnings || []) : undefined,
        totalJobs: totalJobs || 0,
        completedJobs: completedJobs || 0,
        avgRating: userData.rating || 0,
        totalProposals,
        acceptedProposals,
        categoryBreakdown
      };
      
      setAnalyticsData(finalData);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setAnalyticsData({
        totalEarnings: userData.userType !== 'client' ? (userData.totalEarnings || 0) : undefined,
        monthlyEarnings: userData.userType !== 'client' ? [] : undefined,
        totalJobs: userData.completedProjects || 0,
        completedJobs: userData.completedProjects || 0,
        avgRating: userData.rating || 0,
        totalProposals: 0,
        acceptedProposals: 0,
        categoryBreakdown: []
      });
    } finally {
      setLoading(false);
    }
  }, [user, userData, getDateRange, calculateMonthlyEarnings]);

  // Effect for fetching analytics
  useEffect(() => {
    if (user) {
      fetchAnalytics();
    }
  }, [user, timeRange, fetchAnalytics]);

  // Add chart animation styles
  useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.innerHTML = `
      @keyframes growBar {
        from {
          height: 0;
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }
      
      .chart-bar {
        animation: growBar 0.5s ease-out forwards;
      }
    `;
    document.head.appendChild(styleElement);
    
    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  // Memoize completion percentage
  const completedPercentage = useMemo(() => 
    analyticsData.totalJobs > 0 
      ? ((analyticsData.completedJobs / analyticsData.totalJobs) * 100).toFixed(0)
      : '0',
    [analyticsData.totalJobs, analyticsData.completedJobs]
  );

  // Memoize rating stars
  const ratingStars = useMemo(() => {
    const fullStars = Math.floor(analyticsData.avgRating);
    return [...Array(5)].map((_, i) => (
      <Icon 
        key={i} 
        icon={i < fullStars ? "lucide:star" : "lucide:star-outline"} 
        className={i < fullStars ? "text-yellow-400" : "text-gray-600"} 
        width={20} 
      />
    ));
  }, [analyticsData.avgRating]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-400">{t('analytics.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-4">{t('analytics.title')}</h1>
          <div className="flex items-center gap-3">
            <span className="text-gray-400 text-sm">{t('analytics.timeRange')}</span>
            <Select
              selectedKeys={[timeRange]}
              onSelectionChange={(keys) => setTimeRange(Array.from(keys)[0] as string)}
              className="w-48"
              variant="bordered"
              size="sm"
              classNames={{
                trigger: "h-10 bg-gray-900/50 border-gray-600",
                value: "text-white text-sm",
                listbox: "bg-gray-900",
                popoverContent: "bg-gray-900 border border-gray-700",
              }}
            >
              <SelectItem key="last7days" value="last7days">{t('analytics.last7days')}</SelectItem>
              <SelectItem key="last30days" value="last30days">{t('analytics.last30days')}</SelectItem>
              <SelectItem key="last90days" value="last90days">{t('analytics.last90days')}</SelectItem>
              <SelectItem key="lastyear" value="lastyear">{t('analytics.lastYear')}</SelectItem>
            </Select>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {analyticsData.totalEarnings !== undefined && (
            <MetricCard
              icon={<Icon icon="lucide:euro" className="text-green-400 flex-shrink-0" width={32} />}
              iconColor="text-green-400"
              title={t('analytics.totalEarnings')}
              value={`€${analyticsData.totalEarnings.toLocaleString()}`}
              extra={
                <span className="text-green-400 text-sm ml-2">
                  {analyticsData.totalEarnings > 0 ? '↑' : '—'}
                </span>
              }
            />
          )}

          <MetricCard
            icon={<Icon icon="lucide:briefcase" className="text-blue-400 flex-shrink-0" width={32} />}
            iconColor="text-blue-400"
            title={userData?.userType === 'client' ? t('analytics.totalJobsPosted') : t('analytics.totalProjects')}
            value={analyticsData.totalJobs}
            extra={<span className="text-blue-400 text-sm ml-2">{completedPercentage}%</span>}
          />

          <MetricCard
            icon={<Icon icon="lucide:check-circle" className="text-purple-400 mb-2" width={32} />}
            iconColor="text-purple-400"
            title={t('analytics.completed')}
            value={analyticsData.completedJobs}
            extra={
              <Progress 
                value={parseFloat(completedPercentage)} 
                size="sm" 
                color="secondary"
                className="w-full"
                aria-label="Completion percentage"
              />
            }
          />

          <MetricCard
            icon={<div className="flex gap-1 mb-2">{ratingStars}</div>}
            iconColor=""
            title={t('analytics.averageRating')}
            value={analyticsData.avgRating.toFixed(1)}
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Earnings Chart - Only for freelancers */}
          {analyticsData.monthlyEarnings && analyticsData.monthlyEarnings.length > 0 && (
            <Card className="glass-effect border-none">
              <CardBody className="p-6">
                <h3 className="text-xl font-semibold text-white mb-4">{t('analytics.earningsOverTime')}</h3>
                <EarningsChart monthlyEarnings={analyticsData.monthlyEarnings} />
              </CardBody>
            </Card>
          )}

          {/* Placeholder for freelancers with no earnings */}
          {userData?.userType !== 'client' && (!analyticsData.monthlyEarnings || analyticsData.monthlyEarnings.length === 0) && (
            <Card className="glass-effect border-none">
              <CardBody className="p-6">
                <h3 className="text-xl font-semibold text-white mb-4">{t('analytics.earningsOverTime')}</h3>
                <div className="h-64 flex items-center justify-center bg-gray-800/50 rounded-lg">
                  <div className="text-center">
                    <Icon icon="lucide:line-chart" className="text-gray-400 mb-2" width={48} />
                    <p className="text-gray-400">{t('analytics.noEarningsData')}</p>
                  </div>
                </div>
              </CardBody>
            </Card>
          )}

          {/* Category Breakdown */}
          <Card className="glass-effect border-none">
            <CardBody className="p-6">
              <h3 className="text-xl font-semibold text-white mb-4">{t('analytics.categoryBreakdown')}</h3>
              <CategoryBreakdown 
                categoryBreakdown={analyticsData.categoryBreakdown}
                totalJobs={analyticsData.totalJobs}
                t={t}
              />
            </CardBody>
          </Card>
        </div>

        {/* Success Rate - Only for freelancers */}
        {(userData?.userType === 'freelancer' || userData?.userType === 'both') && (
          <SuccessRateCard analyticsData={analyticsData} t={t} />
        )}
      </motion.div>
    </div>
  );
});

export default AnalyticsPage;