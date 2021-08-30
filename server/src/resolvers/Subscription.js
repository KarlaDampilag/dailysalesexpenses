/*
* Function used to resolve subscriptions and push the event data.
* Rather than returning any data directly, they return an AsyncIterator which is used by the GraphQL server
* to push the event data to the client.
*/
function newLinkSubscribe(parent, args, context, info) {
    // the prisma client instance on the context exposes a $subscribe property which proxies the subscriptions from the Prisma API
    return context.prisma.$subscribe.link({ mutation_in: ['CREATED'] }).node()
}


const newLink = {
    subscribe: newLinkSubscribe, // the subscription resolver is provided as the value for a subscribe field inside a plain JavaScript object
    resolve: payload => { // field that actually returns the data from the data emitted by the AsyncIterator
        return payload
    },
}

module.exports = {
    newLink,
}