const {handler} = require("../../functions/testFunction");

async function main() {
    console.log(await handler({}))
}

main();