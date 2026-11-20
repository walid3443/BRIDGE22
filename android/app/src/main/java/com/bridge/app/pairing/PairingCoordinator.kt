package com.bridge.app.pairing

import android.net.Uri

data class ParsedQrPairing(
    val host: String,
    val port: Int,
    val deviceId: String,
    val fingerprint: String,
    val code: String
)

enum class PairingTrustState {
    UNPAIRED,
    PENDING_CONFIRMATION,
    PAIRED,
    REVOKED
}

object PairingCoordinator {
    fun parseQrUri(rawUri: String): ParsedQrPairing? {
        val uri = Uri.parse(rawUri)
        if (uri.scheme != "bridge" || uri.host != "pair") return null

        val host = uri.getQueryParameter("host")?.takeIf { it.isNotBlank() } ?: return null
        val port = uri.getQueryParameter("port")?.toIntOrNull()?.takeIf { it in 1024..65535 } ?: return null
        val deviceId = uri.getQueryParameter("deviceId")?.takeIf { it.length >= 4 } ?: return null
        val fp = uri.getQueryParameter("fp")?.takeIf { it.length >= 16 } ?: return null
        val code = uri.getQueryParameter("code")?.takeIf { it.matches(Regex("^\\d{6}$")) } ?: return null

        return ParsedQrPairing(host, port, deviceId, fp, code)
    }
}
