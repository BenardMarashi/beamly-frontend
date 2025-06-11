import React from "react";
import { motion } from "framer-motion";
import { Button, Input, Accordion, AccordionItem } from "@heroui/react";
import { Icon } from "@iconify/react";
import { PageHeader } from "../page-header";

export const AffiliateProgramPage: React.FC = () => {
  const benefits = [
    {
      title: "Generous Commission",
      description: "Earn 30% commission on all referred users' subscription fees for their first year.",
      icon: "lucide:dollar-sign"
    },
    {
      title: "Long Cookie Duration",
      description: "90-day cookie duration gives your referrals plenty of time to sign up.",
      icon: "lucide:clock"
    },
    {
      title: "Timely Payments",
      description: "Get paid monthly via PayPal, bank transfer, or cryptocurrency.",
      icon: "lucide:credit-card"
    },
    {
      title: "Marketing Resources",
      description: "Access banners, email templates, and other promotional materials.",
      icon: "lucide:megaphone"
    }
  ];
  
  const howItWorks = [
    {
      step: 1,
      title: "Sign Up",
      description: "Complete our affiliate application form. We'll review and approve it within 48 hours."
    },
    {
      step: 2,
      title: "Share Your Link",
      description: "Get your unique affiliate link and share it on your website, social media, or email list."
    },
    {
      step: 3,
      title: "Track Performance",
      description: "Monitor clicks, sign-ups, and earnings in real-time through your affiliate dashboard."
    },
    {
      step: 4,
      title: "Get Paid",
      description: "Receive your commissions monthly for all qualifying referrals."
    }
  ];
  
  const faqs = [
    {
      question: "Who can join the Beamly Affiliate Program?",
      answer: "Our affiliate program is open to bloggers, content creators, influencers, and anyone with an audience of freelancers or businesses that hire freelancers. We review all applications to ensure alignment with our brand values."
    },
    {
      question: "How much can I earn?",
      answer: "Affiliates earn 30% commission on all subscription fees paid by their referred users during their first year. For example, if you refer someone who subscribes to our Professional plan at $30/month, you'll earn $9 per month for 12 months, totaling $108 per referral."
    },
    {
      question: "When and how do I get paid?",
      answer: "Commissions are calculated at the end of each month and paid by the 15th of the following month. We offer payments via PayPal, direct bank transfer, or cryptocurrency. The minimum payout threshold is $50."
    },
    {
      question: "What marketing materials do you provide?",
      answer: "We provide a variety of marketing resources including banners in different sizes, email templates, social media posts, product screenshots, and detailed information about our services. All materials are available in your affiliate dashboard."
    },
    {
      question: "Can I promote Beamly on multiple websites?",
      answer: "Yes, you can promote Beamly on multiple websites that you own. However, we don't allow promotion through paid search campaigns bidding on our brand terms, spam, or any deceptive marketing practices."
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <PageHeader 
        title="Affiliate Program"
        subtitle="Earn commissions by referring freelancers and businesses to Beamly"
        showBackButton
      />
      
      <div className="glass-effect p-8 mb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div>
            <h2 className="text-2xl font-bold text-white mb-4">Partner With Us and Earn</h2>
            <p className="text-gray-300 mb-4">
              Join the Beamly Affiliate Program and earn generous commissions for every new user you refer to our platform. It's a simple way to monetize your audience while helping freelancers and businesses connect.
            </p>
            <p className="text-gray-300 mb-6">
              Whether you're a blogger, content creator, influencer, or community leader in the freelance space, our affiliate program offers competitive commissions and the tools you need to succeed.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                color="secondary"
                size="lg"
                className="font-medium font-outfit text-beamly-third"
              >
                Apply Now
              </Button>
              <Button 
                color="primary"
                variant="bordered"
                size="lg"
                className="font-medium font-outfit text-white"
              >
                Learn More
              </Button>
            </div>
          </div>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="relative"
          >
            <img 
              src="https://img.heroui.chat/image/ai?w=600&h=400&u=affiliate" 
              alt="Affiliate Program" 
              className="rounded-lg w-full"
            />
            <div className="absolute -bottom-4 -right-4 bg-beamly-secondary text-beamly-third p-4 rounded-lg font-bold">
              30% Commission
            </div>
          </motion.div>
        </div>
      </div>
      
      <div className="mb-12">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-white">Why Become a Beamly Affiliate?</h2>
          <p className="text-gray-300 mt-2 max-w-2xl mx-auto">
            Our program offers competitive advantages that make it worth your while
          </p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {benefits.map((benefit, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={`${index % 2 === 0 ? 'glass-card' : 'yellow-glass'} p-6 card-hover`}
            >
              <div className={`${index % 2 === 0 ? 'bg-beamly-primary/20' : 'bg-beamly-secondary/20'} w-12 h-12 rounded-full flex items-center justify-center mb-4`}>
                <Icon icon={benefit.icon} className={`text-2xl ${index % 2 === 0 ? 'text-beamly-primary' : 'text-beamly-secondary'}`} />
              </div>
              <h3 className="text-xl font-semibold mb-3 font-outfit text-white">{benefit.title}</h3>
              <p className="text-gray-300 font-outfit font-light">{benefit.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
      
      <div className="mb-12">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-white">How It Works</h2>
          <p className="text-gray-300 mt-2 max-w-2xl mx-auto">
            Get started with our affiliate program in four simple steps
          </p>
        </div>
        
        <div className="glass-effect p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {howItWorks.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="relative"
              >
                {index < howItWorks.length - 1 && (
                  <div className="hidden lg:block absolute top-10 left-full w-full h-0.5 z-0">
                    <div className="w-full h-full bg-beamly-secondary bg-opacity-30 relative">
                      <div className="absolute -right-3 -top-1.5">
                        <Icon icon="lucide:chevron-right" className="text-beamly-secondary" />
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="flex flex-col items-center text-center relative z-10">
                  <div 
                    className="w-20 h-20 rounded-full flex items-center justify-center mb-4"
                    style={{ backgroundColor: index % 2 === 0 ? 'rgba(15, 67, 238, 0.2)' : 'rgba(252, 233, 13, 0.2)' }}
                  >
                    <div className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold" style={{ backgroundColor: index % 2 === 0 ? '#0F43EE' : '#FCE90D', color: index % 2 === 0 ? 'white' : '#011241' }}>
                      {item.step}
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold mb-3 font-outfit text-white">{item.title}</h3>
                  <p className="text-gray-300 font-outfit font-light">{item.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
      
      <div className="mb-12">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-white">Frequently Asked Questions</h2>
          <p className="text-gray-300 mt-2 max-w-2xl mx-auto">
            Find answers to common questions about our affiliate program
          </p>
        </div>
        
        <div className="glass-effect p-6">
          <Accordion variant="splitted" className="px-0">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                aria-label={faq.question}
                title={faq.question}
                classNames={{
                  title: "text-white font-medium",
                  content: "text-gray-300",
                  trigger: "bg-white/5 data-[hover=true]:bg-white/10",
                  indicator: "text-beamly-secondary"
                }}
              >
                <p className="pb-2">{faq.answer}</p>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
      
      <div className="yellow-glass p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div>
            <h2 className="text-2xl font-bold text-white mb-4">Ready to Get Started?</h2>
            <p className="text-gray-300 mb-6">
              Apply to join our affiliate program today and start earning commissions by promoting Beamly to your audience.
            </p>
            <Button 
              color="secondary"
              size="lg"
              className="font-medium font-outfit text-beamly-third"
            >
              Apply Now
            </Button>
          </div>
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Have Questions?</h3>
            <p className="text-gray-300 text-sm mb-4">
              Contact our affiliate team for more information about the program.
            </p>
            <Input
              placeholder="Your email"
              className="mb-3 bg-white/10 border-white/20"
            />
            <Input
              placeholder="Your question"
              className="mb-3 bg-white/10 border-white/20"
            />
            <Button 
              color="primary"
              className="w-full"
            >
              Send Inquiry
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};