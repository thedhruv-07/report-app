const mongoose = require('mongoose');
const InspectionNotice = require('./backend/models/InspectionNotice');
const Task = require('./backend/models/task.model');
const Booking = require('./backend/models/Booking');

mongoose.connect('mongodb://127.0.0.1:27017/report-app', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    try {
      const latestNotice = await InspectionNotice.findOne().sort({ createdAt: -1 }).lean();
      console.log('Latest Notice:', latestNotice.noticeId, 'Status:', latestNotice.status);
      console.log('Team Assignment:', JSON.stringify(latestNotice.teamAssignment));
      
      const tasks = await Task.find({ 'prefillData.noticeId': latestNotice.noticeId }).lean();
      console.log('Created Tasks for this notice:', tasks.length);
      tasks.forEach(t => console.log('Task ID:', t._id, 'Assigned To:', t.assignedInspectorId));

      const bookings = await Booking.find({ onlineBookingId: latestNotice._id }).lean();
      console.log('Created Bookings for this notice:', bookings.length);
    } catch (e) {
      console.error(e);
    } finally {
      mongoose.disconnect();
    }
  });
