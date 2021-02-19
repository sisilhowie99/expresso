const express = require('express');
const employeesRouter = express.Router();

const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

const timesheetsRouter = require('./timesheets');
employeesRouter.use('/:employeeId/timesheets', timesheetsRouter);

employeesRouter.get('/', (req, res, next) => {
    db.all(
        'SELECT * FROM Employee WHERE is_current_employee=1',
        (err, employees) => {
            if(err) {
                next(err);
            } else {
                res.status(200).json({employees: employees});
            }
        }
    )
});

employeesRouter.param('employeeId', (req, res, next, id) => {
    db.get(
        'SELECT * FROM Employee WHERE id=$employeeId',
        {$employeeId: id},
        (err, employee) => {
            if(err) {
                next(err);
            } else if(employee) {
                req.employee = employee;
                next();
            } else {
                return res.status(404).send();
            }
        }
    )
});

employeesRouter.get('/:employeeId', (req, res, next) => {
    res.status(200).json({employee: req.employee});
})

employeesRouter.post('/', (req, res, next) => {
    const name = req.body.employee.name;
    const position = req.body.employee.position;
    const wage = req.body.employee.wage;

    // checks if the required fields exist
    if(!name || !position || !wage) {
        return res.status(400).send();
    } else {
        // add the new employee to the database
        db.run(
            'INSERT INTO Employee (name, position, wage) VALUES ($name, $position, $wage)',
            {
            $name: name,
            $position: position,
            $wage: wage 
            },
            function(err) {
                db.get(
                    'SELECT * FROM Employee WHERE id=$employeeId',
                    {$employeeId: this.lastID},
                    (err, employee) => {
                        if(err) {
                            next(err);
                        } else {
                            res.status(201).json({employee: employee});
                        }
                    }
                )
            }
        )
    }

});

employeesRouter.put('/:employeeId', (req, res, next) => {
    const name = req.body.employee.name;
    const position = req.body.employee.position;
    const wage = req.body.employee.wage;

    // checks if the required fields exist
    if (!name || !position || !wage) {
        return res.status(400).send();
    } else {
        // checks if the employee with the provided ID exists
        db.get(
            'SELECT * FROM Employee WHERE id=$employeeId',
            {$employeeId: req.params.employeeId},
            (err) => {
                if(err) {
                    // return an error if there's no employee with that ID
                    next(err);
                } else {
                    // update the employee's details if they exist in the database
                    db.run(
                        'UPDATE Employee SET name=$name, position=$position, wage=$wage WHERE id=$employeeId',
                        {
                            $name: name,
                            $position: position,
                            $wage: wage,
                            $employeeId: req.params.employeeId
                        },
                        (err) => {
                            if(err) {
                                next(err);
                            } else {
                                db.get(
                                    'SELECT * FROM Employee WHERE id=$employeeId',
                                    {$employeeId: req.params.employeeId},
                                    (err, employee) => {
                                        if(err) {
                                            next(err);
                                        } else {
                                            res.status(200).json({employee: employee});
                                        }
                                    }
                                )
                            }
                        }
                    )

                }
            }
        )
    }
});

employeesRouter.delete('/:employeeId', (req, res, next) => {
    // check if employee with the ID exists in the database
    db.run(
        'SELECT * FROM Employee WHERE id=$employeeId',
        {$employeeId: req.params.employeeId},
        (err) => {
            if (err) {
                // if not, return an error
                next(err);
            } else {
                // otherwise update the employment status
                db.run(
                    'UPDATE Employee SET is_current_employee=0 WHERE id=$employeeId',
                    {$employeeId: req.params.employeeId},
                    (err) => {
                        if (err) {
                            next(err);
                        } else {
                            // returns the updated employee
                            db.get(
                                'SELECT * FROM Employee WHERE id=$employeeId',
                                {$employeeId: req.params.employeeId},
                                (err, employee) => {
                                    if (err) {
                                        next(err);
                                    } else {
                                        res.status(200).json({employee: employee});
                                    }
                                }
                            )
                        }
                    }
                )
            }
    })
});



module.exports = employeesRouter;