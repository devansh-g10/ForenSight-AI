import os
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader
from torchvision import transforms, models
from PIL import Image
import glob
from tqdm import tqdm

# ==========================================
# COLAB / KAGGLE CONFIGURATION
# ==========================================
# Change this path to wherever your dataset is on the cloud platform
# For Kaggle it might be something like '/kaggle/input/midv500/midv500-master'
# For Colab it might be '/content/midv500'
DATA_DIR = "./midv500-master" 

BATCH_SIZE = 16
NUM_EPOCHS = 10
LEARNING_RATE = 1e-4
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

print(f"Using device: {DEVICE}")

# ==========================================
# 1. DATASET CLASS FOR MIDV-500
# ==========================================
class MIDV500Dataset(Dataset):
    def __init__(self, root_dir, transform=None):
        """
        MIDV-500 contains folders for each document type, and inside them
        are images/frames. We will parse it dynamically.
        """
        self.root_dir = root_dir
        self.transform = transform
        self.image_paths = []
        self.labels = []
        
        # We assume the directory contains subdirectories of document types
        # This will gather all .tif, .jpg, and .png images
        search_pattern = os.path.join(root_dir, "**", "*.*")
        all_files = glob.glob(search_pattern, recursive=True)
        
        valid_extensions = {".tif", ".tiff", ".jpg", ".jpeg", ".png"}
        
        # Dynamically map folder names to class integers
        self.class_to_idx = {}
        self.classes = []
        idx = 0
        
        for file_path in all_files:
            ext = os.path.splitext(file_path)[1].lower()
            if ext in valid_extensions:
                # The folder name containing the image is used as the class label
                class_name = os.path.basename(os.path.dirname(file_path))
                
                if class_name not in self.class_to_idx:
                    self.class_to_idx[class_name] = idx
                    self.classes.append(class_name)
                    idx += 1
                    
                self.image_paths.append(file_path)
                self.labels.append(self.class_to_idx[class_name])
                
        print(f"Found {len(self.image_paths)} images across {len(self.classes)} document classes.")

    def __len__(self):
        return len(self.image_paths)

    def __getitem__(self, idx):
        img_path = self.image_paths[idx]
        image = Image.open(img_path).convert('RGB')
        label = self.labels[idx]
        
        if self.transform:
            image = self.transform(image)
            
        return image, label

# ==========================================
# 2. DATA AUGMENTATION
# ==========================================
# Using standard ImageNet normalization since we fine-tune ResNet
train_transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.RandomHorizontalFlip(),
    transforms.RandomRotation(15),       # Documents can be slightly rotated
    transforms.ColorJitter(brightness=0.2, contrast=0.2), # Simulates lighting changes
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], 
                         std=[0.229, 0.224, 0.225])
])

# ==========================================
# 3. MODEL ARCHITECTURE
# ==========================================
def get_model(num_classes):
    # Load pretrained ResNet50
    model = models.resnet50(weights=models.ResNet50_Weights.DEFAULT)
    
    # Freeze the base layers (optional, but good for small datasets)
    # for param in model.parameters():
    #     param.requires_grad = False
        
    # Replace the final fully connected layer
    num_ftrs = model.fc.in_features
    model.fc = nn.Sequential(
        nn.Dropout(0.3),
        nn.Linear(num_ftrs, num_classes)
    )
    
    return model.to(DEVICE)

# ==========================================
# 3.5. DUMMY DATASET GENERATOR (For Testing)
# ==========================================
def generate_dummy_dataset(base_dir, num_classes=3, images_per_class=10):
    print(f"\n[!] Real dataset not found in '{base_dir}'.")
    print(f"[!] Generating a small DUMMY dataset to verify training loop works...")
    os.makedirs(base_dir, exist_ok=True)
    
    classes = [f"doc_type_{i}" for i in range(num_classes)]
    for cls in classes:
        cls_dir = os.path.join(base_dir, cls)
        os.makedirs(cls_dir, exist_ok=True)
        for i in range(images_per_class):
            img = Image.new('RGB', (224, 224), color=(73, 109, 137))
            img_path = os.path.join(cls_dir, f"dummy_{i}.jpg")
            img.save(img_path)
            
    print("[!] Dummy dataset generated successfully!\n")

# ==========================================
# 4. TRAINING LOOP
# ==========================================
def train_model():
    # If the directory doesn't exist, generate dummy data
    if not os.path.exists(DATA_DIR) or len(os.listdir(DATA_DIR)) == 0:
        generate_dummy_dataset(DATA_DIR)

    dataset = MIDV500Dataset(root_dir=DATA_DIR, transform=train_transform)
    
    if len(dataset) == 0:
         # Fallback in case directory existed but had no images
        generate_dummy_dataset(DATA_DIR)
        dataset = MIDV500Dataset(root_dir=DATA_DIR, transform=train_transform)

    num_classes = len(dataset.classes)
    dataloader = DataLoader(dataset, batch_size=BATCH_SIZE, shuffle=True, num_workers=0) # num_workers=0 for better Windows compatibility
    
    model = get_model(num_classes)
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(model.parameters(), lr=LEARNING_RATE)
    
    print("Starting training...")
    for epoch in range(NUM_EPOCHS):
        model.train()
        running_loss = 0.0
        correct = 0
        total = 0
        
        pbar = tqdm(dataloader, desc=f"Epoch {epoch+1}/{NUM_EPOCHS}")
        for images, labels in pbar:
            images, labels = images.to(DEVICE), labels.to(DEVICE)
            
            optimizer.zero_grad()
            outputs = model(images)
            loss = criterion(outputs, labels)
            loss.backward()
            optimizer.step()
            
            running_loss += loss.item()
            _, predicted = outputs.max(1)
            total += labels.size(0)
            correct += predicted.eq(labels).sum().item()
            
            pbar.set_postfix({"Loss": round(running_loss/total, 4), "Acc": round(100.*correct/total, 2)})
            
    # Save the trained model
    os.makedirs("saved_models", exist_ok=True)
    save_path = "saved_models/forensight_resnet50_midv500.pth"
    torch.save(model.state_dict(), save_path)
    print(f"[SUCCESS] Training complete! Model saved to '{save_path}'")
    print("---------------------------------------------------------")
    print("NOTE: This model was trained on placeholder/dummy data.")
    print("To train on the real MIDV-500 dataset, please download it")
    print("into the 'midv500-master' folder and run this script again.")
    print("---------------------------------------------------------")

if __name__ == "__main__":
    train_model()
