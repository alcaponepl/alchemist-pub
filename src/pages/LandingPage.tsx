import { Link } from 'react-router-dom'
import { TopBar } from '../components/layout/TopBar'
import { WindFarmPreview } from '../components/WindFarmPreview'
import { Eye, Brain, Zap, ArrowRight, Play, Github, Twitter, Linkedin, Wind } from 'lucide-react'

export const LandingPage = () => (
  <div className="landing">
    <TopBar />

    {/* HERO */}
    <section className="hero">
      <div className="hero__badge">
        <span className="hero__badge-dot" />
        <span className="hero__badge-text">// THE_NEW_ERA_OF_ENERGY_MANAGEMENT</span>
      </div>

      <h1 className="hero__headline">Take Full Control of Your Wind Farm</h1>

      <p className="hero__sub">
        Alchemist Industrial combines real-time 3D monitoring, predictive AI analytics, and autonomous turbine control — all in one dashboard.
      </p>

      <div className="hero__ctas">
        <Link to="/register" className="btn btn--primary-lg">
          Start Free Trial <ArrowRight size={18} />
        </Link>
        <Link to="/dashboard" className="btn btn--ghost-lg">
          <Play size={18} /> Watch Demo
        </Link>
      </div>

      <div className="hero__screenshot">
        <WindFarmPreview />
      </div>

      <div className="hero__trust">
        <span className="hero__trust-label">Trusted by:</span>
        <span className="hero__trust-logo">ENERGA</span>
        <span className="hero__trust-logo">PGE</span>
        <span className="hero__trust-logo">TAURON</span>
        <span className="hero__trust-logo">ORLEN</span>
        <span className="hero__trust-logo">IBERDROLA</span>
      </div>
    </section>

    {/* FEATURES */}
    <section className="section" id="features">
      <div className="section__header">
        <span className="section__label">// CORE_CAPABILITIES</span>
        <h2 className="section__title">Everything You Need to Manage Wind Energy</h2>
      </div>

      <div className="features-grid">
        <div className="card feature-card">
          <div className="feature-card__icon"><Eye size={24} /></div>
          <h3 className="feature-card__title">Real-Time 3D Monitoring</h3>
          <p className="feature-card__desc">
            WebGPU visualization of your wind farm with nanosecond precision. Every turbine, every parameter — live.
          </p>
        </div>
        <div className="card feature-card">
          <div className="feature-card__icon"><Brain size={24} /></div>
          <h3 className="feature-card__title">Predictive AI Analytics</h3>
          <p className="feature-card__desc">
            ML algorithms predict failures 72h in advance. 40% downtime reduction and real-time performance optimization.
          </p>
        </div>
        <div className="card feature-card">
          <div className="feature-card__icon"><Zap size={24} /></div>
          <h3 className="feature-card__title">Autonomous Control</h3>
          <p className="feature-card__desc">
            Automatic pitch control and yaw adjustment based on weather data. Maximum energy output with minimum wear.
          </p>
        </div>
      </div>
    </section>

    {/* HOW IT WORKS */}
    <section className="section section--elevated" id="steps">
      <div className="section__header">
        <span className="section__label">// HOW_IT_WORKS</span>
        <h2 className="section__title">From Installation to Full Autonomy in 3 Steps</h2>
      </div>

      <div className="steps-grid">
        <div className="card step-card" style={{ borderColor: '#00D4FF22' }}>
          <span className="step-card__number">01</span>
          <h3 className="step-card__title">IoT Integration</h3>
          <p className="step-card__desc">
            We connect sensors to your turbines. Compatible with Vestas, Siemens Gamesa, GE and more.
          </p>
        </div>
        <div className="card step-card">
          <span className="step-card__number">02</span>
          <h3 className="step-card__title">AI Calibration</h3>
          <p className="step-card__desc">
            The model learns the specifics of your farm — wind conditions, terrain and performance history.
          </p>
        </div>
        <div className="card step-card">
          <span className="step-card__number">03</span>
          <h3 className="step-card__title">Full Control</h3>
          <p className="step-card__desc">
            3D dashboard, predictive alerts and autonomous control — you gain a digital twin of your farm.
          </p>
        </div>
      </div>
    </section>

    {/* STATS */}
    <section className="section">
      <span className="section__label">// PROVEN_RESULTS</span>
      <div className="stats-grid">
        <div className="stat">
          <span className="stat__value">99.7%</span>
          <span className="stat__label">Turbine Uptime</span>
        </div>
        <div className="stat">
          <span className="stat__value">+40%</span>
          <span className="stat__label">Downtime Reduction</span>
        </div>
        <div className="stat">
          <span className="stat__value">72h</span>
          <span className="stat__label">Failure Prediction</span>
        </div>
        <div className="stat">
          <span className="stat__value">2.4 GW</span>
          <span className="stat__label">Managed Capacity</span>
        </div>
      </div>
    </section>

    {/* TESTIMONIAL */}
    <section className="testimonial">
      <span className="testimonial__quote-icon">"</span>
      <p className="testimonial__text">
        Alchemist transformed how we manage our Baltic Sea farm. Failure prediction saved us from a 2M EUR loss in the first quarter.
      </p>
      <div className="testimonial__author">
        <span className="testimonial__author-name">Marek Kowalski</span>
        <span className="testimonial__author-role">CTO, Baltic Wind Energy</span>
      </div>
    </section>

    {/* FINAL CTA */}
    <section className="final-cta">
      <span className="section__label">// READY_TO_START</span>
      <h2 className="final-cta__headline">Start Your Energy Transformation Today</h2>
      <p className="final-cta__sub">
        Schedule a 30-minute demo and see how Alchemist can optimize your wind farm.
      </p>
      <Link to="/register" className="btn btn--primary-lg">
        Book a Demo <ArrowRight size={18} />
      </Link>
      <span className="final-cta__trust">
        No commitment  •  Setup in 48h  •  Full technical support
      </span>
    </section>

    {/* FOOTER */}
    <footer className="footer">
      <div className="footer__top">
        <div className="footer__brand">
          <Link to="/" className="topbar__brand" style={{ display: 'inline-flex' }}>
            <div className="topbar__brand-icon"><Wind size={18} /></div>
            <span className="topbar__brand-text">ALCHEMIST</span>
          </Link>
          <p className="footer__brand-desc">
            Next-generation wind farm management powered by AI and real-time 3D digital twins.
          </p>
        </div>

        <div className="footer__col">
          <span className="footer__col-title">// Product</span>
          <Link to="/dashboard" className="footer__col-link">Dashboard</Link>
          <Link to="/#features" className="footer__col-link">Features</Link>
          <a href="#" className="footer__col-link">Pricing</a>
          <a href="#" className="footer__col-link">API Docs</a>
        </div>

        <div className="footer__col">
          <span className="footer__col-title">// Company</span>
          <a href="#" className="footer__col-link">About</a>
          <a href="#" className="footer__col-link">Blog</a>
          <a href="#" className="footer__col-link">Careers</a>
          <a href="#" className="footer__col-link">Contact</a>
        </div>

        <div className="footer__col">
          <span className="footer__col-title">// Legal</span>
          <a href="#" className="footer__col-link">Privacy</a>
          <a href="#" className="footer__col-link">Terms</a>
          <a href="#" className="footer__col-link">Cookie Policy</a>
        </div>
      </div>

      <div className="footer__bottom">
        <span className="footer__copyright">© 2026 Alchemist Industrial. All rights reserved.</span>
        <div className="footer__social">
          <a href="#"><Github size={16} /></a>
          <a href="#"><Twitter size={16} /></a>
          <a href="#"><Linkedin size={16} /></a>
        </div>
      </div>
    </footer>
  </div>
)
