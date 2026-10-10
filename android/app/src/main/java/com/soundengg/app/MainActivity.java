package com.soundengg.app;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        setTheme(R.style.AppTheme_NoActionBar);
        registerPlugin(NativeAudioExportPlugin.class);
        registerPlugin(AudioSessionPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
