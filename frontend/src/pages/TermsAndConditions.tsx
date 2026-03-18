import { motion } from 'framer-motion';
import { Scale } from 'lucide-react';
import { Navigation } from '../components/NewComponents/Navigation';

const SectionCard = ({ number, title, children }: { number: string; title: string; children: React.ReactNode }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.4 }}
    className="bg-white rounded-2xl shadow-sm border border-orange-100 overflow-hidden"
  >
    <div className="flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-orange-50 to-amber-50 border-b border-orange-100">
      <span className="w-8 h-8 flex items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-amber-500 text-white text-xs font-bold shrink-0">
        {number}
      </span>
      <h2 className="text-base md:text-lg font-bold text-orange-800">{title}</h2>
    </div>
    <div className="px-6 py-5 text-sm text-stone-700 leading-relaxed space-y-3">
      {children}
    </div>
  </motion.div>
);

const SubSection = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="mt-4">
    <p className="font-semibold text-orange-700 mb-2">{label}</p>
    <div className="pl-3 border-l-2 border-orange-200 space-y-2">{children}</div>
  </div>
);

const Bullet = ({ children }: { children: React.ReactNode }) => (
  <li className="flex items-start gap-2">
    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-orange-400 shrink-0" />
    <span>{children}</span>
  </li>
);

const InfoBox = ({ children }: { children: React.ReactNode }) => (
  <div className="bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200 rounded-xl px-5 py-4 space-y-1.5">
    {children}
  </div>
);

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
                <span className="text-sm font-medium">Please Read Carefully</span>
              </motion.div>
              <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-orange-600 via-amber-600 to-yellow-600 bg-clip-text text-transparent">
                Terms &amp; Conditions
              </h1>
              <p className="text-lg text-gray-700 font-medium">Pandit Ji At Request</p>
              <p className="mt-2 text-orange-600 font-semibold">Last Updated: March 2026</p>
            </motion.div>
          </div>
        </header>

        {/* Content */}
        <main className="max-w-4xl mx-auto px-4 md:px-6 py-10 space-y-5">

          {/* Intro */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-2xl border border-orange-100 shadow-sm px-6 py-5 text-sm text-stone-700 leading-relaxed space-y-3"
          >
            <p className="font-bold text-orange-800 text-base">Terms &amp; Conditions – Pandit Ji At Request</p>
            <p>
              These Terms &amp; Conditions ("Terms") govern your access to and use of the Pandit Ji At Request mobile application, website, and related platform services (collectively, the "Platform") operated by Vedic Vaibhav Dot Com Pvt Ltd ("Company", "Pandit Ji At Request", "we", "us", or "our").
            </p>
            <p>
              By accessing, registering on, or using the Platform, or by booking any service through the Platform, you agree to be bound by these Terms and our Privacy Policy. If you do not agree, please do not use the Platform.
            </p>
          </motion.div>

          {/* 1. Company Details */}
          <SectionCard number="1" title="Company Details">
            <ul className="space-y-1.5 list-none">
              <li><span className="font-medium text-stone-800">Company:</span> Vedic Vaibhav Dot Com Pvt Ltd</li>
              <li><span className="font-medium text-stone-800">Registered Office:</span> #1031 Tricity Trade Tower, Patiala Zirakpur Road, Zirakpur, Punjab, India</li>
              <li><span className="font-medium text-stone-800">Support Email:</span> panditjiatrequest@vedicvaibhav.com</li>
              <li><span className="font-medium text-stone-800">Phone:</span> +91 98727 88769</li>
            </ul>
          </SectionCard>

          {/* 2. Scope of Services */}
          <SectionCard number="2" title="Scope of Services">
            <p>Pandit Ji At Request is a technology-enabled platform that facilitates access to spiritual and religious services, which may include:</p>
            <ul className="space-y-1.5 mt-2">
              <Bullet>puja and ritual services at home or another requested location,</Bullet>
              <Bullet>online puja, spiritual sessions, and consultations where offered,</Bullet>
              <Bullet>temple offerings, prasad-related services, and devotional services,</Bullet>
              <Bullet>pandit booking and coordination services,</Bullet>
              <Bullet>other related services that may be listed on the Platform from time to time.</Bullet>
            </ul>
            <p className="mt-3">The Platform enables users to discover, request, schedule, and pay for such services. Unless expressly stated otherwise, the actual religious or ritual service is performed by an independent pandit, representative, temple partner, or service provider.</p>
            <p className="mt-2">We may verify, onboard, list, coordinate, and support such service providers, but availability may vary by city, date, time, festival period, and service type.</p>
          </SectionCard>

          {/* 3. Acceptance of Terms */}
          <SectionCard number="3" title="Acceptance of Terms">
            <p>By creating an account, logging in through OTP, browsing the Platform, making a booking, making a payment, or otherwise using any part of the Platform, you confirm that:</p>
            <ul className="space-y-1.5 mt-2">
              <Bullet>you have read and understood these Terms,</Bullet>
              <Bullet>you agree to comply with them,</Bullet>
              <Bullet>you agree to our Privacy Policy, and</Bullet>
              <Bullet>you are legally capable of entering into a binding arrangement under applicable law.</Bullet>
            </ul>
            <p className="mt-3">If you are using the Platform on behalf of another person, family, group, or organization, you confirm that you are authorized to do so.</p>
          </SectionCard>

          {/* 4. Eligibility */}
          <SectionCard number="4" title="Eligibility">
            <p>To use the Platform, you must:</p>
            <ul className="space-y-1.5 mt-2">
              <Bullet>be at least 18 years of age, or use the Platform under the supervision/consent of a parent or lawful guardian,</Bullet>
              <Bullet>provide accurate, current, and complete information,</Bullet>
              <Bullet>use a valid mobile number and/or email where required,</Bullet>
              <Bullet>comply with applicable laws and these Terms.</Bullet>
            </ul>
            <p className="mt-3">We may refuse service, suspend bookings, or restrict access if we believe eligibility requirements are not met.</p>
          </SectionCard>

          {/* 5. Account Registration and OTP Access */}
          <SectionCard number="5" title="Account Registration and OTP Access">
            <p>You may be required to register or log in using your mobile number, OTP, email, or other permitted authentication methods.</p>
            <p className="mt-2">You are responsible for:</p>
            <ul className="space-y-1.5 mt-2">
              <Bullet>ensuring your account information is accurate,</Bullet>
              <Bullet>maintaining the confidentiality of OTPs and login credentials,</Bullet>
              <Bullet>restricting unauthorized access to your device/account,</Bullet>
              <Bullet>promptly informing us if you suspect unauthorized use of your account.</Bullet>
            </ul>
            <p className="mt-3">You must not share OTPs with anyone, including persons claiming to be our staff or service partners. Any activity occurring through your verified account may be treated as authorized by you unless proven otherwise.</p>
            <p className="mt-2">We reserve the right to suspend, restrict, or terminate accounts that appear false, duplicated, fraudulent, abusive, or unauthorized.</p>
          </SectionCard>

          {/* 6. Booking Process */}
          <SectionCard number="6" title="Booking Process">
            <p>When you place a booking through the Platform, you are submitting a request for a service. A booking becomes confirmed only after acceptance/confirmation by us through the Platform, SMS, WhatsApp, email, call, or other official communication.</p>
            <p className="mt-2">Booking confirmation may depend on factors including:</p>
            <ul className="space-y-1.5 mt-2">
              <Bullet>service availability,</Bullet>
              <Bullet>pandit availability,</Bullet>
              <Bullet>location/serviceability,</Bullet>
              <Bullet>festival or peak demand,</Bullet>
              <Bullet>accuracy of information provided by you,</Bullet>
              <Bullet>successful payment or advance payment where applicable.</Bullet>
            </ul>
            <p className="mt-3">We may request additional information necessary for service coordination, including:</p>
            <ul className="space-y-1.5 mt-2">
              <Bullet>address/location,</Bullet>
              <Bullet>preferred language,</Bullet>
              <Bullet>date and time preference,</Bullet>
              <Bullet>type of puja/ritual,</Bullet>
              <Bullet>family details or gotra where voluntarily provided,</Bullet>
              <Bullet>special instructions relevant to the service.</Bullet>
            </ul>
            <p className="mt-3">You are responsible for ensuring that the booking details submitted are accurate.</p>
          </SectionCard>

          {/* 7. Pricing and Taxes */}
          <SectionCard number="7" title="Pricing and Taxes">
            <p>All prices displayed on the Platform are in Indian Rupees (INR) unless otherwise stated.</p>
            <p className="mt-2">Pricing may vary based on:</p>
            <ul className="space-y-1.5 mt-2">
              <Bullet>city or location,</Bullet>
              <Bullet>service type,</Bullet>
              <Bullet>pandit category,</Bullet>
              <Bullet>duration,</Bullet>
              <Bullet>festival/auspicious date demand,</Bullet>
              <Bullet>material requirements,</Bullet>
              <Bullet>travel distance,</Bullet>
              <Bullet>add-ons, samagri, prasad, dakshina, or other service components.</Bullet>
            </ul>
            <p className="mt-3">Unless stated otherwise, applicable taxes may be included in the displayed amount. In some cases, additional charges may apply if clearly communicated before confirmation, including for travel, waiting time, material upgrades, location changes, or extra requirements requested by you.</p>
            <p className="mt-2">We reserve the right to update pricing at any time before booking confirmation.</p>
          </SectionCard>

          {/* 8. Payments */}
          <SectionCard number="8" title="Payments">
            <p>Payments on the Platform are processed through third-party payment partners such as Razorpay and other enabled payment methods.</p>
            <p className="mt-2">By making a payment, you agree that:</p>
            <ul className="space-y-1.5 mt-2">
              <Bullet>you are authorized to use the selected payment instrument,</Bullet>
              <Bullet>payment information submitted by you is accurate,</Bullet>
              <Bullet>the transaction may be subject to payment gateway, banking, or network checks,</Bullet>
              <Bullet>booking confirmation may be conditional on successful payment.</Bullet>
            </ul>
            <p className="mt-3">We do not store your full card, bank, or UPI credentials on our own servers unless expressly stated otherwise. Payment processing may be subject to the terms and privacy practices of the relevant payment provider.</p>
            <p className="mt-2">In some cases, we may require:</p>
            <ul className="space-y-1.5 mt-2">
              <Bullet>full advance payment,</Bullet>
              <Bullet>partial advance payment,</Bullet>
              <Bullet>balance payment before or after service, depending on the service type.</Bullet>
            </ul>
            <p className="mt-3">If a payment is reversed, charged back, disputed, unauthorized, or found fraudulent, we may suspend your access, cancel bookings, recover losses, and take appropriate action.</p>
          </SectionCard>

          {/* 9. Rescheduling, Cancellation, and Refunds */}
          <SectionCard number="9" title="Rescheduling, Cancellation, and Refunds">
            <SubSection label="9.1 User Cancellation">
              <p>Unless otherwise stated for a specific service, offer, or festival booking, the following general cancellation terms may apply:</p>
              <ul className="space-y-1.5 mt-2">
                <Bullet><span className="font-medium">More than 24 hours before scheduled service:</span> eligible for refund after deduction of payment gateway/processing/administrative charges, if any.</Bullet>
                <Bullet><span className="font-medium">12 to 24 hours before scheduled service:</span> partial refund may apply.</Bullet>
                <Bullet><span className="font-medium">Less than 12 hours before scheduled service:</span> refund may not be available.</Bullet>
              </ul>
            </SubSection>

            <SubSection label="9.2 Rescheduling">
              <p>Rescheduling requests are subject to:</p>
              <ul className="space-y-1 mt-1">
                <Bullet>pandit availability,</Bullet>
                <Bullet>location feasibility,</Bullet>
                <Bullet>festival demand,</Bullet>
                <Bullet>sufficient prior notice.</Bullet>
              </ul>
              <p className="mt-2">A rescheduling fee may apply in some cases.</p>
            </SubSection>

            <SubSection label="9.3 Company/Service Cancellation">
              <p>If we are unable to provide the service due to unavailability, force majeure, serviceability issues, safety concerns, or other operational reasons, we may:</p>
              <ul className="space-y-1 mt-1">
                <Bullet>reschedule the booking,</Bullet>
                <Bullet>provide wallet credit/store credit where offered, or</Bullet>
                <Bullet>issue a refund, as applicable.</Bullet>
              </ul>
            </SubSection>

            <SubSection label="9.4 Refund Timelines">
              <p>Approved refunds are generally processed to the original payment source within 7 to 10 business days, subject to the timelines of banks, payment gateways, or financial institutions.</p>
            </SubSection>

            <SubSection label="9.5 Non-Refundable Situations">
              <p>Refunds may be refused or reduced in cases including:</p>
              <ul className="space-y-1 mt-1">
                <Bullet>incorrect address or inaccessible service location,</Bullet>
                <Bullet>your unavailability/no-show,</Bullet>
                <Bullet>lack of required entry permission/access,</Bullet>
                <Bullet>last-minute change in booking requirements,</Bullet>
                <Bullet>abuse or unsafe behavior,</Bullet>
                <Bullet>delay caused by you,</Bullet>
                <Bullet>services already rendered,</Bullet>
                <Bullet>customized/festival/limited-slot services marked non-refundable,</Bullet>
                <Bullet>digital or consultation services already delivered.</Bullet>
              </ul>
              <p className="mt-2">Where required by law or where a different refund policy is specifically shown for a service, that policy will prevail for that booking.</p>
            </SubSection>
          </SectionCard>

          {/* 10. Service Delivery Conditions */}
          <SectionCard number="10" title="Service Delivery Conditions">
            <p>You acknowledge and agree that:</p>
            <ul className="space-y-1.5 mt-2">
              <Bullet>services will be attempted on the agreed date and approximate time,</Bullet>
              <Bullet>exact start time may vary due to travel, traffic, weather, prior bookings, festival congestion, local restrictions, or operational reasons,</Bullet>
              <Bullet>you must provide accurate location and reachable contact details,</Bullet>
              <Bullet>you or your authorized representative must be available at the service location,</Bullet>
              <Bullet>you must ensure a safe, lawful, and reasonably accessible environment for the pandit/service provider,</Bullet>
              <Bullet>certain basic arrangements may need to be provided by you unless otherwise specified.</Bullet>
            </ul>
            <p className="mt-3">Depending on the service, some materials may be:</p>
            <ul className="space-y-1.5 mt-2">
              <Bullet>included,</Bullet>
              <Bullet>optional add-ons,</Bullet>
              <Bullet>to be arranged by you, or</Bullet>
              <Bullet>brought by the pandit/service provider if specified.</Bullet>
            </ul>
            <p className="mt-3">The duration of a puja/ritual may vary depending on religious procedure, number of participants, local conditions, and service scope.</p>
          </SectionCard>

          {/* 11. User Responsibilities */}
          <SectionCard number="11" title="User Responsibilities">
            <p>You agree to:</p>
            <ul className="space-y-1.5 mt-2">
              <Bullet>provide truthful, complete, and updated information,</Bullet>
              <Bullet>cooperate reasonably for service delivery,</Bullet>
              <Bullet>behave respectfully with pandits, support staff, and representatives,</Bullet>
              <Bullet>ensure that minors, elders, pets, building security, and household access issues do not obstruct service delivery,</Bullet>
              <Bullet>not record, misuse, threaten, intimidate, harass, or assault service personnel,</Bullet>
              <Bullet>comply with all applicable laws and community norms,</Bullet>
              <Bullet>pay all amounts due in connection with your booking.</Bullet>
            </ul>
            <p className="mt-3">You are solely responsible for any instructions, religious preferences, address details, family details, or service-specific inputs submitted by you.</p>
          </SectionCard>

          {/* 12. Service Provider Relationship */}
          <SectionCard number="12" title="Service Provider Relationship">
            <p>Pandits and service partners may be onboarded, empanelled, or associated with the Platform for the purpose of providing services. Unless specifically stated otherwise, they are not employees solely by reason of being listed on the Platform.</p>
            <p className="mt-2">We may assist in screening, coordination, support, and quality monitoring, but the actual service may involve religious/customary practices that differ by region, sampradaya, availability, and the discretion of the performing pandit, subject to the booked package.</p>
            <p className="mt-2">You acknowledge that ritual practices may vary and minor variations in method, sequence, chanting style, or presentation do not by themselves amount to service deficiency, provided the core booked service is delivered in good faith.</p>
          </SectionCard>

          {/* 13. No Guarantee of Religious or Spiritual Outcomes */}
          <SectionCard number="13" title="No Guarantee of Religious or Spiritual Outcomes">
            <p>Pandit Ji At Request facilitates access to spiritual and devotional services. Such services are based on faith, tradition, and personal belief.</p>
            <p className="mt-2">We do not guarantee:</p>
            <ul className="space-y-1.5 mt-2">
              <Bullet>any specific spiritual, emotional, astrological, health, financial, relationship, business, or life outcome,</Bullet>
              <Bullet>that a puja or ritual will produce any assured result,</Bullet>
              <Bullet>that user expectations of religious benefit will be fulfilled in a specific manner.</Bullet>
            </ul>
            <p className="mt-3">All services are intended for spiritual and devotional purposes and should not be treated as a substitute for medical, legal, financial, psychological, or other professional advice.</p>
          </SectionCard>

          {/* 14. Communications and Notifications */}
          <SectionCard number="14" title="Communications and Notifications">
            <p>By using the Platform, you consent to receive service-related communications from us through:</p>
            <ul className="space-y-1.5 mt-2">
              <Bullet>call,</Bullet>
              <Bullet>SMS,</Bullet>
              <Bullet>WhatsApp,</Bullet>
              <Bullet>push notifications,</Bullet>
              <Bullet>email,</Bullet>
              <Bullet>in-app messages.</Bullet>
            </ul>
            <p className="mt-3">These may include:</p>
            <ul className="space-y-1.5 mt-2">
              <Bullet>OTPs,</Bullet>
              <Bullet>booking confirmations,</Bullet>
              <Bullet>reminders,</Bullet>
              <Bullet>updates,</Bullet>
              <Bullet>cancellations/rescheduling notices,</Bullet>
              <Bullet>payment receipts,</Bullet>
              <Bullet>support responses,</Bullet>
              <Bullet>promotional offers where permitted.</Bullet>
            </ul>
            <p className="mt-3">You can opt out of promotional communications where applicable, but essential service communications may still be sent.</p>
          </SectionCard>

          {/* 15. Reviews, Ratings, and User Content */}
          <SectionCard number="15" title="Reviews, Ratings, and User Content">
            <p>If you post ratings, reviews, feedback, images, or other content on the Platform, you agree that:</p>
            <ul className="space-y-1.5 mt-2">
              <Bullet>the content is accurate to the best of your knowledge,</Bullet>
              <Bullet>it does not violate any law or third-party rights,</Bullet>
              <Bullet>it is not defamatory, obscene, abusive, hateful, misleading, or fraudulent,</Bullet>
              <Bullet>it does not contain malware, spam, or unauthorized advertising.</Bullet>
            </ul>
            <p className="mt-3">You grant us a non-exclusive, royalty-free, worldwide right to use, reproduce, display, adapt, and publish such content for operating, promoting, and improving the Platform, subject to applicable law and our Privacy Policy.</p>
            <p className="mt-2">We may remove or moderate content at our discretion.</p>
          </SectionCard>

          {/* 16. Prohibited Activities */}
          <SectionCard number="16" title="Prohibited Activities">
            <p>You must not:</p>
            <ul className="space-y-1.5 mt-2">
              <Bullet>use the Platform for unlawful, fraudulent, abusive, or unauthorized purposes,</Bullet>
              <Bullet>create fake accounts or impersonate another person,</Bullet>
              <Bullet>share false or misleading booking details,</Bullet>
              <Bullet>interfere with payments, pricing, or service coordination,</Bullet>
              <Bullet>harass or threaten pandits, users, or staff,</Bullet>
              <Bullet>solicit direct/off-platform dealings in a manner intended to avoid platform charges where prohibited,</Bullet>
              <Bullet>upload harmful code or attempt to disrupt the Platform,</Bullet>
              <Bullet>scrape, copy, reverse engineer, or misuse Platform content, software, APIs, or systems,</Bullet>
              <Bullet>use bots or automated tools without written permission,</Bullet>
              <Bullet>attempt unauthorized access to any account, system, or data.</Bullet>
            </ul>
            <p className="mt-3">We may investigate violations and take action including cancellation, suspension, termination, reporting to authorities, and legal claims.</p>
          </SectionCard>

          {/* 17. Intellectual Property */}
          <SectionCard number="17" title="Intellectual Property">
            <p>All rights, title, and interest in the Platform, including its text, design, software, logos, graphics, branding, content, interfaces, databases, and other materials, are owned by or licensed to Vedic Vaibhav Dot Com Pvt Ltd and are protected under applicable intellectual property laws.</p>
            <p className="mt-2">You may not copy, reproduce, republish, transmit, modify, distribute, exploit, or create derivative works from any Platform material without our prior written consent, except as permitted by law.</p>
          </SectionCard>

          {/* 18. Third-Party Services and Links */}
          <SectionCard number="18" title="Third-Party Services and Links">
            <p>The Platform may integrate or link to third-party tools and services, including payment gateways, maps, messaging tools, analytics, and notification providers.</p>
            <p className="mt-2">Your use of such third-party services may also be governed by their own terms and privacy policies. We are not responsible for third-party services except as required by law.</p>
          </SectionCard>

          {/* 19. Suspension, Restriction, and Termination */}
          <SectionCard number="19" title="Suspension, Restriction, and Termination">
            <p>We may suspend, restrict, cancel bookings, limit features, or terminate your account/access immediately if we reasonably believe that:</p>
            <ul className="space-y-1.5 mt-2">
              <Bullet>you violated these Terms,</Bullet>
              <Bullet>you committed fraud or misuse,</Bullet>
              <Bullet>you caused payment disputes or chargeback abuse,</Bullet>
              <Bullet>your conduct is unsafe, abusive, or harmful,</Bullet>
              <Bullet>your actions expose us, our users, or service providers to risk or liability,</Bullet>
              <Bullet>continued access is not in the interest of Platform integrity or legal compliance.</Bullet>
            </ul>
            <p className="mt-3">Termination does not affect rights or obligations that accrued before termination, including payment obligations.</p>
          </SectionCard>

          {/* 20. Disclaimer of Warranties */}
          <SectionCard number="20" title="Disclaimer of Warranties">
            <p>To the maximum extent permitted by law, the Platform and services are provided on an "as is" and "as available" basis.</p>
            <p className="mt-2">We do not warrant that:</p>
            <ul className="space-y-1.5 mt-2">
              <Bullet>the Platform will always be uninterrupted, secure, or error-free,</Bullet>
              <Bullet>all defects will be corrected immediately,</Bullet>
              <Bullet>the Platform will always be available at all times or in all locations,</Bullet>
              <Bullet>the service will meet every personal expectation,</Bullet>
              <Bullet>results or outcomes from any spiritual service will be guaranteed.</Bullet>
            </ul>
            <p className="mt-3">Delays, downtime, external outages, payment failures, network interruptions, weather issues, festival overload, or third-party service failures may affect the Platform or service delivery.</p>
          </SectionCard>

          {/* 21. Limitation of Liability */}
          <SectionCard number="21" title="Limitation of Liability">
            <p>To the fullest extent permitted by law, Vedic Vaibhav Dot Com Pvt Ltd, its directors, officers, employees, affiliates, and platform partners shall not be liable for any indirect, incidental, special, exemplary, punitive, or consequential damages, including loss of profit, loss of data, goodwill loss, emotional distress, or business interruption arising from or related to:</p>
            <ul className="space-y-1.5 mt-2">
              <Bullet>use of or inability to use the Platform,</Bullet>
              <Bullet>service delays or rescheduling,</Bullet>
              <Bullet>acts or omissions of independent service providers,</Bullet>
              <Bullet>user-provided incorrect information,</Bullet>
              <Bullet>unauthorized account use due to your negligence,</Bullet>
              <Bullet>third-party payment or communication failures,</Bullet>
              <Bullet>spiritual or religious expectations not being met.</Bullet>
            </ul>
            <p className="mt-3">Our aggregate liability arising out of any claim relating to a specific booking shall not exceed the amount actually paid by you to us for that specific booking, except where a higher liability is required under applicable law.</p>
            <p className="mt-2">Nothing in these Terms excludes liability that cannot legally be excluded.</p>
          </SectionCard>

          {/* 22. Indemnity */}
          <SectionCard number="22" title="Indemnity">
            <p>You agree to indemnify, defend, and hold harmless Vedic Vaibhav Dot Com Pvt Ltd, its affiliates, directors, employees, officers, agents, and partners from and against any claims, losses, damages, liabilities, penalties, costs, and expenses, including reasonable legal fees, arising out of or relating to:</p>
            <ul className="space-y-1.5 mt-2">
              <Bullet>your breach of these Terms,</Bullet>
              <Bullet>your misuse of the Platform,</Bullet>
              <Bullet>your violation of any law or third-party rights,</Bullet>
              <Bullet>false information submitted by you,</Bullet>
              <Bullet>disputes caused by your conduct, location access, or service instructions.</Bullet>
            </ul>
          </SectionCard>

          {/* 23. Privacy and Data Protection */}
          <SectionCard number="23" title="Privacy and Data Protection">
            <p>Your use of the Platform is also governed by our Privacy Policy, which explains how we collect, use, disclose, and protect personal data, including payment-related metadata, support communications, device information, and push notification data.</p>
            <p className="mt-2">By using the Platform, you acknowledge that your information may be processed in accordance with the Privacy Policy.</p>
          </SectionCard>

          {/* 24. Force Majeure */}
          <SectionCard number="24" title="Force Majeure">
            <p>We shall not be liable for delay, interruption, failure, or cancellation caused by events beyond our reasonable control, including:</p>
            <ul className="space-y-1.5 mt-2">
              <Bullet>natural disasters,</Bullet>
              <Bullet>floods, storms, earthquakes,</Bullet>
              <Bullet>strikes or labour issues,</Bullet>
              <Bullet>riots or civil disturbances,</Bullet>
              <Bullet>government restrictions,</Bullet>
              <Bullet>epidemic/pandemic events,</Bullet>
              <Bullet>transport disruption,</Bullet>
              <Bullet>network or payment outages,</Bullet>
              <Bullet>temple or local authority restrictions,</Bullet>
              <Bullet>safety threats or other force majeure events.</Bullet>
            </ul>
            <p className="mt-3">In such cases, bookings may be rescheduled, modified, or refunded at our discretion and subject to feasibility.</p>
          </SectionCard>

          {/* 25. Governing Law and Dispute Resolution */}
          <SectionCard number="25" title="Governing Law and Dispute Resolution">
            <p>These Terms shall be governed by and construed in accordance with the laws of India.</p>
            <p className="mt-2">If you have any complaint, grievance, or dispute, you should first contact us at:</p>
            <InfoBox>
              <p>📧 Email: panditjiatrequest@vedicvaibhav.com</p>
              <p>📞 Phone: +91 98727 88769</p>
            </InfoBox>
            <p className="mt-3">We will make reasonable efforts to address your concern.</p>
            <p className="mt-2">Subject to applicable law, courts located in Punjab, India shall have exclusive jurisdiction over disputes arising from or relating to these Terms and/or use of the Platform.</p>
          </SectionCard>

          {/* 26. Changes to These Terms */}
          <SectionCard number="26" title="Changes to These Terms">
            <p>We may update or modify these Terms from time to time. Revised Terms will be posted on the Platform with an updated "Last Updated" date.</p>
            <p className="mt-2">Your continued use of the Platform after such changes constitutes your acceptance of the revised Terms.</p>
          </SectionCard>

          {/* 27. Severability */}
          <SectionCard number="27" title="Severability">
            <p>If any provision of these Terms is held to be invalid, illegal, or unenforceable, the remaining provisions shall continue in full force and effect.</p>
          </SectionCard>

          {/* 28. Entire Agreement */}
          <SectionCard number="28" title="Entire Agreement">
            <p>These Terms, together with the Privacy Policy and any service-specific policies or booking terms displayed on the Platform, constitute the complete agreement between you and us regarding use of the Platform and supersede prior understandings on the same subject.</p>
          </SectionCard>

          {/* 29. Contact Information */}
          <SectionCard number="29" title="Contact Information">
            <p>For questions, support, legal notices, grievances, or concerns regarding these Terms:</p>
            <div className="mt-3">
              <InfoBox>
                <p className="font-semibold text-stone-800">Vedic Vaibhav Dot Com Pvt Ltd</p>
                <p>📧 Email: panditjiatrequest@vedicvaibhav.com</p>
                <p>📞 Phone: +91 98727 88769</p>
                <div className="pt-2 border-t border-orange-100">
                  <p className="font-semibold text-stone-800">Registered Office:</p>
                  <p>#1031 Tricity Trade Tower,</p>
                  <p>Patiala Zirakpur Road,</p>
                  <p>Zirakpur, Punjab, India</p>
                </div>
              </InfoBox>
            </div>
          </SectionCard>

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
