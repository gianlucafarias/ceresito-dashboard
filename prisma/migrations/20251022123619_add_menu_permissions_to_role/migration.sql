-- AlterTable
ALTER TABLE "Role" ADD COLUMN     "menuPermissions" TEXT[] DEFAULT ARRAY[]::TEXT[];
