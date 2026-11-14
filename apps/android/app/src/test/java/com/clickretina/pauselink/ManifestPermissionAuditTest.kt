package com.clickretina.pauselink

import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Assert.fail
import org.junit.Test
import java.io.File

class ManifestPermissionAuditTest {

    @Test
    fun mergedManifest_hasZeroInternetPermission() {
        val projectRoot = File(System.getProperty("user.dir") ?: ".")
        val manifestCandidates = listOf(
            File(projectRoot, "build/intermediates/merged_manifest/debug/processDebugMainManifest/AndroidManifest.xml"),
            File(projectRoot, "app/build/intermediates/merged_manifest/debug/processDebugMainManifest/AndroidManifest.xml")
        )

        val mergedManifest: File = manifestCandidates.firstOrNull { it.exists() }
            ?: run {
                // If test runs before merged manifest exists in this directory, check source manifest as baseline
                val srcManifest = if (projectRoot.name == "app") {
                    File(projectRoot, "src/main/AndroidManifest.xml")
                } else {
                    File(projectRoot, "app/src/main/AndroidManifest.xml")
                }
                assertTrue("No manifest found to audit at ${srcManifest.absolutePath}", srcManifest.exists())
                srcManifest
            }

        val content = mergedManifest.readText()
        assertFalse(
            "Security violation: INTERNET permission detected in ${mergedManifest.absolutePath}",
            content.contains("android.permission.INTERNET")
        )
        assertFalse(
            "Security violation: ACCESS_NETWORK_STATE permission detected in ${mergedManifest.absolutePath}",
            content.contains("android.permission.ACCESS_NETWORK_STATE")
        )
        assertTrue(
            "Security violation: allowBackup must be false",
            content.contains("android:allowBackup=\"false\"")
        )
    }
}
