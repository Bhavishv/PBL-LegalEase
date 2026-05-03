import zipfile
import os

def create_extension_zip():
    extension_dir = "legalease-extension"
    zip_filename = "legalease-extension.zip"
    
    if not os.path.exists(extension_dir):
        print(f"Error: Directory '{extension_dir}' not found.")
        return

    with zipfile.ZipFile(zip_filename, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for root, _, files in os.walk(extension_dir):
            for file in files:
                file_path = os.path.join(root, file)
                # The crucial part: archive name must NOT include the root directory
                # so that manifest.json sits at the root of the ZIP file.
                arcname = os.path.relpath(file_path, extension_dir)
                zipf.write(file_path, arcname)
                print(f"Added: {arcname}")
                
    print(f"\nSuccessfully created {zip_filename} in the correct format.")
    print("You can now load this ZIP file into Chrome or Edge via the extensions page.")
    print("Note: You can also use 'Load Unpacked' and simply select the 'legalease-extension' folder directly, without needing a ZIP.")

if __name__ == "__main__":
    create_extension_zip()
