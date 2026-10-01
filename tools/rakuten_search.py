#!/usr/bin/env python3
"""楽天市場の商品を公式API（楽天ウェブサービス 商品検索API）で探す。

使い方: python3 tools/rakuten_search.py "おしゃれ 上着 メンズ" [件数]
環境変数:
  RAKUTEN_APP_ID      アプリID（必須）
  RAKUTEN_ACCESS_KEY  アクセスキー（発行されていれば）
  RAKUTEN_API_ENDPOINT  エンドポイントを変えたいとき（省略時は下の DEFAULT_ENDPOINT）
レビュー本文はAPIでは取れない。取れるのは商品名・価格・レビュー平均・件数・商品説明・URL。
"""
import json
import os
import sys
import urllib.parse
import urllib.request

DEFAULT_ENDPOINT = "https://app.rakuten.co.jp/services/api/IchibaItem/Search/20220601"


def search(keyword, hits=10):
    app_id = os.environ.get("RAKUTEN_APP_ID")
    if not app_id:
        sys.exit("RAKUTEN_APP_ID が設定されていません（環境の設定で環境変数に追加してください）")
    params = {
        "applicationId": app_id,
        "keyword": keyword,
        "hits": hits,
        "sort": "-reviewCount",
        "availability": 1,
        "format": "json",
        "formatVersion": 2,
    }
    access_key = os.environ.get("RAKUTEN_ACCESS_KEY")
    if access_key:
        params["accessKey"] = access_key
    url = os.environ.get("RAKUTEN_API_ENDPOINT", DEFAULT_ENDPOINT) + "?" + urllib.parse.urlencode(params)
    with urllib.request.urlopen(url, timeout=30) as res:
        data = json.load(res)
    items = []
    for it in data.get("Items", []):
        it = it.get("Item", it)  # formatVersion 1 の形にも対応
        items.append({
            "name": it.get("itemName"),
            "price": it.get("itemPrice"),
            "review_average": it.get("reviewAverage"),
            "review_count": it.get("reviewCount"),
            "shop": it.get("shopName"),
            "url": it.get("itemUrl"),
            "caption": (it.get("itemCaption") or "")[:400],
        })
    return items


if __name__ == "__main__":
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    hits = int(sys.argv[2]) if len(sys.argv) > 2 else 10
    print(json.dumps(search(sys.argv[1], hits), ensure_ascii=False, indent=2))
