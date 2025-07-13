import React from "react";
import { motion } from "framer-motion";
import { Button, Accordion, AccordionItem } from "@heroui/react";
import { Icon } from "@iconify/react";
import { PageHeader } from "./page-header";

const steps = [
  {
    title: "Create Your Account",
    description: "Sign up for free in just a few minutes. Choose between a freelancer or client account based on your needs.",
    icon: "lucide:user-plus",
    color: "#0F43EE",
    details: [
      "Fill in your basic information",
      "Verify your email address",
      "Set up your profile picture and bio",
      "Add payment information (optional for browsing)"
    ]
  },
  {
    title: "Complete Your Profile",
    description: "Build a compelling profile that showcases your skills, experience, and portfolio to attract the right opportunities.",
    icon: "lucide:clipboard-edit",
    color: "#FCE90D",
    details: [
      "Add your skills and expertise",
      "Upload portfolio samples",
      "Set your rates and availability",
      "Write a professional bio that highlights your experience"
    ]
  },
  {
    title: "Discover Opportunities",
    description: "Browse through thousands of projects or talented freelancers to find the perfect match for your needs.",
    icon: "lucide:search",
    color: "#0F43EE",
    details: [
      "Use filters to narrow down your search",
      "Save favorite listings for later",
      "Follow categories that interest you",
      "Receive personalized recommendations based on your profile"
    ]
  },
  {
    title: "Submit Proposals or Post Projects",
    description: "As a freelancer, send tailored proposals to clients. As a client, post detailed project requirements to attract the right talent.",
    icon: "lucide:file-text",
    color: "#FCE90D",
    details: [
      "Create detailed project descriptions",
      "Set clear budgets and timelines",
      "Attach relevant files and references",
      "Specify required skills and experience levels"
    ]
  },
  {
    title: "Collaborate Effectively",
    description: "Use our built-in tools to communicate, share files, and track progress throughout your project.",
    icon: "lucide:message-square",
    color: "#0F43EE",
    details: [
      "Real-time messaging system",
      "File sharing and version control",
      "Milestone tracking and approvals",
      "Video conferencing for important discussions"
    ]
  },
  {
    title: "Complete Projects & Get Paid",
    description: "Finalize deliverables, approve work, and process secure payments through our platform.",
    icon: "lucide:check-circle",
    color: "#FCE90D",
    details: [
      "Review and approve final deliverables",
      "Release funds from escrow",
      "Leave detailed feedback and ratings",
      "Build long-term working relationships"
    ]
  }
];

const faqs = [
  {
    question: "How does Beamly's zero commission model work?",
    answer: "Unlike traditional freelance platforms that charge 20-30% commission, Beamly operates on a subscription model. Freelancers can choose from different membership tiers, paying a flat monthly fee instead of per-project commissions. This allows freelancers to keep 100% of what they earn while still providing all the security and convenience of a managed platform."
  },
  {
    question: "How does Beamly ensure quality work?",
    answer: "We maintain high standards through a combination of thorough vetting processes, skills assessments, and our reputation system. Freelancers undergo verification before being able to offer services, and our review system ensures accountability. Additionally, our escrow payment system protects clients by only releasing payment when they're satisfied with the delivered work."
  },
  {
    question: "What happens if I'm not satisfied with the work?",
    answer: "If you're not satisfied with the delivered work, you can request revisions based on your package terms. If issues persist, our dispute resolution team can mediate. Our escrow payment system ensures you only pay for work that meets your requirements. In cases where resolution isn't possible, our money-back guarantee protects your investment."
  },
  {
    question: "Can I hire freelancers for long-term projects?",
    answer: "Absolutely! Beamly supports both short-term projects and long-term engagements. You can set up recurring projects, retainer agreements, or hourly arrangements for ongoing work. Many clients start with a small project to test compatibility before establishing longer-term working relationships with freelancers."
  },
  {
    question: "How secure is the payment system?",
    answer: "Our payment system uses bank-level encryption and security protocols. We offer secure escrow services that hold payment until you approve the work, protecting both parties. We support multiple payment methods including credit cards, PayPal, and bank transfers, with funds being held securely until project completion."
  }
];

export const HowItWorksPage: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <PageHeader 
        title="How Beamly Works"
        subtitle="Your guide to finding, hiring, and working with top freelance talent"
        showBackButton
      />
      
      <div className="glass-effect p-8 mb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div>
            <h2 className="text-2xl font-bold text-white mb-4">Simple, Secure, and Commission-Free</h2>
            <p className="text-gray-300 mb-4">
              Beamly connects businesses with skilled freelancers through an intuitive platform designed to make collaboration seamless and rewarding for both parties.
            </p>
            <p className="text-gray-300 mb-4">
              Our unique zero-commission model means freelancers keep 100% of what they earn, while clients benefit from competitive rates and exceptional quality.
            </p>
            <p className="text-gray-300">
              Whether you're looking to hire talent or offer your services, our streamlined process makes it easy to get started and achieve your goals.
            </p>
          </div>
          <div>
            <motion.img 
              src="https://img.heroui.chat/image/ai?w=600&h=400&u=howitworks" 
              alt="Beamly Platform" 
              className="rounded-lg w-full"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
      </div>
      
      <div className="mb-16">
        <div className="text-center mb-12">
          <h2 className="text-2xl font-bold text-white">The Process</h2>
          <p className="text-gray-300 mt-2 max-w-2xl mx-auto">
            Follow these simple steps to start your journey on Beamly
          </p>
        </div>
        
        <div className="space-y-12">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <div className={`glass-card p-6 ${index % 2 === 1 ? 'yellow-glass' : ''}`}>
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="flex-shrink-0">
                    <div 
                      className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold"
                      style={{ backgroundColor: step.color, color: index % 2 === 0 ? 'white' : '#011241' }}
                    >
                      {index + 1}
                    </div>
                  </div>
                  <div className="flex-grow">
                    <div className="flex items-center mb-2">
                      <Icon icon={step.icon} className="mr-2" style={{ color: step.color }} />
                      <h3 className="text-xl font-semibold text-white">{step.title}</h3>
                    </div>
                    <p className="text-gray-300 mb-4">{step.description}</p>
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {step.details.map((detail, idx) => (
                        <li key={idx} className="flex items-center text-gray-300">
                          <Icon icon="lucide:check-circle" className="mr-2 text-beamly-secondary" width={16} />
                          <span>{detail}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
      
      <div className="mb-16">
        <div className="text-center mb-12">
          <h2 className="text-2xl font-bold text-white">Frequently Asked Questions</h2>
          <p className="text-gray-300 mt-2 max-w-2xl mx-auto">
            Find answers to common questions about using Beamly
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
      
      <div className="yellow-glass p-8 text-center">
        <h2 className="text-2xl font-bold text-white mb-4">Ready to Get Started?</h2>
        <p className="text-gray-300 max-w-2xl mx-auto mb-6">
          Join thousands of freelancers and businesses already using Beamly to achieve their goals.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            color="secondary"
            size="lg"
            className="font-medium font-outfit text-beamly-third"
          >
            Sign Up as Freelancer
          </Button>
          <Button 
            color="primary"
            variant="bordered"
            size="lg"
            className="font-medium font-outfit text-white border-white"
          >
            Hire a Freelancer
          </Button>
        </div>
      </div>
    </div>
  );
};