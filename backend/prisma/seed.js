"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var client_1 = require("@prisma/client");
// @ts-ignore
var bcryptjs_1 = __importDefault(require("bcryptjs"));
var faker_1 = require("@faker-js/faker");
var prisma = new client_1.PrismaClient({ log: ['error'] });
var NUM_PRODUCTS = 1000;
var NUM_SUPPLIERS = 200;
var NUM_CUSTOMERS = 1000;
var NUM_WAREHOUSES = 10;
var NUM_ORDERS = 5000;
var DAYS_HISTORY = 180;
var BATCH_SIZE = 2500; // Insert in chunks to save memory
var CITIES = ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata', 'Hyderabad', 'Pune', 'Ahmedabad', 'Surat', 'Jaipur'];
var CATEGORIES = [
    { name: 'Electronics', hsn: '8543', gst: 18, minP: 1000, maxP: 150000 },
    { name: 'Apparel', hsn: '6205', gst: 12, minP: 300, maxP: 8000 },
    { name: 'Groceries', hsn: '2106', gst: 5, minP: 20, maxP: 2000 },
    { name: 'Hardware', hsn: '8302', gst: 18, minP: 100, maxP: 10000 },
    { name: 'Furniture', hsn: '9403', gst: 28, minP: 2000, maxP: 80000 },
    { name: 'Auto Parts', hsn: '8708', gst: 28, minP: 500, maxP: 30000 },
    { name: 'Stationery', hsn: '4820', gst: 12, minP: 10, maxP: 1500 },
    { name: 'Medicines', hsn: '3004', gst: 12, minP: 50, maxP: 5000 },
    { name: 'Sports', hsn: '9506', gst: 18, minP: 200, maxP: 15000 },
    { name: 'Toys', hsn: '9503', gst: 18, minP: 150, maxP: 8000 },
];
function chunkedInsert(model, data, label) {
    return __awaiter(this, void 0, void 0, function () {
        var count, i, chunk;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    count = 0;
                    i = 0;
                    _a.label = 1;
                case 1:
                    if (!(i < data.length)) return [3 /*break*/, 4];
                    chunk = data.slice(i, i + BATCH_SIZE);
                    return [4 /*yield*/, model.createMany({ data: chunk, skipDuplicates: true })];
                case 2:
                    _a.sent();
                    count += chunk.length;
                    console.log("Inserted ".concat(count, "/").concat(data.length, " ").concat(label, "..."));
                    _a.label = 3;
                case 3:
                    i += BATCH_SIZE;
                    return [3 /*break*/, 1];
                case 4: return [2 /*return*/];
            }
        });
    });
}
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var now, startDate, pass, admin, manager, _a, _b, staff, _c, _d, users, warehouses, i, _e, _f, dbCategories, _i, CATEGORIES_1, cat, _g, _h, suppliersData, customersData, productsData, _loop_1, i, inventoryData, _j, productsData_1, p, isFastMoving, numWh, selectedWh, _k, selectedWh_1, wh, qty, ordersData, orderItemsData, stockMovementsData, activityLogsData, orderCount, i, daysAgo, orderDate, seasonality, isSales, oId, invNum, status_1, oItemsCount, oProducts, subtotal, taxAmount, _l, oProducts_1, p, isFast, baseQty, qty, price, lineTotal, lineTax, total, notifsData, aiReportsData;
        var _m, _o, _p, _q;
        return __generator(this, function (_r) {
            switch (_r.label) {
                case 0:
                    console.log('🌱 Starting GodownMax Enterprise Seeding...');
                    now = new Date();
                    startDate = new Date(now.getTime() - DAYS_HISTORY * 24 * 60 * 60 * 1000);
                    // 1. Clear existing data
                    console.log('Cleaning database...');
                    return [4 /*yield*/, prisma.$transaction([
                            prisma.activityLog.deleteMany(),
                            prisma.aIReport.deleteMany(),
                            prisma.notification.deleteMany(),
                            prisma.stockMovement.deleteMany(),
                            prisma.orderItem.deleteMany(),
                            prisma.order.deleteMany(),
                            prisma.inventoryItem.deleteMany(),
                            prisma.batchLot.deleteMany(),
                            prisma.product.deleteMany(),
                            prisma.category.deleteMany(),
                            prisma.customer.deleteMany(),
                            prisma.supplier.deleteMany(),
                            prisma.warehouse.deleteMany(),
                            prisma.user.deleteMany(),
                            prisma.systemSetting.deleteMany(),
                        ])];
                case 1:
                    _r.sent();
                    // 2. Users
                    console.log('Creating users...');
                    return [4 /*yield*/, bcryptjs_1.default.hash('Admin@123', 10)];
                case 2:
                    pass = _r.sent();
                    return [4 /*yield*/, prisma.user.create({
                            data: { name: 'Admin User', email: 'admin@godownmax.com', password: pass, role: client_1.Role.ADMIN },
                        })];
                case 3:
                    admin = _r.sent();
                    _b = (_a = prisma.user).create;
                    _m = {};
                    _o = { name: 'Manager User', email: 'manager@godownmax.com' };
                    return [4 /*yield*/, bcryptjs_1.default.hash('Manager@123', 10)];
                case 4: return [4 /*yield*/, _b.apply(_a, [(_m.data = (_o.password = _r.sent(), _o.role = client_1.Role.MANAGER, _o),
                            _m)])];
                case 5:
                    manager = _r.sent();
                    _d = (_c = prisma.user).create;
                    _p = {};
                    _q = { name: 'Staff User', email: 'staff@godownmax.com' };
                    return [4 /*yield*/, bcryptjs_1.default.hash('Staff@123', 10)];
                case 6: return [4 /*yield*/, _d.apply(_c, [(_p.data = (_q.password = _r.sent(), _q.role = client_1.Role.STAFF, _q),
                            _p)])];
                case 7:
                    staff = _r.sent();
                    users = [admin, manager, staff];
                    // 3. System Settings
                    return [4 /*yield*/, prisma.systemSetting.create({
                            data: {
                                key: 'GENERAL_SETTINGS',
                                value: { currency: 'INR', timezone: 'Asia/Kolkata', companyName: 'GodownMax Pvt Ltd' }
                            }
                        })];
                case 8:
                    // 3. System Settings
                    _r.sent();
                    // 4. Warehouses
                    console.log('Creating warehouses...');
                    warehouses = [];
                    i = 0;
                    _r.label = 9;
                case 9:
                    if (!(i < NUM_WAREHOUSES)) return [3 /*break*/, 12];
                    _f = (_e = warehouses).push;
                    return [4 /*yield*/, prisma.warehouse.create({
                            data: {
                                name: "GodownMax ".concat(CITIES[i], " Hub"),
                                code: "WH-".concat(CITIES[i].substring(0, 3).toUpperCase(), "-01"),
                                address: faker_1.fakerEN_IN.location.streetAddress(),
                                city: CITIES[i],
                                country: 'India',
                                managerId: manager.id,
                            }
                        })];
                case 10:
                    _f.apply(_e, [_r.sent()]);
                    _r.label = 11;
                case 11:
                    i++;
                    return [3 /*break*/, 9];
                case 12:
                    // 5. Categories
                    console.log('Creating categories...');
                    dbCategories = [];
                    _i = 0, CATEGORIES_1 = CATEGORIES;
                    _r.label = 13;
                case 13:
                    if (!(_i < CATEGORIES_1.length)) return [3 /*break*/, 16];
                    cat = CATEGORIES_1[_i];
                    _h = (_g = dbCategories).push;
                    return [4 /*yield*/, prisma.category.create({
                            data: { name: cat.name, slug: cat.name.toLowerCase().replace(' ', '-'), description: "All ".concat(cat.name, " products") }
                        })];
                case 14:
                    _h.apply(_g, [_r.sent()]);
                    _r.label = 15;
                case 15:
                    _i++;
                    return [3 /*break*/, 13];
                case 16:
                    // 6. Suppliers & Customers
                    console.log('Creating suppliers and customers...');
                    suppliersData = Array.from({ length: NUM_SUPPLIERS }).map(function () { return ({
                        id: faker_1.fakerEN_IN.string.uuid(),
                        name: faker_1.fakerEN_IN.company.name() + ' Pvt Ltd',
                        email: faker_1.fakerEN_IN.internet.email(),
                        phone: faker_1.fakerEN_IN.phone.number(),
                        address: faker_1.fakerEN_IN.location.streetAddress(),
                        city: faker_1.fakerEN_IN.helpers.arrayElement(CITIES),
                        country: 'India',
                        gstin: "27".concat(faker_1.fakerEN_IN.string.alphanumeric({ length: 10, casing: 'upper' }), "1Z").concat(faker_1.fakerEN_IN.string.alphanumeric(1).toUpperCase()),
                        rating: faker_1.fakerEN_IN.number.float({ min: 3, max: 5, multipleOf: 0.1 }),
                    }); });
                    return [4 /*yield*/, chunkedInsert(prisma.supplier, suppliersData, 'suppliers')];
                case 17:
                    _r.sent();
                    customersData = Array.from({ length: NUM_CUSTOMERS }).map(function () { return ({
                        id: faker_1.fakerEN_IN.string.uuid(),
                        name: faker_1.fakerEN_IN.company.name() + (faker_1.fakerEN_IN.datatype.boolean() ? ' Enterprises' : ' Traders'),
                        email: faker_1.fakerEN_IN.internet.email(),
                        phone: faker_1.fakerEN_IN.phone.number(),
                        address: faker_1.fakerEN_IN.location.streetAddress(),
                        city: faker_1.fakerEN_IN.helpers.arrayElement(CITIES),
                        country: 'India',
                        gstin: "27".concat(faker_1.fakerEN_IN.string.alphanumeric({ length: 10, casing: 'upper' }), "1Z").concat(faker_1.fakerEN_IN.string.alphanumeric(1).toUpperCase()),
                        creditLimit: faker_1.fakerEN_IN.number.int({ min: 10000, max: 500000 }),
                    }); });
                    return [4 /*yield*/, chunkedInsert(prisma.customer, customersData, 'customers')];
                case 18:
                    _r.sent();
                    // 7. Products
                    console.log('Creating products...');
                    productsData = [];
                    _loop_1 = function (i) {
                        var cat = faker_1.fakerEN_IN.helpers.arrayElement(CATEGORIES);
                        var dbCat = dbCategories.find(function (c) { return c.name === cat.name; });
                        var isFastMoving = faker_1.fakerEN_IN.number.int({ min: 1, max: 10 }) <= 2; // 20% are fast moving
                        var cost = faker_1.fakerEN_IN.number.int({ min: cat.minP, max: cat.maxP });
                        var selling = cost * faker_1.fakerEN_IN.number.float({ min: 1.1, max: 1.6 });
                        productsData.push({
                            id: faker_1.fakerEN_IN.string.uuid(),
                            name: "".concat(faker_1.fakerEN_IN.commerce.productAdjective(), " ").concat(faker_1.fakerEN_IN.commerce.productMaterial(), " ").concat(cat.name.replace(' ', '')),
                            sku: "SKU-".concat(faker_1.fakerEN_IN.string.alphanumeric(8).toUpperCase()),
                            categoryId: dbCat.id,
                            costPrice: Math.round(cost),
                            sellingPrice: Math.round(selling),
                            taxRate: cat.gst,
                            hsnCode: cat.hsn,
                            minStockLevel: isFastMoving ? 100 : 10,
                            maxStockLevel: isFastMoving ? 2000 : 100,
                            reorderPoint: isFastMoving ? 200 : 20,
                            reorderQuantity: isFastMoving ? 500 : 50,
                            supplierId: faker_1.fakerEN_IN.helpers.arrayElement(suppliersData).id,
                            unit: faker_1.fakerEN_IN.helpers.arrayElement(['pcs', 'kg', 'box']),
                        });
                    };
                    for (i = 0; i < NUM_PRODUCTS; i++) {
                        _loop_1(i);
                    }
                    return [4 /*yield*/, chunkedInsert(prisma.product, productsData, 'products')];
                case 19:
                    _r.sent();
                    // 8. Inventory Items
                    console.log('Generating initial inventory distribution...');
                    inventoryData = [];
                    for (_j = 0, productsData_1 = productsData; _j < productsData_1.length; _j++) {
                        p = productsData_1[_j];
                        isFastMoving = p.minStockLevel === 100;
                        numWh = faker_1.fakerEN_IN.number.int({ min: 3, max: 6 });
                        selectedWh = faker_1.fakerEN_IN.helpers.arrayElements(warehouses, numWh);
                        for (_k = 0, selectedWh_1 = selectedWh; _k < selectedWh_1.length; _k++) {
                            wh = selectedWh_1[_k];
                            qty = isFastMoving
                                ? faker_1.fakerEN_IN.number.int({ min: 50, max: 1500 })
                                : faker_1.fakerEN_IN.number.int({ min: 0, max: 80 });
                            inventoryData.push({
                                id: faker_1.fakerEN_IN.string.uuid(),
                                productId: p.id,
                                warehouseId: wh.id,
                                quantity: qty,
                                availableQty: qty,
                                reservedQty: 0,
                            });
                        }
                    }
                    return [4 /*yield*/, chunkedInsert(prisma.inventoryItem, inventoryData, 'inventory_items')];
                case 20:
                    _r.sent();
                    // 9. Orders & History (The heavy part)
                    console.log('Generating 180 days of historical orders...');
                    ordersData = [];
                    orderItemsData = [];
                    stockMovementsData = [];
                    activityLogsData = [];
                    orderCount = 0;
                    // We want to generate ~NUM_ORDERS over 180 days.
                    // Add some seasonality: Middle of the period (say month 3) has higher volume.
                    for (i = 0; i < NUM_ORDERS; i++) {
                        daysAgo = faker_1.fakerEN_IN.number.int({ min: 0, max: DAYS_HISTORY });
                        orderDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
                        seasonality = Math.sin((daysAgo / DAYS_HISTORY) * Math.PI);
                        isSales = faker_1.fakerEN_IN.number.int({ min: 1, max: 100 }) <= 85;
                        oId = faker_1.fakerEN_IN.string.uuid();
                        invNum = "GMX-".concat(orderDate.getFullYear(), "-").concat(String(orderCount++).padStart(6, '0'));
                        status_1 = daysAgo < 2 ? faker_1.fakerEN_IN.helpers.arrayElement([client_1.OrderStatus.PENDING, client_1.OrderStatus.PROCESSING]) : client_1.OrderStatus.DELIVERED;
                        oItemsCount = faker_1.fakerEN_IN.number.int({ min: 1, max: 5 });
                        oProducts = faker_1.fakerEN_IN.helpers.arrayElements(productsData, oItemsCount);
                        subtotal = 0;
                        taxAmount = 0;
                        for (_l = 0, oProducts_1 = oProducts; _l < oProducts_1.length; _l++) {
                            p = oProducts_1[_l];
                            isFast = p.minStockLevel === 100;
                            baseQty = isFast ? faker_1.fakerEN_IN.number.int({ min: 10, max: 100 }) : faker_1.fakerEN_IN.number.int({ min: 1, max: 10 });
                            qty = Math.max(1, Math.floor(baseQty * (0.5 + seasonality)));
                            price = isSales ? p.sellingPrice : p.costPrice;
                            lineTotal = qty * price;
                            lineTax = lineTotal * (p.taxRate / 100);
                            subtotal += lineTotal;
                            taxAmount += lineTax;
                            orderItemsData.push({
                                id: faker_1.fakerEN_IN.string.uuid(),
                                orderId: oId,
                                productId: p.id,
                                quantity: qty,
                                unitPrice: price,
                                taxRate: p.taxRate,
                                discount: 0,
                                total: lineTotal + lineTax
                            });
                            if (status_1 === client_1.OrderStatus.DELIVERED) {
                                stockMovementsData.push({
                                    id: faker_1.fakerEN_IN.string.uuid(),
                                    productId: p.id,
                                    type: isSales ? client_1.StockMovementType.OUT : client_1.StockMovementType.IN,
                                    quantity: qty,
                                    fromWarehouseId: isSales ? faker_1.fakerEN_IN.helpers.arrayElement(warehouses).id : null,
                                    toWarehouseId: isSales ? null : faker_1.fakerEN_IN.helpers.arrayElement(warehouses).id,
                                    reference: invNum,
                                    userId: admin.id,
                                    createdAt: orderDate
                                });
                            }
                        }
                        total = subtotal + taxAmount;
                        ordersData.push({
                            id: oId,
                            orderNumber: invNum,
                            invoiceNumber: invNum,
                            type: isSales ? client_1.OrderType.SALES : client_1.OrderType.PURCHASE,
                            status: status_1,
                            userId: admin.id,
                            supplierId: isSales ? null : faker_1.fakerEN_IN.helpers.arrayElement(suppliersData).id,
                            customerId: isSales ? faker_1.fakerEN_IN.helpers.arrayElement(customersData).id : null,
                            subtotal: subtotal,
                            taxAmount: taxAmount,
                            total: total,
                            paidAmount: total,
                            createdAt: orderDate,
                            updatedAt: orderDate,
                            deliveredAt: status_1 === client_1.OrderStatus.DELIVERED ? orderDate : null
                        });
                        // 10. Generate corresponding activity logs
                        activityLogsData.push({
                            id: faker_1.fakerEN_IN.string.uuid(),
                            userId: faker_1.fakerEN_IN.helpers.arrayElement(users).id,
                            action: 'CREATED',
                            entity: 'Order',
                            entityId: oId,
                            createdAt: orderDate
                        });
                        if (status_1 === client_1.OrderStatus.DELIVERED) {
                            activityLogsData.push({
                                id: faker_1.fakerEN_IN.string.uuid(),
                                userId: admin.id,
                                action: 'UPDATED',
                                entity: 'Order',
                                entityId: oId,
                                newValue: { status: 'DELIVERED' },
                                createdAt: orderDate
                            });
                        }
                    }
                    console.log('Inserting orders...');
                    return [4 /*yield*/, chunkedInsert(prisma.order, ordersData, 'orders')];
                case 21:
                    _r.sent();
                    console.log('Inserting order items...');
                    return [4 /*yield*/, chunkedInsert(prisma.orderItem, orderItemsData, 'order items')];
                case 22:
                    _r.sent();
                    console.log('Inserting stock movements...');
                    return [4 /*yield*/, chunkedInsert(prisma.stockMovement, stockMovementsData, 'stock movements')];
                case 23:
                    _r.sent();
                    console.log('Inserting activity logs...');
                    return [4 /*yield*/, chunkedInsert(prisma.activityLog, activityLogsData, 'activity logs')];
                case 24:
                    _r.sent();
                    // 11. Generate Notifications
                    console.log('Generating notifications...');
                    notifsData = Array.from({ length: 5000 }).map(function () {
                        var daysAgo = faker_1.fakerEN_IN.number.int({ min: 0, max: DAYS_HISTORY });
                        return {
                            id: faker_1.fakerEN_IN.string.uuid(),
                            userId: admin.id,
                            type: faker_1.fakerEN_IN.helpers.arrayElement(Object.values(client_1.NotificationType)),
                            title: 'System Alert',
                            message: faker_1.fakerEN_IN.lorem.sentence(),
                            isRead: faker_1.fakerEN_IN.datatype.boolean(),
                            createdAt: new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000)
                        };
                    });
                    return [4 /*yield*/, chunkedInsert(prisma.notification, notifsData, 'notifications')];
                case 25:
                    _r.sent();
                    // 12. Generate AI Reports
                    console.log('Generating AI Reports...');
                    aiReportsData = Array.from({ length: 500 }).map(function () {
                        var daysAgo = faker_1.fakerEN_IN.number.int({ min: 0, max: DAYS_HISTORY });
                        return {
                            id: faker_1.fakerEN_IN.string.uuid(),
                            userId: admin.id,
                            type: faker_1.fakerEN_IN.helpers.arrayElement(['inventory_analysis', 'demand_prediction', 'sales_forecast']),
                            result: { summary: "AI identified seasonal patterns indicating a 20% spike in electronics for the upcoming month." },
                            createdAt: new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000)
                        };
                    });
                    return [4 /*yield*/, chunkedInsert(prisma.aIReport, aiReportsData, 'AI reports')];
                case 26:
                    _r.sent();
                    console.log('✅ GodownMax Enterprise DB Seeding Complete!');
                    return [2 /*return*/];
            }
        });
    });
}
main()
    .catch(function (e) {
    console.error(e);
    process.exit(1);
})
    .finally(function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, prisma.$disconnect()];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); });
