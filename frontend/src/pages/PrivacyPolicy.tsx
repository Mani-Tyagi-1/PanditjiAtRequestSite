import { motion } from 'framer-motion';
import { Shield } from 'lucide-react';
import { Navigation } from '../components/NewComponents/Navigation';

export default function PrivacyPolicy() {
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
                <Shield className="w-5 h-5" />
                <span className="text-sm font-medium">Your Privacy Matters</span>
              </motion.div>
              
              <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-orange-600 via-amber-600 to-yellow-600 bg-clip-text text-transparent">
                Privacy Policy
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
            <section>
                <div className="bg-gradient-to-r from-orange-50 to-amber-50 border-l-4 border-orange-500 p-6 rounded-lg mb-6 shadow-sm">
                    <p className="text-gray-800 font-medium leading-relaxed">
                        <span className="text-orange-600 font-bold">Company Details</span><br/>
                        Vedic Vaibhav Dot Com Pvt Ltd<br/>
                        Registered Office: # 1031 Tricity Trade Tower, Patiala Zirakpur Road, Zirakpur, Punjab, India<br/>
                        Support / Privacy Contact: panditjiatrequest@vedicvaibhav.com<br/>
                        Phone: +91 98727 88769
                    </p>
                </div>
                <p className="text-gray-700 leading-relaxed">
                    This Privacy Policy explains how Vedic Vaibhav Dot Com Pvt Ltd ("Pandit Ji At Request", "we", "us", "our", "Company") collects, uses, discloses, and protects information when you use our website/app/platform (the "Platform") and our services (puja/ritual services, temple offerings, consultations if offered, prasad-related services, and other spiritual services).
                </p>
                <p className="text-gray-700 leading-relaxed mt-4">
                    This Policy may be updated from time to time. Please review it periodically.
                </p>
            </section>

            {/* 1) Your Consent */}
            <section className="border-l-2 border-orange-300 pl-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="text-orange-600">1)</span> Your Consent
                </h2>
                <p className="text-gray-700 leading-relaxed">
                    By using the Platform and/or providing your information, you consent to the collection, use, storage, and disclosure of your information in accordance with this Privacy Policy. Under India's data protection framework, we provide notice and process personal data based on consent and other permitted bases, and we enable grievance redressal and rights as required. (MeitY)
                </p>
                <p className="text-gray-700 leading-relaxed mt-2">
                    If you do not agree with this Privacy Policy, you should stop using the Platform.
                </p>
            </section>

            {/* 2) What Information We Collect */}
            <section className="border-l-2 border-orange-300 pl-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="text-orange-600">2)</span> What Information We Collect
                </h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                    You can browse some parts of the Platform without identifying yourself. However, when you use services, create an account, or place a booking/order, we may collect the following:
                </p>
                
                <h3 className="text-xl font-semibold text-gray-800 mb-2 mt-4">A) Information you provide directly</h3>
                <ul className="list-disc pl-5 space-y-2 text-gray-700">
                    <li><strong className="text-orange-600">Identity & contact:</strong> name, phone number, WhatsApp number, email address</li>
                    <li><strong className="text-orange-600">Service details:</strong> date/time preferences, location/address, temple/ritual selection, instructions, family/gotra details (if you provide), and any information needed to perform the requested ritual/service</li>
                    <li><strong className="text-orange-600">Account details:</strong> login identifiers, preferences, language, communication preferences</li>
                    <li><strong className="text-orange-600">Customer support:</strong> messages, call/chat records (where applicable), complaint or feedback content</li>
                    <li><strong className="text-orange-600">Reviews/feedback:</strong> content you submit, rating, optional display name</li>
                </ul>

                <h3 className="text-xl font-semibold text-gray-800 mb-2 mt-4">B) Payment & transaction information (Razorpay)</h3>
                <p className="text-gray-700 leading-relaxed">
                    Payments are processed through Razorpay. We typically receive payment status, transaction references, order IDs, timestamps, and limited metadata. We do not store full card/UPI/bank credentials on our servers (Razorpay and your bank/payment provider handle that). (Razorpay)
                </p>

                <h3 className="text-xl font-semibold text-gray-800 mb-2 mt-4">C) Automatically collected information</h3>
                <ul className="list-disc pl-5 space-y-2 text-gray-700">
                    <li><strong className="text-orange-600">Device & usage data:</strong> IP address, browser type, device identifiers, app version, pages/screens visited, clicks, session duration</li>
                    <li><strong className="text-orange-600">Log data:</strong> crash logs, diagnostic info</li>
                    <li><strong className="text-orange-600">Approximate location:</strong> derived from IP; and precise location only if you explicitly allow it (for location-based service coordination)</li>
                </ul>

                <h3 className="text-xl font-semibold text-gray-800 mb-2 mt-4">D) Cookies & similar technologies</h3>
                <p className="text-gray-700 leading-relaxed">
                    We may use cookies and similar technologies to keep the Platform working effectively, remember preferences, and improve your experience (see Section 7).
                </p>
            </section>

            {/* 3) Why We Collect and Use Your Information */}
            <section className="border-l-2 border-orange-300 pl-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="text-orange-600">3)</span> Why We Collect and Use Your Information
                </h2>
                <p className="text-gray-700 leading-relaxed mb-2">We use information to:</p>
                 <ul className="list-disc pl-5 space-y-2 text-gray-700">
                    <li>Process and fulfill bookings/orders (confirm booking, assign pandit, coordinate service, deliver prasad/items if applicable)</li>
                    <li>Provide customer support and resolve disputes/issues</li>
                    <li>Improve Platform performance (analytics, diagnostics, feature improvements)</li>
                    <li>Send service communications (booking confirmations, reminders, changes, invoices/receipts, service updates)</li>
                    <li>Send promotional communications (offers/new services) only where allowed; you can opt out (Section 10)</li>
                    <li>Market research (feedback, surveys) to improve services</li>
                    <li>Prevent fraud and abuse and protect Platform integrity</li>
                    <li>Comply with legal obligations and enforce our Terms & Conditions</li>
                </ul>
            </section>

            {/* 4) How We Share Information (Confidentiality) */}
            <section className="border-l-2 border-orange-300 pl-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="text-orange-600">4)</span> How We Share Information (Confidentiality)
                </h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                    We do not sell your personal information. We may share information only in the following situations:
                </p>
                <h3 className="text-xl font-semibold text-gray-800 mb-2 mt-4">A) With Pandit Ji's/representatives to deliver the service</h3>
                <p className="text-gray-700 leading-relaxed">
                    We share only the information needed for service coordination (e.g., name, location, booking type, timing, instructions).
                </p>
                
                <h3 className="text-xl font-semibold text-gray-800 mb-2 mt-4">B) With trusted service providers (processors)</h3>
                <p className="text-gray-700 leading-relaxed mb-2">
                    We may share information with vendors who help us run the Platform and deliver services, such as:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-gray-700">
                    <li>payment processing (Razorpay)</li>
                    <li>communication providers (SMS/WhatsApp/email), customer support tools</li>
                    <li>hosting/cloud services, analytics, security monitoring</li>
                </ul>
                <p className="text-gray-700 leading-relaxed mt-2">
                    These partners process information under confidentiality and security obligations.
                </p>

                <h3 className="text-xl font-semibold text-gray-800 mb-2 mt-4">C) For legal reasons</h3>
                <p className="text-gray-700 leading-relaxed">
                    We may disclose information if required to comply with law, court orders, or to protect rights, property, and safety; investigate fraud; or enforce our Terms. Indian rules also require publishing grievance contact details and handling complaints within specified timelines. (DataGuidance)
                </p>

                <h3 className="text-xl font-semibold text-gray-800 mb-2 mt-4">D) Business transfers</h3>
                <p className="text-gray-700 leading-relaxed">
                    If we are involved in a merger, acquisition, or sale of assets, user information may be transferred as part of that transaction. We will provide notice where required. (MeitY)
                </p>
            </section>

             {/* 5) Information Security */}
            <section className="border-l-2 border-orange-300 pl-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="text-orange-600">5)</span> Information Security
                </h2>
                <p className="text-gray-700 leading-relaxed">
                    We use reasonable security safeguards (physical, electronic, and managerial) to protect information against unauthorized access, alteration, disclosure, or destruction. We restrict access to personal data to authorized personnel on a need-to-know basis and implement controls consistent with India's security expectations under applicable rules. (India Code)
                </p>
                <p className="text-gray-800 leading-relaxed mt-2 font-semibold bg-amber-50 p-3 rounded-lg border border-amber-200">
                    Important: No system is 100% secure. Please use strong passwords/OTP privacy and avoid sharing OTPs with anyone.
                </p>
            </section>

             {/* 6) Data Retention */}
            <section className="border-l-2 border-orange-300 pl-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="text-orange-600">6)</span> Data Retention
                </h2>
                <p className="text-gray-700 leading-relaxed mb-2">We retain your information only as long as needed for:</p>
                <ul className="list-disc pl-5 space-y-1 text-gray-700">
                    <li>providing the requested services,</li>
                    <li>maintaining business and transaction records,</li>
                    <li>complying with legal/tax obligations, and</li>
                    <li>resolving disputes / enforcing agreements.</li>
                </ul>
                <p className="text-gray-700 leading-relaxed mt-2">
                    When retention is no longer necessary, we take steps to delete or anonymize data, subject to lawful exceptions. DPDP provides for erasure requests unless retention is required for legal compliance or the specified purpose. (MeitY)
                </p>
            </section>

             {/* 7) Cookies & Similar Technologies */}
            <section className="border-l-2 border-orange-300 pl-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="text-orange-600">7)</span> Cookies & Similar Technologies
                </h2>
                <p className="text-gray-700 leading-relaxed mb-2">
                    Cookies are small files stored by your browser that help us:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-gray-700">
                    <li>keep sessions active,</li>
                    <li>remember preferences,</li>
                    <li>understand traffic and usage to improve the Platform.</li>
                </ul>
                <p className="text-gray-700 leading-relaxed mt-2">
                    You can usually modify browser settings to block cookies. Some features may not work properly if cookies are disabled.
                </p>
            </section>

             {/* 8) Children's Privacy */}
            <section className="border-l-2 border-orange-300 pl-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="text-orange-600">8)</span> Children's Privacy
                </h2>
                <p className="text-gray-700 leading-relaxed">
                    Our Platform is intended for users who can enter into valid arrangements for services. If we process personal data of a child (under 18 years), we will seek verifiable consent from the parent/lawful guardian as required, and we will not process children's data in ways likely to cause harm. (MeitY)
                </p>
            </section>

            {/* 9) Your Rights */}
            <section className="border-l-2 border-orange-300 pl-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="text-orange-600">9)</span> Your Rights (Access, Correction, Erasure, Grievance)
                </h2>
                <p className="text-gray-700 leading-relaxed mb-2">Subject to applicable law, you may request:</p>
                 <ul className="list-disc pl-5 space-y-1 text-gray-700">
                    <li>access to information we hold about you,</li>
                    <li>correction of inaccurate/incomplete information,</li>
                    <li>erasure of personal data (where legally permissible), and</li>
                    <li>grievance redressal for concerns about processing.</li>
                </ul>
                 <p className="text-gray-700 leading-relaxed mt-2">
                    DPDP Act provides rights including correction/erasure and grievance redressal, and requires readily available means for grievance handling. (MeitY)
                </p>
                <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-lg p-5 mt-4 shadow-sm">
                     <p className="text-gray-800 font-semibold mb-2">To exercise rights or raise a grievance:</p>
                     <p className="text-gray-700"><span className="font-medium text-orange-600">Email:</span> panditjiatrequest@vedicvaibhav.com</p>
                     <p className="text-gray-700"><span className="font-medium text-orange-600">Phone:</span> +91 98727 88769</p>
                     <p className="text-gray-600 text-sm mt-3 italic">(For faster handling, include your registered phone/email, booking ID, and the specific request.)</p>
                </div>
            </section>

            {/* 10) Marketing Choices / Opt-Out */}
            <section className="border-l-2 border-orange-300 pl-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="text-orange-600">10)</span> Marketing Choices / Opt-Out
                </h2>
                <p className="text-gray-700 leading-relaxed mb-2">If you receive promotional emails/SMS/WhatsApp messages from us, you can opt out anytime by:</p>
                 <ul className="list-disc pl-5 space-y-1 text-gray-700">
                    <li>using an "unsubscribe" option (where available), or</li>
                    <li>emailing panditjiatrequest@vedicvaibhav.com with "UNSUBSCRIBE" in the subject.</li>
                </ul>
                 <p className="text-gray-700 leading-relaxed mt-2">
                    Even if you opt out of marketing, you may still receive essential service messages (booking confirmations, reminders, receipts, security alerts).
                </p>
            </section>

            {/* 11) Links to Other Websites */}
            <section className="border-l-2 border-orange-300 pl-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="text-orange-600">11)</span> Links to Other Websites
                </h2>
                <p className="text-gray-700 leading-relaxed">
                    Our Platform may contain links to third-party websites. Once you leave our Platform, their privacy practices apply. We are not responsible for the privacy or content of third-party sites.
                </p>
            </section>

            {/* 12) Images, Trademarks, and Copyright Concerns */}
            <section className="border-l-2 border-orange-300 pl-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="text-orange-600">12)</span> Images, Trademarks, and Copyright Concerns
                </h2>
                <p className="text-gray-700 leading-relaxed mb-2">
                    Some images/graphics used on the Platform may be sourced from creators/partners or licensed resources. If you believe any content infringes your rights, email panditjiatrequest@vedicvaibhav.com with:
                </p>
                 <ul className="list-disc pl-5 space-y-1 text-gray-700">
                    <li>the URL/content details,</li>
                    <li>proof of ownership/authority, and</li>
                    <li>the requested action (remove/credit/replace).</li>
                </ul>
                 <p className="text-gray-700 leading-relaxed mt-2">
                    We will review and take appropriate action.
                </p>
            </section>

             {/* 13) Payment Data (Razorpay) */}
            <section className="border-l-2 border-orange-300 pl-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="text-orange-600">13)</span> Payment Data (Razorpay)
                </h2>
                <p className="text-gray-700 leading-relaxed">
                    Payments are handled by Razorpay as a payment gateway. Razorpay's own privacy practices apply to the data they process as part of payment services, including end-customer ("buyer") data processing. (Razorpay)
                </p>
            </section>

             {/* 14) Legal Compliance & Breach Handling */}
            <section className="border-l-2 border-orange-300 pl-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="text-orange-600">14)</span> Legal Compliance & Breach Handling
                </h2>
                <p className="text-gray-700 leading-relaxed">
                    We follow applicable Indian laws and rules relating to privacy and security practices, including requirements around security safeguards and grievance handling. (PRS Legislative Research)
                </p>
                 <p className="text-gray-700 leading-relaxed mt-2">
                    If a personal data breach occurs, we will take reasonable steps to investigate, mitigate harm, and make required notifications as per applicable rules. (Press Information Bureau)
                </p>
            </section>

             {/* 15) Changes to this Privacy Policy */}
            <section className="border-l-2 border-orange-300 pl-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="text-orange-600">15)</span> Changes to this Privacy Policy
                </h2>
                <p className="text-gray-700 leading-relaxed">
                    We may update this Privacy Policy without prior notice. Changes will be posted on this page with an updated "Last Updated" date. Continued use of the Platform means you accept the revised Policy.
                </p>
            </section>

            {/* 16) Contact */}
            <section className="border-t-2 border-orange-200 pt-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="text-orange-600">16)</span> Contact
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                For privacy questions, complaints, or requests:
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
