package com.clickretina.pauselink

import org.junit.Assert.fail
import org.junit.Test
import java.io.File

class AnalyzerBoundaryTest {

    @Test
    fun analyzerModule_hasNoAndroidDependencies() {
        val projectRoot = File(System.getProperty("user.dir") ?: ".")
        val analyzerSrcDir = if (projectRoot.name == "app") {
            File(projectRoot.parentFile, "analyzer/src/main")
        } else {
            File(projectRoot, "analyzer/src/main")
        }

        if (!analyzerSrcDir.exists()) {
            fail("Analyzer source directory does not exist: ${analyzerSrcDir.absolutePath}")
        }

        val kotlinFiles = analyzerSrcDir.walkTopDown().filter { it.extension == "kt" }.toList()
        if (kotlinFiles.isEmpty()) {
            fail("No Kotlin source files found in analyzer module")
        }

        val forbiddenImportPrefixes = listOf(
            "import android.",
            "import androidx.",
            "import com.google.android.",
            "import dagger.hilt.",
            "import javax.inject."
        )

        val violations = mutableListOf<String>()

        for (file in kotlinFiles) {
            val lines = file.readLines()
            lines.forEachIndexed { index, line ->
                val trimmed = line.trim()
                for (forbidden in forbiddenImportPrefixes) {
                    if (trimmed.startsWith(forbidden)) {
                        violations.add("${file.name}:${index + 1} contains forbidden import '$trimmed'")
                    }
                }
            }
        }

        if (violations.isNotEmpty()) {
            fail("Analyzer module boundary violated! Found forbidden imports:\n${violations.joinToString("\n")}")
        }
    }
}
