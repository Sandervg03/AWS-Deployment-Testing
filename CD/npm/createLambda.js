import * as readline from "readline";
import { LambdaClient, GetFunctionCommand, CreateFunctionCommand } from "@aws-sdk/client-lambda";
import { APIGatewayClient } from "@aws-sdk/client-api-gateway";
import * as fs from "fs/promises";
import * as zip from "zip-lib";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);
const readlineInterface = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

class LambdaFactory {
    constructor() {
        this.lambdaClient = new LambdaClient({});
        this.apiGatewayClient = new APIGatewayClient({});
    }

    async create() {
        readlineInterface.question("What will your lambda function be called? \n", async name => {
            try {
                if (await this.doesLambdaFunctionExist(name)) {
                    console.error('\x1b[31m%s\x1b[0m', "\n[ERROR] This function already exists, please try again.\n");
                    return this.create();
                }

                console.log("\n\x1b[33m", `Preparing directories for function: ${name}...`);
                await this.prepareFunctionDirectories(name);
                console.log("\n\x1b[42m", `Directories created successfully.`);
                console.log("\n\x1b[33m", `Preparing lambda dependencies for function: ${name}...`);
                await this.installDependencies(name);
                console.log("\n\x1b[42m", `Lambda dependencies created successfully.`);

                console.log("\n\x1b[33m", `Registering function: ${name}, to AWS Lambda...`);
                const lambdaFunction = await this.createLambdaFunction(name);
                console.log(lambdaFunction);
                console.log("\n\x1b[42m", `Lambda function ${name} was created successfully.`);

                console.log("\n\x1b[33m", `Removing function-level node-modules from: ${name}`);
                await fs.rm(`functions/${name}/node_modules`, { recursive: true });



                await fs.rm("function.zip", { recursive: true });

                readlineInterface.close();
            } catch (error) {
                console.error(error.message);
                console.error('\n\x1b[31m%s\x1b[0m', "[ERROR] Something went wrong.");
                console.error('\n\x1b[31m%s\x1b[0m', "Your function may not have been properly registered.");
                console.error('\n\x1b[31m%s\x1b[0m', "Please remove all traces of the function in API Gateway, Lambda and local.\n");
                console.error("\n\x1b[33m", "If this keeps happening, please manually create your directories as all others,");
                console.error("\n\x1b[33m", "or ask a senior for help.");
                readlineInterface.close();
            }
        })
    }

    async doesLambdaFunctionExist(name) {
        try {
            await this.lambdaClient.send(new GetFunctionCommand({ FunctionName: name }));
            return true;
        } catch (error) {
            if (error.name === "ResourceNotFoundException") return false;
            throw error;
        }
    }

    async prepareFunctionDirectories(name) {
        const functionPath = `functions/${name}`;
        await fs.cp("CD/template/function", functionPath, { recursive: true });
        await fs.cp("CD/template/events", `events/${name}`, { recursive: true });
        await fs.cp("CD/template/test", `test/${name}`, { recursive: true });
        await fs.copyFile("package.json", `${functionPath}/package.json`);
        await fs.copyFile("package-lock.json", `${functionPath}/package-lock.json`);
        await fs.writeFile(`${functionPath}/metadata.json`, `{ "functionName": "${name}" }`);
    }

    async installDependencies(name) {
        await execAsync("npm ci", { cwd: `functions/${name}` });
        await Promise.all([
            fs.rm(`functions/${name}/package.json`),
            fs.rm(`functions/${name}/package-lock.json`),
        ]);
    }

    async createLambdaFunction(name) {
        const folder = `functions/${name}`;
        const zipFileName = "function.zip";

        await zip.archiveFolder(folder, zipFileName);
        const zipBuffer = await fs.readFile(zipFileName);

        return this.lambdaClient.send(new CreateFunctionCommand({
            FunctionName: name,
            Runtime: "nodejs22.x",
            Role: "arn:aws:iam::115462458880:role/General-Lambda-Function",
            Handler: "index.handler",
            Timeout: 10,
            Code: { ZipFile: zipBuffer },
        }));
    }
}

new LambdaFactory().create();
