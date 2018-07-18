import { BluetoothLeHelper } from '../BluetoothLeHelper'
import { map } from 'rxjs/operators'
import { interval } from 'rxjs/observable/interval'
import { IConnectionStatus, ConnectStatus } from 'ionic-native-bluetoothle'
import { Observable, Observer } from 'rxjs'

export class BluetoothLeHelperMock extends BluetoothLeHelper {

  initialize (): Promise<boolean> {
    return Promise.resolve(true)
  }

  enable () {
    return
  }

  disable () {
    return
  }

  getAdaptorInfo (): Promise<{
    name: string
    address: string
    isInitialized: boolean
    isEnabled: boolean
    isScanning: boolean
    isDiscoverable: boolean
  }> {
    return Promise.resolve({
      name: 'MC_FAKE_MASTER',
      address: '2a:a0:2b:a3:5f:b0',
      isInitialized: true,
      isEnabled: true,
      isScanning: false,
      isDiscoverable: false
    })
  }

  startScan () {
    let resp = [
      {
        'address': 'C6:D5:E9:DF:CE:EE',
        'name': 'MOCK-041Q',
        'rssi': -80,
        'advertisement': 'AgEEDv+JATYwUDAwMDQxUUFJCwlTTElDRS0wNDFRAwINGAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA='
      },
      {
        'address': '2A:12:AA:D3:D2:C5',
        'name': null,
        'rssi': -92,
        'advertisement': 'AgEbC/9MAAkGAxusGRmSAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA='
      },
      {
        'address': 'E7:85:C7:2D:F8:AF',
        'name': 'MOCK-16LQ',
        'rssi': -89, 'advertisement': 'AgEEDv+JATYwUDAwMTZMUUxICwlTTElDRS0xNkxRAwINGAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA='
      },
      {
        'address': 'C6:D7:C9:0F:72:52',
        'name': 'MOCK-SJR2',
        'rssi': -78,
        'advertisement': 'AgEED/+JATYxUEo2U0pSMklIBQsJTElOSzItU0pSMgMCDRgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA='
      }
    ]
    return interval(1000).pipe(map(val => {
      if (val < resp.length) {
        return resp[val]
      }
    }))
  }

  stopScan (): Promise<boolean> {
    return Promise.resolve(true)
  }

  retrieveConnected (services: string[]): Promise<{
    name: string,
    address: string
  }[]> {
    return Promise.resolve([
      {
        'address': 'C6:D7:C9:0F:72:52',
        'name': 'MOCK-040B'
      },
      {
        'address': 'C6:D7:C9:0F:72:52',
        'name': 'MOCK-1354'
      }
    ])
  }

  bond (address: string): Promise<boolean> {
    return Promise.resolve(true)
  }

  unbond (address: string): Promise<boolean> {
    return Promise.resolve(true)
  }

  connectObserver: Observer<IConnectionStatus>
  connect (address: string): Observable<IConnectionStatus> {
    return Observable.create((observer: Observer<any>) => {
      this.connectObserver = observer
      this.connectObserver.next({
        name: 'MOCK-Dev0',
        address: address,
        status: ConnectStatus.connected
      })
    })
  }

  reconnect (address: string): Promise<boolean> {
    return Promise.resolve(true)
  }

  disconnect (address: string): Promise<boolean> {
    return Promise.resolve(true)
  }

  close (address: string): Promise<boolean> {
    return Promise.resolve(true)
  }

  discover (address: string, clearCache = true): Promise<{
    uuid: string,
    characteristics: {
      uuid: string,
      descriptors: any[]
    }[]
  }[]> {
    return Promise.resolve(
      [
        {
          'characteristics': [
            {
              'descriptors': [

              ],
              'uuid': '2a00', // [Device Name](https://developer.bluetooth.org/gatt/characteristics/Pages/CharacteristicViewer.aspx?u=org.bluetooth.characteristic.gap.device_name.xml)
              'properties': {
                'write': true,
                'writeWithoutResponse': true,
                'read': true
              }
            },
            {
              'descriptors': [

              ],
              'uuid': '2a01', // [Appearance](https://developer.bluetooth.org/gatt/characteristics/Pages/CharacteristicViewer.aspx?u=org.bluetooth.characteristic.gap.appearance.xml)
              'properties': {
                'read': true
              }
            },
            {
              'descriptors': [

              ],
              'uuid': '2a02', // [Peripheral Privacy Flag](https://developer.bluetooth.org/gatt/characteristics/Pages/CharacteristicViewer.aspx?u=org.bluetooth.characteristic.gap.peripheral_privacy_flag.xml)
              'properties': {
                'read': true
              }
            },
            {
              'descriptors': [

              ],
              'uuid': '2a03', // [Reconnection Address](https://developer.bluetooth.org/gatt/characteristics/Pages/CharacteristicViewer.aspx?u=org.bluetooth.characteristic.gap.reconnection_address.xml)
              'properties': {
                'write': true
              }
            },
            {
              'descriptors': [

              ],
              'uuid': '2a04', // [Pheripheral Preferred Connection Parameters](https://developer.bluetooth.org/gatt/characteristics/Pages/CharacteristicViewer.aspx?u=org.bluetooth.characteristic.gap.peripheral_preferred_connection_parameters.xml)
              'properties': {
                'read': true
              }
            }
          ],
          'uuid': '1800' // [Generic Access](https://developer.bluetooth.org/gatt/services/Pages/ServiceViewer.aspx?u=org.bluetooth.service.generic_access.xml)
        },
        {
          'characteristics': [
            {
              'descriptors': [
                {
                  'uuid': '2902'
                }
              ],
              'uuid': '2a05', // [Service Changed](https://developer.bluetooth.org/gatt/characteristics/Pages/CharacteristicViewer.aspx?u=org.bluetooth.characteristic.gatt.service_changed.xml)
              'properties': {
                'indicate': true
              }
            }
          ],
          'uuid': '1801' // [Generic Attribute](https://developer.bluetooth.org/gatt/services/Pages/ServiceViewer.aspx?u=org.bluetooth.service.generic_attribute.xml)
        },
        {
          'characteristics': [
            {
              'descriptors': [
                {
                  'uuid': '2902'
                }
              ],
              'uuid': '2a37', // [Heart Rate Measurement](https://developer.bluetooth.org/gatt/characteristics/Pages/CharacteristicViewer.aspx?u=org.bluetooth.characteristic.heart_rate_measurement.xml)
              'properties': {
                'notify': true
              }
            },
            {
              'descriptors': [

              ],
              'uuid': '2a38', // [Body Sensor Location](https://developer.bluetooth.org/gatt/characteristics/Pages/CharacteristicViewer.aspx?u=org.bluetooth.characteristic.body_sensor_location.xml)
              'properties': {
                'read': true
              }
            }
          ],
          'uuid': '180d' // [Heart Rate](https://developer.bluetooth.org/gatt/services/Pages/ServiceViewer.aspx?u=org.bluetooth.service.heart_rate.xml)
        },
        {
          'characteristics': [
            {
              'descriptors': [

              ],
              'uuid': '2a23', // [System ID](https://developer.bluetooth.org/gatt/characteristics/Pages/CharacteristicViewer.aspx?u=org.bluetooth.characteristic.system_id.xml)
              'properties': {
                'read': true
              }
            },
            {
              'descriptors': [

              ],
              'uuid': '2a24', // [Model Number String](https://developer.bluetooth.org/gatt/characteristics/Pages/CharacteristicViewer.aspx?u=org.bluetooth.characteristic.model_number_string.xml)
              'properties': {
                'read': true
              }
            },
            {
              'descriptors': [

              ],
              'uuid': '2a25', // [Serial Number String](https://developer.bluetooth.org/gatt/characteristics/Pages/CharacteristicViewer.aspx?u=org.bluetooth.characteristic.serial_number_string.xml)
              'properties': {
                'read': true
              }
            },
            {
              'descriptors': [

              ],
              'uuid': '2a26', // [Firmware Revision String](https://developer.bluetooth.org/gatt/characteristics/Pages/CharacteristicViewer.aspx?u=org.bluetooth.characteristic.firmware_revision_string.xml)
              'properties': {
                'read': true
              }
            },
            {
              'descriptors': [

              ],
              'uuid': '2a27', // [hardware Revision String](https://developer.bluetooth.org/gatt/characteristics/Pages/CharacteristicViewer.aspx?u=org.bluetooth.characteristic.hardware_revision_string.xml)
              'properties': {
                'read': true
              }
            },
            {
              'descriptors': [

              ],
              'uuid': '2a28', // [Software Revision String](https://developer.bluetooth.org/gatt/characteristics/Pages/CharacteristicViewer.aspx?u=org.bluetooth.characteristic.software_revision_string.xml)
              'properties': {
                'read': true
              }
            },
            {
              'descriptors': [

              ],
              'uuid': '2a29', // [Manufacturer Name String](https://developer.bluetooth.org/gatt/characteristics/Pages/CharacteristicViewer.aspx?u=org.bluetooth.characteristic.manufacturer_name_string.xml)
              'properties': {
                'read': true
              }
            }
          ],
          'uuid': '180a' // [Device Information](https://developer.bluetooth.org/gatt/services/Pages/ServiceViewer.aspx?u=org.bluetooth.service.device_information.xml)
        },
        {
          'characteristics': [
            {
              'descriptors': [

              ],
              'uuid': '2a19', // [Battery Level](https://developer.bluetooth.org/gatt/characteristics/Pages/CharacteristicViewer.aspx?u=org.bluetooth.characteristic.battery_level.xml)
              'properties': {
                'read': true
              }
            }
          ],
          'uuid': '180f' // [Battery Service](https://developer.bluetooth.org/gatt/services/Pages/ServiceViewer.aspx?u=org.bluetooth.service.battery_service.xml)
        },
        {
          'characteristics': [
            {
              'descriptors': [

              ],
              'uuid': '6217ff4c-c8ec-b1fb-1380-3ad986708e2d',
              'properties': {
                'read': true
              }
            },
            {
              'descriptors': [
                {
                  'uuid': '2902'
                }
              ],
              'uuid': '6217ff4d-91bb-91d0-7e2a-7cd3bda8a1f3',
              'properties': {
                'write': true,
                'indicate': true
              }
            }
          ],
          'uuid': '6217ff4b-fb31-1140-ad5a-a45545d7ecf3'
        }
      ]
    )
  }
}
