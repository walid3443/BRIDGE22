package com.bridge.app.remotecontrol

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.gestures.detectDragGestures
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.unit.dp

@Composable
fun TouchpadRemoteScreen(
    connectedPcName: String?,
    onMouseMove: (Float, Float) -> Unit,
    onMouseClick: (String) -> Unit,
    onSendText: (String) -> Unit,
    onDisconnect: () -> Unit
) {
    var showKeyboard by remember { mutableStateOf(false) }
    var textInput by remember { mutableStateOf("") }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column {
                Text("Remote Control", style = MaterialTheme.typography.titleLarge)
                Text(
                    text = connectedPcName?.let { "Target: $it" } ?: "Not connected to a Windows PC",
                    style = MaterialTheme.typography.bodySmall
                )
            }
            Button(
                onClick = onDisconnect,
                colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.error)
            ) {
                Text("Disconnect")
            }
        }

        Box(
            modifier = Modifier
                .weight(1f)
                .fillMaxWidth()
                .background(MaterialTheme.colorScheme.surfaceVariant, RoundedCornerShape(16.dp))
                .border(1.dp, MaterialTheme.colorScheme.outlineVariant, RoundedCornerShape(16.dp))
                .pointerInput(Unit) {
                    detectDragGestures { change, dragAmount ->
                        change.consume()
                        onMouseMove(dragAmount.x, dragAmount.y)
                    }
                }
                .pointerInput(Unit) {
                    detectTapGestures(
                        onTap = { onMouseClick("left") },
                        onLongPress = { onMouseClick("right") }
                    )
                },
            contentAlignment = Alignment.Center
        ) {
            Text(
                text = "Touchpad Surface\nDrag to move cursor · Tap to left-click · Long-press for right-click",
                style = MaterialTheme.typography.bodyMedium
            )
        }

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            OutlinedButton(
                onClick = { onMouseClick("left") },
                modifier = Modifier.weight(1f).height(48.dp)
            ) {
                Text("Left Click")
            }
            OutlinedButton(
                onClick = { onMouseClick("right") },
                modifier = Modifier.weight(1f).height(48.dp)
            ) {
                Text("Right Click")
            }
            OutlinedButton(
                onClick = { showKeyboard = !showKeyboard },
                modifier = Modifier.weight(1f).height(48.dp)
            ) {
                Text(if (showKeyboard) "Hide Keys" else "Keyboard")
            }
        }

        if (showKeyboard) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                OutlinedTextField(
                    value = textInput,
                    onValueChange = { textInput = it },
                    label = { Text("Send text to PC") },
                    modifier = Modifier.weight(1f)
                )
                Button(onClick = {
                    if (textInput.isNotEmpty()) {
                        onSendText(textInput)
                        textInput = ""
                    }
                }) {
                    Text("Send")
                }
            }
        }
    }
}
