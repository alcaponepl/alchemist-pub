import { Link } from 'react-router-dom'
import { Wind, Menu, X, Bell, Settings } from 'lucide-react'
import { useState } from 'react'

type Props = {
  variant?: 'default' | 'transparent' | 'settings'
}

export const TopBar = ({ variant = 'default' }: Props) => {
  const [mobileOpen, setMobileOpen] = useState(false)

  const isLanding = variant === 'default' || variant === 'transparent'

  return (
    <>
      <header className={`topbar ${variant === 'transparent' ? 'topbar--transparent' : ''}`}>
        <Link to="/" className="topbar__brand">
          <div className="topbar__brand-icon">
            <Wind />
          </div>
          <span className="topbar__brand-text">ALCHEMIST</span>
        </Link>

        {isLanding && (
          <nav className="topbar__nav">
            <Link to="/#features" className="topbar__nav-link">Platform</Link>
            <Link to="/#features" className="topbar__nav-link">Features</Link>
            <Link to="/#steps" className="topbar__nav-link">Case Studies</Link>
            <Link to="/#pricing" className="topbar__nav-link">Pricing</Link>
            <Link to="/login" className="btn btn--primary">
              Sign In
            </Link>
          </nav>
        )}

        {variant === 'settings' && (
          <div className="topbar__right">
            <button className="topbar__icon-btn"><Bell size={20} /></button>
            <Link to="/settings" className="topbar__icon-btn"><Settings size={20} /></Link>
            <div className="topbar__avatar">
              <div className="topbar__avatar-circle" />
              <span className="topbar__avatar-name">Marek Kowalski</span>
            </div>
          </div>
        )}

        <button className="topbar__hamburger" onClick={() => setMobileOpen(true)}>
          <Menu size={24} />
        </button>
      </header>

      <div className={`mobile-nav-overlay ${mobileOpen ? 'mobile-nav-overlay--open' : ''}`}>
        <button className="mobile-nav-overlay__close" onClick={() => setMobileOpen(false)}>
          <X size={28} />
        </button>
        <Link to="/" className="mobile-nav-overlay__link" onClick={() => setMobileOpen(false)}>Home</Link>
        <Link to="/dashboard" className="mobile-nav-overlay__link" onClick={() => setMobileOpen(false)}>Dashboard</Link>
        <Link to="/settings" className="mobile-nav-overlay__link" onClick={() => setMobileOpen(false)}>Settings</Link>
        <Link to="/login" className="mobile-nav-overlay__link" onClick={() => setMobileOpen(false)}>Sign In</Link>
        <Link to="/register" className="mobile-nav-overlay__link" onClick={() => setMobileOpen(false)}>Register</Link>
      </div>
    </>
  )
}
