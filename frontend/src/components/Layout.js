import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import Navbar from './Layout/Navbar';
import Footer from './Layout/Footer';
import IntroPopup from './IntroPopup';

const Layout = ({ children, title = 'EventO - Book Venues & Services' }) => {
  const [showIntroPopup, setShowIntroPopup] = useState(false);

  useEffect(() => {
    // Check if this is the first visit
    const hasVisitedBefore = localStorage.getItem('hasVisitedBefore');
    
    if (!hasVisitedBefore && window.location.pathname === '/') {
      // Show intro popup on first visit to homepage
      setShowIntroPopup(true);
      localStorage.setItem('hasVisitedBefore', 'true');
    }
  }, []);

  return (
    <>
      <Helmet>
        <title>{title}</title>
        <meta name="description" content="Book venues and event services for weddings, birthdays, galas, and more" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Helmet>

      <div className="flex flex-col min-h-screen">
        <Navbar />
        
        <main className="flex-grow">
          {children}
        </main>
        
        <Footer />
      </div>

      {showIntroPopup && (
        <IntroPopup onClose={() => setShowIntroPopup(false)} />
      )}
    </>
  );
};

export default Layout;
