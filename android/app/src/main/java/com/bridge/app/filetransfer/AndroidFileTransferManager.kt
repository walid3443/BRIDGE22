package com.bridge.app.filetransfer

import android.content.ContentResolver
import android.net.Uri
import java.security.MessageDigest

object AndroidFileTransferUtils {
    private val reservedNames = setOf(
        "CON", "PRN", "AUX", "NUL",
        "COM1", "COM2", "COM3", "COM4", "COM5", "COM6", "COM7", "COM8", "COM9",
        "LPT1", "LPT2", "LPT3", "LPT4", "LPT5", "LPT6", "LPT7", "LPT8", "LPT9"
    )

    fun isSafeFilename(name: String): Boolean {
        if (name.isBlank() || name.length > 255) return false
        if (name.contains('/') || name.contains('\\') || name.contains("..") || name.contains('\u0000')) return false
        val stem = name.substringBefore('.').uppercase()
        return stem !in reservedNames
    }

    fun computeSha256(resolver: ContentResolver, uri: Uri): String? {
        val digest = MessageDigest.getInstance("SHA-256")
        resolver.openInputStream(uri)?.use { stream ->
            val buffer = ByteArray(65536)
            while (true) {
                val read = stream.read(buffer)
                if (read <= 0) break
                digest.update(buffer, 0, read)
            }
            return digest.digest().joinToString("") { "%02x".format(it) }
        }
        return null
    }
}
