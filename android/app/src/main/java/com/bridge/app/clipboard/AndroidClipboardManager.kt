package com.bridge.app.clipboard

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context

/**
 * Respects Android 10+ background clipboard restrictions by reading/writing clipboard
 * only during explicit foreground actions or user-triggered synchronization.
 */
class AndroidClipboardManager(context: Context) {
    private val clipboard = context.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager

    fun readCurrentText(): String? {
        val clip = clipboard.primaryClip ?: return null
        if (clip.itemCount == 0) return null
        return clip.getItemAt(0).coerceToText(null)?.toString()
    }

    fun writeText(text: String) {
        clipboard.setPrimaryClip(ClipData.newPlainText("BRIDGE Clipboard", text))
    }
}
