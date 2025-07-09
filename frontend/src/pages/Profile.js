import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { format } from 'date-fns';
import { toast } from 'react-toastify';
import { FaCalendarAlt, FaMapMarkerAlt, FaUser, FaEnvelope, FaPhone, FaEdit, FaTrash, FaStar } from 'react-icons/fa';
import { motion } from 'framer-motion';

const Profile = () => {
  const { user, isAuthenticated, logout, updateUserProfile } = useAuth();
  const [activeTab, setActiveTab] = useState('bookings');
  const [bookings, setBookings] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    avatar: ''
  });

  useEffect(() => {
    if (isAuthenticated && user) {
      setProfileData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        avatar: user.avatar || ''
      });
      
      fetchUserData();
    }
  }, [isAuthenticated, user]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      
      // Fetch user bookings
      const bookingsResponse = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/bookings/user`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      
      if (bookingsResponse.data && bookingsResponse.data.data) {
        setBookings(bookingsResponse.data.data);
      }
      
      // Fetch user reviews
      const reviewsResponse = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/reviews/user`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      
      if (reviewsResponse.data && reviewsResponse.data.data) {
        setReviews(reviewsResponse.data.data);
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching user data:', err);
      setError('Failed to load your profile data. Please try again later.');
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData({
      ...profileData,
      [name]: value
    });
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    
    try {
      const response = await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/api/users/profile`,
        profileData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      
      if (response.data && response.data.data) {
        updateUserProfile(response.data.data);
        toast.success('Profile updated successfully');
        setEditMode(false);
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      toast.error(err.response?.data?.message || 'Failed to update profile');
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking? This action cannot be undone.')) {
      return;
    }
    
    try {
      await axios.delete(
        `${process.env.NEXT_PUBLIC_API_URL}/api/bookings/${bookingId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      
      // Update bookings list
      setBookings(bookings.filter(booking => booking._id !== bookingId));
      toast.success('Booking cancelled successfully');
    } catch (err) {
      console.error('Error cancelling booking:', err);
      toast.error(err.response?.data?.message || 'Failed to cancel booking');
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm('Are you sure you want to delete this review? This action cannot be undone.')) {
      return;
    }
    
    try {
      await axios.delete(
        `${process.env.NEXT_PUBLIC_API_URL}/api/reviews/${reviewId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      
      // Update reviews list
      setReviews(reviews.filter(review => review._id !== reviewId));
      toast.success('Review deleted successfully');
    } catch (err) {
      console.error('Error deleting review:', err);
      toast.error(err.response?.data?.message || 'Failed to delete review');
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
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">My Profile</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left Column - Profile Info */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-center mb-6">
              <div className="w-24 h-24 rounded-full bg-gray-300 mx-auto mb-4 overflow-hidden">
                {profileData.avatar ? (
                  <img src={profileData.avatar} alt={profileData.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-blue-500 text-white font-bold text-2xl">
                    {profileData.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <h2 className="text-xl font-semibold">{profileData.name}</h2>
              <p className="text-gray-600">{user?.memberSince ? `Member since ${format(new Date(user.memberSince), 'MMMM yyyy')}` : 'Member'}</p>
            </div>
            
            {!editMode ? (
              <>
                <div className="space-y-3 mb-6">
                  <div className="flex items-center">
                    <FaUser className="text-gray-500 mr-3" />
                    <span>{profileData.name}</span>
                  </div>
                  <div className="flex items-center">
                    <FaEnvelope className="text-gray-500 mr-3" />
                    <span>{profileData.email}</span>
                  </div>
                  {profileData.phone && (
                    <div className="flex items-center">
                      <FaPhone className="text-gray-500 mr-3" />
                      <span>{profileData.phone}</span>
                    </div>
                  )}
                </div>
                
                <button
                  onClick={() => setEditMode(true)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md transition duration-300 ease-in-out"
                >
                  Edit Profile
                </button>
              </>
            ) : (
              <form onSubmit={handleProfileUpdate}>
                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-gray-700 mb-1">Name</label>
                    <input
                      type="text"
                      name="name"
                      value={profileData.name}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded-md"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      name="email"
                      value={profileData.email}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded-md"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 mb-1">Phone</label>
                    <input
                      type="tel"
                      name="phone"
                      value={profileData.phone}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 mb-1">Avatar URL</label>
                    <input
                      type="url"
                      name="avatar"
                      value={profileData.avatar}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded-md"
                      placeholder="https://example.com/avatar.jpg"
                    />
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md transition duration-300 ease-in-out"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditMode(false)}
                    className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded-md transition duration-300 ease-in-out"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
            
            <div className="mt-6 pt-6 border-t">
              <button
                onClick={logout}
                className="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-md transition duration-300 ease-in-out"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
        
        {/* Right Column - Tabs */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {/* Tabs */}
            <div className="flex border-b">
              <button
                className={`flex-1 py-3 px-4 text-center font-medium ${activeTab === 'bookings' ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:bg-gray-50'}`}
                onClick={() => setActiveTab('bookings')}
              >
                My Bookings
              </button>
              <button
                className={`flex-1 py-3 px-4 text-center font-medium ${activeTab === 'reviews' ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:bg-gray-50'}`}
                onClick={() => setActiveTab('reviews')}
              >
                My Reviews
              </button>
            </div>
            
            {/* Tab Content */}
            <div className="p-6">
              {/* Bookings Tab */}
              {activeTab === 'bookings' && (
                <div>
                  <h2 className="text-xl font-semibold mb-4">Your Bookings</h2>
                  
                  {bookings.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-600 mb-4">You don't have any bookings yet.</p>
                      <Link 
                        href="/" 
                        className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-6 rounded-md transition duration-300 ease-in-out"
                      >
                        Explore Venues
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {bookings.map((booking) => (
                        <motion.div 
                          key={booking._id}
                          className="border rounded-lg overflow-hidden"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <div className="grid grid-cols-1 md:grid-cols-4">
                            <div className="md:col-span-1 h-40 md:h-full bg-gray-200">
                              {booking.venue && booking.venue.images && booking.venue.images.length > 0 ? (
                                <img 
                                  src={booking.venue.images[0]} 
                                  alt={booking.venue.name} 
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gray-300 text-gray-600">
                                  No image
                                </div>
                              )}
                            </div>
                            
                            <div className="md:col-span-3 p-4">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h3 className="text-lg font-semibold">
                                    {booking.venue ? booking.venue.name : 'Venue not available'}
                                  </h3>
                                  {booking.venue && booking.venue.location && (
                                    <p className="text-gray-600 flex items-center">
                                      <FaMapMarkerAlt className="mr-1" />
                                      {booking.venue.location.city}, {booking.venue.location.state}
                                    </p>
                                  )}
                                </div>
                                <div className="text-right">
                                  <span className="font-bold text-blue-600">${booking.totalAmount.toFixed(2)}</span>
                                </div>
                              </div>
                              
                              <div className="mt-3 flex items-center text-gray-600">
                                <FaCalendarAlt className="mr-1" />
                                <span>
                                  {format(new Date(booking.startDate), 'MMM dd, yyyy')} - {format(new Date(booking.endDate), 'MMM dd, yyyy')}
                                </span>
                              </div>
                              
                              <div className="mt-4 flex flex-wrap gap-2">
                                <Link 
                                  href={`/venues/${booking.venue?._id}`}
                                  className="bg-blue-100 hover:bg-blue-200 text-blue-800 py-1 px-3 rounded-md text-sm transition duration-300 ease-in-out"
                                >
                                  View Venue
                                </Link>
                                
                                {new Date(booking.startDate) > new Date() && (
                                  <button
                                    onClick={() => handleCancelBooking(booking._id)}
                                    className="bg-red-100 hover:bg-red-200 text-red-800 py-1 px-3 rounded-md text-sm transition duration-300 ease-in-out"
                                  >
                                    Cancel Booking
                                  </button>
                                )}
                                
                                {new Date(booking.endDate) < new Date() && !booking.hasReview && (
                                  <Link 
                                    href={`/reviews/new?venueId=${booking.venue?._id}&bookingId=${booking._id}`}
                                    className="bg-green-100 hover:bg-green-200 text-green-800 py-1 px-3 rounded-md text-sm transition duration-300 ease-in-out"
                                  >
                                    Leave Review
                                  </Link>
                                )}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              
              {/* Reviews Tab */}
              {activeTab === 'reviews' && (
                <div>
                  <h2 className="text-xl font-semibold mb-4">Your Reviews</h2>
                  
                  {reviews.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-600">You haven't left any reviews yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {reviews.map((review) => (
                        <motion.div 
                          key={review._id}
                          className="border rounded-lg p-4"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h3 className="text-lg font-semibold">
                                {review.venue ? review.venue.name : 'Venue not available'}
                              </h3>
                              <div className="flex items-center mt-1">
                                <div className="flex">
                                  {[...Array(5)].map((_, i) => (
                                    <FaStar 
                                      key={i} 
                                      className={i < review.rating ? "text-yellow-400" : "text-gray-300"} 
                                    />
                                  ))}
                                </div>
                                <span className="ml-2 text-gray-600">
                                  {format(new Date(review.createdAt), 'MMM dd, yyyy')}
                                </span>
                              </div>
                            </div>
                            <button
                              onClick={() => handleDeleteReview(review._id)}
                              className="text-red-600 hover:text-red-800"
                              title="Delete review"
                            >
                              <FaTrash />
                            </button>
                          </div>
                          
                          <p className="text-gray-700">{review.comment}</p>
                          
                          {review.venue && (
                            <Link 
                              href={`/venues/${review.venue._id}`}
                              className="inline-block mt-3 text-blue-600 hover:underline text-sm"
                            >
                              View Venue
                            </Link>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
