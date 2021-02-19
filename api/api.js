const express = require('express');
const apiRouter = express.Router();

const employeesRouter = require('./employees');
const timesheetsRouter = require('./timesheets');

apiRouter.use('/employees', employeesRouter);
apiRouter.use('/timesheets', timesheetsRouter);

module.exports = apiRouter;