const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema({
  eventName: {
    type: String,
    required: [true, 'Please add an event name'],
    trim: true,
    maxlength: [100, 'Event name cannot be more than 100 characters']
  },
  eventType: {
    type: String,
    enum: ['wedding', 'birthday', 'family event', 'corporate event', 'conference', 'anniversary', 'graduation', 'other'],
    required: [true, 'Please specify event type']
  },
  numberOfGuests: {
    type: Number,
    required: [true, 'Please specify number of guests'],
    min: [1, 'Number of guests must be at least 1']
  },
  cateringServiceType: {
    type: String,
    enum: ['full service', 'drop-off', 'buffet-style', 'plated service', 'cocktail reception'],
    required: [true, 'Please specify catering service type']
  },
  eventDate: {
    type: Date,
    required: [true, 'Please add an event date']
  },
  startTime: {
    type: String,
    required: [true, 'Please add start time']
  },
  endTime: {
    type: String,
    required: [true, 'Please add end time']
  },
  customer: {
    type: mongoose.Schema.ObjectId,
    ref: 'Customer',
    required: [true, 'Event must be linked to a customer']
  },
  createdBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  company: {
    type: mongoose.Schema.ObjectId,
    ref: 'Company',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Event', EventSchema);