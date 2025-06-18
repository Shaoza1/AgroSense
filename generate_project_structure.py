import os

# Configuration
EXCLUDE_DIRS = {'node_modules', '.git', '__pycache__', '.venv', 'dist', 'build'}
EXCLUDE_FILES = {'.DS_Store', 'Thumbs.db'}
OUTPUT_FILE = 'project_structure.txt'

def generate_structure(path='.', prefix=''):
    lines = []
    for item in sorted(os.listdir(path)):
        if item in EXCLUDE_FILES:
            continue
        full_path = os.path.join(path, item)
        if os.path.isdir(full_path):
            if item in EXCLUDE_DIRS:
                continue
            lines.append(f"{prefix}📁 {item}/")
            lines.extend(generate_structure(full_path, prefix + '    '))
        else:
            lines.append(f"{prefix}📄 {item}")
    return lines

if __name__ == '__main__':
    print("[INFO] Generating project structure...")
    structure = generate_structure('.')
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        f.write("\n".join(structure))
    print(f"[DONE] Project structure saved to {OUTPUT_FILE}")
