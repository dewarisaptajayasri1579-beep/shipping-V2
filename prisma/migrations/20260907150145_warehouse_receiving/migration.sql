-- AlterTable
ALTER TABLE "shipments" ADD COLUMN     "actual_warehouse_id" TEXT,
ADD COLUMN     "received_by" TEXT,
ADD COLUMN     "receiving_document_url" TEXT,
ADD COLUMN     "receiving_notes" TEXT;
