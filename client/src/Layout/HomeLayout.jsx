import React from 'react'
import { useNavigate } from 'react-router-dom'

const HomeLayout = () => {
  const navigate = useNavigate()

  const stats = [
    { value: '10x', label: 'Faster insights' },
    { value: '< 1s', label: 'Query generation' },
    { value: '3+', label: 'DB engines supported' },
    { value: '100%', label: 'Secure & encrypted' },
  ]

  const steps = [
    { step: '01', title: 'Connect your database', desc: 'Register any MySQL, PostgreSQL or MSSQL database in seconds.' },
    { step: '02', title: 'Ask in plain English', desc: 'Type your question naturally — Qiral converts it to SQL automatically.' },
    { step: '03', title: 'Get instant results', desc: 'See your data in a beautiful table, ready to copy or explore.' },
  ]

  return (
    <div className='min-h-screen bg-[#0f1117] text-gray-100'>

      {/* Background blobs */}
      <div className='fixed inset-0 overflow-hidden pointer-events-none'>
        <div className='absolute -top-60 -left-60 w-[800px] h-[800px] bg-indigo-600/5 rounded-full blur-3xl' />
        <div className='absolute -bottom-60 -right-60 w-[800px] h-[800px] bg-purple-600/5 rounded-full blur-3xl' />
      </div>

      <div className='relative z-10'>

        {/* ── Hero ── */}
        <section className='max-w-4xl mx-auto px-6 pt-40 pb-20 text-center'>

          <div className='inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-xs font-medium mb-8 fade-up'>
            ✨ Natural Language → SQL, Magically.
          </div>

          <h1 className='text-5xl md:text-6xl font-extrabold leading-tight mb-6 fade-up'>
            Simplify your<br />
            <span className='gradient-text'>database operations.</span>
          </h1>

          <p className='text-gray-400 text-xl max-w-2xl mx-auto mb-10 fade-up'>
            Ask questions in plain English. Qiral converts them to optimized SQL and returns live results —
            no query expertise needed.
          </p>

          <div className='flex justify-center gap-4 fade-up'>
            <button onClick={() => navigate('/auth')} className='btn-primary px-8 py-3 text-base pulse-ring'>
              Get Started Free
            </button>
          </div>
        </section>

        {/* ── Stats ── */}
        <section className='max-w-4xl mx-auto px-6 pb-20'>
          <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
            {stats.map((s, i) => (
              <div key={i} className='glass p-5 text-center fade-up hover:bg-white/10 transition-all duration-300'>
                <div className='text-3xl font-extrabold gradient-text mb-1'>{s.value}</div>
                <div className='text-gray-500 text-xs'>{s.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── How it works ── */}
        <section className='max-w-4xl mx-auto px-6 pb-24'>
          <h2 className='text-2xl font-bold text-center text-gray-100 mb-10'>How it works</h2>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
            {steps.map((s, i) => (
              <div key={i} className='glass p-6 fade-up hover:bg-white/10 transition-all duration-300'>
                <div className='text-4xl font-black gradient-text mb-3'>{s.step}</div>
                <h3 className='text-lg font-semibold text-gray-100 mb-2'>{s.title}</h3>
                <p className='text-gray-400 text-sm leading-relaxed'>{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── CTA Banner ── */}
        <section className='max-w-4xl mx-auto px-6 pb-24'>
          <div className='glass p-10 text-center fade-up border-indigo-500/20 bg-gradient-to-br from-indigo-600/10 to-purple-600/10'>
            <h2 className='text-3xl font-bold text-gray-100 mb-3'>Ready to query smarter?</h2>
            <p className='text-gray-400 mb-7'>Join teams already using Qiral to unlock their data.</p>
            <button onClick={() => navigate('/auth')} className='btn-primary px-10 py-3 text-base'>
              Create Free Account
            </button>
          </div>
        </section>

      </div>
    </div>
  )
}

export default HomeLayout