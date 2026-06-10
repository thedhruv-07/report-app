const mongoose = require('mongoose');
const InspectionNotice = require('./models/InspectionNotice');
const Task = require('./models/task.model');
const Booking = require('./models/Booking');
const Notification = require('./models/notification.model');

mongoose.connect('mongodb://dhruv:dhruv123@ac-1bhwihz-shard-00-00.nznws77.mongodb.net:27017,ac-1bhwihz-shard-00-01.nznws77.mongodb.net:27017,ac-1bhwihz-shard-00-02.nznws77.mongodb.net:27017/?ssl=true&replicaSet=atlas-5ql6sh-shard-0&authSource=admin&appName=Cluster0')
  .then(async () => {
    try {
      const latestNotice = await InspectionNotice.findOne().sort({ createdAt: -1 }).lean();
      console.log('--- LATEST NOTICE ---');
      console.log('Notice ID:', latestNotice.noticeId);
      console.log('Status:', latestNotice.status);
      console.log('Inspectors assigned:', latestNotice.teamAssignment?.inspectors?.map(i => i.inspectorId || 'NO_ID'));
      console.log('Service Type:', latestNotice.basicInfo?.serviceType);

      const tasks = await Task.find({ 'prefillData.noticeId': latestNotice.noticeId }).lean();
      console.log('\n--- TASKS FOR THIS NOTICE ---');
      console.log('Count:', tasks.length);
      tasks.forEach(t => console.log('Task:', t._id, '| Inspector:', t.assignedInspectorId, '| Status:', t.status));

      const bookings = await Booking.find({ onlineBookingId: latestNotice._id }).lean();
      console.log('\n--- BOOKINGS FOR THIS NOTICE ---');
      console.log('Count:', bookings.length);
      
      console.log('\n--- ALL TASKS FOR INSPECTOR01 ---');
      // inspector01 is usually an ObjectId. We can search by clientName or something to see if any tasks arrived recently
      const recentTasks = await Task.find().sort({createdAt:-1}).limit(5).lean();
      recentTasks.forEach(t => console.log('Task:', t._id, t.clientName, t.assignedInspectorId));

    } catch (e) {
      console.error(e);
    } finally {
      mongoose.disconnect();
    }
  });
