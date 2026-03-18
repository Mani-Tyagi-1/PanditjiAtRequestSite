import React from 'react';
import { motion } from 'framer-motion';
import { ScrollText } from 'lucide-react';
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

const Bullet = ({ children }: { children: React.ReactNode }) => (
  <li className="flex items-start gap-2">
    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-orange-400 shrink-0" />
    <span>{children}</span>
  </li>
);

const InfoBox = ({ children }: { children: React.ReactNode }) => (
  <div className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-3 space-y-1">
    {children}
  </div>
);

const WarningBox = ({ children }: { children: React.ReactNode }) => (
  <div className="mt-3 flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
    <p className="text-amber-800">{children}</p>
  </div>
);

export default function TermsAndConditionPandit() {
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
                <ScrollText className="w-5 h-5" />
                <span className="text-sm font-medium">Partner Terms</span>
              </motion.div>
              <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-orange-600 via-amber-600 to-yellow-600 bg-clip-text text-transparent">
                Terms &amp; Conditions
              </h1>
              <p className="text-lg text-gray-700 font-medium">Pandit Ji : Pandit Ji At Req</p>
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
            <p className="font-bold text-orange-800 text-base">Terms &amp; Conditions – Pandit Ji : Pandit Ji At Req</p>
            <p>
              These Terms &amp; Conditions ("Terms") govern the access to and use of the Pandit Ji : Pandit Ji At Req mobile application, website, and related partner systems (collectively, the "Platform") operated by Vedic Vaibhav Dot Com Pvt Ltd ("Company", "we", "us", or "our").
            </p>
            <p>
              These Terms apply to pandits, priests, representatives, and other service partners ("Pandit", "Partner", "you") who use the Platform for onboarding, booking management, live tracking, communication, service fulfillment, and related activities.
            </p>
            <p>
              By registering, logging in, onboarding, accepting bookings, or otherwise using the Platform, you agree to be bound by these Terms and our Privacy Policy.
            </p>
            <p className="font-medium text-orange-700">If you do not agree with these Terms, you must not use the Platform.</p>
          </motion.div>

          {/* 1. Company Details */}
          <SectionCard number="1" title="Company Details">
            <InfoBox>
              <p><span className="font-medium text-stone-800">Company:</span> Vedic Vaibhav Dot Com Pvt Ltd</p>
              <p><span className="font-medium text-stone-800">Registered Office:</span> #1031 Tricity Trade Tower, Patiala Zirakpur Road, Zirakpur, Punjab, India</p>
              <p><span className="font-medium text-stone-800">Support Email:</span> panditjiatrequest@vedicvaibhav.com</p>
              <p><span className="font-medium text-stone-800">Phone:</span> +91 98727 88769</p>
            </InfoBox>
          </SectionCard>

          {/* 2. Definitions */}
          <SectionCard number="2" title="Definitions">
            <p>For the purpose of these Terms:</p>
            <ul className="space-y-2 mt-2">
              <Bullet><span className="font-medium">"Platform"</span> means the Pandit Ji : Pandit Ji At Req mobile app, website, admin systems, communication systems, and related tools.</Bullet>
              <Bullet><span className="font-medium">"Partner" / "Pandit"</span> means any priest, pandit, representative, or spiritual service provider using the Platform.</Bullet>
              <Bullet><span className="font-medium">"Devotee" / "Customer"</span> means any user who books or receives services through the consumer-side platform.</Bullet>
              <Bullet><span className="font-medium">"Booking"</span> means a service request assigned, accepted, scheduled, or completed through the Platform.</Bullet>
              <Bullet><span className="font-medium">"Company"</span> means Vedic Vaibhav Dot Com Pvt Ltd.</Bullet>
            </ul>
          </SectionCard>

          {/* 3. Nature of Relationship */}
          <SectionCard number="3" title="Nature of Relationship">
            <p>The Platform is a technology-enabled coordination platform that helps assign, manage, and monitor spiritual or ritual service bookings.</p>
            <p>Unless separately agreed in writing, your use of the Platform does not create an employer-employee relationship, agency, partnership, or joint venture with the Company.</p>
            <p>You act as an independent service provider and are responsible for the services you perform, subject to these Terms, applicable laws, and Platform standards.</p>
          </SectionCard>

          {/* 4. Eligibility */}
          <SectionCard number="4" title="Eligibility">
            <p>To register and use the Platform, you must:</p>
            <ul className="space-y-1.5 mt-2">
              <Bullet>be at least 18 years of age,</Bullet>
              <Bullet>have the legal capacity to enter into a binding arrangement,</Bullet>
              <Bullet>provide accurate and complete onboarding information,</Bullet>
              <Bullet>maintain a valid mobile number and required documents,</Bullet>
              <Bullet>comply with all applicable laws and Platform requirements.</Bullet>
            </ul>
            <p className="mt-3">The Company may refuse onboarding, restrict access, or suspend any account that does not satisfy eligibility requirements.</p>
          </SectionCard>

          {/* 5. Account Registration and OTP Responsibility */}
          <SectionCard number="5" title="Account Registration and OTP Responsibility">
            <p>You may be required to sign in or verify your account through mobile OTP or other approved authentication methods.</p>
            <p className="mt-2">You are responsible for:</p>
            <ul className="space-y-1.5 mt-1">
              <Bullet>keeping your account information accurate and updated,</Bullet>
              <Bullet>maintaining the confidentiality of OTPs and login access,</Bullet>
              <Bullet>ensuring that only you use your account,</Bullet>
              <Bullet>immediately reporting unauthorized access or suspicious use.</Bullet>
            </ul>
            <p className="mt-3">You must not share your account, OTP, or access credentials with any other person.</p>
            <p>Any activity carried out through your verified account may be treated as your activity unless proven otherwise.</p>
          </SectionCard>

          {/* 6. Onboarding and Verification */}
          <SectionCard number="6" title="Onboarding and Verification">
            <p>The Company may request onboarding information including, where applicable:</p>
            <ul className="space-y-1.5 mt-2">
              <Bullet>name,</Bullet>
              <Bullet>phone number,</Bullet>
              <Bullet>email,</Bullet>
              <Bullet>address,</Bullet>
              <Bullet>photo,</Bullet>
              <Bullet>service specializations,</Bullet>
              <Bullet>experience details,</Bullet>
              <Bullet>identity documents,</Bullet>
              <Bullet>bank or payout details,</Bullet>
              <Bullet>tax information,</Bullet>
              <Bullet>language preferences,</Bullet>
              <Bullet>certificates or related documents.</Bullet>
            </ul>
            <p className="mt-3">You agree that:</p>
            <ul className="space-y-1.5 mt-1">
              <Bullet>all information submitted by you is true, accurate, and current,</Bullet>
              <Bullet>forged, misleading, incomplete, or false information may lead to rejection, suspension, or permanent removal,</Bullet>
              <Bullet>the Company may verify submitted details internally or through third-party verification tools.</Bullet>
            </ul>
          </SectionCard>

          {/* 7. Booking Assignment and Acceptance */}
          <SectionCard number="7" title="Booking Assignment and Acceptance">
            <p>The Platform may assign, recommend, or display bookings to you based on factors including:</p>
            <ul className="space-y-1.5 mt-2">
              <Bullet>location,</Bullet>
              <Bullet>serviceability,</Bullet>
              <Bullet>specialization,</Bullet>
              <Bullet>language,</Bullet>
              <Bullet>availability,</Bullet>
              <Bullet>quality history,</Bullet>
              <Bullet>reliability,</Bullet>
              <Bullet>operational requirements.</Bullet>
            </ul>
            <p className="mt-3">You agree that:</p>
            <ul className="space-y-1.5 mt-1">
              <Bullet>a booking becomes binding once you accept it, unless cancelled as permitted by the Platform,</Bullet>
              <Bullet>you must review booking details carefully before acceptance,</Bullet>
              <Bullet>repeated delays, non-response, no-shows, or cancellations may affect booking allocation, account standing, incentives, payouts, or access to the Platform.</Bullet>
            </ul>
            <p className="mt-3">The Company does not guarantee a minimum number of bookings.</p>
          </SectionCard>

          {/* 8. Availability and Service Status */}
          <SectionCard number="8" title="Availability and Service Status">
            <p>You must accurately update your service status on the Platform, including:</p>
            <ul className="space-y-1.5 mt-2">
              <Bullet>available / unavailable,</Bullet>
              <Bullet>on-duty / off-duty,</Bullet>
              <Bullet>accepted / declined,</Bullet>
              <Bullet>arrived,</Bullet>
              <Bullet>service started,</Bullet>
              <Bullet>service completed,</Bullet>
              <Bullet>cancellation reason, where applicable.</Bullet>
            </ul>
            <WarningBox>False or misleading status updates may be treated as misconduct and may result in warnings, suspension, penalties, or termination.</WarningBox>
          </SectionCard>

          {/* 9. Background Location and Live Tracking */}
          <SectionCard number="9" title="Background Location and Live Tracking">
            <p>The Platform may request and use:</p>
            <ul className="space-y-1.5 mt-2">
              <Bullet>approximate location,</Bullet>
              <Bullet>precise location,</Bullet>
              <Bullet>background location.</Bullet>
            </ul>
            <p className="mt-3">By using the Platform and granting location permissions, you agree that your location may be used for:</p>
            <ul className="space-y-1.5 mt-1">
              <Bullet>active booking tracking,</Bullet>
              <Bullet>route progress,</Bullet>
              <Bullet>ETA calculation,</Bullet>
              <Bullet>arrival verification,</Bullet>
              <Bullet>devotee-facing service visibility,</Bullet>
              <Bullet>operational coordination,</Bullet>
              <Bullet>support monitoring,</Bullet>
              <Bullet>fraud detection,</Bullet>
              <Bullet>audit and quality checks.</Bullet>
            </ul>
            <p className="mt-3">Location may be collected even when the app is closed or not in active use, where required for an active booking, live service tracking, or operational coordination.</p>
            <p className="mt-2">You must not spoof, manipulate, falsify, block, or misrepresent your location data in connection with service delivery.</p>
            <p className="mt-2">If you deny location permissions, some features may not work correctly, and the Company may be unable to verify or assign certain bookings.</p>
          </SectionCard>

          {/* 10. Voice Calls, Video Calls, and Communication Features */}
          <SectionCard number="10" title="Voice Calls, Video Calls, and Communication Features">
            <p>The Platform may support:</p>
            <ul className="space-y-1.5 mt-2">
              <Bullet>app-based voice calls,</Bullet>
              <Bullet>video calls,</Bullet>
              <Bullet>incoming call alerts,</Bullet>
              <Bullet>push notifications,</Bullet>
              <Bullet>booking-related chat or communication tools.</Bullet>
            </ul>
            <p className="mt-3">You agree that such features may be used for lawful booking coordination, support, or service-related communication only.</p>
            <p className="mt-2">You must not use the Platform to:</p>
            <ul className="space-y-1.5 mt-1">
              <Bullet>harass, threaten, abuse, mislead, or intimidate,</Bullet>
              <Bullet>solicit unlawful activity,</Bullet>
              <Bullet>send obscene or sexual content,</Bullet>
              <Bullet>make discriminatory or hateful remarks,</Bullet>
              <Bullet>engage in inappropriate communication with devotees or staff.</Bullet>
            </ul>
            <p className="mt-3">The Company may review communication metadata, timestamps, complaint-linked records, or support interactions to investigate fraud, abuse, safety issues, or service disputes.</p>
          </SectionCard>

          {/* 11. Use of Device Features and Permissions */}
          <SectionCard number="11" title="Use of Device Features and Permissions">
            <p>Depending on app features, the Platform may request access to:</p>
            <ul className="space-y-1.5 mt-2">
              <Bullet>precise location,</Bullet>
              <Bullet>approximate location,</Bullet>
              <Bullet>background location,</Bullet>
              <Bullet>camera,</Bullet>
              <Bullet>microphone,</Bullet>
              <Bullet>notifications,</Bullet>
              <Bullet>phone / system-supported call handling permissions,</Bullet>
              <Bullet>files, media, or document upload permissions.</Bullet>
            </ul>
            <p className="mt-3">These permissions are used only for functions such as booking tracking, live service coordination, video calls, voice calls, incoming call UI, document uploads, verification, notification delivery, and operational monitoring.</p>
            <p className="mt-2">You agree not to misuse these features or use the Platform for non-service-related or prohibited purposes.</p>
          </SectionCard>

          {/* 12. Conduct Standards */}
          <SectionCard number="12" title="Conduct Standards">
            <p>You agree to:</p>
            <ul className="space-y-1.5 mt-2">
              <Bullet>behave respectfully with devotees, families, staff, support teams, and other partners,</Bullet>
              <Bullet>provide services professionally and in good faith,</Bullet>
              <Bullet>maintain appropriate personal conduct during service delivery,</Bullet>
              <Bullet>avoid abusive, threatening, discriminatory, or unlawful behavior,</Bullet>
              <Bullet>avoid intoxication, violence, or unsafe conduct during bookings,</Bullet>
              <Bullet>follow lawful and appropriate ritual/service practices,</Bullet>
              <Bullet>refrain from making false claims about qualifications, expertise, or identity.</Bullet>
            </ul>
            <p className="mt-3">You must not engage in:</p>
            <ul className="space-y-1.5 mt-1">
              <Bullet>fraud,</Bullet>
              <Bullet>black magic or prohibited unlawful services,</Bullet>
              <Bullet>coercion, extortion, or exploitation,</Bullet>
              <Bullet>harassment,</Bullet>
              <Bullet>religious hate or abusive conduct,</Bullet>
              <Bullet>fake completion of services,</Bullet>
              <Bullet>fake attendance or false status marking.</Bullet>
            </ul>
          </SectionCard>

          {/* 13. Devotee Data and Confidentiality */}
          <SectionCard number="13" title="Devotee Data and Confidentiality">
            <p>You may receive devotee/customer information such as:</p>
            <ul className="space-y-1.5 mt-2">
              <Bullet>name,</Bullet>
              <Bullet>contact number,</Bullet>
              <Bullet>address,</Bullet>
              <Bullet>booking details,</Bullet>
              <Bullet>location,</Bullet>
              <Bullet>service instructions,</Bullet>
              <Bullet>ritual-related information.</Bullet>
            </ul>
            <p className="mt-3">You may use such information only for fulfilling the assigned booking.</p>
            <p className="mt-2">You must not:</p>
            <ul className="space-y-1.5 mt-1">
              <Bullet>save or reuse devotee data for unrelated purposes,</Bullet>
              <Bullet>contact devotees outside what is necessary for the booking,</Bullet>
              <Bullet>share devotee details with third parties,</Bullet>
              <Bullet>misuse contact details,</Bullet>
              <Bullet>solicit direct future bookings off-platform where prohibited,</Bullet>
              <Bullet>copy or retain personal user information unnecessarily.</Bullet>
            </ul>
            <WarningBox>Any misuse of devotee data may result in immediate suspension, legal action, and permanent removal.</WarningBox>
          </SectionCard>

          {/* 14. Off-Platform Payments and Circumvention */}
          <SectionCard number="14" title="Off-Platform Payments and Circumvention">
            <p>Unless expressly permitted by the Company, you must not:</p>
            <ul className="space-y-1.5 mt-2">
              <Bullet>collect direct payment outside the Platform for Platform-generated bookings,</Bullet>
              <Bullet>ask devotees to cancel and rebook privately,</Bullet>
              <Bullet>redirect devotees to personal numbers, private payment links, or external channels to avoid Platform fees,</Bullet>
              <Bullet>alter booking values or completion records dishonestly.</Bullet>
            </ul>
            <p className="mt-3">Any circumvention of Platform processes may result in:</p>
            <ul className="space-y-1.5 mt-1">
              <Bullet>payout withholding,</Bullet>
              <Bullet>penalty,</Bullet>
              <Bullet>suspension,</Bullet>
              <Bullet>permanent termination,</Bullet>
              <Bullet>legal action where applicable.</Bullet>
            </ul>
          </SectionCard>

          {/* 15. Payouts, Fees, Deductions, and Taxes */}
          <SectionCard number="15" title="Payouts, Fees, Deductions, and Taxes">
            <p>The Company may process partner earnings based on its booking, commission, settlement, payout, refund, and dispute-handling rules.</p>
            <p className="mt-2">You agree that:</p>
            <ul className="space-y-1.5 mt-2">
              <Bullet>payouts may be subject to service completion verification,</Bullet>
              <Bullet>payout timing may vary due to banking, technical, compliance, or dispute issues,</Bullet>
              <Bullet>complaints, refunds, reversals, no-show findings, misconduct, or fraud investigations may affect payouts,</Bullet>
              <Bullet>you are responsible for your own taxes, returns, statutory filings, and legal compliance unless otherwise required by law,</Bullet>
              <Bullet>incorrect bank details or payout information provided by you may delay settlement.</Bullet>
            </ul>
            <p className="mt-3">The Company may apply deductions, reversals, or adjustments where justified under policy, error correction, refund handling, or misconduct review.</p>
          </SectionCard>

          {/* 16. Ratings, Reviews, Complaints, and Quality Monitoring */}
          <SectionCard number="16" title="Ratings, Reviews, Complaints, and Quality Monitoring">
            <p>The Company may collect and use:</p>
            <ul className="space-y-1.5 mt-2">
              <Bullet>user ratings,</Bullet>
              <Bullet>support complaints,</Bullet>
              <Bullet>dispute records,</Bullet>
              <Bullet>operational performance metrics,</Bullet>
              <Bullet>call-related support records,</Bullet>
              <Bullet>service audit outcomes,</Bullet>
              <Bullet>on-time arrival and completion data.</Bullet>
            </ul>
            <p className="mt-3">These may be used for:</p>
            <ul className="space-y-1.5 mt-1">
              <Bullet>service quality review,</Bullet>
              <Bullet>booking prioritization,</Bullet>
              <Bullet>partner ranking or reliability status within the Platform,</Bullet>
              <Bullet>training and guidance,</Bullet>
              <Bullet>warning, suspension, limitation, or removal,</Bullet>
              <Bullet>incentive or payout adjustments where applicable.</Bullet>
            </ul>
          </SectionCard>

          {/* 17. Profile, Content, and Display Information */}
          <SectionCard number="17" title="Profile, Content, and Display Information">
            <p>You grant the Company the right to use your:</p>
            <ul className="space-y-1.5 mt-2">
              <Bullet>name and display name,</Bullet>
              <Bullet>profile photo,</Bullet>
              <Bullet>language,</Bullet>
              <Bullet>service specialization,</Bullet>
              <Bullet>city/service area,</Bullet>
              <Bullet>professional profile details</Bullet>
            </ul>
            <p className="mt-3">within the Platform for booking coordination, listing, customer support, communication, and operational management.</p>
            <p className="mt-2">You must ensure that the information you submit does not infringe third-party rights and is not false or misleading.</p>
          </SectionCard>

          {/* 18. No Guarantee of Booking Volume or Income */}
          <SectionCard number="18" title="No Guarantee of Booking Volume or Income">
            <p>The Company does not guarantee:</p>
            <ul className="space-y-1.5 mt-2">
              <Bullet>any minimum number of bookings,</Bullet>
              <Bullet>any fixed level of income,</Bullet>
              <Bullet>uninterrupted availability of the Platform,</Bullet>
              <Bullet>any specific service area or customer volume,</Bullet>
              <Bullet>continuous demand or assignment frequency.</Bullet>
            </ul>
            <p className="mt-3">Booking volume may vary based on season, city, demand, competition, rating, operational needs, and other factors.</p>
          </SectionCard>

          {/* 19. Suspension, Restriction, and Termination */}
          <SectionCard number="19" title="Suspension, Restriction, and Termination">
            <p>The Company may suspend, restrict, or terminate your account immediately if it reasonably believes that:</p>
            <ul className="space-y-1.5 mt-2">
              <Bullet>you violated these Terms,</Bullet>
              <Bullet>you submitted false or misleading information,</Bullet>
              <Bullet>you manipulated bookings, status, payouts, or location,</Bullet>
              <Bullet>you engaged in fraud, abuse, harassment, or unsafe conduct,</Bullet>
              <Bullet>you misused devotee data,</Bullet>
              <Bullet>your actions create legal, reputational, operational, or safety risk,</Bullet>
              <Bullet>you repeatedly fail to fulfill bookings properly.</Bullet>
            </ul>
            <p className="mt-3">Termination may also result in:</p>
            <ul className="space-y-1.5 mt-1">
              <Bullet>cancellation of future assignments,</Bullet>
              <Bullet>withholding or review of pending settlements,</Bullet>
              <Bullet>permanent ban from the Platform,</Bullet>
              <Bullet>legal or regulatory escalation where required.</Bullet>
            </ul>
          </SectionCard>

          {/* 20. Intellectual Property */}
          <SectionCard number="20" title="Intellectual Property">
            <p>All rights in the Platform, including its software, design, branding, workflows, content, dashboards, interfaces, logos, systems, and communication flows belong to the Company or its licensors.</p>
            <p className="mt-2">You may not copy, reverse engineer, reproduce, distribute, modify, or commercially exploit any part of the Platform without prior written permission.</p>
          </SectionCard>

          {/* 21. Disclaimer */}
          <SectionCard number="21" title="Disclaimer">
            <p>The Platform is provided on an "as is" and "as available" basis.</p>
            <p className="mt-2">The Company does not guarantee:</p>
            <ul className="space-y-1.5 mt-1">
              <Bullet>uninterrupted Platform availability,</Bullet>
              <Bullet>error-free performance,</Bullet>
              <Bullet>uninterrupted voice/video/location services,</Bullet>
              <Bullet>device/network compatibility at all times,</Bullet>
              <Bullet>any specific customer outcome,</Bullet>
              <Bullet>any guaranteed earning result,</Bullet>
              <Bullet>any guaranteed number of bookings.</Bullet>
            </ul>
            <p className="mt-3">App features may be affected by network issues, GPS inaccuracies, device limitations, map provider errors, FCM delays, telecom issues, traffic, weather, force majeure, or third-party outages.</p>
          </SectionCard>

          {/* 22. Limitation of Liability */}
          <SectionCard number="22" title="Limitation of Liability">
            <p>To the fullest extent permitted by law, the Company shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising out of or related to:</p>
            <ul className="space-y-1.5 mt-2">
              <Bullet>app downtime,</Bullet>
              <Bullet>booking loss,</Bullet>
              <Bullet>third-party network or service failures,</Bullet>
              <Bullet>GPS or location inaccuracies,</Bullet>
              <Bullet>payment processor issues,</Bullet>
              <Bullet>incorrect data submitted by you,</Bullet>
              <Bullet>user complaints arising from your conduct,</Bullet>
              <Bullet>delay or interruption in communication tools,</Bullet>
              <Bullet>device or connectivity failure.</Bullet>
            </ul>
            <p className="mt-3">Nothing in these Terms limits liability where such limitation is not permitted by law.</p>
          </SectionCard>

          {/* 23. Indemnity */}
          <SectionCard number="23" title="Indemnity">
            <p>You agree to indemnify, defend, and hold harmless Vedic Vaibhav Dot Com Pvt Ltd, its directors, officers, employees, affiliates, staff, and agents from and against any claims, losses, liabilities, damages, costs, and expenses, including reasonable legal expenses, arising from:</p>
            <ul className="space-y-1.5 mt-2">
              <Bullet>your breach of these Terms,</Bullet>
              <Bullet>your conduct during or outside service delivery connected with the Platform,</Bullet>
              <Bullet>your misuse of devotee data,</Bullet>
              <Bullet>your violation of law or third-party rights,</Bullet>
              <Bullet>false, forged, or misleading documents or information submitted by you,</Bullet>
              <Bullet>disputes caused by your actions, statements, or omissions.</Bullet>
            </ul>
          </SectionCard>

          {/* 24. Privacy */}
          <SectionCard number="24" title="Privacy">
            <p>Your use of the Platform is also governed by the Privacy Policy for Pandit Ji : Pandit Ji At Req.</p>
            <p className="mt-2">By using the Platform, you consent to the collection, use, storage, and sharing of data as described in that Privacy Policy.</p>
          </SectionCard>

          {/* 25. Governing Law and Jurisdiction */}
          <SectionCard number="25" title="Governing Law and Jurisdiction">
            <p>These Terms shall be governed by and construed in accordance with the laws of India.</p>
            <p className="mt-2">Any dispute arising out of or relating to these Terms or your use of the Platform shall be subject to the jurisdiction of the competent courts in Punjab, India, unless otherwise required by applicable law.</p>
          </SectionCard>

          {/* 26. Changes to These Terms */}
          <SectionCard number="26" title="Changes to These Terms">
            <p>We may update or modify these Terms from time to time.</p>
            <p className="mt-2">Updated Terms will be posted on the Platform with a revised "Last Updated" date. Your continued use of the Platform after such update constitutes your acceptance of the revised Terms.</p>
          </SectionCard>

          {/* 27. Contact */}
          <SectionCard number="27" title="Contact">
            <p>For partner support, legal notices, complaints, or queries regarding these Terms:</p>
            <div className="mt-3 bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200 rounded-xl px-5 py-4 space-y-1.5">
              <p className="font-semibold text-stone-800">Vedic Vaibhav Dot Com Pvt Ltd</p>
              <InfoBox>
                <p>📧 Email: panditjiatrequest@vedicvaibhav.com</p>
                <p>📞 Phone: +91 98727 88769</p>
              </InfoBox>
              <div className="pt-2">
                <p className="font-semibold text-stone-800">Registered Office:</p>
                <p>#1031 Tricity Trade Tower,</p>
                <p>Patiala Zirakpur Road,</p>
                <p>Zirakpur, Punjab, India</p>
              </div>
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
