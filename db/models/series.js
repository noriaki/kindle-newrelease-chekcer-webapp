const { Schema } = require('mongoose');

const {
  normalizeBundleTitle,
  normalizeAuthors,
  normalizeDescription,
} = require('../../lib/normalize');
const connection = require('../').createConnection();

const seriesSchema = new Schema({
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
  title: {
    type: String,
    index: true,
  },
  description: String,
  url: String,
  listUrl: String,
  image: String,
  authors: {
    type: [String],
    default: [],
  },
  publisher: String,
  asins: {
    type: [String],
    default: [],
  },
}, {
  timestamps: true,
});

seriesSchema.pre('save', function normalize (next) {
  if (this.title) { this.title = normalizeBundleTitle(this.title); }
  if (this.authors) { this.authors = normalizeAuthors(this.authors); }
  if (this.description) {
    this.description = normalizeDescription(this.description);
  }
  next();
});

class SeriesClass {
  static async firstOrCreate(query, doc = {}) {
    const series = await this.findOne(query);
    if (series) { return { series, newRecord: false }; }
    return {
      series: await this.create({ ...query, ...doc }),
      newRecord: true,
    };
  }

  // @async
  static firstOrCreateById(_id, doc = {}) {
    return this.firstOrCreate({ _id }, doc);
  }

  // @async
  static updateStatusManyToProcessing(asins) {
    return this.updateMany({ _id: { '$in': asins } }, { processing: true });
  }

  static async createOrUpdateByPAAPI(asin, attrs) {
    const { series } = await this.firstOrCreateById(asin);
    let attributes = {};
    if (attrs) {
      attributes = { ...attrs, active: true, processing: false };
    } else {
      attributes = { disable: true, processing: false };
    }
    return await series.set(attributes).save();
  }

  addAsinIfNotIncludes(asin) {
    if (!this.asins.includes(asin)) { this.asins.push(asin); }
    return this;
  }

  mergeAuthors(authors) {
    for (const author of authors) {
      if (!this.authors.includes(author)) { this.authors.push(author); }
    }
    return this;
  }
}
seriesSchema.loadClass(SeriesClass);

const Series = connection.model('Series', seriesSchema);
Series.shcema = seriesSchema;

module.exports = Series;
