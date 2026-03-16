import React, { useState } from 'react';
import { GlassCard } from '@/components/ui/glass-card';
import { GlassButton } from '@/components/ui/glass-button';
import { GlassBadge } from '@/components/ui/glass-badge';
import GlassDashboardCard from '@/components/GlassDashboardCard';
import {
  GlassModal,
  GlassModalContent,
  GlassModalHeader,
  GlassModalTitle,
  GlassModalDescription,
  GlassModalTrigger,
  GlassModalCloseButton,
  GlassModalFooter,
} from '@/components/ui/glass-modal';
import { TrendingUp, BarChart3, Users, Package, AlertCircle } from 'lucide-react';

export default function GlassDashboard() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div
      className='min-h-screen w-full'
      style={{
        backgroundImage:
          'linear-gradient(135deg, #0f172a 0%, #1e1b4b 25%, #2d1b69 50%, #3d0f4a 75%, #4a0e4e 100%)',
      }}
    >
      {/* Animated background blobs */}
      <div className='absolute inset-0 opacity-20 pointer-events-none overflow-hidden'>
        <div className='absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob'></div>
        <div className='absolute top-1/3 right-1/4 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000'></div>
        <div className='absolute bottom-1/4 left-1/2 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000'></div>
      </div>

      <div className='relative z-10 container mx-auto px-4 py-8 max-w-7xl'>
        {/* Header */}
        <div className='mb-8'>
          <h1 className='text-4xl md:text-5xl font-bold text-white mb-2'>
            Glass Morphism
            <span className='text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-400'>
              {' '}
              Dashboard
            </span>
          </h1>
          <p className='text-gray-400'>
            Premium frosted glass design with real-time data analytics
          </p>
        </div>

        {/* Stats Grid */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8'>
          <GlassDashboardCard
            title='Total Revenue'
            value='₹24.5K'
            subtitle='This month'
            badge={{ label: '✓ Target Met', variant: 'success' }}
            trend={{ direction: 'up', value: 12, label: 'vs last month' }}
            progress={{ value: 85, label: 'Monthly Goal', color: 'green' }}
            neonAccent={true}
          />

          <GlassDashboardCard
            title='Active Users'
            value='1,248'
            subtitle='Online now'
            badge={{ label: '📈 Growing', variant: 'info' }}
            trend={{ direction: 'up', value: 8, label: 'this week' }}
            progress={{ value: 72, label: 'Capacity', color: 'blue' }}
          />

          <GlassDashboardCard
            title='Orders Processing'
            value='342'
            subtitle='In queue'
            badge={{ label: '⚠️ High', variant: 'warning' }}
            trend={{ direction: 'down', value: 3, label: 'from yesterday' }}
            progress={{ value: 65, label: 'Queue Full', color: 'yellow' }}
          />

          <GlassDashboardCard
            title='Failed Transactions'
            value='8'
            subtitle='This week'
            badge={{ label: '🚨 Alert', variant: 'destructive' }}
            trend={{ direction: 'down', value: 2, label: 'vs last week' }}
            progress={{ value: 15, label: 'Error Rate', color: 'red' }}
          />
        </div>

        {/* Main Content Grid */}
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8'>
          {/* Large Card - Revenue Chart Placeholder */}
          <GlassCard variant='premium' className='lg:col-span-2 h-80 p-6' neonAccent={true}>
            <div className='space-y-4 h-full flex flex-col'>
              <div>
                <h3 className='text-lg font-bold text-white'>Revenue Trend</h3>
                <p className='text-sm text-gray-400'>Last 7 days performance</p>
              </div>
              <div className='flex-1 flex items-end justify-between gap-2'>
                {[40, 60, 45, 75, 55, 70, 85].map((height, i) => (
                  <div key={i} className='flex-1 flex flex-col items-center gap-2'>
                    <div
                      className='w-full bg-gradient-to-t from-green-400 to-cyan-400 rounded-t-lg shadow-lg shadow-green-400/30'
                      style={{ height: `${height}%` }}
                    ></div>
                    <span className='text-xs text-gray-500'>Day {i + 1}</span>
                  </div>
                ))}
              </div>
            </div>
          </GlassCard>

          {/* Sidebar Stats */}
          <GlassCard variant='panel' className='h-80 p-6' glowEffect={true}>
            <div className='space-y-4'>
              <h3 className='text-lg font-bold text-white'>Quick Stats</h3>

              <div className='space-y-3'>
                <div className='flex justify-between items-center pb-3 border-b border-white/10'>
                  <span className='text-sm text-gray-400'>Conversion</span>
                  <span className='text-lg font-bold text-green-400'>3.2%</span>
                </div>

                <div className='flex justify-between items-center pb-3 border-b border-white/10'>
                  <span className='text-sm text-gray-400'>Bounce Rate</span>
                  <span className='text-lg font-bold text-red-400'>24.8%</span>
                </div>

                <div className='flex justify-between items-center pb-3 border-b border-white/10'>
                  <span className='text-sm text-gray-400'>Avg. Session</span>
                  <span className='text-lg font-bold text-yellow-400'>4m 32s</span>
                </div>

                <div className='flex justify-between items-center'>
                  <span className='text-sm text-gray-400'>Engagement</span>
                  <span className='text-lg font-bold text-blue-400'>78%</span>
                </div>
              </div>

              <GlassButton variant='secondary' className='w-full text-xs'>
                View Details
              </GlassButton>
            </div>
          </GlassCard>
        </div>

        {/* Actions & Modal Section */}
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6 mb-8'>
          <GlassCard variant='premium' className='p-6'>
            <div className='space-y-4'>
              <h3 className='text-lg font-bold text-white'>Quick Actions</h3>
              <div className='space-y-2'>
                <GlassButton variant='primary' className='w-full'>
                  Generate Report
                </GlassButton>
                <GlassButton variant='secondary' className='w-full'>
                  Export Data
                </GlassButton>
                <GlassModal open={isModalOpen} onOpenChange={setIsModalOpen}>
                  <GlassModalTrigger asChild>
                    <GlassButton variant='ghost' className='w-full'>
                      Open Settings
                    </GlassButton>
                  </GlassModalTrigger>
                  <GlassModalContent className='max-w-md'>
                    <GlassModalCloseButton />
                    <GlassModalHeader>
                      <GlassModalTitle>Dashboard Settings</GlassModalTitle>
                      <GlassModalDescription>
                        Customize your dashboard appearance and data preferences
                      </GlassModalDescription>
                    </GlassModalHeader>
                    <div className='space-y-4 py-4'>
                      <div className='space-y-2'>
                        <label className='text-sm text-white'>Refresh Rate</label>
                        <select className='glass-input-field w-full'>
                          <option>Every 5 seconds</option>
                          <option>Every 10 seconds</option>
                          <option>Every 30 seconds</option>
                          <option>Manual only</option>
                        </select>
                      </div>
                      <div className='space-y-2'>
                        <label className='text-sm text-white'>Theme</label>
                        <select className='glass-input-field w-full'>
                          <option>Dark (Default)</option>
                          <option>Dark Blue</option>
                          <option>Dark Purple</option>
                        </select>
                      </div>
                    </div>
                    <GlassModalFooter>
                      <GlassButton variant='secondary'>Cancel</GlassButton>
                      <GlassButton variant='primary'>Save</GlassButton>
                    </GlassModalFooter>
                  </GlassModalContent>
                </GlassModal>
              </div>
            </div>
          </GlassCard>

          <GlassCard variant='premium' className='p-6'>
            <div className='space-y-4'>
              <div className='flex items-center justify-between'>
                <h3 className='text-lg font-bold text-white'>Alerts</h3>
                <GlassBadge variant='destructive' size='sm'>
                  2 Active
                </GlassBadge>
              </div>
              <div className='space-y-2'>
                <div className='flex items-start gap-3 p-3 rounded-lg bg-red-400/10 border border-red-400/20'>
                  <AlertCircle className='h-5 w-5 text-red-400 mt-0.5 flex-shrink-0' />
                  <div>
                    <p className='text-sm font-semibold text-red-400'>High Error Rate</p>
                    <p className='text-xs text-gray-400 mt-1'>
                      Payment processing errors increased by 12%
                    </p>
                  </div>
                </div>
                <div className='flex items-start gap-3 p-3 rounded-lg bg-yellow-400/10 border border-yellow-400/20'>
                  <AlertCircle className='h-5 w-5 text-yellow-400 mt-0.5 flex-shrink-0' />
                  <div>
                    <p className='text-sm font-semibold text-yellow-400'>Queue Full</p>
                    <p className='text-xs text-gray-400 mt-1'>
                      Processing queue reached 95% capacity
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Footer Info */}
        <GlassCard variant='panel' className='p-6 text-center'>
          <p className='text-sm text-gray-400'>
            Last updated: {new Date().toLocaleTimeString()}
          </p>
          <p className='text-xs text-gray-500 mt-2'>
            Dashboard powered by Glass Morphism Design System
          </p>
        </GlassCard>
      </div>

      <style>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}
