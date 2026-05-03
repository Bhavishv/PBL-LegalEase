import urllib.request

url = "https://raw.githubusercontent.com/mozilla/readability/master/Readability.js"
output_path = r"d:\Bhavish\Project\PBL-LegalEase\legalease-extension\readability.js"

print(f"Downloading {url} to {output_path}...")
try:
    urllib.request.urlretrieve(url, output_path)
    print("Download complete!")
except Exception as e:
    print(f"Failed to download: {e}")
