import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'

const Navbar = () => {

  const NavItems = [
    { label: 'Home', path: '/' },
    { label: 'About', path: '/about' },
  ]

  const navigate = useNavigate()

  const handleGetStarted = () => {
    navigate('/auth')
  }

  return (
    <nav className='fixed top-0 z-50 w-full pt-3 px-4'>
      <div className='max-w-5xl mx-auto h-14 px-6
                      flex justify-between items-center
                      bg-[#13161f]/80 backdrop-blur-md
                      border border-white/10 rounded-2xl
                      shadow-xl shadow-black/30'>

        {/* Brand */}
        <div className='flex items-center gap-2.5'>
          <div className='w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600
                          flex items-center justify-center text-white font-black text-sm'>Q</div>
          <span className='font-bold text-lg gradient-text'>Qiral</span>
        </div>

        {/* Nav Links */}
        <div className='flex items-center gap-1'>
          {NavItems.map((navLink, index) => (
            <NavLink
              key={index}
              to={navLink.path}
              end={navLink.path === '/'}
              className={({ isActive }) =>
                `px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-indigo-600/20 text-indigo-300'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                }`
              }
            >
              {navLink.label}
            </NavLink>
          ))}
        </div>

        {/* CTA */}
        <button
          onClick={handleGetStarted}
          className='btn-primary text-sm'
        >
          Get Started
        </button>
      </div>
    </nav>
  )
}

export default Navbar