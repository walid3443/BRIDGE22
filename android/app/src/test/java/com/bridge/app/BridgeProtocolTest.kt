package com.bridge.app

import com.bridge.app.core.BridgeEnvelope
import com.bridge.app.core.BridgeMessageType
import com.bridge.app.filetransfer.AndroidFileTransferUtils
import com.bridge.app.security.AndroidReplayGuard
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class BridgeProtocolTest {
    @Test
    fun validatesProtocolEnvelope() {
        val env = BridgeEnvelope.create("android-01", BridgeMessageType.HEARTBEAT)
        val parsed = BridgeEnvelope.parseAndValidate(env.toJsonString())
        assertNotNull(parsed)
    }

    @Test
    fun rejectsInvalidVersion() {
        val bad = """{"version":"9.9","messageId":"msg-12345678","senderDeviceId":"pc-1","type":"HEARTBEAT","timestamp":1700000000000,"payload":{}}"""
        assertNull(BridgeEnvelope.parseAndValidate(bad))
    }

    @Test
    fun blocksReplayAndUnsafeFilenames() {
        val guard = AndroidReplayGuard(60_000L)
        val now = 1_700_000_000_000L
        assertTrue(guard.accept("msg-1", now, now))
        assertFalse(guard.accept("msg-1", now, now + 100))

        assertFalse(AndroidFileTransferUtils.isSafeFilename("../secret.txt"))
        assertFalse(AndroidFileTransferUtils.isSafeFilename("CON.txt"))
        assertTrue(AndroidFileTransferUtils.isSafeFilename("document.pdf"))
    }
}
