from webpage_extractor import extract_text_from_url

url = "https://policies.google.com/terms"

text = extract_text_from_url(url)

print("\n--- OUTPUT PREVIEW ---\n")
print(text[:500])