const express = require("express");
const {
  fetchDashboardSummary,
  addShipment,
  updateDeliveryStatus,
  updateManualDesc,
  updateShipment,
  bulkUploadShipments,
  getEnquiryNumber,
  fetchAllShipments,
} = require("../controllers/shipment.controller");
const router = express.Router();

router.get("/dashboard/summary", fetchDashboardSummary);
router.post("/", addShipment);
router.patch("/:id", updateShipment);
router.patch("/delivery-status/:id", updateDeliveryStatus);
router.patch("/manual-desc/:id", updateManualDesc);
router.post("/bulk-upload", bulkUploadShipments);
router.get("/enquiry-number", getEnquiryNumber);
router.get("/", fetchAllShipments)

module.exports = router;
