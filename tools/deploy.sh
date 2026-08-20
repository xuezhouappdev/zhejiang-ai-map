#!/usr/bin/env bash
# deploy.sh — 部署到阿里云 OSS
# 用法: bash tools/deploy.sh（在 app/ 目录下运行）
set -e

BUCKET="oss://zj-ai-map-1287180862879131"
REGION="cn-hangzhou"
SRC="$(cd "$(dirname "$0")" && pwd)"  # app/tools/ -> app/

echo "==> 开始部署浙江省人工智能图谱..."
echo "    源目录: $SRC"
echo "    Bucket: $BUCKET"

if ! command -v aliyun &> /dev/null; then
  echo "ERROR: aliyun CLI 未安装"
  echo "安装: https://help.aliyun.com/zh/oss/developer-reference/install-aliyun-command-line-interface"
  exit 1
fi

echo "==> 上传 index.html ..."
aliyun oss cp "$SRC/index.html" "$BUCKET/index.html" \
  --meta Content-Type:text/html --region $REGION --force

echo "==> 上传 tasks.html ..."
aliyun oss cp "$SRC/tasks.html" "$BUCKET/tasks.html" \
  --meta Content-Type:text/html --region $REGION --force

echo "==> 上传 data/ ..."
aliyun oss cp -r "$SRC/data/" "$BUCKET/data/" --region $REGION --force

echo "==> 上传 styles/ ..."
aliyun oss cp -r "$SRC/styles/" "$BUCKET/styles/" --region $REGION --force

echo "==> 上传 js/ ..."
aliyun oss cp -r "$SRC/js/" "$BUCKET/js/" --region $REGION --force

echo ""
echo "==> 部署完成！"
echo "    访问地址: https://zj-ai-map-1287180862879131.oss-cn-hangzhou.aliyuncs.com/index.html"
