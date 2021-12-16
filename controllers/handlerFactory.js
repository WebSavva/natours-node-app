const catchAsync = require("@/utils/catchAsync");
const AppError = require("@/utils/AppError");
const DBHandler = require("@/utils/dbHandler");

module.exports = new (class {
  constructor() {}

  getDeleteHandler(Model) {
    return catchAsync(async (req, res, next) => {
      const deletedDocument = await Model.findByIdAndDelete(req.params.id);

      if (!deletedDocument)
        next(
          new AppError(
            `Failed deletion of the given resource instance with id ${req.params.id}`
          )
        );

      res.status(203).json({
        status: "success",
        data: deletedDocument,
      });
    });
  }

  getUpdateHandler(Model) {
    return catchAsync(async (req, res, next) => {
      const updatedDocument = await Model.findByIdAndUpdate(
        req.params.id,
        req.body,
        {
          new: true,
          runValidators: true,
        }
      );

      if (!updatedDocument)
        next(new AppError("Failed to update the Document Object", 404));

      res.status(202).json({
        status: "success",
        data: updatedDocument,
      });
    });
  }

  getSendAllDocumentsHandler(Model) {
    return catchAsync(async (req, res) => {
      const dbInterface = new DBHandler(req.query, Model);

      const responseData = await dbInterface
        .filter()
        .sort()
        .fields()
        .limit()
        .fetch();

      res.status(200).json({
        status: "success",
        ...responseData,
      });
    });
  }

  getSendDocumentHandler(Model, queryExtender) {
    return catchAsync(async (req, res, next) => {
      console.log(req.params.id);
      let query = Model.findById(req.params.id);
      if (queryExtender) query = queryExtender(query);
      
      const doc = await query;
      
      console.log(doc);
      res.status(200).json({
        status: "success",
        data: doc,
      });
    });
  }

  getCreateHandler(Model) {
    return catchAsync(async (req, res, next) => {
      const newDocument = await Model.create(req.body);

      res.status(201).json({
        status: "success",
        data: newDocument,
      });
    });
  }
  
})();
