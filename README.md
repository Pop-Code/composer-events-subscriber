# composer-events-subscriber

## install 

Using npm

`npm install composer-events-subscriber --save`

Or using yarn

`yarn add composer-events-subscriber`

## Purpose
Composer create for us a set of transactions to make CRUD operations on assets and participants.
For now, it's not possible to listen for events from those transactions without using the native api.
This module connects to an eventHub from your hyperledger fabric network, and listens for all transactions that are submitted.
It dispatchs all events that you can listen to do what you need.


## Infos
The class Subscriber extends the node js EventEmitter from events module

## Usage

### Listen for all transactions

```js
import Subscriber from 'composer-events-subscriber'

//connect to the business network using the composer-client
businessNetwork.connect('cardName').then((invokedTx, historianTx) => {
    const subscriber = new Subscriber(businessNetwork)
    //subscribe to event hub
    const unsubscribe = subscriber.subscribe()
    //listen for all transaction
    subscriber.on('tx', (tx, historianTx)=> {
        console.log('All events')
    }).on('error', e => {
        console.log('ERROR')
    })
    //unsubscribe on process exit
    process.on('exit', () => unsubscribe())
})
```

### Listen for named transactions
```js
import Subscriber from 'composer-events-subscriber'

//connect to the business network using the composer-client
businessNetwork.connect('cardName').then(=> {
    const subscriber = new Subscriber(businessNetwork)
    //subscribe to event hub
    const unsubscribe = subscriber.subscribe()
    //listen for a named transaction
    subscriber.on('tx:org.hyperledger.composer.system.UpdateParticipant', (tx, historianTx) => {
        console.log('EVENT')
    }).on('error', e => {
        console.log('ERROR')
    })
    //unsubscribe on process exit
    process.on('exit', () => unsubscribe())
})
```




