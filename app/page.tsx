'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { FileText, BarChart3, Share2, Zap } from 'lucide-react';
import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="gradient-bg text-white">
        {/* We'll remove the nav here since it's now in the Header component */}
        <div className="pt-20"></div>

        <div className="container mx-auto px-6 py-20 text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-5xl md:text-6xl font-bold mb-6 font-[family-name:var(--font-poppins)]"
          >
            Create Beautiful Forms
            <br />
            in Minutes
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-xl mb-8 max-w-2xl mx-auto opacity-90"
          >
            Build powerful forms, collect responses, and analyze results with our modern,
            intuitive form builder. Get started today.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Link href="/auth/login">
              <Button size="lg" variant="secondary" className="font-semibold">
                Get Started
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-6 py-20">
        <h3 className="text-3xl font-bold text-center mb-12 font-[family-name:var(--font-poppins)]">
          Everything you need to create amazing forms
        </h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="text-center"
            >
              <div className="gradient-bg w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <feature.icon className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-xl font-semibold mb-2">{feature.title}</h4>
              <p className="text-gray-600 dark:text-gray-400">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="gradient-bg text-white py-20">
        <div className="container mx-auto px-6 text-center">
          <h3 className="text-4xl font-bold mb-6 font-[family-name:var(--font-poppins)]">
            Ready to get started?
          </h3>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of users creating beautiful forms today.
          </p>
          <Link href="/auth/login">
            <Button size="lg" variant="secondary" className="font-semibold">
              Get Started
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-100 dark:bg-gray-900 py-8">
        <div className="container mx-auto px-6 text-center text-gray-600 dark:text-gray-400">
          <p>&copy; 2025 Ziya Forms. Built with Next.js, MySQL, and NextAuth.js</p>
        </div>
      </footer>
    </div>
  );
}

const features = [
  {
    icon: FileText,
    title: 'Easy Form Building',
    description: 'Drag and drop interface to create forms in minutes',
  },
  {
    icon: BarChart3,
    title: 'Analytics Dashboard',
    description: 'View responses and insights with beautiful charts',
  },
  {
    icon: Share2,
    title: 'Easy Sharing',
    description: 'Share forms with unique links and collect responses',
  },
  {
    icon: Zap,
    title: 'Real-time Updates',
    description: 'See responses as they come in with live updates',
  },
];