import { Router } from "express";
import {
  approveProduct,
  deleteAdminProduct,
  createProduct,
  getAdminProducts,
  getAllProducts,
  getCategories,
  getPendingProducts,
  getProductById,
  proposeProduct,
  rejectProduct,
  updateAdminProduct,
} from "../controllers/productController.js";
import { requireAuth, requireRole } from "../middlewares/authMiddleware.js";

const router = Router();

// Public catalog reads (order matters — /categories must win over /:id)
router.get("/", getAllProducts);
router.get("/categories", getCategories);

// Admin-only direct upload
router.post(
  "/admin/upload",
  requireAuth,
  requireRole("Admin"),
  createProduct,
);

// Admin-only proposal review queue
router.get("/admin/pending", requireAuth, requireRole("Admin"), getPendingProducts);
router.get("/admin/all", requireAuth, requireRole("Admin"), getAdminProducts);
router.put("/admin/:id", requireAuth, requireRole("Admin"), updateAdminProduct);
router.delete("/admin/:id", requireAuth, requireRole("Admin"), deleteAdminProduct);

// Supplier-only: propose a new product for admin review
router.put("/supplier/propose", requireAuth, requireRole("Supplier"), proposeProduct);

router.get("/:id", getProductById);

// Admin-only: approve/reject a pending supplier proposal
router.put("/:id/approve", requireAuth, requireRole("Admin"), approveProduct);
router.put("/:id/reject", requireAuth, requireRole("Admin"), rejectProduct);

export default router;
