package com.bridge.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import com.bridge.app.discovery.NsdDiscoveryManager
import com.bridge.app.permissions.BridgePermissionExplanation
import com.bridge.app.permissions.PermissionsRationaleScreen
import com.bridge.app.remotecontrol.TouchpadRemoteScreen

class MainActivity : ComponentActivity() {
    private lateinit var discoveryManager: NsdDiscoveryManager

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        discoveryManager = NsdDiscoveryManager(applicationContext)

        setContent {
            var darkTheme by remember { mutableStateOf(false) }
            val colors = if (darkTheme) {
                darkColorScheme(primary = Color(0xFF3B82F6), background = Color(0xFF0B0F17))
            } else {
                lightColorScheme(primary = Color(0xFF1D4ED8), background = Color(0xFFF8FAFC))
            }

            MaterialTheme(colorScheme = colors) {
                Surface(modifier = Modifier.fillMaxSize()) {
                    BridgeMobileApp(
                        discoveryManager = discoveryManager,
                        darkTheme = darkTheme,
                        onToggleTheme = { darkTheme = !darkTheme }
                    )
                }
            }
        }
    }
}

@Composable
fun BridgeMobileApp(
    discoveryManager: NsdDiscoveryManager,
    darkTheme: Boolean,
    onToggleTheme: () -> Unit
) {
    var selectedTab by remember { mutableStateOf("home") }
    val discoveredHosts by discoveryManager.hosts.collectAsState()

    Scaffold(
        bottomBar = {
            NavigationBar {
                NavigationBarItem(
                    selected = selectedTab == "home",
                    onClick = { selectedTab = "home" },
                    icon = { Text("H") },
                    label = { Text("Home") }
                )
                NavigationBarItem(
                    selected = selectedTab == "remote",
                    onClick = { selectedTab = "remote" },
                    icon = { Text("R") },
                    label = { Text("Remote") }
                )
                NavigationBarItem(
                    selected = selectedTab == "permissions",
                    onClick = { selectedTab = "permissions" },
                    icon = { Text("P") },
                    label = { Text("Permissions") }
                )
            }
        }
    ) { padding ->
        Column(modifier = Modifier.padding(padding).fillMaxSize()) {
            when (selectedTab) {
                "home" -> {
                    Column(
                        modifier = Modifier.padding(16.dp),
                        verticalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text("BRIDGE", style = MaterialTheme.typography.headlineMedium)
                            OutlinedButton(onClick = onToggleTheme) {
                                Text(if (darkTheme) "Light" else "Dark")
                            }
                        }
                        Text(
                            "Local-first connection to your Windows PC. Discovered hosts: ${discoveredHosts.size}",
                            style = MaterialTheme.typography.bodyMedium
                        )
                        Button(onClick = { discoveryManager.startDiscovery() }) {
                            Text("Discover Windows PC")
                        }
                        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            OutlinedButton(onClick = { selectedTab = "remote" }) { Text("Remote Control") }
                            OutlinedButton(onClick = { selectedTab = "permissions" }) { Text("Permissions") }
                        }
                    }
                }
                "remote" -> {
                    TouchpadRemoteScreen(
                        connectedPcName = discoveredHosts.firstOrNull()?.serviceName,
                        onMouseMove = { _, _ -> },
                        onMouseClick = { _ -> },
                        onSendText = { _ -> },
                        onDisconnect = { selectedTab = "home" }
                    )
                }
                "permissions" -> {
                    PermissionsRationaleScreen(
                        permissions = listOf(
                            BridgePermissionExplanation(
                                title = "Screen Capture (MediaProjection)",
                                rationale = "Required only when you explicitly start Android screen mirroring to Windows.",
                                statusLabel = "Requested on demand",
                                onRequest = {}
                            ),
                            BridgePermissionExplanation(
                                title = "Accessibility Service (Optional)",
                                rationale = "Enables remote touch interaction from Windows. Disabled by default.",
                                statusLabel = "Disabled by default",
                                onRequest = {}
                            ),
                            BridgePermissionExplanation(
                                title = "Camera & Microphone",
                                rationale = "Used strictly when you start phone camera or microphone streaming with an active indicator.",
                                statusLabel = "Requested on demand",
                                onRequest = {}
                            ),
                            BridgePermissionExplanation(
                                title = "Nearby Wi-Fi Devices",
                                rationale = "Discovers paired BRIDGE desktops on your local Wi-Fi network.",
                                statusLabel = "Required for local discovery",
                                onRequest = {}
                            )
                        )
                    )
                }
            }
        }
    }
}
