import { Injectable } from '@angular/core'
import { BluetoothLeHelper } from 'ionic-native-bluetoothle'
import { Observable, Subject, BehaviorSubject } from 'rxjs'
import { ScanResult } from './models/BleModels'
import { Deferred } from '@dodoinblue/promiseutils'
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

  scanWithTimeout (seconds: number = 10): Observable<ScanResult> {
    let scanResultSubject = new Subject<ScanResult>()
    let scanSubscription = this.ble.startScan([]).subscribe(data => {
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

  scanSpecificTarget (searchRule: (result: ScanResult) => boolean, timeoutSeconds: number = 10): Promise<ScanResult> {
    let deferred = new Deferred<ScanResult>()
    // TODO: Maybe I should handle the timeout manually here
    let subscription = this.scanWithTimeout(timeoutSeconds).subscribe(result => {
      if (searchRule(result)) {
        this.ble.stopScan().then(() => {
          subscription.unsubscribe()
          deferred.resolve(result)
        })
      }
    })
    return deferred.promise
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
    let retrieved = this.connectedDevices.get(address)
    if (retrieved) {
      console.log('returning an already connected device.')
      return Promise.resolve(retrieved)
    }

    let device = new MyDevice(this.ble, address, name)

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
    let device = this.connectedDevices.get(address)
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
