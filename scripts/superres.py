"""Super-resolução (OpenCV dnn_superres) + nitidez leve.

Uso:
  python3 scripts/superres.py <entrada> <saida> [--model fsrcnn|edsr] [--times N] [--sharpen 0.6]
  <entrada>/<saida> podem ser arquivos ou pastas (processa todos os .png/.jpg/.webp).
Modelos em scripts/models (FSRCNN_x2.pb versionado; EDSR_x2.pb é baixado sob demanda, 38 MB).
"""
import argparse, os, sys, urllib.request
import cv2, numpy as np

HERE = os.path.dirname(__file__)
URLS = {
    'fsrcnn': 'https://raw.githubusercontent.com/Saafke/FSRCNN_Tensorflow/master/models/FSRCNN_x2.pb',
    'edsr': 'https://raw.githubusercontent.com/Saafke/EDSR_Tensorflow/master/models/EDSR_x2.pb',
}

def model(name):
    path = os.path.join(HERE, 'models', ('FSRCNN' if name == 'fsrcnn' else 'EDSR') + '_x2.pb')
    if not os.path.exists(path):
        urllib.request.urlretrieve(URLS[name], path)
    sr = cv2.dnn_superres.DnnSuperResImpl_create()
    sr.readModel(path)
    sr.setModel(name, 2)
    return sr

def sharpen(img, amount):
    if amount <= 0:
        return img
    blur = cv2.GaussianBlur(img, (0, 0), 1.1)
    return cv2.addWeighted(img, 1 + amount, blur, -amount, 0)

def run(src, dst, sr, times, amount):
    img = cv2.imread(src, cv2.IMREAD_COLOR)
    for _ in range(times):
        img = sr.upsample(img) if sr else img
    img = sharpen(img, amount)
    ext = os.path.splitext(dst)[1].lower()
    params = [cv2.IMWRITE_JPEG_QUALITY, 95] if ext in ('.jpg', '.jpeg') else []
    cv2.imwrite(dst, img, params)

if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    ap.add_argument('src'); ap.add_argument('dst')
    ap.add_argument('--model', default='fsrcnn', choices=['fsrcnn', 'edsr', 'none'])
    ap.add_argument('--times', type=int, default=1)
    ap.add_argument('--sharpen', type=float, default=0.6)
    a = ap.parse_args()
    sr = None if a.model == 'none' else model(a.model)
    if os.path.isdir(a.src):
        os.makedirs(a.dst, exist_ok=True)
        files = sorted(f for f in os.listdir(a.src) if f.lower().endswith(('.png', '.jpg', '.jpeg', '.webp')))
        for f in files:
            run(os.path.join(a.src, f), os.path.join(a.dst, os.path.splitext(f)[0] + '.png'), sr, a.times, a.sharpen)
    else:
        run(a.src, a.dst, sr, a.times, a.sharpen)
