#!/usr/bin/env python
"""
LeafSense Unified ML Training Pipeline
=========================================
Integrated CLI tool to download/locate datasets, configure, and train:
1. Ultralytics YOLOv8 Object Detection model for Cotton Leaf Diseases (4 classes)
2. PyTorch ResNet-18 CNN Image Classification model for Hibiscus Leaf Diseases (8 classes)
"""

import os
import sys
import glob
import time
import yaml
import argparse
import numpy as np
import cv2
from PIL import Image

import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader
from torchvision import transforms, models

# Attempt kagglehub import gracefully
try:
    import kagglehub
    KAGGLEHUB_AVAILABLE = True
except ImportError:
    KAGGLEHUB_AVAILABLE = False

# Class Labels matching the production inference model_engine.py
HIBISCUS_CLASSES = [
    "Hibiscus Senescent",
    "Hibiscus Citruspot",
    "Hibiscus Early_Mild_Spotting",
    "Hibiscus Fungal_Infected",
    "Hibiscus Healthy",
    "Hibiscus Mild_Edge_Damage",
    "Hibiscus Slightly_Diseased",
    "Hibiscus Wrinkled_Leaf"
]

COTTON_CLASSES = [
    "Cotton Bacterial Blight",
    "Cotton Leaf Curl Virus",
    "Cotton Fusarium Wilt",
    "Cotton Healthy"
]


class FuzzyHibiscusDataset(Dataset):
    """
    Fuzzy-matching PyTorch dataset for Hibiscus leaf images.
    Automatically maps arbitrary folder structures in the dataset to HIBISCUS_CLASSES.
    """
    def __init__(self, root_dir, transform=None):
        self.root_dir = root_dir
        self.transform = transform
        self.image_paths = []
        self.labels = []
        
        # Discover directories
        class_folders = [d for d in os.listdir(root_dir) if os.path.isdir(os.path.join(root_dir, d))]
        print(f"\n[CNN Loader] Found class folders in '{root_dir}': {class_folders}")
        
        folder_to_class_idx = {}
        for folder in class_folders:
            matched_idx = None
            normalized_folder = folder.lower().replace("_", "").replace(" ", "").replace("-", "")
            
            # 1. Direct or substring matching
            for idx, cls_name in enumerate(HIBISCUS_CLASSES):
                normalized_cls = cls_name.lower().replace("_", "").replace(" ", "").replace("-", "")
                if normalized_folder in normalized_cls or normalized_cls in normalized_folder:
                    matched_idx = idx
                    break
            
            # 2. Key word matching fallback
            if matched_idx is None:
                for idx, cls_name in enumerate(HIBISCUS_CLASSES):
                    words = cls_name.lower().replace("_", " ").split()
                    if any(w in normalized_folder for w in words if w != "hibiscus"):
                        matched_idx = idx
                        break
                        
            if matched_idx is not None:
                folder_to_class_idx[folder] = matched_idx
                print(f"  Mapped directory '{folder}' -> class '{HIBISCUS_CLASSES[matched_idx]}' (index {matched_idx})")
            else:
                print(f"  [Warning] Could not match folder '{folder}' to any class in HIBISCUS_CLASSES. Skipping.")
                
        # Crawl images
        for folder, class_idx in folder_to_class_idx.items():
            folder_path = os.path.join(root_dir, folder)
            for ext in ("*.jpg", "*.jpeg", "*.png", "*.JPG", "*.JPEG", "*.PNG"):
                for img_path in glob.glob(os.path.join(folder_path, ext)):
                    self.image_paths.append(img_path)
                    self.labels.append(class_idx)
                    
        print(f"[CNN Loader] Loaded {len(self.image_paths)} images across {len(set(self.labels))} classes.")
        
    def __len__(self):
        return len(self.image_paths)
        
    def __getitem__(self, idx):
        img_path = self.image_paths[idx]
        image = Image.open(img_path).convert("RGB")
        label = self.labels[idx]
        
        if self.transform:
            image = self.transform(image)
            
        return image, label


class SubSplitDataset(Dataset):
    """Utility dataset to apply correct transforms to subsets."""
    def __init__(self, subset, transform):
        self.subset = subset
        self.transform = transform
    def __len__(self):
        return len(self.subset)
    def __getitem__(self, idx):
        original_idx = self.subset.indices[idx]
        img_path = self.subset.dataset.image_paths[original_idx]
        label = self.subset.dataset.labels[original_idx]
        image = Image.open(img_path).convert("RGB")
        if self.transform:
            image = self.transform(image)
        return image, label


def find_existing_cache_dataset():
    """Checks if dataset was already downloaded in user's kagglehub cache directory."""
    user_home = os.path.expanduser("~")
    cache_path = os.path.join(user_home, ".cache", "kagglehub", "datasets", "athlawange", "leaf-disease")
    if os.path.exists(cache_path):
        versions = glob.glob(os.path.join(cache_path, "*"))
        if versions:
            return versions[-1]
    return None


def find_yolo_yaml(dataset_path):
    """Recursively search for data.yaml configurations containing yolo dataset info."""
    for root, dirs, files in os.walk(dataset_path):
        for file in files:
            if file.endswith((".yaml", ".yml")):
                yaml_path = os.path.join(root, file)
                try:
                    with open(yaml_path, 'r', encoding='utf-8') as f:
                        data = yaml.safe_load(f)
                    if isinstance(data, dict) and ('train' in data or 'val' in data) and 'names' in data:
                        return yaml_path
                except Exception:
                    continue
    return None


def find_hibiscus_dir(dataset_path):
    """Recursively find Hibiscus image folders containing label names."""
    best_dir = None
    max_matches = 0
    
    for root, dirs, files in os.walk(dataset_path):
        matches = 0
        for d in dirs:
            d_lower = d.lower()
            if "hibiscus" in d_lower:
                matches += 3
            for cls_name in HIBISCUS_CLASSES:
                cls_lower = cls_name.lower().replace("hibiscus", "").strip().replace("_", "").replace(" ", "")
                if len(cls_lower) > 2 and cls_lower in d_lower.replace("_", "").replace(" ", ""):
                    matches += 1
        if matches > max_matches:
            max_matches = matches
            best_dir = root
            
    return best_dir


def build_resnet18_classifier():
    """Builds ResNet-18 model with exact architecture matching model_engine.py."""
    model = models.resnet18(weights=models.ResNet18_Weights.DEFAULT if torch.cuda.is_available() else None)
    in_features = model.fc.in_features
    model.fc = nn.Sequential(
        nn.Dropout(0.3),
        nn.Linear(in_features, 256),
        nn.ReLU(),
        nn.Dropout(0.2),
        nn.Linear(256, len(HIBISCUS_CLASSES))
    )
    return model


def parse_arguments():
    """Parse configuration command line args."""
    parser = argparse.ArgumentParser(
        description="LeafSense Combined YOLOv8 and PyTorch CNN ML Training Pipeline",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter
    )
    
    # Global Configs
    parser.add_argument("--epochs", type=int, default=30, help="Number of YOLOv8 training epochs")
    parser.add_argument("--cnn-epochs", type=int, default=15, help="Number of PyTorch CNN training epochs")
    parser.add_argument("--batch-size", type=int, default=16, help="Batch size for training")
    parser.add_argument("--yolo-model", type=str, default="yolov8n.pt", help="Pretrained YOLO model variant")
    parser.add_argument("--lr-yolo", type=float, default=0.01, help="Initial learning rate for YOLO")
    parser.add_argument("--lr-cnn", type=float, default=0.001, help="Initial learning rate for CNN")
    parser.add_argument("--imgsz", type=int, default=640, help="YOLO training image size")
    parser.add_argument("--save-dir", type=str, default=None, help="Directory to save final model checkpoints")
    parser.add_argument("--skip-yolo", action="store_true", help="Skip YOLOv8 object detection training")
    parser.add_argument("--skip-cnn", action="store_true", help="Skip PyTorch CNN classification training")

    return parser.parse_args()


def train_yolo(args, dataset_path):
    """Executes YOLOv8 object detection training using Ultralytics."""
    print("\n==============================================")
    print("STEP 2: Running YOLOv8 training pipeline...")
    print("==============================================")
    
    try:
        from ultralytics import YOLO
    except ImportError:
        print("[Error] 'ultralytics' package is not installed. Skipping YOLO training.")
        return None
        
    dataset_yaml = find_yolo_yaml(dataset_path)
    if not dataset_yaml:
        print("[Error] Could not locate dataset YAML configuration inside the downloaded dataset.")
        return None
        
    print(f"Found YOLOv8 configuration: {dataset_yaml}")
    
    # Fix dataset path root in data.yaml to avoid path resolution errors
    try:
        with open(dataset_yaml, 'r', encoding='utf-8') as f:
            data_cfg = yaml.safe_load(f) or {}
            
        yaml_dir = os.path.dirname(dataset_yaml).replace("\\", "/")
        data_cfg['path'] = yaml_dir
        
        with open(dataset_yaml, 'w', encoding='utf-8') as f:
            yaml.dump(data_cfg, f, default_flow_style=False)
        print(f"[Success] Set dataset 'path' root in YAML to: {yaml_dir}")
    except Exception as e:
        print(f"[Warning] Configuring YAML path: {e}")
        
    device = 0 if torch.cuda.is_available() else "cpu"
    print(f"Using compute device for YOLO: {device}")
    
    # Initialize & Train
    model = YOLO(args.yolo_model)
    project_dir = os.path.join(os.getcwd(), "yolo_training")
    
    print(f"Starting training on {dataset_yaml}...")
    results = model.train(
        data=dataset_yaml,
        epochs=args.epochs,
        imgsz=args.imgsz,
        batch=args.batch_size,
        lr0=args.lr_yolo,
        device=device,
        project=project_dir,
        name="cotton_disease_detection",
        exist_ok=True,
        # Default augmentations
        degrees=10.0,
        translate=0.1,
        scale=0.5,
        fliplr=0.5
    )
    
    best_weights_path = os.path.join(project_dir, "cotton_disease_detection", "weights", "best.pt")
    print(f"[Success] YOLOv8 training completed! Weights: {best_weights_path}")
    return best_weights_path


def train_cnn(args, dataset_path, save_dir):
    """Executes PyTorch CNN training loop for Hibiscus leaf classification."""
    print("\n==============================================")
    print("STEP 3: Running PyTorch CNN training pipeline...")
    print("==============================================")
    
    hibiscus_dir = find_hibiscus_dir(dataset_path)
    if not hibiscus_dir:
        print("[Error] Could not locate Hibiscus image directories inside the downloaded dataset.")
        return None
        
    print(f"Found Hibiscus image directory: {hibiscus_dir}")
    
    # Preprocessing & Augmentations
    train_transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.RandomHorizontalFlip(),
        transforms.RandomRotation(15),
        transforms.ColorJitter(brightness=0.2, contrast=0.2, saturation=0.2),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])
    
    val_transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])
    
    # Check for Split Folders (train vs val)
    train_split_dir = os.path.join(hibiscus_dir, "train")
    val_split_dir = os.path.join(hibiscus_dir, "val")
    if not os.path.exists(train_split_dir):
        train_split_dir = os.path.join(hibiscus_dir, "Train")
    if not os.path.exists(val_split_dir):
        val_split_dir = os.path.join(hibiscus_dir, "Val")
        if not os.path.exists(val_split_dir):
            val_split_dir = os.path.join(hibiscus_dir, "Validation")
            if not os.path.exists(val_split_dir):
                val_split_dir = os.path.join(hibiscus_dir, "validation")
                
    if os.path.exists(train_split_dir) and os.path.isdir(train_split_dir):
        print(f"Detected separate splits: train='{train_split_dir}', val='{val_split_dir}'")
        train_ds = FuzzyHibiscusDataset(train_split_dir, transform=train_transform)
        if os.path.exists(val_split_dir) and os.path.isdir(val_split_dir):
            val_ds = FuzzyHibiscusDataset(val_split_dir, transform=val_transform)
        else:
            print("No validation split directory found. Performing 80/20 train split...")
            generator = torch.Generator().manual_seed(42)
            tr_size = int(0.8 * len(train_ds))
            v_size = len(train_ds) - tr_size
            train_ds, val_ds = torch.utils.data.random_split(train_ds, [tr_size, v_size], generator=generator)
            train_ds = SubSplitDataset(train_ds, train_transform)
            val_ds = SubSplitDataset(val_ds, val_transform)
    else:
        # Load directory whole and split
        print(f"Loading whole directory and performing 80/20 train/val split...")
        full_ds = FuzzyHibiscusDataset(hibiscus_dir, transform=train_transform)
        if len(full_ds) == 0:
            print("[Error] No image folders detected in Hibiscus path.")
            return None
        generator = torch.Generator().manual_seed(42)
        tr_size = int(0.8 * len(full_ds))
        v_size = len(full_ds) - tr_size
        train_sub, val_sub = torch.utils.data.random_split(full_ds, [tr_size, v_size], generator=generator)
        train_ds = SubSplitDataset(train_sub, train_transform)
        val_ds = SubSplitDataset(val_sub, val_transform)
        
    train_loader = DataLoader(train_ds, batch_size=args.batch_size, shuffle=True, num_workers=0)
    val_loader = DataLoader(val_ds, batch_size=args.batch_size, shuffle=False, num_workers=0)
    
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Using compute device for CNN: {device}")
    
    model = build_resnet18_classifier()
    model = model.to(device)
    
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(model.parameters(), lr=args.lr_cnn)
    
    best_val_acc = 0.0
    best_model_weights = None
    
    print("Starting training loop...")
    for epoch in range(args.cnn_epochs):
        epoch_start = time.time()
        model.train()
        running_loss = 0.0
        correct = 0
        total = 0
        
        for images, labels in train_loader:
            images = images.to(device)
            labels = labels.to(device)
            
            optimizer.zero_grad()
            outputs = model(images)
            loss = criterion(outputs, labels)
            loss.backward()
            optimizer.step()
            
            running_loss += loss.item() * images.size(0)
            _, predicted = outputs.max(1)
            total += labels.size(0)
            correct += predicted.eq(labels).sum().item()
            
        epoch_loss = running_loss / len(train_loader.dataset)
        epoch_acc = (correct / total) * 100
        
        # Validation
        model.eval()
        val_loss = 0.0
        val_correct = 0
        val_total = 0
        
        with torch.no_grad():
            for images, labels in val_loader:
                images = images.to(device)
                labels = labels.to(device)
                outputs = model(images)
                loss = criterion(outputs, labels)
                
                val_loss += loss.item() * images.size(0)
                _, predicted = outputs.max(1)
                val_total += labels.size(0)
                val_correct += predicted.eq(labels).sum().item()
                
        epoch_val_loss = val_loss / len(val_loader.dataset)
        epoch_val_acc = (val_correct / val_total) * 100
        
        elapsed = time.time() - epoch_start
        print(f"Epoch [{epoch+1}/{args.cnn_epochs}] ({elapsed:.1f}s) | "
              f"Train Loss: {epoch_loss:.4f} Acc: {epoch_acc:.2f}% | "
              f"Val Loss: {epoch_val_loss:.4f} Acc: {epoch_val_acc:.2f}%")
              
        if epoch_val_acc >= best_val_acc:
            best_val_acc = epoch_val_acc
            best_model_weights = model.state_dict()
            
    # Save the model
    cnn_save_path = os.path.join(save_dir, "hibiscus_cnn_model.pth")
    if best_model_weights is not None:
        torch.save(best_model_weights, cnn_save_path)
        print(f"[Success] CNN training completed! Best Val Accuracy: {best_val_acc:.2f}%")
        print(f"[Success] Saved model weights to: {cnn_save_path}")
    else:
        print("[Warning] No weights saved.")
        
    return cnn_save_path


def main():
    args = parse_arguments()
    
    print("\n" + "="*50)
    print("LeafSense Unified ML Pipeline (YOLOv8 & CNN)")
    print("="*50)
    
    # 1. Dataset Loading & Discovery
    print("STEP 1: Locating/Downloading Dataset...")
    dataset_path = None
    existing_cache = find_existing_cache_dataset()
    
    if existing_cache:
        print(f"[Success] Found existing cached dataset at: {existing_cache}")
        dataset_path = existing_cache
    else:
        if not KAGGLEHUB_AVAILABLE:
            print("\n[Error] kagglehub is not installed.")
            print("   Please run: pip install kagglehub")
            sys.exit(1)
            
        print("Downloading dataset 'athlawange/leaf-disease' from Kaggle...")
        try:
            dataset_path = kagglehub.dataset_download("athlawange/leaf-disease")
            print(f"[Success] Dataset downloaded successfully to: {dataset_path}")
        except Exception as e:
            print(f"[Error] Error downloading dataset: {e}")
            sys.exit(1)
            
    # Configure Save Paths
    if args.save_dir is None:
        # Default save directory (same folder as this file)
        args.save_dir = os.path.dirname(os.path.abspath(__file__))
    os.makedirs(args.save_dir, exist_ok=True)
    
    # Running YOLO Training
    yolo_weights = None
    if not args.skip_yolo:
        yolo_weights = train_yolo(args, dataset_path)
    else:
        print("\nSkipping YOLOv8 Training.")
        
    # Running CNN Training
    cnn_weights = None
    if not args.skip_cnn:
        cnn_weights = train_cnn(args, dataset_path, args.save_dir)
    else:
        print("\nSkipping PyTorch CNN Training.")
        
    # Done
    print("\n" + "="*50)
    print("PIPELINE COMPLETED SUCCESSFULLY!")
    print("="*50)
    if yolo_weights:
        print(f" - Cotton YOLOv8 Weights: {yolo_weights}")
    if cnn_weights:
        print(f" - Hibiscus CNN Weights:  {cnn_weights}")
    print("="*50 + "\n")


if __name__ == "__main__":
    main()
