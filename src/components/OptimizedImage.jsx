// scripts/trim-banner-urls.js
// One-off cleanup: trims trailing/leading whitespace from existing
// blog.banner URLs (and any EditorJS image block URLs) already saved
// with bad whitespace from before the OptimizedImage fix.

require('dotenv').config();
const mongoose = require('mongoose');

async function run() {
  await mongoose.connect(process.env.DB_LOCATION || process.env.MONGODB_URI);

  const Blog = mongoose.connection.collection('blogs');

  // 1. Fix top-level banner field
  const bannerCursor = Blog.find({ banner: { $regex: /^\s|\s$/ } });
  let bannerFixed = 0;

  for await (const doc of bannerCursor) {
  try {
    const cleaned = doc.banner.trim();
    if (cleaned !== doc.banner) {
      await Blog.updateOne({ _id: doc._id }, { $set: { banner: cleaned } });
      bannerFixed++;
    }
  } catch (err) {
    console.error(`Failed to fix banner for ${doc._id}:`, err.message);
  }
}
  // 2. Fix EditorJS image block URLs inside content.blocks
  const contentCursor = Blog.find({ 'content.blocks.type': 'image' });
  let blocksFixed = 0;

  for await (const doc of contentCursor) {
    let changed = false;
    const blocks = doc.content?.blocks?.map((block) => {
      if (block.type === 'image' && block.data?.file?.url) {
        const cleaned = block.data.file.url.trim();
        if (cleaned !== block.data.file.url) {
          changed = true;
          return {
            ...block,
            data: { ...block.data, file: { ...block.data.file, url: cleaned } },
          };
        }
      }
      return block;
    });

    if (changed) {
      await Blog.updateOne({ _id: doc._id }, { $set: { 'content.blocks': blocks } });
      blocksFixed++;
    }
  }
  console.log(`Fixed ${blocksFixed} documents with image blocks.`);

  await mongoose.disconnect();
  console.log('Done.');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});