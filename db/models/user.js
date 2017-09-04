const { Schema } = require('mongoose');

const connection = require('../').createConnection();
const Book = require('./book');

const ownershipSchema = new Schema({
  asin: {
    type: String,
    required: true,
  },
  acquiredAt: Date,
  status: {
    type: String,
    enum: ['recommended', 'purchased', 'reserved', 'ignored'],
    index: true,
    required: true,
    default: 'recommended',
  },
}, { _id: false });

const ownerships = {
  isPurchased: book => book.status === 'purchased',
  isReserved: book => book.status === 'reserved',
  isIgnored: book => book.status === 'ignored',
};

const seriesSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
}, { timestamps: true, _id: false });

const userSchema = new Schema({
  identifier: {
    type: String,
    index: true,
    unique: true,
    required: true,
  },
  ownerships: [ownershipSchema],
  series: [seriesSchema],
}, {
  timestamps: true,
});

class UserClass {
  static async firstOrCreate(query, doc = query) {
    const user = await this.findOne(query);
    if (user) { return { user, newRecord: false }; }
    return { user: await this.create(doc), newRecord: true };
  }

  get booksPurchasedObj() {
    return this.ownerships.filter(ownerships.isPurchased);
  }
  get booksReservedObj() {
    return this.ownerships.filter(ownerships.isReserved);
  }
  get booksIgnoredObj() {
    return this.ownerships.filter(ownerships.isIgnored);
  }

  // @async
  booksPurchased() {
    return Book.find({
      asin: { '$in': this.booksPurchasedObj.map(book => book.asin) },
    });
  }
  // @async
  booksReserved() {
    return Book.find({
      asin: { '$in': this.booksReservedObj.map(book => book.asin) },
    });
  }
  // @async
  booksIgnored() {
    return Book.find({
      asin: { '$in': this.booksIgnoredObj.map(book => book.asin) },
    });
  }

  async createBooks (status, items) {
    const ownerships = [];
    for (const item of items) {
      const { acquiredTime, asin, ...attributes } = item;
      await Book.createOrUpdateByMyxItem({ asin, ...attributes });
      const acquiredAt = acquiredTime ? new Date(acquiredTime) : undefined;
      ownerships.push({ asin, status, acquiredAt });
    }
    return await this.update({ ownerships });
  }
  // @async
  createBooksPurchased(items) { return this.createBooks('purchased', items); }
  // @async
  createBooksReserved(items) { return this.createBooks('reserved', items); }
  // @async
  createBooksIgnored(items) { return this.createBooks('ignored', items); }
}
userSchema.loadClass(UserClass);

const User = connection.model('User', userSchema);
User.schema = userSchema;

module.exports = User;
