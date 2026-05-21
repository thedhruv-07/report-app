// frontend/src/dashboards/inspector/onboarding/steps/Step1Manual.jsx
import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Zap, Users, ClipboardCheck, Shield, Mail, Building2, Globe, Award } from 'lucide-react';
import { ENDPOINTS } from '../../../../config/api';
import { useAuth } from '../../../../context/AuthContext';

const MANUAL_SECTIONS = [
  {
    id: 'welcome',
    title: 'Welcome to Absolute Veritas',
    icon: Zap,
    content: (
      <p className="text-slate-700 leading-relaxed">
        We are delighted to welcome you as a certified inspector at Absolute Veritas. Our mission is to provide world-class pre-shipment inspection services that protect our clients' supply chains and uphold the highest standards of quality assurance. As an inspector, you are the frontline guardian of that mission.
      </p>
    ),
  },
  {
    id: 'company',
    title: 'About Absolute Veritas',
    icon: Building2,
    content: (
      <div className="space-y-4">
        <div>
          <h4 className="font-bold text-slate-900 mb-2">Company Overview</h4>
          <p className="text-slate-700 leading-relaxed mb-4">
            Absolute Veritas is a leading inspection, audit, and sourcing services provider with 15+ years of industry experience and 2,500+ satisfied clients across Asia. We specialize in quality control and compliance management for global supply chains.
          </p>
        </div>
        <div>
          <h4 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
            <Globe className="w-4 h-4 text-blue-900" />
            Regional Coverage
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {['India', 'China', 'Vietnam', 'Thailand', 'Bangladesh', 'Pakistan', 'Cambodia', 'Korea', 'Sri Lanka', 'Malaysia', 'Indonesia', 'Taiwan'].map(country => (
              <span key={country} className="text-sm bg-blue-50 text-blue-900 px-3 py-1.5 rounded-md font-medium">
                {country}
              </span>
            ))}
          </div>
        </div>
        <div>
          <h4 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
            <Award className="w-4 h-4 text-orange-600" />
            Why We Stand Out
          </h4>
          <ul className="space-y-2">
            {[
              'Fast & Efficient: Deploy inspectors within 48 hours, reports within 24 hours',
              'Extensive Coverage: Operations across 12 countries for real-time coordination',
              'Standardized & Tailored: AQL standards with customized protocols for each client',
              'Clear Reporting: Photo documentation and expert actionable insights',
              'Ethical & Responsible: Social audits and comprehensive compliance checks',
            ].map((item, idx) => (
              <li key={idx} className="flex gap-3 text-slate-700 text-sm">
                <span className="text-orange-600 font-bold">✓</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-900">
            <span className="font-semibold">Contact Us:</span> info@av-inspec.com | +91-7303215033 | 31A Molar Band Extension, South Delhi, India
          </p>
        </div>
      </div>
    ),
  },
  {
    id: 'role',
    title: 'Your Role & Responsibilities',
    icon: Users,
    content: (
      <ul className="space-y-3">
        {[
          'Conduct thorough, unbiased inspections at supplier facilities',
          'Document findings accurately using the IRMS Report App',
          'Submit final reports within 24 hours of inspection completion',
          'Escalate critical safety defects to your supervisor immediately',
          'Maintain professional conduct at all supplier sites at all times',
          'Protect client confidentiality and inspection findings',
        ].map((item, idx) => (
          <li key={idx} className="flex gap-3 text-slate-700">
            <div className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-blue-900 mt-2" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    ),
  },
  {
    id: 'types',
    title: 'Overview of Inspection Types',
    icon: ClipboardCheck,
    content: (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { type: 'PSI — Pre-Shipment Inspection', desc: 'Conducted when 100% of production is complete and at least 80% is packed. Verifies product quality, quantity, and carton markings against the purchase order.' },
          { type: 'CLS — Container Loading Survey', desc: 'Supervised loading of goods into shipping containers. Ensures correct quantities, loading patterns, and container conditions.' },
          { type: 'DPI — During Production Inspection', desc: 'Mid-production check at 20–40% completion. Catches quality issues early before they affect the full batch.' },
          { type: 'Factory Audit', desc: "Comprehensive assessment of a supplier's manufacturing capabilities, quality management systems, and social compliance." },
          { type: 'Social Audit', desc: 'Evaluates supplier compliance with labour standards, worker safety, and ethical business practices.' },
        ].map(item => (
          <motion.div
            key={item.type}
            className="bg-white rounded-lg p-4 border border-slate-300 hover:border-blue-400 transition-colors shadow-sm"
            whileHover={{ y: -2 }}
          >
            <p className="font-semibold text-slate-900 text-sm mb-2">{item.type}</p>
            <p className="text-slate-600 text-sm leading-relaxed">{item.desc}</p>
          </motion.div>
        ))}
      </div>
    ),
  },
  {
    id: 'guidelines',
    title: 'Reporting Guidelines & Deadlines',
    icon: CheckCircle2,
    content: (
      <ul className="space-y-3">
        {[
          'All reports must be submitted via the IRMS platform — no external communication of results',
          'Deadline: final report within 24 hours of inspection end time',
          'Photos must be clear, well-lit, and directly relevant to the findings',
          'Defect descriptions must use objective, factual language',
          'Never share inspection results directly with the factory or supplier',
        ].map((item, idx) => (
          <li key={idx} className="flex gap-3 text-slate-700">
            <div className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-blue-600 mt-2" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    ),
  },
  {
    id: 'conduct',
    title: 'Code of Conduct',
    icon: Shield,
    content: (
      <ul className="space-y-3">
        {[
          'Decline all gifts, hospitality, or inducements from suppliers',
          'Maintain complete impartiality — your findings must reflect reality',
          'Dress professionally and arrive punctually for all assignments',
          'Report any conflicts of interest to management before accepting an assignment',
          'Report misconduct by colleagues through the appropriate channels immediately',
        ].map((item, idx) => (
          <li key={idx} className="flex gap-3 text-slate-700">
            <div className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-orange-600 mt-2" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    ),
  },
  {
    id: 'contact',
    title: 'Contact Information',
    icon: Mail,
    content: (
      <div className="bg-blue-900 rounded-lg p-6 text-white space-y-4">
        <div>
          <p className="text-sm font-semibold text-blue-100 mb-1">Operations Support</p>
          <p className="text-base font-medium">cs@absoluteveritas.com</p>
        </div>
        <div>
          <p className="text-sm font-semibold text-blue-100 mb-1">Emergency Escalations</p>
          <p className="text-base font-medium">Contact your assigned Technical Manager</p>
        </div>
        <div>
          <p className="text-sm font-semibold text-blue-100 mb-1">Platform Support</p>
          <p className="text-base font-medium">Available through the Settings page in IRMS</p>
        </div>
      </div>
    ),
  },
];

export default function Step1Manual({ onComplete }) {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const scrollRef = useRef(null);
  const [activeSection, setActiveSection] = useState('welcome');

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    const progress = (scrollTop / (scrollHeight - clientHeight)) * 100;
    setScrollProgress(Math.min(progress, 100));
  };

  const handleSectionClick = (sectionId) => {
    setActiveSection(sectionId);
    const element = scrollRef.current?.querySelector(`[data-section="${sectionId}"]`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleConfirm = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(ENDPOINTS.ONBOARDING.COMPLETE_STEP, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ step: 'manualRead' }),
      });
      if (!res.ok) throw new Error('Failed to save progress');
      await onComplete();
    } catch {
      setError('Failed to save progress. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      className="grid grid-cols-1 lg:grid-cols-4 gap-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Sticky Sidebar Navigation */}
      <div className="lg:col-span-1">
        <motion.div
          className="sticky top-6 bg-white border border-slate-300 rounded-lg shadow-sm overflow-hidden"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="p-4 border-b border-slate-300 bg-slate-50">
            <p className="text-sm font-semibold text-slate-900">Sections</p>
          </div>
          <nav className="p-3 space-y-1">
            {MANUAL_SECTIONS.map(section => {
              const IconComponent = section.icon;
              const isActive = activeSection === section.id;
              return (
                <motion.button
                  key={section.id}
                  onClick={() => handleSectionClick(section.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-blue-100 text-blue-900 border border-blue-300'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                  whileHover={{ x: 4 }}
                >
                  <IconComponent className="w-4 h-4 flex-shrink-0" />
                  <span className="text-left text-xs truncate">{section.title}</span>
                </motion.button>
              );
            })}
          </nav>
        </motion.div>
      </div>

      {/* Main Content Area */}
      <div className="lg:col-span-3">
        {/* Scroll Progress Bar */}
        <motion.div
          className="h-0.5 bg-slate-300 rounded-full mb-6 origin-left"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: scrollProgress / 100 }}
          transition={{ duration: 0.3 }}
        />

        {/* Content Card */}
        <motion.div
          className="bg-white border border-slate-300 rounded-lg shadow-sm overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          {/* Header */}
          <div className="bg-blue-900 px-8 py-8">
            <h2 className="text-2xl font-bold text-white">Inspector User Manual</h2>
            <p className="text-blue-100 mt-2">Please review all sections carefully</p>
          </div>

          {/* Scrollable Content */}
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="max-h-[65vh] overflow-y-auto custom-scrollbar"
          >
            <div className="p-8 space-y-12">
              {MANUAL_SECTIONS.map((section, idx) => {
                const IconComponent = section.icon;
                return (
                  <motion.section
                    key={section.id}
                    data-section={section.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-100px' }}
                    transition={{ duration: 0.4 }}
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2.5 bg-slate-100 rounded-lg">
                        <IconComponent className="w-5 h-5 text-blue-900" />
                      </div>
                      <h3 className="text-xl font-bold text-slate-900">{section.title}</h3>
                    </div>
                    <div className="ml-11 text-slate-700 leading-relaxed text-base">
                      {section.content}
                    </div>
                    {idx < MANUAL_SECTIONS.length - 1 && (
                      <div className="mt-8 pt-8 border-t border-slate-200" />
                    )}
                  </motion.section>
                );
              })}
            </div>
          </div>

          {/* Footer with CTA */}
          <motion.div
            className="px-8 py-6 border-t border-slate-300 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-4 sticky bottom-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            {error && (
              <motion.p
                className="text-rose-600 text-sm font-medium"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
              >
                ❌ {error}
              </motion.p>
            )}
            {!error && (
              <p className="text-xs text-slate-500 font-medium">
                📖 Scroll through the manual to understand your role
              </p>
            )}
            <motion.button
              onClick={handleConfirm}
              disabled={loading}
              className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold px-8 py-3 rounded-lg transition-colors duration-200 disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  I Have Read & Understood
                </>
              )}
            </motion.button>
          </motion.div>
        </motion.div>
      </div>

      {/* Custom scrollbar styles */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #1F4B7B;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #162e48;
        }
      `}</style>
    </motion.div>
  );
}
