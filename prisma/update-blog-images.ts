import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const updates = [
  {
    slug: "understanding-cannabis-strains-indica-sativa-hybrid",
    imageUrl: "https://res.cloudinary.com/dewstyanq/image/upload/v1772006100/ubx928a54bhxdreliymy.jpg",
    images: [
      "https://res.cloudinary.com/dewstyanq/image/upload/v1772005757/nnjpiih8r6s1xmnw9gkq.jpg",
      "https://res.cloudinary.com/dewstyanq/image/upload/v1771704600/duktymnvd6kixmufaadw.jpg",
      "https://res.cloudinary.com/dewstyanq/image/upload/v1771704449/kobc9eonphhyhfdrntgo.jpg",
    ],
  },
  {
    slug: "what-are-terpenes-complete-guide",
    imageUrl: "https://res.cloudinary.com/dewstyanq/image/upload/v1771704265/cxc64mhrvs22mgigabv7.jpg",
    images: [
      "https://res.cloudinary.com/dewstyanq/image/upload/v1771704022/qwzmog8mvnm4lde1u71y.jpg",
      "https://res.cloudinary.com/dewstyanq/image/upload/v1771704449/kobc9eonphhyhfdrntgo.jpg",
    ],
  },
  {
    slug: "beginners-guide-to-cannabis-consumption-methods",
    imageUrl: "https://res.cloudinary.com/dewstyanq/image/upload/v1771709070/efdom1frq0vxfbr2lk7i.jpg",
    images: [
      "https://res.cloudinary.com/dewstyanq/image/upload/v1771708596/tdh9cg31hhtv8bdiqgw3.jpg",
      "https://res.cloudinary.com/dewstyanq/image/upload/v1771708140/xqaod9b8d92zjy9w6zmi.jpg",
      "https://res.cloudinary.com/dewstyanq/image/upload/v1771707952/kkbtcbwigtfru5qizbcl.jpg",
    ],
  },
  {
    slug: "how-to-store-cannabis-properly",
    imageUrl: "https://res.cloudinary.com/dewstyanq/image/upload/v1771704022/qwzmog8mvnm4lde1u71y.jpg",
    images: [
      "https://res.cloudinary.com/dewstyanq/image/upload/v1772006100/ubx928a54bhxdreliymy.jpg",
      "https://res.cloudinary.com/dewstyanq/image/upload/v1771704600/duktymnvd6kixmufaadw.jpg",
    ],
  },
  {
    slug: "cannabis-legalization-movement-why-it-matters",
    imageUrl: "https://res.cloudinary.com/dewstyanq/image/upload/v1771574576/axr1mffxhowry9zhprev.jpg",
    images: [
      "https://res.cloudinary.com/dewstyanq/image/upload/v1771574455/cicizcdb4j7k9gbfojbj.jpg",
    ],
  },
  {
    slug: "why-quality-cannabis-matters",
    imageUrl: "https://res.cloudinary.com/dewstyanq/image/upload/v1771704449/kobc9eonphhyhfdrntgo.jpg",
    images: [
      "https://res.cloudinary.com/dewstyanq/image/upload/v1772005757/nnjpiih8r6s1xmnw9gkq.jpg",
      "https://res.cloudinary.com/dewstyanq/image/upload/v1771704265/cxc64mhrvs22mgigabv7.jpg",
    ],
  },
  {
    slug: "cannabis-and-pain-management-what-research-says",
    imageUrl: "https://res.cloudinary.com/dewstyanq/image/upload/v1771510046/hr9dfm4ewnuiuyowl7km.jpg",
    images: [
      "https://res.cloudinary.com/dewstyanq/image/upload/v1770900439/qc3ul0md0exewwpap5vx.jpg",
      "https://res.cloudinary.com/dewstyanq/image/upload/v1770899528/juxdhz7domtx7yisxmzw.jpg",
    ],
  },
  {
    slug: "cannabis-for-sleep-natural-remedy-insomnia",
    imageUrl: "https://res.cloudinary.com/dewstyanq/image/upload/v1771705473/ssxyj6jo2mjyxcauzz0v.jpg",
    images: [
      "https://res.cloudinary.com/dewstyanq/image/upload/v1770899357/ot6getwczg0fke3ujs5w.jpg",
      "https://res.cloudinary.com/dewstyanq/image/upload/v1770899144/xe7pgmsssepmysmtb1pv.jpg",
    ],
  },
];

async function main() {
  for (const update of updates) {
    await prisma.blogPost.update({
      where: { slug: update.slug },
      data: { imageUrl: update.imageUrl, images: update.images },
    });
    console.log(`Updated: ${update.slug}`);
  }
  console.log("Done!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
