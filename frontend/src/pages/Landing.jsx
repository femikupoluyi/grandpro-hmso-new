import { Link } from 'react-router-dom';
import {
  BuildingOffice2Icon,
  HeartIcon,
  UserGroupIcon,
  ChartBarIcon,
  ShieldCheckIcon,
  SparklesIcon,
  ArrowRightIcon,
  CheckIcon
} from '@heroicons/react/24/outline';

const Landing = () => {
  const features = [
    {
      icon: BuildingOffice2Icon,
      title: 'Hospital Network',
      description: 'Join our growing network of 500+ healthcare providers across Nigeria'
    },
    {
      icon: HeartIcon,
      title: 'Quality Care',
      description: 'Deliver exceptional healthcare services with our support and resources'
    },
    {
      icon: ChartBarIcon,
      title: 'Revenue Growth',
      description: 'Increase your hospital revenue by up to 40% through our partnership'
    },
    {
      icon: UserGroupIcon,
      title: 'Patient Access',
      description: 'Access to millions of patients through our integrated platform'
    },
    {
      icon: ShieldCheckIcon,
      title: 'Compliance Support',
      description: 'Stay compliant with regulatory requirements with our guidance'
    },
    {
      icon: SparklesIcon,
      title: 'Technology',
      description: 'Modern hospital management system and digital tools'
    }
  ];

  const benefits = [
    'Automated patient management system',
    'Electronic medical records (EMR)',
    'Integrated billing and insurance claims',
    'Real-time analytics and reporting',
    'Staff training and development',
    'Marketing and patient acquisition support',
    'Quality improvement programs',
    '24/7 technical support'
  ];

  const stats = [
    { value: '500+', label: 'Partner Hospitals' },
    { value: '2M+', label: 'Patients Served' },
    { value: '₦5B+', label: 'Revenue Processed' },
    { value: '98%', label: 'Partner Satisfaction' }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-blue-600 to-blue-800 text-white">
        <div className="max-w-7xl mx-auto px-4 py-24">
          <div className="text-center">
            <h1 className="text-5xl font-bold mb-6">
              Welcome to GrandPro HMSO
            </h1>
            <p className="text-xl mb-8 text-blue-100">
              Nigeria's Leading Hospital Management Service Organization
            </p>
            <p className="text-lg mb-12 max-w-3xl mx-auto text-blue-50">
              Partner with us to transform your healthcare facility into a modern,
              efficient, and profitable institution while delivering exceptional patient care.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/onboarding/apply"
                className="inline-flex items-center px-8 py-4 bg-white text-blue-600 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                Apply as Hospital Partner
                <ArrowRightIcon className="ml-2 h-5 w-5" />
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center px-8 py-4 bg-blue-700 text-white rounded-lg font-semibold hover:bg-blue-600 transition-colors"
              >
                Existing Partner Login
              </Link>
            </div>
          </div>
        </div>

        {/* Wave SVG */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0V120Z"
              fill="white"
            />
          </svg>
        </div>
      </div>

      {/* Stats Section */}
      <div className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl font-bold text-blue-600 mb-2">
                  {stat.value}
                </div>
                <div className="text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Why Partner with GrandPro HMSO?
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              We provide comprehensive support to help your hospital thrive in today's
              competitive healthcare landscape.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow"
                >
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Icon className="h-6 w-6 text-blue-600" />
                    </div>
                    <h3 className="ml-4 text-lg font-semibold text-gray-900">
                      {feature.title}
                    </h3>
                  </div>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Comprehensive Partnership Benefits
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                When you join the GrandPro HMSO network, you gain access to a complete
                suite of tools and services designed to modernize your operations and
                maximize your revenue potential.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-start">
                    <CheckIcon className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                    <span className="text-gray-700">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="bg-blue-600 rounded-lg p-8 text-white">
                <h3 className="text-2xl font-bold mb-4">
                  Ready to Transform Your Hospital?
                </h3>
                <p className="mb-6">
                  Join hundreds of successful healthcare providers who have partnered
                  with GrandPro HMSO to deliver better care and achieve sustainable growth.
                </p>
                <Link
                  to="/onboarding/apply"
                  className="inline-flex items-center px-6 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
                >
                  Start Application
                  <ArrowRightIcon className="ml-2 h-5 w-5" />
                </Link>
              </div>
              <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-blue-200 rounded-full opacity-50" />
              <div className="absolute -top-4 -left-4 w-24 h-24 bg-blue-300 rounded-full opacity-50" />
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-20 bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Start Your Partnership Journey Today
          </h2>
          <p className="text-lg mb-8 text-blue-100">
            The application process is simple and takes less than 15 minutes.
            Our team will guide you through every step.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/onboarding/apply"
              className="inline-flex items-center px-8 py-4 bg-white text-blue-600 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              Begin Application
              <ArrowRightIcon className="ml-2 h-5 w-5" />
            </Link>
            <a
              href="mailto:partnerships@grandprohmso.ng"
              className="inline-flex items-center px-8 py-4 bg-blue-700 text-white rounded-lg font-semibold hover:bg-blue-600 transition-colors"
            >
              Contact Sales Team
            </a>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-white font-semibold mb-4">GrandPro HMSO</h3>
              <p className="text-sm">
                Transforming healthcare delivery across Nigeria through strategic
                hospital partnerships.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/onboarding/apply" className="hover:text-white">Apply Now</Link></li>
                <li><Link to="/login" className="hover:text-white">Partner Login</Link></li>
                <li><Link to="/onboarding/status" className="hover:text-white">Application Status</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Contact</h4>
              <ul className="space-y-2 text-sm">
                <li>Email: info@grandprohmso.ng</li>
                <li>Phone: +234 801 234 5678</li>
                <li>Lagos, Nigeria</li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white">Partner Agreement</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-800 text-center text-sm">
            <p>&copy; 2025 GrandPro HMSO. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
