
import os

file_path = r'c:\Users\luisp\Desktop\SIAE\siaesistema\src\styles\alertas.css'

with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []

# Keep lines 1-385 (indices 0-384)
# Note: Line numbers are 1-based, list indices are 0-based.
# Line 385 is index 384.
new_lines.extend(lines[:385])

# Skip lines 386-562 (indices 385-561)
# The next valid line is 563 (index 562)

# Process lines 563 to end (indices 562 to end)
for line in lines[562:]:
    # Remove 4 spaces of indentation if present
    if line.startswith('    '):
        new_lines.append(line[4:])
    else:
        new_lines.append(line)

with open(file_path, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print("Successfully fixed alertas.css")
