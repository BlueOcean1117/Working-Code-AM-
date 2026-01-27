// backend/routes/shipments.js
const router = require("express").Router();
const ctrl = require("../controllers/shipments");
const upload = require("../middleware/upload");

// =======================
// BASIC SHIPMENT ROUTES
// =======================
router.post("/", ctrl.create);
router.put("/:id", ctrl.update);
router.get("/", ctrl.list);
router.get("/:id", ctrl.get);

// =======================
// DASHBOARD
// =======================
router.get("/dashboard/summary", ctrl.dashboard);

// =======================
// EMAIL
// =======================
router.post("/send-mail", ctrl.sendTrackingMail);

// =======================
// BULK UPLOAD (EXCEL)
// =======================
router.post("/bulk-upload", upload.single("file"), ctrl.bulkUpload);

// =======================
// DELIVERY STATUS
// =======================
router.patch("/:id/delivery-status", ctrl.updateDeliveryStatus);

// =======================
// STATUS UPDATE (ACTIVE/CANCELLED)
// =======================
router.patch("/:id/status", ctrl.updateStatus);

// =======================
// MANUAL DESCRIPTION
// =======================
router.put("/:id/manual-desc", ctrl.updateManualDesc);

module.exports = router;
