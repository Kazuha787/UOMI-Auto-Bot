# UOMI Auto Bot
![IMG_20250804_114728_494](https://github.com/user-attachments/assets/142425f7-0dd2-4335-863b-27942c0bf398)

*Version 1.0 | Created by Kazuha | [Join our Telegram Community](https://t.me/Offical_Im_kazuha)*

---

# UOMI Auto Bot

![UOMI Auto Bot Banner](https://via.placeholder.com/800x200.png?text=UOMI+Auto+Bot) <!-- Optional: Replace with a real banner image if available -->

A Node.js script to automate wrapping and unwrapping of UOMI to WUOMI tokens on the Uomi Testnet. This bot allows users to perform transactions, check balances, and automate operations with customizable transaction counts and random amounts.

**Created by Kazuha** | Built for the Uomi Testnet

---

## Features

- **Wrap UOMI to WUOMI**: Convert native UOMI tokens to WUOMI tokens.
- **Unwrap WUOMI to UOMI**: Convert WUOMI tokens back to native UOMI.
- **Auto Mode**: Perform both wrap and unwrap operations sequentially.
- **Balance Display**: View UOMI and WUOMI balances for all configured accounts.
- **Randomized Amounts**: Generate random transaction amounts between 0.001 and 0.004 UOMI/WUOMI.
- **Multi-Account Support**: Process transactions for multiple private keys stored in a `.env` file.
- **User-Friendly CLI**: Interactive command-line interface using `inquirer` for easy operation.

---

## Prerequisites

Before running the UOMI Auto Bot, ensure you have the following installed:

- **Node.js** (v16 or higher)
- **npm** (Node Package Manager)
- A `.env` file with private keys for the Uomi Testnet accounts
- Access to the Uomi Testnet RPC endpoint (`https://finney.uomi.ai`)

---

## Installation

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/Kazuha787/UOMI-Auto-Bot.git
   cd UOMI-Auto-Bot
   ```

2. **Install Dependencies**:
   Run the following command to install the required Node.js packages:
   ```bash
   npm install ethers inquirer figlet chalk dotenv
   ```

3. **Set Up Environment Variables**:
   Create a `.env` file in the project root directory and add your private keys as follows:
   ```env
   PRIVATE_KEYS_1=your_private_key_1
   PRIVATE_KEYS_2=your_private_key_2
   PRIVATE_KEYS_3=your_private_key_3
   ```
   - Replace `your_private_key_1`, `your_private_key_2`, etc., with your actual private keys.
   - You can add as many private keys as needed ( PRIVATE_KEYS_1, PRIVATE_KEYS_2, etc.).
   - Ensure there are no spaces around the keys and no trailing spaces.

4. **Verify Configuration**:
   Ensure the following constants in the script are correct:
   - `RPC_URL`: `https://finney.uomi.ai`
   - `CHAIN_ID`: `4386`
   - `WUOMI_ADDRESS`: `0x5FCa78E132dF589c1c799F906dC867124a2567b2`
   - `NATIVE_TOKEN`: `UOMI`
   - `DELAY_SECONDS`: `1` (delay between transactions)

---

## Usage

1. **Run the Bot**:
   Start the bot by running the following command:
   ```bash
   node index.js
   ```

2. **Interact with the CLI**:
   The bot will display a banner and prompt you to select an action:
   - **Wrap UOMI to WUOMI**: Convert UOMI to WUOMI.
   - **Unwrap WUOMI to UOMI**: Convert WUOMI back to UOMI.
   - **Auto (Wrap then Unwrap)**: Perform both operations sequentially.
   - **Show Balances**: Display UOMI and WUOMI balances for all accounts.
   - **Exit**: Close the bot.

3. **Specify Number of Transactions**:
   For wrap, unwrap, or auto modes, you will be prompted to enter the number of transactions to perform per account. The bot will use a random amount between `0.001` and `0.004` UOMI/WUOMI for each transaction.

4. **Monitor Transactions**:
   - The bot logs transaction details, including transaction hashes (linked to `https://explorer.uomi.ai/tx/`).
   - It checks for sufficient balances before executing transactions and skips accounts with insufficient funds.
   - Balances are displayed after each set of transactions.

---

## Example Output

```
============================================================
                 UOMI BOT
============================================================
                 LETS FUCK THIS TESTNET
          Created By Kazuha - By Uomi Testnet
============================================================

? Select an action: (Use arrow keys)
> Wrap UOMI to WUOMI
  Unwrap WUOMI to UOMI
  Auto (Wrap then Unwrap)
  Show Balances
  Exit
```

---

## Error Handling

- **No Private Keys**: If no private keys are found in the `.env` file, the bot will exit with an error message.
- **Insufficient Balance**: Transactions are skipped if the account lacks sufficient UOMI or WUOMI.
- **Transaction Failures**: Errors during transactions (e.g., network issues) are logged, and the bot continues with the next operation.
- **Invalid Input**: The CLI validates the number of transactions to ensure it is a positive integer.

---

## Notes

- **Testnet Only**: This bot is designed for the Uomi Testnet. Do not use it on mainnet or with real funds.
- **Security**: Keep your `.env` file secure and never share your private keys. Add `.env` to your `.gitignore` file to prevent accidental commits.
- **Gas Settings**: The bot uses dynamic gas pricing based on the latest block's `baseFeePerGas` plus a fixed `2 gwei` for both `maxFeePerGas` and `maxPriorityFeePerGas`.
- **Transaction Delay**: A 1-second delay is enforced between transactions to avoid overwhelming the network.

---

## Contributing

Contributions are welcome! To contribute:

1. Fork the repository.
2. Create a new branch (`git checkout -b feature/your-feature`).
3. Make your changes and commit (`git commit -m "Add your feature"`).
4. Push to your branch (`git push origin feature/your-feature`).
5. Open a pull request.

Please ensure your code follows the existing style and includes appropriate documentation.

---

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

## Acknowledgments

- Built using the [Ethers.js](https://docs.ethers.io/) library for Ethereum interactions.
- Uses [Inquirer.js](https://github.com/SBoudrias/Inquirer.js) for the interactive CLI.
- Styled with [Chalk](https://github.com/chalk/chalk) and [Figlet](https://github.com/patorjk/figlet.js) for console output.

---

## Contact

For questions or support, open an issue on this repository or contact the creator, Kazuha, via GitHub.

---

**Happy Testing on the Uomi Testnet! 🚀**

---

### Instructions for Use

1. Copy the above content into a file named `README.md` in your project root directory.
2. If you have a banner image, replace the placeholder URL (`https://via.placeholder.com/800x200.png?text=UOMI+Auto+Bot`) with the actual image URL.
3. Ensure the `.gitignore` file includes `.env` to prevent accidental exposure of private keys.
4. Push the README to your repository:
   ```bash
   git add README.md
   git commit -m "Add README file"
   git push origin main
   ```

This README is concise, professional, and tailored to your project, providing clear instructions for users and contributors. Let me know if you need further tweaks or additional sections!
