-- AlterTable
ALTER TABLE "supplier_invoices" ADD COLUMN     "due_date" DATE,
ADD COLUMN     "payment_date" DATE,
ADD COLUMN     "payment_status" TEXT NOT NULL DEFAULT 'BELUM DIBAYAR';
