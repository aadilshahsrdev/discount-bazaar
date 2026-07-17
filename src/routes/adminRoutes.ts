import { Router } from "express";
import {
  adminCreateSquad,
  adminDispatchSquad,
  adminFinanceLedger,
  adminFinanceOverview,
  adminGetCustomer,
  adminGetSquad,
  adminListCustomers,
  adminListSquads,
  adminToggleSuspendCustomer,
} from "../controllers/adminController.js";
import { requireAuth, requireRole } from "../middlewares/authMiddleware.js";

const router = Router();

// All admin routes require Admin role.
router.use(requireAuth, requireRole("Admin"));

// Squad Operations (Order Management)
router.get("/squads", adminListSquads);
router.get("/squads/:id", adminGetSquad);
router.post("/squads/:id/dispatch", adminDispatchSquad);
router.post("/squads/create", adminCreateSquad);

// Financial Ledger
router.get("/finance/overview", adminFinanceOverview);
router.get("/finance/ledger", adminFinanceLedger);

// Customer Directory
router.get("/customers", adminListCustomers);
router.get("/customers/:id", adminGetCustomer);
router.put("/customers/:id/suspend", adminToggleSuspendCustomer);

export default router;
