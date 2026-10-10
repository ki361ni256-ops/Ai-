#!/bin/sh
# 画像書き出しに使うフォント（Noto Sans JP / Noto Serif JP、SIL Open Font License 1.1）を取得する
cd "$(dirname "$0")"
UA="Mozilla/4.0"
for fam in "Noto+Sans+JP:wght@500" "Noto+Sans+JP:wght@900" "Noto+Serif+JP:wght@700"; do
  url=$(curl -sS -A "$UA" "https://fonts.googleapis.com/css2?family=$fam" | grep -o "https://[^)]*\.ttf" | head -1)
  case "$fam" in *Serif*) out=NotoSerifJP-Bold.ttf;; *900) out=NotoSansJP-Black.ttf;; *) out=NotoSansJP-Medium.ttf;; esac
  [ -f "$out" ] || curl -sS -o "$out" "$url"
done
ls -la *.ttf
