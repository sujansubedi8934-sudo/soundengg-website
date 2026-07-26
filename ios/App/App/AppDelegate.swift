import UIKit
import Capacitor
import AVFoundation
import GoogleMobileAds

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?

    private var audioSessionObservation: NSKeyValueObservation?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        // Explicitly instruct Google Mobile Ads SDK not to overwrite our app's AVAudioSession category!
        MobileAds.shared.audioVideoManager.isAudioSessionApplicationManaged = true
        startAudioSessionMonitoring()
        enforceAudioSessionCategory()
        return true
    }

    func applicationWillEnterForeground(_ application: UIApplication) {
        enforceAudioSessionCategory()
    }

    func applicationDidBecomeActive(_ application: UIApplication) {
        enforceAudioSessionCategory()
    }

    private func startAudioSessionMonitoring() {
        let session = AVAudioSession.sharedInstance()
        audioSessionObservation = session.observe(\.category, options: [.initial, .new]) { session, change in
            if session.category != .playAndRecord {
                print("⚡ [AudioSessionGuard] Detected category change to \(session.category). Restoring .playAndRecord asynchronously...")
                DispatchQueue.main.async {
                    do {
                        let currentSession = AVAudioSession.sharedInstance()
                        if currentSession.category != .playAndRecord {
                            try currentSession.setCategory(.playAndRecord, mode: .default, options: [.defaultToSpeaker, .allowBluetooth, .allowBluetoothA2DP])
                            try currentSession.setActive(true)
                        }
                    } catch {
                        print("⚡ [AudioSessionGuard Error]: \(error.localizedDescription)")
                    }
                }
            }
        }
    }

    private func enforceAudioSessionCategory() {
        do {
            let session = AVAudioSession.sharedInstance()
            try session.setCategory(.playAndRecord, mode: .default, options: [.defaultToSpeaker, .allowBluetooth, .allowBluetoothA2DP, .mixWithOthers])
            try session.setActive(true, options: .notifyOthersOnDeactivation)
        } catch {
            print("Failed to set audio session category: \(error)")
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
