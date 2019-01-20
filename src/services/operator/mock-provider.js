const BaseOperatorProvider = require('./base-provider')
const utils = require('plasma-utils')

/**
 * Mocks an operator instead of sending real external requests.
 */
class MockOperatorProvider extends BaseOperatorProvider {
  constructor (options) {
    super(options)

    this.transactions = {}
    this.pending = {}
  }

  async getTransaction (hash) {
    const tx = this.transactions[hash]
    let decoded = tx.decoded
    decoded.hash = tx.hash
    return decoded
  }

  async getTransactions (address, start, end) {
    let transactions = []
    for (let hash in this.transactions) {
      let tx = this.transactions[hash]
      if (tx.address === address && tx.block >= start && tx.block <= end) {
        transactions.push(tx)
      }
    }
    return transactions
  }

  async getPendingTransactions (address) {
    return this.pending[address] || []
  }

  async sendTransaction (transaction) {
    // TODO: Worth it to transaction validity?
    const tx = new utils.serialization.models.Transaction(transaction)

    this.transactions[tx.hash] = tx

    tx.decoded.transfers.forEach((transfer) => {
      if (!this.pending[transfer.recipient]) {
        this.pending[transfer.recipient] = []
      }
      this.pending[transfer.recipient].push(tx.hash)
    })

    return tx.hash
  }
}

module.exports = MockOperatorProvider
