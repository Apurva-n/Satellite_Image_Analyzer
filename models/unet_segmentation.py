"""
Satellite Image Analyzer — PyTorch U-Net Semantic Segmentation Pipeline (Phase 4)

Complete pixel-wise Land Use / Land Cover (LULC) segmentation architecture
for Copernicus Sentinel-2 multispectral imagery (Red, Green, Blue, NIR).

Key Capabilities:
1. Full 4-channel U-Net architecture with skip connections & batch normalization.
2. Combined Cross-Entropy + Soft Dice Loss for pixel segmentation.
3. Mean Intersection-over-Union (mIoU) and pixel accuracy metrics.
4. Export to PyTorch (.pth) and ONNX (.onnx) for production serving.

Usage:
    python models/unet_segmentation.py --epochs 5 --batch-size 16
"""

import os
import sys
import argparse
import time
import io
import numpy as np

# Ensure clean UTF-8 console output on Windows
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

import torch
import torch.nn as nn
import torch.nn.functional as F
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader

# 5 Core LULC Classes
CLASSES = [
    "Water Bodies",
    "Trees & Dense Forest",
    "Cropland & Agriculture",
    "Urban & Built-up",
    "Barren Soil & Rock",
]
NUM_CLASSES = len(CLASSES)
CLASS_COLORS = ['#419BDF', '#2D6A4F', '#70E000', '#D90429', '#DDB892']


# =====================================================================
# 1. PyTorch U-Net Architecture
# =====================================================================
class DoubleConv(nn.Module):
    """(Conv2D -> BatchNorm -> ReLU) * 2"""
    def __init__(self, in_channels: int, out_channels: int):
        super().__init__()
        self.double_conv = nn.Sequential(
            nn.Conv2d(in_channels, out_channels, kernel_size=3, padding=1, bias=False),
            nn.BatchNorm2d(out_channels),
            nn.ReLU(inplace=True),
            nn.Conv2d(out_channels, out_channels, kernel_size=3, padding=1, bias=False),
            nn.BatchNorm2d(out_channels),
            nn.ReLU(inplace=True),
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.double_conv(x)


class Down(nn.Module):
    """Downscaling with MaxPool2D then DoubleConv"""
    def __init__(self, in_channels: int, out_channels: int):
        super().__init__()
        self.maxpool_conv = nn.Sequential(
            nn.MaxPool2d(2),
            DoubleConv(in_channels, out_channels),
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.maxpool_conv(x)


class Up(nn.Module):
    """Upscaling then DoubleConv with Skip-Connection Concatenation"""
    def __init__(self, in_channels: int, out_channels: int):
        super().__init__()
        self.up = nn.ConvTranspose2d(in_channels, in_channels // 2, kernel_size=2, stride=2)
        self.conv = DoubleConv(in_channels, out_channels)

    def forward(self, x1: torch.Tensor, x2: torch.Tensor) -> torch.Tensor:
        x1 = self.up(x1)
        # Pad x1 if x2 has odd dimension
        diff_y = x2.size()[2] - x1.size()[2]
        diff_x = x2.size()[3] - x1.size()[3]
        x1 = F.pad(x1, [diff_x // 2, diff_x - diff_x // 2, diff_y // 2, diff_y - diff_y // 2])
        # Concatenate skip connection
        x = torch.cat([x2, x1], dim=1)
        return self.conv(x)


class UNet(nn.Module):
    """
    4-Stage U-Net Semantic Segmentation Architecture for Multispectral Satellites.
    Accepts 4 bands: [Red, Green, Blue, NIR] and outputs [num_classes, H, W] logits.
    """
    def __init__(self, in_channels: int = 4, num_classes: int = 5):
        super().__init__()
        self.inc = DoubleConv(in_channels, 32)
        self.down1 = Down(32, 64)
        self.down2 = Down(64, 128)
        self.down3 = Down(128, 256)
        
        self.up1 = Up(256, 128)
        self.up2 = Up(128, 64)
        self.up3 = Up(64, 32)
        self.outc = nn.Conv2d(32, num_classes, kernel_size=1)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        x1 = self.inc(x)
        x2 = self.down1(x1)
        x3 = self.down2(x2)
        x4 = self.down3(x3)
        
        x = self.up1(x4, x3)
        x = self.up2(x, x2)
        x = self.up3(x, x1)
        logits = self.outc(x)
        return logits


# =====================================================================
# 2. Combined Dice Loss + Cross-Entropy Loss
# =====================================================================
class CombinedDiceCELoss(nn.Module):
    """
    Combines Focal/CrossEntropy Loss with Soft Dice Loss to prevent class imbalance
    (e.g., small water reservoirs being overlooked vs. large urban/barren areas).
    """
    def __init__(self, num_classes: int = 5, smooth: float = 1.0):
        super().__init__()
        self.num_classes = num_classes
        self.smooth = smooth
        self.ce = nn.CrossEntropyLoss()

    def forward(self, logits: torch.Tensor, targets: torch.Tensor) -> torch.Tensor:
        # Cross Entropy Loss
        ce_loss = self.ce(logits, targets)
        
        # Soft Dice Loss
        probs = F.softmax(logits, dim=1)
        targets_one_hot = F.one_hot(targets, self.num_classes).permute(0, 3, 1, 2).float()
        
        dims = (0, 2, 3)
        intersection = torch.sum(probs * targets_one_hot, dims)
        cardinality = torch.sum(probs + targets_one_hot, dims)
        dice_score = (2.0 * intersection + self.smooth) / (cardinality + self.smooth)
        dice_loss = 1.0 - torch.mean(dice_score)
        
        return 0.6 * ce_loss + 0.4 * dice_loss


# =====================================================================
# 3. Sentinel-2 Pixel-Wise Segmentation Dataset
# =====================================================================
class SyntheticSegmentationDataset(Dataset):
    """
    Synthesizes georeferenced Sentinel-2 patches (4-bands: R, G, B, NIR)
    and paired pixel-level 5-class ground-truth segmentation masks.
    """
    def __init__(self, num_samples: int = 400, patch_size: int = 128):
        self.num_samples = num_samples
        self.patch_size = patch_size
        self.samples = []
        self.masks = []
        
        rng = np.random.RandomState(42)
        
        # Spectral signatures [Red, Green, Blue, NIR]
        signatures = {
            0: np.array([0.03, 0.05, 0.08, 0.02]),  # Water
            1: np.array([0.04, 0.08, 0.03, 0.48]),  # Forest
            2: np.array([0.07, 0.14, 0.05, 0.38]),  # Cropland
            3: np.array([0.22, 0.20, 0.18, 0.21]),  # Urban
            4: np.array([0.26, 0.23, 0.19, 0.25]),  # Barren
        }
        
        for _ in range(num_samples):
            # Create a multi-class spatial mask
            mask = np.full((patch_size, patch_size), fill_value=4, dtype=np.int64) # background: barren
            
            # 1. Add urban zone (left or right block)
            ux, uy = rng.randint(0, patch_size - 40), rng.randint(0, patch_size - 40)
            mask[uy:uy+40, ux:ux+40] = 3 # Urban
            
            # 2. Add cropland parcel
            cx, cy = rng.randint(0, patch_size - 50), rng.randint(0, patch_size - 50)
            mask[cy:cy+50, cx:cx+50] = 2 # Cropland
            
            # 3. Add forest cluster
            fx, fy = rng.randint(0, patch_size - 30), rng.randint(0, patch_size - 30)
            mask[fy:fy+30, fx:fx+30] = 1 # Forest
            
            # 4. Add water river or pond
            wx = rng.randint(10, patch_size - 20)
            mask[:, max(0, wx-6):min(patch_size, wx+6)] = 0 # Water
            
            # Generate 4-band image from mask with realistic sensor noise
            img = np.zeros((4, patch_size, patch_size), dtype=np.float32)
            for c_id, sig in signatures.items():
                c_mask = (mask == c_id)
                if np.any(c_mask):
                    noise = rng.normal(0, 0.025, (4, np.sum(c_mask)))
                    img[:, c_mask] = sig[:, None] + noise
                    
            img = np.clip(img, 0.0, 1.0).astype(np.float32)
            self.samples.append(img)
            self.masks.append(mask)

    def __len__(self):
        return self.num_samples

    def __getitem__(self, idx):
        return torch.tensor(self.samples[idx]), torch.tensor(self.masks[idx])


# =====================================================================
# 4. Evaluation Metric: Mean Intersection-over-Union (mIoU)
# =====================================================================
def compute_miou(preds: torch.Tensor, targets: torch.Tensor, num_classes: int = 5) -> float:
    """Computes mean Intersection over Union across all classes."""
    ious = []
    for cls in range(num_classes):
        pred_inds = (preds == cls)
        target_inds = (targets == cls)
        intersection = (pred_inds & target_inds).sum().item()
        union = (pred_inds | target_inds).sum().item()
        if union == 0:
            continue
        ious.append(intersection / union)
    return float(np.mean(ious)) if ious else 0.0


# =====================================================================
# 5. Training Pipeline & ONNX Exporter
# =====================================================================
def train_unet(epochs: int = 5, batch_size: int = 16, lr: float = 0.001, output_path: str = "models/landcover_unet.pth"):
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"[*] Training Compute Device: {device}")

    print("[*] Generating 400 Sentinel-2 multispectral segmentation patches (128x128, 4 bands)...")
    dataset = SyntheticSegmentationDataset(num_samples=400, patch_size=128)
    
    train_size = int(0.8 * len(dataset))
    val_size = len(dataset) - train_size
    train_ds, val_ds = torch.utils.data.random_split(dataset, [train_size, val_size])
    
    train_loader = DataLoader(train_ds, batch_size=batch_size, shuffle=True)
    val_loader = DataLoader(val_ds, batch_size=batch_size, shuffle=False)
    
    print(f"    Train: {train_size} patches | Val: {val_size} patches")
    print(f"    Classes (5): {', '.join(CLASSES)}")

    # Initialize U-Net
    model = UNet(in_channels=4, num_classes=NUM_CLASSES).to(device)
    criterion = CombinedDiceCELoss(num_classes=NUM_CLASSES)
    optimizer = optim.Adam(model.parameters(), lr=lr, weight_decay=1e-4)
    scheduler = optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=epochs)

    print("\n[*] Starting U-Net Semantic Segmentation Training Loop:")
    start_time = time.time()
    best_miou = 0.0

    for epoch in range(1, epochs + 1):
        model.train()
        train_loss = 0.0
        total_pixels = 0
        correct_pixels = 0

        for images, masks in train_loader:
            images, masks = images.to(device), masks.to(device)
            optimizer.zero_grad()
            
            outputs = model(images)
            loss = criterion(outputs, masks)
            loss.backward()
            optimizer.step()

            train_loss += loss.item() * images.size(0)
            preds = torch.argmax(outputs, dim=1)
            correct_pixels += (preds == masks).sum().item()
            total_pixels += masks.numel()

        scheduler.step()
        train_loss = train_loss / train_size
        train_acc = (correct_pixels / total_pixels) * 100.0

        # Validation Loop
        model.eval()
        val_loss = 0.0
        val_correct = 0
        val_total = 0
        val_mious = []

        with torch.no_grad():
            for images, masks in val_loader:
                images, masks = images.to(device), masks.to(device)
                outputs = model(images)
                loss = criterion(outputs, masks)
                val_loss += loss.item() * images.size(0)

                preds = torch.argmax(outputs, dim=1)
                val_correct += (preds == masks).sum().item()
                val_total += masks.numel()
                val_mious.append(compute_miou(preds, masks, num_classes=NUM_CLASSES))

        val_loss = val_loss / val_size
        val_acc = (val_correct / val_total) * 100.0
        epoch_miou = float(np.mean(val_mious))

        if epoch_miou > best_miou:
            best_miou = epoch_miou
            os.makedirs(os.path.dirname(output_path), exist_ok=True)
            torch.save(model.state_dict(), output_path)

        print(f"Epoch [{epoch:>2}/{epochs:>2}] | "
              f"Train Loss: {train_loss:.4f} | Pixel Acc: {train_acc:>5.1f}% | "
              f"Val Loss: {val_loss:.4f} | Val Acc: {val_acc:>5.1f}% | "
              f"mIoU: {epoch_miou:.3f}")

    total_time = time.time() - start_time
    print(f"\n[+] U-Net Training Complete in {total_time:.1f}s!")
    print(f"    Peak Validation mIoU: {best_miou:.3f}")
    print(f"    Saved PyTorch Weights to: {output_path}")

    # Export to ONNX for fast cross-platform deployment
    try:
        onnx_path = output_path.replace(".pth", ".onnx")
        dummy_input = torch.randn(1, 4, 128, 128).to(device)
        torch.onnx.export(
            model,
            dummy_input,
            onnx_path,
            export_params=True,
            opset_version=14,
            do_constant_folding=True,
            input_names=['input_raster'],
            output_names=['class_logits'],
            dynamic_axes={'input_raster': {0: 'batch_size'}, 'class_logits': {0: 'batch_size'}},
        )
        print(f"    Exported ONNX Model to: {onnx_path}")
    except Exception as e:
        print(f"    (ONNX export notice: {e})")

    return model


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Train U-Net Land Cover Segmentation Model")
    parser.add_argument("--epochs", type=int, default=5, help="Epochs")
    parser.add_argument("--batch-size", type=int, default=16, help="Batch size")
    parser.add_argument("--lr", type=float, default=0.001, help="Learning rate")
    parser.add_argument("--output", type=str, default="models/landcover_unet.pth", help="Model path")
    args = parser.parse_args()

    train_unet(epochs=args.epochs, batch_size=args.batch_size, lr=args.lr, output_path=args.output)
