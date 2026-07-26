import UIKit
import Capacitor
import WebKit
import AVFoundation

class CustomBridgeViewController: CAPBridgeViewController {

    override func viewDidLoad() {
        super.viewDidLoad()
        enforceAudioSession()
    }

    override func viewWillAppear(_ animated: Bool) {
        super.viewWillAppear(animated)
        enforceAudioSession()
    }

    private func enforceAudioSession() {
        do {
            let session = AVAudioSession.sharedInstance()
            try session.setCategory(.playAndRecord, mode: .default, options: [.defaultToSpeaker, .allowBluetooth, .allowBluetoothA2DP])
            try session.setActive(true)
            print("⚡ [CustomBridgeViewController] Enforced AVAudioSession to .playAndRecord")
        } catch {
            print("⚡ [CustomBridgeViewController Error]: \(error.localizedDescription)")
        }
    }

    @available(iOS 15.0, *)
    override func webView(_ webView: WKWebView, requestMediaCapturePermissionFor origin: WKSecurityOrigin, initiatedByFrame frame: WKFrameInfo, type: WKMediaCaptureType, decisionHandler: @escaping (WKPermissionDecision) -> Void) {
        print("⚡ [CustomBridgeViewController] Intercepted requestMediaCapturePermissionFor: \(type)")
        enforceAudioSession()
        decisionHandler(.grant)
    }
}
