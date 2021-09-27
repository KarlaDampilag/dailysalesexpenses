const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { randomBytes } = require('crypto');
const { promisify } = require('util');
const { APP_SECRET, MAIL_USER } = require('../utils');
const { transport, makeANiceEmail } = require('../mail');

const frontendURL = process.env.NODE_ENV === 'production' ? process.env.PROD_FRONTEND_URL : process.env.DEV_FRONTEND_URL;

async function signup(parent, args, ctx, info) {
    // check if the passwords match
    if (args.password !== args.confirmPassword) {
        throw new Error("Passwords don't match");
    }

    // lowercase their email
    args.email = args.email.toLowerCase();

    // check if user already exists
    const existingUser = await ctx.prisma.user({ email: args.email });

    if (existingUser) {
        throw new Error('Email is already taken');
    }

    // hash their password
    const password = await bcrypt.hash(args.password, 10);

    // set a reset token and expiry on that user
    const randomBytesPromiseified = promisify(randomBytes);
    const confirmEmailToken = (await randomBytesPromiseified(20)).toString('hex');

    // email them that verification token
    const mailResponse = await transport.sendMail({
        from: MAIL_USER,
        to: args.email,
        subject: 'Please confirm your email',
        html: makeANiceEmail(
            `You signed up to use the Daily Sales And Expenses Application. Please confirm that you own this email - click on the link to proceed: \n\n
        <a href="${frontendURL}/confirmEmail?confirmEmailToken=${confirmEmailToken}">Click here to confirm</a>`
        )
    });

    // create the user in the database
    const user = await ctx.prisma.createUser({
        email: args.email,
        password,
        role: 'owner',
        verified: false,
        confirmEmailToken
    });

    return user;
}

async function login(parent, args, ctx, info) {
    const user = await ctx.prisma.user({ email: args.email });
    if (!user) {
        throw new Error('Invalid email or password');
    }

    const valid = await bcrypt.compare(args.password, user.password);
    if (!valid) {
        throw new Error('Invalid email or password');
    }

    const token = jwt.sign({ userId: user.id }, APP_SECRET);

    // We set the jwt as a cookie on the response
    ctx.response.cookie('token', token, {
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24 * 365, // 1 year cookie
        sameSite: 'none',
        secure: true
    });

    return user;
}

function logout(parent, args, ctx, info) {
    ctx.response.clearCookie('token', {
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24 * 365, // 1 year cookie
        sameSite: 'none',
        secure: true
    });
    return 'Goodbye!';
}

async function createProduct(parent, args, ctx, info) {
    if (!ctx.request.userId) {
        throw new Error('You must be logged in to do that.');
    }

    const product = await ctx.prisma.createProduct({
        ...args,
        // create a relationship between the product and the user
        user: {
            connect: {
                id: ctx.request.userId
            }
        },
        categories: { set: args.categories }
    });

    return product;
}

async function createProducts(parent, args, ctx, info) {
    if (!ctx.request.userId) {
        throw new Error('You must be logged in to do that.');
    }

    const savedProducts = [];

    await Promise.all(args.products.map(async (product) => {
        console.log(product)
        if (product.categories) {
            const newCategories = await Promise.all(product.categories.map(async name => {
                const newCategory = await ctx.prisma.createCategory({
                    // create a relationship between the category and the user
                    user: {
                        connect: {
                            id: ctx.request.userId
                        }
                    },
                    name: name
                });
                return newCategory;
            }));
        }

        const newProduct = await ctx.prisma.createProduct({
            ...product,
            // create a relationship between the product and the user
            user: {
                connect: {
                    id: ctx.request.userId
                }
            },
            categories: { set: product.categories }
        });
        savedProducts.push(newProduct);
    }));

    return savedProducts;
}

async function createCategories(parent, args, ctx, info) {
    if (!ctx.request.userId) {
        throw new Error('You must be logged in to do that.');
    }

    const newCategories = await Promise.all(args.names.map(async name => {
        const newCategory = await ctx.prisma.createCategory({
            // create a relationship between the category and the user
            user: {
                connect: {
                    id: ctx.request.userId
                }
            },
            name: name
        });
        return newCategory;
    }));
    return newCategories;
}

async function updateProduct(parent, args, ctx, info) {
    if (!ctx.request.userId) {
        throw new Error('You must be logged in to do that.');
    }

    // find the product
    const products = await ctx.prisma.user({ id: ctx.request.userId }).products({
        where: { id: args.id }
    });

    if (!products || products.length < 1 || !products[0]) {
        throw new Error("Cannot find this product owned by your user id.");
    }

    // first take a copy of the updates
    const updates = { ...args };

    // remove id from the updates so it won't get updated
    delete updates.id

    return await ctx.prisma.updateProduct({
        data: {
            ...updates,
            categories: { set: args.categories }
        },
        where: {
            id: args.id
        }
    });
}

async function deleteProduct(parent, args, ctx, info) {
    if (!ctx.request.userId) {
        throw new Error('You must be logged in to do that.');
    }

    // find the product
    const products = await ctx.prisma.user({ id: ctx.request.userId }).products({
        where: { id: args.id }
    });

    if (!products || products.length < 1 || !products[0]) {
        throw new Error("Cannot find this product owned by your user id.");
    }

    // add check if product is part of a sale
    const where = {
        AND: [
            { product: { id: products[0].id } }
        ]
    };
    const saleItems = await ctx.prisma.saleItems({ where });

    if (saleItems.length > 0) {
        throw new Error(`Cannot delete a product that is part of an existing sale item.`);
    }
    return await ctx.prisma.deleteProduct({ id: args.id });
}

async function createInventory(parent, args, ctx, info) {
    if (!ctx.request.userId) {
        throw new Error('You must be logged in to do that.');
    }

    // TODO do not allow creation of more than one, if user has free account

    const inventory = await ctx.prisma.createInventory({
        ...args,
        // create a relationship between the inventory and the user
        user: {
            connect: {
                id: ctx.request.userId
            }
        }
    });

    return inventory;
}

async function updateInventory(parent, args, ctx, info) {
    if (!ctx.request.userId) {
        throw new Error('You must be logged in to do that.');
    }

    const inventory = await ctx.prisma.user({ id: ctx.request.userId }).inventories({
        where: { id: args.id }
    });

    if (!inventory || inventory.length < 1 || !inventory[0]) {
        throw new Error("Cannot find this inventory owned by your user id.");
    }

    // first take a copy of the updates
    const updates = { ...args };

    // remove id from the updates so it won't get updated
    delete updates.id

    return await ctx.prisma.updateInventory({
        data: {
            ...updates
        },
        where: {
            id: args.id
        }
    });
}

async function deleteInventory(parent, args, ctx, info) {
    if (!ctx.request.userId) {
        throw new Error('You must be logged in to do that.');
    }

    // find the product
    const inventories = await ctx.prisma.user({ id: ctx.request.userId }).inventories({
        where: { id: args.id }
    });

    if (!inventories || inventories.length < 1 || !inventories[0]) {
        throw new Error("Cannot find this inventory owned by your user id.");
    }
    return await ctx.prisma.deleteInventory({ id: args.id });
}

async function createCustomer(parent, args, ctx, info) {
    if (!ctx.request.userId) {
        throw new Error('You must be logged in to do that.');
    }

    const customer = await ctx.prisma.createCustomer({
        ...args,
        // create a relationship between the product and the user
        user: {
            connect: {
                id: ctx.request.userId
            }
        }
    });

    return customer;
}

async function updateCustomer(parent, args, ctx, info) {
    if (!ctx.request.userId) {
        throw new Error('You must be logged in to do that.');
    }

    const customers = await ctx.prisma.user({ id: ctx.request.userId }).customers({
        where: { id: args.id }
    });

    if (!customers || customers.length < 1 || !customers[0]) {
        throw new Error("Cannot find this customer owned by your user id.");
    }

    // first take a copy of the updates
    const updates = { ...args };

    // remove id from the updates so it won't get updated
    delete updates.id

    return await ctx.prisma.updateCustomer({
        data: {
            ...updates
        },
        where: {
            id: args.id
        }
    });
}

async function deleteCustomer(parent, args, ctx, info) {
    if (!ctx.request.userId) {
        throw new Error('You must be logged in to do that.');
    }

    const objects = await ctx.prisma.user({ id: ctx.request.userId }).customers({
        where: { id: args.id }
    });

    if (!objects || objects.length < 1 || !objects[0]) {
        throw new Error("Cannot find this customer owned by your user id.");
    }
    return await ctx.prisma.deleteCustomer({ id: args.id });
}

async function createSaleAndItems(parent, args, ctx, info) {
    if (!ctx.request.userId) {
        throw new Error('You must be logged in to do that.');
    }

    const arguments = { ...args };
    delete arguments.customerId;
    delete arguments.saleItems;

    let sale;
    if (args.customerId) {
        sale = await ctx.prisma.createSale({
            user: {
                connect: {
                    id: ctx.request.userId
                }
            },
            customer: {
                connect: {
                    id: args.customerId
                }
            },
            ...arguments
        });
    } else {
        sale = await ctx.prisma.createSale({
            user: {
                connect: {
                    id: ctx.request.userId
                }
            },
            ...arguments
        });
    }

    const savedItems = [];
    await Promise.all(args.saleItems.map(async (saleItem) => {
        const saveArguments = { ...saleItem };
        delete saveArguments.product;
        const savedItem = await ctx.prisma.createSaleItem({
            sale: {
                connect: {
                    id: sale.id
                }
            },
            product: {
                connect: {
                    id: saleItem.product.id
                }
            },
            salePrice: saleItem.product.salePrice,
            costPrice: saleItem.product.costPrice,
            ...saveArguments
        });
        savedItems.push(savedItem);
    }));

    const fragment = `
    fragment SaleCreateWithOthers on User {
        id
        timestamp
        customer {
            id
            name
        }
        saleItems {
            id
            quantity
            product {
                id
                name
                salePrice
                costPrice
                categories
            }
            salePrice
            costPrice
        }
        discountType
        discountValue
        taxType
        taxValue
        shipping
        note
        createdAt
    }
    `;

    return await ctx.prisma.sale({ id: sale.id }).$fragment(fragment);
}

async function deleteSaleAndItems(parent, args, ctx, info) {
    if (!ctx.request.userId) {
        throw new Error('You must be logged in to do that.');
    }

    const objects = await ctx.prisma.user({ id: ctx.request.userId }).sales({
        where: { id: args.id }
    });

    if (!objects || objects.length < 1 || !objects[0]) {
        throw new Error("Cannot find this sale owned by your user id.");
    }

    await ctx.prisma.deleteManySaleItems({ sale: { id: args.id } });

    const fragment = `
    fragment SaleDeleteWithOthers on User {
        id
        timestamp
        customer {
            id
            name
        }
        saleItems {
            id
            quantity
            product {
                id
                name
                salePrice
                costPrice
                categories
            }
            salePrice
            costPrice
        }
        discountType
        discountValue
        taxType
        taxValue
        shipping
        note
        createdAt
    }
    `;

    return await ctx.prisma.deleteSale({ id: args.id }).$fragment(fragment);
}

async function updateSaleAndItems(parent, args, ctx, info) {
    if (!ctx.request.userId) {
        throw new Error('You must be logged in to do that.');
    }

    const objects = await ctx.prisma.user({ id: ctx.request.userId }).sales({
        where: { id: args.id }
    });

    if (!objects || objects.length < 1 || !objects[0]) {
        throw new Error("Cannot find this sale owned by your user id.");
    }

    const arguments = { ...args };
    delete arguments.customerId;
    delete arguments.saleItems;
    delete arguments.id;

    await ctx.prisma.deleteManySaleItems({ sale: { id: args.id } });

    const savedItems = [];
    await Promise.all(args.saleItems.map(async (saleItem) => {
        const saveArguments = { ...saleItem };
        delete saveArguments.product;
        const savedItem = await ctx.prisma.createSaleItem({
            sale: {
                connect: {
                    id: args.id
                }
            },
            product: {
                connect: {
                    id: saleItem.product.id
                }
            },
            salePrice: saleItem.product.salePrice,
            costPrice: saleItem.product.costPrice,
            ...saveArguments
        });
        savedItems.push(savedItem);
    }));

    let sale;
    if (args.customerId) {
        sale = await ctx.prisma.updateSale({
            data: {
                user: {
                    connect: {
                        id: ctx.request.userId
                    }
                },
                customer: {
                    connect: {
                        id: args.customerId
                    }
                },
                ...arguments
            },
            where: {
                id: args.id
            }
        });
    } else {
        sale = await ctx.prisma.updateSale({
            data: {
                user: {
                    connect: {
                        id: ctx.request.userId
                    }
                },
                ...arguments
            },
            where: {
                id: args.id
            }
        });
    }

    const fragment = `
    fragment SaleUpdateWithOthers on User {
        id
        timestamp
        customer {
            id
            name
        }
        saleItems {
            quantity
            product {
                id
                name
                salePrice
                costPrice
                categories
            }
            salePrice
            costPrice
        }
        discountType
        discountValue
        taxType
        taxValue
        shipping
        note
        createdAt
    }
    `;
    return await ctx.prisma.sale({ id: args.id }).$fragment(fragment);
}

async function addInventoryStock(parent, args, ctx, info) {
    if (!ctx.request.userId) {
        throw new Error('You must be logged in to do that.');
    }

    const objects = await ctx.prisma.user({ id: ctx.request.userId }).inventories({
        where: { id: args.id }
    });

    if (!objects || objects.length < 1 || !objects[0]) {
        throw new Error("Cannot find this inventory owned by your user id.");
    }

    await Promise.all(args.inventoryItems.map(async (item) => {
        // find an inventory item where this is the product id and inventory id
        const where = {
            AND: [
                { product: { id: item.product.id } },
                { inventory: { id: args.id } }
            ]
        };
        const inventoryItems = await ctx.prisma.inventoryItems({ where });
        // if exists, just add amount to current amount
        if (inventoryItems && inventoryItems.length > 0) {
            const newAmount = inventoryItems[0].amount + item.quantity;
            await ctx.prisma.updateInventoryItem({
                data: {
                    amount: newAmount
                },
                where: {
                    id: inventoryItems[0].id
                }
            });
        } else { // if not exists, create it, then set amount
            const newInventoryItem = await ctx.prisma.createInventoryItem({
                user: {
                    connect: {
                        id: ctx.request.userId
                    }
                },
                inventory: {
                    connect: {
                        id: args.id
                    }
                },
                product: {
                    connect: {
                        id: item.product.id
                    }
                },
                amount: item.quantity
            })
        }
        // TODO create transaction!
    }));

    const fragment = `
    fragment InventoryWithOthers on User {
        id
        name
        inventoryItems {
            id
            product {
                id
                name
                unit
            }
            amount
            createdAt
        }
    }
    `;
    return await ctx.prisma.inventory({ id: args.id }).$fragment(fragment);
}

async function removeInventoryStock(parent, args, ctx, info) {
    if (!ctx.request.userId) {
        throw new Error('You must be logged in to do that.');
    }

    const objects = await ctx.prisma.user({ id: ctx.request.userId }).inventories({
        where: { id: args.id }
    });

    if (!objects || objects.length < 1 || !objects[0]) {
        throw new Error("Cannot find this inventory owned by your user id.");
    }

    await Promise.all(args.inventoryItems.map(async (item) => {
        // find an inventory item where this is the product id and inventory id
        const where = {
            AND: [
                { product: { id: item.product.id } },
                { inventory: { id: args.id } }
            ]
        };
        const inventoryItems = await ctx.prisma.inventoryItems({ where });
        // if exists, just subtract amount to current amount
        if (inventoryItems && inventoryItems.length > 0) {
            const newAmount = inventoryItems[0].amount - item.quantity;
            await ctx.prisma.updateInventoryItem({
                data: {
                    amount: newAmount
                },
                where: {
                    id: inventoryItems[0].id
                }
            });
        } else { // if not exists, create it, then set amount
            const newInventoryItem = await ctx.prisma.createInventoryItem({
                user: {
                    connect: {
                        id: ctx.request.userId
                    }
                },
                inventory: {
                    connect: {
                        id: args.id
                    }
                },
                product: {
                    connect: {
                        id: item.product.id
                    }
                },
                amount: item.quantity
            })
        }
        // TODO create transaction!
    }));

    const fragment = `
    fragment InventoryWithOthers on User {
        id
        name
        inventoryItems {
            id
            product {
                id
                name
                unit
            }
            amount
            createdAt
        }
    }
    `;
    return await ctx.prisma.inventory({ id: args.id }).$fragment(fragment);
}

async function createExpense(parent, args, ctx, info) {
    if (!ctx.request.userId) {
        throw new Error('You must be logged in to do that.');
    }

    const expense = await ctx.prisma.createExpense({
        ...args,
        user: {
            connect: {
                id: ctx.request.userId
            }
        }
    });

    return expense;
}

async function updateExpense(parent, args, ctx, info) {
    if (!ctx.request.userId) {
        throw new Error('You must be logged in to do that.');
    }

    const object = await ctx.prisma.user({ id: ctx.request.userId }).expenses({
        where: { id: args.id }
    });

    if (!object || object.length < 1 || !object[0]) {
        throw new Error("Cannot find this expense owned by your user id.");
    }

    // first take a copy of the updates
    const updates = { ...args };

    // remove id from the updates so it won't get updated
    delete updates.id

    return await ctx.prisma.updateExpense({
        data: {
            ...updates
        },
        where: {
            id: args.id
        }
    });
}

async function deleteExpense(parent, args, ctx, info) {
    if (!ctx.request.userId) {
        throw new Error('You must be logged in to do that.');
    }

    const objects = await ctx.prisma.user({ id: ctx.request.userId }).expenses({
        where: { id: args.id }
    });

    if (!objects || objects.length < 1 || !objects[0]) {
        throw new Error("Cannot find this expense owned by your user id.");
    }
    return await ctx.prisma.deleteExpense({ id: args.id });
}

async function requestReset(parent, args, ctx, info) {
    // 1. Check if this is a real user
    const user = await ctx.prisma.user({ email: args.email });
    if (!user) {
        throw new Error(`No such user found for email: ${args.email}`);
    }
    // 2. Set a reset token and expiry on that user
    const randomBytesPromiseified = promisify(randomBytes);
    const resetToken = (await randomBytesPromiseified(20)).toString('hex');
    const resetTokenExpiry = (Date.now() + 3600000).toString(); // 1 hour from now

    const res = await ctx.prisma.updateUser({
        where: { email: args.email },
        data: { resetToken, resetTokenExpiry }
    });

    // 3. Email them that reset token
    const mailResponse = await transport.sendMail({
        from: MAIL_USER,
        to: user.email,
        subject: 'Your password reset token',
        html: makeANiceEmail(
            `A request to reset the password for this email has been received. Click on the link to proceed: \n\n
        <a href="${frontendURL}/resetPassword?resetToken=${resetToken}">Click here to reset your password</a>`
        )
    });

    return user;
}

async function resetPassword(parent, args, ctx, info) {
    // 1. check if the passwords match
    if (args.password !== args.confirmPassword) {
        throw new Error("Yo Passwords don't match!");
    }
    // 2. check if its a legit reset token
    // 3. Check if its expired
    const [user] = await ctx.prisma.users({
        where: {
            resetToken: args.resetToken,
            resetTokenExpiry_gte: (Date.now() - 3600000).toString(),
        },
    });
    if (!user) {
        throw new Error('This password reset token is either invalid or expired!');
    }
    // 4. Hash their new password
    const password = await bcrypt.hash(args.password, 10);
    // 5. Save the new password to the user and remove old resetToken fields
    const updatedUser = await ctx.prisma.updateUser({
        where: { email: user.email },
        data: {
            password,
            resetToken: null,
            resetTokenExpiry: null,
        },
    });
    // 6. Generate JWT
    const token = jwt.sign({ userId: updatedUser.id }, APP_SECRET);
    // 7. Set the JWT cookie
    ctx.response.cookie('token', token, {
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24 * 365,
        sameSite: 'none',
        secure: true
    });
    // 8. return the new user
    return updatedUser;
}

async function confirmEmail(parent, args, ctx, info) {
    // check if its a legit reset token
    const [user] = await ctx.prisma.users({
        where: {
            confirmEmailToken: args.confirmEmailToken,
        },
    });
    if (!user) {
        throw new Error('This password email confirmation token is invalid!');
    }
    // 5. Save the new password to the user and remove old resetToken fields
    const updatedUser = await ctx.prisma.updateUser({
        where: { email: user.email },
        data: {
            confirmEmailToken: null,
            verified: true
        },
    });
    // 6. Generate JWT
    const token = jwt.sign({ userId: updatedUser.id }, APP_SECRET);
    // 7. Set the JWT cookie
    ctx.response.cookie('token', token, {
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24 * 365,
        sameSite: 'none',
        secure: true
    });
    // 8. return the new user
    return updatedUser;
}

module.exports = {
    signup,
    login,
    logout,
    createProduct,
    createProducts,
    createCategories,
    updateProduct,
    deleteProduct,
    createInventory,
    updateInventory,
    deleteInventory,
    addInventoryStock,
    removeInventoryStock,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    createSaleAndItems,
    deleteSaleAndItems,
    updateSaleAndItems,
    createExpense,
    updateExpense,
    deleteExpense,
    requestReset,
    resetPassword,
    confirmEmail
}