import unittest
from unittest import mock

import pyfiglet
from fastapi.testclient import TestClient

import main
from main import (
    FIGLET_FONTS,
    MAX_BODY_BYTES,
    MAX_INPUT_LENGTH,
    SECURITY_HEADERS,
    app,
    apply_border,
    apply_flip,
    apply_mirror,
    apply_shadow,
    render_ascii,
)


class TransformTests(unittest.TestCase):
    def test_mirror_reverses_each_line(self):
        self.assertEqual(apply_mirror("ab\ncd\n"), "ba\ndc")

    def test_flip_reverses_line_order(self):
        self.assertEqual(apply_flip("ab\ncd\n"), "cd\nab")

    def test_shadow_adds_shadow_line_below(self):
        result = apply_shadow("#\n").split("\n")
        self.assertEqual(result[0].rstrip(), "#")
        self.assertEqual(result[1].rstrip(), " ░")

    def test_border_single(self):
        self.assertEqual(apply_border("ab\nc", "single"), "┌────┐\n│ ab │\n│ c  │\n└────┘")

    def test_border_double(self):
        self.assertEqual(apply_border("a", "double"), "╔═══╗\n║ a ║\n╚═══╝")

    def test_border_block(self):
        self.assertEqual(apply_border("a", "block"), "█▀▀▀█\n█ a █\n█▄▄▄█")

    def test_border_unknown_style_leaves_art_unchanged(self):
        self.assertEqual(apply_border("a", "none"), "a")

    def test_render_ascii_without_effects_matches_figlet(self):
        self.assertEqual(
            render_ascii("Hi", "standard", "none", "none"),
            pyfiglet.figlet_format("Hi", font="standard"),
        )

    def test_render_ascii_applies_effect_then_border(self):
        art = pyfiglet.figlet_format("Hi", font="slant")
        self.assertEqual(
            render_ascii("Hi", "slant", "mirror", "single"),
            apply_border(apply_mirror(art), "single"),
        )


class ApiTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)

    def generate(self, body="Hi", **params):
        return self.client.post("/generate-ascii", params=params, content=body)

    def test_healthz(self):
        response = self.client.get("/healthz")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.text, "ok")

    def test_fonts_lists_all_fonts(self):
        response = self.client.get("/fonts")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), FIGLET_FONTS)

    def test_all_fonts_are_available_in_pyfiglet(self):
        available = set(pyfiglet.FigletFont.getFonts())
        self.assertEqual([f for f in FIGLET_FONTS if f not in available], [])

    def test_index(self):
        response = self.client.get("/")
        self.assertEqual(response.status_code, 200)
        self.assertIn("text/html", response.headers["content-type"])

    def test_security_headers_are_set(self):
        response = self.client.get("/healthz")
        for name, value in SECURITY_HEADERS.items():
            self.assertEqual(response.headers[name], value)

    def test_generate_defaults(self):
        response = self.generate()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.text, pyfiglet.figlet_format("Hi", font="standard"))

    def test_generate_with_all_options(self):
        response = self.generate(font="doom", effect="shadow", border="double")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.text, render_ascii("Hi", "doom", "shadow", "double"))

    def test_invalid_parameters_are_rejected(self):
        for name, value in [("font", "nope"), ("effect", "blur"), ("border", "wavy")]:
            with self.subTest(name=name):
                response = self.generate(**{name: value})
                self.assertEqual(response.status_code, 422)
                self.assertEqual(response.json()["detail"][0]["loc"], ["query", name])

    def test_input_is_truncated(self):
        long_text = "x" * (MAX_INPUT_LENGTH + 50)
        with mock.patch.object(main, "render_ascii", return_value="") as render:
            self.generate(body=long_text)
        self.assertEqual(render.call_args.args[0], "x" * MAX_INPUT_LENGTH)

    def test_oversized_body_is_rejected(self):
        response = self.generate(body="x" * (MAX_BODY_BYTES + 1))
        self.assertEqual(response.status_code, 413)

    def test_oversized_streamed_body_without_content_length_is_rejected(self):
        def chunks():
            for _ in range(4):
                yield b"x" * (MAX_BODY_BYTES // 2)

        response = self.client.post("/generate-ascii", content=chunks())
        self.assertEqual(response.status_code, 413)

    def test_rendering_runs_in_threadpool(self):
        with mock.patch.object(main, "run_in_threadpool", wraps=main.run_in_threadpool) as pool:
            response = self.generate()
        self.assertEqual(response.status_code, 200)
        pool.assert_called_once_with(main.render_ascii, "Hi", "standard", "none", "none")


if __name__ == "__main__":
    unittest.main()
