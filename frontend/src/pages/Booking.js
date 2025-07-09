import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { format, differenceInDays } from 'date-fns';
import { toast } from 'react-toastify';
import { FaMapMarkerAlt, FaCalendarAlt, FaUsers, FaCreditCard, FaLock } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { loadStripe } from '@stripe/stripe-js';
import { CardElement, Elements, useStripe, useElements } from '@stripe/react-stripe-js';

// Initialize Stripe
const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLIC_KEY);

// Checkout Form Component
const CheckoutForm = ({ 
  venueId, 
  startDate, 
  endDate, 
  totalPrice, 
  onSuccess, 
  onError, 
  processingPayment, 
  setProcessingPayment 
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const { user } = useAuth();
  
  const [cardError, setCardError] = useState(null);
  
  const handleSubmit = async (event) => {
    event.preventDefault();
    
    if (!stripe || !elements) {
      return;
    }
    
    setProcessingPayment(true);
    setCardError(null);
    
    try {
      // Create payment intent on the server
      const { data } = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/bookings/payment-intent`, {
        amount: totalPrice * 100, // Convert to cents for Stripe
        venueId,
        startDate,
        endDate,
        userId: user.id
      });
      
      // Confirm card payment
      const { error, paymentIntent } = await stripe.confirmCardPayment(data.clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
          billing_details: {
            name: user.name,
            email: user.email
          }
        }
      });
      
      if (error) {
        setCardError(error.message);
        onError(error.message);
      } else if (paymentIntent.status === 'succeeded') {
        // Create booking in database
        const bookingResponse = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/api/bookings`, 
          {
            venueId,
            startDate,
            endDate,
            totalAmount: totalPrice,
            paymentIntentId: paymentIntent.id
          },
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`
            }
          }
        );
        
        onSuccess(bookingResponse.data.data);
      }
    } catch (err) {
      console.error('Payment error:', err);
      onError(err.response?.data?.message || 'Payment processing failed');
    } finally {
      setProcessingPayment(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="mt-4">
      <div className="mb-4">
        <label className="block text-gray-700 mb-2 font-semibold">Card Details</label>
        <div className="border border-gray-300 p-3 rounded-md">
          <CardElement 
            options={{
              style: {
                base: {
                  fontSize: '16px',
                  color: '#424770',
                  '::placeholder': {
                    color: '#aab7c4',
                  },
                },
                invalid: {
                  color: '#9e2146',
                },
              },
            }}
          />
        </div>
        {cardError && (
          <div className="text-red-600 text-sm mt-2">{cardError}</div>
        )}
      </div>
      
      <div className="flex items-center mb-4 text-sm text-gray-600">
        <FaLock className="mr-2" />
        <span>Your payment information is secure and encrypted</span>
      </div>
      
      <button
        type="submit"
        disabled={!stripe || processingPayment}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-md transition duration-300 ease-in-out disabled:bg-blue-400 flex justify-center items-center"
      >
        {processingPayment ? (
          <>
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Processing...
          </>
        ) : (
          <>
            <FaCreditCard className="mr-2" />
            Complete Booking - ${totalPrice.toFixed(2)}
          </>
        )}
      </button>
    </form>
  );
};

// Main Booking Component
const Booking = () => {
  const router = useRouter();
  const { id } = router.query;
  const { isAuthenticated, user } = useAuth();
  
  const [venue, setVenue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [bookingComplete, setBookingComplete] = useState(false);
  const [bookingDetails, setBookingDetails] = useState(null);
  
  // Get dates from location state or set defaults
  const startDate = router.query?.startDate ? new Date(router.query.startDate) : new Date();
  const endDate = router.query?.endDate ? new Date(router.query.endDate) : new Date(new Date().setDate(new Date().getDate() + 1));
  
  // Calculate booking duration and total price
  const durationDays = differenceInDays(endDate, startDate) || 1; // Minimum 1 day
  
  useEffect(() => {
    // Redirect if not authenticated
    if (!isAuthenticated) {
      toast.error('You must be logged in to book a venue');
      router.push('/login', { query: { from: `/venues/${id}` } });
      return;
    }
    
    const fetchVenueDetails = async () => {
      try {
        setLoading(true);
        
        // If venue is passed in location state, use it
        if (router.query?.venue) {
          setVenue(router.query.venue);
          setLoading(false);
          return;
        }
        
        // Otherwise fetch from API
        const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/venues/${id}`);
        
        if (response.data && response.data.data) {
          setVenue(response.data.data);
        }
        setLoading(false);
      } catch (err) {
        console.error('Error fetching venue details:', err);
        setError('Failed to load venue details. Please try again later.');
        setLoading(false);
      }
    };

    if (id) {
      fetchVenueDetails();
    }
  }, [id, isAuthenticated, router.push, router.query]);
  
  const handlePaymentSuccess = (bookingData) => {
    setBookingComplete(true);
    setBookingDetails(bookingData);
    toast.success('Booking completed successfully!');
  };
  
  const handlePaymentError = (errorMessage) => {
    toast.error(errorMessage || 'Payment failed. Please try again.');
  };
  
  // Calculate prices
  const calculatePrices = () => {
    if (!venue) return { subtotal: 0, serviceFee: 0, total: 0 };
    
    const subtotal = venue.price * durationDays;
    const serviceFee = subtotal * 0.1; // 10% service fee
    const total = subtotal + serviceFee;
    
    return { subtotal, serviceFee, total };
  };
  
  const { subtotal, serviceFee, total } = calculatePrices();
  
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

  if (!venue) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
          <p>Venue not found</p>
        </div>
      </div>
    );
  }
  
  // If booking is complete, show confirmation
  if (bookingComplete && bookingDetails) {
    return (
      <div className="container mx-auto px-4 py-8">
        <motion.div 
          className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-800">Booking Confirmed!</h1>
            <p className="text-gray-600 mt-2">Thank you for your booking. Your confirmation details are below.</p>
          </div>
          
          <div className="border-t border-b border-gray-200 py-4 mb-6">
            <h2 className="text-xl font-semibold mb-4">Booking Details</h2>
            <div className="space-y-3">
              <div className="flex items-start">
                <div className="w-8 text-gray-500"><FaMapMarkerAlt /></div>
                <div>
                  <p className="font-semibold">{venue.name}</p>
                  <p className="text-gray-600">{venue.location ? `${venue.location.address}, ${venue.location.city}` : 'Location not specified'}</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="w-8 text-gray-500"><FaCalendarAlt /></div>
                <div>
                  <p className="font-semibold">Booking Period</p>
                  <p className="text-gray-600">
                    {format(startDate, 'MMM dd, yyyy')} - {format(endDate, 'MMM dd, yyyy')}
                  </p>
                  <p className="text-gray-600">{durationDays} {durationDays === 1 ? 'day' : 'days'}</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="w-8 text-gray-500"><FaUsers /></div>
                <div>
                  <p className="font-semibold">Capacity</p>
                  <p className="text-gray-600">Up to {venue.capacity} people</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="w-8 text-gray-500"><FaCreditCard /></div>
                <div>
                  <p className="font-semibold">Payment</p>
                  <p className="text-gray-600">Total paid: ${total.toFixed(2)}</p>
                  <p className="text-gray-600">Booking ID: {bookingDetails._id}</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="text-center space-y-4">
            <p className="text-gray-600">
              We've sent a confirmation email to <span className="font-semibold">{user.email}</span> with all the details.
            </p>
            
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link 
                href="/profile" 
                className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-6 rounded-md transition duration-300 ease-in-out"
              >
                View My Bookings
              </Link>
              <Link 
                href="/" 
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-6 rounded-md transition duration-300 ease-in-out"
              >
                Back to Home
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href={`/venues/${id}`} className="text-blue-600 hover:underline mb-4 inline-block">
          &larr; Back to venue
        </Link>
        <h1 className="text-3xl font-bold mt-2">Complete Your Booking</h1>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Booking Form */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Your Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-gray-700 mb-2">First Name</label>
                <input 
                  type="text" 
                  value={user?.name?.split(' ')[0] || ''}
                  disabled
                  className="w-full p-2 border border-gray-300 rounded-md bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-2">Last Name</label>
                <input 
                  type="text" 
                  value={user?.name?.split(' ').slice(1).join(' ') || ''}
                  disabled
                  className="w-full p-2 border border-gray-300 rounded-md bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-2">Email</label>
                <input 
                  type="email" 
                  value={user?.email || ''}
                  disabled
                  className="w-full p-2 border border-gray-300 rounded-md bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-2">Phone</label>
                <input 
                  type="tel" 
                  value={user?.phone || ''}
                  disabled
                  className="w-full p-2 border border-gray-300 rounded-md bg-gray-50"
                />
              </div>
            </div>
            
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-4">Booking Details</h2>
              <div className="flex items-center mb-3">
                <FaCalendarAlt className="text-gray-500 mr-2" />
                <span>
                  {format(startDate, 'MMM dd, yyyy')} - {format(endDate, 'MMM dd, yyyy')} ({durationDays} {durationDays === 1 ? 'day' : 'days'})
                </span>
              </div>
              <div className="flex items-center">
                <FaUsers className="text-gray-500 mr-2" />
                <span>Capacity: Up to {venue.capacity} people</span>
              </div>
            </div>
            
            <div>
              <h2 className="text-xl font-semibold mb-4">Payment</h2>
              <Elements stripe={stripePromise}>
                <CheckoutForm 
                  venueId={id}
                  startDate={startDate.toISOString()}
                  endDate={endDate.toISOString()}
                  totalPrice={total}
                  onSuccess={handlePaymentSuccess}
                  onError={handlePaymentError}
                  processingPayment={processingPayment}
                  setProcessingPayment={setProcessingPayment}
                />
              </Elements>
            </div>
          </div>
        </div>
        
        {/* Right Column - Booking Summary */}
        <div className="lg:col-span-1">
          <motion.div 
            className="bg-white rounded-lg shadow-md p-6 sticky top-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-xl font-semibold border-b pb-4 mb-4">Booking Summary</h2>
            
            <div className="flex items-start mb-4">
              <div className="w-20 h-20 bg-gray-200 rounded-md overflow-hidden mr-4">
                {venue.images && venue.images.length > 0 ? (
                  <img src={venue.images[0]} alt={venue.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-300 text-gray-600">
                    No image
                  </div>
                )}
              </div>
              <div>
                <h3 className="font-semibold">{venue.name}</h3>
                <p className="text-gray-600 text-sm">
                  {venue.location ? `${venue.location.city}, ${venue.location.state}` : 'Location not specified'}
                </p>
              </div>
            </div>
            
            <div className="border-t border-b py-4 mb-4">
              <div className="flex justify-between mb-2">
                <span>Check-in</span>
                <span className="font-semibold">{format(startDate, 'MMM dd, yyyy')}</span>
              </div>
              <div className="flex justify-between">
                <span>Check-out</span>
                <span className="font-semibold">{format(endDate, 'MMM dd, yyyy')}</span>
              </div>
            </div>
            
            <div className="mb-4">
              <div className="flex justify-between mb-2">
                <span>${venue.price?.toFixed(2)} x {durationDays} {durationDays === 1 ? 'day' : 'days'}</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span>Service fee</span>
                <span>${serviceFee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg pt-2 border-t">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>
            
            <div className="text-sm text-gray-600">
              <p>By proceeding with the booking, you agree to our <a href="/terms" className="text-blue-600 hover:underline">Terms of Service</a> and <a href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</a>.</p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Booking;
