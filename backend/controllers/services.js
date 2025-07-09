const Host = require('../models/Host');
const upload = require('../middleware/fileUpload');

// @desc    Get all service providers
// @route   GET /api/services
// @access  Public
exports.getServiceProviders = async (req, res) => {
  try {
    // Build query
    let query = { 
      hostType: { $in: ['caterer', 'decorator', 'organizer'] }
    };
    
    // Filter by specific host type
    if (req.query.type && ['caterer', 'decorator', 'organizer'].includes(req.query.type)) {
      query.hostType = req.query.type;
    }
    
    // Filter by city
    if (req.query.city) {
      query.city = { $regex: req.query.city, $options: 'i' };
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
    const serviceProviders = await Host.find(query)
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
      count: serviceProviders.length,
      pagination,
      data: serviceProviders
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Get single service provider
// @route   GET /api/services/:id
// @access  Public
exports.getServiceProvider = async (req, res) => {
  try {
    const serviceProvider = await Host.findById(req.params.id)
      .select('-password -verificationDocuments');
    
    if (!serviceProvider || !['caterer', 'decorator', 'organizer'].includes(serviceProvider.hostType)) {
      return res.status(404).json({
        success: false,
        error: 'Service provider not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: serviceProvider
    });
  } catch (err) {
    console.error(err);
    
    if (err.name === 'CastError') {
      return res.status(404).json({
        success: false,
        error: 'Service provider not found'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Update service provider
// @route   PUT /api/services/:id
// @access  Private (Service provider only)
exports.updateServiceProvider = async (req, res) => {
  try {
    let serviceProvider = await Host.findById(req.params.id);
    
    if (!serviceProvider || !['caterer', 'decorator', 'organizer'].includes(serviceProvider.hostType)) {
      return res.status(404).json({
        success: false,
        error: 'Service provider not found'
      });
    }
    
    // Make sure user is the service provider
    if (req.isHost && serviceProvider._id.toString() !== req.host.id) {
      return res.status(401).json({
        success: false,
        error: 'Not authorized to update this service provider'
      });
    }
    
    serviceProvider = await Host.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    
    res.status(200).json({
      success: true,
      data: serviceProvider
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

// @desc    Upload service provider images
// @route   PUT /api/services/:id/images
// @access  Private (Service provider only)
exports.uploadServiceImages = async (req, res) => {
  try {
    const serviceProvider = await Host.findById(req.params.id);
    
    if (!serviceProvider || !['caterer', 'decorator', 'organizer'].includes(serviceProvider.hostType)) {
      return res.status(404).json({
        success: false,
        error: 'Service provider not found'
      });
    }
    
    // Make sure user is the service provider
    if (req.isHost && serviceProvider._id.toString() !== req.host.id) {
      return res.status(401).json({
        success: false,
        error: 'Not authorized to update this service provider'
      });
    }
    
    // Check if service provider already has 15 images
    if (serviceProvider.images && serviceProvider.images.length >= 15) {
      return res.status(400).json({
        success: false,
        error: 'Maximum image limit reached (15 images)'
      });
    }
    
    // Process upload
    upload.array('images', 15 - (serviceProvider.images ? serviceProvider.images.length : 0))(req, res, async (err) => {
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
      
      // Add uploaded images to service provider
      const imagePaths = req.files.map(file => file.path);
      
      serviceProvider.images = serviceProvider.images ? [...serviceProvider.images, ...imagePaths] : imagePaths;
      await serviceProvider.save();
      
      res.status(200).json({
        success: true,
        data: serviceProvider.images
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

// @desc    Add menu item (for caterers)
// @route   POST /api/services/:id/menu
// @access  Private (Caterer only)
exports.addMenuItem = async (req, res) => {
  try {
    const caterer = await Host.findById(req.params.id);
    
    if (!caterer || caterer.hostType !== 'caterer') {
      return res.status(404).json({
        success: false,
        error: 'Caterer not found'
      });
    }
    
    // Make sure user is the caterer
    if (req.isHost && caterer._id.toString() !== req.host.id) {
      return res.status(401).json({
        success: false,
        error: 'Not authorized to update this caterer'
      });
    }
    
    // Add menu item
    const { category, name, description, price, isVegetarian } = req.body;
    
    if (!category || !name || !price) {
      return res.status(400).json({
        success: false,
        error: 'Please provide category, name, and price for the menu item'
      });
    }
    
    const menuItem = {
      category,
      name,
      description: description || '',
      price: parseFloat(price),
      isVegetarian: isVegetarian || false
    };
    
    caterer.menuItems = caterer.menuItems ? [...caterer.menuItems, menuItem] : [menuItem];
    
    // Update menu options
    if (isVegetarian) {
      caterer.menuOptions.vegetarian = true;
    } else {
      caterer.menuOptions.nonVegetarian = true;
    }
    
    await caterer.save();
    
    res.status(201).json({
      success: true,
      data: caterer.menuItems
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

// @desc    Add decoration category (for decorators)
// @route   POST /api/services/:id/decoration-category
// @access  Private (Decorator only)
exports.addDecorationCategory = async (req, res) => {
  try {
    const decorator = await Host.findById(req.params.id);
    
    if (!decorator || decorator.hostType !== 'decorator') {
      return res.status(404).json({
        success: false,
        error: 'Decorator not found'
      });
    }
    
    // Make sure user is the decorator
    if (req.isHost && decorator._id.toString() !== req.host.id) {
      return res.status(401).json({
        success: false,
        error: 'Not authorized to update this decorator'
      });
    }
    
    // Add decoration category
    const { name, description, pricePerSqFt, packagePrice } = req.body;
    
    if (!name || (!pricePerSqFt && !packagePrice)) {
      return res.status(400).json({
        success: false,
        error: 'Please provide name and either pricePerSqFt or packagePrice'
      });
    }
    
    const decorationCategory = {
      name,
      description: description || '',
      pricePerSqFt: pricePerSqFt ? parseFloat(pricePerSqFt) : undefined,
      packagePrice: packagePrice ? parseFloat(packagePrice) : undefined
    };
    
    decorator.decorationCategories = decorator.decorationCategories 
      ? [...decorator.decorationCategories, decorationCategory] 
      : [decorationCategory];
    
    await decorator.save();
    
    res.status(201).json({
      success: true,
      data: decorator.decorationCategories
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

// @desc    Add organizer service (for organizers)
// @route   POST /api/services/:id/organizer-service
// @access  Private (Organizer only)
exports.addOrganizerService = async (req, res) => {
  try {
    const organizer = await Host.findById(req.params.id);
    
    if (!organizer || organizer.hostType !== 'organizer') {
      return res.status(404).json({
        success: false,
        error: 'Organizer not found'
      });
    }
    
    // Make sure user is the organizer
    if (req.isHost && organizer._id.toString() !== req.host.id) {
      return res.status(401).json({
        success: false,
        error: 'Not authorized to update this organizer'
      });
    }
    
    // Add organizer service
    const { name, description, pricePerGuest } = req.body;
    
    if (!name || !pricePerGuest) {
      return res.status(400).json({
        success: false,
        error: 'Please provide name and pricePerGuest'
      });
    }
    
    const organizerService = {
      name,
      description: description || '',
      pricePerGuest: parseFloat(pricePerGuest)
    };
    
    organizer.organizerServices = organizer.organizerServices 
      ? [...organizer.organizerServices, organizerService] 
      : [organizerService];
    
    await organizer.save();
    
    res.status(201).json({
      success: true,
      data: organizer.organizerServices
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

// @desc    Update availability
// @route   PUT /api/services/:id/availability
// @access  Private (Service provider only)
exports.updateAvailability = async (req, res) => {
  try {
    const serviceProvider = await Host.findById(req.params.id);
    
    if (!serviceProvider || !['caterer', 'decorator', 'organizer'].includes(serviceProvider.hostType)) {
      return res.status(404).json({
        success: false,
        error: 'Service provider not found'
      });
    }
    
    // Make sure user is the service provider
    if (req.isHost && serviceProvider._id.toString() !== req.host.id) {
      return res.status(401).json({
        success: false,
        error: 'Not authorized to update this service provider'
      });
    }
    
    // Update availability
    const { availability } = req.body;
    
    if (!availability || !Array.isArray(availability)) {
      return res.status(400).json({
        success: false,
        error: 'Please provide availability as an array'
      });
    }
    
    serviceProvider.availability = availability;
    await serviceProvider.save();
    
    res.status(200).json({
      success: true,
      data: serviceProvider.availability
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
