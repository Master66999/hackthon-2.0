import React from 'react';
import { Link } from 'react-router-dom';
import { Leaf, GithubLogo, TwitterLogo, InstagramLogo } from '@phosphor-icons/react';
import './Footer.css';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer__inner container">
        <div className="footer__brand">
          <div className="footer__logo">
            <span className="footer__logo-icon">
              <Leaf size={18} weight="fill" />
            </span>
            <span className="footer__logo-text">
              Leaf<em>Sense</em>
            </span>
          </div>
          <p className="footer__tagline">
            Empowering farmers with AI-powered<br />plant disease detection.
          </p>
          <div className="footer__social">
            <a href="#" aria-label="GitHub" className="footer__social-link"><GithubLogo size={20} /></a>
            <a href="#" aria-label="Twitter" className="footer__social-link"><TwitterLogo size={20} /></a>
            <a href="#" aria-label="Instagram" className="footer__social-link"><InstagramLogo size={20} /></a>
          </div>
        </div>

        <div className="footer__links">
          <div className="footer__links-group">
            <h4 className="footer__links-title">Crops</h4>
            <ul>
              <li><a href="#">Cotton</a></li>
              <li><a href="#">Tomato</a></li>
              <li><a href="#">Tea</a></li>
              <li><a href="#">Coffee</a></li>
              <li><a href="#">Maize</a></li>
              <li><a href="#">Apple</a></li>
            </ul>
          </div>
          <div className="footer__links-group">
            <h4 className="footer__links-title">Platform</h4>
            <ul>
              <li><Link to="/analyze">Diagnose</Link></li>
              <li><a href="#">API Docs</a></li>
              <li><a href="#">Research</a></li>
              <li><a href="#">About</a></li>
            </ul>
          </div>
          <div className="footer__links-group">
            <h4 className="footer__links-title">Legal</h4>
            <ul>
              <li><a href="#">Privacy Policy</a></li>
              <li><a href="#">Terms of Use</a></li>
              <li><a href="#">Contact</a></li>
            </ul>
          </div>
        </div>
      </div>

      <div className="footer__bottom container">
        <p className="footer__copyright">
          © {currentYear} LeafSense. Built for farmers, by researchers.
        </p>
        <p className="footer__disclaimer">
          Diagnostic results are AI-assisted and should be validated by an agronomist.
        </p>
      </div>
    </footer>
  );
}
