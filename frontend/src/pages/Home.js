import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { format } from 'date-fns';
import { FaMapMarkerAlt, FaStar, FaRegCalendarAlt, FaSearch } from 'react-icons/fa';
import { motion } from 'framer-motion';

const Home = () => {
  const [venues, setVenues] = useState([]);
  const [featuredVenues, setFeaturedVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(),
    endDate: new Date(new Date().setDate(new Date().getDate() + 1))
  });

  useEffect(() => {
    const fetchVenues = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/venues`);
        
        if (response.data && response.data.data) {
          setVenues(response.data.data);
          // Set featured venues (top 4 by rating)
          const featured = [...response.data.data]
            .sort((a, b) => b.averageRating - a.averageRating)
            .slice(0, 4);
          setFeaturedVenues(featured);
        }
        setLoading(false);
      } catch (err) {
        console.error('Error fetching venues:', err);
        setError('Failed to load venues. Please try again later.');
        setLoading(false);
      }
    };

    fetchVenues();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    // In a real app, you would filter venues or make an API call with search params
    console.log('Search query:', searchQuery);
    console.log('Date range:', dateRange);
  };

  // Hero section animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.3
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <motion.section 
        className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-20"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <div className="container mx-auto px-4">
          <motion.div className="max-w-3xl mx-auto text-center" variants={itemVariants}>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">Find and Book Amazing Venues</h1>
            <p className="text-xl mb-8">Discover the perfect space for your next event, meeting, or celebration</p>
            
            {/* Search Form */}
            <div className="bg-white p-4 rounded-lg shadow-lg">
              <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <FaSearch className="absolute left-3 top-3 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search venues by name or location"
                      className="w-full pl-10 pr-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="relative">
                    <FaRegCalendarAlt className="absolute left-3 top-3 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Select dates"
                      className="w-full pl-10 pr-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
                      value={`${format(dateRange.startDate, 'MMM dd')} - ${format(dateRange.endDate, 'MMM dd')}`}
                      readOnly
                      // In a real app, you would use a date picker component here
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-6 rounded-md transition duration-300 ease-in-out"
                >
                  Search
                </button>
              </form>
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* Featured Venues Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Featured Venues</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {featuredVenues.map((venue) => (
              <Link href={`/venues/${venue._id}`} key={venue._id}>
                <motion.div 
                  className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition duration-300"
                  whileHover={{ y: -5 }}
                >
                  <div className="h-48 overflow-hidden">
                    <img 
                      src={venue.images && venue.images[0] ? venue.images[0] : 'https://via.placeholder.com/400x300?text=No+Image'} 
                      alt={venue.name} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-xl font-semibold">{venue.name}</h3>
                      <div className="flex items-center">
                        <FaStar className="text-yellow-400 mr-1" />
                        <span>{venue.averageRating ? venue.averageRating.toFixed(1) : 'New'}</span>
                      </div>
                    </div>
                    <div className="flex items-center text-gray-600 mb-3">
                      <FaMapMarkerAlt className="mr-1" />
                      <span>{venue.location ? venue.location.city : 'Location not specified'}</span>
                    </div>
                    <p className="text-gray-700 mb-3 line-clamp-2">{venue.description}</p>
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-blue-600">${venue.price ? venue.price.toFixed(2) : '0.00'}/day</span>
                      <span className="text-sm text-gray-500">Capacity: {venue.capacity}</span>
                    </div>
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>
          
          <div className="text-center mt-12">
            <Link 
              href="/venues" 
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white py-2 px-6 rounded-md transition duration-300 ease-in-out"
            >
              View All Venues
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaSearch className="text-blue-600 text-2xl" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Search</h3>
              <p className="text-gray-600">Browse through our collection of venues and find the perfect match for your needs.</p>
            </div>
            
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaRegCalendarAlt className="text-blue-600 text-2xl" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Book</h3>
              <p className="text-gray-600">Select your dates and book your venue with our simple booking process.</p>
            </div>
            
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaStar className="text-blue-600 text-2xl" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Enjoy</h3>
              <p className="text-gray-600">Enjoy your event and share your experience by leaving a review.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-indigo-600 to-purple-700 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to Host Your Next Event?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">Join thousands of satisfied customers who have found their perfect venue through Enjoy-Booking.</p>
          <Link 
            href="/register" 
            className="inline-block bg-white text-indigo-700 hover:bg-gray-100 py-3 px-8 rounded-md font-semibold transition duration-300 ease-in-out"
          >
            Sign Up Now
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;
