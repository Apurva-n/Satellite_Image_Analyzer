import ee
import urllib.request
import torch
import io
import time
import numpy as np
from PIL import Image
from models.unet_segmentation import UNet

ee.Initialize(project='apps-459204')
bbox = [73.75, 18.45, 73.95, 18.60]
region = ee.Geometry.Rectangle(bbox, proj='EPSG:4326', geodesic=False)

img = ee.Image('COPERNICUS/S2_SR_HARMONIZED/20260103T053231_20260103T053233_T43QCA').select(['B4','B3','B2','B8']).clip(region)
url = img.getThumbURL({'region': region, 'dimensions': '256x256', 'min': 0, 'max': 3000, 'format': 'png'})

resp = urllib.request.urlopen(url)
pil_img = Image.open(io.BytesIO(resp.read()))
arr = np.array(pil_img).astype(np.float32) / 255.0
tensor = torch.from_numpy(arr).permute(2, 0, 1).unsqueeze(0)

unet = UNet(in_channels=4, num_classes=5)
unet.load_state_dict(torch.load('models/landcover_unet.pth', weights_only=True))
unet.eval()

t0 = time.time()
with torch.no_grad():
    out = unet(tensor)
    pred = torch.argmax(out, dim=1).squeeze(0).numpy()
t1 = time.time()

print(f"PyTorch inference on laptop CPU took {t1-t0:.3f}s!")
print(f"Output mask shape: {pred.shape}, unique classes: {np.unique(pred)}")
