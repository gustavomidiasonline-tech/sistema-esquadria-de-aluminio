import { GlassCard } from '@/components/ui/glass-card';
import { GlassButton } from '@/components/ui/glass-button';

export default function GlassDesignShowcase() {
  return (
    <div
      className='min-h-screen w-full overflow-hidden'
      style={{
        backgroundImage:
          'linear-gradient(135deg, #0f172a 0%, #1e1b4b 25%, #2d1b69 50%, #3d0f4a 75%, #4a0e4e 100%)',
      }}
    >
      <div className='absolute inset-0 opacity-30 pointer-events-none'>
        <div className='absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl'></div>
        <div className='absolute top-1/3 right-1/4 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl'></div>
        <div className='absolute bottom-1/4 left-1/2 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl'></div>
      </div>

      <div className='relative z-10 container mx-auto px-4 py-12'>
        {/* Header */}
        <div className='text-center mb-16'>
          <h1 className='text-4xl md:text-5xl font-bold text-white mb-4'>
            Glass Morphism
            <span className='text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-400'>
              {' '}
              Design System
            </span>
          </h1>
          <p className='text-white/70 text-lg'>
            Premium frosted glass effects with neon accents
          </p>
        </div>

        {/* Cards Grid */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12'>
          {/* Card 1: Premium */}
          <GlassCard variant='premium' neonAccent={true}>
            <div className='space-y-4'>
              <div className='h-3 bg-gradient-to-r from-green-400 to-cyan-400 rounded-full'></div>
              <h3 className='text-xl font-bold text-white'>Premium Card</h3>
              <p className='text-white/70 text-sm'>
                High-quality glass effect with blur and transparency
              </p>
              <GlassButton variant='secondary' className='w-full text-sm'>
                Learn More
              </GlassButton>
            </div>
          </GlassCard>

          {/* Card 2: Stat */}
          <GlassCard variant='stat'>
            <div className='space-y-3'>
              <div className='text-3xl font-bold text-green-400'>₹2.4K</div>
              <p className='text-white/40'>Total Revenue</p>
              <div className='h-2 bg-white/10 rounded-full overflow-hidden'>
                <div
                  className='h-full bg-gradient-to-r from-yellow-400 to-green-400'
                  style={{ width: '75%' }}
                ></div>
              </div>
              <p className='text-xs text-white/40'>↑ 12% this month</p>
            </div>
          </GlassCard>

          {/* Card 3: Feature */}
          <GlassCard variant='premium' glowEffect={true}>
            <div className='space-y-4'>
              <div className='inline-block px-3 py-1 rounded-full text-xs font-semibold bg-green-400/20 text-green-400 border border-green-400/40'>
                Featured
              </div>
              <h3 className='text-xl font-bold text-white'>Advanced Effects</h3>
              <p className='text-white/70 text-sm'>
                Glow effects, neon accents, and smooth transitions
              </p>
            </div>
          </GlassCard>

          {/* Card 4: Dark Panel */}
          <GlassCard variant='panel'>
            <div className='p-6 space-y-4'>
              <h4 className='text-lg font-bold text-white'>Dark Panel</h4>
              <div className='space-y-2'>
                <div className='h-2 bg-white/20 rounded w-3/4'></div>
                <div className='h-2 bg-white/20 rounded w-1/2'></div>
              </div>
            </div>
          </GlassCard>

          {/* Card 5: Input Demo */}
          <GlassCard variant='input' className='p-4'>
            <input
              type='text'
              placeholder='Enter your text here...'
              className='w-full bg-transparent text-white placeholder-gray-500 outline-none'
            />
          </GlassCard>

          {/* Card 6: Badge Showcase */}
          <GlassCard variant='premium'>
            <div className='space-y-3'>
              <span className='glass-badge-neon'>✓ Verified</span>
              <span className='glass-badge-neon ml-2'>🚀 Active</span>
              <p className='text-white/40 text-sm mt-4'>
                Neon badges with glow effects
              </p>
            </div>
          </GlassCard>
        </div>

        {/* Buttons Section */}
        <div className='mb-12'>
          <h2 className='text-2xl font-bold text-white mb-6'>Buttons & Controls</h2>
          <div className='flex flex-wrap gap-4'>
            <GlassButton variant='primary'>Primary Action</GlassButton>
            <GlassButton variant='secondary'>Secondary Action</GlassButton>
            <GlassButton variant='ghost'>Ghost Button</GlassButton>
            <GlassButton variant='primary' size='lg'>
              Large Button
            </GlassButton>
            <GlassButton variant='primary' size='sm'>
              Small
            </GlassButton>
          </div>
        </div>

        {/* Color Palette */}
        <GlassCard variant='panel' className='p-8'>
          <h2 className='text-2xl font-bold text-white mb-6'>Neon Palette</h2>
          <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
            {[
              { name: 'Neon Green', color: '#00ff88' },
              { name: 'Neon Yellow', color: '#ffd700' },
              { name: 'Neon Cyan', color: '#00d9ff' },
              { name: 'Neon Pink', color: '#ff006e' },
            ].map((item) => (
              <div key={item.name} className='space-y-2'>
                <div
                  className='h-20 rounded-lg shadow-lg'
                  style={{
                    backgroundColor: item.color,
                    boxShadow: `0 0 20px ${item.color}50`,
                  }}
                ></div>
                <p className='text-xs text-white/40'>{item.name}</p>
                <code className='text-xs text-white/50'>{item.color}</code>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
