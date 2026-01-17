import { motion } from 'framer-motion';
import { Scale } from 'lucide-react';
import { Navigation } from '../components/NewComponents/Navigation';

export default function TermsAndConditions() {
  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 mt-20">
        {/* Header */}
        <header className="bg-gradient-to-r from-orange-50 via-white to-orange-50 border-b border-orange-200/50">
          <div className="max-w-4xl mx-auto px-6 py-12">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white px-6 py-3 rounded-full mb-6 shadow-lg shadow-orange-500/30"
              >
                <Scale className="w-5 h-5" />
                <span className="text-sm font-medium">Terms You Agree To</span>
              </motion.div>
              
              <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-orange-600 via-amber-600 to-yellow-600 bg-clip-text text-transparent">
                Terms & Conditions
              </h1>
              <p className="text-lg text-gray-700 font-medium">Pandit Ji At Request</p>
              <p className="mt-2 text-orange-600 font-semibold">Last Updated: 16 January 2026</p>
            </motion.div>
          </div>
        </header>

        {/* Content */}
        <main className="max-w-7xl mx-auto px-6 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="bg-white rounded-2xl shadow-xl border border-orange-200/50 p-8 md:p-12 space-y-10"
          >
            {/* Introduction */}
            <section>
                <div className="bg-gradient-to-r from-orange-50 to-amber-50 border-l-4 border-orange-500 p-6 rounded-lg mb-6 shadow-sm">
                    <p className="text-gray-800 font-medium leading-relaxed">
                        <span className="text-orange-600 font-bold">Company Details</span><br/>
                        Vedic Vaibhav Dot Com Pvt Ltd<br/>
                        Registered Office: # 1031 Tricity Trade Tower, Patiala Zirakpur Road, Zirakpur, Punjab, India<br/>
                        Support Contact: panditjiatrequest@vedicvaibhav.com<br/>
                        Phone: +91 98727 88769
                    </p>
                </div>
                <p className="text-gray-700 leading-relaxed">
                    These Terms and Conditions ("Terms") govern your use of the Pandit Ji At Request platform/website/app (the "Platform") operated by Vedic Vaibhav Dot Com Pvt Ltd ("we", "us", "our", "Company"). By accessing or using our Platform and services, you agree to be bound by these Terms.
                </p>
                <p className="text-gray-700 leading-relaxed mt-4">
                    Please read these Terms carefully before using our services. If you do not agree with these Terms, you must not use our Platform.
                </p>
            </section>

            {/* 1) Acceptance of Terms */}
            <section className="border-l-2 border-orange-300 pl-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="text-orange-600">1)</span> Acceptance of Terms
                </h2>
                <p className="text-gray-700 leading-relaxed">
                    By creating an account, making a booking, or using any service on our Platform, you acknowledge that you have read, understood, and agree to be bound by these Terms and our Privacy Policy. These Terms constitute a legally binding agreement between you and Vedic Vaibhav Dot Com Pvt Ltd.
                </p>
            </section>

            {/* 2) Services Provided */}
            <section className="border-l-2 border-orange-300 pl-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="text-orange-600">2)</span> Services Provided
                </h2>
                <p className="text-gray-700 leading-relaxed mb-3">
                    Pandit Ji At Request is a platform that connects users with qualified pandits and religious service providers for:
                </p>
                <ul className="list-disc pl-5 space-y-2 text-gray-700">
                    <li>Puja and religious ceremony services</li>
                    <li>Temple offerings and prasad delivery</li>
                    <li>Spiritual consultations</li>
                    <li>Religious rituals and ceremonies at your location</li>
                    <li>Other spiritual and devotional services</li>
                </ul>
                <p className="text-gray-700 leading-relaxed mt-3">
                    We act as an intermediary platform facilitating these services. The actual services are performed by independent pandits and service providers.
                </p>
            </section>

            {/* 3) User Eligibility */}
            <section className="border-l-2 border-orange-300 pl-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="text-orange-600">3)</span> User Eligibility
                </h2>
                <p className="text-gray-700 leading-relaxed mb-2">
                    To use our Platform, you must:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-gray-700">
                    <li>Be at least 18 years of age or have parental/guardian consent</li>
                    <li>Have the legal capacity to enter into binding contracts</li>
                    <li>Provide accurate and complete registration information</li>
                    <li>Maintain the security of your account credentials</li>
                </ul>
            </section>

            {/* 4) Booking and Payment */}
            <section className="border-l-2 border-orange-300 pl-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="text-orange-600">4)</span> Booking and Payment
                </h2>
                
                <h3 className="text-xl font-semibold text-gray-800 mb-2 mt-4">A) Booking Process</h3>
                <p className="text-gray-700 leading-relaxed">
                    When you make a booking, you are requesting a service. We will confirm your booking and assign a qualified pandit/service provider. Booking confirmations are sent via SMS, email, or WhatsApp.
                </p>

                <h3 className="text-xl font-semibold text-gray-800 mb-2 mt-4">B) Pricing</h3>
                <p className="text-gray-700 leading-relaxed">
                    All prices are displayed in Indian Rupees (INR) and include applicable taxes unless stated otherwise. Prices may vary based on location, specific requirements, and service complexity.
                </p>

                <h3 className="text-xl font-semibold text-gray-800 mb-2 mt-4">C) Payment</h3>
                <ul className="list-disc pl-5 space-y-1 text-gray-700">
                    <li>Payments are processed through secure payment gateway (Razorpay)</li>
                    <li>Full or partial payment may be required at the time of booking</li>
                    <li>Payment confirmation will be sent after successful transaction</li>
                    <li>We accept UPI, cards, net banking, and other payment methods available on the platform</li>
                </ul>
            </section>

            {/* 5) Cancellation and Refund */}
            <section className="border-l-2 border-orange-300 pl-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="text-orange-600">5)</span> Cancellation and Refund Policy
                </h2>
                
                <h3 className="text-xl font-semibold text-gray-800 mb-2 mt-4">A) User Cancellations</h3>
                <ul className="list-disc pl-5 space-y-2 text-gray-700">
                    <li><strong className="text-orange-600">24+ hours before service:</strong> Full refund minus processing fee</li>
                    <li><strong className="text-orange-600">12-24 hours before service:</strong> 50% refund</li>
                    <li><strong className="text-orange-600">Less than 12 hours:</strong> No refund</li>
                </ul>

                <h3 className="text-xl font-semibold text-gray-800 mb-2 mt-4">B) Company Cancellations</h3>
                <p className="text-gray-700 leading-relaxed">
                    If we are unable to provide the service due to unforeseen circumstances, you will receive a full refund or the option to reschedule.
                </p>

                <h3 className="text-xl font-semibold text-gray-800 mb-2 mt-4">C) Refund Processing</h3>
                <p className="text-gray-700 leading-relaxed">
                    Approved refunds will be processed within 7-10 business days to the original payment method.
                </p>
            </section>

            {/* 6) Service Delivery */}
            <section className="border-l-2 border-orange-300 pl-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="text-orange-600">6)</span> Service Delivery
                </h2>
                <ul className="list-disc pl-5 space-y-2 text-gray-700">
                    <li>Services will be performed on the agreed date and time</li>
                    <li>You must provide accurate location and contact details</li>
                    <li>Required puja materials will be brought by the pandit unless specified otherwise</li>
                    <li>You are responsible for arranging the basic requirements (water, seating area, etc.)</li>
                    <li>Service duration may vary based on the type of puja/ritual</li>
                </ul>
            </section>

            {/* 7) User Responsibilities */}
            <section className="border-l-2 border-orange-300 pl-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="text-orange-600">7)</span> User Responsibilities
                </h2>
                <p className="text-gray-700 leading-relaxed mb-2">You agree to:</p>
                <ul className="list-disc pl-5 space-y-2 text-gray-700">
                    <li>Provide accurate booking information</li>
                    <li>Be present at the specified location during service delivery</li>
                    <li>Treat pandits and service providers with respect</li>
                    <li>Not misuse or abuse the Platform or services</li>
                    <li>Comply with all applicable laws and regulations</li>
                    <li>Not share your account credentials with others</li>
                </ul>
            </section>

            {/* 8) Prohibited Activities */}
            <section className="border-l-2 border-orange-300 pl-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="text-orange-600">8)</span> Prohibited Activities
                </h2>
                <p className="text-gray-700 leading-relaxed mb-2">You must not:</p>
                <ul className="list-disc pl-5 space-y-2 text-gray-700">
                    <li>Use the Platform for any unlawful purpose</li>
                    <li>Attempt to circumvent or manipulate the booking/payment system</li>
                    <li>Post false, misleading, or defamatory content</li>
                    <li>Harass, threaten, or harm pandits or other users</li>
                    <li>Copy, modify, or distribute Platform content without permission</li>
                    <li>Use automated systems (bots) to access the Platform</li>
                    <li>Attempt to gain unauthorized access to our systems</li>
                </ul>
            </section>

            {/* 9) Intellectual Property */}
            <section className="border-l-2 border-orange-300 pl-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="text-orange-600">9)</span> Intellectual Property
                </h2>
                <p className="text-gray-700 leading-relaxed">
                    All content on the Platform, including text, graphics, logos, images, and software, is the property of Vedic Vaibhav Dot Com Pvt Ltd or its licensors and is protected by Indian and international copyright laws. You may not reproduce, distribute, or create derivative works without our written permission.
                </p>
            </section>

            {/* 10) Disclaimer of Warranties */}
            <section className="border-l-2 border-orange-300 pl-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="text-orange-600">10)</span> Disclaimer of Warranties
                </h2>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <p className="text-gray-800 leading-relaxed font-medium">
                        The Platform and services are provided "as is" and "as available" without any warranties of any kind, either express or implied. We do not guarantee that:
                    </p>
                    <ul className="list-disc pl-5 space-y-1 text-gray-700 mt-2">
                        <li>The Platform will be uninterrupted or error-free</li>
                        <li>Defects will be corrected</li>
                        <li>The Platform is free from viruses or harmful components</li>
                        <li>The results from using services will meet your expectations</li>
                    </ul>
                </div>
            </section>

            {/* 11) Limitation of Liability */}
            <section className="border-l-2 border-orange-300 pl-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="text-orange-600">11)</span> Limitation of Liability
                </h2>
                <p className="text-gray-700 leading-relaxed">
                    To the maximum extent permitted by law, Vedic Vaibhav Dot Com Pvt Ltd shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the Platform or services, including but not limited to loss of profits, data, or goodwill.
                </p>
                <p className="text-gray-700 leading-relaxed mt-2">
                    Our total liability shall not exceed the amount you paid for the specific service that gave rise to the claim.
                </p>
            </section>

            {/* 12) Indemnification */}
            <section className="border-l-2 border-orange-300 pl-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="text-orange-600">12)</span> Indemnification
                </h2>
                <p className="text-gray-700 leading-relaxed">
                    You agree to indemnify and hold harmless Vedic Vaibhav Dot Com Pvt Ltd, its directors, employees, and service providers from any claims, damages, losses, or expenses (including legal fees) arising from: (a) your violation of these Terms, (b) your violation of any rights of another party, or (c) your misuse of the Platform.
                </p>
            </section>

            {/* 13) Dispute Resolution */}
            <section className="border-l-2 border-orange-300 pl-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="text-orange-600">13)</span> Dispute Resolution
                </h2>
                
                <h3 className="text-xl font-semibold text-gray-800 mb-2 mt-4">A) Grievance Officer</h3>
                <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-lg p-4 mb-3">
                    <p className="text-gray-700">For any grievances or disputes, please contact:</p>
                    <p className="text-gray-800 font-semibold mt-2">Email: panditjiatrequest@vedicvaibhav.com</p>
                    <p className="text-gray-800 font-semibold">Phone: +91 98727 88769</p>
                </div>

                <h3 className="text-xl font-semibold text-gray-800 mb-2 mt-4">B) Governing Law</h3>
                <p className="text-gray-700 leading-relaxed">
                    These Terms shall be governed by and construed in accordance with the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts in Punjab, India.
                </p>
            </section>

            {/* 14) Privacy */}
            <section className="border-l-2 border-orange-300 pl-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="text-orange-600">14)</span> Privacy and Data Protection
                </h2>
                <p className="text-gray-700 leading-relaxed">
                    Your use of the Platform is also governed by our Privacy Policy. Please review our Privacy Policy to understand how we collect, use, and protect your personal information.
                </p>
            </section>

            {/* 15) Modifications to Terms */}
            <section className="border-l-2 border-orange-300 pl-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="text-orange-600">15)</span> Modifications to Terms
                </h2>
                <p className="text-gray-700 leading-relaxed">
                    We reserve the right to modify these Terms at any time. Changes will be posted on this page with an updated "Last Updated" date. Continued use of the Platform after changes constitutes your acceptance of the modified Terms.
                </p>
            </section>

            {/* 16) Account Termination */}
            <section className="border-l-2 border-orange-300 pl-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="text-orange-600">16)</span> Account Termination
                </h2>
                <p className="text-gray-700 leading-relaxed">
                    We reserve the right to suspend or terminate your account and access to the Platform at our sole discretion, without notice, for conduct that we believe:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-gray-700 mt-2">
                    <li>Violates these Terms</li>
                    <li>Is harmful to other users or the Platform</li>
                    <li>Exposes us to legal liability</li>
                    <li>Is fraudulent or involves misuse of services</li>
                </ul>
            </section>

            {/* 17) Severability */}
            <section className="border-l-2 border-orange-300 pl-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="text-orange-600">17)</span> Severability
                </h2>
                <p className="text-gray-700 leading-relaxed">
                    If any provision of these Terms is found to be invalid or unenforceable, the remaining provisions will remain in full force and effect.
                </p>
            </section>

            {/* 18) Contact Information */}
            <section className="border-t-2 border-orange-200 pt-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="text-orange-600">18)</span> Contact Information
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                For questions, concerns, or support regarding these Terms:
              </p>
              <div className="bg-gradient-to-r from-orange-50 via-amber-50 to-yellow-50 border-2 border-orange-300 rounded-xl p-6 shadow-lg">
                <div className="space-y-3">
                    <p className="text-gray-800 font-bold text-lg">
                      <span className="text-orange-600">✉</span> panditjiatrequest@vedicvaibhav.com | 
                      <span className="text-orange-600"> ☎</span> +91 98727 88769
                    </p>
                    <p className="text-gray-700">
                        <span className="font-semibold text-orange-600">Registered Office:</span> # 1031 Tricity Trade Tower, Patiala Zirakpur Road, Zirakpur, Punjab India
                    </p>
                </div>
              </div>
            </section>
          </motion.div>
        </main>

        {/* Footer */}
        <footer className="bg-gradient-to-r from-orange-50 via-white to-orange-50 border-t-2 border-orange-200/50 mt-12">
          <div className="max-w-4xl mx-auto px-6 py-8 text-center">
            <p className="text-gray-700 font-medium">
              © 2026 Vedic Vaibhav Dot Com Pvt Ltd. All rights reserved.
            </p>
            <p className="text-sm text-gray-600 mt-2">
              Bringing sacred services to your doorstep with trust and devotion
            </p>
          </div>
        </footer>
      </div>
    </>
  );
}
