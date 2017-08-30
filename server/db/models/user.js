const { Schema } = require('mongoose');

const userSchema = new Schema({
  identifier: {
    type: String,
    index: true,
    unique: true,
    required: true,
  },
}, {
  timestamps: true,
});

class User {
  static async firstOrCreate(query, doc = query) {
    const user = await this.findOne(query);
    if (user) { return { user, newRecord: false }; }
    return { user: await this.create(doc), newRecord: true };
  }
}
userSchema.loadClass(User);

module.exports = {
  userSchema,
};
