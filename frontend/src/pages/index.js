import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FiSearch, FiMapPin, FiUsers, FiCalendar, FiArrowRight } from 'react-icons/fi';
import Layout from '../components/layout/Layout';

export default function Home() {
  const [searchParams, setSearchParams] = useState({
    location: '',
    guestCount: '',
    eventType: '',
    date: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSearchParams({
      ...searchParams,
      [name]: value
    });
  };

  const handleSearch = (e) => {
    e.preventDefault();
    // Redirect to venues page with search params
    const queryParams = new URLSearchParams();
    if (searchParams.location) queryParams.append('location', searchParams.location);
    if (searchParams.guestCount) queryParams.append('guests', searchParams.guestCount);
    if (searchParams.eventType) queryParams.append('eventType', searchParams.eventType);
    if (searchParams.date) queryParams.append('date', searchParams.date);
    
    window.location.href = `/venues?${queryParams.toString()}`;
  };

  // Featured venues
  const featuredVenues = [
    {
      id: 1,
      name: 'Royal Garden Lawn',
      location: 'Mumbai, India',
      image: '/images/venue1.jpg',
      price: '₹50,000',
      rating: 4.8,
      type: 'Lawn'
    },
    {
      id: 2,
      name: 'Grand Celebration Banquet',
      location: 'Delhi, India',
      image: '/images/venue2.jpg',
      price: '₹75,000',
      rating: 4.9,
      type: 'Banquet'
    },
    {
      id: 3,
      name: 'Seaside Resort',
      location: 'Goa, India',
      image: '/images/venue3.jpg',
      price: '₹120,000',
      rating: 4.7,
      type: 'Resort'
    }
  ];

  // Featured services
  const featuredServices = [
    {
      id: 1,
      name: 'Delicious Delights Catering',
      type: 'Caterer',
      image: '/images/service1.jpg',
      rating: 4.9
    },
    {
      id: 2,
      name: 'Dream Decorators',
      type: 'Decorator',
      image: '/images/service2.jpg',
      rating: 4.8
    },
    {
      id: 3,
      name: 'Perfect Planners',
      type: 'Organizer',
      image: '/images/service3.jpg',
      rating: 4.7
    }
  ];

  // Event types
  const eventTypes = [
    { name: 'Wedding', icon: '💍', color: 'bg-pink-100 text-pink-800' },
    { name: 'Birthday', icon: '🎂', color: 'bg-blue-100 text-blue-800' },
    { name: 'Corporate', icon: '💼', color: 'bg-gray-100 text-gray-800' },
    { name: 'Engagement', icon: '💎', color: 'bg-purple-100 text-purple-800' },
    { name: 'Gala', icon: '🎭', color: 'bg-indigo-100 text-indigo-800' },
    { name: 'Reception', icon: '🥂', color: 'bg-yellow-100 text-yellow-800' }
  ];

  // Testimonials
  const testimonials = [
    {
      id: 1,
      name: 'Priya & Rahul',
      event: 'Wedding',
      image: '/images/testimonial1.jpg',
      quote: 'EventO made our wedding planning so much easier! We found the perfect venue and amazing vendors all in one place.'
    },
    {
      id: 2,
      name: 'Amit Shah',
      event: 'Corporate Event',
      image: '/images/testimonial2.jpg',
      quote: 'The platform is intuitive and the customer service is excellent. Our company event was a huge success thanks to the vendors we found here.'
    },
    {
      id: 3,
      name: 'Neha Gupta',
      event: 'Birthday Party',
      image: '/images/testimonial3.jpg',
      quote: 'I organized a surprise birthday party for my husband and everything was perfect. The venue and caterer I booked through EventO exceeded my expectations!'
    }
  ];

  return (
    <Layout title="EventO - Book Venues & Event Services">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-primary-600 to-secondary-600 text-white">
        <div className="absolute inset-0 bg-black opacity-30"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
          <div className="text-center max-w-3xl mx-auto">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-4xl md:text-5xl font-bold mb-6"
            >
              Find the Perfect Venue for Your Special Occasion
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-xl mb-8"
            >
              Book venues, caterers, decorators, and event organizers all in one place
            </motion.p>
            
            {/* Search Form */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="bg-white rounded-lg shadow-lg p-4 md:p-6 text-left"
            >
              <form onSubmit={handleSearch}>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                      Location
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FiMapPin className="text-gray-400" />
                      </div>
                      <input
                        type="text"
                        id="location"
                        name="location"
                        value={searchParams.location}
                        onChange={handleChange}
                        placeholder="City, State"
                        className="form-input pl-10"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="guestCount" className="block text-sm font-medium text-gray-700 mb-1">
                      Guests
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FiUsers className="text-gray-400" />
                      </div>
                      <input
                        type="number"
                        id="guestCount"
                        name="guestCount"
                        value={searchParams.guestCount}
                        onChange={handleChange}
                        placeholder="No. of guests"
                        min="1"
                        className="form-input pl-10"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="eventType" className="block text-sm font-medium text-gray-700 mb-1">
                      Event Type
                    </label>
                    <select
                      id="eventType"
                      name="eventType"
                      value={searchParams.eventType}
                      onChange={handleChange}
                      className="form-input"
                    >
                      <option value="">Select event type</option>
                      <option value="wedding">Wedding</option>
                      <option value="birthday">Birthday</option>
                      <option value="corporate">Corporate</option>
                      <option value="engagement">Engagement</option>
                      <option value="gala">Gala</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  
                  <div>
                    <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                      Date
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FiCalendar className="text-gray-400" />
                      </div>
                      <input
                        type="date"
                        id="date"
                        name="date"
                        value={searchParams.date}
                        onChange={handleChange}
                        className="form-input pl-10"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 text-center">
                  <button type="submit" className="btn-primary inline-flex items-center">
                    <FiSearch className="mr-2" /> Search Venues
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Event Types Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Plan Your Perfect Event</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              From weddings to corporate events, we have venues and services for every occasion
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {eventTypes.map((eventType, index) => (
              <motion.div
                key={eventType.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="card hover:shadow-lg cursor-pointer text-center"
              >
                <Link href={`/venues?eventType=${eventType.name.toLowerCase()}`}>
                  <div className={`text-4xl mb-3 mx-auto w-16 h-16 rounded-full flex items-center justify-center ${eventType.color}`}>
                    {eventType.icon}
                  </div>
                  <h3 className="text-lg font-semibold">{eventType.name}</h3>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Venues Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-12">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Featured Venues</h2>
              <p className="text-lg text-gray-600">
                Discover top-rated venues for your next event
              </p>
            </div>
            <Link href="/venues" className="btn-outline inline-flex items-center">
              View All <FiArrowRight className="ml-2" />
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredVenues.map((venue, index) => (
              <motion.div
                key={venue.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="card overflow-hidden hover:shadow-lg"
              >
                <div className="relative h-48 bg-gray-200">
                  <div className="absolute top-0 right-0 bg-white px-3 py-1 m-2 rounded-full text-sm font-medium text-primary-600">
                    {venue.type}
                  </div>
                  <div className="absolute bottom-0 left-0 bg-primary-600 text-white px-3 py-1 m-2 rounded-md text-sm font-medium">
                    From {venue.price}
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="text-xl font-semibold mb-2">{venue.name}</h3>
                  <div className="flex items-center text-gray-500 mb-3">
                    <FiMapPin className="mr-1" /> {venue.location}
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <span className="text-yellow-500">★</span>
                      <span className="ml-1 font-medium">{venue.rating}</span>
                    </div>
                    <Link href={`/venues/${venue.id}`} className="text-primary-600 hover:text-primary-700 font-medium">
                      View Details
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-12">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Event Services</h2>
              <p className="text-lg text-gray-600">
                Complete your event with top-rated service providers
              </p>
            </div>
            <Link href="/services" className="btn-outline inline-flex items-center">
              View All <FiArrowRight className="ml-2" />
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {featuredServices.map((service, index) => (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="card overflow-hidden hover:shadow-lg"
              >
                <div className="relative h-48 bg-gray-200">
                  <div className="absolute top-0 right-0 bg-white px-3 py-1 m-2 rounded-full text-sm font-medium text-secondary-600">
                    {service.type}
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="text-xl font-semibold mb-2">{service.name}</h3>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <span className="text-yellow-500">★</span>
                      <span className="ml-1 font-medium">{service.rating}</span>
                    </div>
                    <Link href={`/services/${service.id}`} className="text-secondary-600 hover:text-secondary-700 font-medium">
                      View Details
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">How It Works</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Booking your perfect venue and services is easy with EventO
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center"
            >
              <div className="bg-primary-100 text-primary-600 w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="text-xl font-semibold mb-3">Search</h3>
              <p className="text-gray-600">
                Browse through our extensive collection of venues and services based on your requirements
              </p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-center"
            >
              <div className="bg-primary-100 text-primary-600 w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="text-xl font-semibold mb-3">Book</h3>
              <p className="text-gray-600">
                Select your preferred venue and services, choose your date, and complete the booking form
              </p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="text-center"
            >
              <div className="bg-primary-100 text-primary-600 w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="text-xl font-semibold mb-3">Enjoy</h3>
              <p className="text-gray-600">
                Receive confirmation, make the payment, and enjoy your perfectly planned event
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">What Our Customers Say</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Hear from people who have successfully planned their events with EventO
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="card"
              >
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-full mr-4"></div>
                  <div>
                    <h3 className="font-semibold">{testimonial.name}</h3>
                    <p className="text-sm text-gray-500">{testimonial.event}</p>
                  </div>
                </div>
                <p className="text-gray-600 italic">"{testimonial.quote}"</p>
                <div className="mt-4 text-yellow-500">★★★★★</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-primary-600 to-secondary-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to Plan Your Next Event?</h2>
          <p className="text-xl mb-8 max-w-3xl mx-auto">
            Join EventO today and discover the perfect venue and services for your special occasion
          </p>
          <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <Link href="/register" className="btn-primary bg-white text-primary-600 hover:bg-gray-100">
              Sign Up as User
            </Link>
            <Link href="/host/register" className="btn-secondary bg-white text-secondary-600 hover:bg-gray-100">
              Become a Host
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  );
}
