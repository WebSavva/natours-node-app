const flatry = require('./flatry');

class DBHandler {
  static EXCLUDED_FIELDS = ['sort', 'fields', 'page', 'limit'];

  constructor(searchParams, Model) {
    this.query = Model.find();
    this.searchParams = searchParams;
    this.clearedSearchParams = DBHandler.clearSearchParams(this.searchParams);
  }

  static clearSearchParams(rawSearchParams) {
    return Object.entries(rawSearchParams).reduce((ac, [key, value]) => {
      if (!(key in DBHandler.EXCLUDED_FIELDS)) ac[key] = value;
      return ac;
    }, {});
  }

  filter() {
    // inserting $ sign to enable MongoDB built-in operators
    const searchQuery = JSON.parse(
      JSON.stringify(this.clearedSearchParams).replace(
        /\b(gte?|lte?)\b/,
        (match) => '$' + match
      )
    );

    this.query = this.query.find(searchQuery);

    return this;
  }

  sort() {
    // sorting
    if (this.searchParams.sort) {
      this.query = this.query.sort(this.searchParams.sort.replace(/,/g, ' '));
    }

    return this;
  }

  fields() {
    // fields projection
    if (this.searchParams.fields) {
      this.query = this.query.select(
        this.searchParams.fields.replace(/,/g, ' ')
      );
    }

    return this;
  }

  limit() {
    // limiting fields
    if ( !this.searchParams.limit) {
      this.meta = {
        page: 1
      };

      return this;
    }
    
    const page = +this.searchParams.page || 1;
    const limitValue = +this.searchParams.limit || 5;

    this.query = this.query.skip((page - 1) * limitValue).limit(limitValue);

    this.meta = {
        page,
        limit: limitValue,
    };

    return this;
  }

  async fetch() {
    const documents =  await this.query;

    return {
        data: documents,
        meta: this.meta
    };
  }
}

module.exports = DBHandler;
