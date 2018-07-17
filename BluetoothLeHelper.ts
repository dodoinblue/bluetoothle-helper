import { BluetoothLe, IConnectionStatus } from 'ionic-native-bluetoothle'
import { Injectable } from '@angular/core'
import { filter, map, take } from 'rxjs/operators'
import { Observable } from 'rxjs'
import { ScanResult } from './models/BleModels'
import { timeoutPromiseWithError } from '@dodoinblue/promiseutils'

const DEFAULT_OPERATION_TIMEOUT = 5000 // ms

/**
 * @name BluetoothLeHelper
 * @description A helper class to make BluetoothLe plugin's API easier to use. This class unwraps json parameter and response
 * into strings, and uint8arrays. The APIs name is exactly the same as they are in BluetoothLe, but the signatures are modified.
 *
 * @usage
 * Use BluetoothLeHelper to replace BluetoothLe, no need to import BluetoothLe in app.module.ts
 * ```typescript
 * import { BluetoothLeHelper as BluetoothLe } from 'ionic-native-bluetoothle'
 *
 *
 * constructor(private ble: BluetoothLe) { }
 *
 * ...
 *
 *
 * this.ble.initialize().then((isInitialized) => {
 * ...
 * })
 *
 * ```
 */
@Injectable()
export class BluetoothLeHelper {

  bluetoothle: BluetoothLe
  constructor () {
    this.bluetoothle = new BluetoothLe()
  }

  /**
   * Initialize Bluetooth on the device. Must be called before anything else. Observable will
   * continuously be used whenever Bluetooth is enabled or disabled & gatt server events.
   *
   * @returns Promise<true> when operation is successful
   */
  initialize (): Promise<boolean> {
    return this.bluetoothle.initialize().pipe(
      take(1),
      map(result => result.status === 'enabled')
    ).toPromise()
  }

  /**
   * Android only
   * Enable Bluetooth on the device. Android support only. Listen to initialize callbacks for change in
   * Bluetooth state. A successful enable will return a status => enabled via initialize success callback.
   *
   * @returns void This is synchronize method
   */
  enable (): void {
    this.bluetoothle.enable()
  }

  /**
   * Android only
   * Disable Bluetooth on the device. Android support only. Listen to initialize callbacks for change in
   * Bluetooth state. A successful disable will return an error => enable via initialize error callback.
   *
   * @returns void This is synchronize method
   */
  disable (): void {
    this.bluetoothle.disable()
  }

  /**
   * Android only
   * Retrieve useful information such as the address, name, and various states
   * (initialized, enabled, scanning, discoverable).
   *
   * @returns a json object containing information of isInitialized, isEnabled, isScanning, isDiscoverable
   */
  getAdaptorInfo (): Promise<{
    name: string
    address: string
    isInitialized: boolean
    isEnabled: boolean
    isScanning: boolean
    isDiscoverable: boolean
  }> {
    return this.bluetoothle.getAdapterInfo()
  }

  /**
   * Scan for Bluetooth LE devices. Since scanning is expensive, stop as soon as possible.
   * The Cordova app should use a timer to limit the scan interval. Also, Android uses an AND
   * operator for filtering, while iOS uses an OR operator. Android API >= 23 requires
   * ACCESS_COARSE_LOCATION permissions to find unpaired devices. Permissions can be requested
   * by using the hasPermission and requestPermission functions. Android API >= 23 also requires
   * location services to be enabled. Use isLocationEnabled to determine whether location services
   * are enabled. If not enabled, use requestLocation to prompt the location services settings page.
   *
   * @param services - list of uuids of services to look for
   * @returns An observable of a stream of {@link ./models/BleModels | ScanResult}s
   */
  startScan (services: string[]): Observable<ScanResult> {
    const scanParams = { 'services': services }
    return this.bluetoothle.startScan(scanParams).pipe(
      filter(result => result && result.status === 'scanResult'),
      map(result => {
        return {
          address: result.address,
          name: result.name,
          rssi: result.rssi,
          advertisement: result.advertisement
        }
      })
    )
  }

  /**
   * Stop scan for Bluetooth LE devices. Since scanning is expensive, stop as soon as possible.
   * The app should use a timer to limit the scanning time.
   *
   * @returns Promise<true> when operation is successful
   */
  stopScan (): Promise<boolean> {
    return this.bluetoothle.stopScan().then(result => result.status === 'scanStopped')
  }

  /**
   * Retrieved paired Bluetooth LE devices.
   *
   * @param services - list of uuids of services to look for
   * @returns a json object with device's name and address
   */
  retrieveConnected (services: string[]): Promise<{
    name: string,
    address: string
  }[]> {
    return this.bluetoothle.retrieveConnected({ 'services': services })
  }

  /**
   * Android only. Bond with a device. The first success callback should always return with
   * status == bonding. If the bond is created, the callback will return again with
   * status == bonded. If the bonding popup is canceled or the wrong code is entered,
   * the callback will return again with status == unbonded
   *
   * @param address address of the device
   * @returns Promise<true> if the operation is successful
   */
  bond (address: string): Promise<boolean> {
    return timeoutPromiseWithError(this.bluetoothle.bond({ 'address': address }).pipe(
      filter(result => result.status === 'bonded'),
      take(1)
    ).toPromise(), DEFAULT_OPERATION_TIMEOUT)
  }

  /**
   * Android only
   * @param address address of the device to unbond
   *
   * @returns Promise<true> if the operation is successful
   */
  unbond (address: string): Promise<boolean> {
    return timeoutPromiseWithError(this.bluetoothle.unbond({ 'address': address }).pipe(
      filter(result => result.status === 'unbonded'),
      take(1)
    ).toPromise(), DEFAULT_OPERATION_TIMEOUT)
  }

  /**
   * Connect to a Bluetooth LE device. The app should use a timer to limit the
   * connecting time in case connecting is never successful. Once a device is
   * connected, it may disconnect without user intervention. The original connection
   * callback will be called again and receive an object with status => disconnected.
   * @param address address of the device to connect to
   * @return observable of connection status changes
   */
  connect (address: string): Observable<IConnectionStatus> {
    return this.bluetoothle.connect({ 'address': address })
  }

  /**
   * Reconnect to a previously connected Bluetooth device.
   * The app should use a timer to limit the connecting time.
   * If a timeout occurs, the reconnection attempt should be canceled
   * using disconnect() or close().
   *
   * @param address address of the device to reconnect to
   * @returns Promise<true> when operation is successful
   */
  reconnect (address: string): Promise<boolean> {
    return this.bluetoothle.reconnect({ 'address': address }).then(result => result.status === 'connected')
  }

  /**
   * Disconnect from a Bluetooth LE device. It's simpler to just call close().
   * Starting with iOS 10, disconnecting before closing seems required!
   *
   * @param address address of the device to disconnect from
   * @returns Promise<true> when operation is successful
   */
  disconnect (address: string): Promise<boolean> {
    return this.bluetoothle.disconnect({ 'address': address }).then(result => result.status === 'disconnected')
  }

  /**
   * Close/dispose a Bluetooth LE device. Prior to 2.7.0, you needed to disconnect to the
   * device before closing, but this is no longer the case. Starting with iOS 10,
   * disconnecting before closing seems required!
   *
   * @param address address of the device to close
   */
  close (address: string): Promise<boolean> {
    return this.bluetoothle.close({ 'address': address }).then(result => result.status === 'closed')
  }

  /**
   * Discover all the devices services, characteristics and descriptors. Doesn't need to be
   * called again after disconnecting and then reconnecting. If using iOS, you shouldn't use
   * discover and services/characteristics/descriptors on the same device.
   *
   * @param address address of the device to discover
   * @param clearCache default true
   * @returns A promise contains a json description of services and characteristics
   */
  discover (address: string, clearCache = true): Promise<{
    uuid: string,
    characteristics: {
      uuid: string,
      descriptors: any[]
    }[]
  }[]> {
    return this.bluetoothle.discover({ 'address': address, 'clearCache': clearCache }).then(result => result.services)
  }

  /**
   * Read a particular service's characteristic once.
   *
   * @param address address of the device to read from
   * @param service uuid of the service containing the desired characteristic
   * @param characteristic uuid of the characteristic to read from
   * @returns Promise of the read response in Uint8Array format
   */
  read (address: string, service: string, characteristic: string): Promise<Uint8Array> {
    return this.bluetoothle.read({
      'address': address,
      'service': service,
      'characteristic': characteristic
    }).then(result => this.bluetoothle.encodedStringToBytes(result.value))
  }

  /**
   * Subscribe to a particular service's characteristic. Once a subscription is no
   * longer needed, execute unsubscribe in a similar fashion.
   *
   * @param address address of the device to write to
   * @param service uuid of the service containing the desired characteristic
   * @param characteristic uuid of the characteristic to write to
   * @param cmd Uint8Array to send to the device
   * @param withoutResponse false if write response is required
   * @returns Promise<true> if operation is successful
   */
  write (address: string, service: string, characteristic: string, cmd: Uint8Array, withoutResponse: boolean): Promise<boolean> {
    const writeParams = {
      'address': address,
      'service': service,
      'characteristic': characteristic,
      'value': this.bluetoothle.bytesToEncodedString(cmd)
    } as any
    if (withoutResponse) {
      writeParams.type = 'noResponse'
    }
    return Promise.resolve().then(() => {
      return this.bluetoothle.write(writeParams) as any
    }).then(() => {
      return true
    })
  }

  /**
   * Subscribe to a particular service's characteristic. Once a subscription is no
   * longer needed, execute unsubscribe in a similar fashion.
   *
   * @param address address of the device to subscribe to
   * @param service uuid of the service containing the desired characteristic
   * @param characteristic uuid of the characteristic to subscribe to
   * @returns Observable of Uint8Array responses returned from the device
   */
  subscribe (address: string, service: string, characteristic: string): Observable<Uint8Array> {
    return this.bluetoothle.subscribe({
      'address': address,
      'service': service,
      'characteristic': characteristic
    }).pipe(
      filter(result => result.status === 'subscribedResult'),
      map(result => result.value),
      map(b64 => this.bluetoothle.encodedStringToBytes(b64))
    )
  }

  /**
   * Unsubscribe to a particular service's characteristic.
   *
   * @param address address of the device to unsubscribe from
   * @param service uuid of the service containing the desired characteristic
   * @param characteristic uuid of the characteristic to unsubscribe from
   * @returns Promise<true> if operation is successful
   */
  unsubscribe (address: string, service: string, characteristic: string): Promise<boolean> {
    return this.bluetoothle.unsubscribe({
      'address': address,
      'service': service,
      'characteristic': characteristic
    }).then(result => result.status === 'unsubscribed')
  }

  /**
   * Read RSSI of a connected device. RSSI is also returned with scanning.
   *
   * @param address address of the device to read RSSI from
   * @returns Promise of the RSSI value
   */
  rssi (address: string): Promise<number> {
    return this.bluetoothle.rssi({ 'address': address }).then(result => result.rssi)
  }

  /**
   * Set MTU of a connected device. Android only.
   *
   * @param address address of the device to set MTU to
   * @param mtu the value of the MTU to should be set to
   * @returns Promise of an integer value mtu should be set to
   */
  mtu (address: string, mtu: number): Promise<number> {
    return this.bluetoothle.mtu({ 'address': address, 'mtu': mtu }).then(result => result.mtu)
  }

  /**
   * Request a change in the connection priority to improve throughput when transfer large amounts of data via BLE.
   * Android support only. iOS will return error.
   *
   * @param address address of the device to set connection priority to
   * @param connectionPriority choice of 'low' | 'balanced' | 'high'
   * @returns Promise<true> if operation is successful
   */
  requestConnectionPriority (address: string, connectionPriority: 'low' | 'balanced' | 'high'): Promise<boolean> {
    return this.bluetoothle.requestConnectionPriority({
      'address': address,
      'connectionPriority': connectionPriority
    }).then(result => result.status === 'connectionPriorityRequested')
  }

  isInitialized (): Promise<boolean> {
    return this.bluetoothle.isInitialized().then(result => result.isInitialized)
  }

  isEnabled (): Promise<boolean> {
    return this.bluetoothle.isEnabled().then(result => result.isEnabled)
  }

  isScanning (): Promise<boolean> {
    return this.bluetoothle.isScanning().then(result => result.isScanning)
  }

  isBonded (address: string): Promise<boolean> {
    return this.bluetoothle.isBonded({ 'address': address }).then(result => result.isBonded)
  }

  wasConnected (address: string): Promise<boolean> {
    return this.bluetoothle.wasConnected({ 'address': address }).then(result => result.wasConnected)
  }

  isConnected (address: string): Promise<boolean> {
    return this.bluetoothle.isConnected({ 'address': address }).then(result => result.isConnected)
  }

  isDiscovered (address: string): Promise<boolean> {
    return this.bluetoothle.isDiscovered({ 'address': address }).then(result => result.isDiscovered)
  }

  hasPermission (): Promise<boolean> {
    return this.bluetoothle.hasPermission().then(result => result.hasPermission)
  }

  requestPermission (): Promise<boolean> {
    return this.bluetoothle.requestPermission().then(result => result.requestPermission)
  }

  isLocationEnabled (): Promise<boolean> {
    return this.bluetoothle.isLocationEnabled().then(result => result.isLocationEnabled)
  }

  requestLocation (): Promise<boolean> {
    return this.bluetoothle.requestLocation().then(result => result.requestLocation)
  }

  /**
   * Helper function to convert a unit8Array to a base64 encoded string for a characteric or descriptor write.
   *
   * @param bytes Uint8Array to encode
   * @returns encoded string
   */
  bytesToEncodedString (bytes: Uint8Array): string {
    return this.bluetoothle.bytesToEncodedString(bytes)
  }

  /**
   * Helper function to convert a base64 encoded string from a characteristic or descriptor value into a uint8Array object.
   *
   * @param s string to decode
   * @returns decoded content in Uint8Array format
   */
  encodedStringToBytes (s: string): Uint8Array {
    return this.bluetoothle.encodedStringToBytes(s)
  }
}
