const {handler} = require("../../functions/testFunction");

describe("testFunctionTest", () => {
    it("should return 200 statusCode", async () => {
        expect((await handler({})).statusCode).toBe(200)
    })
})