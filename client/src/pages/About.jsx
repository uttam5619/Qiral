import React from 'react'

const About = () => {
  const features = [
    { icon: '⚡', title: 'Instant Results', desc: 'Turn plain English into optimized SQL in milliseconds, no expertise required.' },
    { icon: '🔐', title: 'Enterprise Security', desc: 'AES-256-GCM encrypted credentials, JWT rotation, and per-org multi-tenancy.' },
    { icon: '🗄️', title: 'Multi-DB Support', desc: 'MySQL, PostgreSQL, and MSSQL support with automatic schema introspection.' },
    { icon: '👥', title: 'Team Roles', desc: 'Fine-grained RBAC — Admin, Engineer, Analyst, and Viewer permissions out of the box.' },
  ]

  return (
    <div className='min-h-screen pt-24 pb-16 px-6 bg-[#0f1117]'>
      <div className='max-w-4xl mx-auto'>

        {/* Hero */}
        <div className='text-center mb-16 fade-up'>
          <div className='inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-xs font-medium mb-6'>
            🚀 Our Mission
          </div>
          <h1 className='text-4xl md:text-5xl font-bold text-gray-100 mb-4 leading-tight'>
            We're making databases<br />
            <span className='gradient-text'>speak human.</span>
          </h1>
          <p className='text-gray-400 text-lg max-w-2xl mx-auto'>
            Qiral was built to eliminate the gap between business questions and database answers.
            Anyone on your team can now query data — no SQL degree required.
          </p>
        </div>

        {/* Feature Grid */}
        <div className='grid grid-cols-1 md:grid-cols-2 gap-5 mb-16'>
          {features.map((f, i) => (
            <div key={i} className='glass p-6 fade-up hover:bg-white/10 transition-all duration-300'>
              <div className='text-3xl mb-3'>{f.icon}</div>
              <h3 className='text-lg font-semibold text-gray-100 mb-2'>{f.title}</h3>
              <p className='text-gray-400 text-sm leading-relaxed'>{f.desc}</p>
            </div>
          ))}
        </div>

        {/* Story */}
        <div className='glass p-8 fade-up'>
          <h2 className='text-2xl font-bold text-gray-100 mb-4'>The Story</h2>
          <p className='text-gray-400 leading-relaxed mb-4'>
            Qiral started as a frustration. Every analyst had to wait for an engineer to write a query.
            Every business question turned into a 3-day data request cycle. We knew there had to be a better way.
          </p>
          <p className='text-gray-400 leading-relaxed'>
            By combining state-of-the-art LLMs with a secure, multi-tenant backend, we've built a platform
            where your team can ask questions like "Show me last quarter's top customers" and get live SQL results
            — instantly, accurately, and securely.
          </p>
        </div>
      </div>
    </div>
  )
}

export default About