const moji = require('moji');
const { Schema } = require('mongoose');

const connection = require('../').createConnection();
const getBooks = require('../../lib/amazon/getBooks');

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
  disable: {
    type: Boolean,
    index: true,
    default: false,
  },
  title: String,
  titleReading: String,
  description: String,
  url: String,
  image: String,
  authors: Array,
  authorsReading: String,
  publisher: String,
  publishedAt: Date,
  releasedAt: Date,
}, {
  timestamps: true,
});

class BookClass {
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
    const details = await getBooks(targetASINs);
    for (const book of books) {
      const attributes = details[book.asin];
      await book.set({
        ...(attributes || {}), active: Boolean(attributes), processing: false,
      }).save();
    }
    return true;
  }

  static whereNeedsUpdate() {
    const oneDayBefore = new Date(Date.now() - (23 * 60 * 60 * 1000));
    return this
      .where({ processing: false })
      .or([{ active: false }, { updatedAt: { '$lt': oneDayBefore } }])
      .limit(10);
  }

  static async createOrUpdateByMyxItem({
    asin, authors, productImage, sortableAuthors, sortableTitle, title,
  }) {
    const params = {
      authors: extractAuthors(authors),
      authorsReading: sortableAuthors,
      image: productImage,
      title,
      titleReading: sortableTitle,
    };
    let book = await this.findOne({ asin });
    if (book == null) { book = new this({ asin }); }
    return await book.set(params).save();
  }
}
bookSchema.loadClass(BookClass);

const Book = connection.model('Book', bookSchema);
Book.shcema = bookSchema;

module.exports = Book;

const extractAuthors = authors => (
  moji(authors)
    .convert('ZStoHS').toString()
    .split(/[、､，,]+\s*/g)
    .map(author => author.replace(/\s+/g, ''))
);
