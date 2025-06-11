import React from "react";
import { motion } from "framer-motion";
import { Input, Button, Accordion, AccordionItem } from "@heroui/react";
import { Icon } from "@iconify/react";
import { PageHeader } from "../page-header";

export const HelpSupportPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = React.useState("");
  
  const faqCategories = [
    {
      title: "Account & Profile",
      faqs: [
        {
          question: "How do I create an account?",
          answer: "To create an account, click the 'Sign Up' button in the top right corner of the homepage. You can choose to register as a freelancer or a client. Fill in your details, verify your email address, and complete your profile to get started."
        },
        {
          question: "How do I reset my password?",
          answer: "Click on the 'Login' button, then select 'Forgot password?' Enter your email address, and we'll send you instructions to reset your password. For security reasons, the reset link is valid for 24 hours."
        },
        {
          question: "Can I have both a freelancer and client account?",
          answer: "Yes, you can maintain both types of accounts with the same email address. In your account settings, you can switch between freelancer and client modes depending on whether you're offering or seeking services."
        }
      ]
    },
    {
      title: "Payments & Billing",
      faqs: [
        {
          question: "How does Beamly's zero commission model work?",
          answer: "Unlike traditional platforms that charge per-project commissions, Beamly operates on a subscription model for freelancers. You pay a flat monthly fee based on your chosen membership tier and keep 100% of what you earn from clients."
        },
        {
          question: "What payment methods are accepted?",
          answer: "We accept major credit cards (Visa, Mastercard, American Express), PayPal, and bank transfers in select countries. All payments are processed securely through our payment partners."
        },
        {
          question: "When do I get paid for completed work?",
          answer: "For fixed-price projects, funds are held in escrow and released to you when the client approves the work. For hourly projects, payments are processed weekly based on verified hours. Once released, funds typically appear in your account within 1-3 business days."
        }
      ]
    },
    {
      title: "Projects & Collaboration",
      faqs: [
        {
          question: "How do I find projects to work on?",
          answer: "Browse the 'Explore' section to find open projects matching your skills. You can filter by category, budget range, project type, and more. You can also set up alerts for new projects that match your criteria."
        },
        {
          question: "How do I communicate with clients?",
          answer: "Once you're hired for a project, you can use our built-in messaging system to communicate with clients. You can share files, set milestones, and track progress all within the platform."
        },
        {
          question: "What happens if there's a dispute with a client?",
          answer: "If you encounter issues that can't be resolved directly with the client, you can open a dispute through our Resolution Center. Our support team will review the case, examine the project history and communications, and help mediate a fair resolution."
        }
      ]
    }
  ];
  
  const contactMethods = [
    {
      title: "Email Support",
      description: "Get help via email with a response time of 24-48 hours",
      icon: "lucide:mail",
      action: "support@beamly.com",
      color: "#0F43EE"
    },
    {
      title: "Live Chat",
      description: "Chat with our support team in real-time during business hours",
      icon: "lucide:message-circle",
      action: "Start Chat",
      color: "#FCE90D"
    },
    {
      title: "Help Center",
      description: "Browse our comprehensive knowledge base",
      icon: "lucide:book-open",
      action: "Visit Help Center",
      color: "#0F43EE"
    },
    {
      title: "Community Forum",
      description: "Get advice from other Beamly users and experts",
      icon: "lucide:users",
      action: "Join Discussion",
      color: "#FCE90D"
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <PageHeader 
        title="Help & Support"
        subtitle="Find answers to your questions and get the help you need"
        showBackButton
      />
      
      <div className="glass-effect p-6 md:p-8 mb-8">
        <h2 className="text-2xl font-bold text-white mb-6">How can we help you?</h2>
        <div className="flex flex-col md:flex-row gap-4">
          <Input
            placeholder="Search for help topics..."
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
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
          {contactMethods.map((method, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="glass-card p-5 card-hover"
            >
              <div 
                className="w-12 h-12 rounded-full flex items-center justify-center mb-4"
                style={{ backgroundColor: `${method.color}20` }}
              >
                <Icon icon={method.icon} className="text-2xl" style={{ color: method.color }} />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">{method.title}</h3>
              <p className="text-gray-300 text-sm mb-4">{method.description}</p>
              <Button
                color={index % 2 === 0 ? "primary" : "secondary"}
                variant={index % 2 === 0 ? "ghost" : "flat"}
                className={index % 2 === 0 ? "text-beamly-primary" : "text-beamly-third"}
                size="sm"
              >
                {method.action}
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
      
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-6">Frequently Asked Questions</h2>
        
        {faqCategories.map((category, categoryIndex) => (
          <div key={categoryIndex} className="mb-8">
            <h3 className="text-xl font-semibold text-white mb-4">{category.title}</h3>
            <div className="glass-effect p-4">
              <Accordion variant="splitted" className="px-0">
                {category.faqs.map((faq, faqIndex) => (
                  <AccordionItem
                    key={faqIndex}
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
        ))}
      </div>
      
      <div className="yellow-glass p-8 text-center">
        <h2 className="text-2xl font-bold text-white mb-4">Still Need Help?</h2>
        <p className="text-gray-300 max-w-2xl mx-auto mb-6">
          Our support team is ready to assist you with any questions or issues you may have.
        </p>
        <Button 
          color="secondary"
          size="lg"
          className="font-medium font-outfit text-beamly-third"
          endContent={<Icon icon="lucide:message-square" />}
        >
          Contact Support
        </Button>
      </div>
    </div>
  );
};