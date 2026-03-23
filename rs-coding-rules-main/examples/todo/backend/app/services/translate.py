from pydantic import BaseModel, Field, validate_call
import requests


class OutTranslate(BaseModel):
    text: str = Field(..., example="Hello")


@validate_call
def translate(q: str) -> OutTranslate:
    url = "https://api.mymemory.translated.net/get"
    params = {
        "q": q,
        "langpair": "ja|en"
    }

    res = requests.get(url, params=params)
    res.raise_for_status()
    data = res.json()

    text = data.get("responseData", {}).get("translatedText", "")

    return OutTranslate(text=text)
