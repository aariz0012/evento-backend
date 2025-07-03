const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Booking = require('../models/Booking');
const Host = require('../models/Host');
const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');
const sendSMS = require('../utils/sendSMS');

// @desc    Create payment intent
// @route   POST /api/payments/create-payment-intent
// @access  Private (User only)
exports.createPaymentIntent = async (req, res) => {
  try {
    const { bookingId, paymentMethod } = req.body;
    
    // Check if user is a regular user, not a host
    if (req.isHost) {
      return res.status(403).json({
        success: false,
        error: 'Hosts cannot make payments'
      });
    }
    
    // Find booking
    const booking = await Booking.findById(bookingId);
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found'
      });
    }
    
    // Check if user owns the booking
    if (booking.user.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        error: 'Not authorized to make payment for this booking'
      });
    }
    
    // Check if booking is already paid
    if (booking.payment.isPaid) {
      return res.status(400).json({
        success: false,
        error: 'Booking is already paid'
      });
    }
    
    // Check if payment method is online_payment
    if (paymentMethod !== 'online_payment') {
      return res.status(400).json({
        success: false,
        error: 'This endpoint is only for online payments'
      });
    }
    
    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(booking.payment.advanceAmount * 100), // Stripe requires amount in cents
      currency: 'inr',
      metadata: {
        bookingId: booking._id.toString(),
        userId: req.user.id
      }
    });
    
    res.status(200).json({
      success: true,
      clientSecret: paymentIntent.client_secret
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Confirm payment
// @route   POST /api/payments/confirm
// @access  Private (User only)
exports.confirmPayment = async (req, res) => {
  try {
    const { bookingId, transactionId, paymentMethod } = req.body;
    
    // Check if user is a regular user, not a host
    if (req.isHost) {
      return res.status(403).json({
        success: false,
        error: 'Hosts cannot confirm payments'
      });
    }
    
    // Find booking
    const booking = await Booking.findById(bookingId);
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found'
      });
    }
    
    // Check if user owns the booking
    if (booking.user.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        error: 'Not authorized to confirm payment for this booking'
      });
    }
    
    // Check if booking is already paid
    if (booking.payment.isPaid) {
      return res.status(400).json({
        success: false,
        error: 'Booking is already paid'
      });
    }
    
    // Update booking payment status
    booking.payment.isPaid = true;
    booking.payment.transactionId = transactionId;
    booking.payment.paymentDate = Date.now();
    booking.payment.paymentMethod = paymentMethod;
    booking.status = 'confirmed';
    
    await booking.save();
    
    // Send notifications
    // 1. Email to user
    const user = await User.findById(req.user.id);
    await sendEmail({
      email: user.email,
      subject: 'EventO - Payment Confirmation',
      html: `
        <h1>Payment Confirmation</h1>
        <p>Thank you for your payment!</p>
        <p>Booking ID: ${booking._id}</p>
        <p>Event Type: ${booking.eventDetails.eventType}</p>
        <p>Date: ${new Date(booking.eventDetails.startDate).toLocaleDateString()} to ${new Date(booking.eventDetails.endDate).toLocaleDateString()}</p>
        <p>Amount Paid: ${booking.payment.advanceAmount}</p>
        <p>Transaction ID: ${transactionId}</p>
        <p>Your booking is now confirmed. You can view the details in your dashboard.</p>
      `
    });
    
    // 2. SMS to user
    await sendSMS({
      to: user.mobileNumber,
      body: `Payment confirmed for booking ID: ${booking._id}. Amount: ${booking.payment.advanceAmount}, Transaction ID: ${transactionId}. Your booking is now confirmed.`
    });
    
    // 3. Notifications to venue and service providers
    if (booking.venue) {
      const venueHost = await Host.findById(booking.venue);
      
      // Email to venue host
      await sendEmail({
        email: venueHost.email,
        subject: 'EventO - Booking Payment Received',
        html: `
          <h1>Booking Payment Received</h1>
          <p>A payment has been received for a booking at your venue.</p>
          <p>Booking ID: ${booking._id}</p>
          <p>Event Type: ${booking.eventDetails.eventType}</p>
          <p>Date: ${new Date(booking.eventDetails.startDate).toLocaleDateString()} to ${new Date(booking.eventDetails.endDate).toLocaleDateString()}</p>
          <p>Amount Received: ${booking.payment.advanceAmount}</p>
          <p>Transaction ID: ${transactionId}</p>
          <p>The booking is now confirmed. Please check your dashboard for details.</p>
        `
      });
      
      // SMS to venue host
      await sendSMS({
        to: venueHost.mobileNumber,
        body: `Payment received for booking ID: ${booking._id}. Amount: ${booking.payment.advanceAmount}. The booking is now confirmed.`
      });
    }
    
    // 4. Notifications to service providers
    if (booking.services && booking.services.length > 0) {
      for (const service of booking.services) {
        const serviceProvider = await Host.findById(service.serviceProvider);
        
        // Email to service provider
        await sendEmail({
          email: serviceProvider.email,
          subject: 'EventO - Service Payment Received',
          html: `
            <h1>Service Payment Received</h1>
            <p>A payment has been received for your ${service.serviceType} services.</p>
            <p>Booking ID: ${booking._id}</p>
            <p>Event Type: ${booking.eventDetails.eventType}</p>
            <p>Date: ${new Date(booking.eventDetails.startDate).toLocaleDateString()} to ${new Date(booking.eventDetails.endDate).toLocaleDateString()}</p>
            <p>Amount Received: ${service.price}</p>
            <p>Transaction ID: ${transactionId}</p>
            <p>The service is now confirmed. Please check your dashboard for details.</p>
          `
        });
        
        // SMS to service provider
        await sendSMS({
          to: serviceProvider.mobileNumber,
          body: `Payment received for service booking ID: ${booking._id}. Amount: ${service.price}. The service is now confirmed.`
        });
      }
    }
    
    res.status(200).json({
      success: true,
      data: booking
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Stripe webhook handler
// @route   POST /api/payments/webhook
// @access  Public
exports.stripeWebhook = async (req, res) => {
  const signature = req.headers['stripe-signature'];
  
  let event;
  
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  
  // Handle the event
  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object;
    
    // Extract booking ID from metadata
    const { bookingId } = paymentIntent.metadata;
    
    if (bookingId) {
      try {
        // Find booking
        const booking = await Booking.findById(bookingId);
        
        if (booking && !booking.payment.isPaid) {
          // Update booking payment status
          booking.payment.isPaid = true;
          booking.payment.transactionId = paymentIntent.id;
          booking.payment.paymentDate = Date.now();
          booking.status = 'confirmed';
          
          await booking.save();
          
          // Send notifications (similar to confirmPayment function)
          // This is a fallback in case the client-side confirmation fails
        }
      } catch (err) {
        console.error(`Error processing payment success: ${err.message}`);
      }
    }
  }
  
  // Return a 200 response to acknowledge receipt of the event
  res.status(200).json({ received: true });
};

// @desc    Get payment details
// @route   GET /api/payments/:bookingId
// @access  Private
exports.getPaymentDetails = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.bookingId);
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found'
      });
    }
    
    // Check if user is authorized to view payment details
    if (
      (!req.isHost && booking.user.toString() !== req.user.id) &&
      (req.isHost && booking.venue.toString() !== req.host.id && 
       !booking.services.some(service => service.serviceProvider.toString() === req.host.id))
    ) {
      return res.status(401).json({
        success: false,
        error: 'Not authorized to view payment details for this booking'
      });
    }
    
    res.status(200).json({
      success: true,
      data: booking.payment
    });
  } catch (err) {
    console.error(err);
    
    if (err.name === 'CastError') {
      return res.status(404).json({
        success: false,
        error: 'Booking not found'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};
