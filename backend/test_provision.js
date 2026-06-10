const mongoose = require('mongoose');
const { provisionFromNotice } = require('./services/noticeToBooking.service');
const InspectionNotice = require('./models/InspectionNotice');

mongoose.connect('mongodb://dhruv:dhruv123@ac-1bhwihz-shard-00-00.nznws77.mongodb.net:27017,ac-1bhwihz-shard-00-01.nznws77.mongodb.net:27017,ac-1bhwihz-shard-00-02.nznws77.mongodb.net:27017/?ssl=true&replicaSet=atlas-5ql6sh-shard-0&authSource=admin&appName=Cluster0')
  .then(async () => {
    try {
      const notice = await InspectionNotice.findOne().sort({ createdAt: -1 });
      console.log('Testing provisionFromNotice for', notice.noticeId);
      
      const res = await provisionFromNotice(notice, notice.createdBy);
      console.log('Result:', res);
    } catch (e) {
      console.error('PROVISION ERROR:', e);
    } finally {
      mongoose.disconnect();
    }
  });
