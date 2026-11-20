package com.bridge.app.devicemanagement

import com.bridge.app.pairing.PairingTrustState
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

data class PairedWindowsPc(
    val deviceId: String,
    val displayName: String,
    val certificateFingerprint: String,
    val trustState: PairingTrustState,
    val lastConnectedEpochMs: Long
)

class PairedDevicesStore {
    private val _devices = MutableStateFlow<List<PairedWindowsPc>>(emptyList())
    val devices: StateFlow<List<PairedWindowsPc>> = _devices.asStateFlow()

    fun addOrUpdate(pc: PairedWindowsPc) {
        _devices.value = (_devices.value.filterNot { it.deviceId == pc.deviceId } + pc)
    }

    fun rename(deviceId: String, newName: String) {
        if (newName.isBlank()) return
        _devices.value = _devices.value.map {
            if (it.deviceId == deviceId) it.copy(displayName = newName.trim()) else it
        }
    }

    fun revokeTrust(deviceId: String) {
        _devices.value = _devices.value.map {
            if (it.deviceId == deviceId) it.copy(trustState = PairingTrustState.REVOKED) else it
        }
    }
}
