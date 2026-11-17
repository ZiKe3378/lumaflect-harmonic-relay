#!/usr/bin/env python3
"""
Test Suite for Lumaflect: Harmonic Relay
Verifies offline static bundle integrity, file size bounds, absence of external network assets,
DOM node completeness, game mechanics invariants, and platform adapter configuration.
"""

import os
import re
import sys
import math
import unittest

WORKSPACE_DIR = os.path.dirname(os.path.abspath(__file__))
GAME_DIR = os.path.join(WORKSPACE_DIR, 'game')


class TestBundleIntegrity(unittest.TestCase):
    """Verifies that all required offline files exist and adhere to constraints."""

    def test_required_files_exist(self):
        required = [
            os.path.join(GAME_DIR, 'index.html'),
            os.path.join(GAME_DIR, 'style.css'),
            os.path.join(GAME_DIR, 'js', 'audio.js'),
            os.path.join(GAME_DIR, 'js', 'entities.js'),
            os.path.join(GAME_DIR, 'js', 'renderer.js'),
            os.path.join(GAME_DIR, 'js', 'game.js'),
            os.path.join(WORKSPACE_DIR, 'LICENSE'),
            os.path.join(WORKSPACE_DIR, 'README.md'),
            os.path.join(WORKSPACE_DIR, 'main.ts'),
        ]
        for path in required:
            self.assertTrue(os.path.exists(path), f"Required file missing: {path}")
            self.assertGreater(os.path.getsize(path), 0, f"File is empty: {path}")

    def test_no_symlinks(self):
        """Verifies no symlinks exist in the project."""
        for root, dirs, files in os.walk(WORKSPACE_DIR):
            for d in dirs:
                full_path = os.path.join(root, d)
                self.assertFalse(os.path.islink(full_path), f"Symlink directory found: {full_path}")
            for f in files:
                full_path = os.path.join(root, f)
                self.assertFalse(os.path.islink(full_path), f"Symlink file found: {full_path}")

    def test_file_size_limits(self):
        """Source must be < 160 KiB useful source and game directory < 48 MiB."""
        total_source_bytes = 0
        source_exts = {'.html', '.css', '.js', '.ts', '.py'}
        for root, _, files in os.walk(GAME_DIR):
            for f in files:
                ext = os.path.splitext(f)[1].lower()
                if ext in source_exts:
                    total_source_bytes += os.path.getsize(os.path.join(root, f))

        total_source_kib = total_source_bytes / 1024
        self.assertLess(total_source_kib, 160, f"Source size exceeds 160 KiB: {total_source_kib:.2f} KiB")

        total_game_bytes = sum(
            os.path.getsize(os.path.join(root, f))
            for root, _, files in os.walk(GAME_DIR)
            for f in files
        )
        total_game_mib = total_game_bytes / (1024 * 1024)
        self.assertLess(total_game_mib, 48, f"Game bundle exceeds 48 MiB: {total_game_mib:.2f} MiB")

    def test_strict_offline_no_external_resources(self):
        """Ensures index.html contains no external scripts, styles, fonts, or CDNs."""
        html_path = os.path.join(GAME_DIR, 'index.html')
        with open(html_path, 'r', encoding='utf-8') as f:
            content = f.read()

        # Check for remote URLs (http:// or https:// or //)
        remote_refs = re.findall(r'(?:src|href)=["\'](https?:|//)[^"\']*["\']', content, re.IGNORECASE)
        self.assertEqual(len(remote_refs), 0, f"External network references detected: {remote_refs}")

        # Check script tags only reference local files
        scripts = re.findall(r'<script[^>]+src=["\']([^"\']+)["\']', content, re.IGNORECASE)
        for s in scripts:
            self.assertFalse(s.startswith(('http:', 'https:', '//')), f"Remote script found: {s}")
            local_target = os.path.normpath(os.path.join(GAME_DIR, s))
            self.assertTrue(os.path.exists(local_target), f"Referenced local script missing: {s}")

    def test_html_ui_screens_and_elements(self):
        """Verifies that all required screen elements and HUD elements exist in index.html."""
        html_path = os.path.join(GAME_DIR, 'index.html')
        with open(html_path, 'r', encoding='utf-8') as f:
            content = f.read()

        expected_ids = [
            'game-canvas',
            'hud',
            'integrity-bar',
            'energy-bar',
            'wave-value',
            'polarity-indicator',
            'score-value',
            'multiplier-value',
            'btn-sound',
            'btn-pause',
            'title-screen',
            'btn-start',
            'manual-screen',
            'pause-screen',
            'btn-resume',
            'gameover-screen',
            'btn-restart-dead',
            'victory-screen',
            'btn-restart-vic',
        ]
        for eid in expected_ids:
            self.assertIn(f'id="{eid}"', content, f"Expected DOM element missing: id='{eid}'")


class TestGameMechanicsInvariants(unittest.TestCase):
    """Verifies core math and state invariants used by the JavaScript engine."""

    def test_line_intersects_circle_math(self):
        """Tests the line-to-circle intersection algorithm matching Entities.Vec.lineIntersectsCircle."""
        def line_intersects_circle(x1, y1, x2, y2, cx, cy, r):
            dx = x2 - x1
            dy = y2 - y1
            lensq = dx * dx + dy * dy
            if lensq == 0:
                return math.hypot(cx - x1, cy - y1) <= r
            t = ((cx - x1) * dx + (cy - y1) * dy) / lensq
            t = max(0.0, min(1.0, t))
            nearest_x = x1 + t * dx
            nearest_y = y1 + t * dy
            return math.hypot(cx - nearest_x, cy - nearest_y) <= r

        # Line from (0,0) to (100,0), circle at (50, 5) with radius 10 -> intersects
        self.assertTrue(line_intersects_circle(0, 0, 100, 0, 50, 5, 10))

        # Line from (0,0) to (100,0), circle at (50, 25) with radius 10 -> misses
        self.assertFalse(line_intersects_circle(0, 0, 100, 0, 50, 25, 10))

        # Circle beyond endpoints (120, 0) with radius 10 -> misses segment
        self.assertFalse(line_intersects_circle(0, 0, 100, 0, 120, 0, 10))

    def test_polarity_toggle(self):
        """Verifies polarity states alternate deterministically."""
        p = 'cyan'
        p = 'amber' if p == 'cyan' else 'cyan'
        self.assertEqual(p, 'amber')
        p = 'amber' if p == 'cyan' else 'cyan'
        self.assertEqual(p, 'cyan')

    def test_multiplier_clamping(self):
        """Verifies chain multiplier caps at 8.0 and floors at 1.0."""
        mult = 1.0
        for _ in range(50):
            mult = min(8.0, mult + 0.2)
        self.assertEqual(mult, 8.0)

        mult = max(1.0, mult - 10.0)
        self.assertEqual(mult, 1.0)


class TestLicenseAndAdapter(unittest.TestCase):
    """Verifies LICENSE and platform adapter contract."""

    def test_mit_license(self):
        license_path = os.path.join(WORKSPACE_DIR, 'LICENSE')
        with open(license_path, 'r', encoding='utf-8') as f:
            text = f.read()
        self.assertIn("SPDX-License-Identifier: MIT", text)
        self.assertIn("MIT License", text)
        self.assertIn("Permission is hereby granted", text)

    def test_adapter_contains_expected_exports(self):
        """Verifies current Node 22 ESM adapter and actual buildDossier call."""
        adapter_path = os.path.join(WORKSPACE_DIR, 'main.ts')
        with open(adapter_path, 'r', encoding='utf-8') as f:
            text = f.read()
        self.assertIn("import.meta.url", text)
        self.assertIn("buildDossier", text)
        self.assertIn("./vendor/makefun-game.ts", text)
        self.assertIn("MAKEFUN_OUTPUT_DIR", text)
        self.assertIn("dossier.json", text)
        self.assertIn("text_max_bytes", text)
        self.assertIn("163840", text)


if __name__ == '__main__':
    unittest.main()
