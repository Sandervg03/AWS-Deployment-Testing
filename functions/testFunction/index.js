function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

exports.handler = async (event) => {
    await delay(100);
    console.log("Test");
    return {
        statusCode: 200,
        body: "Sebastiaan is fucking cool"
    }
}