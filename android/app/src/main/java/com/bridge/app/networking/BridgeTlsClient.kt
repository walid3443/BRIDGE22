package com.bridge.app.networking

import com.bridge.app.core.BridgeEnvelope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.BufferedReader
import java.io.BufferedWriter
import java.io.InputStreamReader
import java.io.OutputStreamWriter
import java.net.InetSocketAddress
import java.security.MessageDigest
import java.security.cert.X509Certificate
import javax.net.ssl.SSLContext
import javax.net.ssl.SSLSocket
import javax.net.ssl.TrustManager
import javax.net.ssl.X509TrustManager

/**
 * TLS socket client that pins the Windows peer's SHA-256 certificate fingerprint obtained during QR/code pairing.
 */
class BridgeTlsClient(private val expectedCertSha256: String) {
    private var socket: SSLSocket? = null
    private var writer: BufferedWriter? = null

    suspend fun connect(host: String, port: Int, onMessage: (BridgeEnvelope) -> Unit) = withContext(Dispatchers.IO) {
        val pinningTrustManager = object : X509TrustManager {
            override fun checkClientTrusted(chain: Array<X509Certificate>, authType: String) {}
            override fun checkServerTrusted(chain: Array<X509Certificate>, authType: String) {
                val leaf = chain.firstOrNull() ?: throw SecurityException("Missing server certificate")
                val actual = MessageDigest.getInstance("SHA-256")
                    .digest(leaf.encoded)
                    .joinToString("") { "%02X".format(it) }
                if (!actual.equals(expectedCertSha256, ignoreCase = true)) {
                    throw SecurityException("Pinned certificate mismatch")
                }
            }
            override fun getAcceptedIssuers(): Array<X509Certificate> = emptyArray()
        }

        val sslContext = SSLContext.getInstance("TLS")
        sslContext.init(null, arrayOf<TrustManager>(pinningTrustManager), null)
        val sslSocket = sslContext.socketFactory.createSocket() as SSLSocket
        sslSocket.connect(InetSocketAddress(host, port), 5000)
        sslSocket.startHandshake()

        socket = sslSocket
        writer = BufferedWriter(OutputStreamWriter(sslSocket.outputStream, Charsets.UTF_8))

        val reader = BufferedReader(InputStreamReader(sslSocket.inputStream, Charsets.UTF_8))
        while (true) {
            val line = reader.readLine() ?: break
            BridgeEnvelope.parseAndValidate(line)?.let(onMessage)
        }
    }

    suspend fun send(envelope: BridgeEnvelope) = withContext(Dispatchers.IO) {
        val out = writer ?: return@withContext
        out.write(envelope.toJsonString())
        out.newLine()
        out.flush()
    }

    fun emergencyDisconnect() {
        runCatching { socket?.close() }
        socket = null
        writer = null
    }
}
