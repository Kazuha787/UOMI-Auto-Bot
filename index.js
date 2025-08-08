const ethers = require('ethers');
const chalk = require('chalk').default || require('chalk');
const fs = require('fs');
const Table = require('cli-table3');
const readline = require('readline');

// Logger class for consistent logging
class Logger {
  static formatLogMessage(msg) {
    const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false });
    msg = (msg || '').toString().trim();
    if (!msg) return chalk.hex('#CCCCCC')(`[${timestamp}] Empty log`);

    const parts = msg.split('|').map(s => s?.trim() || '');
    const walletName = parts[0] || 'System';

    if (
      parts.length >= 3 &&
      (parts[2]?.includes('successful') ||
        parts[2]?.includes('Confirmed') ||
        parts[2]?.includes('Approved'))
    ) {
      const logParts = parts[2].split(/successful:|Confirmed:|Approved:/);
      const message = logParts[0]?.trim() || '';
      const hashPart = logParts[1]?.trim() || '';
      return chalk.green.bold(
        `[${timestamp}] ${walletName.padEnd(25)} | ${message}${
          hashPart ? 'Confirmed: ' : 'successful: '
        }${chalk.greenBright.bold(hashPart || '')}`
      );
    }

    if (
      parts.length >= 2 &&
      (parts[1]?.includes('Starting') ||
        parts[1]?.includes('Processing') ||
        parts[1]?.includes('Approving'))
    ) {
      return chalk.hex('#C71585').bold(
        `[${timestamp}] ${walletName.padEnd(25)} | ${parts[1]}`
      );
    }

    if (parts.length >= 2 && parts[1]?.includes('Warning')) {
      return chalk.yellow.bold(
        `[${timestamp}] ${walletName.padEnd(25)} | ${parts.slice(1).join(' | ')}`
      );
    }

    if (msg.includes('Error') || msg.includes('failed')) {
      const errorMsg = parts.length > 2 ? parts.slice(2).join(' | ').trim() : msg;
      return chalk.red.bold(
        `[${timestamp}] ${walletName.padEnd(25)} | ${errorMsg}`
      );
    }

    return chalk.hex('#CCCCCC')(
      `[${timestamp}] ${walletName.padEnd(25)} | ${
        parts.slice(parts.length >= 2 ? 1 : 0).join(' | ') || msg
      }`
    );
  }

  static log(msg) {
    console.log(this.formatLogMessage(msg));
  }
}

const logger = Logger;

// Menu options
const menuOptions = [
  { label: 'Swap Tokens', value: 'swapTokens' },
  { label: 'Wrap UOMI to WUOMI', value: 'wrapUomi' },
  { label: 'Unwrap WUOMI to UOMI', value: 'unwrapUomi' },
  { label: 'Auto (Wrap then Unwrap)', value: 'autoWrapUnwrap' },
  { label: 'Add Liquidity', value: 'addLiquidity' },
  { label: 'Auto All (Run All Operations)', value: 'autoAll' },
  { label: 'Set Transaction Count', value: 'setTransactionCount' },
  { label: 'Show Balances', value: 'showBalances' },
  { label: 'Exit', value: 'exit' },
];

// ASCII Banner
const asciiBannerLines = [
  '██╗   ██╗     ██████╗     ███╗   ███╗    ██╗',
  '██║   ██║    ██╔═══██╗    ████╗ ████║    ██║',
  '██║   ██║    ██║   ██║    ██╔████╔██║    ██║',
  '██║   ██║    ██║   ██║    ██║╚██╔╝██║    ██║',
  '╚██████╔╝    ╚██████╔╝    ██║ ╚═╝ ██║    ██║',
  ' ╚═════╝      ╚═════╝     ╚═╝     ╚═╝    ╚═╝',
  '',
  '       UOMI Testnet Bot v3.0 - Created By Kazuha       ',
  '                LETS FUCK THIS TESTNET                ',
];

// Readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Utility functions for UI
function requestInput(promptText, type = 'text', defaultValue = '') {
  return new Promise(resolve => {
    rl.question(
      chalk.greenBright(`${promptText}${defaultValue ? ` [${defaultValue}]` : ''}: `),
      value => {
        if (type === 'number') value = Number(value);
        if (value === '' || (type === 'number' && isNaN(value))) value = defaultValue;
        resolve(value);
      }
    );
  });
}

function displayBanner() {
  console.clear();
  console.log(chalk.hex('#D8BFD8').bold(asciiBannerLines.join('\n')));
  console.log();
}

function displayMenu() {
  console.log(chalk.blueBright.bold('\n>=== UOMI Testnet Bot Menu ===<'));
  menuOptions.forEach((opt, idx) => {
    const optionNumber = `${idx + 1}`.padStart(2, '0');
    console.log(chalk.blue(`  ${optionNumber} > ${opt.label.padEnd(35)} <`));
  });
  console.log(chalk.blueBright.bold('>===============================<\n'));
}

function getShortAddress(address) {
  return address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'N/A';
}

class UOMI {
  constructor() {
    this.RPC_URL = 'https://finney.uomi.ai/';
    this.CHAIN_ID = 4386;
    this.WUOMI_CONTRACT_ADDRESS = '0x5FCa78E132dF589c1c799F906dC867124a2567b2';
    this.USDC_CONTRACT_ADDRESS = '0xAA9C4829415BCe70c434b7349b628017C59EC2b1';
    this.SYN_CONTRACT_ADDRESS = '0x2922B2Ca5EB6b02fc5E1EBE57Fc1972eBB99F7e0';
    this.SIM_CONTRACT_ADDRESS = '0x04B03e3859A25040E373cC9E8806d79596D70686';
    this.QUOTER_ROUTER_ADDRESS = '0xCcB2B2F8395e4462d28703469F84c95293845332';
    this.EXECUTE_ROUTER_ADDRESS = '0x197EEAd5Fe3DB82c4Cd55C5752Bc87AEdE11f230';
    this.POSITION_ROUTER_ADDRESS = '0x906515Dc7c32ab887C8B8Dce6463ac3a7816Af38';
    this.NATIVE_TOKEN = 'UOMI';
    this.DELAY_SECONDS = 1;
    this.WOUMI_SIM = 0.001;
    this.WOUMI_SYN = 0.001;
    this.USDC_WOUMI = 0.001;
    this.USDC_SYN = 0.001;
    this.MIN_DELAY = 1;
    this.MAX_DELAY = 1;
    this.transactionCount = 1;

    this.TOKENS = {
      UOMI: this.WUOMI_CONTRACT_ADDRESS,
      USDC: this.USDC_CONTRACT_ADDRESS,
      SYN: this.SYN_CONTRACT_ADDRESS,
      SIM: this.SIM_CONTRACT_ADDRESS,
    };

    this.UOMI_CONTRACT_ABI = [
      {
        type: 'function',
        name: 'quoteExactInput',
        stateMutability: 'nonpayable',
        inputs: [
          { internalType: 'bytes', name: 'path', type: 'bytes' },
          { internalType: 'uint256', name: 'amountIn', type: 'uint256' },
        ],
        outputs: [{ internalType: 'uint256', name: 'amountOut', type: 'uint256' }],
      },
      {
        type: 'function',
        name: 'execute',
        stateMutability: 'payable',
        inputs: [
          { internalType: 'bytes', name: 'commands', type: 'bytes' },
          { internalType: 'bytes[]', name: 'inputs', type: 'bytes[]' },
          { internalType: 'uint256', name: 'deadline', type: 'uint256' },
        ],
        outputs: [],
      },
    ];

    this.ERC20_ABI = [
      {
        type: 'function',
        name: 'balanceOf',
        stateMutability: 'view',
        inputs: [{ name: 'address', type: 'address' }],
        outputs: [{ name: '', type: 'uint256' }],
      },
      {
        type: 'function',
        name: 'decimals',
        stateMutability: 'view',
        inputs: [],
        outputs: [{ name: '', type: 'uint8' }],
      },
      {
        type: 'function',
        name: 'approve',
        stateMutability: 'nonpayable',
        inputs: [
          { name: 'spender', type: 'address' },
          { name: 'amount', type: 'uint256' },
        ],
        outputs: [{ name: '', type: 'bool' }],
      },
      {
        type: 'function',
        name: 'withdraw',
        stateMutability: 'nonpayable',
        inputs: [{ name: 'amount', type: 'uint256' }],
        outputs: [],
      },
    ];

    this.ROUTER_ABI = [
      {
        type: 'function',
        name: 'mint',
        stateMutability: 'nonpayable',
        inputs: [
          {
            type: 'tuple',
            name: 'params',
            internalType: 'struct INonfungiblePositionManager.MintParams',
            components: [
              { internalType: 'address', name: 'token0', type: 'address' },
              { internalType: 'address', name: 'token1', type: 'address' },
              { internalType: 'uint24', name: 'fee', type: 'uint24' },
              { internalType: 'int24', name: 'tickLower', type: 'int24' },
              { internalType: 'int24', name: 'tickUpper', type: 'int24' },
              { internalType: 'uint256', name: 'amount0Desired', type: 'uint256' },
              { internalType: 'uint256', name: 'amount1Desired', type: 'uint256' },
              { internalType: 'uint256', name: 'amount0Min', type: 'uint256' },
              { internalType: 'uint256', name: 'amount1Min', type: 'uint256' },
              { internalType: 'address', name: 'recipient', type: 'address' },
              { internalType: 'uint256', name: 'deadline', type: 'uint256' },
            ],
          },
        ],
        outputs: [
          { internalType: 'uint256', name: 'tokenId', type: 'uint256' },
          { internalType: 'uint128', name: 'liquidity', type: 'uint128' },
          { internalType: 'uint256', name: 'amount0', type: 'uint256' },
          { internalType: 'uint256', name: 'amount1', type: 'uint256' },
        ],
      },
    ];

    this.used_nonce = {};
    this.swap_count = 0;
    this.min_swap_amount = 0.001;
    this.max_swap_amount = 0.003;
    this.provider = new ethers.providers.JsonRpcProvider(this.RPC_URL);
  }

  generateAddress(privateKey) {
    try {
      const wallet = new ethers.Wallet(privateKey, this.provider);
      return wallet.address;
    } catch (e) {
      logger.log(`Error: Generate Address Failed - ${e.message}`);
      return null;
    }
  }

  maskAccount(address) {
    try {
      return getShortAddress(address);
    } catch {
      return address;
    }
  }

  async getAmountOutMin(signer, path, amountInWei) {
    try {
      const quoterContract = new ethers.Contract(this.QUOTER_ROUTER_ADDRESS, this.UOMI_CONTRACT_ABI, signer);
      const amountOut = await quoterContract.callStatic.quoteExactInput(path, amountInWei);
      return amountOut;
    } catch (e) {
      logger.log(`Error: Failed to get amount out min: ${e.message}`);
      return null;
    }
  }

  async performSwap(privateKey, address, fromToken, toToken, amountIn) {
    try {
      const signer = new ethers.Wallet(privateKey, this.provider);
      const amountInWei = ethers.utils.parseEther(amountIn.toString());
      const commands = '0x0b00';
      const coder = ethers.utils.defaultAbiCoder;
      const wrapEth = coder.encode(['address', 'uint256'], ['0x0000000000000000000000000000000000000002', amountInWei]);
      const path = ethers.utils.solidityPack(
        ['address', 'uint24', 'address'],
        [fromToken, 3000, toToken]
      );
      const amountOutWei = await this.getAmountOutMin(signer, path, amountInWei);
      if (!amountOutWei) {
        throw new Error('Failed to get amount out min');
      }
      const amountOutMinWei = amountOutWei.mul(10000 - 50).div(10000); // 0.5% slippage
      const v3SwapExactIn = coder.encode(
        ['address', 'uint256', 'uint256', 'bytes', 'bool'],
        ['0x0000000000000000000000000000000000000001', amountInWei, amountOutMinWei, path, false]
      );
      const inputs = [wrapEth, v3SwapExactIn];
      const deadline = Math.floor(Date.now() / 1000) + 600;
      const routerContract = new ethers.Contract(this.EXECUTE_ROUTER_ADDRESS, this.UOMI_CONTRACT_ABI, signer);
      const gasEstimate = await routerContract.estimateGas.execute(commands, inputs, deadline, {
        value: amountInWei,
      });
      const maxPriorityFee = ethers.utils.parseUnits('28.54', 'gwei');
      const maxFee = maxPriorityFee;
      const tx = await routerContract.execute(commands, inputs, deadline, {
        value: amountInWei,
        gasLimit: gasEstimate.mul(12).div(10),
        maxFeePerGas: maxFee,
        maxPriorityFeePerGas: maxPriorityFee,
      });
      logger.log(`${getShortAddress(address)} | Success: Tx Hash: ${tx.hash}`);
      const receipt = await tx.wait();
      if (receipt.status === 1) {
        logger.log(`${getShortAddress(address)} | Success: Explore: https://explorer.uomi.ai/tx/${tx.hash} | Confirmed: ${tx.hash}`);
        return tx.hash;
      } else {
        throw new Error('Transaction failed');
      }
    } catch (e) {
      logger.log(`${getShortAddress(address)} | Error: Swap operation failed: ${e.message}`);
      return null;
    }
  }

  async getBalance(signer, tokenAddress) {
    const walletAddress = await signer.getAddress();
    if (tokenAddress === this.NATIVE_TOKEN) {
      const balance = await this.provider.getBalance(walletAddress);
      return { balance, decimals: 18 };
    }
    const tokenContract = new ethers.Contract(
      tokenAddress,
      [
        'function balanceOf(address) view returns (uint256)',
        'function decimals() view returns (uint8)',
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

  async doWrap(signer, amount) {
    const walletAddress = await signer.getAddress();
    logger.log(`${getShortAddress(walletAddress)} | Processing Wrap ${this.NATIVE_TOKEN} -> WUOMI`);

    const { balance, decimals } = await this.getBalance(signer, this.NATIVE_TOKEN);
    if (balance.lt(amount)) {
      logger.log(`${getShortAddress(walletAddress)} | Warning: Insufficient ${this.NATIVE_TOKEN} balance. Skipping...`);
      return;
    }

    const amountDisplay = ethers.utils.formatUnits(amount, decimals);
    logger.log(`${getShortAddress(walletAddress)} | Processing: Wrapping ${amountDisplay} ${this.NATIVE_TOKEN}`);

    try {
      const tx = await signer.sendTransaction({
        chainId: this.CHAIN_ID,
        to: this.WUOMI_CONTRACT_ADDRESS,
        value: amount,
        data: '0xd0e30db0',
        gasLimit: 42242,
        maxFeePerGas: (await this.provider.getBlock('latest')).baseFeePerGas.add(
          ethers.utils.parseUnits('2', 'gwei')
        ),
        maxPriorityFeePerGas: ethers.utils.parseUnits('2', 'gwei'),
      });

      logger.log(`${getShortAddress(walletAddress)} | Success: Transaction sent: https://explorer.uomi.ai/tx/${tx.hash}`);
      await tx.wait();
      logger.log(`${getShortAddress(walletAddress)} | Success: Wrap completed | Confirmed: ${tx.hash}`);
    } catch (error) {
      logger.log(`${getShortAddress(walletAddress)} | Error: Wrap failed: ${error.message.slice(0, 50)}...`);
    }
  }

  async doUnwrap(signer, amount) {
    const walletAddress = await signer.getAddress();
    logger.log(`${getShortAddress(walletAddress)} | Processing Unwrap WUOMI -> ${this.NATIVE_TOKEN}`);

    const { balance, decimals } = await this.getBalance(signer, this.WUOMI_CONTRACT_ADDRESS);
    if (balance.lt(amount)) {
      logger.log(`${getShortAddress(walletAddress)} | Warning: Insufficient WUOMI balance. Skipping...`);
      return;
    }

    const amountDisplay = ethers.utils.formatUnits(amount, decimals);
    logger.log(`${getShortAddress(walletAddress)} | Processing: Unwrapping ${amountDisplay} WUOMI`);

    try {
      const wuomiContract = new ethers.Contract(
        this.WUOMI_CONTRACT_ADDRESS,
        this.ERC20_ABI,
        signer
      );

      const tx = await wuomiContract.withdraw(amount, {
        gasLimit: 50000,
        maxFeePerGas: (await this.provider.getBlock('latest')).baseFeePerGas.add(
          ethers.utils.parseUnits('2', 'gwei')
        ),
        maxPriorityFeePerGas: ethers.utils.parseUnits('2', 'gwei'),
      });

      logger.log(`${getShortAddress(walletAddress)} | Success: Transaction sent: https://explorer.uomi.ai/tx/${tx.hash}`);
      await tx.wait();
      logger.log(`${getShortAddress(walletAddress)} | Success: Unwrap completed | Confirmed: ${tx.hash}`);
    } catch (error) {
      logger.log(`${getShortAddress(walletAddress)} | Error: Unwrap failed: ${error.message.slice(0, 50)}...`);
    }
  }

  async displayBalances(accounts) {
    logger.log('System | Displaying Account Balances...');

    const table = new Table({
      head: ['#', 'Address', 'UOMI', 'WUOMI', 'USDC', 'SYN', 'SIM'],
      colWidths: [5, 20, 12, 12, 12, 12, 12],
      style: { head: ['cyan'] },
    });

    for (let i = 0; i < accounts.length; i++) {
      const signer = new ethers.Wallet(accounts[i], this.provider);
      const walletAddress = await signer.getAddress();

      const balances = await Promise.all([
        this.getBalance(signer, this.NATIVE_TOKEN),
        this.getBalance(signer, this.WUOMI_CONTRACT_ADDRESS),
        this.getBalance(signer, this.USDC_CONTRACT_ADDRESS),
        this.getBalance(signer, this.SYN_CONTRACT_ADDRESS),
        this.getBalance(signer, this.SIM_CONTRACT_ADDRESS),
      ]);

      table.push([
        i + 1,
        getShortAddress(walletAddress),
        ethers.utils.formatUnits(balances[0].balance, balances[0].decimals),
        ethers.utils.formatUnits(balances[1].balance, balances[1].decimals),
        ethers.utils.formatUnits(balances[2].balance, balances[2].decimals),
        ethers.utils.formatUnits(balances[3].balance, balances[3].decimals),
        ethers.utils.formatUnits(balances[4].balance, balances[4].decimals),
      ]);
    }

    console.log(table.toString());
    logger.log('System | Account Balances displayed!');
  }

  getGasParams() {
    const maxPriorityFeePerGas = ethers.utils.parseUnits('2', 'gwei');
    const baseFee = ethers.utils.parseUnits('50', 'gwei');
    const maxFeePerGas = maxPriorityFeePerGas.add(baseFee);
    return {
      maxFeePerGas,
      maxPriorityFeePerGas,
    };
  }

  loadProxies() {
    if (!fs.existsSync('proxies.txt')) {
      return [];
    }
    return fs.readFileSync('proxies.txt', 'utf-8').split('\n').filter(line => line.trim());
  }

  getTokenContract(tokenAddress, signer) {
    return new ethers.Contract(tokenAddress, this.ERC20_ABI, signer);
  }

  async approveToken(tokenAddress, spender, amount, signer) {
    const token = this.getTokenContract(tokenAddress, signer);
    const gasParams = this.getGasParams();

    try {
      const tx = await token.approve(spender, amount, {
        gasLimit: 200000,
        ...gasParams,
      });
      logger.log(`${getShortAddress(signer.address)} | Success: Approval Tx Hash: ${tx.hash} | Confirmed: ${tx.hash}`);
      await tx.wait();
      return tx.hash;
    } catch (e) {
      logger.log(`${getShortAddress(signer.address)} | Error: Approval failed: ${e.message}`);
      throw e;
    }
  }

  async addLiquidity(token0Name, token1Name, amount, account) {
    const signer = new ethers.Wallet(account.privateKey, this.provider);
    const token0Address = this.TOKENS[token0Name];
    const token1Address = this.TOKENS[token1Name];

    if (!token0Address || !token1Address) {
      logger.log(`${getShortAddress(account.address)} | Error: Invalid token pair`);
      return;
    }

    const token0Contract = this.getTokenContract(token0Address, signer);
    const token1Contract = this.getTokenContract(token1Address, signer);

    const token0Decimals = await token0Contract.decimals();
    const token1Decimals = await token1Contract.decimals();

    const amount0Desired = ethers.utils.parseUnits(amount.toString(), token0Decimals);
    const amount1Desired = ethers.utils.parseUnits(amount.toString(), token1Decimals);

    const balance0 = await token0Contract.balanceOf(account.address);
    const balance1 = await token1Contract.balanceOf(account.address);

    if (balance0.lt(amount0Desired)) {
      logger.log(
        `${getShortAddress(account.address)} | Warning: Insufficient balance: ${ethers.utils.formatUnits(
          balance0,
          token0Decimals
        )} ${token0Name} available. Need ${amount}`
      );
      return;
    }
    if (balance1.lt(amount1Desired)) {
      logger.log(
        `${getShortAddress(account.address)} | Warning: Insufficient balance: ${ethers.utils.formatUnits(
          balance1,
          token1Decimals
        )} ${token1Name} available. Need ${amount}`
      );
      return;
    }

    logger.log(`${getShortAddress(account.address)} | Approving ${token0Name} for liquidity`);
    try {
      await this.approveToken(token0Address, this.POSITION_ROUTER_ADDRESS, amount0Desired, signer);
    } catch (e) {
      logger.log(`${getShortAddress(account.address)} | Error: Approval for ${token0Name} failed: ${e.message}`);
      return;
    }

    logger.log(`${getShortAddress(account.address)} | Approving ${token1Name} for liquidity`);
    try {
      await this.approveToken(token1Address, this.POSITION_ROUTER_ADDRESS, amount1Desired, signer);
    } catch (e) {
      logger.log(`${getShortAddress(account.address)} | Error: Approval for ${token1Name} failed: ${e.message}`);
      return;
    }

    const router = new ethers.Contract(this.POSITION_ROUTER_ADDRESS, this.ROUTER_ABI, signer);

    let finalToken0 = token0Address;
    let finalToken1 = token1Address;
    let finalAmount0 = amount0Desired;
    let finalAmount1 = amount1Desired;

    if (token0Address.toLowerCase() > token1Address.toLowerCase()) {
      finalToken0 = token1Address;
      finalToken1 = token0Address;
      finalAmount0 = amount1Desired;
      finalAmount1 = amount0Desired;
    }

    const params = {
      token0: finalToken0,
      token1: finalToken1,
      fee: 3000,
      tickLower: -887220,
      tickUpper: 887220,
      amount0Desired: finalAmount0,
      amount1Desired: finalAmount1,
      amount0Min: 0,
      amount1Min: 0,
      recipient: account.address,
      deadline: Math.floor(Date.now() / 1000) + 600,
    };

    const gasParams = this.getGasParams();

    logger.log(`${getShortAddress(account.address)} | Processing: Adding liquidity for ${token0Name}/${token1Name}`);
    try {
      const tx = await router.mint(params, {
        gasLimit: 500000,
        ...gasParams,
      });

      logger.log(`${getShortAddress(account.address)} | Success: Tx Hash: ${tx.hash}`);
      const receipt = await tx.wait();

      if (receipt.status === 1) {
        logger.log(
          `${getShortAddress(account.address)} | Success: Liquidity added for ${token0Name}/${token1Name} | Confirmed: ${tx.hash}`
        );
      } else {
        logger.log(`${getShortAddress(account.address)} | Error: Liquidity addition failed`);
      }
    } catch (e) {
      logger.log(`${getShortAddress(account.address)} | Error: Error adding liquidity: ${e.message}`);
    }
  }

  getRandomAmount() {
    const min = 0.001;
    const max = 0.004;
    const random = (Math.random() * (max - min) + min).toFixed(6);
    return ethers.utils.parseEther(random.toString());
  }

  async processTransactions(mode, numActions, accounts) {
    const amount = this.getRandomAmount();
    const amountDisplay = ethers.utils.formatEther(amount);
    logger.log(`System | Processing: Using random amount: ${amountDisplay} ${this.NATIVE_TOKEN}/WUOMI`);

    for (const account of accounts) {
      const signer = new ethers.Wallet(account, this.provider);
      for (let j = 0; j < numActions; j++) {
        logger.log(
          `${getShortAddress(signer.address)} | Processing Transaction ${j + 1}/${numActions} for account ${accounts.indexOf(account) + 1}`
        );
        if (mode === 'wrap' || mode === 'auto') {
          await this.doWrap(signer, amount);
          if (j < numActions - 1 || mode === 'auto') {
            logger.log(`System | Waiting ${this.DELAY_SECONDS} second...`);
            await new Promise(resolve => setTimeout(resolve, this.DELAY_SECONDS * 1000));
          }
        }
        if (mode === 'unwrap' || mode === 'auto') {
          await this.doUnwrap(signer, amount);
          if (j < numActions - 1) {
            logger.log(`System | Waiting ${this.DELAY_SECONDS} second...`);
            await new Promise(resolve => setTimeout(resolve, this.DELAY_SECONDS * 1000));
          }
        }
      }
    }
    logger.log('System | Success: All transactions completed');
  }

  async autoAddLiquidity(numActions, accounts) {
    logger.log('System | Starting Auto Add Liquidity');

    if (accounts.length === 0) {
      logger.log('System | Error: No accounts found in accounts.txt');
      return;
    }

    const proxies = this.loadProxies();
    let proxyChoice = null;
    if (proxies.length > 0) {
      logger.log('System | Proxy Options:');
      logger.log('System | 1. Run With Private Proxy');
      logger.log('System | 2. Run Without Proxy');
      const choice = await requestInput('Choose [1/2]', 'text', '2');
      if (choice === '1') {
        proxyChoice = proxies[Math.floor(Math.random() * proxies.length)];
        logger.log(`System | Using proxy: ${proxyChoice.slice(0, 15)}...`);
      }
    } else {
      logger.log('System | No proxies found in proxies.txt, running without proxy');
    }

    const privateKey = accounts[Math.floor(Math.random() * accounts.length)];
    const signer = new ethers.Wallet(privateKey, this.provider);
    const account = { address: await signer.getAddress(), privateKey };

    for (let i = 0; i < numActions; i++) {
      logger.log(`System | Processing Liquidity iteration ${i + 1}/${numActions}`);
      logger.log(`System | Using account: ${getShortAddress(account.address)}`);

      if (this.WOUMI_SIM > 0) {
        await this.addLiquidity('UOMI', 'SIM', this.WOUMI_SIM, account);
      }

      if (this.WOUMI_SYN > 0) {
        await this.addLiquidity('UOMI', 'SYN', this.WOUMI_SYN, account);
      }

      if (this.USDC_WOUMI > 0) {
        await this.addLiquidity('USDC', 'UOMI', this.USDC_WOUMI, account);
      }

      if (this.USDC_SYN > 0) {
        await this.addLiquidity('USDC', 'SYN', this.USDC_SYN, account);
      }

      const delay = Math.floor(Math.random() * (this.MAX_DELAY - this.MIN_DELAY + 1)) + this.MIN_DELAY;
      logger.log(`System | Waiting ${delay} seconds`);
      await new Promise(resolve => setTimeout(resolve, delay * 1000));
    }

    logger.log('System | Success: All liquidity additions completed');
  }

  async requestSwapCount() {
    while (true) {
      try {
        const swapCount = await requestInput('Swap Total', 'number', '0');
        if (swapCount > 0) {
          this.swap_count = swapCount;
          break;
        } else {
          logger.log('System | Error: Swap Count must be > 0.');
        }
      } catch {
        logger.log('System | Error: Invalid input. Enter a number.');
      }
    }
  }

  generateSwapOption() {
    const swapOptions = [
      ['UOMI to USDC', this.WUOMI_CONTRACT_ADDRESS, this.USDC_CONTRACT_ADDRESS],
      ['UOMI to SYN', this.WUOMI_CONTRACT_ADDRESS, this.SYN_CONTRACT_ADDRESS],
      ['UOMI to SIM', this.WUOMI_CONTRACT_ADDRESS, this.SIM_CONTRACT_ADDRESS],
    ];
    const [swapOption, fromToken, toToken] = swapOptions[Math.floor(Math.random() * swapOptions.length)];
    const amountIn = parseFloat((Math.random() * (this.max_swap_amount - this.min_swap_amount) + this.min_swap_amount).toFixed(6));
    return [swapOption, fromToken, toToken, amountIn];
  }

  async processSwaps(accounts, numActions) {
    logger.log(`System | Total Swaps per Account: ${numActions}`);

    for (const account of accounts) {
      const address = this.generateAddress(account);
      if (!address) {
        logger.log('System | Error: Invalid private key. Skipping account.');
        continue;
      }

      logger.log(`${getShortAddress(address)} | Processing account`);

      for (let i = 0; i < numActions; i++) {
        logger.log(`${getShortAddress(address)} | Processing Swap ${i + 1} / ${numActions}`);
        const [swapOption, fromToken, toToken, amountIn] = this.generateSwapOption();
        logger.log(`${getShortAddress(address)} | Processing: Swap Pair: ${swapOption}`);
        logger.log(`${getShortAddress(address)} | Processing: Amount In: ${amountIn} UOMI`);
        await this.performSwap(account, address, fromToken, toToken, amountIn);
        await new Promise(resolve => setTimeout(resolve, Math.random() * 5000 + 5000));
      }
    }
  }

  async autoAll(numActions, accounts) {
    logger.log('System | Starting Auto All Operations');

    // Display balances first
    logger.log('System | Step 1: Displaying Balances');
    await this.displayBalances(accounts);
    await new Promise(resolve => setTimeout(resolve, this.DELAY_SECONDS * 1000));

    // Perform swaps
    logger.log('System | Step 2: Performing Swaps');
    await this.processSwaps(accounts, numActions);
    await new Promise(resolve => setTimeout(resolve, this.DELAY_SECONDS * 1000));

    // Wrap UOMI
    logger.log('System | Step 3: Wrapping UOMI');
    await this.processTransactions('wrap', numActions, accounts);
    await new Promise(resolve => setTimeout(resolve, this.DELAY_SECONDS * 1000));

    // Unwrap WUOMI
    logger.log('System | Step 4: Unwrapping WUOMI');
    await this.processTransactions('unwrap', numActions, accounts);
    await new Promise(resolve => setTimeout(resolve, this.DELAY_SECONDS * 1000));

    // Auto Wrap and Unwrap
    logger.log('System | Step 5: Auto Wrap and Unwrap');
    await this.processTransactions('auto', numActions, accounts);
    await new Promise(resolve => setTimeout(resolve, this.DELAY_SECONDS * 1000));

    // Add Liquidity
    logger.log('System | Step 6: Adding Liquidity');
    await this.autoAddLiquidity(numActions, accounts);
    await new Promise(resolve => setTimeout(resolve, this.DELAY_SECONDS * 1000));

    // Final balances
    logger.log('System | Step 7: Displaying Final Balances');
    await this.displayBalances(accounts);

    logger.log('System | Success: Auto All Operations completed');
  }

  async setTransactionCount() {
    while (true) {
      try {
        const numActions = await requestInput('Set number of transactions', 'number', '1');
        if (numActions > 0) {
          this.transactionCount = numActions;
          logger.log(`System | Transaction count set to: ${numActions}`);
          break;
        } else {
          logger.log('System | Error: Transaction count must be > 0.');
        }
      } catch {
        logger.log('System | Error: Invalid input. Enter a number.');
      }
    }
  }

  loadPrivateKeys() {
    try {
      const data = fs.readFileSync('accounts.txt', 'utf8');
      const privateKeys = data
        .split('\n')
        .map(key => {
          key = key.trim();
          if (key.startsWith('0x')) {
            key = key.slice(2);
          }
          return '0x' + key;
        })
        .filter(key => key.length === 66);

      if (privateKeys.length === 0) throw new Error('No valid private keys');
      return privateKeys;
    } catch (error) {
      logger.log(`System | Error: No valid private keys found in accounts.txt: ${error.message}`);
      return [];
    }
  }

  async mainMenu() {
    displayBanner();
    // Request initial transaction count
    await this.setTransactionCount();

    while (true) {
      displayBanner();
      displayMenu();
      
      const choice = await requestInput(`Select an option (1-${menuOptions.length})`, 'number');
      const idx = choice - 1;

      if (isNaN(idx) || idx < 0 || idx >= menuOptions.length) {
        logger.log('System | Error: Invalid option. Try again.');
        await new Promise(resolve => setTimeout(resolve, 1000));
        continue;
      }

      const selected = menuOptions[idx];
      if (selected.value === 'exit') {
        logger.log('System | Exiting...');
        await new Promise(resolve => setTimeout(resolve, 500));
        rl.close();
        process.exit(0);
      }

      const accounts = this.loadPrivateKeys();
      if (accounts.length === 0) {
        logger.log('System | Error: No accounts found in accounts.txt.');
        await requestInput('Press Enter to continue...');
        continue;
      }

      try {
        logger.log(`System | Starting ${selected.label}...`);
        const functions = {
          swapTokens: async () => await this.processSwaps(accounts, this.transactionCount),
          wrapUomi: async () => await this.processTransactions('wrap', this.transactionCount, accounts),
          unwrapUomi: async () => await this.processTransactions('unwrap', this.transactionCount, accounts),
          autoWrapUnwrap: async () => await this.processTransactions('auto', this.transactionCount, accounts),
          addLiquidity: async () => await this.autoAddLiquidity(this.transactionCount, accounts),
          autoAll: async () => await this.autoAll(this.transactionCount, accounts),
          setTransactionCount: async () => await this.setTransactionCount(),
          showBalances: async () => await this.displayBalances(accounts),
        };
        const scriptFunc = functions[selected.value];
        if (scriptFunc) {
          await scriptFunc();
          logger.log(`System | ${selected.label} completed.`);
        } else {
          logger.log(`System | Error: ${selected.label} not implemented.`);
        }
      } catch (e) {
        logger.log(`System | Error in ${selected.label}: ${e.message}`);
      }

      await requestInput('Press Enter to continue...');
    }
  }

  async main() {
    try {
      // Verify RPC connectivity
      try {
        await this.provider.getNetwork();
        logger.log('System | Success: Successfully connected to RPC');
      } catch (e) {
        logger.log(`System | Error: Failed to connect to RPC: ${e.message}. Please check if ${this.RPC_URL} is accessible.`);
        return;
      }

      if (!fs.existsSync('accounts.txt')) {
        logger.log('System | Error: accounts.txt not found. Please create it and add your private keys.');
        return;
      }

      await this.mainMenu();
    } catch (e) {
      if (e.message === 'Bot terminated by user.') {
        logger.log('System | Bot terminated by user.');
      } else {
        logger.log(`System | Error: Script failed: ${e.message}`);
      }
    }
  }
}

(async () => {
  try {
    const bot = new UOMI();
    await bot.main();
  } catch (e) {
    if (e.message === 'Bot terminated by user.') {
      logger.log('System | Bot terminated by user.');
    } else {
      logger.log(`System | Error: Script failed: ${e.message}`);
    }
    rl.close();
    process.exit(1);
  }
})();
