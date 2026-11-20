package com.bridge.app.permissions

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp

data class BridgePermissionExplanation(
    val title: String,
    val rationale: String,
    val statusLabel: String,
    val onRequest: () -> Unit
)

@Composable
fun PermissionsRationaleScreen(
    permissions: List<BridgePermissionExplanation>
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        Text("Permissions & Privacy", style = MaterialTheme.typography.titleLarge)
        Text(
            "BRIDGE only requests a permission when you activate its corresponding feature.",
            style = MaterialTheme.typography.bodyMedium
        )
        LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp)) {
            items(permissions) { perm ->
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 8.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column(modifier = Modifier.weight(1f).padding(end = 12.dp)) {
                        Text(perm.title, style = MaterialTheme.typography.titleMedium)
                        Text(perm.rationale, style = MaterialTheme.typography.bodySmall)
                        Text(perm.statusLabel, style = MaterialTheme.typography.labelSmall)
                    }
                    OutlinedButton(onClick = perm.onRequest) {
                        Text("Configure")
                    }
                }
                HorizontalDivider()
            }
        }
    }
}
