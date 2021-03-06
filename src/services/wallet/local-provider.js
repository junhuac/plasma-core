const fs = require('fs')
const path = require('path')
const appRoot = require('app-root-path')
const BaseWalletProvider = require('./base-provider')

const defaultOptions = {
  keystoreDir: path.join(appRoot.toString(), 'plasma-keystore')
}

class LocalWalletProvider extends BaseWalletProvider {
  constructor (options) {
    super(options, defaultOptions)

    if (!fs.existsSync(this.options.keystoreDir)) {
      fs.mkdirSync(this.options.keystoreDir)
    }
  }

  async getAccounts () {
    // TODO: Should probably actually read the files instead
    // of just looking at the file names.
    const accounts = fs.readdirSync(this.options.keystoreDir)
    return accounts
  }

  async sign (address, data) {
    const account = this._getAccount(address)
    return account.sign(data)
  }

  // TODO: Support encrypted accounts.
  async createAccount () {
    const account = this.services.web3.eth.accounts.create()

    const keystorePath = path.join(this.options.keystoreDir, account.address)
    fs.writeFileSync(keystorePath, JSON.stringify(account))
    await this.addAccountToWallet(account.address)
    return account.address
  }

  async addAccountToWallet (address) {
    const accounts = await this.services.web3.eth.accounts.wallet
    if (address in accounts) return

    const account = this._getAccount(address)
    await this.services.web3.eth.accounts.wallet.add(account.privateKey)
  }

  _getAccount (address) {
    const keystorePath = path.join(this.options.keystoreDir, address)
    const keystore = JSON.parse(fs.readFileSync(keystorePath))
    return this.services.web3.eth.accounts.privateKeyToAccount(keystore.privateKey)
  }
}

module.exports = LocalWalletProvider
