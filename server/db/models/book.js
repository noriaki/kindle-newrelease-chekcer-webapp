const { Schema } = require('mongoose');

const bookSchema = new Schema({
  asin: {
    type: String,
    index: true,
    unique: true,
    required: true,
  },
}, {
  timestamps: true,
});

class Book {
  static async firstOrCreate(query, doc = query) {
    const book = await this.findOne(query);
    if (book) { return { book, newRecord: false }; }
    return { book: await this.create(doc), newRecord: true };
  }
}
bookSchema.loadClass(Book);

module.exports = {
  bookSchema,
};
