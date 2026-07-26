import bcrypt from "bcryptjs";
import { connectDB } from "./config/db.js";
import { User } from "./models/User.js";
import { Category } from "./models/Category.js";
import { Product } from "./models/Product.js";
import { CATEGORIES } from "@baxparrow/shared";
import { slugify } from "./utils/slugify.js";
const SAMPLE = [
  ["Cortez Messenger","Office Bags",1499,2199,120],
  ["Summit 32L Backpack","School Bags",1299,1799,64],
  ["Marina Tote","Handbags",1899,2599,8],
  ["Heritage Leather Briefcase","Leather Bags",4299,5499,32],
  ["Trailhead Duffel","Sport Bags",1699,2299,210],
  ["Voyager Cabin Trolley","Suitcases",3999,5299,15],
  ["Cascade Beach Bag","Beach Bags",899,1299,0],
  ["Metro Slim Wallet","Wallets",599,899,340],
  ["Continental Carry-On","Travel Bags",3499,4599,22],
  ["Bloom Ladies Handbag","Handbags",1599,2199,88],
];
async function run() {
  await connectDB();
  await Promise.all([User.deleteMany({}), Category.deleteMany({}), Product.deleteMany({})]);
  await User.create({ name: "Admin", email: "admin@baxparrow.com", role: "admin",
    passwordHash: await bcrypt.hash("admin123", 10) });
  await Category.insertMany(CATEGORIES.map((name, i) => ({ name, slug: slugify(name), order: i })));
  await Product.insertMany(SAMPLE.map(([name, category, price, mrp, stock], i) => ({
    name, category, price, mrp, stock, slug: slugify(String(name)) + "-" + i,
    sku: "BX-" + String(category).slice(0,3).toUpperCase() + "-0" + (i+1),
    description: "Handcrafted in our Byculla workshop. Reinforced stitching, YKK zips, built to last.",
    bulkPrice: Math.round(Number(price) * 0.75), moq: 50, colors: ["Brown","Slate","Tan"],
    sizes: ["S","M","L"], status: Number(stock) === 0 ? "draft" : "active",
  })));
  console.log("seeded: 1 admin, " + CATEGORIES.length + " categories, " + SAMPLE.length + " products");
  process.exit(0);
}
run();
