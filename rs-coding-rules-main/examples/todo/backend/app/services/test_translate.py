from app.services.translate import translate


class Test:
    def setup_method(self, method):
        pass

    def teardown_method(self, method):
        pass

    def test_translate_success(self):
        q = "こんにちは"
        res = translate(q=q)
        print(f"\nInput ja: {q}")
        print(f"Output en: {res.text}")
        assert res.text != ""
