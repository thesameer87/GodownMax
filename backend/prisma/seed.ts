import { PrismaClient, Role, OrderStatus, OrderType, StockMovementType, NotificationType } from '@prisma/client';
// @ts-ignore
import bcrypt from 'bcryptjs';
import { fakerEN_IN as faker } from '@faker-js/faker';

const prisma = new PrismaClient({ log: ['error'] });

const NUM_PRODUCTS = 1000;
const NUM_SUPPLIERS = 200;
const NUM_CUSTOMERS = 1000;
const NUM_WAREHOUSES = 10;
const NUM_ORDERS = 5000;
const DAYS_HISTORY = 180;
const BATCH_SIZE = 2500; // Insert in chunks to save memory

const CITIES = ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata', 'Hyderabad', 'Pune', 'Ahmedabad', 'Surat', 'Jaipur'];
const CATEGORIES = [
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

async function chunkedInsert(model: any, data: any[], label: string) {
  let count = 0;
  for (let i = 0; i < data.length; i += BATCH_SIZE) {
    const chunk = data.slice(i, i + BATCH_SIZE);
    await model.createMany({ data: chunk, skipDuplicates: true });
    count += chunk.length;
    console.log(`Inserted ${count}/${data.length} ${label}...`);
  }
}

async function main() {
  console.log('🌱 Starting GodownMax Enterprise Seeding...');
  const now = new Date();
  const startDate = new Date(now.getTime() - DAYS_HISTORY * 24 * 60 * 60 * 1000);

  // 1. Clear existing data
  console.log('Cleaning database...');
  await prisma.$transaction([
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
  ]);

  // 2. Users
  console.log('Creating users...');
  const pass = await bcrypt.hash('Admin@123', 10);
  const admin = await prisma.user.create({
    data: { name: 'Admin User', email: 'admin@godownmax.com', password: pass, role: Role.ADMIN },
  });
  const manager = await prisma.user.create({
    data: { name: 'Manager User', email: 'manager@godownmax.com', password: await bcrypt.hash('Manager@123', 10), role: Role.MANAGER },
  });
  const staff = await prisma.user.create({
    data: { name: 'Staff User', email: 'staff@godownmax.com', password: await bcrypt.hash('Staff@123', 10), role: Role.STAFF },
  });
  const users = [admin, manager, staff];

  // 3. System Settings
  await prisma.systemSetting.create({
    data: {
      key: 'GENERAL_SETTINGS',
      value: { currency: 'INR', timezone: 'Asia/Kolkata', companyName: 'GodownMax Pvt Ltd' }
    }
  });

  // 4. Warehouses
  console.log('Creating warehouses...');
  const warehouses = [];
  for (let i = 0; i < NUM_WAREHOUSES; i++) {
    warehouses.push(await prisma.warehouse.create({
      data: {
        name: `GodownMax ${CITIES[i]} Hub`,
        code: `WH-${CITIES[i].substring(0, 3).toUpperCase()}-01`,
        address: faker.location.streetAddress(),
        city: CITIES[i],
        country: 'India',
        managerId: manager.id,
      }
    }));
  }

  // 5. Categories
  console.log('Creating categories...');
  const dbCategories = [];
  for (const cat of CATEGORIES) {
    dbCategories.push(await prisma.category.create({
      data: { name: cat.name, slug: cat.name.toLowerCase().replace(' ', '-'), description: `All ${cat.name} products` }
    }));
  }

  // 6. Suppliers & Customers
  console.log('Creating suppliers and customers...');
  const suppliersData = Array.from({ length: NUM_SUPPLIERS }).map(() => ({
    id: faker.string.uuid(),
    name: faker.company.name() + ' Pvt Ltd',
    email: faker.internet.email(),
    phone: faker.phone.number(),
    address: faker.location.streetAddress(),
    city: faker.helpers.arrayElement(CITIES),
    country: 'India',
    gstin: `27${faker.string.alphanumeric({ length: 10, casing: 'upper' })}1Z${faker.string.alphanumeric(1).toUpperCase()}`,
    rating: faker.number.float({ min: 3, max: 5, multipleOf: 0.1 }),
  }));
  await chunkedInsert(prisma.supplier, suppliersData, 'suppliers');
  
  const customersData = Array.from({ length: NUM_CUSTOMERS }).map(() => ({
    id: faker.string.uuid(),
    name: faker.company.name() + (faker.datatype.boolean() ? ' Enterprises' : ' Traders'),
    email: faker.internet.email(),
    phone: faker.phone.number(),
    address: faker.location.streetAddress(),
    city: faker.helpers.arrayElement(CITIES),
    country: 'India',
    gstin: `27${faker.string.alphanumeric({ length: 10, casing: 'upper' })}1Z${faker.string.alphanumeric(1).toUpperCase()}`,
    creditLimit: faker.number.int({ min: 10000, max: 500000 }),
  }));
  await chunkedInsert(prisma.customer, customersData, 'customers');

  // 7. Products
  console.log('Creating products...');
  const productsData = [];
  for (let i = 0; i < NUM_PRODUCTS; i++) {
    const cat = faker.helpers.arrayElement(CATEGORIES);
    const dbCat = dbCategories.find(c => c.name === cat.name)!;
    const isFastMoving = faker.number.int({ min: 1, max: 10 }) <= 2; // 20% are fast moving
    const cost = faker.number.int({ min: cat.minP, max: cat.maxP });
    const selling = cost * faker.number.float({ min: 1.1, max: 1.6 });

    productsData.push({
      id: faker.string.uuid(),
      name: `${faker.commerce.productAdjective()} ${faker.commerce.productMaterial()} ${cat.name.replace(' ', '')}`,
      sku: `SKU-${faker.string.alphanumeric(8).toUpperCase()}`,
      categoryId: dbCat.id,
      costPrice: Math.round(cost),
      sellingPrice: Math.round(selling),
      taxRate: cat.gst,
      hsnCode: cat.hsn,
      minStockLevel: isFastMoving ? 100 : 10,
      maxStockLevel: isFastMoving ? 2000 : 100,
      reorderPoint: isFastMoving ? 200 : 20,
      reorderQuantity: isFastMoving ? 500 : 50,
      supplierId: faker.helpers.arrayElement(suppliersData).id,
      unit: faker.helpers.arrayElement(['pcs', 'kg', 'box']),
    });
  }
  await chunkedInsert(prisma.product, productsData, 'products');

  // 8. Inventory Items
  console.log('Generating initial inventory distribution...');
  const inventoryData = [];
  for (let p of productsData) {
    const isFastMoving = p.minStockLevel === 100;
    // Distribute to 3-6 random warehouses
    const numWh = faker.number.int({ min: 3, max: 6 });
    const selectedWh = faker.helpers.arrayElements(warehouses, numWh);
    
    for (let wh of selectedWh) {
      const qty = isFastMoving 
        ? faker.number.int({ min: 50, max: 1500 }) 
        : faker.number.int({ min: 0, max: 80 });
      
      inventoryData.push({
        id: faker.string.uuid(),
        productId: p.id,
        warehouseId: wh.id,
        quantity: qty,
        availableQty: qty,
        reservedQty: 0,
      });
    }
  }
  await chunkedInsert(prisma.inventoryItem, inventoryData, 'inventory_items');

  // 9. Orders & History (The heavy part)
  console.log('Generating 180 days of historical orders...');
  const ordersData = [];
  const orderItemsData = [];
  const stockMovementsData = [];
  const activityLogsData = [];
  
  let orderCount = 0;
  
  // We want to generate ~NUM_ORDERS over 180 days.
  // Add some seasonality: Middle of the period (say month 3) has higher volume.
  for (let i = 0; i < NUM_ORDERS; i++) {
    const daysAgo = faker.number.int({ min: 0, max: DAYS_HISTORY });
    const orderDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
    
    // Create sinusoidal trend for revenue scaling (peaks in middle)
    const seasonality = Math.sin((daysAgo / DAYS_HISTORY) * Math.PI); 
    const isSales = faker.number.int({ min: 1, max: 100 }) <= 85; // 85% sales, 15% purchases
    
    const oId = faker.string.uuid();
    const invNum = `GMX-${orderDate.getFullYear()}-${String(orderCount++).padStart(6, '0')}`;
    const status = daysAgo < 2 ? faker.helpers.arrayElement([OrderStatus.PENDING, OrderStatus.PROCESSING]) : OrderStatus.DELIVERED;
    
    const oItemsCount = faker.number.int({ min: 1, max: 5 });
    const oProducts = faker.helpers.arrayElements(productsData, oItemsCount);
    
    let subtotal = 0;
    let taxAmount = 0;
    
    for (let p of oProducts) {
      const isFast = p.minStockLevel === 100;
      const baseQty = isFast ? faker.number.int({ min: 10, max: 100 }) : faker.number.int({ min: 1, max: 10 });
      // Apply seasonality multiplier to quantity
      const qty = Math.max(1, Math.floor(baseQty * (0.5 + seasonality)));
      
      const price = isSales ? p.sellingPrice : p.costPrice;
      const lineTotal = qty * price;
      const lineTax = lineTotal * (p.taxRate / 100);
      
      subtotal += lineTotal;
      taxAmount += lineTax;
      
      orderItemsData.push({
        id: faker.string.uuid(),
        orderId: oId,
        productId: p.id,
        quantity: qty,
        unitPrice: price,
        taxRate: p.taxRate,
        discount: 0,
        total: lineTotal + lineTax
      });
      
      if (status === OrderStatus.DELIVERED) {
        stockMovementsData.push({
          id: faker.string.uuid(),
          productId: p.id,
          type: isSales ? StockMovementType.OUT : StockMovementType.IN,
          quantity: qty,
          fromWarehouseId: isSales ? faker.helpers.arrayElement(warehouses).id : null,
          toWarehouseId: isSales ? null : faker.helpers.arrayElement(warehouses).id,
          reference: invNum,
          userId: admin.id,
          createdAt: orderDate
        });
      }
    }
    
    const total = subtotal + taxAmount;
    
    ordersData.push({
      id: oId,
      orderNumber: invNum,
      invoiceNumber: invNum,
      type: isSales ? OrderType.SALES : OrderType.PURCHASE,
      status: status,
      userId: admin.id,
      supplierId: isSales ? null : faker.helpers.arrayElement(suppliersData).id,
      customerId: isSales ? faker.helpers.arrayElement(customersData).id : null,
      subtotal,
      taxAmount,
      total,
      paidAmount: total,
      createdAt: orderDate,
      updatedAt: orderDate,
      deliveredAt: status === OrderStatus.DELIVERED ? orderDate : null
    });

    // 10. Generate corresponding activity logs
    activityLogsData.push({
      id: faker.string.uuid(),
      userId: faker.helpers.arrayElement(users).id,
      action: 'CREATED',
      entity: 'Order',
      entityId: oId,
      createdAt: orderDate
    });
    if (status === OrderStatus.DELIVERED) {
      activityLogsData.push({
        id: faker.string.uuid(),
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
  await chunkedInsert(prisma.order, ordersData, 'orders');
  console.log('Inserting order items...');
  await chunkedInsert(prisma.orderItem, orderItemsData, 'order items');
  console.log('Inserting stock movements...');
  await chunkedInsert(prisma.stockMovement, stockMovementsData, 'stock movements');
  console.log('Inserting activity logs...');
  await chunkedInsert(prisma.activityLog, activityLogsData, 'activity logs');

  // 11. Generate Notifications
  console.log('Generating notifications...');
  const notifsData = Array.from({ length: 5000 }).map(() => {
    const daysAgo = faker.number.int({ min: 0, max: DAYS_HISTORY });
    return {
      id: faker.string.uuid(),
      userId: admin.id,
      type: faker.helpers.arrayElement(Object.values(NotificationType)),
      title: 'System Alert',
      message: faker.lorem.sentence(),
      isRead: faker.datatype.boolean(),
      createdAt: new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000)
    };
  });
  await chunkedInsert(prisma.notification, notifsData, 'notifications');

  // 12. Generate AI Reports
  console.log('Generating AI Reports...');
  const aiReportsData = Array.from({ length: 500 }).map(() => {
    const daysAgo = faker.number.int({ min: 0, max: DAYS_HISTORY });
    return {
      id: faker.string.uuid(),
      userId: admin.id,
      type: faker.helpers.arrayElement(['inventory_analysis', 'demand_prediction', 'sales_forecast']),
      result: { summary: "AI identified seasonal patterns indicating a 20% spike in electronics for the upcoming month." },
      createdAt: new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000)
    };
  });
  await chunkedInsert(prisma.aIReport, aiReportsData, 'AI reports');

  console.log('✅ GodownMax Enterprise DB Seeding Complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
