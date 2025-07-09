const express = require('express');
const {
  getBookings,
  getBooking,
  createBooking,
  updateBookingStatus,
  deleteBooking
} = require('../controllers/bookings');

const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// All routes are protected
router.use(protect);

router.route('/')
  .get(getBookings)
  .post(authorize('user'), createBooking);

router.route('/:id')
  .get(getBooking);

router.route('/:id/status')
  .put(updateBookingStatus);

router.route('/:id')
  .delete(authorize('admin'), deleteBooking);

module.exports = router;
