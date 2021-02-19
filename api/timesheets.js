const express = require('express');
const timesheetsRouter = express.Router({mergeParams: true});

const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

timesheetsRouter.get('/', (req, res, next) => {
    // checks if employee with the supplied ID exists
    db.get(
        'SELECT * FROM Employee WHERE id=$employeeId',
        {$employeeId: req.params.employeeId},
        (err, employee) => {
            if(err) {
                next(err);
            } else if(employee) {
                // if there is, return and display all of their timesheets
                db.all(
                    'SELECT * FROM Timesheet WHERE employee_id=$employeeId',
                    {$employeeId: req.params.employeeId},
                    (err, timesheets) => {
                        if(err) {
                            next(err);
                        } else {
                            return res.status(200).json({timesheets: timesheets});
                        }
                    }
                )
            } else {
                // if not, return an error
                return res.status(404).send();
            }
        }
    )
});

timesheetsRouter.param('timesheetId', (req, res, next, id) => {
    db.get(
        'SELECT * FROM Timesheet WHERE id=$timesheetId',
        {$timesheetId: id},
        (err, timesheet) => {
            if(err) {
                next(err);
            } else if(timesheet) {
                req.timesheet = timesheet;
                next();
            } else {
                return res.status(404).send();
            }
        }
    )
});

timesheetsRouter.get('/:timesheetId', (req, res, next) => {
    res.status(200).json({timesheet: req.timesheet});
})

timesheetsRouter.post('/', (req, res, next) => {
    const hours = req.body.timesheet.hours;
    const rate = req.body.timesheet.rate;
    const date = req.body.timesheet.date;
    const employeeId = req.params.employeeId;

    // checks if the required fields are provided
    if(!hours || !rate || !date) {
        return res.status(400).send();
    } else {
        // finds the employee with the supplied ID
        db.get(
            'SELECT * FROM Employee WHERE id=$employeeId',
            {$employeeId: employeeId},
            (err, employee) => {
                if(err) {
                    next(err);
                } else if(employee) {
                    // if there is, insert a new timesheet for them
                    db.run(
                        'INSERT INTO Timesheet (hours, rate, date, employee_id) VALUES ($hours, $rate, $date, $employeeId)',
                        {
                            $hours: hours,
                            $rate: rate,
                            $date: date,
                            $employeeId: employeeId
                        },
                        function(err) {
                            if(err) {
                                next(err);
                            } else {
                                // return the newly created timesheet for the employee
                                db.get(
                                    'SELECT * FROM Timesheet WHERE id=$timesheetId',
                                    {$timesheetId: this.lastID},
                                    (err, timesheet) => {
                                        if(err) {
                                            next(err);
                                        } else {
                                            res.status(201).json({timesheet: timesheet});
                                        }
                                    }
                                )
                            }
                        }
                    )
                } else {
                    // if none found, return an error
                    return res.status(404).send();
                }
            }
        )
    }
});

timesheetsRouter.put('/:timesheetId', (req, res, next) => {
    const hours = req.body.timesheet.hours;
    const rate = req.body.timesheet.rate;
    const date = req.body.timesheet.date;
    const employeeId = req.params.employeeId;
    const timesheetId = req.params.timesheetId;

    // if any of the required fields are missing, request not processed and an error returned
    if(!hours || !rate || !date || !employeeId) {
        return res.status(400).send();
    } else {
        // find the employee with the supplied ID
        db.get(
            'SELECT * FROM Employee WHERE id=$employeeId',
            {$employeeId: employeeId},
            (err, employee) => {
                if(err) {
                    next(err);
                } else if(employee) {
                    // if found, find and update their timesheets
                    db.get(
                        'SELECT * FROM Timesheet WHERE id=$timesheetId',
                        {$timesheetId: timesheetId},
                        (err, timesheet) => {
                            if(err) {
                                next(err);
                            } else if(timesheet) {
                                db.run(
                                    'UPDATE Timesheet SET hours=$hours, rate=$rate, date=$date WHERE id=$timesheetId',
                                    {
                                        $hours: hours,
                                        $rate: rate,
                                        $date: date,
                                        $timesheetId: timesheetId
                                    },
                                    (err, timesheet) => {
                                        if(err) {
                                            next(err);
                                        } else {
                                            res.status(200).json({timesheet: timesheet});
                                        }
                                    }
                                )
                            } else {
                                // if no timesheet with the timesheetId found, return an error
                                return res.status(404).send();
                            }
                        }
                    )
                } else {
                    // if none found, return an error
                    return res.status(404).send();
                }
            }
        )
    }
});

timesheetsRouter.delete('/:timesheetId', (req, res, next) => {
    // find employee with the supplied ID
    db.get(
        'SELECT * FROM Employee WHERE id=$employeeId',
        {$employeeId: req.params.employeeId},
        (err, employee) => {
            if(err) {
                next(err);
            } else if(employee) {
                // if there is, find timesheet with the supplied ID
                db.get(
                    'SELECT * FROM Timesheet WHERE id=$timesheetId',
                    {$timesheetId: req.params.timesheetId},
                    (err, timesheet) => {
                        if(err) {
                            next(err);
                        } else if(timesheet) {
                            // if timesheet found, delete it from the database
                            db.run(
                                'DELETE FROM Timesheet WHERE id=$timesheetId',
                                {$timesheetId: req.params.timesheetId},
                                (err) => {
                                    if(err) {
                                        next(err);
                                    } else {
                                        res.status(204).send();
                                    }
                                }
                            )
                        } else {
                            // if no timesheet with that ID found, return an error
                            return res.status(404).send();
                        }
                    }
                )
            } else {
                // if none found, return an error
                return res.status(404).send();
            }
        }
    );
})

module.exports = timesheetsRouter;