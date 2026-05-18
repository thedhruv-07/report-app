const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });

const { Report } = require('./models/report.model');
require('./models/sections/generalInfo.model');
require('./models/sections/quantity.model');
require('./models/sections/workmanship.model');
require('./models/sections/inspection.model');
require('./models/sections/materials.model');
require('./models/sections/safety.model');
require('./models/sections/comments.model');
require('./models/sections/media.model');

async function debugReport() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB");

        const report = await Report.findOne({ reportNumber: "PO-2024-001" })
            .populate('generalInfo')
            .populate('quantityDetails')
            .populate('workmanship')
            .populate('inspection')
            .populate('materials')
            .populate('safety')
            .populate('comments')
            .populate('media');

        if (!report) {
            console.log("Report not found");
            return;
        }

        console.log("REPORT DATA SUMMARY:");
        console.log("ID:", report._id);
        console.log("General Info:", report.generalInfo ? "Populated" : "MISSING");
        console.log("Quantity:", report.quantityDetails ? "Populated" : "MISSING");
        console.log("Workmanship:", report.workmanship ? "Populated" : "MISSING");
        console.log("Inspection:", report.inspection ? "Populated" : "MISSING");
        
        if (report.workmanship) {
            console.log("Workmanship Fields:", Object.keys(report.workmanship.toObject()));
            console.log("Sample Size WM:", report.workmanship.sampleSizeWM);
        }

        if (report.quantityDetails) {
            console.log("Quantity Items Count:", report.quantityDetails.items?.length);
        }

    } catch (error) {
        console.error("Debug Error:", error);
    } finally {
        await mongoose.disconnect();
    }
}

debugReport();
