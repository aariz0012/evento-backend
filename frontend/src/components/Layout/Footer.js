import React from 'react';
import Link from 'next/link';
import { FiMail, FiPhone, FiMapPin, FiFacebook, FiInstagram, FiTwitter, FiLinkedin } from 'react-icons/fi';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div>
            <h3 className="text-xl font-bold mb-4">EventO</h3>
            <p className="text-gray-400 mb-4">
              Your one-stop platform for booking venues and event services for all your special occasions.
            </p>
            <div className="flex space-x-4">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                <FiFacebook size={20} />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                <FiInstagram size={20} />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                <FiTwitter size={20} />
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                <FiLinkedin size={20} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-xl font-bold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-gray-400 hover:text-white transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/venues" className="text-gray-400 hover:text-white transition-colors">
                  Venues
                </Link>
              </li>
              <li>
                <Link href="/services" className="text-gray-400 hover:text-white transition-colors">
                  Services
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-gray-400 hover:text-white transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-gray-400 hover:text-white transition-colors">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-xl font-bold mb-4">Our Services</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/venues?type=lawn" className="text-gray-400 hover:text-white transition-colors">
                  Lawn Venues
                </Link>
              </li>
              <li>
                <Link href="/venues?type=banquet" className="text-gray-400 hover:text-white transition-colors">
                  Banquet Halls
                </Link>
              </li>
              <li>
                <Link href="/services?type=caterer" className="text-gray-400 hover:text-white transition-colors">
                  Catering Services
                </Link>
              </li>
              <li>
                <Link href="/services?type=decorator" className="text-gray-400 hover:text-white transition-colors">
                  Decoration Services
                </Link>
              </li>
              <li>
                <Link href="/services?type=organizer" className="text-gray-400 hover:text-white transition-colors">
                  Event Organizers
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-xl font-bold mb-4">Contact Us</h3>
            <ul className="space-y-3">
              <li className="flex items-start">
                <FiMapPin className="mr-3 mt-1 text-primary-500" />
                <span className="text-gray-400">
                  Khalilabad, UP-272175, India
                </span>
              </li>
              <li className="flex items-center">
                <FiPhone className="mr-3 text-primary-500" />
                <span className="text-gray-400">8875195390</span>
              </li>
              <li className="flex items-center">
                <FiMail className="mr-3 text-primary-500" />
                <span className="text-gray-400">khanaariz0012@gmail.com</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              &copy; {currentYear} EventO. All rights reserved.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <Link href="/terms" className="text-gray-400 hover:text-white text-sm transition-colors">
                Terms of Service
              </Link>
              <Link href="/privacy" className="text-gray-400 hover:text-white text-sm transition-colors">
                Privacy Policy
              </Link>
              <Link href="/faq" className="text-gray-400 hover:text-white text-sm transition-colors">
                FAQ
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
