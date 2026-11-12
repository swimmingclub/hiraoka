#!/bin/sh
# src/game.html (artifact fragment) -> index.html (standalone page you can host or embed with <iframe>)
cd "$(dirname "$0")"
{
  printf '<!doctype html>\n<html lang="ja">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n<style>body{margin:0}[hidden]{display:none!important}</style>\n'
  sed -n '1,/^<\/style>$/p' src/game.html
  printf '</head>\n<body>\n'
  sed '1,/^<\/style>$/d' src/game.html
  printf '</body>\n</html>\n'
} > index.html
