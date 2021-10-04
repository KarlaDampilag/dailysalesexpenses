async function me(parent, args, ctx, info) {
    // check if there is a current user ID
    if (!ctx.request.userId) {
        return null;
    }
    return await ctx.prisma.user({ id: ctx.request.userId });
}

function products(parent, args, ctx, info) {
    if (!ctx.request.userId) {
        throw new Error('You must be logged in to do that.');
    }
    return ctx.prisma.products({});
}

async function productsByUser(parent, args, ctx, info) {
    if (!ctx.request.userId) {
        throw new Error('You must be logged in to do that.');
    }

    return await ctx.prisma.user({ id: ctx.request.userId }).products();
}

async function productByUser(parent, args, ctx, info) {
    if (!ctx.request.userId) {
        throw new Error('You must be logged in to do that.');
    }

    const products = await ctx.prisma.user({ id: ctx.request.userId }).products({
        where: { id: args.id }
    });
    if (!products || products.length < 1 || !products[0]) {
        throw new Error("Cannot find this product owned by your user id.");
    }
    return products[0];
}

function categories(parent, args, ctx, info) {
    if (!ctx.request.userId) {
        throw new Error('You must be logged in to do that.');
    }
    return ctx.prisma.categories({});
}

async function categoriesByUser(parent, args, ctx, info) {
    if (!ctx.request.userId) {
        throw new Error('You must be logged in to do that.');
    }
    return await ctx.prisma.categories({
        where: {
            user: { id: ctx.request.userId }
        }
    });
}

async function inventoriesByUser(parent, args, ctx, info) {
    if (!ctx.request.userId) {
        throw new Error('You must be logged in to do that.');
    }

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
    return await ctx.prisma.user({ id: ctx.request.userId }).inventories().$fragment(fragment);
}

async function inventoryByUser(parent, args, ctx, info) {
    if (!ctx.request.userId) {
        throw new Error('You must be logged in to do that.');
    }
    const items = await ctx.prisma.user({ id: ctx.request.userId }).inventories({
        where: { id: args.id }
    });
    if (!items || items.length < 1 || !items[0]) {
        throw new Error("Cannot find this inventory owned by your user id.");
    }
    return items[0];
}

async function inventoryAndItemsByUser(parent, args, ctx, info) {
    if (!ctx.request.userId) {
        throw new Error('You must be logged in to do that.');
    }
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

async function customersByUser(parent, args, ctx, info) {
    if (!ctx.request.userId) {
        throw new Error('You must be logged in to do that.');
    }
    return await ctx.prisma.user({ id: ctx.request.userId }).customers();
}

async function salesByUser(parent, args, ctx, info) {
    if (!ctx.request.userId) {
        throw new Error('You must be logged in to do that.');
    }

    const fragment = `
    fragment SalesWithOthers on User {
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
                sku
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

    return await ctx.prisma.user({ id: ctx.request.userId }).sales({ orderBy: args.orderBy }).$fragment(fragment);
}

async function expensesByUser(parent, args, ctx, info) {
    if (!ctx.request.userId) {
        throw new Error('You must be logged in to do that.');
    }
    return await ctx.prisma.user({ id: ctx.request.userId }).expenses({ orderBy: args.orderBy });
}

module.exports = {
    me,
    products,
    productByUser,
    productsByUser,
    categories,
    categoriesByUser,
    inventoriesByUser,
    inventoryByUser,
    inventoryAndItemsByUser,
    customersByUser,
    salesByUser,
    expensesByUser
}