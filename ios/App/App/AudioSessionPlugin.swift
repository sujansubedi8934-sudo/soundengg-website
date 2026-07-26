import Foundation
import Capacitor
import AVFoundation

@objc(AudioSessionPlugin)
public class AudioSessionPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "AudioSessionPlugin"
    public let jsName = "AudioSessionPlugin"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "configureAudioSession", returnType: CAPPluginReturnPromise)
    ]

    @objc func configureAudioSession(_ call: CAPPluginCall) {
        do {
            let session = AVAudioSession.sharedInstance()
            try session.setCategory(.playAndRecord, mode: .default, options: [.defaultToSpeaker, .allowBluetooth, .allowBluetoothA2DP, .mixWithOthers])
            try session.setActive(true, options: .notifyOthersOnDeactivation)
            print("AudioSessionPlugin: Successfully set category to .playAndRecord")
            call.resolve(["success": true])
        } catch {
            print("AudioSessionPlugin Error: \(error.localizedDescription)")
            call.reject("Failed to configure audio session: \(error.localizedDescription)")
        }
    }
}
