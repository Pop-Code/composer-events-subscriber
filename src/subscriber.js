import Debug from 'debug'
import { EventEmitter } from 'events'

/**
 * Subscriber
 * @class
 * @emit 
 */
export default class Subscriber extends EventEmitter {

    /**
     * Constructor
     * @param {BusinessNetworkConnection} businessNetworkConnection 
     */
    constructor(businessNetworkConnection) {
        super()
        this.businessNetworkConnection = businessNetworkConnection
        this.businessNetworkName = businessNetworkConnection.card.getBusinessNetworkName()
        this.debug = Debug('composer:listener-' + this.businessNetworkName)
    }

    /**
     * Subscribe to all events in a business network
     * @return {Function} A function to unsubscribe
     */
    subscribe() {
        const { connection, card } = this.businessNetworkConnection

        //check the connection
        if (!connection) {
            const error = new Error('Business network is not connected')
            this.debug('Error: %s', error)
            throw error
        }

        //Check event hubs are existings
        if (!connection.eventHubs || connection.eventHubs.length === 0) {
            const error = new Error('Business network connection doesn\'t have eventsHubs')
            this.debug('Error: %s', error)
            throw error
        }

        //use the first hub we found
        const eventHub = connection.eventHubs[0]

        //register the listener
        this.debug('Starting subscriber')
        this._listener = eventHub.registerBlockEvent(this.onBlock.bind(this), this.onError.bind(this))

        //unscubscribe
        return () => eventHub.unregisterBlockEvent(this._listener)
    }

    async onError(error) {
        this.debug('Error', error)
        this.emit('error', error)
    }

    async onBlock(block) {
        try {
            const tx_id = block.data.data[0].payload.header.channel_header.tx_id
            const serializer = this.businessNetworkConnection.businessNetwork.getSerializer()
            this.debug('Receive event %s', tx_id, JSON.stringify(block))

            //get the complete tx from historian
            const historianRegistry = await this.businessNetworkConnection.getHistorian()
            const historianTx = await historianRegistry.get(tx_id)

            //Get the invoked tx
            const txRegistry = await this.businessNetworkConnection.getTransactionRegistry(historianTx.transactionType)
            const invokedTx = await txRegistry.get(historianTx.transactionId)

            this.debug('Dispatching event', serializer.toJSON(invokedTx), serializer.toJSON(historianTx))

            /**
             * Tx trnasaction event
             * @event Subscriber#tx
             * @type {object}
             * @property {object} invokedTx - the transaction invoked
             * @property {object} historianTx - the historian transaction
             */
            this.emit('tx', invokedTx, historianTx)

            /**
             * Tx trnasaction event
             * @event Subscriber#tx:{transactionType}
             * @type {object}
             * @property {object} invokedTx - the transaction invoked
             * @property {object} historianTx - the historian transaction
             */
            this.emit('tx:' + historianTx.transactionType, invokedTx, historianTx)

        } catch (e) {
            this.debug('Error', e)
            this.emit('error', e)
        }
    }
}