import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FaHome, FaSearch } from 'react-icons/fa';

const NotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <motion.div 
        className="text-center max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="mb-8">
          <motion.div
            className="text-9xl font-bold text-blue-600 mb-2"
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ 
              type: "spring",
              stiffness: 300,
              damping: 15
            }}
          >
            404
          </motion.div>
          <h1 className="text-3xl font-bold mb-2">Page Not Found</h1>
          <p className="text-gray-600 mb-6">
            The page you're looking for doesn't exist or has been moved.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link 
              href="/" 
              className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-6 rounded-md transition duration-300 ease-in-out flex items-center justify-center"
            >
              <FaHome className="mr-2" />
              Back to Home
            </Link>
            <Link 
              href="/venues" 
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-6 rounded-md transition duration-300 ease-in-out flex items-center justify-center"
            >
              <FaSearch className="mr-2" />
              Browse Venues
            </Link>
          </div>
        </div>
        
        <div className="relative">
          <motion.div
            className="w-full h-64 bg-blue-100 rounded-lg overflow-hidden relative"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <svg 
              className="absolute bottom-0 left-0 w-full"
              viewBox="0 0 1440 320"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fill="#3B82F6"
                fillOpacity="0.5"
                d="M0,192L48,202.7C96,213,192,235,288,229.3C384,224,480,192,576,181.3C672,171,768,181,864,197.3C960,213,1056,235,1152,229.3C1248,224,1344,192,1392,176L1440,160L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
              ></path>
            </svg>
            
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.5 }}
              >
                <svg 
                  className="w-32 h-32 text-blue-600 opacity-80"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z"
                    clipRule="evenodd"
                  ></path>
                </svg>
              </motion.div>
            </div>
          </motion.div>
        </div>
        
        <p className="text-gray-600 mt-8">
          If you believe this is an error, please contact our support team.
        </p>
      </motion.div>
    </div>
  );
};

export default NotFound;
