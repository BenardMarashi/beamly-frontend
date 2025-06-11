import React from "react";
import { motion } from "framer-motion";
import { Button, Card, CardBody, Avatar, Chip, Image } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";

interface FreelancerProfilePageProps {
  setCurrentPage: (page: string) => void;
  isDarkMode?: boolean;
}

export const FreelancerProfilePage: React.FC = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  
  const profileData = {
    name: "Ophelia Coleman",
    location: "Los Angeles, CA",
    avatar: "https://img.heroui.chat/image/avatar?w=200&h=200&u=ophelia1",
    bio: "I'm a professional UI/UX designer with 8+ years of experience. Specialized in creating intuitive digital experiences.",
    projectsCompleted: 87,
    rating: 4.9,
    reviews: 54,
    skills: ["UI Design", "UX Research", "Prototyping", "Figma", "Adobe XD"],
    portfolio: [
      "https://img.heroui.chat/image/ai?w=300&h=200&u=portfolio1",
      "https://img.heroui.chat/image/ai?w=300&h=200&u=portfolio2",
      "https://img.heroui.chat/image/ai?w=300&h=200&u=portfolio3"
    ],
    clients: [
      { name: "Isaiah", avatar: "https://img.heroui.chat/image/avatar?w=100&h=100&u=client1" },
      { name: "Jayden", avatar: "https://img.heroui.chat/image/avatar?w=100&h=100&u=client2" },
      { name: "Hunter", avatar: "https://img.heroui.chat/image/avatar?w=100&h=100&u=client3" },
      { name: "Ethel", avatar: "https://img.heroui.chat/image/avatar?w=100&h=100&u=client4" }
    ]
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row gap-8">
        <div className="md:w-1/3">
          <div className="glass-effect p-6 rounded-xl sticky top-24">
            <div className="flex flex-col items-center text-center">
              <Avatar
                src="https://img.heroui.chat/image/avatar?w=200&h=200&u=freelancer1"
                className="w-24 h-24 mb-4"
              />
              <h1 className="text-2xl font-bold text-white mb-1">John Doe</h1>
              <p className="text-beamly-secondary font-medium mb-2">UI/UX Designer</p>
              <div className="flex items-center mb-4">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Icon key={star} icon="lucide:star" className="text-yellow-400 w-4 h-4" />
                  ))}
                </div>
                <span className="text-gray-300 text-sm ml-2">5.0 (48 {t('freelancerProfile.reviews')})</span>
              </div>
              
              <div className="w-full border-t border-white/10 pt-4 mt-2">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-300">{t('freelancerProfile.location')}:</span>
                  <span className="text-white">New York, USA</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-300">{t('freelancerProfile.memberSince')}:</span>
                  <span className="text-white">Jan 2022</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-300">{t('freelancerProfile.lastActive')}:</span>
                  <span className="text-white">2 hours ago</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-300">{t('freelancerProfile.hourlyRate')}:</span>
                  <span className="text-beamly-secondary font-bold">$45/hr</span>
                </div>
              </div>
              
              <div className="w-full mt-6 space-y-3">
                <Button 
                  color="secondary" 
                  className="w-full font-medium text-beamly-third"
                  onPress={() => {
                    console.log("Hire me button clicked");
                    // No navigation, just a log
                  }}
                >
                  {t('freelancerProfile.hireMe')}
                </Button>
                <Button 
                  variant="bordered" 
                  className="w-full text-white border-white/30"
                  startContent={<Icon icon="lucide:mail" />}
                  onPress={() => {
                    console.log("Send message button clicked");
                    // No navigation, just a log
                  }}
                >
                  {t('freelancerProfile.sendMessage')}
                </Button>
                <Button 
                  variant="light" 
                  className="w-full text-white"
                  startContent={<Icon icon="lucide:bookmark" />}
                  onPress={() => {
                    console.log("Save profile button clicked");
                    // No navigation, just a log
                  }}
                >
                  {t('freelancerProfile.saveProfile')}
                </Button>
              </div>
            </div>
          </div>
        </div>
        
        <div className="md:w-2/3">
          <div className="glass-effect p-6 rounded-xl mb-6">
            <h2 className="text-xl font-bold text-white mb-4">{t('freelancerProfile.about')}</h2>
            <p className="text-gray-300">
              I'm a UI/UX designer with over 5 years of experience creating intuitive and engaging digital experiences. My expertise includes user research, wireframing, prototyping, and visual design. I've worked with clients ranging from startups to Fortune 500 companies across various industries.
            </p>
          </div>
          
          <div className="glass-effect p-6 rounded-xl mb-6">
            <h2 className="text-xl font-bold text-white mb-4">{t('freelancerProfile.skills')}</h2>
            <div className="flex flex-wrap gap-2">
              {["UI Design", "UX Design", "Wireframing", "Prototyping", "Figma", "Adobe XD", "User Research", "Interaction Design", "Visual Design", "Design Systems"].map((skill) => (
                <Chip 
                  key={skill}
                  className="bg-white/10 text-white"
                >
                  {skill}
                </Chip>
              ))}
            </div>
          </div>
          
          <div className="glass-effect p-6 rounded-xl mb-6">
            <h2 className="text-xl font-bold text-white mb-4">{t('freelancerProfile.portfolio')}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((item) => (
                <div key={item} className="relative overflow-hidden rounded-lg group">
                  <img 
                    src={`https://img.heroui.chat/image/dashboard?w=400&h=300&u=portfolio${item}`}
                    alt={`Portfolio item ${item}`}
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button 
                      size="sm" 
                      color="secondary"
                      className="font-medium text-beamly-third"
                      onPress={() => {
                        console.log("View portfolio button clicked");
                        // No navigation, just a log
                      }}
                    >
                      {t('freelancerProfile.viewPortfolio')}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="glass-effect p-6 rounded-xl mb-6">
            <h2 className="text-xl font-bold text-white mb-4">{t('freelancerProfile.experience')}</h2>
            <div className="space-y-6">
              <div>
                <div className="flex justify-between">
                  <h3 className="font-semibold text-white">Senior UI/UX Designer</h3>
                  <span className="text-beamly-secondary">2020 - Present</span>
                </div>
                <p className="text-gray-400">Designify Agency</p>
                <p className="text-gray-300 mt-2">
                  Led the design team in creating user-centered digital products for various clients. Conducted user research, created wireframes, prototypes, and final designs.
                </p>
              </div>
              <div>
                <div className="flex justify-between">
                  <h3 className="font-semibold text-white">UI/UX Designer</h3>
                  <span className="text-beamly-secondary">2018 - 2020</span>
                </div>
                <p className="text-gray-400">TechCorp Inc.</p>
                <p className="text-gray-300 mt-2">
                  Designed user interfaces for web and mobile applications. Collaborated with developers to ensure proper implementation of designs.
                </p>
              </div>
            </div>
          </div>
          
          <div className="glass-effect p-6 rounded-xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">{t('freelancerProfile.reviews')}</h2>
              <div className="flex items-center">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Icon key={star} icon="lucide:star" className="text-yellow-400 w-4 h-4" />
                  ))}
                </div>
                <span className="text-gray-300 text-sm ml-2">5.0 (48 reviews)</span>
              </div>
            </div>
            
            <div className="space-y-6">
              {[1, 2, 3].map((review) => (
                <div key={review} className="border-t border-white/10 pt-4">
                  <div className="flex justify-between">
                    <div className="flex items-center">
                      <Avatar
                        src={`https://img.heroui.chat/image/avatar?w=100&h=100&u=client${review}`}
                        className="w-10 h-10 mr-3"
                      />
                      <div>
                        <h3 className="font-semibold text-white">Client Name</h3>
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Icon key={star} icon="lucide:star" className="text-yellow-400 w-3 h-3" />
                          ))}
                        </div>
                      </div>
                    </div>
                    <span className="text-gray-400 text-sm">2 weeks ago</span>
                  </div>
                  <p className="text-gray-300 mt-2">
                    John did an amazing job on our project. He was very professional, responsive, and delivered high-quality work on time. Would definitely work with him again!
                  </p>
                </div>
              ))}
            </div>
            
            <div className="mt-6 text-center">
              <Button 
                variant="light" 
                className="text-white"
                onPress={() => {
                  console.log("See more reviews button clicked");
                  // No navigation, just a log
                }}
              >
                {t('common.seeMore')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};