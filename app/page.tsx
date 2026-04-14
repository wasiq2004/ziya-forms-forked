'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { FileText, BarChart3, Share2, Zap, CheckCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[color:var(--background)] text-[color:var(--foreground)] transition-colors duration-300">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-12 lg:pt-32 lg:pb-24">
        <div className="absolute inset-0 bg-gradient-to-br from-[color:var(--primary)]/10 via-transparent to-[color:var(--accent-purple)]/10"></div>
        <div className="relative container mx-auto px-6">
          <div className="text-center max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[color:var(--primary)]/10 text-[color:var(--primary)] text-sm font-bold mb-8 border border-[color:var(--primary)]/20 shadow-sm"
            >
              <span className="w-2 h-2 bg-[color:var(--primary)] rounded-full animate-pulse"></span>
              Modern Forms, Redefined
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="text-6xl md:text-8xl font-black mb-8 leading-[0.9] tracking-tighter"
            >
              <span className="bg-gradient-to-r from-[color:var(--foreground)] via-[color:var(--primary)] to-[color:var(--accent-purple)] bg-clip-text text-transparent">
                Create Forms
              </span>
              <br />
              <span className="relative inline-block bg-gradient-to-r from-[color:var(--primary)] to-[color:var(--accent-purple)] bg-clip-text text-transparent mt-2">
                Like a Pro
                <div className="absolute -bottom-2 left-0 right-0 h-2 bg-gradient-to-r from-[color:var(--primary)] to-[color:var(--accent-purple)] rounded-full opacity-20 blur-sm"></div>
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="text-xl md:text-2xl text-[color:var(--muted-foreground)] mb-10 max-w-2xl mx-auto leading-relaxed font-medium"
            >
              The most powerful, beautifully designed form builder for the modern web.
              Fast, intuitive, and absolutely free to start.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="flex flex-col sm:flex-row gap-5 justify-center items-center"
            >
              <Link href="/auth/login">
                <Button size="lg" className="h-16 px-10 text-xl font-bold rounded-2xl shadow-[0_20px_50px_rgba(37,99,235,0.3)] hover:shadow-[0_25px_60px_rgba(37,99,235,0.4)] transition-all">
                  Get Started Free
                  <ArrowRight className="ml-3 w-6 h-6" />
                </Button>
              </Link>
              <Button variant="outline" size="lg" className="h-16 px-10 text-xl font-bold rounded-2xl border-2">
                Watch Demo
              </Button>
            </motion.div>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-1/4 -left-20 w-64 h-64 bg-[color:var(--primary)]/10 rounded-full blur-[100px] animate-pulse"></div>
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-[color:var(--accent-purple)]/10 rounded-full blur-[120px] animate-pulse delay-700"></div>
      </section>

      {/* Steps Section */}
      <section className="py-24 relative bg-[color:var(--card)]/30">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-12">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="relative group p-10 rounded-[2.5rem] bg-[color:var(--card)] border border-[color:var(--border)] shadow-xl hover:shadow-2xl transition-all hover:-translate-y-2 h-full"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-[color:var(--primary)] to-[color:var(--accent-purple)] rounded-2xl flex items-center justify-center mb-8 rotate-3 shadow-lg group-hover:rotate-0 transition-all duration-500">
                  <span className="text-2xl font-black text-white">{index + 1}</span>
                </div>
                <h3 className="text-2xl font-bold mb-4 text-[color:var(--foreground)] tracking-tight">
                  {step.title}
                </h3>
                <p className="text-[color:var(--muted-foreground)] text-lg leading-relaxed">
                  {step.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Bottom */}
      <section className="py-32">
        <div className="container mx-auto px-6">
          <div className="relative rounded-[3rem] overflow-hidden bg-gradient-to-r from-[color:var(--primary)] to-[color:var(--accent-purple)] p-12 md:p-24 text-center">
            <div className="absolute inset-0 bg-black/10 backdrop-blur-3xl"></div>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="relative z-10 max-w-3xl mx-auto"
            >
              <h2 className="text-4xl md:text-6xl font-black mb-8 text-white leading-tight">
                Stop Designing Forms.<br />Start Building Experiences.
              </h2>
              <p className="text-xl mb-12 text-blue-50 font-medium opacity-90 leading-relaxed">
                Join thousands of creators who transformed their data collection with Ziya Forms.
              </p>
              <Link href="/auth/login">
                <Button size="lg" variant="secondary" className="h-16 px-12 text-xl font-bold rounded-2xl bg-white text-blue-600 hover:bg-blue-50 shadow-2xl">
                  Create Your First Form
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 border-t border-[color:var(--border)] bg-[color:var(--background)]">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-12 mb-16">
            <div className="md:col-span-2">
              <h3 className="text-3xl font-black tracking-tighter text-[color:var(--foreground)] mb-6">Ziya Forms</h3>
              <p className="text-[color:var(--muted-foreground)] text-lg mb-8 max-w-md">
                Beautiful, fast, and secure form builder for businesses that care about design.
              </p>
            </div>
            <div>
              <h4 className="font-bold text-[color:var(--foreground)] mb-6 uppercase tracking-widest text-sm">Products</h4>
              <ul className="space-y-4 text-[color:var(--muted-foreground)]">
                <li><Link href="https://ziyasuite.com" className="hover:text-[color:var(--primary)] transition-colors">Ziya Voice</Link></li>
                <li><Link href="#" className="hover:text-[color:var(--primary)] transition-colors">Ziya CRM</Link></li>
                <li><Link href="#" className="hover:text-[color:var(--primary)] transition-colors">Ziya Ads</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-[color:var(--foreground)] mb-6 uppercase tracking-widest text-sm">Company</h4>
              <ul className="space-y-4 text-[color:var(--muted-foreground)]">
                <li><Link href="#" className="hover:text-[color:var(--primary)] transition-colors">About Us</Link></li>
                <li><Link href="#" className="hover:text-[color:var(--primary)] transition-colors">Contact</Link></li>
                <li><Link href="#" className="hover:text-[color:var(--primary)] transition-colors">Terms</Link></li>
              </ul>
            </div>
          </div>
          <div className="pt-12 border-t border-[color:var(--border)] text-center text-[color:var(--muted-foreground)] font-medium">
            <p>&copy; 2026 Ziya Forms. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

const steps = [
  {
    title: 'Design Visually',
    description: 'Add components, customize styles, and watch your form come to life in our real-time editor.',
  },
  {
    title: 'Share Anywhere',
    description: 'Get a unique link or embed the form directly into your site with a single line of code.',
  },
  {
    title: 'Insightful Data',
    description: 'Analyze responses with beautiful charts, export to CSV, or sync with your favorite CRM.',
  },
];
