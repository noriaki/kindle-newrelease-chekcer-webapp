const moji = require('moji');
const { Schema } = require('mongoose');

const {
  normalizeTitle,
  normalizeAuthors,
  normalizeDescription,
} = require('../../lib/normalize');
const connection = require('../').createConnection();

const bookSchema = new Schema({
  _id: { // ASIN
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
  authors: {
    type: [String],
    default: [],
  },
  authorsReading: String,
  publisher: String,
  publishedAt: Date,
  releasedAt: Date,
  seriesId: {
    type: String,
    index: true,
  },
}, {
  timestamps: true,
});

bookSchema.pre('save', function normalize (next) {
  if (this.title) { this.title = normalizeTitle(this.title); }
  if (this.authors) { this.authors = normalizeAuthors(this.authors); }
  if (this.description) {
    this.description = normalizeDescription(this.description);
  }
  next();
});

class BookClass {
  static async firstOrCreate(query, doc = {}) {
    const book = await this.findOne(query);
    if (book) { return { book, newRecord: false }; }
    return {
      book: await this.create({ ...query, ...doc }),
      newRecord: true,
    };
  }

  // @async
  static firstOrCreateById(_id, doc = {}) {
    return this.firstOrCreate({ _id }, doc);
  }

  // for self-updating
  static whereNeedsUpdate() {
    const oneDayBefore = new Date(Date.now() - (23 * 60 * 60 * 1000));
    return this
      .where({ processing: false, disable: false })
      .or([{ active: false }, { updatedAt: { '$lt': oneDayBefore } }]);
  }
  static limitNeedsUpdate() { return this.limit(10); }
  static entriesNeedsUpdate() {
    const criteria = this.whereNeedsUpdate();
    return this.limitNeedsUpdate.call(criteria);
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
    let book = await this.findById(asin);
    if (book == null) { book = new this({ _id: asin }); }
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
);
