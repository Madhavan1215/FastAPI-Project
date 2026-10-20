from dotenv import load_dotenv
from imagekitio import AsyncImageKit
import os

load_dotenv()

IMAGEKIT_PRIVATE_KEY = os.getenv("IMAGEKIT_PRIVATE_KEY")
if not IMAGEKIT_PRIVATE_KEY:
    raise RuntimeError("IMAGEKIT_PRIVATE_KEY is missing from .env")

# The async client lets `await imagekit.files.upload(...)` run without
# blocking the server while the file is being sent to ImageKit.
imagekit = AsyncImageKit(private_key=IMAGEKIT_PRIVATE_KEY)
