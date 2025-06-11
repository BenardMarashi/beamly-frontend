import React from "react";
import { motion } from "framer-motion";
import { Tabs, Tab, Card, CardBody, Button } from "@heroui/react";
import { Icon } from "@iconify/react";
import { PageHeader } from "./page-header";

const servicePackages = [
  {
    id: "basic",
    title: "Basic",
    description: "Perfect for simple projects and quick tasks",
    price: 50,
    deliveryTime: "2 days",
    revisions: 1,
    features: [
      "1 concept included",
      "Logo transparency",
      "Vector file",
      "Printable file",
      "Source file"
    ]
  },
  {
    id: "standard",
    title: "Standard",
    description: "Great for businesses needing more options",
    price: 100,
    deliveryTime: "3 days",
    revisions: 3,
    features: [
      "3 concepts included",
      "Logo transparency",
      "Vector file",
      "Printable file",
      "Source file",
      "Social media kit",
      "Stationery designs"
    ]
  },
  {
    id: "premium",
    title: "Premium",
    description: "Complete branding solution for your business",
    price: 200,
    deliveryTime: "5 days",
    revisions: "Unlimited",
    features: [
      "5 concepts included",
      "Logo transparency",
      "Vector file",
      "Printable file",
      "Source file",
      "Social media kit",
      "Stationery designs",
      "Brand guidelines",
      "3D mockup",
      "Priority support"
    ]
  }
];

const reviews = [
  {
    id: 1,
    name: "Sarah Johnson",
    avatar: "https://img.heroui.chat/image/avatar?w=60&h=60&u=sarah1",
    rating: 5,
    date: "2 weeks ago",
    comment: "Absolutely amazing work! The designer understood exactly what I was looking for and delivered beyond my expectations. Will definitely use this service again."
  },
  {
    id: 2,
    name: "Michael Chen",
    avatar: "https://img.heroui.chat/image/avatar?w=60&h=60&u=michael1",
    rating: 4,
    date: "1 month ago",
    comment: "Great service and communication throughout the project. The final logo looks professional and matches our brand perfectly."
  },
  {
    id: 3,
    name: "Jessica Williams",
    avatar: "https://img.heroui.chat/image/avatar?w=60&h=60&u=jessica1",
    rating: 5,
    date: "2 months ago",
    comment: "Exceptional quality and attention to detail. The designer was very responsive to feedback and made all the requested changes promptly."
  }
];

export const ServicesPage: React.FC = () => {
  const [selectedTab, setSelectedTab] = React.useState("overview");
  
  return (
    <div className="container mx-auto px-4 py-8">
      <PageHeader 
        title="Professional Logo Design"
        subtitle="Create a stunning logo for your business or brand"
        showBackButton
      />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="glass-effect p-6 mb-8">
            <div className="flex flex-wrap gap-4 mb-6">
              <img 
                src="https://img.heroui.chat/image/ai?w=800&h=500&u=logodesign1" 
                alt="Logo Design Service" 
                className="w-full rounded-lg"
              />
            </div>
            
            <Tabs 
              aria-label="Service details"
              selectedKey={selectedTab}
              onSelectionChange={setSelectedTab as any}
              color="secondary"
              variant="underlined"
              classNames={{
                tab: "data-[selected=true]:text-beamly-secondary",
                tabList: "gap-6",
                cursor: "bg-beamly-secondary"
              }}
            >
              <Tab 
                key="overview" 
                title={
                  <div className="flex items-center gap-2">
                    <Icon icon="lucide:info" />
                    <span>Overview</span>
                  </div>
                }
              >
                <div className="py-4">
                  <h3 className="text-xl font-semibold text-white mb-4">Service Description</h3>
                  <p className="text-gray-300 mb-4">
                    I will create a modern, unique, and memorable logo design for your business, brand, or personal project. With over 8 years of experience in graphic design, I specialize in creating logos that stand out and effectively communicate your brand's message.
                  </p>
                  <p className="text-gray-300 mb-4">
                    Each logo is created with careful attention to detail, ensuring it's not only visually appealing but also versatile and scalable for various applications - from business cards to billboards.
                  </p>
                  
                  <h3 className="text-xl font-semibold text-white mb-4 mt-8">What You'll Get</h3>
                  <ul className="space-y-2 text-gray-300">
                    <li className="flex items-center gap-2">
                      <Icon icon="lucide:check" className="text-beamly-secondary" />
                      <span>High-resolution logo files (PNG, JPG, PDF)</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Icon icon="lucide:check" className="text-beamly-secondary" />
                      <span>Vector source files (AI, EPS, SVG)</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Icon icon="lucide:check" className="text-beamly-secondary" />
                      <span>Full copyright ownership</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Icon icon="lucide:check" className="text-beamly-secondary" />
                      <span>Prompt revisions based on your package</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Icon icon="lucide:check" className="text-beamly-secondary" />
                      <span>Professional communication throughout the process</span>
                    </li>
                  </ul>
                </div>
              </Tab>
              <Tab 
                key="reviews" 
                title={
                  <div className="flex items-center gap-2">
                    <Icon icon="lucide:star" />
                    <span>Reviews</span>
                  </div>
                }
              >
                <div className="py-4">
                  <div className="flex items-center mb-6">
                    <div className="flex items-center mr-4">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Icon key={star} icon="lucide:star" className="text-beamly-secondary" />
                      ))}
                    </div>
                    <span className="text-white font-semibold text-lg">4.9</span>
                    <span className="text-gray-400 ml-2">(253 reviews)</span>
                  </div>
                  
                  <div className="space-y-6">
                    {reviews.map((review) => (
                      <div key={review.id} className="glass-card p-4">
                        <div className="flex items-center mb-3">
                          <img 
                            src={review.avatar} 
                            alt={review.name} 
                            className="w-10 h-10 rounded-full mr-3"
                          />
                          <div>
                            <h4 className="text-white font-medium">{review.name}</h4>
                            <div className="flex items-center">
                              <div className="flex">
                                {[...Array(5)].map((_, i) => (
                                  <Icon 
                                    key={i} 
                                    icon="lucide:star" 
                                    className={i < review.rating ? "text-beamly-secondary" : "text-gray-600"} 
                                    width={14}
                                  />
                                ))}
                              </div>
                              <span className="text-gray-400 text-xs ml-2">{review.date}</span>
                            </div>
                          </div>
                        </div>
                        <p className="text-gray-300 text-sm">{review.comment}</p>
                      </div>
                    ))}
                  </div>
                  
                  <Button 
                    color="default"
                    variant="flat"
                    className="mt-6 text-white"
                  >
                    Show all reviews
                  </Button>
                </div>
              </Tab>
            </Tabs>
          </div>
        </div>
        
        <div>
          <div className="glass-effect p-6 sticky top-24">
            <h3 className="text-xl font-semibold text-white mb-6">Choose a Package</h3>
            
            <div className="space-y-4">
              {servicePackages.map((pkg) => (
                <div 
                  key={pkg.id}
                  className={`glass-card p-4 border ${pkg.id === 'standard' ? 'border-beamly-secondary' : 'border-white/10'}`}
                >
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-lg font-medium text-white">{pkg.title}</h4>
                    <span className="text-beamly-secondary font-bold">${pkg.price}</span>
                  </div>
                  <p className="text-gray-300 text-sm mb-4">{pkg.description}</p>
                  
                  <div className="flex items-center text-sm text-gray-300 mb-2">
                    <Icon icon="lucide:clock" className="mr-2" />
                    <span>Delivery in {pkg.deliveryTime}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-300 mb-4">
                    <Icon icon="lucide:refresh-cw" className="mr-2" />
                    <span>{pkg.revisions} revision{pkg.revisions !== 1 ? 's' : ''}</span>
                  </div>
                  
                  <ul className="space-y-2 mb-4">
                    {pkg.features.map((feature, index) => (
                      <li key={index} className="flex items-center text-sm">
                        <Icon icon="lucide:check" className="text-beamly-secondary mr-2" width={16} />
                        <span className="text-gray-300">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <Button 
                    color={pkg.id === 'standard' ? 'secondary' : 'default'}
                    variant={pkg.id === 'standard' ? 'solid' : 'bordered'}
                    className="w-full"
                  >
                    Select {pkg.title}
                  </Button>
                </div>
              ))}
            </div>
            
            <div className="mt-6 text-center">
              <p className="text-gray-300 text-sm mb-2">Need something custom?</p>
              <Button 
                color="primary"
                variant="ghost"
                className="text-beamly-primary"
              >
                Contact Seller
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};