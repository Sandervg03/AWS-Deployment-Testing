function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

exports.handler = async (event) => {
    await delay(500);
    return {
        statusCode: 200,
        body: "Dit is testFunction"
    }
}