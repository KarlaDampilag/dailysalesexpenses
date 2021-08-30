"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var prisma_lib_1 = require("prisma-client-lib");
var typeDefs = require("./prisma-schema").typeDefs;

var models = [
  {
    name: "Permission",
    embedded: false
  },
  {
    name: "User",
    embedded: false
  },
  {
    name: "Product",
    embedded: false
  },
  {
    name: "Category",
    embedded: false
  },
  {
    name: "Inventory",
    embedded: false
  },
  {
    name: "InventoryItem",
    embedded: false
  },
  {
    name: "InventoryItemTransactionAction",
    embedded: false
  },
  {
    name: "InventoryItemTransaction",
    embedded: false
  },
  {
    name: "Customer",
    embedded: false
  },
  {
    name: "SpecialSaleDeductionType",
    embedded: false
  },
  {
    name: "Sale",
    embedded: false
  },
  {
    name: "SaleItem",
    embedded: false
  },
  {
    name: "Expense",
    embedded: false
  }
];
exports.Prisma = prisma_lib_1.makePrismaClientClass({
  typeDefs,
  models,
  endpoint: `https://us1.prisma.sh/karla-dampilag-e82c27/heck-server/dev`
});
exports.prisma = new exports.Prisma();
