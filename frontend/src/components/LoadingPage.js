import React from 'react';
import { motion } from 'framer-motion';

const LoadingPage = () => {
  return (
    <div className="loading-animation bg-gradient-to-br from-primary-50 to-secondary-50 min-h-screen flex flex-col items-center justify-center">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        <motion.div
          animate={{ 
            scale: [1, 1.1, 1],
            opacity: [0.7, 1, 0.7]
          }}
          transition={{ 
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="mb-6"
        >
          <div className="text-6xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 text-transparent bg-clip-text">
            EventO
          </div>
        </motion.div>
        
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: "100%" }}
          transition={{ duration: 1.5, delay: 0.5 }}
          className="h-1 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full max-w-md mx-auto"
        />
        
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 1 }}
          className="mt-4 text-gray-600"
        >
          Your perfect venue is just a click away...
        </motion.p>
      </motion.div>
    </div>
  );
};

export default LoadingPage;
