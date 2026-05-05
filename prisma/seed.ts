import { PrismaClient, Category } from "@prisma/client";
import "dotenv/config";

const prisma = new PrismaClient();

const products = [
  {
    title: "#A10X WARHEADS XTREME",
    description: "Premium indoor flower with intense potency",
    category: Category.FLOWER,
    indoor: true,
    rating: "8.5/10 nose",
    priceLocal: "$500/HP\n$875/P",
    priceShip: "$550/HP\n$975/P",
    isSoldOut: true,
    imageUrl: "https://images.unsplash.com/photo-1603909223429-69bb7101f420?w=600",
  },
  {
    title: "#A11Y CHEWY CLOUDZ",
    description: "100% organic indoor cultivation",
    category: Category.FLOWER,
    indoor: true,
    rating: "9/10 nose *100% organic*",
    priceLocal: "$625/HP\n$1125/P",
    priceShip: "$675/HP\n$1225/P",
    isSoldOut: false,
    imageUrl: "https://images.unsplash.com/photo-1603909223429-69bb7101f420?w=600",
  },
  {
    title: "#A12X SOUR APPLE RINGS",
    description: "Delicious sour apple flavored edibles",
    category: Category.EDIBLES,
    indoor: false,
    rating: "8.5/10 taste",
    priceLocal: "$875/unit",
    priceShip: "$975/unit",
    isSoldOut: true,
    imageUrl: "https://images.unsplash.com/photo-1621939514649-280e2ee25f60?w=600",
  },
  {
    title: "#A14Y LEMON ZOTS",
    description: "Zesty lemon flavored gummies",
    category: Category.EDIBLES,
    indoor: false,
    rating: "8.25/10 taste",
    priceLocal: "$850/unit",
    priceShip: "$950/unit",
    isSoldOut: false,
    imageUrl: "https://images.unsplash.com/photo-1621939514649-280e2ee25f60?w=600",
  },
  {
    title: "#A15X GRAPE CRUSH",
    description: "Premium indoor flower with grape terpenes",
    category: Category.FLOWER,
    indoor: true,
    rating: "9/10 nose",
    priceLocal: "$700/HP\n$1250/P",
    priceShip: "$750/HP\n$1350/P",
    isSoldOut: false,
    imageUrl: "https://images.unsplash.com/photo-1603909223429-69bb7101f420?w=600",
  },
  {
    title: "#A16Y BERRY BLAST VAPE",
    description: "Full spectrum berry flavored cartridge",
    category: Category.DISPOSABLES,
    indoor: false,
    rating: "8/10 flavor",
    priceLocal: "$45/cart",
    priceShip: "$55/cart",
    isSoldOut: false,
    imageUrl: "https://images.unsplash.com/photo-1560913210-63f9c4e1ad6b?w=600",
  },
  {
    title: "#A17X MANGO MADNESS",
    description: "Premium live resin concentrate",
    category: Category.CONCENTRATES,
    indoor: false,
    rating: "9.5/10 potency",
    priceLocal: "$60/g",
    priceShip: "$70/g",
    isSoldOut: true,
    imageUrl: "https://images.unsplash.com/photo-1603909223429-69bb7101f420?w=600",
  },
  {
    title: "#A18Y PEACH PREROLLS",
    description: "Hand-rolled premium prerolls 5 pack",
    category: Category.PREROLLS,
    indoor: true,
    rating: "8.75/10 burn",
    priceLocal: "$40/5pack",
    priceShip: "$50/5pack",
    isSoldOut: false,
    imageUrl: "https://images.unsplash.com/photo-1603909223429-69bb7101f420?w=600",
  },
];

async function main() {
  console.log("Starting seed...");

  // Delete existing products
  await prisma.product.deleteMany();
  console.log("Cleared existing products");

  for (const product of products) {
    const result = await prisma.product.create({
      data: product,
    });
    console.log(`Created product: ${result.title}`);
  }

  console.log("Seed completed successfully!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("Seed error:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
