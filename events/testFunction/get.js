const {handler} = require("../../functions/testFunction");

async function main() {
    console.log("Starting main function execution")
    console.log(await handler({}))
}

main();