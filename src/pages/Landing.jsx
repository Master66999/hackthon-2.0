import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import useEmblaCarousel from 'embla-carousel-react';
import { ArrowRight, Leaf, MagnifyingGlass, FirstAid, CheckCircle, Quotes } from '@phosphor-icons/react';
import Crop3DCarousel from '../components/Crop3DCarousel.jsx';
import './Landing.css';

/* ─── Scroll-reveal helper ───────────────────────────── */
function RevealBlock({ children, delay = 0, className = '' }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.6, delay, ease: [0.33, 1, 0.68, 1] }}
    >
      {children}
    </motion.div>
  );
}

/* ─── HOW IT WORKS steps ─────────────────────────────── */
const STEPS = [
  {
    icon: <Leaf size={28} weight="fill" />,
    num: '01',
    title: 'Select Your Crop',
    desc: 'Choose from cotton, tomato, tea, coffee, maize, or apple — our models are trained on each crop specifically.',
  },
  {
    icon: <MagnifyingGlass size={28} weight="fill" />,
    num: '02',
    title: 'Upload a Leaf Photo',
    desc: 'Take a clear photo of the affected leaf in natural daylight. Upload directly from your phone or computer.',
  },
  {
    icon: <FirstAid size={28} weight="fill" />,
    num: '03',
    title: 'Get Your Diagnosis',
    desc: 'Receive an instant disease identification with confidence score and expert-curated treatment recommendations.',
  },
];

/* ─── Testimonials ───────────────────────────────────── */
const TESTIMONIALS = [
  {
    quote: "Identified bacterial blight in my cotton field within seconds. Saved my entire crop that season.",
    author: "Rajesh Kumar",
    role: "Cotton Farmer, Punjab",
  },
  {
    quote: "The treatment recommendations were spot-on. My agronomist confirmed the same diagnosis LeafSense gave me.",
    author: "Amara Osei",
    role: "Tomato Grower, Ghana",
  },
  {
    quote: "We've integrated LeafSense into our tea estate monitoring program. It's become indispensable.",
    author: "Priya Sharma",
    role: "Estate Manager, Assam",
  },
];

/* ─── Landing Page ───────────────────────────────────── */
export default function Landing() {
  /* Parallax */
  const heroRef = useRef(null);
  const { scrollY } = useScroll();
  const heroImgY = useTransform(scrollY, [0, 600], [0, 80]);
  const heroTextY = useTransform(scrollY, [0, 600], [0, -30]);

  /* Testimonial carousel (Embla) */
  const [testEmblaRef] = useEmblaCarousel({ loop: true, align: 'center' });

  return (
    <main className="landing">
      {/* ═══════════ HERO ═══════════ */}
      <section className="hero" ref={heroRef}>
        <div className="hero__bg-blob" />

        <motion.div className="hero__text-col" style={{ y: heroTextY }}>
          <RevealBlock>
            <span className="hero__eyebrow">
              <span className="hero__eyebrow-dot" />
              AI Plant Pathology
            </span>
          </RevealBlock>

          <RevealBlock delay={0.08}>
            <h1 className="hero__title">
              Know what ails<br />
              your <em className="hero__title-em">crops</em>,<br />
              <span className="hero__title-light">before it spreads.</span>
            </h1>
          </RevealBlock>

          <RevealBlock delay={0.16}>
            <p className="hero__subtitle">
              Upload a single leaf photo and get an instant, expert-level
              diagnosis for cotton, tomato, tea, coffee, maize & apple —
              with actionable treatment recommendations.
            </p>
          </RevealBlock>

          <RevealBlock delay={0.24}>
            <div className="hero__actions">
              <Link to="/analyze" className="btn btn-primary hero__cta" id="hero-cta-primary">
                Start Diagnosis
                <ArrowRight size={18} weight="bold" />
              </Link>
              <a href="#how-it-works" className="btn btn-secondary" id="hero-cta-secondary">
                How it works
              </a>
            </div>
          </RevealBlock>

          <RevealBlock delay={0.32}>
            <div className="hero__stats">
              <div className="hero__stat neo-raised-sm">
                <span className="hero__stat-num">6</span>
                <span className="hero__stat-label">Crops</span>
              </div>
              <div className="hero__stat neo-raised-sm">
                <span className="hero__stat-num">20+</span>
                <span className="hero__stat-label">Diseases</span>
              </div>
              <div className="hero__stat neo-raised-sm">
                <span className="hero__stat-num">97%</span>
                <span className="hero__stat-label">Accuracy</span>
              </div>
            </div>
          </RevealBlock>
        </motion.div>

        <motion.div className="hero__image-col" style={{ y: heroImgY }}>
          <div className="hero__image-frame neo-raised">
            <img
              src="/images/hero_leaf.png"
              alt="Macro close-up of a healthy cotton leaf with intricate vein patterns"
              className="hero__image"
            />
            <div className="hero__image-badge neo-raised-sm">
              <CheckCircle size={16} weight="fill" className="hero__badge-icon" />
              <div>
                <span className="hero__badge-title">Live Diagnosis</span>
                <span className="hero__badge-sub">Bacterial Blight — 91% confidence</span>
              </div>
            </div>
          </div>

          {/* Floating accent card */}
          <div className="hero__accent-card neo-raised-sm">
            <Leaf size={20} weight="fill" style={{ color: 'var(--moss)' }} />
            <div>
              <span className="hero__accent-num">2.4s</span>
              <span className="hero__accent-label">avg. diagnosis time</span>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ═══════════ HOW IT WORKS ═══════════ */}
      <section className="section how-it-works" id="how-it-works">
        <div className="container">
          <RevealBlock>
            <p className="section-eyebrow">Simple & Fast</p>
            <h2 className="section-title">Three steps to clarity</h2>
          </RevealBlock>

          <div className="steps-grid">
            {STEPS.map((step, i) => (
              <RevealBlock key={step.num} delay={i * 0.12}>
                <div className="step-card neo-raised">
                  <div className="step-card__num">{step.num}</div>
                  <div className="step-card__icon">{step.icon}</div>
                  <h3 className="step-card__title">{step.title}</h3>
                  <p className="step-card__desc">{step.desc}</p>
                </div>
              </RevealBlock>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ CROP GALLERY — 3D Fan Carousel ═══════════ */}
      <section className="section crop-section" id="crops">
        <div className="container">
          <RevealBlock>
            <p className="section-eyebrow">Supported Crops</p>
            <h2 className="section-title">Six crops. Expertly monitored.</h2>
            <p className="section-subtitle">
              Each model is trained and validated on thousands of field images
              across disease stages, lighting conditions, and crop varieties.
            </p>
          </RevealBlock>
        </div>

        {/* 3D perspective fan carousel */}
        <RevealBlock delay={0.1}>
          <Crop3DCarousel />
        </RevealBlock>
      </section>

      {/* ═══════════ TESTIMONIALS ═══════════ */}
      <section className="section testimonials-section">
        <div className="container">
          <RevealBlock>
            <p className="section-eyebrow">From the Field</p>
            <h2 className="section-title">Trusted by farmers</h2>
          </RevealBlock>
        </div>

        <div className="testimonials-carousel-wrap">
          <div className="embla testimonials-carousel" ref={testEmblaRef}>
            <div className="embla__container testimonials-carousel__container">
              {TESTIMONIALS.map((t, i) => (
                <div key={i} className="embla__slide testimonials-carousel__slide">
                  <RevealBlock delay={i * 0.1}>
                    <div className="testimonial-card neo-raised">
                      <Quotes size={32} weight="fill" className="testimonial-card__quote-icon" />
                      <p className="testimonial-card__text">"{t.quote}"</p>
                      <div className="testimonial-card__author">
                        <div className="testimonial-card__avatar">
                          {t.author.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <p className="testimonial-card__name">{t.author}</p>
                          <p className="testimonial-card__role">{t.role}</p>
                        </div>
                      </div>
                    </div>
                  </RevealBlock>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ CTA BANNER ═══════════ */}
      <section className="section cta-banner-section">
        <div className="container">
          <RevealBlock>
            <div className="cta-banner neo-raised">
              <div className="cta-banner__leaf-bg" />
              <div className="cta-banner__content">
                <h2 className="cta-banner__title">Ready to protect your crop?</h2>
                <p className="cta-banner__sub">
                  Get a diagnosis in under 5 seconds. No registration required.
                </p>
                <Link to="/analyze" className="btn btn-clay cta-banner__btn" id="cta-banner-btn">
                  Start Free Diagnosis
                  <ArrowRight size={18} weight="bold" />
                </Link>
              </div>
            </div>
          </RevealBlock>
        </div>
      </section>
    </main>
  );
}
