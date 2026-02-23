import { Link } from 'react-router-dom'
import { Wind, Mail, Lock, ArrowRight } from 'lucide-react'
import { WindFarmPreview } from '../components/WindFarmPreview'

export const Login = () => (
  <div className="auth-page">
    <div className="auth-page__visual">
      <div className="auth-page__visual-bg">
        <WindFarmPreview />
      </div>
      <div className="auth-page__visual-overlay" />
      <div className="auth-page__visual-quote">
        <p className="auth-page__visual-quote-text">
          "The platform that redefined how we manage offshore wind energy."
        </p>
        <span className="auth-page__visual-quote-author">
          — Marek Kowalski, CTO at Baltic Wind Energy
        </span>
      </div>
    </div>

    <div className="auth-page__form">
      <div className="auth-page__header">
        <Link to="/" className="topbar__brand" style={{ display: 'inline-flex' }}>
          <div className="topbar__brand-icon"><Wind size={18} /></div>
          <span className="topbar__brand-text">ALCHEMIST</span>
        </Link>
        <h1 className="auth-page__title">Welcome back</h1>
        <p className="auth-page__subtitle">Sign in to your dashboard</p>
      </div>

      <div className="auth-page__fields">
        <div className="form-field">
          <label className="form-field__label">EMAIL</label>
          <div className="form-field__input-wrap">
            <Mail size={18} />
            <input type="email" className="form-field__input" placeholder="Enter your email" />
          </div>
        </div>

        <div className="form-field">
          <label className="form-field__label">PASSWORD</label>
          <div className="form-field__input-wrap">
            <Lock size={18} />
            <input type="password" className="form-field__input" placeholder="Enter your password" />
          </div>
        </div>

        <div className="auth-page__forgot">
          <a href="#">Forgot password?</a>
        </div>
      </div>

      <div className="auth-page__actions">
        <button className="auth-page__submit">
          Sign In <ArrowRight size={18} />
        </button>

        <div className="auth-page__divider">
          <span className="auth-page__divider-line" />
          <span className="auth-page__divider-text">OR</span>
          <span className="auth-page__divider-line" />
        </div>

        <div className="auth-page__social">
          <button className="auth-page__social-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>
            Google
          </button>
          <button className="auth-page__social-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M11.4 24H0V12.6C0 5.7 5.7 0 12.6 0H24v11.4C24 18.3 18.3 24 11.4 24zM8.8 10.8V17h2.4v-6.2h1.8l.3-2.4h-2.1V7.1c0-.7.2-1.1 1.1-1.1H13.4V3.8c-.3 0-1.2-.1-2.2-.1-2.2 0-3.7 1.3-3.7 3.8v1.8H5.7v2.4h1.8V17" /></svg>
            Microsoft
          </button>
        </div>

        <div className="auth-page__switch">
          <span className="auth-page__switch-text">Don't have an account?</span>
          <Link to="/register" className="auth-page__switch-link">Create one</Link>
        </div>
      </div>
    </div>
  </div>
)
