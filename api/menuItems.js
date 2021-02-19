const express = require('express');
const menuItemsRouter = express.Router({mergeParams: true});

const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

menuItemsRouter.get('/', (req, res, next) => {
    db.get(
        'SELECT * FROM Menu WHERE id=$menuId',
        {$menuId: req.params.menuId},
        (err, menu) => {
            if(err) {
                next(err);
            } else if(menu) {
                db.all(
                    'SELECT * FROM MenuItem WHERE menu_id=$menuId',
                    {$menuId: req.params.menuId},
                    (err, menuItems) => {
                        if(err) {
                            next(err);
                        } else {
                            res.status(200).json({menuItems: menuItems});
                        }
                    }
                )                
            } else {
                return res.status(404).send();
            }
        }
    )
});

menuItemsRouter.param('menuItemId', (req, res, next, id) => {
    db.get(
        'SELECT * FROM MenuItem WHERE id=$menuItemId',
        {$menuItemId: id},
        (err, menuItem) => {
            if(err) {
                next(err);
            } else if(menuItem) {
                req.menuItem = menuItem;
                next();
            } else {
                return res.status(404).send();
            }
        }
    )
});

menuItemsRouter.get('/:menuItemId', (req, res, next) => {
    res.status(200).json({menuItem: req.menuItem});
})

menuItemsRouter.post('/', (req, res, next) => {
    const name = req.body.menuItem.name;
    const description = req.body.menuItem.description;
    const inventory = req.body.menuItem.inventory;
    const price = req.body.menuItem.price;
    const menuId = req.params.menuId;

    // checks if any of required fields are missing and return 400 response if so
    if(!name || !description || !inventory || !price) {
        return res.status(400).send();
    } else {
        // find if a menu with the supplied ID exists
        db.get(
            'SELECT * FROM Menu WHERE id=$menuId',
            {$menuId: menuId},
            (err, menu) => {
                if(err) {
                    next(err);
                } else if(menu) {
                    // if there is a menu with the ID, create new menuItems for it
                    db.run(
                        'INSERT INTO MenuItem (name, description, inventory, price, menu_id) VALUES ($name, $description, $inventory, $price, $menuId)',
                        {
                            $name: name,
                            $description: description,
                            $inventory: inventory,
                            $price: price,
                            $menuId: menuId
                        },
                        function(err) {
                            if(err) {
                                next(err);
                            } else {
                                db.get(
                                    'SELECT * FROM MenuItem WHERE id=$menuItemId',
                                    {$menuItemId: this.lastID},
                                    (err, menuItem) => {
                                        if(err) {
                                            next(err);
                                        } else {
                                            res.status(201).json({menuItem: menuItem});
                                        }
                                    }
                                )
                            }
                        }
                    )
                } else {
                    // if none, return a 404 response
                    return res.status(404).send();
                }
            }
        )
    }
});

menuItemsRouter.put('/:menuItemId', (req, res, next) => {
    const name = req.body.menuItem.name;
    const description = req.body.menuItem.description;
    const inventory = req.body.menuItem.inventory;
    const price = req.body.menuItem.price;
    const menuId = req.params.menuId;
    const menuItemId = req.params.menuItemId;

    if(!name || !description || !inventory || !price) {
        return res.status(400).send();
    } else {
        // check if menu with the ID exists
        db.get(
            'SELECT * FROM Menu WHERE id=$menuId',
            {$menuId: menuId},
            (err, menu) => {
                if(err) {
                    next(err);
                } else if(menu) {
                    // if found, update the menu's menuItem
                    db.run(
                        'UPDATE MenuItem SET name=$name, description=$description, inventory=$inventory, price=$price WHERE id=$menuItemId',
                        {
                            $name: name,
                            $description: description,
                            $inventory: inventory,
                            $price: price,
                            $menuItemId: menuItemId
                        },
                        (err, menuItem) => {
                            if(err) {
                                next(err);
                            } else {
                                res.status(200).json({menuItem: menuItem});
                            }
                        }
                    )
                } else {
                    // if no menu with that ID found, return an error
                    return res.status(404).send();
                }
            }
        )
    }
});

menuItemsRouter.delete('/:menuItemId', (req, res, next) => {
    // find a menu with the supplied ID
    db.get(
        'SELECT * FROM Menu WHERE id=$menuId',
        {$menuId: req.params.menuId},
        (err, menu) => {
            if(err) {
                next(err);
            } else if(menu) {
                // if menu exists, find and delete the menuItem with the supplied menuItem ID
                db.get(
                    'SELECT * FROM MenuItem WHERE id=$menuItemId',
                    {$menuItemId: req.params.menuItemId},
                    (err, menuItem) => {
                        if(err) {
                            next(err);
                        } else if(menuItem) {
                            // delete the menuItem
                            db.run(
                                'DELETE FROM MenuItem WHERE id=$menuItemId',
                                {$menuItemId: req.params.menuItemId},
                                (err) => {
                                    if(err) {
                                        next(err);
                                    } else {
                                        res.status(204).send();
                                    }
                                }
                            )
                        } else {
                            // if no menuItem with that ID found, return an error
                            return res.status(404).send();
                        }
                    }
                ) 
            } else {
                // if no menu with that ID found, return an error
                return res.status(404).send();
            }
        }
    )
})

module.exports = menuItemsRouter;