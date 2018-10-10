import { BluetoothLeHelper } from './BluetoothLeHelper'
import { Observable, Subject, BehaviorSubject } from 'rxjs'
import { take } from 'rxjs/operators'
import { Deferred, delay, timeoutPromise } from '@dodoinblue/promiseutils'

export enum DeviceState {
  NONE = 'none',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  DISCOVERED = 'discovered',
  DISCONNECTED = 'disconnected',
  CLOSED = 'closed'
  // TODO: BONDING, BONDED, DISCONNECT_MANUAL, DISCONNECT_DFU
}
const DEFAULT_CONNECTION_TIMEOUT = 15 * 1000

export class BleDevice {
  private services: any[]
  public deviceState: BehaviorSubject<DeviceState> = new BehaviorSubject<DeviceState>(DeviceState.NONE)

  /**
   * @deprecated
   * Use deviceState subject instead.
   */
  private _state: DeviceState

  /* tslint:disable */
  set state (state: DeviceState) {
    this._state = state
    this.deviceState.next(state)
  }

  get state (): DeviceState {
    return this._state
  }
  /* tslint:enable */

  name: string
  stateChangeSubject: Subject<{ oldState: DeviceState, newState: DeviceState }>

  constructor (protected ble: BluetoothLeHelper, readonly address: string, name: string) {
    this.name = name
    this.stateChangeSubject = new Subject<{ oldState: DeviceState, newState: DeviceState }>()
  }

  // Section - Connection
  connect (): Promise<BleDevice> {
    return this.kickOffConnect().waitForConnection()
  }

  kickOffConnect (): BleDevice {
    this.setState(DeviceState.CONNECTING)
    this.ble.connect(this.address).subscribe(state => {
      this.name = state.name
      if (state.status === 'connected') {
        this.setState(DeviceState.CONNECTED)
      } else if (state.status === 'disconnected') {
        this.setState(DeviceState.DISCONNECTED)
      } else {
        console.log(`[BleDevice] ble plugin returned unknown status: ${state.status}`)
      }
    }, error => {
      // This should be avoided by calling close every time 'disconnect' event happens.
      // Close this device to allow later connection.
      if (error.message.includes('Device previously connected')) {
        this.setState(DeviceState.DISCONNECTED)
      }
    }, () => {
      console.log(`[BleDevice] connect() Subscription completed.`)
    })
    return this
  }

  waitForConnection (): Promise<BleDevice> {
    const deferred = new Deferred<BleDevice>()
    const cancelConnectionTask = setTimeout(() => {
      this.setState(DeviceState.DISCONNECTED)
    }, DEFAULT_CONNECTION_TIMEOUT)
    this.stateChangeSubject.subscribe(data => {
      if (data.newState === DeviceState.DISCOVERED) {
        clearTimeout(cancelConnectionTask)
        deferred.resolve(this)
      } else if (data.newState === DeviceState.CLOSED) {
        deferred.reject(new Error('Failed to establish connection'))
      }
    })
    return timeoutPromise(deferred.promise, DEFAULT_CONNECTION_TIMEOUT + 1000)
  }

  disconnect () {
    return this.ble.disconnect(this.address).then(result => {
      this.setState(DeviceState.DISCONNECTED)
    })
  }

  close () {
    this.ble.close(this.address).then(result => {
      this.setState(DeviceState.CLOSED)
    })
  }

  private setState (newState: DeviceState) {
    if (newState === DeviceState.CONNECTING) {
      // set state. that's it.
      this.state = newState
    } else if (newState === DeviceState.CONNECTED) {
      switch (this.state) {
        case DeviceState.CONNECTING:
          // Connection established. Discover
          this.state = newState
          this.discover()
          break
        default:
          // Shouldn't happen
          console.log(`[BleDevice] setState2 Unexpected state change ${this.state} -> ${newState}`)
          this.state = newState
          break
      }
    } else if (newState === DeviceState.DISCOVERED) {
      switch (this.state) {
        case DeviceState.CONNECTED: // Normal case. Discovered.
        case DeviceState.CONNECTING: // Reconnect??
          this.stateChangeSubject.next({
            oldState: this.state,
            newState
          })
          this.state = newState
          break
        default:
          // Shouldn't happen
          console.log(`[BleDevice] setState2 Unexpected state change ${this.state} -> ${newState}`)
          this.state = newState
          break
      }
    } else if (newState === DeviceState.DISCONNECTED) {
      switch (this.state) {
        case DeviceState.CONNECTING:
          // Failed to establish connection. Close
          this.state = newState
          this.close()
          break
        case DeviceState.CONNECTED:
          // Failed to discover. No need to keep connection. Close
          this.state = newState
          this.close()
          break
        case DeviceState.DISCOVERED:
          // Connection interrupted. Or manually disconnected. Notify listeners.
          this.stateChangeSubject.next({
            oldState: this.state,
            newState
          })
          this.state = newState
          this.close()
          break
        default:
          // Shouldn't happen
          console.log(`[BleDevice] setState2 Unexpected state change ${this.state} -> ${newState}`)
          this.state = newState
          break
      }
    } else if (newState === DeviceState.CLOSED) {
      switch (this.state) {
        case DeviceState.DISCONNECTED:
          this.stateChangeSubject.next({
            oldState: this.state,
            newState
          })
          this.state = newState
          break
        default:
          console.log(`[BleDevice] setState2 Unexpected state change ${this.state} -> ${newState}`)
          this.state = newState
          break
      }
    }
  }

  isConnected (): Promise<boolean> {
    return this.ble.isConnected(this.address)
  }

  wasConnected (): Promise<boolean> {
    return this.ble.wasConnected(this.address)
  }

  bond (): Promise<boolean> {
    return this.ble.bond(this.address)
  }

  isBonded (): Promise<boolean> {
    return this.ble.isBonded(this.address)
  }

  // End of section - Connection

  discover () {
    return delay(1500).then(() => {
      return this.ble.discover(this.address)
    }).then((result) => {
      this.services = result
      this.setState(DeviceState.DISCOVERED)
    })
  }

  hasService (serviceUUID: string): boolean {
    if (!this.services) {
      return false
    }
    for (let i = 0; i < this.services.length; i++) {
      const service = this.services[i]
      if (service.uuid.toLowerCase().split('-').join('') === serviceUUID.toLowerCase().split('-').join('')) {
        return true
      }
    }
    return false
  }

  // TODO: implement
  // hasCharacteristic (): boolean {
  //   return true
  // }

  read (service: string, characteristic: string): Promise<Uint8Array> {
    return this.ble.read(this.address, service, characteristic)
  }

  write (service: string, characteristic: string, cmd: Uint8Array): Promise<boolean> {
    return this.ble.write(this.address, service, characteristic, cmd, false)
  }

  writeWithoutResponse (service: string, characteristic: string, cmd: Uint8Array): Promise<boolean> {
    return this.ble.write(this.address, service, characteristic, cmd, true)
  }

  // Section - BLE Subscriptions
  subscriptionMap: Map<string, Observable<any>> = new Map()

  startNotification (service: string, characteristic: string): Observable<Uint8Array> {
    let observable: Observable<Uint8Array> = this.subscriptionMap.get(`${characteristic}@${service}`)
    if (!observable) {
      const subject = new Subject<Uint8Array>()
      console.log(`[BleDevice] Creating new observable for ${characteristic}@${service}`)
      this.ble.subscribe(this.address, service, characteristic).subscribe(result => {
        subject.next(result)
      },
      error => console.log(`[BleDevice] error startNotification: ${JSON.stringify(error)}`))

      observable = subject.asObservable()
      this.subscriptionMap.set(`${characteristic}@${service}`, observable)
    }
    return observable
  }

  stopNotification (service: string, characteristic: string): Promise<boolean> {
    return this.ble.unsubscribe(this.address, service, characteristic).then(() => {
      this.subscriptionMap.delete(`${characteristic}@${service}`)
    }).then(() => Promise.resolve(true))
  }

  // End of Subscriptions

  writeForData (service: string, characteristic: string, cmd: Uint8Array, writeWithoutResponse = false): Promise<Uint8Array> {
    const notifyPromise = this.startNotification(service, characteristic).pipe(take(1)).toPromise()
    const writePromise = this.ble.write(this.address, service, characteristic, cmd, writeWithoutResponse)
    return Promise.all([notifyPromise, writePromise]).then(resolved => resolved[0])
  }
}
