const { Schema } = require('mongoose');
const getBooksByIds = require('../../amazon/getBooksByIds');

const bookSchema = new Schema({
  asin: {
    type: String,
    index: true,
    unique: true,
    required: true,
  },
  processing: {
    type: Boolean,
    index: true,
    default: false,
  },
  active: {
    type: Boolean,
    index: true,
    default: false,
  },
  title: String,
  description: String,
  url: String,
  image: String,
  authors: Array,
  publisher: String,
  publishedAt: Date,
  releasedAt: Date,
}, {
  timestamps: true,
});

class Book {
  static async firstOrCreate(query, doc = query) {
    const book = await this.findOne(query);
    if (book) { return { book, newRecord: false }; }
    return { book: await this.create(doc), newRecord: true };
  }

  static async retrieveAndUpdate() {
    const books = await this.whereNeedsUpdate().exec();
    if (books == null || books.length === 0) { return false; }
    const targetASINs = books.map(book => book.asin);
    await this.updateMany(
      { asin: { '$in': targetASINs }}, { processing: true }
    );
    const details = await getBooksByIds(targetASINs);
    for (const book of books) {
      const attributes = details[book.asin];
      await book.set({
        ...(attributes || {}), active: Boolean(attributes), processing: false,
      }).save();
    }
    return true;
  }

  static whereNeedsUpdate() {
    const oneDayBefore = new Date(Date.now() - (24 * 60 * 60 * 1000));
    return this
      .where({ processing: false })
      .or([{ active: false }, { updatedAt: { '$lt': oneDayBefore } }])
      .limit(10);
  }
}
bookSchema.loadClass(Book);

module.exports = {
  bookSchema,
};
