import React from "react";
import { motion } from "framer-motion";
import { PageHeader } from "../page-header";
import { useTheme } from "../../contexts/theme-context";

export const TermsOfServicePage: React.FC = () => {
  const { isDarkMode } = useTheme();
  
  return (
    <div className="container mx-auto px-4 py-8">
      <PageHeader 
        title="Terms of Use"
        subtitle="Effective Date: 10.06.2025"
        showBackButton
      />
      
      <div className="glass-effect p-6 md:p-8">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className={`prose max-w-none ${isDarkMode ? 'prose-invert' : ''}`}
        >
          <p className={`${isDarkMode ? "text-white" : "text-gray-600"} mb-4`}>
            Welcome to Beamly. By using our platform, you agree to comply with and be bound by these Terms of Use. Please read these Terms carefully before using our services. If you do not agree with any part of these Terms, you must not use our platform.
          </p>
          
          <h2 className={`text-xl md:text-2xl font-semibold ${isDarkMode ? "text-white" : "text-gray-900"} mb-4`}>1. Overview</h2>
          <p className={`${isDarkMode ? "text-white" : "text-gray-600"} mb-4`}>
            Beamly provides a platform to connect freelancers with clients for freelance work, where freelancers offer services related to software, design, digital marketing, development, and other technology-related tasks ("Services"). The platform does not facilitate the sale of physical goods, human services unrelated to software, or any other prohibited categories under applicable regulations.
          </p>
          
          <h2 className={`text-xl md:text-2xl font-semibold ${isDarkMode ? "text-white" : "text-gray-900"} mb-4`}>2. Account Registration</h2>
          <p className={`${isDarkMode ? "text-white" : "text-gray-600"} mb-2`}>To use our services, you must:</p>
          <ul className={`list-disc pl-6 ${isDarkMode ? "text-white" : "text-gray-600"} mb-4`}>
            <li>Be at least 18 years old</li>
            <li>Register for an account with accurate information</li>
            <li>Maintain the security of your account credentials</li>
            <li>Notify us immediately of any unauthorized access to your account</li>
          </ul>
          <p className={`${isDarkMode ? "text-white" : "text-gray-600"} mb-4`}>
            You are responsible for all activities that occur under your account. We reserve the right to suspend or terminate accounts that violate these Terms.
          </p>
          
          <h2 className={`text-xl md:text-2xl font-semibold ${isDarkMode ? "text-white" : "text-gray-900"} mb-4`}>3. User Conduct</h2>
          <p className={`${isDarkMode ? "text-white" : "text-gray-600"} mb-2`}>You agree not to:</p>
          <ul className={`list-disc pl-6 ${isDarkMode ? "text-white" : "text-gray-600"} mb-4`}>
            <li>Violate any laws or regulations</li>
            <li>Infringe on the rights of others</li>
            <li>Submit false or misleading information</li>
            <li>Engage in fraudulent or deceptive practices</li>
            <li>Circumvent any features designed to protect the platform</li>
            <li>Use the platform for any illegal or unauthorized purpose</li>
            <li>Harass, abuse, or harm another person</li>
            <li>Distribute malware or other harmful content</li>
          </ul>
          
          <h2 className={`text-xl md:text-2xl font-semibold ${isDarkMode ? "text-white" : "text-gray-900"} mb-4`}>4. Service Terms</h2>
          <h3 className={`text-lg md:text-xl font-semibold ${isDarkMode ? "text-white" : "text-gray-900"} mb-2`}>For Clients:</h3>
          <ul className={`list-disc pl-6 ${isDarkMode ? "text-white" : "text-gray-600"} mb-4`}>
            <li>You are responsible for reviewing freelancer profiles and making hiring decisions</li>
            <li>You must provide clear project requirements and communicate expectations</li>
            <li>You agree to pay for completed work that meets the agreed-upon requirements</li>
            <li>You retain ownership of work you pay for, subject to any agreements with freelancers</li>
          </ul>
          
          <h3 className={`text-lg md:text-xl font-semibold ${isDarkMode ? "text-white" : "text-gray-900"} mb-2`}>For Freelancers:</h3>
          <ul className={`list-disc pl-6 ${isDarkMode ? "text-white" : "text-gray-600"} mb-4`}>
            <li>You must accurately represent your skills, qualifications, and experience</li>
            <li>You must deliver work that meets agreed-upon requirements and deadlines</li>
            <li>You are responsible for the quality of your work and maintaining professional communication</li>
            <li>You must respect intellectual property rights and confidentiality agreements</li>
          </ul>
          
          <h2 className={`text-xl md:text-2xl font-semibold ${isDarkMode ? "text-white" : "text-gray-900"} mb-4`}>5. Fees and Payments</h2>
          <p className={`${isDarkMode ? "text-white" : "text-gray-600"} mb-4`}>
            Beamly charges a service fee for using the platform. Payment terms are specified during the transaction process. All fees are non-refundable unless otherwise specified. We use third-party payment processors to facilitate transactions, and you agree to their terms of service when making or receiving payments through our platform.
          </p>
          
          <h2 className={`text-xl md:text-2xl font-semibold ${isDarkMode ? "text-white" : "text-gray-900"} mb-4`}>6. Intellectual Property</h2>
          <p className={`${isDarkMode ? "text-white" : "text-gray-600"} mb-4`}>
            You retain ownership of your content, but grant Beamly a license to use, reproduce, and display your content for the purpose of providing and promoting our services. You represent that you have all necessary rights to the content you post on our platform and that it does not infringe on the rights of others.
          </p>
          
          <h2 className={`text-xl md:text-2xl font-semibold ${isDarkMode ? "text-white" : "text-gray-900"} mb-4`}>7. Limitation of Liability</h2>
          <p className={`${isDarkMode ? "text-white" : "text-gray-600"} mb-4`}>
            To the maximum extent permitted by law, Beamly and its affiliates shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including lost profits, arising out of or in connection with your use of our platform, even if we have been advised of the possibility of such damages.
          </p>
          
          <h2 className={`text-xl md:text-2xl font-semibold ${isDarkMode ? "text-white" : "text-gray-900"} mb-4`}>8. Dispute Resolution</h2>
          <p className={`${isDarkMode ? "text-white" : "text-gray-600"} mb-4`}>
            Any disputes arising from your use of our platform shall be resolved through arbitration in accordance with the rules of the American Arbitration Association. The arbitration shall take place in [Location], and the language of the arbitration shall be English.
          </p>
          
          <h2 className={`text-xl md:text-2xl font-semibold ${isDarkMode ? "text-white" : "text-gray-900"} mb-4`}>9. Termination</h2>
          <p className={`${isDarkMode ? "text-white" : "text-gray-600"} mb-4`}>
            We may terminate or suspend your account and access to our platform at any time, without prior notice or liability, for any reason, including if you breach these Terms. Upon termination, your right to use our platform will immediately cease.
          </p>
          
          <h2 className={`text-xl md:text-2xl font-semibold ${isDarkMode ? "text-white" : "text-gray-900"} mb-4`}>10. Changes to Terms</h2>
          <p className={`${isDarkMode ? "text-white" : "text-gray-600"} mb-4`}>
            We may update these Terms from time to time. We will notify you of any changes by posting the new Terms on this page and updating the "Effective Date" at the top. Your continued use of our platform after such changes constitutes your acceptance of the new Terms.
          </p>
          
          <h2 className={`text-xl md:text-2xl font-semibold ${isDarkMode ? "text-white" : "text-gray-900"} mb-4`}>11. Contact Us</h2>
          <p className={`${isDarkMode ? "text-white" : "text-gray-600"} mb-4`}>
            If you have any questions about these Terms, please contact us at legal@beamly.com.
          </p>
        </motion.div>
      </div>
    </div>
  );
};