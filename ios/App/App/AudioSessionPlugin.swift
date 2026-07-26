import Foundation
import Capacitor
import AVFoundation
import GoogleMobileAds

@objc(AudioSessionPlugin)
public class AudioSessionPlugin: CAPPlugin {
    
    override public func load() {
        super.load()
        GADMobileAds.sharedInstance().audioVideoManager.audioSessionIsApplicationManaged = true
        enforcePlayAndRecord()
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(handleRouteChange),
            name: AVAudioSession.routeChangeNotification,
            object: nil
        )
    }

    @objc func handleRouteChange(notification: Notification) {
        enforcePlayAndRecord()
    }

    @objc func configureAudioSession(_ call: CAPPluginCall) {
        if enforcePlayAndRecord() {
            print("⚡ [AudioSessionPlugin] Successfully set category to .playAndRecord")
            call.resolve(["success": true])
        } else {
            call.reject("Failed to set audio session category")
        }
    }

    @discardableResult
    private func enforcePlayAndRecord() -> Bool {
        do {
            let session = AVAudioSession.sharedInstance()
            try session.setCategory(.playAndRecord, mode: .default, options: [.defaultToSpeaker, .allowBluetooth, .allowBluetoothA2DP, .mixWithOthers])
            try session.setActive(true, options: .notifyOthersOnDeactivation)
            return true
        } catch {
            print("⚡ [AudioSessionPlugin Error]: \(error.localizedDescription)")
            return false
        }
    }

    deinit {
        NotificationCenter.default.removeObserver(self)
    }
}
