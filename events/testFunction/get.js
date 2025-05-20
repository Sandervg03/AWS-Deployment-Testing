const {handler} = require("../../functions/testFunction");

async function main() {
    console.log("test")
    console.log(await handler({}))
}

main();