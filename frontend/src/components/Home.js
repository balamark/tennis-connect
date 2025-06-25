import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './Home.css';

const Home = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const features = [
    {
      icon: '🎾',
      title: t('home.features.findPartners.title'),
      description: t('home.features.findPartners.description'),
      action: t('home.features.findPartners.action'),
      path: '/nearby-players'
    },
    {
      icon: '🏟️',
      title: t('home.features.bookCourts.title'),
      description: t('home.features.bookCourts.description'),
      action: t('home.features.bookCourts.action'),
      path: '/book-court'
    },
    {
      icon: '📋',
      title: t('home.features.playBulletin.title'),
      description: t('home.features.playBulletin.description'),
      action: t('home.features.playBulletin.action'),
      path: '/play-bulletin'
    },
    {
      icon: '🏆',
      title: t('home.features.joinEvents.title'),
      description: t('home.features.joinEvents.description'),
      action: t('home.features.joinEvents.action'),
      path: '/events'
    },
    {
      icon: '👥',
      title: t('home.features.communities.title'),
      description: t('home.features.communities.description'),
      action: t('home.features.communities.action'),
      path: '/communities'
    },
    {
      icon: '📍',
      title: t('home.features.courtFinder.title'),
      description: t('home.features.courtFinder.description'),
      action: t('home.features.courtFinder.action'),
      path: '/court-finder'
    }
  ];

  const handleFeatureClick = (path) => {
    navigate(path);
  };

  return (
    <div className="home-container">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h1>{t('home.welcome')}</h1>
          <p className="hero-subtitle">
            {t('home.subtitle')}
          </p>
          <div className="hero-stats">
            <div className="stat-item">
              <span className="stat-number">1,000+</span>
              <span className="stat-label">{t('home.stats.activePlayers')}</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">50+</span>
              <span className="stat-label">{t('home.stats.tennisCourts')}</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">200+</span>
              <span className="stat-label">{t('home.stats.matchesMade')}</span>
            </div>
          </div>
          <button 
            className="cta-button"
            onClick={() => navigate('/nearby-players')}
          >
            {t('home.cta')}
          </button>
        </div>
        <div className="hero-visual">
          <div className="tennis-court-graphic">
            <div className="court-lines">
              <div className="baseline"></div>
              <div className="service-line"></div>
              <div className="center-line"></div>
              <div className="net"></div>
            </div>
            <div className="tennis-ball">🎾</div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="how-it-works">
        <h2>{t('home.howItWorks.title')}</h2>
        <div className="steps-container">
          <div className="step">
            <div className="step-number">1</div>
            <div className="step-content">
              <h3>{t('home.howItWorks.step1.title')}</h3>
              <p>{t('home.howItWorks.step1.description')}</p>
            </div>
          </div>
          <div className="step">
            <div className="step-number">2</div>
            <div className="step-content">
              <h3>{t('home.howItWorks.step2.title')}</h3>
              <p>{t('home.howItWorks.step2.description')}</p>
            </div>
          </div>
          <div className="step">
            <div className="step-number">3</div>
            <div className="step-content">
              <h3>{t('home.howItWorks.step3.title')}</h3>
              <p>{t('home.howItWorks.step3.description')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="features-section">
        <h2>{t('home.features.title')}</h2>
        <div className="features-grid">
          {features.map((feature, index) => (
            <div key={index} className="feature-card">
              <div className="feature-icon">{feature.icon}</div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
              <button 
                className="feature-button"
                onClick={() => handleFeatureClick(feature.path)}
              >
                {feature.action}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Quick Start Guide */}
      <section className="quick-start">
        <h2>Quick Start Guide</h2>
        <div className="guide-cards">
          <div className="guide-card">
            <div className="guide-icon">🔍</div>
            <h3>New to Tennis?</h3>
            <p>Start by finding beginner-friendly players and courts in your area. Use our skill level filters to connect with players at your level.</p>
            <button onClick={() => navigate('/nearby-players')}>Find Beginners</button>
          </div>
          <div className="guide-card">
            <div className="guide-icon">⚡</div>
            <h3>Looking for a Quick Game?</h3>
            <p>Check the Play Bulletin for immediate playing opportunities or post your own request for a hitting partner.</p>
            <button onClick={() => navigate('/play-bulletin')}>Quick Play</button>
          </div>
          <div className="guide-card">
            <div className="guide-icon">🏆</div>
            <h3>Competitive Player?</h3>
            <p>Join tournaments and competitive events. Connect with advanced players and participate in league play.</p>
            <button onClick={() => navigate('/events')}>Join Tournaments</button>
          </div>
        </div>
      </section>

      {/* Community Highlights */}
      <section className="community-section">
        <h2>Join Our Tennis Community</h2>
        <div className="community-content">
          <div className="community-text">
            <h3>Connect Beyond the Court</h3>
            <p>
              MatchPoint isn't just about finding games – it's about building lasting connections with fellow tennis enthusiasts. 
              Join local communities, share tips, organize group events, and be part of a vibrant tennis network.
            </p>
            <ul className="community-benefits">
              <li>🤝 Meet like-minded tennis players</li>
              <li>📚 Share tips and improve your game</li>
              <li>🎉 Organize and join group events</li>
              <li>🏅 Participate in community challenges</li>
            </ul>
            <button 
              className="community-button"
              onClick={() => navigate('/communities')}
            >
              Explore Communities
            </button>
          </div>
          <div className="community-visual">
            <div className="player-avatars">
              <div className="avatar">🏃‍♂️</div>
              <div className="avatar">🏃‍♀️</div>
              <div className="avatar">🧑‍🦱</div>
              <div className="avatar">👩‍🦰</div>
              <div className="avatar">🧑‍🦲</div>
              <div className="avatar">👨‍🦳</div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="final-cta">
        <div className="cta-content">
          <h2>Ready to Serve Up Some Fun?</h2>
          <p>Join thousands of tennis players who have found their perfect match on MatchPoint.</p>
          <div className="cta-buttons">
            <button 
              className="primary-cta"
              onClick={() => navigate('/register')}
            >
              Get Started Free
            </button>
            <button 
              className="secondary-cta"
              onClick={() => navigate('/nearby-players')}
            >
              Browse Players
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home; 