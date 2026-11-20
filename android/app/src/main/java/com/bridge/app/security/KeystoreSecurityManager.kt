package com.bridge.app.security

import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyProperties
import java.security.KeyPairGenerator
import java.security.KeyStore
import java.security.MessageDigest
import java.util.concurrent.ConcurrentHashMap
import javax.crypto.Cipher
import javax.crypto.KeyGenerator
import javax.crypto.SecretKey
import javax.crypto.spec.GCMParameterSpec

class KeystoreSecurityManager {
    private val keyStore = KeyStore.getInstance("AndroidKeyStore").apply { load(null) }

    fun ensureDeviceSigningKey(alias: String = "bridge_device_identity") {
        if (keyStore.containsAlias(alias)) return
        val generator = KeyPairGenerator.getInstance(KeyProperties.KEY_ALGORITHM_EC, "AndroidKeyStore")
        val spec = KeyGenParameterSpec.Builder(
            alias,
            KeyProperties.PURPOSE_SIGN or KeyProperties.PURPOSE_VERIFY
        )
            .setDigests(KeyProperties.DIGEST_SHA256)
            .build()
        generator.initialize(spec)
        generator.generateKeyPair()
    }

    fun getPublicKeyFingerprint(alias: String = "bridge_device_identity"): String {
        ensureDeviceSigningKey(alias)
        val cert = keyStore.getCertificate(alias)
        val digest = MessageDigest.getInstance("SHA-256").digest(cert.encoded)
        return digest.joinToString("") { "%02X".format(it) }
    }

    fun encryptLocalSecret(alias: String, plaintext: ByteArray): Pair<ByteArray, ByteArray> {
        val key = getOrCreateAesKey(alias)
        val cipher = Cipher.getInstance("AES/GCM/NoPadding")
        cipher.init(Cipher.ENCRYPT_MODE, key)
        return cipher.iv to cipher.doFinal(plaintext)
    }

    fun decryptLocalSecret(alias: String, iv: ByteArray, ciphertext: ByteArray): ByteArray {
        val key = getOrCreateAesKey(alias)
        val cipher = Cipher.getInstance("AES/GCM/NoPadding")
        cipher.init(Cipher.DECRYPT_MODE, key, GCMParameterSpec(128, iv))
        return cipher.doFinal(ciphertext)
    }

    private fun getOrCreateAesKey(alias: String): SecretKey {
        if (keyStore.containsAlias(alias)) {
            return (keyStore.getEntry(alias, null) as KeyStore.SecretKeyEntry).secretKey
        }
        val keyGen = KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, "AndroidKeyStore")
        keyGen.init(
            KeyGenParameterSpec.Builder(
                alias,
                KeyProperties.PURPOSE_ENCRYPT or KeyProperties.PURPOSE_DECRYPT
            )
                .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
                .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
                .setKeySize(256)
                .build()
        )
        return keyGen.generateKey()
    }
}

class AndroidReplayGuard(private val windowMs: Long = 60_000L) {
    private val seen = ConcurrentHashMap<String, Long>()

    fun accept(messageId: String, timestampMs: Long, nowMs: Long = System.currentTimeMillis()): Boolean {
        seen.entries.removeIf { nowMs - it.value > windowMs }
        if (kotlin.math.abs(nowMs - timestampMs) > windowMs) return false
        return seen.putIfAbsent(messageId, timestampMs) == null
    }
}
