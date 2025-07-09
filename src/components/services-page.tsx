import React from "react";
import { Tabs, Tab, Button } from "@heroui/react";
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
  return (
    <div className="container mx-auto px-4 py-8">
      <PageHeader 
        title="Professional Logo Design Services"
        subtitle="Get a unique, custom logo that represents your brand"
        showBackButton
      />

      <div className="glass-effect p-6 md:p-8">
        <Tabs aria-label="Service packages" color="secondary" variant="underlined">
          {servicePackages.map((pkg) => (
            <Tab key={pkg.id} title={pkg.title}>
              <div className="py-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-2">{pkg.title}</h3>
                    <p className="text-gray-300">{pkg.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-beamly-secondary">${pkg.price}</p>
                    <p className="text-sm text-gray-400">Starting at</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="glass-card p-4">
                    <Icon icon="lucide:clock" className="text-beamly-secondary mb-2" />
                    <p className="text-sm text-gray-400">Delivery Time</p>
                    <p className="font-semibold text-white">{pkg.deliveryTime}</p>
                  </div>
                  <div className="glass-card p-4">
                    <Icon icon="lucide:refresh-cw" className="text-beamly-secondary mb-2" />
                    <p className="text-sm text-gray-400">Revisions</p>
                    <p className="font-semibold text-white">{pkg.revisions}</p>
                  </div>
                  <div className="glass-card p-4">
                    <Icon icon="lucide:check-circle" className="text-beamly-secondary mb-2" />
                    <p className="text-sm text-gray-400">Features</p>
                    <p className="font-semibold text-white">{pkg.features.length} included</p>
                  </div>
                </div>

                <div className="mb-6">
                  <h4 className="font-semibold text-white mb-3">What's included:</h4>
                  <ul className="space-y-2">
                    {pkg.features.map((feature, index) => (
                      <li key={index} className="flex items-center text-gray-300">
                        <Icon icon="lucide:check" className="text-beamly-secondary mr-2" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                <Button 
                  color="secondary" 
                  size="lg" 
                  className="w-full font-medium text-beamly-third"
                >
                  Continue (${pkg.price})
                </Button>
              </div>
            </Tab>
          ))}
        </Tabs>

        {/* Reviews Section */}
        <div className="mt-12">
          <h3 className="text-2xl font-bold text-white mb-6">What clients say</h3>
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className="glass-card p-5">
                <div className="flex items-start gap-4">
                  <img 
                    src={review.avatar} 
                    alt={review.name}
                    className="w-12 h-12 rounded-full"
                  />
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-semibold text-white">{review.name}</h4>
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Icon 
                              key={i}
                              icon={i < review.rating ? "lucide:star" : "lucide:star"}
                              className={i < review.rating ? "text-yellow-500" : "text-gray-600"}
                              width={16}
                            />
                          ))}
                        </div>
                      </div>
                      <span className="text-sm text-gray-400">{review.date}</span>
                    </div>
                    <p className="text-gray-300">{review.comment}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-12">
          <h3 className="text-2xl font-bold text-white mb-6">Frequently Asked Questions</h3>
          <div className="space-y-4">
            <div className="glass-card p-5">
              <h4 className="font-semibold text-white mb-2">How many concepts will I receive?</h4>
              <p className="text-gray-300">The number of initial concepts depends on the package you choose. Basic includes 1 concept, Standard includes 3, and Premium includes 5 unique concepts.</p>
            </div>
            <div className="glass-card p-5">
              <h4 className="font-semibold text-white mb-2">What file formats will I receive?</h4>
              <p className="text-gray-300">You'll receive your logo in multiple formats including PNG, JPG, SVG, and the source file (AI or PSD). This ensures you can use your logo anywhere.</p>
            </div>
            <div className="glass-card p-5">
              <h4 className="font-semibold text-white mb-2">Can I request revisions?</h4>
              <p className="text-gray-300">Yes! Each package includes a different number of revisions. Basic includes 1 revision, Standard includes 3, and Premium includes unlimited revisions.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};