const { Photo } = require("../../models/v2/photo.model");
const { ReportV2 } = require("../../models/v2/report.model");
const wasabiService = require("../../services/wasabiService");

// Upload a photo to Wasabi, save metadata, and attach to a report section
const uploadPhoto = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const { reportId, section, caption } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: "No file provided" });
    }
    if (!reportId || !section) {
      return res.status(400).json({ error: "reportId and section are required" });
    }

    // 1. Verify the report exists and belongs to user
    const report = await ReportV2.findOne({ _id: reportId, createdBy: userId });
    if (!report) {
      return res.status(404).json({ error: "Report not found or unauthorized" });
    }

    // 2. Upload to Wasabi
    const uploadRes = await wasabiService.uploadFile(file);

    // 3. Save Photo document
    const newPhoto = new Photo({
      url: uploadRes.url,
      key: uploadRes.key,
      reportId: report._id,
      section: section,
      caption: caption || "",
    });
    await newPhoto.save();

    // 4. Update Report references (Map manipulation)
    // Get the current array for this section, or initialize it
    const currentSectionArray = report.sections.get(section) || [];
    currentSectionArray.push(newPhoto._id);
    
    report.sections.set(section, currentSectionArray);
    await report.save();

    res.status(201).json({
      message: "Photo uploaded and attached successfully",
      photo: newPhoto,
    });
  } catch (error) {
    console.error("V2 Upload Photo Error:", error);
    res.status(500).json({ error: "Failed to upload photo" });
  }
};

// Delete a photo from Wasabi and DB, and remove reference from Report
const deletePhoto = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const { id } = req.params;

    // 1. Find photo
    const photo = await Photo.findById(id);
    if (!photo) {
      return res.status(404).json({ error: "Photo not found" });
    }

    // 2. Check authorization (verify report ownership)
    const report = await ReportV2.findOne({ _id: photo.reportId, createdBy: userId });
    if (!report) {
      return res.status(403).json({ error: "Unauthorized to delete this photo" });
    }

    // 3. Delete from Wasabi
    await wasabiService.deleteFile(photo.key);

    // 4. Delete Photo document
    await Photo.findByIdAndDelete(id);

    // 5. Remove reference from report
    const currentSectionArray = report.sections.get(photo.section) || [];
    const updatedArray = currentSectionArray.filter(
      (pid) => pid.toString() !== id.toString()
    );
    report.sections.set(photo.section, updatedArray);
    await report.save();

    res.json({ message: "Photo deleted successfully" });
  } catch (error) {
    console.error("V2 Delete Photo Error:", error);
    res.status(500).json({ error: "Failed to delete photo" });
  }
};

// Update a photo's metadata (e.g. caption, or change section)
const updatePhoto = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const { id } = req.params;
    const { caption, section } = req.body;

    // Verify ownership
    const oldPhoto = await Photo.findById(id);
    if (!oldPhoto) return res.status(404).json({ error: "Photo not found" });

    const report = await ReportV2.findOne({ _id: oldPhoto.reportId, createdBy: userId });
    if (!report) return res.status(403).json({ error: "Unauthorized" });

    const updateData = {};
    if (caption !== undefined) updateData.caption = caption;

    // If changing section, we need to move the reference in the Report
    if (section && section !== oldPhoto.section) {
      // Remove from old
      const oldArr = report.sections.get(oldPhoto.section) || [];
      report.sections.set(oldPhoto.section, oldArr.filter(pid => pid.toString() !== id.toString()));
      
      // Add to new
      const newArr = report.sections.get(section) || [];
      newArr.push(id);
      report.sections.set(section, newArr);
      
      await report.save();
      updateData.section = section;
    }

    const updatedPhoto = await Photo.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true }
    );

    res.json({ photo: updatedPhoto });
  } catch (error) {
    console.error("V2 Update Photo Error:", error);
    res.status(500).json({ error: "Failed to update photo" });
  }
};

module.exports = {
  uploadPhoto,
  deletePhoto,
  updatePhoto,
};
