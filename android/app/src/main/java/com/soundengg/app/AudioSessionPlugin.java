package com.soundengg.app;

import android.app.Activity;
import android.content.Context;
import android.content.pm.ActivityInfo;
import android.media.AudioDeviceInfo;
import android.media.AudioManager;
import android.os.Build;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.google.android.play.core.review.ReviewInfo;
import com.google.android.play.core.review.ReviewManager;
import com.google.android.play.core.review.ReviewManagerFactory;
import com.google.android.gms.tasks.Task;

@CapacitorPlugin(name = "AudioSessionPlugin")
public class AudioSessionPlugin extends Plugin {

    @PluginMethod
    public void configureAudioSession(PluginCall call) {
        try {
            AudioManager audioManager = (AudioManager) getContext().getSystemService(Context.AUDIO_SERVICE);
            if (audioManager != null) {
                // Set to MODE_NORMAL to disable voice telephony AEC / AGC / Noise Suppression
                audioManager.setMode(AudioManager.MODE_NORMAL);
                try {
                    if (audioManager.isBluetoothScoOn()) {
                        audioManager.setBluetoothScoOn(false);
                        audioManager.stopBluetoothSco();
                    }
                } catch (Exception ignored) {}

                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                    AudioDeviceInfo[] devices = audioManager.getDevices(AudioManager.GET_DEVICES_INPUTS);
                    for (AudioDeviceInfo device : devices) {
                        int type = device.getType();
                        if (type == AudioDeviceInfo.TYPE_USB_DEVICE || type == AudioDeviceInfo.TYPE_USB_HEADSET) {
                            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                                audioManager.setCommunicationDevice(device);
                            }
                            break;
                        }
                    }
                }
            }
            JSObject res = new JSObject();
            res.put("success", true);
            call.resolve(res);
        } catch (Exception e) {
            call.reject("Failed to configure Android audio session: " + e.getMessage(), e);
        }
    }

    @PluginMethod
    public void setPreferredInputDevice(PluginCall call) {
        try {
            String reqName = call.getString("deviceName", "").toLowerCase();
            String reqId = call.getString("deviceId", "");
            AudioManager audioManager = (AudioManager) getContext().getSystemService(Context.AUDIO_SERVICE);
            boolean matched = false;

            if (audioManager != null && Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                audioManager.setMode(AudioManager.MODE_NORMAL);
                AudioDeviceInfo[] devices = audioManager.getDevices(AudioManager.GET_DEVICES_INPUTS);
                AudioDeviceInfo targetDevice = null;

                for (AudioDeviceInfo dev : devices) {
                    CharSequence name = dev.getProductName();
                    String nameStr = (name != null) ? name.toString().toLowerCase() : "";
                    int devId = dev.getId();

                    if (!reqName.isEmpty() && (nameStr.contains(reqName) || reqName.contains(nameStr))) {
                        targetDevice = dev;
                        break;
                    }
                    if (!reqId.isEmpty() && String.valueOf(devId).equals(reqId)) {
                        targetDevice = dev;
                        break;
                    }
                }

                // Fallback: If requested USB or external, find any USB device
                if (targetDevice == null && (reqName.contains("usb") || reqName.contains("evo") || reqName.contains("audient") || reqName.contains("scarlett"))) {
                    for (AudioDeviceInfo dev : devices) {
                        int type = dev.getType();
                        if (type == AudioDeviceInfo.TYPE_USB_DEVICE || type == AudioDeviceInfo.TYPE_USB_HEADSET) {
                            targetDevice = dev;
                            break;
                        }
                    }
                }

                if (targetDevice != null) {
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                        audioManager.setCommunicationDevice(targetDevice);
                    }
                    matched = true;
                }
            }

            JSObject res = new JSObject();
            res.put("success", true);
            res.put("matched", matched);
            call.resolve(res);
        } catch (Exception e) {
            call.reject("Failed to set preferred Android audio device: " + e.getMessage(), e);
        }
    }

    @PluginMethod
    public void getAudioDeviceDetails(PluginCall call) {
        try {
            AudioManager audioManager = (AudioManager) getContext().getSystemService(Context.AUDIO_SERVICE);
            JSArray inputsList = new JSArray();
            boolean isUsbDevice = false;
            String currentDeviceName = "Internal Microphone";
            int maxInputChannels = 1;
            int defaultSampleRate = 48000;

            if (audioManager != null && Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                AudioDeviceInfo[] devices = audioManager.getDevices(AudioManager.GET_DEVICES_INPUTS);
                for (AudioDeviceInfo device : devices) {
                    JSObject devObj = new JSObject();
                    CharSequence name = device.getProductName();
                    int type = device.getType();
                    String typeStr = "unknown";
                    if (type == AudioDeviceInfo.TYPE_BUILTIN_MIC) typeStr = "builtin_mic";
                    else if (type == AudioDeviceInfo.TYPE_USB_DEVICE) typeStr = "usb_audio";
                    else if (type == AudioDeviceInfo.TYPE_USB_HEADSET) typeStr = "usb_headset";
                    else if (type == AudioDeviceInfo.TYPE_WIRED_HEADSET) typeStr = "wired_headset";
                    else if (type == AudioDeviceInfo.TYPE_BLUETOOTH_SCO) typeStr = "bluetooth_sco";

                    int channels = 1;
                    int[] channelCounts = device.getChannelCounts();
                    if (channelCounts != null && channelCounts.length > 0) {
                        for (int c : channelCounts) {
                            if (c > channels) channels = c;
                        }
                    }

                    if (type == AudioDeviceInfo.TYPE_USB_DEVICE || type == AudioDeviceInfo.TYPE_USB_HEADSET) {
                        isUsbDevice = true;
                        currentDeviceName = (name != null && name.length() > 0) ? name.toString() : "USB Audio Interface";
                        if (channels < 2) channels = 2; // Standard 2-channel UAC default
                    }

                    if (channels > maxInputChannels) {
                        maxInputChannels = channels;
                    }

                    devObj.put("name", name != null ? name.toString() : "Audio Input");
                    devObj.put("type", typeStr);
                    devObj.put("channels", channels);
                    devObj.put("id", device.getId());
                    inputsList.put(devObj);
                }
            }

            JSObject res = new JSObject();
            res.put("success", true);
            res.put("isUsbDevice", isUsbDevice);
            res.put("deviceName", currentDeviceName);
            res.put("maxInputChannels", maxInputChannels);
            res.put("sampleRate", defaultSampleRate);
            res.put("inputs", inputsList);
            call.resolve(res);
        } catch (Exception e) {
            call.reject("Failed to query Android audio devices: " + e.getMessage(), e);
        }
    }

    @PluginMethod
    public void requestAppReview(PluginCall call) {
        Activity activity = getActivity();
        if (activity == null || activity.isFinishing()) {
            call.reject("Activity is not available to display in-app review");
            return;
        }

        try {
            ReviewManager manager = ReviewManagerFactory.create(getContext());
            Task<ReviewInfo> request = manager.requestReviewFlow();
            request.addOnCompleteListener(task -> {
                if (task.isSuccessful() && task.getResult() != null) {
                    ReviewInfo reviewInfo = task.getResult();
                    Activity currentActivity = getActivity();
                    if (currentActivity != null && !currentActivity.isFinishing()) {
                        Task<Void> flow = manager.launchReviewFlow(currentActivity, reviewInfo);
                        flow.addOnCompleteListener(flowTask -> {
                            // The flow has finished. Note that Google Play does not disclose
                            // whether the user reviewed or if quota suppressed the dialog.
                            JSObject ret = new JSObject();
                            ret.put("success", true);
                            call.resolve(ret);
                        });
                    } else {
                        call.reject("Activity was dismissed before review launch");
                    }
                } else {
                    Exception exp = task.getException();
                    call.reject("Failed to request in-app review: " + (exp != null ? exp.getMessage() : "unknown"));
                }
            });
        } catch (Exception e) {
            call.reject("Error launching in-app review: " + e.getMessage(), e);
        }
    }

    @PluginMethod
    public void setScreenOrientation(PluginCall call) {
        String orientation = call.getString("orientation", "unspecified");
        Activity activity = getActivity();
        if (activity == null || activity.isFinishing()) {
            call.reject("Activity is not available");
            return;
        }
        activity.runOnUiThread(() -> {
            try {
                if ("landscape".equalsIgnoreCase(orientation)) {
                    activity.setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_SENSOR_LANDSCAPE);
                } else if ("portrait".equalsIgnoreCase(orientation)) {
                    activity.setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_PORTRAIT);
                } else {
                    activity.setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED);
                }
                JSObject res = new JSObject();
                res.put("success", true);
                res.put("orientation", orientation);
                call.resolve(res);
            } catch (Exception e) {
                call.reject("Failed to set screen orientation: " + e.getMessage(), e);
            }
        });
    }

    @PluginMethod
    public void setInputGain(PluginCall call) {
        JSObject res = new JSObject();
        res.put("success", true);
        call.resolve(res);
    }

    @PluginMethod
    public void getInputGain(PluginCall call) {
        JSObject res = new JSObject();
        res.put("success", true);
        res.put("gain", 1.0);
        res.put("isInputGainSettable", false);
        call.resolve(res);
    }
}
