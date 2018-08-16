import { Injectable } from '@angular/core'
import { BluetoothLeHelper } from './BluetoothLeHelper'
import { BehaviorSubject, Observable, Subject } from 'rxjs'
import { ScanResult } from './models/BleModels'
import { Deferred, timeoutPromise } from '@dodoinblue/promiseutils'
import { BleDevice } from './BleDevice'

@Injectable()
export class BleManager {
  constructor (private ble: BluetoothLeHelper) {
  }

  init (): Promise<boolean> {
    return this.ble.initialize()
  }

  checkPermission (): Promise<boolean> {
    return this.ble.hasPermission()
      .then(hasPermission => hasPermission ? Promise.resolve(true) : Promise.reject(new Error('No permission')))
      .then(() => this.ble.isLocationEnabled())
      .then(isEnabled => isEnabled ? Promise.resolve(true) : Promise.reject(new Error('No location permission')))
  }

  requestPermission (): Promise<boolean> {
    return this.ble.hasPermission()
      .then(hasPermission => hasPermission ? Promise.resolve(true) : this.ble.requestPermission())
      .then(success => success ? Promise.resolve(true) : Promise.reject(new Error('No permission: Failed to obtain permission')))
      .then(() => this.ble.isLocationEnabled())
      .then(isEnabled => isEnabled ? Promise.resolve(true) : this.ble.requestLocation())
      .then(success => success ? Promise.resolve(true) : Promise.reject(new Error('No location permission: Failed to obtain location permission')))
  }

  scanWithTimeout (seconds = 10): Observable<ScanResult> {
    const scanResultSubject = new Subject<ScanResult>()
    const scanSubscription = this.ble.startScan([]).subscribe(data => {
      scanResultSubject.next(data)
    })
    setTimeout(() => {
      // TODO: scan maybe canceled early by scanSpecificTarget. Do a scan status check before calling stopScan again.
      this.ble.stopScan().then(() => {
        scanSubscription.unsubscribe()
        scanResultSubject.complete()
      })
    }, seconds * 1000)
    return scanResultSubject.asObservable()
  }

  scanSpecificTarget (searchRule: (result: ScanResult) => boolean, timeoutSeconds = 10): Promise<ScanResult> {
    const deferred = new Deferred<ScanResult>()
    const subscription = this.scanWithTimeout(timeoutSeconds).subscribe(result => {
      if (searchRule(result)) {
        this.ble.stopScan().then(() => {
          subscription.unsubscribe()
          deferred.resolve(result)
        })
      }
    })
    return timeoutPromise(deferred.promise, timeoutSeconds * 1000)
  }

  stopScan (): Promise<any> {
    return this.ble.stopScan()
  }

  // Section - Connection
  private connectedDevices: Map<string, BleDevice> = new Map()
  private deviceListSubject = new BehaviorSubject<BleDevice[]>([])
  getDeviceListSubject () {
    return this.deviceListSubject
  }

  addConnectedDevice (device: BleDevice) {
    this.connectedDevices.set(device.address, device)
    this.deviceListSubject.next(Array.from(this.connectedDevices.values()))
  }

  removeConnectedDevice (device: BleDevice) {
    this.connectedDevices.delete(device.address)
    this.deviceListSubject.next(Array.from(this.connectedDevices.values()))
  }

  /**
   * @param address {string} address (android) / uuid (ios) of the target device
   * @param MyDevice {class} device's specific class
   */
  connectToDevice (address: string, name: string, MyDevice: typeof BleDevice): Promise<BleDevice> {
    const retrieved = this.connectedDevices.get(address)
    if (retrieved) {
      console.log('returning an already connected device.')
      return Promise.resolve(retrieved)
    }

    const device = new MyDevice(this.ble, address, name)

    return device.connect().then(() => {
      this.addConnectedDevice(device)
      device.stateChangeSubject.subscribe(state => {
        console.log(`[BleManager] device status change: ${JSON.stringify(state)}`)
        if (state.newState === 'closed') {
          this.removeConnectedDevice(device)
        }
      })
      return device
    })
  }

  disconnect (address: string): Promise<boolean> {
    const device = this.connectedDevices.get(address)
    if (device) {
      console.log(`[BleManager] device found in list. removing.`)
      return device.disconnect().catch(() => {
        // Already disconnected? ignore error
      }).then(() => {
        this.removeConnectedDevice(device)
        return Promise.resolve(true)
      })
    }
    return Promise.resolve(true)
  }

  getDevice (address: string): BleDevice {
    return this.connectedDevices.get(address)
  }

  retrieveSystemBondedDevices (services: string[]) {
    return this.ble.retrieveConnected(services)
  }
}
