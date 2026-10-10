import UIKit
import Capacitor
import AVFoundation
import GoogleMobileAds
import StoreKit

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?
    public static var orientationLock: UIInterfaceOrientationMask = .all
    public static var currentAudioCategory: AVAudioSession.Category = .playback
    public static var currentAudioMode: AVAudioSession.Mode = .default

    func application(_ application: UIApplication, supportedInterfaceOrientationsFor window: UIWindow?) -> UIInterfaceOrientationMask {
        return AppDelegate.orientationLock
    }

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        // Do not register test devices; treat iPad as a live production device
        MobileAds.shared.requestConfiguration.testDeviceIdentifiers = []

        AppDelegate.enforceAudioSessionCategory()

        // Observe hardware route changes (USB-C interface connected/disconnected, headphones plugged)
        NotificationCenter.default.addObserver(
            forName: AVAudioSession.routeChangeNotification,
            object: nil,
            queue: .main
        ) { _ in
            print("⚡ [AppDelegate] Audio route change detected. Re-evaluating audio session...")
            AppDelegate.enforceAudioSessionCategory()
        }

        // Observe audio interruptions (Siri, phone calls, system alarms)
        NotificationCenter.default.addObserver(
            forName: AVAudioSession.interruptionNotification,
            object: nil,
            queue: .main
        ) { notif in
            if let typeValue = notif.userInfo?[AVAudioSessionInterruptionTypeKey] as? UInt,
               let type = AVAudioSession.InterruptionType(rawValue: typeValue),
               type == .ended {
                print("⚡ [AppDelegate] Audio interruption ended. Restoring audio session...")
                AppDelegate.enforceAudioSessionCategory()
            }
        }

        // Explicitly register custom plugins with the bridge as soon as the Capacitor view loads
        NotificationCenter.default.addObserver(forName: .capacitorViewDidAppear, object: nil, queue: .main) { [weak self] _ in
            if let bridgeVC = self?.window?.rootViewController as? CAPBridgeViewController,
               let bridge = bridgeVC.bridge {
                bridge.registerPluginInstance(NativeAudioExport())
                bridge.registerPluginInstance(AudioSessionPlugin())
            }
        }

        return true
    }

    public static func isModalOrAdPresented() -> Bool {
        let scenes = UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }
        let rootVC = scenes.flatMap({ $0.windows }).first(where: { $0.isKeyWindow })?.rootViewController
            ?? (UIApplication.shared.delegate as? AppDelegate)?.window?.rootViewController
        return rootVC?.presentedViewController != nil
    }

    func applicationWillEnterForeground(_ application: UIApplication) {
        if AppDelegate.isModalOrAdPresented() {
            print("⚡ [AppDelegate] Ad/Modal view controller presented. Skipping audio enforcement to preserve video playback.")
            return
        }
        AppDelegate.enforceAudioSessionCategory()
    }

    func applicationDidBecomeActive(_ application: UIApplication) {
        if AppDelegate.isModalOrAdPresented() {
            print("⚡ [AppDelegate] Ad/Modal view controller presented. Skipping audio enforcement to preserve video playback.")
            return
        }
        AppDelegate.enforceAudioSessionCategory()
    }

    public static func isExternalAudioPort(_ port: AVAudioSessionPortDescription) -> Bool {
        // Built-in mic and speaker are internal
        if port.portType == .builtInMic || port.portType == .builtInSpeaker {
            return false
        }
        // Bluetooth phone headset mic (HFP/LE) is banned from measurement
        if port.portType == .bluetoothHFP || port.portType == .bluetoothLE {
            return false
        }
        // Any other audio port (USB audio, line-in, headset mic, Thunderbolt/Lightning) is external
        return true
    }

    @discardableResult
    public static func enforceAudioSessionCategory(category: AVAudioSession.Category? = nil, mode: AVAudioSession.Mode? = nil) -> Bool {
        do {
            let session = AVAudioSession.sharedInstance()
            let availableInputs = session.availableInputs ?? []
            let usbInputPort = availableInputs.first(where: { AppDelegate.isExternalAudioPort($0) })
            let isIPad = (UIDevice.current.userInterfaceIdiom == .pad)

            let targetCategory = category ?? AppDelegate.currentAudioCategory
            let targetMode = mode ?? AppDelegate.currentAudioMode
            AppDelegate.currentAudioCategory = targetCategory
            AppDelegate.currentAudioMode = targetMode

            try session.setPreferredSampleRate(48000.0)
            try session.setPreferredIOBufferDuration(0.005)

            if targetCategory == .playback {
                // Pure playback mode (Pink Noise, Signal Generator, Ear Training)
                // In .playback mode, iOS always routes directly to external USB DAC (EVO 4) when connected!
                try session.setCategory(.playback, mode: .default, options: [.mixWithOthers])
                try session.overrideOutputAudioPort(.none)
            } else {
                // .playAndRecord mode (RTA spectrum measurement, Dual-channel Transfer Function)
                let isExternal = (usbInputPort != nil)
                var options: AVAudioSession.CategoryOptions = [.allowBluetoothA2DP, .mixWithOthers]
                if !isIPad && !isExternal {
                    options.insert(.defaultToSpeaker)
                }
                // Use .default mode for external USB audio to avoid measurement mode routing restrictions
                let activeMode: AVAudioSession.Mode = isExternal ? .default : targetMode
                try session.setCategory(.playAndRecord, mode: activeMode, options: options)

                if let usbPort = usbInputPort {
                    try session.setPreferredInput(usbPort)
                    if session.maximumInputNumberOfChannels >= 2 {
                        try? session.setPreferredInputNumberOfChannels(2)
                    }
                    if session.maximumOutputNumberOfChannels >= 2 {
                        try? session.setPreferredOutputNumberOfChannels(2)
                    }
                } else {
                    try? session.setPreferredInput(nil)
                }
                try session.overrideOutputAudioPort(.none)
            }

            try session.setActive(true, options: .notifyOthersOnDeactivation)

            let inNames = session.currentRoute.inputs.map { "\($0.portName) (\($0.portType.rawValue))" }.joined(separator: ", ")
            let outNames = session.currentRoute.outputs.map { "\($0.portName) (\($0.portType.rawValue))" }.joined(separator: ", ")
            print("⚡ [AppDelegate Audio Route] Cat: \(targetCategory.rawValue), In: [\(inNames.isEmpty ? "none" : inNames)], Out: [\(outNames.isEmpty ? "none" : outNames)]")
            return true
        } catch {
            print("⚡ [AudioSession Error]: \(error.localizedDescription)")
            return false
        }
    }

    func applicationWillTerminate(_ application: UIApplication) {
        // Called when the application is about to terminate. Save data if appropriate. See also applicationDidEnterBackground:.
    }

    func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
        // Called when the app was launched with a url. Feel free to add additional processing here,
        // but if you want the App API to support tracking app url opens, make sure to keep this call
        return ApplicationDelegateProxy.shared.application(app, open: url, options: options)
    }

    func application(_ application: UIApplication, continue userActivity: NSUserActivity, restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void) -> Bool {
        // Called when the app was launched with an activity, including Universal Links.
        // Feel free to add additional processing here, but if you want the App API to support
        // tracking app url opens, make sure to keep this call
        let proxy = ApplicationDelegateProxy.shared as AnyObject
        if let delegateProxy = proxy as? CAPApplicationDelegateProxyObjC {
            return delegateProxy.application(application, continue: userActivity, restorationHandler: restorationHandler)
        }
        return false
    }

}

@objc protocol CAPApplicationDelegateProxyObjC {
    @objc(application:continueUserActivity:restorationHandler:)
    func application(_ application: UIApplication, continue userActivity: NSUserActivity, restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void) -> Bool
}

// MARK: - Native Capacitor Plugins for iOS / iPad

@objc(NativeAudioExport)
public class NativeAudioExport: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "NativeAudioExport"
    public let jsName = "NativeAudioExport"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "saveWavToDownloads", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "shareWavFile", returnType: CAPPluginReturnPromise)
    ]

    @objc func saveWavToDownloads(_ call: CAPPluginCall) {
        shareWavFile(call)
    }

    @objc func shareWavFile(_ call: CAPPluginCall) {
        guard let base64Data = call.getString("base64Data"),
              let data = Data(base64Encoded: base64Data) else {
            call.reject("Invalid base64 audio data")
            return
        }
        let fileName = call.getString("fileName") ?? "soundengg-delay-alignment-click-48k.wav"
        let tempURL = FileManager.default.temporaryDirectory.appendingPathComponent(fileName)
        do {
            try? FileManager.default.removeItem(at: tempURL)
            try data.write(to: tempURL)
            DispatchQueue.main.async {
                let activityVC = UIActivityViewController(activityItems: [tempURL], applicationActivities: nil)
                
                var presenter: UIViewController? = self.bridge?.viewController
                if presenter == nil {
                    let scenes = UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }
                    let window = scenes.flatMap({ $0.windows }).first(where: { $0.isKeyWindow })
                    presenter = window?.rootViewController
                }
                while let next = presenter?.presentedViewController {
                    if next.isBeingDismissed { break }
                    presenter = next
                }

                // iPad Popover Anchor Configuration (required for iPad or presentation fails)
                if let popover = activityVC.popoverPresentationController {
                    let targetView = presenter?.view ?? self.webView
                    popover.sourceView = targetView
                    if let v = targetView {
                        popover.sourceRect = CGRect(x: v.bounds.midX, y: v.bounds.midY, width: 0, height: 0)
                        popover.permittedArrowDirections = []
                    }
                }

                if let presenter = presenter {
                    presenter.present(activityVC, animated: true) {
                        call.resolve(["success": true])
                    }
                } else {
                    call.reject("Unable to find presenting view controller")
                }
            }
        } catch {
            call.reject("Failed to write temporary WAV: \(error.localizedDescription)")
        }
    }
}

@objc(AudioSessionPlugin)
public class AudioSessionPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "AudioSessionPlugin"
    public let jsName = "AudioSessionPlugin"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "configureAudioSession", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "setPreferredInputDevice", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getAudioDeviceDetails", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "setScreenOrientation", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "setInputGain", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getInputGain", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "shareWavFile", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "saveWavToDownloads", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "requestAppReview", returnType: CAPPluginReturnPromise)
    ]

    @objc func configureAudioSession(_ call: CAPPluginCall) {
        let catParam = call.getString("category") ?? "playback"
        let modeParam = call.getString("mode") ?? "default"
        let targetCategory: AVAudioSession.Category = (catParam == "playAndRecord") ? .playAndRecord : .playback
        let targetMode: AVAudioSession.Mode = (modeParam == "measurement") ? .measurement : .default
        if AppDelegate.enforceAudioSessionCategory(category: targetCategory, mode: targetMode) {
            let session = AVAudioSession.sharedInstance()
            call.resolve([
                "success": true,
                "category": targetCategory.rawValue,
                "mode": targetMode.rawValue,
                "currentInput": session.currentRoute.inputs.first?.portName ?? "none",
                "currentOutput": session.currentRoute.outputs.first?.portName ?? "none"
            ])
        } else {
            call.reject("Failed to configure audio session")
        }
    }

    @objc func setPreferredInputDevice(_ call: CAPPluginCall) {
        let session = AVAudioSession.sharedInstance()
        let availableInputs = session.availableInputs ?? []
        let requestedName = (call.getString("deviceName") ?? "").lowercased()
        let requestedId = call.getString("deviceId") ?? ""
        let isPlaybackOnly = call.getBool("playbackOnly") ?? false

        do {
            if isPlaybackOnly {
                _ = AppDelegate.enforceAudioSessionCategory(category: .playback, mode: .default)
                let activeOutput = session.currentRoute.outputs.first
                call.resolve([
                    "success": true,
                    "category": "playback",
                    "currentOutput": activeOutput?.portName ?? "default",
                    "sampleRate": session.sampleRate
                ])
                return
            }

            var targetPort: AVAudioSessionPortDescription? = nil

            if !requestedName.isEmpty && !requestedName.contains("built-in") && !requestedName.contains("internal") {
                targetPort = availableInputs.first(where: {
                    let portName = $0.portName.lowercased()
                    return portName.contains(requestedName) || requestedName.contains(portName)
                })
            }

            if targetPort == nil && !requestedId.isEmpty && requestedId != "default" {
                targetPort = availableInputs.first(where: { $0.uid == requestedId })
            }

            let externalPort = availableInputs.first(where: { AppDelegate.isExternalAudioPort($0) })
            if targetPort == nil {
                if requestedName.contains("built-in") || requestedName.contains("internal") || requestedName.contains("ipad") || requestedName.contains("iphone") {
                    targetPort = availableInputs.first(where: { $0.portType == .builtInMic })
                } else {
                    targetPort = externalPort ?? availableInputs.first(where: { $0.portType == .builtInMic })
                }
            }

            guard let portToSet = targetPort else {
                call.reject("No audio input port found")
                return
            }

            let isExternal = AppDelegate.isExternalAudioPort(portToSet)
            let isIPad = (UIDevice.current.userInterfaceIdiom == .pad)

            var options: AVAudioSession.CategoryOptions = [.allowBluetoothA2DP, .mixWithOthers]
            if !isIPad && !isExternal {
                options.insert(.defaultToSpeaker)
            }

            // On external USB audio devices (EVO 4), use .default mode so CoreAudio won't restrict routing or stereo channels
            let targetMode: AVAudioSession.Mode = isExternal ? .default : .measurement
            try session.setCategory(.playAndRecord, mode: targetMode, options: options)
            try session.setPreferredSampleRate(48000.0)
            try session.setPreferredIOBufferDuration(0.005)

            if isExternal {
                try session.setPreferredInput(portToSet)
                if session.maximumInputNumberOfChannels >= 2 {
                    try? session.setPreferredInputNumberOfChannels(2)
                }
                if session.maximumOutputNumberOfChannels >= 2 {
                    try? session.setPreferredOutputNumberOfChannels(2)
                }
            } else {
                try? session.setPreferredInput(nil)
            }

            // Clearing output override forces audio output to USB interface DAC (or headphones)
            try session.overrideOutputAudioPort(.none)
            try session.setActive(true, options: .notifyOthersOnDeactivation)

            let activeInput = session.currentRoute.inputs.first
            let activeOutput = session.currentRoute.outputs.first

            print("⚡ [AudioSessionPlugin] Locked preferred input to: \(portToSet.portName). Route in: \(activeInput?.portName ?? "none"), route out: \(activeOutput?.portName ?? "none")")

            call.resolve([
                "success": true,
                "portName": portToSet.portName,
                "portType": portToSet.portType.rawValue,
                "isExternal": isExternal,
                "currentInput": activeInput?.portName ?? "none",
                "currentOutput": activeOutput?.portName ?? "default",
                "sampleRate": session.sampleRate
            ])
        } catch {
            print("⚡ [AudioSessionPlugin Error] setPreferredInputDevice failed: \(error.localizedDescription)")
            call.reject("Failed to set preferred input: \(error.localizedDescription)")
        }
    }

    @objc func setInputGain(_ call: CAPPluginCall) {
        guard let gain = call.getFloat("gain") else {
            call.reject("Must provide gain value between 0.0 and 1.0")
            return
        }
        let session = AVAudioSession.sharedInstance()
        if session.isInputGainSettable {
            do {
                try session.setInputGain(max(0.0, min(1.0, gain)))
                call.resolve(["success": true, "gain": session.inputGain])
            } catch {
                call.reject("Failed to set hardware input gain: \(error.localizedDescription)")
            }
        } else {
            call.resolve(["success": false, "reason": "Hardware input gain not settable on this iOS hardware, fallback to WebAudio digital trim."])
        }
    }

    @objc func getInputGain(_ call: CAPPluginCall) {
        let session = AVAudioSession.sharedInstance()
        call.resolve([
            "isInputGainSettable": session.isInputGainSettable,
            "gain": session.isInputGainSettable ? session.inputGain : 1.0
        ])
    }

    @objc func getAudioDeviceDetails(_ call: CAPPluginCall) {
        let session = AVAudioSession.sharedInstance()
        var inputsList: [[String: Any]] = []
        var maxInputChannels = 1
        var currentDeviceName = "Internal Microphone"
        var isUsbDevice = false

        let availableInputs = session.availableInputs ?? []
        for port in availableInputs {
            let isExt = AppDelegate.isExternalAudioPort(port)
            if isExt {
                isUsbDevice = true
                currentDeviceName = port.portName
            }
            let channels = port.channels?.count ?? 1
            if channels > maxInputChannels {
                maxInputChannels = channels
            }
            inputsList.append([
                "name": port.portName,
                "type": port.portType.rawValue,
                "channels": channels,
                "uid": port.uid,
                "isExternal": isExt
            ])
        }

        let currentInputs = session.currentRoute.inputs
        let currentOutputs = session.currentRoute.outputs
        var outputsList: [[String: Any]] = []
        for output in currentOutputs {
            outputsList.append([
                "name": output.portName,
                "type": output.portType.rawValue,
                "channels": output.channels?.count ?? 2,
                "uid": output.uid
            ])
        }

        call.resolve([
            "success": true,
            "isUsbDevice": isUsbDevice,
            "deviceName": currentInputs.first?.portName ?? currentDeviceName,
            "maxInputChannels": maxInputChannels,
            "sampleRate": session.sampleRate,
            "inputs": inputsList,
            "outputs": outputsList,
            "currentInput": currentInputs.first?.portName ?? "None",
            "currentOutput": currentOutputs.first?.portName ?? "Default Output"
        ])
    }

    @objc func setScreenOrientation(_ call: CAPPluginCall) {
        let orientation = (call.getString("orientation") ?? "unspecified").lowercased()
        DispatchQueue.main.async {
            let targetMask: UIInterfaceOrientationMask
            let legacyOrientation: UIInterfaceOrientation
            if orientation == "landscape" {
                targetMask = .landscape
                legacyOrientation = .landscapeRight
            } else if orientation == "portrait" {
                targetMask = .portrait
                legacyOrientation = .portrait
            } else {
                targetMask = .all
                legacyOrientation = .portrait
            }

            AppDelegate.orientationLock = targetMask

            if #available(iOS 16.0, *) {
                let scenes = UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }
                for scene in scenes {
                    let prefs = UIWindowScene.GeometryPreferences.iOS(interfaceOrientations: targetMask)
                    scene.requestGeometryUpdate(prefs) { error in
                        print("⚡ [Orientation Update]: \(error.localizedDescription)")
                    }
                    for window in scene.windows {
                        window.rootViewController?.setNeedsUpdateOfSupportedInterfaceOrientations()
                    }
                }
                self.bridge?.viewController?.setNeedsUpdateOfSupportedInterfaceOrientations()
            } else {
                if orientation == "landscape" || orientation == "portrait" {
                    UIDevice.current.setValue(legacyOrientation.rawValue, forKey: "orientation")
                }
                UIViewController.attemptRotationToDeviceOrientation()
            }

            call.resolve(["success": true, "orientation": orientation])
        }
    }

    @objc func saveWavToDownloads(_ call: CAPPluginCall) {
        shareWavFile(call)
    }

    @objc func shareWavFile(_ call: CAPPluginCall) {
        guard let base64Data = call.getString("base64Data"),
              let data = Data(base64Encoded: base64Data) else {
            call.reject("Invalid base64 audio data")
            return
        }
        let fileName = call.getString("fileName") ?? "soundengg-delay-alignment-click-48k.wav"
        let tempURL = FileManager.default.temporaryDirectory.appendingPathComponent(fileName)
        do {
            try? FileManager.default.removeItem(at: tempURL)
            try data.write(to: tempURL)
            DispatchQueue.main.async {
                let activityVC = UIActivityViewController(activityItems: [tempURL], applicationActivities: nil)
                
                var presenter: UIViewController? = self.bridge?.viewController
                if presenter == nil {
                    let scenes = UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }
                    let window = scenes.flatMap({ $0.windows }).first(where: { $0.isKeyWindow })
                    presenter = window?.rootViewController
                }
                while let next = presenter?.presentedViewController {
                    if next.isBeingDismissed { break }
                    presenter = next
                }

                // iPad Popover Anchor Configuration (required for iPad or presentation fails)
                if let popover = activityVC.popoverPresentationController {
                    let targetView = presenter?.view ?? self.webView
                    popover.sourceView = targetView
                    if let v = targetView {
                        popover.sourceRect = CGRect(x: v.bounds.midX, y: v.bounds.midY, width: 0, height: 0)
                        popover.permittedArrowDirections = []
                    }
                }

                if let presenter = presenter {
                    presenter.present(activityVC, animated: true) {
                        call.resolve(["success": true])
                    }
                } else {
                    call.reject("Unable to find presenting view controller")
                }
            }
        } catch {
            call.reject("Failed to write temporary WAV: \(error.localizedDescription)")
        }
    }

    @objc func requestAppReview(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            if let scene = UIApplication.shared.connectedScenes
                .first(where: { $0.activationState == .foregroundActive }) as? UIWindowScene {
                SKStoreReviewController.requestReview(in: scene)
                call.resolve(["success": true])
            } else if let window = UIApplication.shared.windows.first(where: { $0.isKeyWindow }),
                      let scene = window.windowScene {
                SKStoreReviewController.requestReview(in: scene)
                call.resolve(["success": true])
            } else {
                call.reject("No active window scene available for review")
            }
        }
    }
}
