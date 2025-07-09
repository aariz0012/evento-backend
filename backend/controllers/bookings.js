const Booking = require('../models/Booking');
const Host = require('../models/Host');
const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');
const sendSMS = require('../utils/sendSMS');

// @desc    Get all bookings
// @route   GET /api/bookings
// @access  Private
exports.getBookings = async (req, res) => {
  try {
    let query;
    
    // If user is a host, get only bookings for their venue/service
    if (req.isHost) {
      // Find bookings where this host is either the venue or a service provider
      query = {
        $or: [
          { venue: req.host.id },
          { 'services.serviceProvider': req.host.id }
        ]
      };
    } else {
      // Regular users can only see their own bookings
      query = { user: req.user.id };
    }
    
    // Add date filters if provided
    if (req.query.startDate) {
      query['eventDetails.startDate'] = { $gte: new Date(req.query.startDate) };
    }
    
    if (req.query.endDate) {
      query['eventDetails.endDate'] = { $lte: new Date(req.query.endDate) };
    }
    
    // Add status filter if provided
    if (req.query.status) {
      query.status = req.query.status;
    }
    
    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const total = await Booking.countDocuments(query);
    
    // Execute query with pagination
    const bookings = await Booking.find(query)
      .populate({
        path: 'user',
        select: 'fullName email mobileNumber'
      })
      .populate({
        path: 'venue',
        select: 'businessName ownerName email mobileNumber address city'
      })
      .populate({
        path: 'services.serviceProvider',
        select: 'businessName ownerName email mobileNumber hostType'
      })
      .skip(startIndex)
      .limit(limit)
      .sort({ createdAt: -1 });
    
    // Pagination result
    const pagination = {};
    
    if (endIndex < total) {
      pagination.next = {
        page: page + 1,
        limit
      };
    }
    
    if (startIndex > 0) {
      pagination.prev = {
        page: page - 1,
        limit
      };
    }
    
    res.status(200).json({
      success: true,
      count: bookings.length,
      pagination,
      data: bookings
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Get single booking
// @route   GET /api/bookings/:id
// @access  Private
exports.getBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate({
        path: 'user',
        select: 'fullName email mobileNumber'
      })
      .populate({
        path: 'venue',
        select: 'businessName ownerName email mobileNumber address city'
      })
      .populate({
        path: 'services.serviceProvider',
        select: 'businessName ownerName email mobileNumber hostType'
      });
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found'
      });
    }
    
    // Make sure user is booking owner or the host of the venue/service
    if (
      (!req.isHost && booking.user.toString() !== req.user.id) &&
      (req.isHost && booking.venue.toString() !== req.host.id && 
       !booking.services.some(service => service.serviceProvider.toString() === req.host.id))
    ) {
      return res.status(401).json({
        success: false,
        error: 'Not authorized to access this booking'
      });
    }
    
    res.status(200).json({
      success: true,
      data: booking
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

// @desc    Create new booking
// @route   POST /api/bookings
// @access  Private (User only)
exports.createBooking = async (req, res) => {
  try {
    // Check if user is a regular user, not a host
    if (req.isHost) {
      return res.status(403).json({
        success: false,
        error: 'Hosts cannot create bookings'
      });
    }
    
    const {
      venue,
      services,
      eventDetails,
      customerDetails,
      amenities,
      payment
    } = req.body;
    
    // Check if this is a service-only booking
    const isServiceOnly = !venue && services && services.length > 0;
    
    // If venue is provided, check if it exists
    if (venue) {
      const venueExists = await Host.findOne({ 
        _id: venue, 
        hostType: 'venue',
        isVerified: true
      });
      
      if (!venueExists) {
        return res.status(404).json({
          success: false,
          error: 'Venue not found or not verified'
        });
      }
    }
    
    // If services are provided, check if they exist
    if (services && services.length > 0) {
      for (const service of services) {
        const serviceProvider = await Host.findOne({
          _id: service.serviceProvider,
          hostType: service.serviceType === 'catering' ? 'caterer' : 
                   service.serviceType === 'decoration' ? 'decorator' : 'organizer',
          isVerified: true
        });
        
        if (!serviceProvider) {
          return res.status(404).json({
            success: false,
            error: `Service provider not found or not verified: ${service.serviceProvider}`
          });
        }
      }
    }
    
    // Check if booking dates are within 3 months
    const threeMonthsFromNow = new Date();
    threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);
    
    if (new Date(eventDetails.startDate) > threeMonthsFromNow) {
      return res.status(400).json({
        success: false,
        error: 'Bookings can only be made up to 3 months in advance'
      });
    }
    
    // Create booking
    const booking = await Booking.create({
      user: req.user.id,
      venue: venue || undefined,
      services: services || [],
      isServiceOnly,
      eventDetails,
      customerDetails,
      amenities: amenities || [],
      payment,
      status: 'pending'
    });
    
    // Send notifications
    // 1. Email to user
    const user = await User.findById(req.user.id);
    await sendEmail({
      email: user.email,
      subject: 'EventO - Booking Confirmation',
      html: `
        <h1>Booking Confirmation</h1>
        <p>Thank you for your booking with EventO!</p>
        <p>Booking ID: ${booking._id}</p>
        <p>Event Type: ${eventDetails.eventType}</p>
        <p>Date: ${new Date(eventDetails.startDate).toLocaleDateString()} to ${new Date(eventDetails.endDate).toLocaleDateString()}</p>
        <p>Status: Pending</p>
        <p>Total Amount: ${payment.totalAmount}</p>
        <p>Please complete your payment to confirm the booking.</p>
      `
    });
    
    // 2. SMS to user
    await sendSMS({
      to: user.mobileNumber,
      body: `Your booking with EventO (ID: ${booking._id}) has been received and is pending payment. Total: ${payment.totalAmount}`
    });
    
    // 3. Notifications to venue and service providers
    if (venue) {
      const venueHost = await Host.findById(venue);
      
      // Email to venue host
      await sendEmail({
        email: venueHost.email,
        subject: 'EventO - New Booking Request',
        html: `
          <h1>New Booking Request</h1>
          <p>You have received a new booking request for your venue.</p>
          <p>Booking ID: ${booking._id}</p>
          <p>Event Type: ${eventDetails.eventType}</p>
          <p>Date: ${new Date(eventDetails.startDate).toLocaleDateString()} to ${new Date(eventDetails.endDate).toLocaleDateString()}</p>
          <p>Guest Count: ${eventDetails.guestCount}</p>
          <p>Status: Pending</p>
          <p>Please log in to your dashboard to view the details and confirm the booking.</p>
        `
      });
      
      // SMS to venue host
      await sendSMS({
        to: venueHost.mobileNumber,
        body: `New booking request (ID: ${booking._id}) for your venue. Event: ${eventDetails.eventType}, Date: ${new Date(eventDetails.startDate).toLocaleDateString()}, Guests: ${eventDetails.guestCount}`
      });
    }
    
    // 4. Notifications to service providers
    if (services && services.length > 0) {
      for (const service of services) {
        const serviceProvider = await Host.findById(service.serviceProvider);
        
        // Email to service provider
        await sendEmail({
          email: serviceProvider.email,
          subject: 'EventO - New Service Request',
          html: `
            <h1>New Service Request</h1>
            <p>You have received a new request for your ${service.serviceType} services.</p>
            <p>Booking ID: ${booking._id}</p>
            <p>Event Type: ${eventDetails.eventType}</p>
            <p>Date: ${new Date(eventDetails.startDate).toLocaleDateString()} to ${new Date(eventDetails.endDate).toLocaleDateString()}</p>
            <p>Guest Count: ${eventDetails.guestCount}</p>
            <p>Status: Pending</p>
            <p>Please log in to your dashboard to view the details and confirm the service.</p>
          `
        });
        
        // SMS to service provider
        await sendSMS({
          to: serviceProvider.mobileNumber,
          body: `New ${service.serviceType} service request (ID: ${booking._id}). Event: ${eventDetails.eventType}, Date: ${new Date(eventDetails.startDate).toLocaleDateString()}, Guests: ${eventDetails.guestCount}`
        });
      }
    }
    
    // Update booking with notification status
    booking.notifications = {
      emailSent: true,
      smsSent: true,
      callMade: false // Call notifications would be handled separately
    };
    
    await booking.save();
    
    res.status(201).json({
      success: true,
      data: booking
    });
  } catch (err) {
    console.error(err);
    
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(val => val.message);
      
      return res.status(400).json({
        success: false,
        error: messages
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Update booking status
// @route   PUT /api/bookings/:id/status
// @access  Private (Host only for confirm/cancel, User for cancel)
exports.updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!status || !['confirmed', 'cancelled', 'completed'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a valid status (confirmed, cancelled, or completed)'
      });
    }
    
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found'
      });
    }
    
    // Check permissions
    if (req.isHost) {
      // Hosts can only update bookings for their venue or service
      const isVenueOwner = booking.venue && booking.venue.toString() === req.host.id;
      const isServiceProvider = booking.services.some(
        service => service.serviceProvider.toString() === req.host.id
      );
      
      if (!isVenueOwner && !isServiceProvider) {
        return res.status(401).json({
          success: false,
          error: 'Not authorized to update this booking'
        });
      }
    } else {
      // Regular users can only cancel their own bookings
      if (booking.user.toString() !== req.user.id) {
        return res.status(401).json({
          success: false,
          error: 'Not authorized to update this booking'
        });
      }
      
      // Users can only cancel bookings, not confirm or complete them
      if (status !== 'cancelled') {
        return res.status(403).json({
          success: false,
          error: 'Users can only cancel bookings'
        });
      }
    }
    
    // Update booking status
    booking.status = status;
    await booking.save();
    
    // Send notifications about status change
    const user = await User.findById(booking.user);
    
    // Email to user
    await sendEmail({
      email: user.email,
      subject: `EventO - Booking ${status.charAt(0).toUpperCase() + status.slice(1)}`,
      html: `
        <h1>Booking ${status.charAt(0).toUpperCase() + status.slice(1)}</h1>
        <p>Your booking with EventO has been ${status}.</p>
        <p>Booking ID: ${booking._id}</p>
        <p>Event Type: ${booking.eventDetails.eventType}</p>
        <p>Date: ${new Date(booking.eventDetails.startDate).toLocaleDateString()} to ${new Date(booking.eventDetails.endDate).toLocaleDateString()}</p>
        <p>Status: ${status.charAt(0).toUpperCase() + status.slice(1)}</p>
        <p>Please log in to your dashboard for more details.</p>
      `
    });
    
    // SMS to user
    await sendSMS({
      to: user.mobileNumber,
      body: `Your booking (ID: ${booking._id}) has been ${status}. Please check your email for details.`
    });
    
    // If booking was cancelled or completed, notify all involved parties
    if (status === 'cancelled' || status === 'completed') {
      // Notify venue owner
      if (booking.venue) {
        const venueHost = await Host.findById(booking.venue);
        
        await sendEmail({
          email: venueHost.email,
          subject: `EventO - Booking ${status.charAt(0).toUpperCase() + status.slice(1)}`,
          html: `
            <h1>Booking ${status.charAt(0).toUpperCase() + status.slice(1)}</h1>
            <p>A booking for your venue has been ${status}.</p>
            <p>Booking ID: ${booking._id}</p>
            <p>Event Type: ${booking.eventDetails.eventType}</p>
            <p>Date: ${new Date(booking.eventDetails.startDate).toLocaleDateString()} to ${new Date(booking.eventDetails.endDate).toLocaleDateString()}</p>
            <p>Status: ${status.charAt(0).toUpperCase() + status.slice(1)}</p>
            <p>Please log in to your dashboard for more details.</p>
          `
        });
        
        await sendSMS({
          to: venueHost.mobileNumber,
          body: `Booking (ID: ${booking._id}) for your venue has been ${status}. Please check your email for details.`
        });
      }
      
      // Notify service providers
      for (const service of booking.services) {
        const serviceProvider = await Host.findById(service.serviceProvider);
        
        await sendEmail({
          email: serviceProvider.email,
          subject: `EventO - Service Request ${status.charAt(0).toUpperCase() + status.slice(1)}`,
          html: `
            <h1>Service Request ${status.charAt(0).toUpperCase() + status.slice(1)}</h1>
            <p>A service request for your ${service.serviceType} services has been ${status}.</p>
            <p>Booking ID: ${booking._id}</p>
            <p>Event Type: ${booking.eventDetails.eventType}</p>
            <p>Date: ${new Date(booking.eventDetails.startDate).toLocaleDateString()} to ${new Date(booking.eventDetails.endDate).toLocaleDateString()}</p>
            <p>Status: ${status.charAt(0).toUpperCase() + status.slice(1)}</p>
            <p>Please log in to your dashboard for more details.</p>
          `
        });
        
        await sendSMS({
          to: serviceProvider.mobileNumber,
          body: `Service request (ID: ${booking._id}) for your ${service.serviceType} services has been ${status}. Please check your email for details.`
        });
      }
    }
    
    res.status(200).json({
      success: true,
      data: booking
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

// @desc    Delete booking
// @route   DELETE /api/bookings/:id
// @access  Private (Admin only)
exports.deleteBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found'
      });
    }
    
    // Only admin can delete bookings
    if (req.isHost || req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete bookings'
      });
    }
    
    await booking.remove();
    
    res.status(200).json({
      success: true,
      data: {}
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
