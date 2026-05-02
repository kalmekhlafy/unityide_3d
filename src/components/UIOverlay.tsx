import { motion } from 'framer-motion'
import { Shield, Play, ArrowRight, Users, Lock, Zap } from 'lucide-react'

export function UIOverlay() {
  return (
    <div className="overlay-container">
      {/* Header */}
      <nav className="header">
        <div className="logo">
          <Shield className="logo-icon" size={24} />
          <span>Unity<span className="logo-ide">IDE</span></span>
        </div>
        <div className="nav-links">
          <a href="#features">Features</a>
          <a href="#security">Security</a>
          <a href="#pricing">Pricing</a>
        </div>
        <button className="btn-primary">
          Start Free <ArrowRight size={16} />
        </button>
      </nav>

      {/* Hero Content */}
      <main className="hero">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="hero-content"
        >
          <div className="badge">
            <span className="ping"></span>
            PHP 8.3 IDE · Now Live
          </div>
          <h1>
            Secure Your Code.<br />
            <span className="grad-text">Unify</span> Your Team.
          </h1>
          <p>
            The only IDE platform that vaults your source code while enabling
            seamless team collaboration. Upload, assign sections, and ship under military-grade encryption.
          </p>
          <div className="cta-group">
            <button className="btn-primary lg">
              <Lock size={18} /> Start Free Trial
            </button>
            <button className="btn-ghost lg">
              <Play size={18} /> See the IDE
            </button>
          </div>
        </motion.div>

        {/* Stats */}
        <div className="stats">
          <div className="stat">
            <span className="n">2.3K+</span>
            <span className="l">Dev Teams</span>
          </div>
          <div className="stat">
            <span className="n">18M+</span>
            <span className="l">Lines Vaulted</span>
          </div>
          <div className="stat">
            <span className="n">99.98%</span>
            <span className="l">Uptime</span>
          </div>
        </div>
      </main>

      <style>{`
        .overlay-container {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          display: flex;
          flex-direction: column;
          z-index: 10;
          color: white;
        }

        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 2rem 4rem;
          pointer-events: auto;
        }

        .logo {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-weight: 700;
          font-size: 1.5rem;
          letter-spacing: -0.02em;
        }
        .logo-icon { color: #00f2ff; }
        .logo-ide { color: #7000ff; }

        .nav-links {
          display: flex;
          gap: 2rem;
        }
        .nav-links a {
          color: rgba(255,255,255,0.6);
          text-decoration: none;
          font-size: 0.9rem;
          transition: color 0.2s;
        }
        .nav-links a:hover { color: white; }

        .hero {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 0 4rem;
          max-width: 600px;
        }

        .badge {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: rgba(112, 0, 255, 0.1);
          border: 1px solid rgba(112, 0, 255, 0.3);
          padding: 0.4rem 1rem;
          border-radius: 100px;
          font-size: 0.8rem;
          color: #b88fff;
          margin-bottom: 2rem;
          width: fit-content;
        }
        .ping {
          width: 6px;
          height: 6px;
          background: #7000ff;
          border-radius: 50%;
          box-shadow: 0 0 10px #7000ff;
        }

        h1 {
          font-size: 4rem;
          line-height: 1.1;
          margin: 0 0 1.5rem 0;
          letter-spacing: -0.03em;
        }
        .grad-text {
          background: linear-gradient(90deg, #00f2ff, #7000ff);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        p {
          color: rgba(255,255,255,0.6);
          font-size: 1.1rem;
          line-height: 1.6;
          margin-bottom: 2.5rem;
        }

        .cta-group {
          display: flex;
          gap: 1rem;
          pointer-events: auto;
        }

        .btn-primary {
          background: #00f2ff;
          color: black;
          border: none;
          padding: 0.8rem 1.5rem;
          border-radius: 8px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
          transition: transform 0.2s, background 0.2s;
        }
        .btn-primary:hover {
          transform: translateY(-2px);
          background: #00d9e6;
        }
        .btn-primary.lg { padding: 1rem 2rem; font-size: 1rem; }

        .btn-ghost {
          background: rgba(255,255,255,0.05);
          color: white;
          border: 1px solid rgba(255,255,255,0.1);
          padding: 0.8rem 1.5rem;
          border-radius: 8px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
          transition: background 0.2s;
        }
        .btn-ghost:hover { background: rgba(255,255,255,0.1); }
        .btn-ghost.lg { padding: 1rem 2rem; font-size: 1rem; }

        .stats {
          position: absolute;
          bottom: 4rem;
          left: 4rem;
          display: flex;
          gap: 3rem;
        }
        .stat { display: flex; flex-direction: column; }
        .stat .n { font-size: 1.5rem; font-weight: 700; color: #00f2ff; }
        .stat .l { font-size: 0.8rem; color: rgba(255,255,255,0.4); text-transform: uppercase; letter-spacing: 0.1em; }
      `}</style>
    </div>
  )
}
