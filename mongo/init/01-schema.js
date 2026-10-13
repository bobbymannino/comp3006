// Runs automatically on first start via /docker-entrypoint-initdb.d

const uuid = { bsonType: "binData" };
const date = { bsonType: "date" };

const collections = {
  users: {
    validator: {
      $jsonSchema: {
        bsonType: "object",
        required: [
          "_id",
          "username",
          "email",
          "passwordHash",
          "displayName",
          "createdAt",
          "updatedAt",
        ],
        additionalProperties: false,
        properties: {
          _id: uuid,
          username: { bsonType: "string", pattern: "^[a-z0-9_]{3,32}$" },
          email: { bsonType: "string", pattern: "^[^@\\s]+@[^@\\s]+$" },
          passwordHash: { bsonType: "string", minLength: 1 },
          displayName: { bsonType: "string", minLength: 1 },
          createdAt: date,
          updatedAt: date,
        },
      },
    },
    indexes: [
      { key: { username: 1 }, name: "username_unique", unique: true },
      { key: { email: 1 }, name: "email_unique", unique: true },
    ],
  },

  posts: {
    validator: {
      $jsonSchema: {
        bsonType: "object",
        required: [
          "_id",
          "authorId",
          "title",
          "slug",
          "content",
          "publishedAt",
          "likeCount",
          "createdAt",
          "updatedAt",
        ],
        additionalProperties: false,
        properties: {
          _id: uuid,
          authorId: uuid,
          title: { bsonType: "string", minLength: 1 },
          slug: { bsonType: "string", pattern: "^[a-z0-9]+(-[a-z0-9]+)*$" },
          content: { bsonType: "string" },
          publishedAt: { bsonType: ["date", "null"] },
          likeCount: { bsonType: ["int", "long"], minimum: 0 },
          createdAt: date,
          updatedAt: date,
        },
      },
    },
    indexes: [
      { key: { slug: 1 }, name: "slug_unique", unique: true },
      { key: { authorId: 1, createdAt: -1 }, name: "author_posts" },
      { key: { publishedAt: -1 }, name: "feed" },
    ],
  },

  likes: {
    validator: {
      $jsonSchema: {
        bsonType: "object",
        required: ["_id", "userId", "postId", "createdAt"],
        additionalProperties: false,
        properties: {
          _id: uuid,
          userId: uuid,
          postId: uuid,
          createdAt: date,
        },
      },
    },
    indexes: [
      { key: { userId: 1, postId: 1 }, name: "user_post_unique", unique: true },
      { key: { postId: 1 }, name: "post_likes" },
    ],
  },
};

const existing = db.getCollectionNames();

for (const [name, { validator, indexes }] of Object.entries(collections)) {
  const options = {
    validator,
    validationLevel: "strict",
    validationAction: "error",
  };

  if (existing.includes(name)) {
    db.runCommand({ collMod: name, ...options });
  } else {
    db.createCollection(name, options);
  }

  for (const { key, ...opts } of indexes) {
    db.getCollection(name).createIndex(key, opts);
  }

  print(`${db.getName()}.${name}: ok`);
}
