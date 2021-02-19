const express = require('express');
const apiRouter = express.Router();

const employeesRouter = require('./employees');
const timesheetsRouter = require('./timesheets');
const menusRouter = require('./menus');

apiRouter.use('/employees', employeesRouter);
apiRouter.use('/timesheets', timesheetsRouter);
apiRouter.use('/menus', menusRouter);

module.exports = apiRouter;