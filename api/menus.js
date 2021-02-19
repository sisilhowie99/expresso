const express = require('express');
const menusRouter = express.Router();

const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

const menuItemsRouter = require('./menuItems');
menusRouter.use('/:menuId/menu-items', menuItemsRouter);

menusRouter.get('/', (req, res, next) => {
    db.all(
        'SELECT * FROM Menu',
        (err, menus) => {
            if(err) {
                next(err);
            } else {
                res.status(200).json({menus: menus});
            }
        }
    )
});

menusRouter.param('menuId', (req, res, next, id) => {
    db.get(
        'SELECT * FROM Menu WHERE id=$menuId',
        {$menuId: id},
        (err, menu) => {
            if(err) {
                next(err);
            } else if(menu) {
                req.menu = menu;
                next();
            } else {
                return res.status(404).send();
            }
        }
    )
});

menusRouter.get('/:menuId', (req, res, next) => {
    res.status(200).json({menu: req.menu});
})

menusRouter.post('/', (req, res, next) => {
    // check if the required field is provided
    const title = req.body.menu.title;

    if(!title) {
        // if not then return an error
        return res.status(400).send();
    } else {
        // otherwise insert into the database
        db.run(
            'INSERT INTO Menu (title) VALUES ($title)',
            {$title: title},
            function(err) {
                if(err) {
                    next(err);
                } else {
                    // return the newly created menu
                    db.get(
                        'SELECT * FROM Menu WHERE id=$menuId',
                        {$menuId: this.lastID},
                        (err, menu) => {
                            if(err) {
                                next(err);
                            } else {
                                res.status(201).json({menu: menu});
                            }
                        }
                    )
                }
            }
        )
    }
});

menusRouter.put('/:menuId', (req, res, next) => {
    const title = req.body.menu.title;

    if(!title) {
        return res.status(400).send();
    } else {
        // find if menu with the ID exist
        db.get(
            'SELECT * FROM Menu WHERE id=$menuId',
            {$menuId: req.params.menuId},
            (err, menu) => {
                if(err) {
                    next(err);
                } else if(menu) {
                    // if the menu exists, update it with the provided new info
                    db.run(
                        'UPDATE Menu SET title=$title WHERE id=$menuId',
                        {
                            $title: title,
                            $menuId: req.params.menuId
                        },
                        (err) => {
                            if(err) {
                                next(err);
                            } else {
                                db.get(
                                    'SELECT * FROM MENU WHERE id=$menuId',
                                    {$menuId: req.params.menuId},
                                    (err, menu) => {
                                        if(err) {
                                            next(err);
                                        } else {
                                            res.status(200).json({menu: menu});
                                        }
                                    }
                                )
                            }
                        }
                    )
                } else {
                    return res.status(404).send();
                }
            }
        )
    }
});

menusRouter.delete('/:menuId', (req, res, next) => {
    // checks if the menu with that ID exists
    db.get(
        'SELECT * FROM Menu WHERE id=$menuId',
        {$menuId: req.params.menuId},
        (err, menu) => {
            if(err) {
                next(err);
            } else if(menu) {
                // if there is, check if there's related menuItems for this menu
                db.get(
                    'SELECT * FROM MenuItem WHERE menu_id=$menuId',
                    {$menuId: req.params.menuId},
                    (err, menuItem) => {
                        if(err) {
                            next(err);
                        } else if(menuItem) {
                            // if the menu has menuItems, return a 400 response and don't process the request
                            return res.status(400).send();
                        } else {
                            // if the menu has no menuItems, proceed to delete
                            db.run(
                                'DELETE FROM Menu WHERE id=$menuId',
                                {$menuId: req.params.menuId},
                                (err) => {
                                    if(err) {
                                        next(err);
                                    } else {
                                        res.status(204).send();
                                    }
                                }
                            )
                        }
                    }
                )
            } else {
                // return an error if none found
                return res.status(404).send();
            }
        }
    
    )
});

module.exports = menusRouter;