import time
print("Checking imports...")
start = time.time()
import torch
print(f"torch imported in {time.time() - start:.2f}s")
start = time.time()
import torchvision
print(f"torchvision imported in {time.time() - start:.2f}s")
start = time.time()
import cv2
print(f"cv2 imported in {time.time() - start:.2f}s")
print("All imports done.")
