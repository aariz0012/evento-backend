const Host = require('../models/Host');
const upload = require('../middleware/fileUpload');
const path = require('path');

// @desc    Get all venues
// @route   GET /api/venues
// @access  Public
exports.getVenues = async (req, res) => {
  try {
    // Build query
    let query = { hostType: 'venue' };
    
    // Filter by venue type
    if (req.query.venueType) {
      query.venueType = req.query.venueType;
    }
    
    // Filter by city
    if (req.query.city) {
      query.city = { $regex: req.query.city, $options: 'i' };
    }
    
    // Filter by guest capacity
    if (req.query.minCapacity) {
      query.maxGuestCapacity = { $gte: parseInt(req.query.minCapacity) };
    }
    
    // Filter by services
    if (req.query.services) {
      const servicesArray = req.query.services.split(',');
      query.services = { $in: servicesArray };
    }
    
    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const total = await Host.countDocuments(query);
    
    // Execute query
    const venues = await Host.find(query)
      .skip(startIndex)
      .limit(limit)
      .select('-password -verificationDocuments');
    
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
      count: venues.length,
      pagination,
      data: venues
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Get single venue
// @route   GET /api/venues/:id
// @access  Public
exports.getVenue = async (req, res) => {
  try {
    const venue = await Host.findById(req.params.id).select('-password -verificationDocuments');
    
    if (!venue || venue.hostType !== 'venue') {
      return res.status(404).json({
        success: false,
        error: 'Venue not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: venue
    });
  } catch (err) {
    console.error(err);
    
    if (err.name === 'CastError') {
      return res.status(404).json({
        success: false,
        error: 'Venue not found'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Create venue
// @route   POST /api/venues
// @access  Private (Host only)
exports.createVenue = async (req, res) => {
  try {
    // Check if user is a host
    if (!req.isHost) {
      return res.status(403).json({
        success: false,
        error: 'Only hosts can create venues'
      });
    }
    
    // Create venue (update host record)
    const venue = await Host.findByIdAndUpdate(
      req.host.id,
      { 
        hostType: 'venue',
        ...req.body
      },
      {
        new: true,
        runValidators: true
      }
    );
    
    res.status(201).json({
      success: true,
      data: venue
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

// @desc    Update venue
// @route   PUT /api/venues/:id
// @access  Private (Venue owner only)
exports.updateVenue = async (req, res) => {
  try {
    let venue = await Host.findById(req.params.id);
    
    if (!venue || venue.hostType !== 'venue') {
      return res.status(404).json({
        success: false,
        error: 'Venue not found'
      });
    }
    
    // Make sure user is venue owner
    if (req.isHost && venue._id.toString() !== req.host.id) {
      return res.status(401).json({
        success: false,
        error: 'Not authorized to update this venue'
      });
    }
    
    venue = await Host.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    
    res.status(200).json({
      success: true,
      data: venue
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

// @desc    Upload venue images
// @route   PUT /api/venues/:id/images
// @access  Private (Venue owner only)
exports.uploadVenueImages = async (req, res) => {
  try {
    const venue = await Host.findById(req.params.id);
    
    if (!venue || venue.hostType !== 'venue') {
      return res.status(404).json({
        success: false,
        error: 'Venue not found'
      });
    }
    
    // Make sure user is venue owner
    if (req.isHost && venue._id.toString() !== req.host.id) {
      return res.status(401).json({
        success: false,
        error: 'Not authorized to update this venue'
      });
    }
    
    // Check if venue already has 15 images
    if (venue.images && venue.images.length >= 15) {
      return res.status(400).json({
        success: false,
        error: 'Maximum image limit reached (15 images)'
      });
    }
    
    // Process upload
    upload.array('images', 15 - (venue.images ? venue.images.length : 0))(req, res, async (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          error: err.message
        });
      }
      
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Please upload at least one image'
        });
      }
      
      // Add uploaded images to venue
      const imagePaths = req.files.map(file => file.path);
      
      venue.images = venue.images ? [...venue.images, ...imagePaths] : imagePaths;
      await venue.save();
      
      res.status(200).json({
        success: true,
        data: venue.images
      });
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Upload venue videos
// @route   PUT /api/venues/:id/videos
// @access  Private (Venue owner only)
exports.uploadVenueVideos = async (req, res) => {
  try {
    const venue = await Host.findById(req.params.id);
    
    if (!venue || venue.hostType !== 'venue') {
      return res.status(404).json({
        success: false,
        error: 'Venue not found'
      });
    }
    
    // Make sure user is venue owner
    if (req.isHost && venue._id.toString() !== req.host.id) {
      return res.status(401).json({
        success: false,
        error: 'Not authorized to update this venue'
      });
    }
    
    // Check if venue already has 5 videos
    if (venue.videos && venue.videos.length >= 5) {
      return res.status(400).json({
        success: false,
        error: 'Maximum video limit reached (5 videos)'
      });
    }
    
    // Process upload
    upload.array('videos', 5 - (venue.videos ? venue.videos.length : 0))(req, res, async (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          error: err.message
        });
      }
      
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Please upload at least one video'
        });
      }
      
      // Add uploaded videos to venue
      const videoPaths = req.files.map(file => file.path);
      
      venue.videos = venue.videos ? [...venue.videos, ...videoPaths] : videoPaths;
      await venue.save();
      
      res.status(200).json({
        success: true,
        data: venue.videos
      });
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Upload verification documents
// @route   PUT /api/venues/:id/documents
// @access  Private (Venue owner only)
exports.uploadDocuments = async (req, res) => {
  try {
    const venue = await Host.findById(req.params.id);
    
    if (!venue || venue.hostType !== 'venue') {
      return res.status(404).json({
        success: false,
        error: 'Venue not found'
      });
    }
    
    // Make sure user is venue owner
    if (req.isHost && venue._id.toString() !== req.host.id) {
      return res.status(401).json({
        success: false,
        error: 'Not authorized to update this venue'
      });
    }
    
    // Process upload
    upload.array('documents', 5)(req, res, async (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          error: err.message
        });
      }
      
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Please upload at least one document'
        });
      }
      
      // Add uploaded documents to venue
      const documentPaths = req.files.map(file => file.path);
      
      venue.verificationDocuments = venue.verificationDocuments 
        ? [...venue.verificationDocuments, ...documentPaths] 
        : documentPaths;
        
      await venue.save();
      
      res.status(200).json({
        success: true,
        data: venue.verificationDocuments
      });
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Delete venue
// @route   DELETE /api/venues/:id
// @access  Private (Venue owner or Admin only)
exports.deleteVenue = async (req, res) => {
  try {
    const venue = await Host.findById(req.params.id);
    
    if (!venue || venue.hostType !== 'venue') {
      return res.status(404).json({
        success: false,
        error: 'Venue not found'
      });
    }
    
    // Make sure user is venue owner or admin
    if (
      (req.isHost && venue._id.toString() !== req.host.id) || 
      (!req.isHost && req.user.role !== 'admin')
    ) {
      return res.status(401).json({
        success: false,
        error: 'Not authorized to delete this venue'
      });
    }
    
    await venue.remove();
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};
