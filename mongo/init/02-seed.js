// Runs automatically on first start via /docker-entrypoint-initdb.d
// Imports seed.json (every seed user's password is "password123")

const fs = require("fs");
const path = require("path");

const dir =
  typeof __dirname === "string" ? __dirname : "/docker-entrypoint-initdb.d";
const seed = JSON.parse(fs.readFileSync(path.join(dir, "seed.json"), "utf8"));

const toDate = (value) => (value === null ? null : new Date(value));

const likeCounts = {};
for (const like of seed.likes) {
  likeCounts[like.postId] = (likeCounts[like.postId] ?? 0) + 1;
}

const docs = {
  users: seed.users.map((user) => ({
    ...user,
    _id: UUID(user._id),
    createdAt: toDate(user.createdAt),
    updatedAt: toDate(user.updatedAt),
  })),
  posts: seed.posts.map((post) => ({
    ...post,
    _id: UUID(post._id),
    authorId: UUID(post.authorId),
    publishedAt: toDate(post.publishedAt),
    likeCount: NumberInt(likeCounts[post._id] ?? 0),
    createdAt: toDate(post.createdAt),
    updatedAt: toDate(post.updatedAt),
  })),
  likes: seed.likes.map((like) => ({
    ...like,
    _id: UUID(like._id),
    userId: UUID(like.userId),
    postId: UUID(like.postId),
    createdAt: toDate(like.createdAt),
  })),
};

// Upsert by _id so re-running doesn't duplicate or wipe anything
for (const [name, items] of Object.entries(docs)) {
  const result = db.getCollection(name).bulkWrite(
    items.map((doc) => ({
      replaceOne: { filter: { _id: doc._id }, replacement: doc, upsert: true },
    })),
  );

  print(
    `${db.getName()}.${name}: ${result.upsertedCount} inserted, ${result.modifiedCount} updated`,
  );
}
