package com.stalk.screenshot

import android.app.Activity
import android.view.WindowManager
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class ScreenshotModule(private val reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "ScreenshotModule"

    @ReactMethod
    fun allowScreenshots(screened: Boolean) {
        val activity = currentActivity ?: return
        val flags = WindowManager.LayoutParams.FLAG_SECURE
        activity.runOnUiThread {
            if (!screened) {
                activity.window.setFlags(flags, flags)
            } else {
                activity.window.clearFlags(flags)
            }
        }
    }
}