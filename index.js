require('dotenv').config();
const { ethers } = require('ethers');
const inquirer = require('inquirer');
const figlet = require('figlet');
const chalk = require('chalk');

const RPC_URL = "https://finney.uomi.ai";
const CHAIN_ID = 4386;
const WUOMI_ADDRESS = "0x5FCa78E132dF589c1c799F906dC867124a2567b2";
const NATIVE_TOKEN = "UOMI";
const DELAY_SECONDS = 1; // Fixed delay of 1 second

const PRIVATE_KEYS = [];
let i = 1;
while (true) {
    const key = process.env[`PRIVATE_KEYS_${i}`];
    if (!key) break;
    PRIVATE_KEYS.push(key.trim());
    i++;
}

if (PRIVATE_KEYS.length === 0) {
    console.log(chalk.red('No private keys found in .env file.'));
    process.exit(1);
}

const provider = new ethers.providers.JsonRpcProvider(RPC_URL);

// Generate random amount between 0.001 and 0.004
function getRandomAmount() {
    const min = 0.001;
    const max = 0.004;
    const random = (Math.random() * (max - min) + min).toFixed(6);
    return ethers.utils.parseEther(random.toString());
}

// Display banner
function displayBanner() {
    console.log(chalk.cyan(figlet.textSync('UOMI BOT', {
        font: 'Standard',
        horizontalLayout: 'default',
        verticalLayout: 'default'
    })));
    console.log(chalk.yellow('============================================================'));
    console.log(chalk.yellow('                 LETS FUCK THIS TESTNET '));
    console.log(chalk.yellow('          Created By Kazuha - By Uomi Testnet '));
    console.log(chalk.yellow('============================================================\n'));
}

async function getBalance(signer, tokenAddress) {
    const walletAddress = await signer.getAddress();
    if (tokenAddress === NATIVE_TOKEN) {
        const balance = await provider.getBalance(walletAddress);
        return { balance, decimals: 18 };
    }
    const tokenContract = new ethers.Contract(
        tokenAddress,
        [
            "function balanceOf(address) view returns (uint256)",
            "function decimals() view returns (uint8)",
        ],
        signer
    );
    try {
        const balance = await tokenContract.balanceOf(walletAddress);
        const decimals = await tokenContract.decimals();
        return { balance, decimals };
    } catch (error) {
        return { balance: ethers.BigNumber.from(0), decimals: 18 };
    }
}

async function doWrap(signer, amount) {
    const walletAddress = await signer.getAddress();
    console.log(chalk.cyan(`Account ${walletAddress.slice(0, 6)}...: Wrapping ${NATIVE_TOKEN} -> WUOMI`));

    const { balance, decimals } = await getBalance(signer, NATIVE_TOKEN);
    if (balance.lt(amount)) {
        console.log(chalk.yellow(`Insufficient ${NATIVE_TOKEN} balance. Skipping...`));
        return;
    }

    const amountDisplay = ethers.utils.formatUnits(amount, decimals);
    console.log(chalk.cyan(`Wrapping ${amountDisplay} ${NATIVE_TOKEN}`));

    try {
        const tx = await signer.sendTransaction({
            chainId: CHAIN_ID,
            to: WUOMI_ADDRESS,
            value: amount,
            data: "0xd0e30db0", // Function selector for deposit()
            gasLimit: 42242,
            maxFeePerGas: (await provider.getBlock("latest")).baseFeePerGas.add(
                ethers.utils.parseUnits('2', 'gwei')
            ),
            maxPriorityFeePerGas: ethers.utils.parseUnits('2', 'gwei'),
        });

        console.log(chalk.green(`Transaction sent: https://explorer.uomi.ai/tx/${tx.hash}`));
        await tx.wait();
        console.log(chalk.green('Wrap completed'));
    } catch (error) {
        console.log(chalk.red(`Wrap failed: ${error.message.slice(0, 50)}...`));
    }
}

async function doUnwrap(signer, amount) {
    const walletAddress = await signer.getAddress();
    console.log(chalk.cyan(`Account ${walletAddress.slice(0, 6)}...: Unwrapping WUOMI -> ${NATIVE_TOKEN}`));

    const { balance, decimals } = await getBalance(signer, WUOMI_ADDRESS);
    if (balance.lt(amount)) {
        console.log(chalk.yellow(`Insufficient WUOMI balance. Skipping...`));
        return;
    }

    const amountDisplay = ethers.utils.formatUnits(amount, decimals);
    console.log(chalk.cyan(`Unwrapping ${amountDisplay} WUOMI`));

    try {
        const wuomiContract = new ethers.Contract(
            WUOMI_ADDRESS,
            ["function withdraw(uint256 amount) public"],
            signer
        );

        const tx = await wuomiContract.withdraw(amount, {
            gasLimit: 50000,
            maxFeePerGas: (await provider.getBlock("latest")).baseFeePerGas.add(
                ethers.utils.parseUnits('2', 'gwei')
            ),
            maxPriorityFeePerGas: ethers.utils.parseUnits('2', 'gwei'),
        });

        console.log(chalk.green(`Transaction sent: https://explorer.uomi.ai/tx/${tx.hash}`));
        await tx.wait();
        console.log(chalk.green('Unwrap completed'));
    } catch (error) {
        console.log(chalk.red(`Unwrap failed: ${error.message.slice(0, 50)}...`));
    }
}

async function displayBalances() {
    console.log(chalk.cyan('=== Account Balances ==='));
    for (const key of PRIVATE_KEYS) {
        const signer = new ethers.Wallet(key, provider);
        const walletAddress = await signer.getAddress();
        console.log(chalk.cyan(`Account: ${walletAddress}`));

        const { balance: uomiBalance, decimals: uomiDecimals } = await getBalance(signer, NATIVE_TOKEN);
        console.log(chalk.yellow(`${NATIVE_TOKEN}: ${ethers.utils.formatUnits(uomiBalance, uomiDecimals)}`));

        const { balance: wuomiBalance, decimals: wuomiDecimals } = await getBalance(signer, WUOMI_ADDRESS);
        console.log(chalk.yellow(`WUOMI: ${ethers.utils.formatUnits(wuomiBalance, wuomiDecimals)}`));
    }
    console.log(chalk.cyan('======================='));
}

async function processTransactions(mode, numActions) {
    const amount = getRandomAmount();
    const amountDisplay = ethers.utils.formatEther(amount);
    console.log(chalk.cyan(`Using random amount: ${amountDisplay} ${NATIVE_TOKEN}/WUOMI`));

    for (const key of PRIVATE_KEYS) {
        const signer = new ethers.Wallet(key, provider);
        for (let j = 0; j < numActions; j++) {
            console.log(chalk.cyan(`Transaction ${j + 1}/${numActions} for account ${PRIVATE_KEYS.indexOf(key) + 1}`));
            if (mode === 'wrap' || mode === 'auto') {
                await doWrap(signer, amount);
                if (j < numActions - 1 || mode === 'auto') {
                    console.log(chalk.yellow(`Waiting ${DELAY_SECONDS} second...`));
                    await new Promise(resolve => setTimeout(resolve, DELAY_SECONDS * 1000));
                }
            }
            if (mode === 'unwrap' || mode === 'auto') {
                await doUnwrap(signer, amount);
                if (j < numActions - 1) {
                    console.log(chalk.yellow(`Waiting ${DELAY_SECONDS} second...`));
                    await new Promise(resolve => setTimeout(resolve, DELAY_SECONDS * 1000));
                }
            }
        }
    }
    console.log(chalk.green('All transactions completed'));
}

async function main() {
    displayBanner();

    while (true) {
        const { action } = await inquirer.prompt([
            {
                type: 'list',
                name: 'action',
                message: chalk.cyan('Select an action:'),
                choices: [
                    'Wrap UOMI to WUOMI',
                    'Unwrap WUOMI to UOMI',
                    'Auto (Wrap then Unwrap)',
                    'Show Balances',
                    'Exit',
                ],
            },
        ]);

        if (action === 'Exit') {
            console.log(chalk.green('Exiting...'));
            break;
        }

        if (action === 'Show Balances') {
            await displayBalances();
            continue;
        }

        const { numActions } = await inquirer.prompt([
            {
                type: 'input',
                name: 'numActions',
                message: chalk.cyan('Number of transactions:'),
                validate: input => {
                    const value = parseInt(input);
                    if (isNaN(value) || value <= 0) {
                        return chalk.red('Please enter a valid number of transactions (greater than 0).');
                    }
                    return true;
                },
            },
        ]);

        if (action === 'Wrap UOMI to WUOMI') {
            await processTransactions('wrap', parseInt(numActions));
        } else if (action === 'Unwrap WUOMI to UOMI') {
            await processTransactions('unwrap', parseInt(numActions));
        } else if (action === 'Auto (Wrap then Unwrap)') {
            await processTransactions('auto', parseInt(numActions));
        }

        await displayBalances(); // Show balances after transactions
    }
}

main().catch(error => console.log(chalk.red(`Error: ${error.message}`)));
