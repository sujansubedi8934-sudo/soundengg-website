package com.soundengg.app;

import android.content.ContentValues;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.provider.MediaStore;
import android.util.Base64;
import android.widget.Toast;
import androidx.core.content.FileProvider;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.File;
import java.io.FileOutputStream;
import java.io.OutputStream;

@CapacitorPlugin(name = "NativeAudioExport")
public class NativeAudioExportPlugin extends Plugin {

    @PluginMethod
    public void saveWavToDownloads(PluginCall call) {
        String base64Data = call.getString("base64Data");
        String fileName = call.getString("fileName", "soundengg-delay-alignment-click-48k.wav");
        String mimeType = call.getString("mimeType", "audio/wav");

        if (base64Data == null || base64Data.isEmpty()) {
            call.reject("base64Data is required");
            return;
        }

        try {
            byte[] bytes = Base64.decode(base64Data, Base64.DEFAULT);

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                ContentValues values = new ContentValues();
                values.put(MediaStore.Downloads.DISPLAY_NAME, fileName);
                values.put(MediaStore.Downloads.MIME_TYPE, mimeType);
                values.put(MediaStore.Downloads.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS + "/SoundEngg");

                Uri uri = getContext().getContentResolver().insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, values);
                if (uri == null) {
                    call.reject("Failed to create MediaStore entry");
                    return;
                }

                try (OutputStream out = getContext().getContentResolver().openOutputStream(uri)) {
                    if (out != null) {
                        out.write(bytes);
                        out.flush();
                    }
                }

                getActivity().runOnUiThread(() -> {
                    Toast.makeText(getContext(), "✓ Saved to Downloads/SoundEngg/" + fileName, Toast.LENGTH_LONG).show();
                });

                JSObject ret = new JSObject();
                ret.put("success", true);
                ret.put("path", "Downloads/SoundEngg/" + fileName);
                ret.put("uri", uri.toString());
                call.resolve(ret);
            } else {
                File downloadsDir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS);
                File soundEnggDir = new File(downloadsDir, "SoundEngg");
                if (!soundEnggDir.exists()) {
                    soundEnggDir.mkdirs();
                }
                File targetFile = new File(soundEnggDir, fileName);
                try (FileOutputStream fos = new FileOutputStream(targetFile)) {
                    fos.write(bytes);
                    fos.flush();
                }

                getActivity().runOnUiThread(() -> {
                    Toast.makeText(getContext(), "✓ Saved to Downloads: " + fileName, Toast.LENGTH_LONG).show();
                });

                JSObject ret = new JSObject();
                ret.put("success", true);
                ret.put("path", targetFile.getAbsolutePath());
                ret.put("uri", Uri.fromFile(targetFile).toString());
                call.resolve(ret);
            }
        } catch (Exception e) {
            call.reject("Error saving file to Downloads: " + e.getMessage(), e);
        }
    }

    @PluginMethod
    public void shareWavFile(PluginCall call) {
        String base64Data = call.getString("base64Data");
        String fileName = call.getString("fileName", "soundengg-delay-alignment-click-48k.wav");
        String title = call.getString("title", "SoundEngg Export");
        String mimeType = call.getString("mimeType", "audio/wav");
        String text = call.getString("text", "SoundEngg Acoustic Measurement Export");

        // Plain-text report share when no binary file is attached
        if (base64Data == null || base64Data.isEmpty()) {
            if (text != null && !text.isEmpty()) {
                try {
                    Intent shareIntent = new Intent(Intent.ACTION_SEND);
                    shareIntent.setType("text/plain");
                    shareIntent.putExtra(Intent.EXTRA_SUBJECT, title);
                    shareIntent.putExtra(Intent.EXTRA_TEXT, text);

                    Intent chooser = Intent.createChooser(shareIntent, title);
                    chooser.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    getContext().startActivity(chooser);

                    JSObject ret = new JSObject();
                    ret.put("success", true);
                    call.resolve(ret);
                    return;
                } catch (Exception e) {
                    call.reject("Error sharing text report: " + e.getMessage(), e);
                    return;
                }
            }
            call.reject("base64Data or text is required");
            return;
        }

        try {
            byte[] bytes = Base64.decode(base64Data, Base64.DEFAULT);

            File cacheDir = new File(getContext().getCacheDir(), "shared_audio");
            if (!cacheDir.exists()) {
                cacheDir.mkdirs();
            }
            File file = new File(cacheDir, fileName);
            try (FileOutputStream fos = new FileOutputStream(file)) {
                fos.write(bytes);
                fos.flush();
            }

            String authority = getContext().getPackageName() + ".fileprovider";
            Uri contentUri = FileProvider.getUriForFile(getContext(), authority, file);

            Intent shareIntent = new Intent(Intent.ACTION_SEND);
            shareIntent.setType(mimeType);
            shareIntent.putExtra(Intent.EXTRA_STREAM, contentUri);
            shareIntent.putExtra(Intent.EXTRA_SUBJECT, title);
            shareIntent.putExtra(Intent.EXTRA_TEXT, text);
            shareIntent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);

            Intent chooser = Intent.createChooser(shareIntent, title);
            chooser.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(chooser);

            JSObject ret = new JSObject();
            ret.put("success", true);
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("Error sharing file: " + e.getMessage(), e);
        }
    }
}
