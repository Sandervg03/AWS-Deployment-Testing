function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

exports.handler = async (event) => {
    await delay(500);
    console.log("Test123");
    return {
        statusCode: 200,
        body: "This seems correct"
    }
}