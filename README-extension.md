# LegalEase Browser Extension Installation

To install the LegalEase extension in your browser (Chrome, Edge, Brave, etc.), follow these instructions. 

**Note on "Incorrect ZIP Format" errors**: If you previously zipped the `legalease-extension` folder by right-clicking it and selecting "Compress to ZIP", it places the folder itself into the ZIP instead of its contents. Chrome requires the `manifest.json` file to be at the *absolute root* of the ZIP file, not inside a subfolder, which causes the "incorrect format" error.

You have two easy ways to install the extension:

## Option 1: Load Unpacked (Easiest - No ZIP required!)
This is the recommended way for local development. You do not need a ZIP file at all.

1. Open your browser and go to the extensions page (e.g., `chrome://extensions` or `edge://extensions`).
2. Turn on **Developer mode** (usually a toggle in the top right corner).
3. Click the **"Load unpacked"** button.
4. Select the `legalease-extension` folder located inside your `PBL-LegalEase` directory.
5. The extension will be installed immediately!

## Option 2: Generate a Correct ZIP File
If you specifically need a ZIP file to share with someone or to upload to the Chrome Web Store, you can run the python script I created for you.

1. Open your terminal in the `PBL-LegalEase` project root folder.
2. Run the build script:
   ```bash
   python build_extension.py
   ```
3. This will create a `legalease-extension.zip` file in the correct format (with the manifest file at the root level).
4. You can now drag and drop this ZIP file into the `chrome://extensions` page.
